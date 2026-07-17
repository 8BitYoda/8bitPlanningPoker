import { useState } from 'react'
import type { PlanningPokerSession } from '../hooks/usePlanningPokerSession'
import { PlayerCard } from './PlayerCard'
import { VoteDeck } from './VoteDeck'
import { VoteSummary } from './VoteSummary'

interface RoomProps {
  session: PlanningPokerSession
}

export function Room({ session }: RoomProps) {
  const {
    state,
    isHost,
    selfId,
    status,
    castVote,
    setSpectator,
    reveal,
    newRound,
    setStory,
    leave,
  } = session
  const [copied, setCopied] = useState(false)
  const [presenterMode, setPresenterMode] = useState(false)

  if (!state) return null

  const self = state.players.find((p) => p.id === selfId) ?? null
  const activeVoters = state.players.filter((p) => !p.isSpectator)
  const votesCast = activeVoters.filter((p) => p.vote !== null).length

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(state.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard access can fail (permissions, insecure context) — non-critical.
    }
  }

  return (
    <div className="room">
      {(status === 'disconnected' || status === 'error') && (
        <div className="banner banner--warning">
          {status === 'disconnected'
            ? 'Connection to the host was lost.'
            : session.error ?? 'Connection error.'}
          <button className="pixel-btn pixel-btn--small" onClick={leave}>
            Back to Menu
          </button>
        </div>
      )}

      <div className="room-header">
        <div className="room-code" onClick={copyCode} title="Click to copy">
          <span className="room-code-label">ROOM</span>
          <span className="room-code-value">{state.code}</span>
          <span className="room-code-copy">{copied ? 'copied!' : 'copy'}</span>
        </div>
        <button className="pixel-btn pixel-btn--small" onClick={leave}>
          Leave
        </button>
      </div>

      <div className="controls-bar">
        <button
          type="button"
          className={`pixel-btn pixel-btn--small ${self?.isSpectator ? 'toggle-btn--active' : ''}`}
          onClick={() => setSpectator(!self?.isSpectator)}
          title="Sit this round out — you won't vote and won't block Reveal"
        >
          👀 {self?.isSpectator ? 'Spectating' : 'Spectate'}
        </button>

        {isHost && (
          <button
            type="button"
            className={`pixel-btn pixel-btn--small ${presenterMode ? 'toggle-btn--active' : ''}`}
            onClick={() => setPresenterMode((v) => !v)}
            title="Hides your own vote card so it's safe to screen-share this window"
          >
            🖥️ Presenter Mode: {presenterMode ? 'ON' : 'OFF'}
          </button>
        )}
      </div>

      {self?.isSpectator && (
        <p className="controls-hint">👀 spectating — you won't vote this round</p>
      )}
      {isHost && presenterMode && (
        <p className="controls-hint">🔒 your vote is hidden on this screen</p>
      )}

      <label className="field story-field">
        <span>Story / Ticket</span>
        {isHost ? (
          <input
            className="pixel-input"
            value={state.story}
            maxLength={80}
            placeholder="e.g. PROJ-123 Add login page"
            onChange={(e) => setStory(e.target.value)}
          />
        ) : (
          <div className="story-readonly">{state.story || '(no story set yet)'}</div>
        )}
      </label>

      <div className="player-grid">
        {state.players.map((p) => (
          <PlayerCard key={p.id} player={p} revealed={state.revealed} isSelf={p.id === selfId} />
        ))}
      </div>

      {state.revealed && <VoteSummary players={state.players} />}

      {self?.isSpectator ? (
        <p className="spectator-notice">👀 You're spectating — sit back and watch this round.</p>
      ) : (
        <VoteDeck
          value={self?.vote ?? null}
          onVote={castVote}
          hideSelection={isHost && presenterMode}
        />
      )}

      {isHost && (
        <div className="host-controls">
          <button
            className="pixel-btn pixel-btn--primary"
            disabled={state.revealed || votesCast === 0}
            onClick={reveal}
          >
            Reveal Votes
          </button>
          <button className="pixel-btn" onClick={newRound}>
            New Round
          </button>
        </div>
      )}
    </div>
  )
}
