export const VOTE_VALUES = [
  '0',
  '1',
  '2',
  '3',
  '5',
  '8',
  '13',
  '21',
  '34',
  '55',
  '89',
  '?',
  '☕',
] as const

export type VoteValue = (typeof VOTE_VALUES)[number]

export interface Player {
  id: string
  name: string
  vote: VoteValue | null
  isHost: boolean
  connected: boolean
}

export interface RoomState {
  code: string
  story: string
  revealed: boolean
  players: Player[]
}

export type ClientMessage =
  | { type: 'join'; name: string }
  | { type: 'vote'; value: VoteValue | null }
  | { type: 'rename'; name: string }

export type HostMessage = { type: 'state'; state: RoomState }

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'host-not-found'
  | 'disconnected'
  | 'error'
