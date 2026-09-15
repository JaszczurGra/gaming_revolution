"""In-memory Gemini game session for multi-turn chat with photo support.

Unlike a single-shot generate_content() call, this keeps the conversation's
``contents`` as a plain list we control ourselves. That lets us:

- Compact old photos out of context once enough new ones have arrived, so a long game doesn't
  make every turn resend every photo ever taken (Gemini's chat history has no built-in way to
  edit past turns).
- Inject a one-off app note into a single turn (e.g. periodically nudging the model to ask for
  a fresh photo) without permanently changing the system prompt.
- Stay game-aware: the system prompt is loaded from the game's ruleAnalysis / ruleSource when
  available, falling back to the on-disk Catan RAG corpus.
"""

import threading
from typing import Any

from google import genai
from google.genai import types

from backend.app.services.rag import MODEL, load_rules

# How many of the most recent photo-upload turns are kept as raw images in context. Once a new
# upload pushes the count above this, the oldest excess turns are collapsed into a text summary.
MAX_RAW_PHOTO_TURNS = 6

# How many consecutive text-only turns (no new photo) are allowed before we nudge the model to
# ask the user for an updated photo, since a user can otherwise keep chatting by text
# indefinitely while the real board state silently drifts out of sync with what the model saw.
PHOTO_REMINDER_INTERVAL = 5

PHOTO_REMINDER_NOTE = (
    "\n\n[App note: several messages have passed since the last photo upload. If answering this "
    "well depends on the current board or hand state, ask the user to upload an updated photo "
    "rather than assuming nothing has changed since the last one.]"
)

SUMMARIZE_PROMPT = (
    "Summarize the game-relevant content of the photo(s) above in a short paragraph: whose "
    "turn/board/hand it is, resources or pieces visible, any dice or numbers shown, and "
    "buildings/roads placed. Be factual and concise — this summary will replace the photo(s) "
    "in context from now on."
)


class GameSession:
    """Multi-turn Gemini session for one game, with smart photo compaction."""

    def __init__(self, game: dict[str, Any] | None = None):
        """
        Args:
            game: The game dict from storage (optional). When provided, the system prompt is
                  derived from ``game['ruleAnalysis']`` / ``game['ruleSource']``, so the
                  session is rule-aware for the specific game being played.
        """
        self.client = genai.Client()
        self.game = game  # may be updated via update_game()
        self.contents: list[types.Content] = []
        self.history: list[dict] = []  # simplified chat records for the API response
        self.photos_uploaded = 0
        self.turns_since_photo = 0
        self._lock = threading.Lock()

    def update_game(self, game: dict[str, Any]) -> None:
        """Refresh the game context (e.g. after rule analysis completes)."""
        with self._lock:
            self.game = game

    def to_dict(self) -> dict:
        return {
            "messages": self.history,
            "photosUploaded": self.photos_uploaded,
        }

    def add_photos(self, photos: list[tuple[bytes, str]], caption: str = "") -> str:
        """Add a batch of photos to the session and get the model's reply.

        Args:
            photos: List of (raw_bytes, mime_type) in chronological order.
            caption: Optional text the user typed alongside the photos.
        """
        with self._lock:
            image_parts = [
                types.Part.from_bytes(data=data, mime_type=mime) for data, mime in photos
            ]
            start = self.photos_uploaded + 1
            self.photos_uploaded += len(image_parts)
            intro = (
                f"Here {'is' if len(image_parts) == 1 else 'are'} photo(s) "
                f"{start}-{self.photos_uploaded} (chronological order, earliest first). Work out "
                "what changed and give a short update."
            )
            if caption.strip():
                intro += f"\n\nThe user also says: {caption.strip()}"
            content = types.Content(
                role="user", parts=[*image_parts, types.Part.from_text(text=intro)]
            )

            self.turns_since_photo = 0
            self.history.append(
                {"role": "user", "text": caption.strip(), "photoCount": len(image_parts)}
            )
            reply = self._generate(content)
            self.history.append({"role": "assistant", "text": reply, "photoCount": 0})
            self._compact_old_photos()
            return reply

    def send_text(self, text: str) -> str:
        """Send a plain-text message and get the model's reply."""
        text = text.strip()
        with self._lock:
            message = text
            self.turns_since_photo += 1
            if self.photos_uploaded and self.turns_since_photo >= PHOTO_REMINDER_INTERVAL:
                message += PHOTO_REMINDER_NOTE
                self.turns_since_photo = 0
            content = types.Content(role="user", parts=[types.Part.from_text(text=message)])

            self.history.append({"role": "user", "text": text, "photoCount": 0})
            reply = self._generate(content)
            self.history.append({"role": "assistant", "text": reply, "photoCount": 0})
            return reply

    def _generate(self, user_content: types.Content) -> str:
        self.contents.append(user_content)
        response = self.client.models.generate_content(
            model=MODEL,
            contents=self.contents,
            config=types.GenerateContentConfig(
                system_instruction=load_rules(self.game)
            ),
        )
        text = response.text or "(empty response)"
        self.contents.append(
            types.Content(role="model", parts=[types.Part.from_text(text=text)])
        )
        return text

    def _compact_old_photos(self) -> None:
        photo_turn_indices = [
            i
            for i, content in enumerate(self.contents)
            if content.role == "user" and any(part.inline_data for part in content.parts)
        ]
        if len(photo_turn_indices) <= MAX_RAW_PHOTO_TURNS:
            return
        for i in photo_turn_indices[:-MAX_RAW_PHOTO_TURNS]:
            content = self.contents[i]
            image_parts = [p for p in content.parts if p.inline_data]
            text_parts = [p for p in content.parts if not p.inline_data]
            if not image_parts:
                continue
            summary = self._summarize_photos(image_parts)
            content.parts = [
                types.Part.from_text(text=f"[Photo(s) summarized to save context]\n{summary}"),
                *text_parts,
            ]

    def _summarize_photos(self, image_parts: list) -> str:
        response = self.client.models.generate_content(
            model=MODEL,
            contents=[
                types.Content(
                    role="user", parts=[*image_parts, types.Part.from_text(text=SUMMARIZE_PROMPT)]
                )
            ],
            config=types.GenerateContentConfig(system_instruction=load_rules(self.game)),
        )
        return response.text or "(summary unavailable)"
