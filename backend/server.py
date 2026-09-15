"""FastAPI backend for the web chat UI.

Run with: uvicorn server:app --reload --host 0.0.0.0 --port 8000
(--host 0.0.0.0 makes it reachable from other devices, e.g. over Tailscale;
drop it to keep the server local-only.)
"""

import mimetypes

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from game_session import GameSession

load_dotenv()

app = FastAPI(title="Board Game Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_session: GameSession | None = None


def get_session() -> GameSession:
    global _session
    if _session is None:
        try:
            _session = GameSession()
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Could not create Gemini client (check GEMINI_API_KEY): {e}"
            ) from e
    return _session


def _read_image(upload: UploadFile) -> tuple[bytes, str]:
    mime_type = upload.content_type
    if not mime_type or not mime_type.startswith("image/"):
        mime_type, _ = mimetypes.guess_type(upload.filename or "")
    if not mime_type or not mime_type.startswith("image/"):
        raise HTTPException(status_code=400, detail=f"'{upload.filename}' is not an image")
    return upload.file.read(), mime_type


@app.get("/api/history")
def get_history():
    return get_session().to_dict()


@app.post("/api/reset")
def reset():
    global _session
    _session = None
    return get_session().to_dict()


@app.post("/api/turn")
def turn(files: list[UploadFile] = File(default=[]), text: str = Form(default="")):
    files = [f for f in files if f.filename]
    if not files and not text.strip():
        raise HTTPException(status_code=400, detail="Send a photo, a message, or both")

    session = get_session()
    try:
        if files:
            photos = [_read_image(f) for f in files]
            session.add_photos(photos, caption=text)
        else:
            session.send_text(text)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error talking to Gemini: {e}") from e

    return session.to_dict()
