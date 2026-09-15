from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class RuleSource(BaseModel):
    fileName: str
    fileType: str = "text"
    fileSize: Optional[str] = None
    uploadedAt: str
    hasPdf: bool = False
    textContent: Optional[str] = None

class RuleAnalysis(BaseModel):
    title: str
    overview: str
    winCondition: str
    turnStructure: List[str] = Field(default_factory=list)
    keyRules: List[str] = Field(default_factory=list)
    forbiddenMoves: List[str] = Field(default_factory=list)
    teacherTips: List[str] = Field(default_factory=list)
    judgeChecklist: List[str] = Field(default_factory=list)
    playerStrategy: str

class RuleAnalyzeRequest(BaseModel):
    pdfBase64: Optional[str] = None
    textContent: Optional[str] = None
    fileName: Optional[str] = None
    presetKey: Optional[str] = None

class RuleAnalyzeResponse(BaseModel):
    analysis: RuleAnalysis
    extractedText: Optional[str] = None
