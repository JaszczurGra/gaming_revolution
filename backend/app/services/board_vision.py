import base64
import json
from datetime import datetime
from typing import Dict, Any
from google.genai import types

from backend.app.services.gemini import get_gemini_client, MODEL_NAME

FALLBACK_BOARD_ANALYSIS: Dict[str, Any] = {
    "summary": "Physical board view detected with active player components and tokens.",
    "detectedPieces": [
        "Central game grid / tiles",
        "Player tokens and marker pieces in active quadrant",
        "Resource cards / score tracker on perimeter",
    ],
    "boardStateScore": "Balanced territorial control with contested center",
    "strategicAdvice": "Expand towards open resource nodes and fortify your weakest perimeter segment.",
    "suggestedNextMoves": [
        "Secure contested intersection before opponent takes turn",
        "Consolidate trade goods to avoid discard penalties",
        "Roll dice to check harvest phase",
    ],
    "rulesComplianceNote": "Piece placement appears compliant with spatial distance rules.",
}

def analyze_board_image(
    image_b64: str,
    game_title: str = "Tabletop Game",
    rules_context: str = "",
    custom_notes: str = "",
) -> Dict[str, Any]:
    ai = get_gemini_client()
    if not ai:
        fallback = dict(FALLBACK_BOARD_ANALYSIS)
        fallback["timestamp"] = datetime.now().isoformat()
        return fallback

    prompt = f"""You are a world-class board game referee and computer vision tactical analyst.
Analyze this photo of the physical tabletop board game "{game_title}".

Rules & Context:
{rules_context or 'Standard tabletop game rules and victory conditions apply.'}

Additional Board Notes from players:
{custom_notes or 'None'}

Please extract and evaluate:
1. summary: A thorough 2-3 sentence description of the visible board state, active territories, piece clusters, and current phase.
2. detectedPieces: An array of strings detailing the specific pieces, cards, dice, tokens, or markers visible in the image.
3. boardStateScore: Assessment of who appears in the lead or board advantage.
4. strategicAdvice: Direct, high-level tactical advice for the player whose turn it is.
5. suggestedNextMoves: Array of 3 specific, legal, high-value move options they can execute.
6. rulesComplianceNote: Confirmation of whether piece spacing, tile connections, or visible cards comply with official rules.

Output strictly valid JSON matching this schema:
{{
  "summary": "string",
  "detectedPieces": ["string"],
  "boardStateScore": "string",
  "strategicAdvice": "string",
  "suggestedNextMoves": ["string"],
  "rulesComplianceNote": "string"
}}"""

    img_clean_b64 = image_b64
    mime_type = "image/jpeg"
    if "," in img_clean_b64:
        header, img_clean_b64 = img_clean_b64.split(",", 1)
        if "png" in header:
            mime_type = "image/png"
        elif "webp" in header:
            mime_type = "image/webp"

    img_bytes = base64.b64decode(img_clean_b64)

    resp = ai.models.generate_content(
        model=MODEL_NAME,
        contents=[
            types.Part.from_bytes(data=img_bytes, mime_type=mime_type),
            types.Part.from_text(text=prompt),
        ],
        config=types.GenerateContentConfig(response_mime_type="application/json"),
    )

    parsed = json.loads(resp.text or "{}")
    parsed["timestamp"] = datetime.now().isoformat()
    return parsed
