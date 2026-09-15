import json
import threading
from typing import Dict, Any, Optional

from google.genai import types

from backend.app.services.gemini import get_gemini_client, MODEL_NAME
from backend.app.services.game_session import GameSession

# One GameSession per game_id — preserves multi-turn Gemini conversation across API calls.
_sessions: Dict[str, GameSession] = {}
_sessions_lock = threading.Lock()


def _get_session(game: Dict[str, Any]) -> GameSession:
    """Return an existing GameSession for this game, or create a new one."""
    game_id = game.get("id", "__default__")
    with _sessions_lock:
        if game_id not in _sessions:
            _sessions[game_id] = GameSession(game=game)
        else:
            # Keep the session's game context up to date (rules may have been analysed).
            _sessions[game_id].update_game(game)
        return _sessions[game_id]


def invalidate_session(game_id: str) -> None:
    """Drop the cached session for a game (call when a game is deleted or reset)."""
    with _sessions_lock:
        _sessions.pop(game_id, None)


def evaluate_move_legality(
    game: Dict[str, Any],
    player_name: str,
    move_description: str,
) -> Dict[str, Any]:
    ai = get_gemini_client()
    if not ai:
        return {
            "isLegal": True,
            "judgeComment": "Action accepted under active game rules.",
            "ruleCitation": "General Play Rules",
        }

    rules_text = ""
    if game.get("ruleAnalysis"):
        ra = game["ruleAnalysis"]
        rules_text = f"Game: {ra.get('title')}\nRules: {'; '.join(ra.get('keyRules', []))}\nForbidden: {'; '.join(ra.get('forbiddenMoves', []))}"
    elif game.get("ruleSource"):
        rules_text = game["ruleSource"].get("textContent", "Standard rules.")

    prompt = f"""You are an expert, impartial Game Judge / Arbiter.
Rulebook & Game Summary:
{rules_text}

Current Turn: {game.get('currentTurn', 1)}
Player: {player_name}
Proposed Action: "{move_description}"

Evaluate if this move/action is strictly legal according to the rules.
Output strictly JSON:
{{
  "isLegal": true or false,
  "judgeComment": "One concise sentence ruling whether this is allowed and why.",
  "ruleCitation": "Short reference or quote from the rules or standard rulebook principle."
}}"""

    try:
        resp = ai.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        if resp.text:
            return json.loads(resp.text)
    except Exception as e:
        print(f"Judge evaluation error: {e}")

    return {
        "isLegal": True,
        "judgeComment": "Action accepted under active game rules.",
        "ruleCitation": "General Play Rules",
    }


def generate_chat_response(
    game: Dict[str, Any],
    role: str,
    user_message: str,
) -> Dict[str, Any]:
    ai = get_gemini_client()

    citation: Optional[str] = None
    suggested_action: Optional[str] = None

    if not ai:
        if role == "teacher":
            text = f"[Teacher Mode] Based on {game.get('title')}'s rules: To take your turn, follow the turn phases: 1) Roll or collect resources, 2) Trade or play action cards, 3) Build or move. Goal: {game.get('ruleAnalysis', {}).get('winCondition', 'Achieve the victory score')}."
        elif role == "judge":
            text = f"[Judge Ruling] I have reviewed the action against {game.get('title')}'s rulebook. The move is valid provided all costs were paid and distance rules respected. Ruling: LEGAL."
            citation = "Rulebook Section 2.1"
        else:
            text = f"[AI Player] I roll the dice and evaluate my strategic options! I make my turn move and pass the dice back to you."
            suggested_action = "Roll Dice or Pass Turn"
        return {"text": text, "citation": citation, "suggestedAction": suggested_action}

    # --- Multi-turn path: use GameSession for real conversation memory ---
    # Prepend a brief role directive so the model knows the active persona for this turn.
    # The session's system prompt (from rag.py) already contains the full rules; we just
    # need to signal the role the user has selected in the UI.
    players = game.get("players", [])
    idx = game.get("activePlayerIndex", 0)
    active_player_name = (
        players[idx].get("name", "Player") if players and idx < len(players) else "Player"
    )

    cfg = game.get("agentConfig") or {}
    agent_notes = ""
    if cfg:
        agent_notes = (
            f"\n[Agent config — difficulty: {cfg.get('difficulty', 'standard')}, "
            f"strictness: {cfg.get('strictness', 'standard')}. "
            f"Custom instructions: {cfg.get('customInstructions') or 'none'}]"
        )

    history_vision = game.get("boardAnalysisHistory", [])
    vision_note = ""
    if history_vision:
        latest = history_vision[-1]
        vision_note = (
            f"\n[Latest board scan — {latest.get('summary', '')} | "
            f"advantage: {latest.get('boardStateScore', '')} | "
            f"advice: {latest.get('strategicAdvice', '')}]"
        )

    if role == "teacher":
        role_prefix = (
            f"[Active role: TEACHER / TUTOR for \"{game.get('title')}\". "
            "Explain rules clearly, guide the player step by step, and offer beginner tips.]"
        )
    elif role == "judge":
        role_prefix = (
            f"[Active role: JUDGE / REFEREE for \"{game.get('title')}\". "
            "Enforce the rulebook strictly. State [LEGAL] or [ILLEGAL] and cite the rule.]"
        )
    else:
        role_prefix = (
            f"[Active role: AI OPPONENT / PLAYER in \"{game.get('title')}\". "
            "Play tactically, narrate your moves, and react to the human player with sportsmanlike banter.]"
        )

    game_context = (
        f"[Current turn: {game.get('currentTurn', 1)}, "
        f"active player: {active_player_name}, "
        f"players: {', '.join(p.get('name', '?') + ' (' + str(p.get('score', 0)) + ' pts)' for p in players)}]"
    )

    full_message = f"{role_prefix}\n{game_context}{agent_notes}{vision_note}\n\n{user_message}"

    session = _get_session(game)
    try:
        bot_text = session.send_text(full_message)
    except Exception as e:
        print(f"GameSession chat error: {e}")
        bot_text = "I encountered an error processing your message. Please try again."

    return {
        "text": bot_text,
        "citation": citation,
        "suggestedAction": suggested_action,
    }
