from typing import Optional
from pydantic import BaseModel, Field

class UserProfile(BaseModel):
    id: str
    username: str
    displayName: str
    avatar: str = "🎲"
    title: str = "Tabletop Enthusiast"
    gamesPlayed: int = 0
    gamesWon: int = 0
    joinedAt: str

class LoginRequest(BaseModel):
    username: Optional[str] = None
    displayName: Optional[str] = None
    avatar: Optional[str] = None

class LoginResponse(BaseModel):
    user: UserProfile
    token: str
