import { VOTE_VALUES, type VoteValue } from '../types'

interface VoteDeckProps {
  value: VoteValue | null
  onVote: (value: VoteValue | null) => void
  /** Suppress the selected-card highlight — used by the host's Presenter Mode
   * so a screen-shared view can't tell which card they picked. */
  hideSelection?: boolean
}

export function VoteDeck({ value, onVote, hideSelection = false }: VoteDeckProps) {
  return (
    <div className="vote-deck">
      {VOTE_VALUES.map((v) => (
        <button
          key={v}
          className={`vote-card ${!hideSelection && value === v ? 'vote-card--selected' : ''}`}
          onClick={() => onVote(value === v ? null : v)}
        >
          {v}
        </button>
      ))}
    </div>
  )
}
