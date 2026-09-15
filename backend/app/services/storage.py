import os
import json
from typing import Any, Dict, List

from backend.app.config import GAMES_FILE, USERS_FILE

# ---------------------------------------------------------------------------
# Default seed data
# ---------------------------------------------------------------------------

DEFAULT_USERS: List[Dict[str, Any]] = [
    {
        "id": "user_alex",
        "username": "alex_master",
        "displayName": "Alex The Grandmaster",
        "avatar": "🧙‍♂️",
        "title": "Tabletop Veteran",
        "gamesPlayed": 0,
        "gamesWon": 0,
        "joinedAt": "2026-01-10",
    },
    {
        "id": "user_sarah",
        "username": "sarah_dice",
        "displayName": "Sarah DiceRoller",
        "avatar": "🎲",
        "title": "Board Game Champion",
        "gamesPlayed": 0,
        "gamesWon": 0,
        "joinedAt": "2026-02-04",
    },
    {
        "id": "user_marcus",
        "username": "marcus_judge",
        "displayName": "Marcus Arbiter",
        "avatar": "⚖️",
        "title": "Tournament Judge",
        "gamesPlayed": 0,
        "gamesWon": 0,
        "joinedAt": "2026-03-01",
    },
]

# Games start empty — players create their own via the UI.
DEFAULT_GAMES: List[Dict[str, Any]] = []

# ---------------------------------------------------------------------------
# Preset rule texts (used by /api/presets and rule_parser.py)
# ---------------------------------------------------------------------------

PRESET_RULES: Dict[str, Dict[str, str]] = {
    "catan_lite": {
        "title": "Catan Island Express Rules",
        "overview": "Players gather resources (Wood, Brick, Wheat, Sheep, Ore) by rolling dice each turn and build roads and settlements to reach 10 Victory Points.",
        "text": """CATAN ISLAND EXPRESS - OFFICIAL RULES
1. OBJECTIVE: First player to achieve 10 Victory Points (VP) wins immediately.
Settlement = 1 VP, City = 2 VP, Longest Road = 2 VP, Largest Army = 2 VP.

2. TURN PHASES:
Phase 1: Roll two 6-sided dice (2-12). Hexes with the rolled number produce resource cards for players with adjacent settlements/cities (1 card per settlement, 2 per city).
Rolling a 7: Discard half your hand if you have >7 cards. Move the Robber to any tile, blocking its production and stealing 1 random card from an adjacent player.
Phase 2: Trading. Active player may trade cards with other players or with the bank (4:1 or port rate).
Phase 3: Building. Spend resources to build:
- Road (1 Wood + 1 Brick): Must connect to your network.
- Settlement (1 Wood + 1 Brick + 1 Wheat + 1 Sheep): Must connect to your road and be at least 2 edges away from ANY other settlement (Distance Rule).
- City (2 Wheat + 3 Ore): Replaces an existing settlement.
- Development Card (1 Wheat + 1 Sheep + 1 Ore): Knights, victory points, or progress cards.

3. KEY CONSTRAINTS & FORBIDDEN MOVES:
- Distance Rule: A settlement cannot be built adjacent to an intersection already occupied by any settlement/city. There must be at least 2 empty road segments between settlements.
- You cannot build roads or settlements that are not connected to your own existing network.
- You may not trade during another player's turn without their agreement.
- A player may only play one Development Card per turn and only after rolling the dice.

4. SPECIAL RULES:
- Longest Road: Player with 5+ continuous road segments gets 2 VP. Stolen immediately if another player builds a longer road.
- Largest Army: Player who has played 3+ Knight cards gets 2 VP. Stolen if another player plays more Knights.
- Initial Placement: Each player places 2 settlements and 2 roads in reverse snake draft order before turn 1. Second settlement collects resources from adjacent hexes immediately.""",
    },
    "chess_lite": {
        "title": "Chess Standard Rules",
        "overview": "Two players move pieces across an 8×8 board aiming to checkmate the opponent's King.",
        "text": """CHESS - STANDARD RULES
1. OBJECTIVE: Checkmate your opponent's King (threaten capture with no escape).

2. PIECE MOVEMENTS:
- King: One square any direction.
- Queen: Any number of squares diagonally, horizontally, or vertically.
- Rook: Any number of squares horizontally or vertically.
- Bishop: Any number of squares diagonally.
- Knight: L-shape (2+1 squares). Can jump over pieces.
- Pawn: Forward 1 square (or 2 from start). Captures diagonally.

3. SPECIAL MOVES:
- Castling: King moves 2 squares toward Rook; Rook jumps to the other side. Requires neither piece has moved; no squares in path are attacked; King not in check.
- En Passant: A pawn that has just moved 2 squares can be captured by an opponent's pawn as if it moved only 1.
- Promotion: Pawn reaching the back rank promotes to Queen, Rook, Bishop, or Knight.

4. FORBIDDEN MOVES:
- Moving into check.
- Leaving your King in check.
- Moving a pinned piece that would expose the King.""",
    },
    "dungeon_dice": {
        "title": "Dungeon & Dragon Dice (TTRPG Mini Rules)",
        "overview": "A tactical tabletop encounter where the Hero explores rooms, battles monsters, and rolls d20 checks to conquer the dungeon.",
        "text": """DUNGEON & DRAGON DICE - MINI ENCOUNTER RULES
1. OBJECTIVE: Reach the Dragon's Sanctum (Room 4) and defeat the Guardian Dragon or recover the Sunstone.

2. TURN STRUCTURE:
Turn = 1 Action + 1 Movement + 1 Reaction.
Action: Attack (Roll 1d20 + Attack Mod vs Monster AC), Cast Spell (Cost 1 Mana), Drink Potion, or Disengage.
Defense: Monster strikes back on its turn. Rolling a 1 is a Critical Miss; rolling a 20 is a Critical Hit (double damage dice).

3. STATS:
Hero HP: 25. Armor Class (AC): 14. Attack Mod: +4. Damage: 1d8 + 2.
Mana: 3 slots. Heal Spell: restores 2d6 HP. Firebolt: deals 2d8 damage.""",
    },
}

# ---------------------------------------------------------------------------
# JSON helpers
# ---------------------------------------------------------------------------


def load_json(path: str, default_val: Any) -> Any:
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {path}: {e}")
    return default_val


def save_json(path: str, data: Any) -> None:
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving {path}: {e}")


def init_db() -> None:
    """Seed the JSON database files on first startup."""
    if not os.path.exists(USERS_FILE):
        save_json(USERS_FILE, DEFAULT_USERS)
    if not os.path.exists(GAMES_FILE):
        save_json(GAMES_FILE, DEFAULT_GAMES)


init_db()
