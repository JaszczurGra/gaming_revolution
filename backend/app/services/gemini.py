from typing import Optional
from google import genai
from backend.app.config import GEMINI_API_KEY

_client: Optional[genai.Client] = None

def get_gemini_client() -> Optional[genai.Client]:
    global _client
    if not GEMINI_API_KEY:
        return None
    if _client is None:
        _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client

MODEL_NAME = "gemini-3.5-flash"
