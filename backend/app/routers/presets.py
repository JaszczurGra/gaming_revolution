from fastapi import APIRouter
from backend.app.services.storage import PRESET_RULES

router = APIRouter(tags=["Rule Presets"])

@router.get("/api/presets")
def get_presets():
    return PRESET_RULES
