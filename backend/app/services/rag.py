"""Shared system-prompt loading for the game session and API server.

Put a RAG package for the game (a system_prompt.md + corpus_full.md pair) in a subfolder of
backend/resources/rags/. The Catan package is included by default.
"""

from pathlib import Path

# Point to backend/resources/rags/ from this file's location (backend/app/services/)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
RAGS_DIR = BASE_DIR / "resources" / "rags"

MODEL = "gemini-3.5-flash"

# Markers the model wraps its board-state transcription in, so the frontend can pull it out of
# the reply and show it in a dedicated, always-current panel instead of only in chat scrollback.
BOARD_STATE_START = "<!-- BOARD_STATE_START -->"
BOARD_STATE_END = "<!-- BOARD_STATE_END -->"

# The corpus itself is game content, not app behavior, so it doesn't say anything about our
# multi-photo turn-by-turn convention. This note bridges the two.
PHOTO_NOTE = """

## App-specific note: reading the attached photos

Photos may arrive one batch at a time, in chronological order (earliest first within a batch). \
The board and/or a player's hand is photographed again whenever it changes. Work out from each \
photo's content what it shows (whose turn, board vs. hand, what changed since the previous \
photo) before answering.

Some older photos may appear below as a bracketed "[Photo(s) summarized to save context]" text \
block instead of the original image — that's this app compacting old images out of context to \
save space. Treat the summary as a faithful description of what those photos showed.

## App-specific note: orienting custom boards and confirming the layout

Custom boards with hand-written or dot-less tokens (no pips) are especially easy to misread — \
coordinates, rotation, and the numbers themselves. When you read a new or changed board layout:

1. **Anchor to the harbors first.** Before assigning any hex coordinates, orient yourself using \
the harbor symbols on the outer sea frame — e.g. "the top-left harbor is 3:1, the top-right is \
2:1 Lumber" — so the 3-4-5-4-3 grid is never read rotated 180 degrees from the photo.
2. **Emit the board-state JSON snapshot** (see the "live board-state panel" note below) so the \
user can review the graphical board it renders, and explicitly ask them to confirm it's right \
before starting the game or suggesting any moves.
3. **Wait for the user to confirm** (the app has a dedicated button that replies exactly \
"CONFIRMED") before calculating production rolls or suggesting moves. If they correct a tile or \
number instead (e.g. "Row D1 is 11, not 10"), update the JSON snapshot immediately and ask again.

This audit-and-confirm step is only for reading a new or changed board *layout*. Once a layout \
is confirmed, treat it as settled — don't re-run the audit for photos that only change hands, \
dice, or pieces on that same layout.

## App-specific note: verifying inferred game events

Before accepting any inferred game event (a dice roll, a resource gain or loss, a trade, a \
build, a robbery), cross-check it against what is actually visible in the photo(s) and against \
the rules. Several different events can produce the same visible change (e.g. a hand gaining \
resources could be a dice production, a trade, or a bank transaction) — do not silently pick \
one explanation when more than one fits, and do not let a mismatch (e.g. dice shown vs. a \
resource change that doesn't match that roll) pass without comment. When you notice an \
ambiguity or inconsistency like this:

1. Say plainly what you observed and why it's ambiguous or doesn't add up.
2. Ask a specific, answerable question that would resolve it.
3. Wait for the user's answer before updating your understanding of the game state — don't guess \
and move on.

Only give a confident state summary once the current photo(s)/message leave no unresolved \
ambiguity you could instead ask about.

## App-specific note: bracketed app notes

Occasionally a message will contain a bracketed "[App note: ...]" sentence appended by this \
app itself, not typed by the user. Act on it naturally as part of your reply (e.g. by asking \
the user for something) but never quote the bracketed text back verbatim.

The app also has a green confirm button that, when pressed, sends the user's turn as exactly \
the word "CONFIRMED" with nothing else. Treat it as a general "yes, that's all correct" for \
whatever you most recently said or showed — not only for a board layout — and move on \
accordingly (e.g. proceed with the move advice, or drop the ambiguity you'd flagged).

## App-specific note: live board-state panel (structured data)

This app renders a graphical hex board from a JSON snapshot instead of parsing your prose. \
Whenever you know the current board state well enough to state it (after reading a photo, or \
after the user describes a change in text), emit exactly one JSON object wrapped like this, \
with nothing else on the marker lines and no markdown or comments inside it:

<<BOARD_STATE_START>>
{
  "hexes": {
    "A1": {"terrain": "hills", "number": 10},
    "A2": {"terrain": "pasture", "number": 11}
  },
  "robber": "C3",
  "harbors": [
    {"at": ["A1.N", "A1.NW"], "ratio": "3:1", "resource": null},
    {"at": ["A2.NW", "A2.N"], "ratio": "2:1", "resource": "wool"}
  ],
  "roads": [
    {"owner": "red", "between": ["C2.SE", "C3.S"]}
  ],
  "buildings": [
    {"owner": "red", "type": "settlement", "at": "C2.SE"},
    {"owner": "blue", "type": "city", "at": "C4.S"}
  ],
  "scores": {"red": 1, "blue": 3}
}
<<BOARD_STATE_END>>

Rules for this block:
- Hex keys use the catan-base-19hex-v1 ids (A1-A3, B1-B4, C1-C5, D1-D4, E1-E3). Include only \
hexes you actually know; leave unknown ones out rather than guessing.
- "terrain" is one of hills, pasture, fields, mountains, forest, desert ("number" is null for \
desert). Building "type" is settlement or city. "owner" is a lowercase color word (red, blue, \
white, orange, ...) — use the same word for the same player every time.
- "at" / "between" / a harbor's "at" pair use the HEX.DIR vertex notation (e.g. "C2.SE").
- Omit "robber", "harbors", "roads", "buildings", or "scores" entirely if you don't know them \
yet — don't invent placeholders.
- This is a full snapshot, not a diff: always include every hex/road/building/score you know \
so far, not just what changed this turn, so the panel doesn't lose anything already established.
- Must be strict, valid JSON — double-quoted keys and strings, no trailing commas, no comments.

This block is pulled out of your reply and rendered as a graphical board, so also give your \
normal conversational answer around it — don't reference "the panel" or "the JSON" in that \
answer, just write to the user as usual. After giving an updated snapshot, end your reply with \
a direct check like "Does this look right?" so the user can quickly confirm or correct it.""".replace(
    "<<BOARD_STATE_START>>", BOARD_STATE_START
).replace(
    "<<BOARD_STATE_END>>", BOARD_STATE_END
)


def load_rules(game: dict | None = None) -> str:
    """Load the system prompt + corpus for a game.

    If *game* has a ``ruleAnalysis`` / ``ruleSource`` already parsed by the structured
    backend, those take priority so the multi-turn session stays game-specific.
    Otherwise falls back to the RAG files on disk (Catan by default).
    """
    # --- Structured-backend path: rules already analysed and stored on the game object ---
    if game:
        ra = game.get("ruleAnalysis")
        rs = game.get("ruleSource")
        if ra:
            rules_text = (
                f"Game: {ra.get('title', 'Unknown')}\n"
                f"Overview: {ra.get('overview', '')}\n"
                f"Win Condition: {ra.get('winCondition', '')}\n"
                f"Turn Structure: {' -> '.join(ra.get('turnStructure', []))}\n"
                f"Core Rules: {'; '.join(ra.get('keyRules', []))}\n"
                f"Forbidden: {'; '.join(ra.get('forbiddenMoves', []))}\n"
                f"Teacher Tips: {'; '.join(ra.get('teacherTips', []))}\n"
                f"Player Strategy: {ra.get('playerStrategy', '')}"
            )
            return PHOTO_NOTE + "\n\n" + rules_text
        if rs and rs.get("textContent"):
            return PHOTO_NOTE + "\n\n" + rs["textContent"]

    # --- RAG-file path: load from disk ---
    system_prompt = next(RAGS_DIR.rglob("system_prompt.md"), None)
    corpus = next(RAGS_DIR.rglob("corpus_full.md"), None)
    if system_prompt and corpus:
        return (
            system_prompt.read_text(encoding="utf-8")
            + PHOTO_NOTE
            + "\n\n"
            + corpus.read_text(encoding="utf-8")
        )

    print(
        f"Warning: no system_prompt.md + corpus_full.md pair found under {RAGS_DIR}, "
        "falling back to concatenating any .txt/.md files found"
    )
    sections = [
        f"# {path.name}\n{path.read_text(encoding='utf-8')}"
        for path in sorted(RAGS_DIR.rglob("*"))
        if path.is_file() and path.suffix.lower() in (".txt", ".md")
    ]
    if not sections:
        print(f"Warning: no rules found in {RAGS_DIR}")
    return PHOTO_NOTE + "\n\n" + "\n\n".join(sections)
