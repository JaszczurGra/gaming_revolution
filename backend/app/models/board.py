from typing import Optional, List
from pydantic import BaseModel, Field

class BoardAnalyzeRequest(BaseModel):
    imageBase64: str
    gameTitle: Optional[str] = "Tabletop Game"
    rulesContext: Optional[str] = ""
    customNotes: Optional[str] = ""

class BoardAnalysisResult(BaseModel):
    summary: str
    detectedPieces: List[str] = Field(default_factory=list)
    boardStateScore: str
    strategicAdvice: str
    suggestedNextMoves: List[str] = Field(default_factory=list)
    rulesComplianceNote: str
    timestamp: Optional[str] = None

class BoardAnalyzeResponse(BaseModel):
    analysis: BoardAnalysisResult
