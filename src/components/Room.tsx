import { useState } from 'react'
import type { PlanningPokerSession } from '../hooks/usePlanningPokerSession'
import { buildInviteLink } from '../utils/roomCode'
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
      await navigator.clipboard.writeText(buildInviteLink(state.code))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard access can fail (permissions, insecure context) — non-critical.
    }
  }

  return (
    <div className="room">
      {status === 'reconnecting' && (
        <div className="banner banner--info">🔄 Reconnecting…</div>
      )}

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
        <div className="room-code" onClick={copyCode} title="Click to copy an invite link">
          <span className="room-code-label">ROOM</span>
          <span className="room-code-value">{state.code}</span>
          <span className="room-code-copy" aria-hidden="true">
            {copied ? (
              <svg viewBox="0 0 16 16" width="14" height="14" shapeRendering="crispEdges">
                <path d="M3 8 L6.5 12 L13 3" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" width="14" height="14" shapeRendering="crispEdges">
                <rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <rect
                  x="6"
                  y="6"
                  width="8"
                  height="8"
                  fill="var(--bg-panel)"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            )}
          </span>
        </div>
        <div className="room-header-actions">
          <button
            type="button"
            className={`pixel-btn pixel-btn--small pixel-btn--icon ${
              self?.isSpectator ? 'toggle-btn--active' : ''
            }`}
            onClick={() => setSpectator(!self?.isSpectator)}
            title={
              self?.isSpectator
                ? "Spectating — click to rejoin voting"
                : "Spectate — sit this round out, won't vote or block Reveal"
            }
            aria-label="Toggle spectate mode"
          >
            👀
          </button>

          {isHost && (
            <button
              type="button"
              className={`pixel-btn pixel-btn--small pixel-btn--icon ${
                presenterMode ? 'toggle-btn--active' : ''
              }`}
              onClick={() => setPresenterMode((v) => !v)}
              title={
                presenterMode
                  ? 'Presenter Mode ON — your vote is hidden on this screen'
                  : "Presenter Mode — hide your vote so it's safe to screen-share"
              }
              aria-label="Toggle presenter mode"
            >
              🖥️
            </button>
          )}

          <button className="pixel-btn pixel-btn--small" onClick={leave}>
            Leave
          </button>
        </div>
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
