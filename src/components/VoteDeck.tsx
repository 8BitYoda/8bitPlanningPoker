import { useEffect } from 'react'
import { VOTE_VALUES, type VoteValue } from '../types'

interface VoteDeckProps {
  value: VoteValue | null
  onVote: (value: VoteValue | null) => void
  /** Suppress the selected-card highlight — used by the host's Presenter Mode
   * so a screen-shared view can't tell which card they picked. */
  hideSelection?: boolean
}

// One shortcut key per card, in deck order — lets a host vote without ever
// moving the mouse toward a card while screen-sharing.
const VOTE_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'q', 'w', 'e']

export function VoteDeck({ value, onVote, hideSelection = false }: VoteDeckProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return

      const index = VOTE_KEYS.indexOf(e.key.toLowerCase())
      if (index === -1) return
      const v = VOTE_VALUES[index]
      onVote(value === v ? null : v)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [value, onVote])

  return (
    <div className="vote-deck">
      {VOTE_VALUES.map((v, i) => (
        <button
          key={v}
          className={`vote-card ${!hideSelection && value === v ? 'vote-card--selected' : ''}`}
          onClick={() => onVote(value === v ? null : v)}
          title={`Press "${VOTE_KEYS[i]}" to vote ${v}`}
        >
          {v}
          <span className="vote-card-key">{VOTE_KEYS[i]}</span>
        </button>
      ))}
    </div>
  )
}
