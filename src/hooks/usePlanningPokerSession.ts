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
import { generateRoomCode, roomCodeToPeerId } from '../utils/roomCode'

const JOIN_TIMEOUT_MS = 10_000

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
  const peerConnsRef = useRef<Map<string, DataConnection>>(new Map())
  const stateRef = useRef<RoomState | null>(null)
  const joinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearJoinTimeout = () => {
    if (joinTimeoutRef.current) {
      clearTimeout(joinTimeoutRef.current)
      joinTimeoutRef.current = null
    }
  }

  const setRoomState = useCallback((next: RoomState) => {
    stateRef.current = next
    setState(next)
  }, [])

  const broadcast = useCallback((next: RoomState) => {
    const msg: HostMessage = { type: 'state', state: next }
    peerConnsRef.current.forEach((conn) => {
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
    peerConnsRef.current.forEach((conn) => conn.close())
    peerConnsRef.current.clear()
    hostConnRef.current?.close()
    hostConnRef.current = null
    peerRef.current?.destroy()
    peerRef.current = null
    stateRef.current = null
  }, [])

  useEffect(() => teardown, [teardown])

  const registerHostConnection = useCallback(
    (conn: DataConnection) => {
      conn.on('data', (raw) => {
        const msg = raw as ClientMessage
        const prev = stateRef.current
        if (!prev) return

        if (msg.type === 'join') {
          const existing = prev.players.find((p) => p.id === conn.peer)
          const players = existing
            ? prev.players.map((p) =>
                p.id === conn.peer ? { ...p, name: msg.name, connected: true } : p,
              )
            : [
                ...prev.players,
                {
                  id: conn.peer,
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

        if (msg.type === 'vote') {
          const voter = prev.players.find((p) => p.id === conn.peer)
          if (!voter || voter.isSpectator) return
          const players = prev.players.map((p) =>
            p.id === conn.peer ? { ...p, vote: msg.value } : p,
          )
          const revealed = prev.revealed || allVoted(players)
          hostUpdate(() => ({ ...prev, players, revealed }))
          return
        }

        if (msg.type === 'rename') {
          const players = prev.players.map((p) =>
            p.id === conn.peer ? { ...p, name: msg.name } : p,
          )
          hostUpdate(() => ({ ...prev, players }))
          return
        }

        if (msg.type === 'spectate') {
          const players = prev.players.map((p) =>
            p.id === conn.peer
              ? { ...p, isSpectator: msg.spectating, vote: msg.spectating ? null : p.vote }
              : p,
          )
          const revealed = prev.revealed || allVoted(players)
          hostUpdate(() => ({ ...prev, players, revealed }))
        }
      })

      conn.on('close', () => {
        peerConnsRef.current.delete(conn.peer)
        const prev = stateRef.current
        if (!prev) return
        const players = prev.players.filter((p) => p.id !== conn.peer)
        hostUpdate(() => ({ ...prev, players }))
      })

      conn.on('error', () => {
        peerConnsRef.current.delete(conn.peer)
      })
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
      const peer = new Peer(roomCodeToPeerId(code))
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
        peerConnsRef.current.set(conn.peer, conn)
        registerHostConnection(conn)
        conn.on('open', () => {
          if (stateRef.current) conn.send({ type: 'state', state: stateRef.current })
        })
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

      const peer = new Peer()
      peerRef.current = peer

      peer.on('open', (id) => {
        setSelfId(id)
        const conn = peer.connect(roomCodeToPeerId(code), { reliable: true })
        hostConnRef.current = conn

        joinTimeoutRef.current = setTimeout(() => {
          setStatus((s) => (s === 'connecting' ? 'host-not-found' : s))
        }, JOIN_TIMEOUT_MS)

        conn.on('open', () => {
          clearJoinTimeout()
          conn.send({ type: 'join', name } satisfies ClientMessage)
          setStatus('connected')
        })

        conn.on('data', (raw) => {
          const msg = raw as HostMessage
          if (msg.type === 'state') setRoomState(msg.state)
        })

        conn.on('close', () => {
          setStatus('disconnected')
        })

        conn.on('error', () => {
          setStatus('error')
          setError('Lost connection to the host.')
        })
      })

      peer.on('error', (err) => {
        clearJoinTimeout()
        if (err.type === 'peer-unavailable') {
          setStatus('host-not-found')
        } else {
          setStatus('error')
          setError(err.message)
        }
      })
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
