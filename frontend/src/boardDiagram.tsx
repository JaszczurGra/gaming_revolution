// Renders the JSON board snapshot the model emits (see rag.py's BOARD_STATE note) as an actual
// graphical hex board instead of prose. Geometry: pointy-top hexes in row-offset layout, rows
// A(3)/B(4)/C(5)/D(4)/E(3) — matches resources/rags/Catan/board_topology.json's hex_neighbors
// (only E/W/NE/NW/SE/SW keys ever appear there, which is only consistent with pointy-top hexes).

type Terrain = 'hills' | 'pasture' | 'fields' | 'mountains' | 'forest' | 'desert'
type Direction = 'N' | 'NE' | 'SE' | 'S' | 'SW' | 'NW'

interface HexInfo {
  terrain: Terrain
  number: number | null
}

interface Harbor {
  at: [string, string]
  ratio: string
  resource?: string | null
}

interface Road {
  owner: string
  between: [string, string]
}

interface Building {
  owner: string
  type: 'settlement' | 'city'
  at: string
}

export interface BoardState {
  hexes: Record<string, HexInfo>
  robber?: string | null
  harbors?: Harbor[]
  roads?: Road[]
  buildings?: Building[]
  scores?: Record<string, number>
}

const ROW_ORDER = ['A', 'B', 'C', 'D', 'E']
const ROW_LEN: Record<string, number> = { A: 3, B: 4, C: 5, D: 4, E: 3 }
const ALL_HEX_IDS = ROW_ORDER.flatMap((row) =>
  Array.from({ length: ROW_LEN[row] }, (_, i) => `${row}${i + 1}`),
)

const S = 30 // hex "radius" (center to vertex), in SVG user units — kept small/compact
const W = Math.sqrt(3) * S

const VERTEX_OFFSET: Record<Direction, [number, number]> = {
  N: [0, -S],
  NE: [W / 2, -S / 2],
  SE: [W / 2, S / 2],
  S: [0, S],
  SW: [-W / 2, S / 2],
  NW: [-W / 2, -S / 2],
}

const TERRAIN_COLORS: Record<Terrain, string> = {
  hills: '#c1662f',
  pasture: '#9ccc65',
  fields: '#e8c547',
  mountains: '#7a7f87',
  forest: '#2f6b3a',
  desert: '#d8c496',
}

const PLAYER_COLORS: Record<string, string> = {
  red: '#d32f2f',
  blue: '#1976d2',
  white: '#f5f5f5',
  orange: '#f57c00',
  green: '#388e3c',
  brown: '#6d4c33',
}

function playerColor(owner: string): string {
  const key = owner.trim().toLowerCase()
  if (PLAYER_COLORS[key]) return PLAYER_COLORS[key]
  // Fallback for an unrecognized color name: hash to a stable hue.
  let hash = 0
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return `hsl(${hash % 360}, 65%, 45%)`
}

function hexCenter(hexId: string): [number, number] {
  const row = hexId[0]
  const i = parseInt(hexId.slice(1), 10) - 1
  const r = ROW_ORDER.indexOf(row)
  const len = ROW_LEN[row]
  if (r === -1 || Number.isNaN(i) || len === undefined) return [0, 0]
  const x = (i - (len - 1) / 2) * W
  const y = r * 1.5 * S
  return [x, y]
}

function vertexPixel(spec: string): [number, number] {
  const [hexId, dir] = spec.split('.') as [string, Direction]
  const [cx, cy] = hexCenter(hexId)
  const offset = VERTEX_OFFSET[dir]
  if (!offset) return [cx, cy]
  return [cx + offset[0], cy + offset[1]]
}

function hexPolygonPoints(hexId: string): string {
  const [cx, cy] = hexCenter(hexId)
  return (['N', 'NE', 'SE', 'S', 'SW', 'NW'] as Direction[])
    .map((d) => `${cx + VERTEX_OFFSET[d][0]},${cy + VERTEX_OFFSET[d][1]}`)
    .join(' ')
}

const PAD = 34
const WIDTH = 5 * W + PAD * 2
const HEIGHT = 8 * S + PAD * 2
const VIEWBOX = `${-WIDTH / 2} ${-S - PAD} ${WIDTH} ${HEIGHT}`

export function parseBoardState(raw: string): BoardState | null {
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && parsed.hexes) return parsed as BoardState
    return null
  } catch {
    return null
  }
}

export function BoardDiagram({ board }: { board: BoardState }) {
  const scores = Object.entries(board.scores ?? {})

  return (
    <div className="board-diagram">
      <svg viewBox={VIEWBOX} className="board-svg" role="img" aria-label="Current board state">
        {ALL_HEX_IDS.map((id) => {
          const info = board.hexes[id]
          const [cx, cy] = hexCenter(id)
          if (!info) {
            return (
              <polygon
                key={id}
                points={hexPolygonPoints(id)}
                fill="none"
                stroke="var(--border)"
                strokeDasharray="3 3"
              />
            )
          }
          const isRedNumber = info.number === 6 || info.number === 8
          return (
            <g key={id}>
              <polygon
                points={hexPolygonPoints(id)}
                fill={TERRAIN_COLORS[info.terrain]}
                stroke="#1c1c1c"
                strokeWidth={1}
              />
              {info.number != null && (
                <>
                  <circle cx={cx} cy={cy} r={10} fill="#f2e6c9" stroke="#1c1c1c" strokeWidth={0.75} />
                  <text
                    x={cx}
                    y={cy + 3.5}
                    fontSize={10}
                    fontWeight={700}
                    textAnchor="middle"
                    fill={isRedNumber ? '#c62828' : '#1c1c1c'}
                  >
                    {info.number}
                  </text>
                </>
              )}
              {board.robber === id && (
                <circle
                  cx={cx + S * 0.45}
                  cy={cy - S * 0.45}
                  r={6}
                  fill="#2b2b2b"
                  stroke="#fff"
                  strokeWidth={1}
                />
              )}
            </g>
          )
        })}

        {(board.harbors ?? []).map((h, i) => {
          const [x1, y1] = vertexPixel(h.at[0])
          const [x2, y2] = vertexPixel(h.at[1])
          const mx = (x1 + x2) / 2
          const my = (y1 + y2) / 2
          const len = Math.hypot(mx, my) || 1
          const ox = mx + (mx / len) * 22
          const oy = my + (my / len) * 22
          const label = h.resource ? `${h.ratio} ${h.resource}` : h.ratio
          return (
            <g key={i}>
              <line x1={mx} y1={my} x2={ox} y2={oy} stroke="#1976d2" strokeWidth={0.75} strokeDasharray="2 2" />
              <rect x={ox - 16} y={oy - 6} width={32} height={12} rx={3} fill="var(--bg)" stroke="#1976d2" strokeWidth={0.75} />
              <text x={ox} y={oy + 3} fontSize={6} textAnchor="middle" fill="#1976d2">
                {label}
              </text>
            </g>
          )
        })}

        {(board.roads ?? []).map((r, i) => {
          const [x1, y1] = vertexPixel(r.between[0])
          const [x2, y2] = vertexPixel(r.between[1])
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={playerColor(r.owner)}
              strokeWidth={4}
              strokeLinecap="round"
            />
          )
        })}

        {(board.buildings ?? []).map((b, i) => {
          const [x, y] = vertexPixel(b.at)
          const color = playerColor(b.owner)
          return b.type === 'city' ? (
            <g key={i}>
              <circle cx={x} cy={y} r={7} fill={color} stroke="#000" strokeWidth={1} />
              <circle cx={x} cy={y} r={2.5} fill="#fff" />
            </g>
          ) : (
            <circle key={i} cx={x} cy={y} r={5} fill={color} stroke="#000" strokeWidth={1} />
          )
        })}
      </svg>

      {scores.length > 0 && (
        <div className="board-scores">
          {scores.map(([owner, vp]) => (
            <span key={owner} className="board-score-chip">
              <i style={{ background: playerColor(owner) }} /> {owner} {vp}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
