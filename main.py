"""
GamePlay Companion - FastAPI Application Entry Point
This entry point exports the structured FastAPI application from `backend.app.main`.
"""
import sys
import os

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.app.main import app, create_app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 3000))
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, reload=True)
