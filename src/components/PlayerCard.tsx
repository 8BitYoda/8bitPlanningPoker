import type { Player } from '../types'
import { CoffeeIcon } from './CoffeeIcon'

interface PlayerCardProps {
  player: Player
  revealed: boolean
  isSelf: boolean
}

export function PlayerCard({ player, revealed, isSelf }: PlayerCardProps) {
  const hasVoted = player.vote !== null
  const showValue = revealed && hasVoted

  return (
    <div
      className={`player-card ${isSelf ? 'player-card--self' : ''} ${
        player.connected ? '' : 'player-card--away'
      }`}
    >
      <div
        className={`player-card-face ${
          player.isSpectator
            ? 'player-card-face--spectator'
            : hasVoted
              ? 'player-card-face--voted'
              : ''
        }`}
      >
        {player.isSpectator ? (
          '👀'
        ) : showValue ? (
          player.vote === '☕' ? (
            <CoffeeIcon />
          ) : (
            player.vote
          )
        ) : hasVoted ? (
          '★'
        ) : (
          '?'
        )}
      </div>
      <div className="player-card-name">
        {player.isHost && <span title="Host">♛ </span>}
        {player.name}
        {isSelf && ' (you)'}
        {!player.connected && ' (away)'}
      </div>
    </div>
  )
}
