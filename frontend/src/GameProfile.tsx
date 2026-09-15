import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getGame, updateGameNotes } from './lib/games'
import type { Game } from './lib/games'
import Layout from './Layout'
import './GameProfile.css'

export default function GameProfile() {
  const { gameId } = useParams()
  const [game, setGame] = useState<Game | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!gameId) return
    getGame(gameId).then((g) => {
      setGame(g)
      setNotes(g?.notes ?? '')
    })
  }, [gameId])

  async function handleSave() {
    if (!gameId) return
    setSaving(true)
    setSaved(false)
    try {
      await updateGameNotes(gameId, notes)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (!game) {
    return (
      <Layout>
        <p className="hint">Loading game profile...</p>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="game-profile">
        <Link to="/dashboard" className="back-link">
          &larr; Back to library
        </Link>

        <h1>{game.name}</h1>
        <p className="hint">Added {new Date(game.createdAt).toLocaleDateString()}</p>

        <Link to={`/game/${game.id}/chat`} className="open-assistant-btn">
          💬 Open Rules Assistant
        </Link>

        <section className="game-profile-section">
          <h2>Reference material</h2>
          {game.pdfUrl ? (
            <p className="hint">
              📄 {game.pdfUrl}{' '}
              <span className="mock-note">(demo only — not sent to the assistant; it uses the built-in Catan rules corpus)</span>
            </p>
          ) : (
            <p className="hint">No PDF attached. The assistant relies on its built-in Catan rules corpus and your notes below.</p>
          )}
        </section>

        <section className="game-profile-section">
          <h2>Custom rules &amp; notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add house rules, clarifications, or setup notes here."
            rows={6}
          />
          <button className="login-btn login-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save notes'}
          </button>
        </section>
      </div>
    </Layout>
  )
}
