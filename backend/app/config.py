import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = os.environ.get("DATA_DIR", str(BASE_DIR / "data"))
DIST_DIR = os.environ.get("DIST_DIR", str(BASE_DIR / "dist"))

GAMES_FILE = os.path.join(DATA_DIR, "games.json")
USERS_FILE = os.path.join(DATA_DIR, "users.json")

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# Environment variables
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
PORT = int(os.environ.get("PORT", 3000))
