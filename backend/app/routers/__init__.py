from backend.app.routers.health import router as health_router
from backend.app.routers.auth import router as auth_router
from backend.app.routers.presets import router as presets_router
from backend.app.routers.games import router as games_router
from backend.app.routers.rules import router as rules_router
from backend.app.routers.board import router as board_router
from backend.app.routers.chat import router as chat_router

__all__ = [
    "health_router",
    "auth_router",
    "presets_router",
    "games_router",
    "rules_router",
    "board_router",
    "chat_router",
]
