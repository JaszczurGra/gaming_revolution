import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Login from './Login'
import Dashboard from './Dashboard'
import GameProfile from './GameProfile'
import ChatApp from './ChatApp'
import './Login.css'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen">Loading...</div>
  if (!user) return <Navigate to="/" replace />
  return <>{children}</>
}

function Root() {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen">Loading...</div>
  return user ? <Navigate to="/dashboard" replace /> : <Login />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Root />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/game/:gameId"
          element={
            <RequireAuth>
              <GameProfile />
            </RequireAuth>
          }
        />
        <Route
          path="/game/:gameId/chat"
          element={
            <RequireAuth>
              <ChatApp />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
