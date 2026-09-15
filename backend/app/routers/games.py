import time
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Header, Query

from backend.app.config import GAMES_FILE, USERS_FILE
from backend.app.models.game import CreateGameRequest, MoveRequest
from backend.app.services.storage import load_json, save_json, DEFAULT_USERS
from backend.app.services.arbiter import evaluate_move_legality

router = APIRouter(tags=["Games"])

@router.get("/api/games")
def list_games(
    x_user_id: Optional[str] = Header(None),
    userId: Optional[str] = Query(None),
):
    target_user = x_user_id or userId
    games = load_json(GAMES_FILE, [])
    if target_user:
        return [g for g in games if g.get("userId") == target_user]
    return games

@router.get("/api/games/{game_id}")
def get_game(game_id: str):
    games = load_json(GAMES_FILE, [])
    game = next((g for g in games if g.get("id") == game_id), None)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game

@router.post("/api/games", status_code=201)
def create_game(payload: CreateGameRequest):
    games = load_json(GAMES_FILE, [])
    role = payload.activeChatbotRole or "teacher"
    now_iso = datetime.now().isoformat()

    players_data = [p.model_dump() for p in payload.players] if payload.players else [
        {"id": "p1", "name": "Player 1", "isAi": False, "score": 0, "color": "#3B82F6", "status": "active"},
        {"id": "p2", "name": "AI Opponent", "isAi": True, "score": 0, "color": "#10B981", "status": "active"},
    ]

    new_game = {
        "id": f"game_{int(time.time() * 1000)}",
        "userId": payload.userId or "user_alex",
        "title": payload.title or "New Game Match",
        "category": payload.category or "board_game",
        "createdAt": now_iso,
        "updatedAt": now_iso,
        "status": "in_progress",
        "currentTurn": 1,
        "activePlayerIndex": 0,
        "activeChatbotRole": role,
        "players": players_data,
        "ruleSource": payload.ruleSource.model_dump() if payload.ruleSource else {
            "fileName": "custom_rules.txt",
            "fileType": "text",
            "uploadedAt": now_iso,
            "hasPdf": False,
        },
        "ruleAnalysis": payload.ruleAnalysis.model_dump() if payload.ruleAnalysis else None,
        "agentConfig": payload.agentConfig.model_dump() if payload.agentConfig else None,
        "moves": [],
        "chatHistory": [
            {
                "id": "msg_init",
                "sender": "bot",
                "role": role,
                "text": f"Welcome to {payload.title or 'the game'}! I have analyzed your rules and I am ready in {role.upper()} mode. How would you like to begin?",
                "timestamp": now_iso,
            }
        ],
        "boardNotes": "Game initialized. Round 1 has begun.",
        "photos": [],
        "milestones": [],
        "boardAnalysisHistory": [],
    }

    games.insert(0, new_game)
    save_json(GAMES_FILE, games)

    users = load_json(USERS_FILE, DEFAULT_USERS)
    for u in users:
        if u.get("id") == new_game["userId"]:
            u["gamesPlayed"] = u.get("gamesPlayed", 0) + 1
            break
    save_json(USERS_FILE, users)

    return new_game

@router.patch("/api/games/{game_id}")
def update_game(game_id: str, patch_data: Dict[str, Any]):
    games = load_json(GAMES_FILE, [])
    found_idx = next((i for i, g in enumerate(games) if g.get("id") == game_id), -1)
    if found_idx == -1:
        raise HTTPException(status_code=404, detail="Game not found")

    games[found_idx].update(patch_data)
    games[found_idx]["updatedAt"] = datetime.now().isoformat()
    save_json(GAMES_FILE, games)
    return games[found_idx]

@router.delete("/api/games/{game_id}")
def delete_game(game_id: str):
    games = load_json(GAMES_FILE, [])
    filtered = [g for g in games if g.get("id") != game_id]
    save_json(GAMES_FILE, filtered)
    return {"success": True, "id": game_id}

@router.post("/api/games/{game_id}/moves")
def log_move(game_id: str, payload: MoveRequest):
    games = load_json(GAMES_FILE, [])
    game = next((g for g in games if g.get("id") == game_id), None)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    ruling = None
    if payload.evaluateWithJudge:
        ruling = evaluate_move_legality(
            game=game,
            player_name=payload.playerName or "Player",
            move_description=payload.description,
        )

    new_move = {
        "id": f"move_{int(time.time() * 1000)}",
        "turnNumber": game.get("currentTurn", 1),
        "playerId": payload.playerId or "player_1",
        "playerName": payload.playerName or "Player",
        "actionType": payload.actionType or "move",
        "description": payload.description or "Performed turn action",
        "ruling": ruling,
        "timestamp": datetime.now().isoformat(),
    }

    moves = game.get("moves", [])
    moves.append(new_move)
    game["moves"] = moves

    if payload.actionType in ("pass", "move"):
        players = game.get("players", [])
        if players:
            new_idx = (game.get("activePlayerIndex", 0) + 1) % len(players)
            game["activePlayerIndex"] = new_idx
            if new_idx == 0:
                game["currentTurn"] = game.get("currentTurn", 1) + 1

    game["updatedAt"] = datetime.now().isoformat()
    save_json(GAMES_FILE, games)

    return {"move": new_move, "game": game}
