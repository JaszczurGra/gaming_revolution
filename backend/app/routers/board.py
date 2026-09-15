from fastapi import APIRouter, HTTPException
from backend.app.models.board import BoardAnalyzeRequest
from backend.app.services.board_vision import analyze_board_image

router = APIRouter(tags=["Board Vision"])

@router.post("/api/board/analyze")
def analyze_board(payload: BoardAnalyzeRequest):
    try:
        if not payload.imageBase64:
            raise HTTPException(status_code=400, detail="imageBase64 is required")

        result = analyze_board_image(
            image_b64=payload.imageBase64,
            game_title=payload.gameTitle or "Tabletop Game",
            rules_context=payload.rulesContext or "",
            custom_notes=payload.customNotes or "",
        )
        return {"analysis": result}
    except Exception as e:
        print(f"Board analyze route error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
