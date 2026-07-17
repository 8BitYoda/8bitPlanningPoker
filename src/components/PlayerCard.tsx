import type { Player } from '../types'

interface PlayerCardProps {
  player: Player
  revealed: boolean
  isSelf: boolean
  /** Hide the "voted" indicator for this card even though a vote is in — used by
   * the host's Presenter Mode so a screen-shared view can't tell they've voted. */
  maskVoted?: boolean
}

export function PlayerCard({ player, revealed, isSelf, maskVoted = false }: PlayerCardProps) {
  const hasVoted = player.vote !== null
  const showValue = revealed && hasVoted
  const showVotedIndicator = hasVoted && !showValue && !maskVoted

  return (
    <div className={`player-card ${isSelf ? 'player-card--self' : ''}`}>
      <div className={`player-card-face ${showVotedIndicator ? 'player-card-face--voted' : ''}`}>
        {showValue ? player.vote : showVotedIndicator ? '★' : '?'}
      </div>
      <div className="player-card-name">
        {player.isHost && <span title="Host">♛ </span>}
        {player.name}
        {isSelf && ' (you)'}
      </div>
    </div>
  )
}
