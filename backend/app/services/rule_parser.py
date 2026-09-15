import base64
import io
import json
from typing import Tuple, Dict, Any
from pypdf import PdfReader
from google.genai import types

from backend.app.services.gemini import get_gemini_client, MODEL_NAME
from backend.app.services.storage import PRESET_RULES

FALLBACK_RULE_ANALYSIS: Dict[str, Any] = {
    "title": "Custom Game",
    "overview": "Custom tabletop board game with turn-based strategy and piece movement.",
    "winCondition": "First player to achieve maximum victory score or complete scenario objective.",
    "turnStructure": [
        "Phase 1: Roll dice or draw resource cards",
        "Phase 2: Trade or strategize actions",
        "Phase 3: Execute movement, building, or tactical abilities",
        "Phase 4: Pass turn to next player clockwise",
    ],
    "keyRules": [
        "Players take turns in sequential clockwise order.",
        "Must follow distance, resource, and movement constraints specified in rules.",
        "Actions can be verified by the AI Arbiter.",
    ],
    "forbiddenMoves": [
        "Moving or acting out of turn",
        "Exceeding resource or hand limits without discarding",
        "Violating spatial distance constraints",
    ],
    "teacherTips": [
        "Focus on steady early-game resource production.",
        "Keep track of leading opponent's score count.",
        "Ask the AI Teacher if card phrasing is ever ambiguous!",
    ],
    "judgeChecklist": [
        "Verify turn phase sequence",
        "Check resource payment costs before building",
        "Confirm target eligibility for action cards",
    ],
    "playerStrategy": "Balanced and tactical play, exploiting opponent openings while maintaining strong defenses.",
}

def extract_text_from_pdf(pdf_b64: str) -> str:
    try:
        pdf_bytes = base64.b64decode(pdf_b64)
        reader = PdfReader(io.BytesIO(pdf_bytes))
        extracted_pages = []
        for p in reader.pages[:10]:
            txt = p.extract_text()
            if txt:
                extracted_pages.append(txt)
        return "\n".join(extracted_pages)
    except Exception as e:
        print(f"pypdf extraction error: {e}")
        return ""

def analyze_rulebook(
    pdf_b64: str = None,
    text_content: str = None,
    file_name: str = None,
    preset_key: str = None,
) -> Tuple[Dict[str, Any], str]:
    rules_raw_text = text_content or ""
    if preset_key and preset_key in PRESET_RULES:
        rules_raw_text = PRESET_RULES[preset_key]["text"]

    pdf_text = ""
    if pdf_b64:
        pdf_text = extract_text_from_pdf(pdf_b64)
        if not rules_raw_text and len(pdf_text.strip()) > 20:
            rules_raw_text = pdf_text

    ai = get_gemini_client()
    if not ai:
        fallback = dict(FALLBACK_RULE_ANALYSIS)
        if file_name:
            fallback["title"] = file_name.rsplit(".", 1)[0]
        if rules_raw_text:
            fallback["overview"] = rules_raw_text[:200] + "..."
        return fallback, rules_raw_text[:1000]

    prompt_instruction = """Analyze this game rulebook thoroughly. Extract and format the complete rule specifications for an AI chatbot assistant that will act as a Teacher, Judge, and Player.
Extract:
1. title: Exact game name
2. overview: 2-3 sentence summary of the game premise and mechanics
3. winCondition: Clear, concise win/victory condition
4. turnStructure: Array of strings describing the sequential phases of each player's turn
5. keyRules: Array of 5-8 most critical core rules players must know
6. forbiddenMoves: Array of 3-5 strictly illegal actions or common errors to guard against
7. teacherTips: Array of 3-4 pedagogical tips to guide beginners
8. judgeChecklist: Array of 3-4 checks an arbiter should perform when verifying moves
9. playerStrategy: Summary of strategic priorities when playing this game

Return strictly JSON matching this schema:
{
  "title": "string",
  "overview": "string",
  "winCondition": "string",
  "turnStructure": ["string"],
  "keyRules": ["string"],
  "forbiddenMoves": ["string"],
  "teacherTips": ["string"],
  "judgeChecklist": ["string"],
  "playerStrategy": "string"
}"""

    if pdf_b64:
        contents = [
            types.Part.from_bytes(data=base64.b64decode(pdf_b64), mime_type="application/pdf"),
            types.Part.from_text(text=prompt_instruction),
        ]
    else:
        contents = f"{prompt_instruction}\n\nRULES CONTENT:\n{rules_raw_text}"

    response = ai.models.generate_content(
        model=MODEL_NAME,
        contents=contents,
        config=types.GenerateContentConfig(response_mime_type="application/json"),
    )

    parsed = json.loads(response.text or "{}")
    extracted_summary = rules_raw_text[:2000] if rules_raw_text else "Processed directly via Gemini PDF parsing."
    return parsed, extracted_summary
