#!/usr/bin/env bash
set -e

echo "=== Starting GamePlay Companion FastAPI Backend ==="
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
echo "Installing dependencies from requirements.txt..."
pip install -r requirements.txt

echo "Starting Uvicorn server on http://0.0.0.0:3000..."
uvicorn main:app --host 0.0.0.0 --port 3000 --reload
