import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from backend.app.config import DIST_DIR
from backend.app.routers import (
    health_router,
    auth_router,
    presets_router,
    games_router,
    rules_router,
    board_router,
    chat_router,
)

def create_app() -> FastAPI:
    app = FastAPI(
        title="GamePlay Companion API",
        description="Structured FastAPI backend for tabletop & board game play, rules analysis, AI judge/teacher/player, and progress storage.",
        version="2.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # Cross-Origin Resource Sharing
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register modular routers
    app.include_router(health_router)
    app.include_router(auth_router)
    app.include_router(presets_router)
    app.include_router(games_router)
    app.include_router(rules_router)
    app.include_router(board_router)
    app.include_router(chat_router)

    # Static SPA file serving (when frontend build is present)
    if os.path.exists(DIST_DIR):
        assets_dir = os.path.join(DIST_DIR, "assets")
        if os.path.exists(assets_dir):
            app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

        @app.get("/{full_path:path}", include_in_schema=False)
        async def serve_spa(full_path: str):
            if full_path.startswith("api/"):
                raise HTTPException(status_code=404, detail="API route not found")
            file_path = os.path.join(DIST_DIR, full_path)
            if os.path.isfile(file_path):
                return FileResponse(file_path)
            index_file = os.path.join(DIST_DIR, "index.html")
            if os.path.exists(index_file):
                return FileResponse(index_file)
            return JSONResponse({"message": "App build in progress. Run vite build."})

    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    from backend.app.config import PORT
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=PORT, reload=True)
