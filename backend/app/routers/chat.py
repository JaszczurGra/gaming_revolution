from datetime import datetime
from fastapi import APIRouter, HTTPException

from backend.app.config import GAMES_FILE
from backend.app.models.chat import ChatRequest
from backend.app.services.storage import load_json, save_json
from backend.app.services.arbiter import generate_chat_response

router = APIRouter(tags=["AI Companion Chat"])

@router.post("/api/games/{game_id}/chat")
def chat_with_companion(game_id: str, payload: ChatRequest):
    try:
        games = load_json(GAMES_FILE, [])
        game = next((g for g in games if g.get("id") == game_id), None)
        if not game:
            raise HTTPException(status_code=404, detail="Game not found")

        active_role = payload.role or game.get("activeChatbotRole") or "teacher"
        game["activeChatbotRole"] = active_role

        user_msg = {
            "id": f"msg_u_{int(datetime.now().timestamp() * 1000)}",
            "sender": "user",
            "role": active_role,
            "text": payload.message,
            "timestamp": datetime.now().isoformat(),
        }
        history = game.get("chatHistory", [])
        history.append(user_msg)
        game["chatHistory"] = history

        bot_result = generate_chat_response(
            game=game,
            role=active_role,
            user_message=payload.message,
        )

        bot_msg = {
            "id": f"msg_b_{int(datetime.now().timestamp() * 1000)}",
            "sender": "bot",
            "role": active_role,
            "text": bot_result.get("text", "I have received your message."),
            "timestamp": datetime.now().isoformat(),
            "citation": bot_result.get("citation"),
            "suggestedAction": bot_result.get("suggestedAction"),
        }
        history.append(bot_msg)
        game["chatHistory"] = history
        game["updatedAt"] = datetime.now().isoformat()
        save_json(GAMES_FILE, games)

        return {"message": bot_msg, "game": game}
    except Exception as e:
        print(f"Chat route error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
