import time
from datetime import datetime
from fastapi import APIRouter

from backend.app.config import USERS_FILE
from backend.app.models.auth import LoginRequest
from backend.app.services.storage import load_json, save_json, DEFAULT_USERS

router = APIRouter(tags=["Authentication & Users"])

@router.get("/api/users")
def get_users():
    return load_json(USERS_FILE, DEFAULT_USERS)

@router.post("/api/auth/login")
def login(payload: LoginRequest):
    users = load_json(USERS_FILE, DEFAULT_USERS)
    uname = (payload.username or "").strip().lower()

    user = next((u for u in users if u.get("username", "").lower() == uname), None)
    if not user:
        new_user = {
            "id": f"user_{int(time.time() * 1000)}",
            "username": uname.replace(" ", "_") if uname else f"player_{int(time.time()) % 1000}",
            "displayName": payload.displayName or payload.username or "Anonymous Player",
            "avatar": payload.avatar or "🎮",
            "title": "Game Enthusiast",
            "gamesPlayed": 0,
            "gamesWon": 0,
            "joinedAt": datetime.now().strftime("%Y-%m-%d"),
        }
        users.append(new_user)
        save_json(USERS_FILE, users)
        user = new_user

    token = f"fake-jwt-token-{user['id']}-{int(time.time() * 1000)}"
    return {"user": user, "token": token}
