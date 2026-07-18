import { useEffect, useState } from 'react'
import { usePlanningPokerSession } from './hooks/usePlanningPokerSession'
import { JoinScreen } from './components/JoinScreen'
import { Room } from './components/Room'
import { clearCodeFromUrl, getCodeFromUrl } from './utils/roomCode'

export default function App() {
  const session = usePlanningPokerSession()
  const [inviteCode] = useState(getCodeFromUrl)

  useEffect(() => {
    if (inviteCode) clearCodeFromUrl()
  }, [inviteCode])

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">8-BIT PLANNING POKER</h1>
      </header>
      <main className="app-main">
        {session.state ? (
          <Room session={session} />
        ) : (
          <JoinScreen
            status={session.status}
            error={session.error}
            initialCode={inviteCode}
            onHost={session.hostGame}
            onJoin={session.joinGame}
          />
        )}
      </main>
      <footer className="app-footer">
        <p>No servers, no accounts &mdash; just peer-to-peer pixels.</p>
      </footer>
    </div>
  )
}
