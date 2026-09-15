import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, KeyboardEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BoardDiagram, parseBoardState } from './boardDiagram'
import './App.css'

// Default to the backend on the same host the page was loaded from (port 8000), so this also
// works when the page is opened from another device, e.g. over Tailscale, where "localhost"
// would otherwise mean that other device rather than this one. Override with VITE_API_BASE.
const API_BASE = import.meta.env.VITE_API_BASE || `${window.location.protocol}//${window.location.hostname}:8000`

// Must match rag.py's BOARD_STATE_START / BOARD_STATE_END and OPTIONS_START / OPTIONS_END exactly.
const BOARD_STATE_RE = /<!--\s*BOARD_STATE_START\s*-->([\s\S]*?)<!--\s*BOARD_STATE_END\s*-->/
const OPTIONS_RE = /<!--\s*OPTIONS_START\s*-->([\s\S]*?)<!--\s*OPTIONS_END\s*-->/

const START_PROMPTS = ['Summarize the rules', 'Step by step setup walkthrough']

const QUICK_PROMPTS = [
  "What's next?",
  'What are my possibilities?',
  'Best move for Red?',
  'Best move for Blue?',
]

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
  photoCount: number
}

interface ParsedMessage extends ChatMessage {
  display: string
  board: string | null
  options: string[] | null
}

interface HistoryResponse {
  messages: ChatMessage[]
  photosUploaded: number
}

const MOBILE_QUERY = '(max-width: 768px)'

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches)
  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])
  return isMobile
}

function extractAppBlocks(text: string): { display: string; board: string | null; options: string[] | null } {
  let display = text
  let board: string | null = null
  let options: string[] | null = null

  const boardMatch = display.match(BOARD_STATE_RE)
  if (boardMatch && boardMatch.index !== undefined) {
    board = boardMatch[1].trim()
    display = display.slice(0, boardMatch.index) + display.slice(boardMatch.index + boardMatch[0].length)
  }

  const optionsMatch = display.match(OPTIONS_RE)
  if (optionsMatch && optionsMatch.index !== undefined) {
    try {
      const parsed = JSON.parse(optionsMatch[1].trim())
      if (Array.isArray(parsed) && parsed.every((o) => typeof o === 'string')) options = parsed
    } catch {
      options = null
    }
    display = display.slice(0, optionsMatch.index) + display.slice(optionsMatch.index + optionsMatch[0].length)
  }

  return { display: display.trim(), board, options }
}

export default function App() {
  const isMobile = useIsMobile()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [localPreviews, setLocalPreviews] = useState<Record<number, string[]>>({})
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [loadingHistory, setLoadingHistory] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const sendingRef = useRef(sending)

  useEffect(() => {
    sendingRef.current = sending
  }, [sending])

  useEffect(() => {
    fetch(`${API_BASE}/api/history`)
      .then((res) => res.json())
      .then((data: HistoryResponse) => setMessages(data.messages))
      .catch(() => setError('Could not reach the backend. Is it running?'))
      .finally(() => setLoadingHistory(false))
  }, [])

  // The game session lives on the backend, shared by every tab/device that opens this app (e.g.
  // your phone over Tailscale while a laptop is also open) — poll so a turn sent from one shows
  // up on the other without a manual refresh. Skip while this tab is mid-send (its own postTurn
  // response already updates state) or hidden, and never treat a failed poll as a real error.
  useEffect(() => {
    const interval = setInterval(() => {
      if (sendingRef.current || document.visibilityState !== 'visible') return
      fetch(`${API_BASE}/api/history`)
        .then((res) => res.json())
        .then((data: HistoryResponse) => {
          setMessages((prev) => (JSON.stringify(prev) === JSON.stringify(data.messages) ? prev : data.messages))
        })
        .catch(() => {})
    }, 4000)
    return () => clearInterval(interval)
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
          ? { ...m, ...extractAppBlocks(m.text) }
          : { ...m, display: m.text, board: null, options: null },
      ),
    [messages],
  )

  const rawBoardState = useMemo(() => {
    for (let i = parsedMessages.length - 1; i >= 0; i--) {
      if (parsedMessages[i].board) return parsedMessages[i].board
    }
    return null
  }, [parsedMessages])

  const boardState = useMemo(() => (rawBoardState ? parseBoardState(rawBoardState) : null), [rawBoardState])

  const lastMessage = parsedMessages.length > 0 ? parsedMessages[parsedMessages.length - 1] : null
  const lastMessageIsAssistant = lastMessage?.role === 'assistant'
  const lastOptions = lastMessageIsAssistant ? lastMessage?.options ?? null : null

  function addFiles(fileList: FileList) {
    const images = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
    setPendingFiles((prev) => [...prev, ...images])
  }

  function removePendingFile(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function postTurn(form: FormData): Promise<HistoryResponse> {
    const res = await fetch(`${API_BASE}/api/turn`, { method: 'POST', body: form })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Request failed')
    return data
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
      const data = await postTurn(form)
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

  // Mobile: a captured photo sends immediately instead of staging into pendingFiles for a
  // separate Send tap. Still bundles whatever's in the text field, same as send().
  async function sendFiles(files: File[]) {
    if (!files.length) return
    const trimmed = text.trim()
    const insertedAtIndex = messages.length
    const form = new FormData()
    form.append('text', trimmed)
    files.forEach((f) => form.append('files', f))

    setSending(true)
    setError('')
    setText('')

    try {
      const data = await postTurn(form)
      const urls = files.map((f) => URL.createObjectURL(f))
      setLocalPreviews((prev) => ({ ...prev, [insertedAtIndex]: urls }))
      setMessages(data.messages)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
      setText(trimmed)
      setPendingFiles(files)
    } finally {
      setSending(false)
    }
  }

  // Sends a canned message (quick-prompt buttons, the confirm button) independent of whatever
  // is currently drafted in the composer's text box. Still attaches any staged photos, in case
  // the user picked one before tapping a quick prompt.
  async function sendQuick(promptText: string) {
    const insertedAtIndex = messages.length
    const filesForThisTurn = pendingFiles
    const form = new FormData()
    form.append('text', promptText)
    filesForThisTurn.forEach((f) => form.append('files', f))

    setSending(true)
    setError('')
    setPendingFiles([])

    try {
      const data = await postTurn(form)
      if (filesForThisTurn.length) {
        const urls = filesForThisTurn.map((f) => URL.createObjectURL(f))
        setLocalPreviews((prev) => ({ ...prev, [insertedAtIndex]: urls }))
      }
      setMessages(data.messages)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
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

  function renderBubble(m: ParsedMessage, i: number) {
    return (
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
        {m.role === 'assistant' && m.board && <div className="board-chip">🗺️ Board updated — see panel</div>}
        {m.display && (
          <div className="bubble-text">
            {m.role === 'assistant' ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.display}</ReactMarkdown> : m.display}
          </div>
        )}
      </div>
    )
  }

  function renderTail() {
    return (
      <>
        {sending && (
          <div className="bubble assistant pending">
            <div className="bubble-role">Assistant</div>
            <div className="bubble-text typing">thinking…</div>
          </div>
        )}

        {!sending && lastMessageIsAssistant && lastOptions && lastOptions.length > 0 && (
          <div className="options-bar">
            {lastOptions.map((opt) => (
              <button key={opt} className="option-btn" onClick={() => sendQuick(opt)}>
                {opt}
              </button>
            ))}
          </div>
        )}

        {!sending && lastMessageIsAssistant && !(lastOptions && lastOptions.length > 0) && (
          <div className="confirm-bar">
            <span>Does this look right?</span>
            <button className="confirm-btn" onClick={() => sendQuick('CONFIRMED')}>
              ✓ Correct
            </button>
          </div>
        )}
      </>
    )
  }

  function renderBoardPanel() {
    return (
      <aside className="board-panel">
        <h2>Current board state</h2>
        {boardState ? (
          <BoardDiagram board={boardState} />
        ) : rawBoardState ? (
          <details className="board-fallback">
            <summary>Couldn't render the board graphically — raw data</summary>
            <pre>{rawBoardState}</pre>
          </details>
        ) : (
          <p className="hint">
            Nothing yet — upload a photo of the board and the assistant's read of it will show up
            here, kept up to date every turn.
          </p>
        )}
      </aside>
    )
  }

  return (
    <div className={`app${isMobile ? ' app-mobile' : ''}`}>
      <header className="app-header">
        <h1>Board Game Assistant</h1>
        <button className="reset-btn" onClick={resetGame} title="Start a new game">
          New game
        </button>
      </header>

      {isMobile ? (
        <div className="layout layout-mobile">
          {renderBoardPanel()}
          <main className="chat chat-mobile">
            {loadingHistory && <p className="hint">Loading...</p>}
            {!loadingHistory && messages.length === 0 && <p className="hint">Take a photo to begin.</p>}
            {lastMessage?.display && (
              <div className="bubble-mobile">
                {lastMessage.role === 'assistant' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{lastMessage.display}</ReactMarkdown>
                ) : (
                  lastMessage.display
                )}
              </div>
            )}
            {renderTail()}
          </main>
        </div>
      ) : (
        <div className="layout">
          <main className="chat" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
            {loadingHistory && <p className="hint">Loading...</p>}
            {!loadingHistory && messages.length === 0 && (
              <p className="hint">Upload a photo of the board or your hand, or just start typing, to begin.</p>
            )}
            {parsedMessages.map(renderBubble)}
            {renderTail()}
            <div ref={bottomRef} />
          </main>
          {renderBoardPanel()}
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      {!loadingHistory && (
        <div className="quick-prompts">
          {(messages.length === 0 ? START_PROMPTS : QUICK_PROMPTS).map((p) => (
            <button key={p} className="quick-prompt-btn" onClick={() => sendQuick(p)} disabled={sending}>
              {p}
            </button>
          ))}
        </div>
      )}

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
          onClick={() => cameraInputRef.current?.click()}
          title="Take a photo"
          disabled={sending}
        >
          📸
        </button>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files
            if (files && files.length) {
              if (isMobile) sendFiles(Array.from(files))
              else addFiles(files)
            }
            e.target.value = ''
          }}
        />
        {!isMobile && (
          <>
            <button
              className="attach-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Attach photo(s) from gallery"
              disabled={sending}
            >
              🖼️
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
          </>
        )}
        <textarea
          rows={1}
          placeholder={isMobile ? 'Reply...' : 'Ask a question, describe a move, or attach a photo...'}
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
