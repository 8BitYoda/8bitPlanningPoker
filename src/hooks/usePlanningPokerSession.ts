import { useCallback, useEffect, useRef, useState } from 'react'
import Peer, { type DataConnection } from 'peerjs'
import type {
  ClientMessage,
  ConnectionStatus,
  HostMessage,
  Player,
  RoomState,
  VoteValue,
} from '../types'
import { getClientId } from '../utils/clientId'
import { PEER_ICE_CONFIG } from '../utils/iceServers'
import { generateRoomCode, roomCodeToPeerId } from '../utils/roomCode'

const JOIN_TIMEOUT_MS = 10_000
const RECONNECT_RETRY_MS = 3_000
// A dropped connection (backgrounded tab, brief network blip) doesn't remove
// a player from the room — only a full hour of never reconnecting does.
const GRACE_PERIOD_MS = 60 * 60 * 1000

function allVoted(players: Player[]): boolean {
  const active = players.filter((p) => p.connected && !p.isSpectator)
  return active.length > 0 && active.every((p) => p.vote !== null)
}

export interface PlanningPokerSession {
  status: ConnectionStatus
  error: string | null
  state: RoomState | null
  selfId: string | null
  isHost: boolean
  hostGame: (name: string) => void
  joinGame: (name: string, code: string) => void
  castVote: (value: VoteValue | null) => void
  setSpectator: (spectating: boolean) => void
  reveal: () => void
  newRound: () => void
  setStory: (story: string) => void
  leave: () => void
}

export function usePlanningPokerSession(): PlanningPokerSession {
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<RoomState | null>(null)
  const [isHost, setIsHost] = useState(false)
  const [selfId, setSelfId] = useState<string | null>(null)

  const peerRef = useRef<Peer | null>(null)
  const hostConnRef = useRef<DataConnection | null>(null)
  const connByClientIdRef = useRef<Map<string, DataConnection>>(new Map())
  const pendingRemovalRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const stateRef = useRef<RoomState | null>(null)
  const joinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const visibilityCleanupRef = useRef<(() => void) | null>(null)
  const nameRef = useRef<string>('')

  const clearJoinTimeout = () => {
    if (joinTimeoutRef.current) {
      clearTimeout(joinTimeoutRef.current)
      joinTimeoutRef.current = null
    }
  }

  const clearReconnectTimer = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }

  const setRoomState = useCallback((next: RoomState) => {
    stateRef.current = next
    setState(next)
  }, [])

  const broadcast = useCallback((next: RoomState) => {
    const msg: HostMessage = { type: 'state', state: next }
    connByClientIdRef.current.forEach((conn) => {
      if (conn.open) conn.send(msg)
    })
  }, [])

  const hostUpdate = useCallback(
    (updater: (prev: RoomState) => RoomState) => {
      const prev = stateRef.current
      if (!prev) return
      const next = updater(prev)
      setRoomState(next)
      broadcast(next)
    },
    [broadcast, setRoomState],
  )

  const teardown = useCallback(() => {
    clearJoinTimeout()
    clearReconnectTimer()
    visibilityCleanupRef.current?.()
    visibilityCleanupRef.current = null
    pendingRemovalRef.current.forEach((timeout) => clearTimeout(timeout))
    pendingRemovalRef.current.clear()
    connByClientIdRef.current.forEach((conn) => conn.close())
    connByClientIdRef.current.clear()
    hostConnRef.current?.close()
    hostConnRef.current = null
    peerRef.current?.destroy()
    peerRef.current = null
    stateRef.current = null
  }, [])

  useEffect(() => teardown, [teardown])

  const registerHostConnection = useCallback(
    (conn: DataConnection) => {
      let clientId: string | null = null

      conn.on('data', (raw) => {
        const msg = raw as ClientMessage
        const prev = stateRef.current
        if (!prev) return

        if (msg.type === 'join') {
          clientId = msg.clientId
          connByClientIdRef.current.set(clientId, conn)
          const pendingRemoval = pendingRemovalRef.current.get(clientId)
          if (pendingRemoval) {
            clearTimeout(pendingRemoval)
            pendingRemovalRef.current.delete(clientId)
          }

          const existing = prev.players.find((p) => p.id === clientId)
          const players = existing
            ? prev.players.map((p) =>
                p.id === clientId ? { ...p, name: msg.name, connected: true } : p,
              )
            : [
                ...prev.players,
                {
                  id: clientId,
                  name: msg.name,
                  vote: null,
                  isHost: false,
                  isSpectator: false,
                  connected: true,
                },
              ]
          hostUpdate(() => ({ ...prev, players }))
          return
        }

        // Any other message from a connection that never sent 'join' is stale.
        if (!clientId) return

        if (msg.type === 'vote') {
          const voter = prev.players.find((p) => p.id === clientId)
          if (!voter || voter.isSpectator) return
          const players = prev.players.map((p) => (p.id === clientId ? { ...p, vote: msg.value } : p))
          const revealed = prev.revealed || allVoted(players)
          hostUpdate(() => ({ ...prev, players, revealed }))
          return
        }

        if (msg.type === 'rename') {
          const players = prev.players.map((p) => (p.id === clientId ? { ...p, name: msg.name } : p))
          hostUpdate(() => ({ ...prev, players }))
          return
        }

        if (msg.type === 'spectate') {
          const players = prev.players.map((p) =>
            p.id === clientId
              ? { ...p, isSpectator: msg.spectating, vote: msg.spectating ? null : p.vote }
              : p,
          )
          const revealed = prev.revealed || allVoted(players)
          hostUpdate(() => ({ ...prev, players, revealed }))
        }
      })

      let disconnectHandled = false
      const handleDisconnect = () => {
        if (disconnectHandled) return
        disconnectHandled = true
        if (!clientId) return
        if (connByClientIdRef.current.get(clientId) === conn) {
          connByClientIdRef.current.delete(clientId)
        }

        const prev = stateRef.current
        if (!prev) return
        const stillThere = prev.players.some((p) => p.id === clientId)
        if (!stillThere) return

        const players = prev.players.map((p) => (p.id === clientId ? { ...p, connected: false } : p))
        hostUpdate(() => ({ ...prev, players }))

        const droppedClientId = clientId
        const timeout = setTimeout(() => {
          pendingRemovalRef.current.delete(droppedClientId)
          const current = stateRef.current
          if (!current) return
          const remaining = current.players.filter((p) => p.id !== droppedClientId)
          hostUpdate(() => ({ ...current, players: remaining }))
        }, GRACE_PERIOD_MS)
        pendingRemovalRef.current.set(droppedClientId, timeout)
      }

      conn.on('close', handleDisconnect)
      conn.on('error', handleDisconnect)
    },
    [hostUpdate],
  )

  const hostGame = useCallback(
    (name: string) => {
      teardown()
      setError(null)
      setStatus('connecting')
      setIsHost(true)

      const code = generateRoomCode()
      const peer = new Peer(roomCodeToPeerId(code), PEER_ICE_CONFIG)
      peerRef.current = peer

      peer.on('open', (id) => {
        setSelfId(id)
        setStatus('connected')
        setRoomState({
          code,
          story: '',
          revealed: false,
          players: [
            { id, name, vote: null, isHost: true, isSpectator: false, connected: true },
          ],
        })
      })

      peer.on('connection', (conn) => {
        registerHostConnection(conn)
        conn.on('open', () => {
          if (stateRef.current) conn.send({ type: 'state', state: stateRef.current })
        })
      })

      peer.on('disconnected', () => {
        if (!peer.destroyed) peer.reconnect()
      })

      peer.on('error', (err) => {
        setStatus('error')
        setError(err.message)
      })
    },
    [registerHostConnection, setRoomState, teardown],
  )

  const joinGame = useCallback(
    (name: string, code: string) => {
      teardown()
      setError(null)
      setStatus('connecting')
      setIsHost(false)
      nameRef.current = name

      const clientId = getClientId()
      // The host keys player records by this stable clientId (not the
      // ephemeral PeerJS peer id) so a reconnect is recognized as the same
      // player — selfId must match that key, or every p.id === selfId
      // lookup for "me" (VoteDeck selection, spectate toggle, "(you)"
      // label) silently comes back empty.
      setSelfId(clientId)
      const hostId = roomCodeToPeerId(code)
      const peer = new Peer(PEER_ICE_CONFIG)
      peerRef.current = peer
      // Tracks whether we've ever gotten in, so a later drop is always
      // treated as "reconnect quietly" rather than re-litigating the code,
      // and so host-not-found/connection-blocked can never fire again once
      // we're actually in the room.
      let hasConnectedOnce = false

      // Covers the whole initial handshake (broker connect + peer connect +
      // data channel open), not just the peer.connect() step — a broker
      // that's unreachable from the start should still resolve to a clear
      // status instead of leaving the UI stuck on "Connecting…" forever.
      clearJoinTimeout()
      joinTimeoutRef.current = setTimeout(() => {
        setStatus((s) => (s === 'connecting' ? 'connection-blocked' : s))
      }, JOIN_TIMEOUT_MS)

      const scheduleRetry = () => {
        if (peerRef.current !== peer || peer.destroyed) return
        clearReconnectTimer()
        reconnectTimerRef.current = setTimeout(() => {
          reconnectTimerRef.current = null
          if (peerRef.current === peer && !peer.destroyed) connectToHost()
        }, RECONNECT_RETRY_MS)
      }

      const connectToHost = () => {
        const conn = peer.connect(hostId, { reliable: true })
        hostConnRef.current = conn

        conn.on('open', () => {
          clearJoinTimeout()
          hasConnectedOnce = true
          conn.send({ type: 'join', name: nameRef.current, clientId } satisfies ClientMessage)
          setStatus('connected')
        })

        conn.on('data', (raw) => {
          const msg = raw as HostMessage
          if (msg.type === 'state') setRoomState(msg.state)
        })

        const handleDrop = () => {
          if (peerRef.current !== peer || peer.destroyed || !hasConnectedOnce) return
          setStatus('reconnecting')
          scheduleRetry()
        }

        conn.on('close', handleDrop)
        conn.on('error', handleDrop)
      }

      peer.on('open', () => {
        connectToHost()
      })

      peer.on('disconnected', () => {
        if (!peer.destroyed) peer.reconnect()
      })

      peer.on('error', (err) => {
        if (err.type === 'peer-unavailable') {
          // The broker positively confirmed no such room — this is the
          // only case that should ever say "no room with that code".
          if (hasConnectedOnce) {
            setStatus('reconnecting')
            scheduleRetry()
          } else {
            clearJoinTimeout()
            setStatus((s) => (s === 'connecting' ? 'host-not-found' : s))
          }
          return
        }
        if (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error') {
          // These all mean "couldn't reach (or lost) the signaling server"
          // rather than anything about the room itself, and can fire at the
          // Peer level without the DataConnection ever emitting its own
          // close/error — so the retry loop is driven from here too once
          // we're in. Before the first successful connect, deliberately
          // don't jump to connection-blocked immediately — this can be a
          // transient startup blip that resolves on its own, and the
          // top-level join timeout above is the single source of truth for
          // "genuinely couldn't connect in time".
          if (hasConnectedOnce) {
            setStatus('reconnecting')
            scheduleRetry()
          }
          return
        }
        // Anything else (invalid-id, browser-incompatible, ssl-unavailable,
        // ...) is an environment/config problem, not a network one — "try a
        // different network" would be actively wrong advice here.
        clearJoinTimeout()
        setStatus('error')
        setError(err.message)
      })

      const handleVisibility = () => {
        if (document.visibilityState !== 'visible') return
        if (peerRef.current !== peer || peer.destroyed) return
        if (hostConnRef.current?.open) return
        if (!hasConnectedOnce) return
        clearReconnectTimer()
        connectToHost()
      }
      document.addEventListener('visibilitychange', handleVisibility)
      visibilityCleanupRef.current = () =>
        document.removeEventListener('visibilitychange', handleVisibility)
    },
    [setRoomState, teardown],
  )

  const castVote = useCallback(
    (value: VoteValue | null) => {
      if (isHost) {
        const prev = stateRef.current
        const id = selfId
        if (!prev || !id) return
        const self = prev.players.find((p) => p.id === id)
        if (!self || self.isSpectator) return
        const players = prev.players.map((p) => (p.id === id ? { ...p, vote: value } : p))
        const revealed = prev.revealed || allVoted(players)
        hostUpdate(() => ({ ...prev, players, revealed }))
      } else {
        hostConnRef.current?.send({ type: 'vote', value } satisfies ClientMessage)
      }
    },
    [hostUpdate, isHost, selfId],
  )

  const setSpectator = useCallback(
    (spectating: boolean) => {
      if (isHost) {
        const prev = stateRef.current
        const id = selfId
        if (!prev || !id) return
        const players = prev.players.map((p) =>
          p.id === id ? { ...p, isSpectator: spectating, vote: spectating ? null : p.vote } : p,
        )
        const revealed = prev.revealed || allVoted(players)
        hostUpdate(() => ({ ...prev, players, revealed }))
      } else {
        hostConnRef.current?.send({ type: 'spectate', spectating } satisfies ClientMessage)
      }
    },
    [hostUpdate, isHost, selfId],
  )

  const reveal = useCallback(() => {
    if (!isHost) return
    hostUpdate((prev) => ({ ...prev, revealed: true }))
  }, [hostUpdate, isHost])

  const newRound = useCallback(() => {
    if (!isHost) return
    hostUpdate((prev) => ({
      ...prev,
      revealed: false,
      players: prev.players.map((p) => ({ ...p, vote: null })),
    }))
  }, [hostUpdate, isHost])

  const setStory = useCallback(
    (story: string) => {
      if (!isHost) return
      hostUpdate((prev) => ({ ...prev, story }))
    },
    [hostUpdate, isHost],
  )

  const leave = useCallback(() => {
    teardown()
    setStatus('idle')
    setState(null)
    setIsHost(false)
    setSelfId(null)
    setError(null)
  }, [teardown])

  return {
    status,
    error,
    state,
    selfId,
    isHost,
    hostGame,
    joinGame,
    castVote,
    setSpectator,
    reveal,
    newRound,
    setStory,
    leave,
  }
}
