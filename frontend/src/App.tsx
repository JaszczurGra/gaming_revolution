import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, KeyboardEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

// Must match rag.py's BOARD_STATE_START / BOARD_STATE_END exactly.
const BOARD_STATE_RE = /<!--\s*BOARD_STATE_START\s*-->([\s\S]*?)<!--\s*BOARD_STATE_END\s*-->/

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
  photoCount: number
}

interface ParsedMessage extends ChatMessage {
  display: string
  board: string | null
}

interface HistoryResponse {
  messages: ChatMessage[]
  photosUploaded: number
}

function splitBoardState(text: string): { display: string; board: string | null } {
  const match = text.match(BOARD_STATE_RE)
  if (!match || match.index === undefined) return { display: text, board: null }
  const board = match[1].trim()
  const display = (text.slice(0, match.index) + text.slice(match.index + match[0].length)).trim()
  return { display, board }
}

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [localPreviews, setLocalPreviews] = useState<Record<number, string[]>>({})
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [loadingHistory, setLoadingHistory] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/history`)
      .then((res) => res.json())
      .then((data: HistoryResponse) => setMessages(data.messages))
      .catch(() => setError('Could not reach the backend. Is it running?'))
      .finally(() => setLoadingHistory(false))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  useEffect(() => {
    // Revoke object URLs on unmount to avoid leaking memory.
    return () => {
      Object.values(localPreviews)
        .flat()
        .forEach((url) => URL.revokeObjectURL(url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const parsedMessages = useMemo<ParsedMessage[]>(
    () =>
      messages.map((m) =>
        m.role === 'assistant'
          ? { ...m, ...splitBoardState(m.text) }
          : { ...m, display: m.text, board: null },
      ),
    [messages],
  )

  const boardState = useMemo(() => {
    for (let i = parsedMessages.length - 1; i >= 0; i--) {
      if (parsedMessages[i].board) return parsedMessages[i].board
    }
    return null
  }, [parsedMessages])

  function addFiles(fileList: FileList) {
    const images = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
    setPendingFiles((prev) => [...prev, ...images])
  }

  function removePendingFile(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function send() {
    const trimmed = text.trim()
    if (!trimmed && pendingFiles.length === 0) return

    const insertedAtIndex = messages.length
    const filesForThisTurn = pendingFiles
    const form = new FormData()
    form.append('text', trimmed)
    filesForThisTurn.forEach((f) => form.append('files', f))

    setSending(true)
    setError('')
    setText('')
    setPendingFiles([])

    try {
      const res = await fetch(`${API_BASE}/api/turn`, { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Request failed')

      if (filesForThisTurn.length) {
        const urls = filesForThisTurn.map((f) => URL.createObjectURL(f))
        setLocalPreviews((prev) => ({ ...prev, [insertedAtIndex]: urls }))
      }
      setMessages(data.messages)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
      // Give the user their draft back so nothing is lost.
      setText(trimmed)
      setPendingFiles(filesForThisTurn)
    } finally {
      setSending(false)
    }
  }

  async function resetGame() {
    if (!confirm('Start a new game? This clears the current chat.')) return
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/reset`, { method: 'POST' })
      const data: HistoryResponse = await res.json()
      setMessages(data.messages)
      setLocalPreviews({})
    } catch {
      setError('Could not reset the game.')
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function handleDrop(e: DragEvent<HTMLElement>) {
    e.preventDefault()
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Board Game Assistant</h1>
        <button className="reset-btn" onClick={resetGame} title="Start a new game">
          New game
        </button>
      </header>

      <div className="layout">
        <main className="chat" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
          {loadingHistory && <p className="hint">Loading...</p>}
          {!loadingHistory && messages.length === 0 && (
            <p className="hint">
              Upload a photo of the board or your hand, or just start typing, to begin.
            </p>
          )}

          {parsedMessages.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              <div className="bubble-role">{m.role === 'user' ? 'You' : 'Assistant'}</div>
              {localPreviews[i] && (
                <div className="thumbs">
                  {localPreviews[i].map((url, j) => (
                    <img key={j} src={url} alt={`upload ${j + 1}`} />
                  ))}
                </div>
              )}
              {!localPreviews[i] && m.photoCount > 0 && (
                <div className="photo-chip">
                  📷 {m.photoCount} photo{m.photoCount > 1 ? 's' : ''}
                </div>
              )}
              {m.role === 'assistant' && m.board && (
                <div className="board-chip">🗺️ Board updated — see panel</div>
              )}
              {m.display && (
                <div className="bubble-text">
                  {m.role === 'assistant' ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.display}</ReactMarkdown>
                  ) : (
                    m.display
                  )}
                </div>
              )}
            </div>
          ))}

          {sending && (
            <div className="bubble assistant pending">
              <div className="bubble-role">Assistant</div>
              <div className="bubble-text typing">thinking…</div>
            </div>
          )}
          <div ref={bottomRef} />
        </main>

        <aside className="board-panel">
          <h2>Current board state</h2>
          {boardState ? (
            <div className="board-panel-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{boardState}</ReactMarkdown>
            </div>
          ) : (
            <p className="hint">
              Nothing yet — upload a photo of the board and the assistant's read of it will show
              up here, kept up to date every turn.
            </p>
          )}
        </aside>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {pendingFiles.length > 0 && (
        <div className="pending-strip">
          {pendingFiles.map((f, i) => (
            <div className="pending-thumb" key={i}>
              <img src={URL.createObjectURL(f)} alt={f.name} />
              <button onClick={() => removePendingFile(i)} aria-label="Remove photo">
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <footer className="composer">
        <button
          className="attach-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Attach photo(s)"
          disabled={sending}
        >
          📷
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            if (e.target.files) addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <textarea
          rows={1}
          placeholder="Ask a question, describe a move, or attach a photo..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
        />
        <button className="send-btn" onClick={send} disabled={sending}>
          Send
        </button>
      </footer>
    </div>
  )
}
