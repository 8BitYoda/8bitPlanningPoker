import { VOTE_VALUES, type VoteValue } from '../types'

interface VoteDeckProps {
  value: VoteValue | null
  onVote: (value: VoteValue | null) => void
}

export function VoteDeck({ value, onVote }: VoteDeckProps) {
  return (
    <div className="vote-deck">
      {VOTE_VALUES.map((v) => (
        <button
          key={v}
          className={`vote-card ${value === v ? 'vote-card--selected' : ''}`}
          onClick={() => onVote(value === v ? null : v)}
        >
          {v}
        </button>
      ))}
    </div>
  )
}
