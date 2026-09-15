import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useTheme } from './hooks/useTheme'
import './Layout.css'

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <div className="layout-page">
      <header className="layout-header">
        <Link to="/dashboard" className="layout-brand">
          🎲 Board Game Assistant
        </Link>
        <div className="layout-header-right">
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle light/dark theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <span className="user-chip">{user?.isAnonymous ? 'Guest' : user?.email}</span>
          <button className="reset-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>
      <main className="layout-main">{children}</main>
    </div>
  )
}
