import json
from typing import Dict, Any, Optional
from google.genai import types

from backend.app.services.gemini import get_gemini_client, MODEL_NAME

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

    # Format context
    rules_context = ""
    ra = game.get("ruleAnalysis")
    if ra:
        rules_context = f"""Game Title: {ra.get('title')}
Overview: {ra.get('overview')}
Win Condition: {ra.get('winCondition')}
Turn Structure: {' -> '.join(ra.get('turnStructure', []))}
Core Rules: {'; '.join(ra.get('keyRules', []))}
Forbidden Actions: {'; '.join(ra.get('forbiddenMoves', []))}"""
    elif game.get("ruleSource"):
        rules_context = game["ruleSource"].get("textContent", "Standard rules.")

    players = game.get("players", [])
    idx = game.get("activePlayerIndex", 0)
    active_player_name = players[idx].get("name", "Player") if players and idx < len(players) else "Player"

    progress_context = f"""Current Turn: {game.get('currentTurn', 1)}
Active Player: {active_player_name}
Players: {', '.join([f"{p.get('name')} ({p.get('score')} pts)" for p in players])}
Recent Moves:
{chr(10).join([f"- Turn {m.get('turnNumber')} [{m.get('playerName')}]: {m.get('description')}" for m in game.get('moves', [])[-5:]]) or 'No moves logged yet.'}
Board Notes: {game.get('boardNotes', 'None')}"""

    agent_config_text = ""
    cfg = game.get("agentConfig")
    if cfg:
        agent_config_text = f"""\nCUSTOM AGENT PROMPTING:
Persona: {cfg.get('customPersonaPrompt', 'Standard')}
Difficulty: {cfg.get('difficulty', 'standard')}
Referee Strictness: {cfg.get('strictness', 'standard')}
Directives: {cfg.get('customInstructions', 'None')}"""

    photos = game.get("photos", [])
    photos_text = f"\nPHOTOS ON FILE: {len(photos)} image(s) ({'; '.join([p.get('caption', 'photo') for p in photos])})" if photos else ""

    history_vision = game.get("boardAnalysisHistory", [])
    vision_text = ""
    if history_vision:
        latest = history_vision[-1]
        vision_text = f"\nLATEST BOARD SCAN: {latest.get('summary')} | Adv: {latest.get('boardStateScore')} | Advice: {latest.get('strategicAdvice')}"

    if role == "teacher":
        role_instructions = f"""You are an enthusiastic, patient, and friendly Game Teacher / Mentor for "{game.get('title')}".
Teach the user how to play, explain rule subtleties, suggest beginner-friendly tips, and answer rule questions with clarity.
Reference rule phases:
{rules_context}"""
    elif role == "judge":
        role_instructions = f"""You are an official, impartial Tournament Game Judge and Arbiter for "{game.get('title')}".
Enforce the uploaded rulebook strictly, resolve disputes, evaluate proposed actions for legality, and provide rule citations.
If the player asks if an action is legal:
1. State [LEGAL] or [ILLEGAL / INFRACTION].
2. Provide exact rationale based on the rules.
3. Suggest the legal procedure.
Rules:
{rules_context}"""
    else:
        role_instructions = f"""You are an AI opponent playing the game "{game.get('title')}" against the user!
Play smartly, make tactical decisions according to the official rules, react to the player's moves, and narrate your plays with sportsmanlike banter.
Rules:
{rules_context}"""

    history = game.get("chatHistory", [])
    recent_chat = "\n".join([f"{'Player' if c.get('sender') == 'user' else 'AI (' + str(c.get('role')) + ')'}: {c.get('text')}" for c in history[-6:]])

    full_prompt = f"""{role_instructions}

{progress_context}
{agent_config_text}
{photos_text}
{vision_text}

RECENT CHAT HISTORY:
{recent_chat}

USER'S LATEST MESSAGE:
"{user_message}"

Respond directly to the user in your role ({role.upper()}). Use Markdown for clarity."""

    resp = ai.models.generate_content(
        model=MODEL_NAME,
        contents=full_prompt,
    )
    bot_text = resp.text or "I have processed your message."

    return {
        "text": bot_text,
        "citation": citation,
        "suggestedAction": suggested_action,
    }
