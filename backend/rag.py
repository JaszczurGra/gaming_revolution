"""Shared system-prompt loading for the CLI (main.py) and the web API (server.py).

Put a RAG package for the game (a system_prompt.md + corpus_full.md pair, see the README next
to them) in a subfolder of resources/rags/.
"""

from pathlib import Path

BASE_DIR = Path(__file__).parent
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

## App-specific note: live board-state panel

This app shows a separate, always-visible "current board state" panel next to the chat, so the \
user does not have to scroll back to see it. Whenever you know the current board state (after \
reading a photo, or after the user describes a change in text) well enough to state it, \
re-emit the *complete* board-state transcription — hex/terrain/token grid, robber, harbors, \
every player's roads/settlements/cities, and visible scores — wrapped exactly like this,
with nothing else on the marker lines:

{BOARD_STATE_START}
...the full transcription, in your normal format...
{BOARD_STATE_END}

This block is pulled out of your reply and only shown in the panel, so also give your normal \
conversational answer around it — don't reference "the panel" or "the block" in that answer, \
just write to the user as usual.

Keep the coordinate system and layout convention (row/hex numbering, the HEX.DIR notation, \
section headings, etc.) byte-for-byte identical every time you emit this block — only the \
facts inside it (pieces, robber position, scores) should change turn to turn. The panel \
re-renders this block in place, so changing the format would look like the map broke rather \
than updated. If you don't yet know enough to state the full board state, omit the whole \
block rather than guessing or emitting a partial one.""".format(
    BOARD_STATE_START=BOARD_STATE_START, BOARD_STATE_END=BOARD_STATE_END
)


def load_rules() -> str:
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
