import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { createGame, listGames } from './lib/games'
import type { Game } from './lib/games'
import Layout from './Layout'
import './Dashboard.css'

export default function Dashboard() {
  const { user } = useAuth()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [newGameName, setNewGameName] = useState('')
  const [newGameFile, setNewGameFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    listGames(user.uid)
      .then(setGames)
      .catch(() => setError('Could not load your game library.'))
      .finally(() => setLoading(false))
  }, [user])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!user || !newGameName.trim()) return
    setSaving(true)
    try {
      const game = await createGame(user.uid, newGameName.trim(), newGameFile?.name ?? '')
      setGames((prev) => [...prev, game])
      setIsCreating(false)
      setNewGameName('')
      setNewGameFile(null)
    } catch {
      setError('Could not save the new game.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard-head">
          <h1>My Library</h1>
          <button className="reset-btn" onClick={() => setIsCreating((v) => !v)}>
            + Add game
          </button>
        </div>

        {isCreating && (
          <form className="create-game-form" onSubmit={handleCreate}>
            <label>
              Game name
              <input
                type="text"
                required
                value={newGameName}
                onChange={(e) => setNewGameName(e.target.value)}
                placeholder="e.g. Catan"
              />
            </label>
            <label>
              Rulebook PDF (optional, demo only — not actually processed)
              <input type="file" accept="application/pdf" onChange={(e) => setNewGameFile(e.target.files?.[0] ?? null)} />
            </label>
            <div className="create-game-actions">
              <button type="button" className="reset-btn" onClick={() => setIsCreating(false)}>
                Cancel
              </button>
              <button type="submit" className="login-btn login-btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save game'}
              </button>
            </div>
          </form>
        )}

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <p className="hint">Loading...</p>
        ) : games.length === 0 && !isCreating ? (
          <p className="hint">No games in your library yet. Add one to get started.</p>
        ) : (
          <div className="game-grid">
            {games.map((g) => (
              <Link key={g.id} to={`/game/${g.id}`} className="game-card">
                <h3>{g.name}</h3>
                <p>{g.notes || 'No custom notes.'}</p>
                <span className="game-card-foot">{g.pdfUrl ? '📄 PDF attached' : '📚 Text rules'}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
