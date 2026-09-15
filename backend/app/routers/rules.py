from fastapi import APIRouter, HTTPException
from backend.app.models.rules import RuleAnalyzeRequest
from backend.app.services.rule_parser import analyze_rulebook

router = APIRouter(tags=["Rules Engine"])

@router.post("/api/rules/analyze")
def analyze_rules(payload: RuleAnalyzeRequest):
    try:
        analysis, extracted_text = analyze_rulebook(
            pdf_b64=payload.pdfBase64,
            text_content=payload.textContent,
            file_name=payload.fileName,
            preset_key=payload.presetKey,
        )
        return {
            "analysis": analysis,
            "extractedText": extracted_text,
        }
    except Exception as e:
        print(f"Rule analysis route error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
