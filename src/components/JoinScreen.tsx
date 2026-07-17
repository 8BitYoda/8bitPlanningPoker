import { useState, type FormEvent } from 'react'
import type { ConnectionStatus } from '../types'

interface JoinScreenProps {
  status: ConnectionStatus
  error: string | null
  /** A room code pulled from an invite link (`?code=`), pre-filling Join. */
  initialCode?: string | null
  onHost: (name: string) => void
  onJoin: (name: string, code: string) => void
}

const NAME_KEY = '8bitpp-name'

export function JoinScreen({ status, error, initialCode, onHost, onJoin }: JoinScreenProps) {
  const [mode, setMode] = useState<'host' | 'join'>(initialCode ? 'join' : 'host')
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) ?? '')
  const [code, setCode] = useState(initialCode ?? '')

  const busy = status === 'connecting'
  const trimmedName = name.trim()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!trimmedName || busy) return
    localStorage.setItem(NAME_KEY, trimmedName)
    if (mode === 'host') {
      onHost(trimmedName)
    } else {
      if (!code.trim()) return
      onJoin(trimmedName, code)
    }
  }

  return (
    <div className="panel join-screen">
      <div className="tab-row" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'host'}
          className={`tab-btn ${mode === 'host' ? 'tab-btn--active' : ''}`}
          onClick={() => setMode('host')}
        >
          Host Game
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'join'}
          className={`tab-btn ${mode === 'join' ? 'tab-btn--active' : ''}`}
          onClick={() => setMode('join')}
        >
          Join Game
        </button>
      </div>

      <form className="join-form" onSubmit={submit}>
        <label className="field">
          <span>Your Name</span>
          <input
            className="pixel-input"
            value={name}
            maxLength={20}
            onChange={(e) => setName(e.target.value)}
            placeholder="PLAYER 1"
            autoFocus
          />
        </label>

        {mode === 'join' && (
          <label className="field">
            <span>Room Code</span>
            <input
              className="pixel-input pixel-input--code"
              value={code}
              maxLength={4}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCD"
            />
          </label>
        )}

        <button
          type="submit"
          className="pixel-btn pixel-btn--primary"
          disabled={busy || !trimmedName || (mode === 'join' && !code.trim())}
        >
          {busy ? 'Connecting…' : mode === 'host' ? 'Start Room' : 'Join Room'}
        </button>

        {status === 'host-not-found' && (
          <p className="status-msg status-msg--error">
            No room found with that code. Double-check it and try again.
          </p>
        )}
        {status === 'error' && (
          <p className="status-msg status-msg--error">{error ?? 'Something went wrong.'}</p>
        )}
      </form>

      <p className="join-hint">
        Hosting creates a room code others can use to connect directly to you &mdash;
        no backend server involved.
      </p>
    </div>
  )
}
