from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ChatMessage(BaseModel):
    id: str
    sender: str  # "user" or "bot"
    role: str    # "teacher", "judge", or "player"
    text: str
    timestamp: str
    citation: Optional[str] = None
    suggestedAction: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    role: Optional[str] = None

class ChatResponse(BaseModel):
    message: ChatMessage
    game: Dict[str, Any]
