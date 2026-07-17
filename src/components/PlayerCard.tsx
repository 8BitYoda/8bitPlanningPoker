import type { Player } from '../types'

interface PlayerCardProps {
  player: Player
  revealed: boolean
  isSelf: boolean
}

export function PlayerCard({ player, revealed, isSelf }: PlayerCardProps) {
  const hasVoted = player.vote !== null
  const showValue = revealed && hasVoted

  return (
    <div className={`player-card ${isSelf ? 'player-card--self' : ''}`}>
      <div className={`player-card-face ${hasVoted ? 'player-card-face--voted' : ''}`}>
        {showValue ? player.vote : hasVoted ? '★' : '?'}
      </div>
      <div className="player-card-name">
        {player.isHost && <span title="Host">♛ </span>}
        {player.name}
        {isSelf && ' (you)'}
      </div>
    </div>
  )
}
