"""CLI assistant that watches a board game unfold through photos and answers questions about it.

Put a RAG package for the game (a system_prompt.md + corpus_full.md pair, see the README next
to them) in a subfolder of resources/rags/, and the sequence of gameplay photos (numbered so
they sort in order, e.g. 1.jpg, 2.jpg, ...) in resources/imgs/.
"""

import mimetypes
import re
import sys
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types

from rag import BASE_DIR, MODEL, load_rules

IMGS_DIR = BASE_DIR / "resources" / "imgs"


def _sort_key(path: Path):
    match = re.search(r"\d+", path.stem)
    return (int(match.group()) if match else float("inf"), path.name)


def load_images() -> list[types.Part]:
    parts = []
    for path in sorted(IMGS_DIR.glob("*"), key=_sort_key):
        mime_type, _ = mimetypes.guess_type(path.name)
        if not mime_type or not mime_type.startswith("image/"):
            continue
        parts.append(types.Part.from_bytes(data=path.read_bytes(), mime_type=mime_type))
    if not parts:
        print(f"Warning: no images found in {IMGS_DIR}")
    return parts


def main():
    load_dotenv()
    try:
        client = genai.Client()
    except Exception as e:
        sys.exit(f"Could not create Gemini client (check GEMINI_API_KEY in .env): {e}")

    chat = client.chats.create(
        model=MODEL,
        config=types.GenerateContentConfig(system_instruction=load_rules()),
    )

    images = load_images()
    print(f"Sending {len(images)} photo(s) to Gemini...")
    intro = (
        f"Here are {len(images)} photos in chronological order (photo 1 is earliest). "
        "Work out what each one shows and give me a short summary of the game so far."
    )
    try:
        response = chat.send_message([*images, intro])
    except Exception as e:
        sys.exit(f"Error talking to Gemini: {e}")
    print("\nGemini:", response.text)

    print("\nAsk about errors, best moves, etc. Type 'exit' to quit.\n")
    while True:
        try:
            question = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            break
        if question.lower() in ("exit", "quit"):
            break
        if not question:
            continue
        try:
            response = chat.send_message(question)
            print("Gemini:", response.text)
        except Exception as e:
            print(f"Error talking to Gemini: {e}")


if __name__ == "__main__":
    main()
