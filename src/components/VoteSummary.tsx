import type { Player } from '../types'

interface VoteSummaryProps {
  players: Player[]
}

export function VoteSummary({ players }: VoteSummaryProps) {
  const votes = players.map((p) => p.vote).filter((v): v is NonNullable<typeof v> => v !== null)
  const numeric = votes.map((v) => Number(v)).filter((n) => Number.isFinite(n))

  const average = numeric.length > 0 ? numeric.reduce((a, b) => a + b, 0) / numeric.length : null

  const counts = new Map<string, number>()
  for (const v of votes) counts.set(v, (counts.get(v) ?? 0) + 1)

  const consensus = votes.length > 0 && counts.size === 1

  return (
    <div className="vote-summary">
      {consensus && <p className="vote-summary-consensus">✓ Consensus!</p>}
      {average !== null && (
        <p className="vote-summary-average">
          Average: <strong>{average.toFixed(1)}</strong>
        </p>
      )}
      <div className="vote-summary-bars">
        {[...counts.entries()].map(([v, count]) => (
          <div key={v} className="vote-summary-bar-row">
            <span className="vote-summary-bar-label">{v}</span>
            <div className="vote-summary-bar-track">
              <div
                className="vote-summary-bar-fill"
                style={{ width: `${(count / votes.length) * 100}%` }}
              />
            </div>
            <span className="vote-summary-bar-count">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
