from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from backend.app.models.rules import RuleSource, RuleAnalysis

class Player(BaseModel):
    id: str
    name: str
    isAi: bool = False
    score: int = 0
    color: str = "#3B82F6"
    status: str = "active"

class MoveRuling(BaseModel):
    isLegal: bool
    judgeComment: str
    ruleCitation: Optional[str] = None

class Move(BaseModel):
    id: str
    turnNumber: int
    playerId: str
    playerName: str
    actionType: str = "move"
    description: str
    ruling: Optional[MoveRuling] = None
    timestamp: str

class MoveRequest(BaseModel):
    playerId: Optional[str] = None
    playerName: Optional[str] = None
    actionType: Optional[str] = "move"
    description: str
    evaluateWithJudge: Optional[bool] = False

class Milestone(BaseModel):
    id: str
    title: str
    description: str
    completed: bool = False
    completedByPlayerId: Optional[str] = None
    turnAchieved: Optional[int] = None

class PhotoRecord(BaseModel):
    id: str
    caption: str
    category: str = "board"
    imageData: str
    uploadedAt: str

class AgentConfig(BaseModel):
    customPersonaPrompt: Optional[str] = "Standard helpful assistant"
    difficulty: Optional[str] = "standard"
    strictness: Optional[str] = "standard"
    customInstructions: Optional[str] = ""

class CreateGameRequest(BaseModel):
    userId: Optional[str] = "user_alex"
    title: Optional[str] = "New Game Match"
    category: Optional[str] = "board_game"
    activeChatbotRole: Optional[str] = "teacher"
    players: Optional[List[Player]] = None
    ruleSource: Optional[RuleSource] = None
    ruleAnalysis: Optional[RuleAnalysis] = None
    agentConfig: Optional[AgentConfig] = None
