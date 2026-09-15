import os
import json
import time
from typing import Any, Dict, List
from datetime import datetime
from backend.app.config import GAMES_FILE, USERS_FILE, DATA_DIR

DEFAULT_USERS: List[Dict[str, Any]] = [
    {
        "id": "user_alex",
        "username": "alex_master",
        "displayName": "Alex The Grandmaster",
        "avatar": "🧙‍♂️",
        "title": "Tabletop Veteran",
        "gamesPlayed": 14,
        "gamesWon": 9,
        "joinedAt": "2025-01-10",
    },
    {
        "id": "user_sarah",
        "username": "sarah_dice",
        "displayName": "Sarah DiceRoller",
        "avatar": "🎲",
        "title": "Board Game Champion",
        "gamesPlayed": 21,
        "gamesWon": 12,
        "joinedAt": "2025-02-04",
    },
    {
        "id": "user_marcus",
        "username": "marcus_judge",
        "displayName": "Marcus Arbiter",
        "avatar": "⚖️",
        "title": "Tournament Judge",
        "gamesPlayed": 8,
        "gamesWon": 4,
        "joinedAt": "2025-03-01",
    },
]

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
- You cannot build during another player's turn unless explicitly traded.
- Trading with the bank is 4 identical resources for 1 of your choice unless at a Harbor.""",
    },
    "monopoly_deal": {
        "title": "Property Duel (Card Battle Rules)",
        "overview": "Fast-paced card game where players collect 3 complete property sets of different colors to win.",
        "text": """PROPERTY DUEL - CORE RULES
1. OBJECTIVE: First player to complete 3 full property sets of different colors wins the game.

2. SETUP & CARDS:
- Each player starts with 5 cards.
- On your turn: Draw 2 cards. Play up to 3 cards into your play area. Hand limit at end of turn is 7 cards (discard excess).
- Cards can be played as: Money (in bank), Properties (in collection), or Action Cards.

3. ACTIONS & CONSTRAINTS:
- Rent: Charge all opponents rent for properties you own in that color. Opponents pay from their bank or properties (no change given).
- Deal Breaker: Steal a completed property set from an opponent. (Can be cancelled by 'Just Say No').
- Forced Deal: Swap one of your properties for an opponent's property.
- Just Say No: Can be played at ANY time to cancel an action played against you.
- Sly Deal: Steal an incomplete single property from an opponent.""",
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

DEFAULT_GAMES: List[Dict[str, Any]] = [
    {
        "id": "game_starter_catan",
        "userId": "user_alex",
        "title": "Catan Island Express Championship",
        "category": "board_game",
        "createdAt": datetime.fromtimestamp(time.time() - 3600).isoformat(),
        "updatedAt": datetime.now().isoformat(),
        "status": "in_progress",
        "currentTurn": 3,
        "activePlayerIndex": 0,
        "activeChatbotRole": "teacher",
        "players": [
            {"id": "p1", "name": "Alex The Grandmaster", "isAi": False, "score": 4, "color": "#3B82F6", "status": "active"},
            {"id": "p2", "name": "AI Opponent (Bot)", "isAi": True, "score": 3, "color": "#10B981", "status": "active"},
        ],
        "ruleSource": {
            "fileName": "catan_express_rules.pdf",
            "fileType": "preset",
            "fileSize": "142.5 KB",
            "uploadedAt": datetime.fromtimestamp(time.time() - 3600).isoformat(),
            "hasPdf": False,
            "textContent": "Catan Island Express Official Rules: Hex resource production, trading, road and settlement construction, distance rules, 10 Victory Points to win.",
        },
        "ruleAnalysis": {
            "title": "Catan Island Express",
            "overview": "Players establish settlements and roads across resource hexes (Wood, Brick, Wheat, Sheep, Ore) driven by dice rolls to reach 10 Victory Points.",
            "winCondition": "First player to accumulate 10 Victory Points through settlements, cities, and longest road.",
            "turnStructure": [
                "Phase 1: Roll 2d6 to determine hex production (7 activates the Robber)",
                "Phase 2: Trade resources with opponents or bank",
                "Phase 3: Spend resources to build roads, settlements, or cities",
                "Phase 4: Pass turn to next player clockwise",
            ],
            "keyRules": [
                "Hexes matching dice roll produce cards for adjacent settlements.",
                "Distance Rule: Every settlement must have at least 2 empty road edges between itself and any other settlement.",
                "Cities replace existing settlements and produce 2 resource cards.",
            ],
            "forbiddenMoves": [
                "Building a settlement adjacent to another settlement (violates distance rule)",
                "Building roads or settlements without a continuous connected network",
                "Trading during an opponent's turn without agreement",
            ],
            "teacherTips": [
                "Secure diverse resource numbers (e.g. 6, 8, 5, 9) early on.",
                "Plan your road path toward coastal harbors for favorable trade ratios.",
            ],
            "judgeChecklist": [
                "Verify intersection vacancy and distance constraints before settlement construction",
                "Check resource card deductions match building costs",
            ],
            "playerStrategy": "Prioritize road expansion toward 6-Ore and 8-Wheat to build cities early.",
        },
        "moves": [
            {
                "id": "m_1",
                "turnNumber": 1,
                "playerId": "p1",
                "playerName": "Alex The Grandmaster",
                "actionType": "move",
                "description": "Placed initial settlement at [6 Forest / 8 Hill] intersection and connected 1 road segment heading East.",
                "timestamp": datetime.fromtimestamp(time.time() - 2400).isoformat(),
            },
            {
                "id": "m_2",
                "turnNumber": 1,
                "playerId": "p2",
                "playerName": "AI Opponent (Bot)",
                "actionType": "move",
                "description": "Placed settlement at [5 Field / 9 Pasture] and built road toward Harbor.",
                "timestamp": datetime.fromtimestamp(time.time() - 1800).isoformat(),
            },
            {
                "id": "m_3",
                "turnNumber": 2,
                "playerId": "p1",
                "playerName": "Alex The Grandmaster",
                "actionType": "move",
                "description": "Rolled 2d6 = 8! Collected 1 Brick from Hill hex. Built road extension toward Gold Coast.",
                "ruling": {
                    "isLegal": True,
                    "judgeComment": "Road connects continuously to existing network and cost was paid.",
                    "ruleCitation": "Section 3.1 Road Building",
                },
                "timestamp": datetime.fromtimestamp(time.time() - 900).isoformat(),
            },
        ],
        "chatHistory": [
            {
                "id": "c_1",
                "sender": "bot",
                "role": "teacher",
                "text": "Welcome to Catan Island Express! I have analyzed the uploaded rulebook PDF. The victory condition is 10 Victory Points. Turn 3 is active and it is your roll!",
                "timestamp": datetime.fromtimestamp(time.time() - 3600).isoformat(),
            },
            {
                "id": "c_2",
                "sender": "user",
                "role": "teacher",
                "text": "What do I need to build a city again?",
                "timestamp": datetime.fromtimestamp(time.time() - 1200).isoformat(),
            },
            {
                "id": "c_3",
                "sender": "bot",
                "role": "teacher",
                "text": "According to the rules, a City requires 2 Wheat + 3 Ore. A city must replace an existing settlement you already own, and it awards 2 Victory Points instead of 1, plus doubles your resource output on that intersection!",
                "timestamp": datetime.fromtimestamp(time.time() - 1100).isoformat(),
            },
        ],
        "boardNotes": "Alex holds 1 Wood, 2 Brick, 1 Sheep. Bot is expanding toward the 3:1 Port.",
        "photos": [],
        "milestones": [
            {"id": "ms_1", "title": "First Settlement", "description": "Construct initial territory outpost", "completed": True, "completedByPlayerId": "p1", "turnAchieved": 1},
            {"id": "ms_2", "title": "Longest Road Contender", "description": "Build 5 continuous road segments", "completed": False},
            {"id": "ms_3", "title": "First City Upgrade", "description": "Upgrade settlement to productive metropolis", "completed": False},
        ],
    }
]

def load_json(path: str, default_val: Any) -> Any:
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {path}: {e}")
    return default_val

def save_json(path: str, data: Any):
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving {path}: {e}")

def init_db():
    if not os.path.exists(USERS_FILE):
        save_json(USERS_FILE, DEFAULT_USERS)
    if not os.path.exists(GAMES_FILE):
        save_json(GAMES_FILE, DEFAULT_GAMES)
    else:
        existing = load_json(GAMES_FILE, [])
        if not existing:
            save_json(GAMES_FILE, DEFAULT_GAMES)

init_db()
