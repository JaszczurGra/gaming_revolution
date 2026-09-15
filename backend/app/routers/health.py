import os
from datetime import datetime
from fastapi import APIRouter

router = APIRouter(tags=["Health"])

@router.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "engine": "FastAPI (Modular Architecture)",
        "hasApiKey": bool(os.environ.get("GEMINI_API_KEY")),
        "timestamp": datetime.now().isoformat(),
    }
