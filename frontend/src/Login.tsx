import { useAuth } from './hooks/useAuth'
import { useTheme } from './hooks/useTheme'
import './Login.css'

export default function Login() {
  const { signInAnon, signInGoogle } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="login-screen">
      <button className="theme-toggle-btn login-theme-toggle" onClick={toggleTheme} title="Toggle light/dark theme">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <div className="login-card">
        <div className="login-badge">🎲</div>
        <h1>Board Game Assistant</h1>
        <p className="login-tagline">
          Upload a photo of your board, ask questions, and get live tactical advice from an AI
          that watches the game unfold with you.
        </p>
        <div className="login-actions">
          <button className="login-btn login-btn-primary" onClick={signInAnon}>
            Try now for free
          </button>
          <button className="login-btn login-btn-secondary" onClick={signInGoogle}>
            Sign in with Google
          </button>
        </div>
        <p className="login-hint">You can start instantly as a guest and sign in with Google later.</p>
      </div>
    </div>
  )
}
