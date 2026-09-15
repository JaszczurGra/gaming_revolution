# GamePlay Companion - FastAPI Backend

A modular, production-ready FastAPI application for tabletop and board game analysis, rule parsing, AI arbiter/teacher/player personas, and game state persistence.

## Architecture

```
backend/
├── app/
│   ├── __init__.py          # Exports `app` and `create_app`
│   ├── main.py              # FastAPI factory, CORS, router mounts, SPA static serving
│   ├── config.py            # Environment variables and path resolution
│   ├── models/              # Pydantic schemas and typed models
│   │   ├── __init__.py
│   │   ├── auth.py          # UserProfile, LoginRequest, LoginResponse
│   │   ├── game.py          # Game, Player, Move, Milestone, PhotoRecord, AgentConfig
│   │   ├── rules.py         # RuleSource, RuleAnalysis, RuleAnalyzeRequest/Response
│   │   ├── board.py         # BoardAnalyzeRequest, BoardAnalysisResult
│   │   └── chat.py          # ChatMessage, ChatRequest, ChatResponse
│   ├── services/            # Core business logic and external integrations
│   │   ├── __init__.py
│   │   ├── storage.py       # Thread-safe JSON persistence and default dataset
│   │   ├── gemini.py        # Google GenAI SDK client singleton
│   │   ├── rule_parser.py   # PDF text extraction (pypdf) & structured rulebook analysis
│   │   ├── board_vision.py  # Computer vision image analysis for board state & pieces
│   │   └── arbiter.py       # Move legality rulings & contextual chat personas
│   └── routers/             # Clean REST API endpoints
│       ├── __init__.py
│       ├── health.py        # GET /api/health
│       ├── auth.py          # GET /api/users, POST /api/auth/login
│       ├── presets.py       # GET /api/presets
│       ├── games.py         # GET /api/games, POST /api/games, PATCH, DELETE, moves
│       ├── rules.py         # POST /api/rules/analyze
│       ├── board.py         # POST /api/board/analyze
│       └── chat.py          # POST /api/games/{id}/chat
```

## Running the Backend

### Local Development
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set Gemini API key
export GEMINI_API_KEY="your-api-key"

# 3. Start development server with reload
uvicorn backend.app.main:app --host 0.0.0.0 --port 3000 --reload
```

Interactive API documentation will be available at:
- Swagger UI: `http://localhost:3000/docs`
- ReDoc: `http://localhost:3000/redoc`

### Docker Deployment
```bash
docker build -t gameplay-companion-fastapi .
docker run -p 3000:3000 -e GEMINI_API_KEY="your-api-key" gameplay-companion-fastapi
```
