import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// High limit for PDF and image uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Data storage directories
const DATA_DIR = path.join(process.cwd(), "data");
const GAMES_FILE = path.join(DATA_DIR, "games.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Preset Users
const DEFAULT_USERS = [
  {
    id: "user_alex",
    username: "alex_master",
    displayName: "Alex The Grandmaster",
    avatar: "🧙‍♂️",
    title: "Tabletop Veteran",
    gamesPlayed: 14,
    gamesWon: 9,
    joinedAt: "2025-01-10",
  },
  {
    id: "user_sarah",
    username: "sarah_dice",
    displayName: "Sarah DiceRoller",
    avatar: "🎲",
    title: "Board Game Champion",
    gamesPlayed: 21,
    gamesWon: 12,
    joinedAt: "2025-02-04",
  },
  {
    id: "user_marcus",
    username: "marcus_judge",
    displayName: "Marcus Arbiter",
    avatar: "⚖️",
    title: "Tournament Judge",
    gamesPlayed: 8,
    gamesWon: 4,
    joinedAt: "2025-03-01",
  },
];

// Helper to load/save JSON
function loadData<T>(file: string, fallback: T): T {
  try {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, "utf-8");
      return JSON.parse(content) as T;
    }
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
  }
  return fallback;
}

function saveData<T>(file: string, data: T): void {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error writing ${file}:`, err);
  }
}

// Initialize users file if missing
if (!fs.existsSync(USERS_FILE)) {
  saveData(USERS_FILE, DEFAULT_USERS);
}

const DEFAULT_GAMES = [
  {
    id: "game_starter_catan",
    userId: "user_alex",
    title: "Catan Island Express Championship",
    category: "board_game",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date().toISOString(),
    status: "in_progress",
    currentTurn: 3,
    activePlayerIndex: 0,
    activeChatbotRole: "teacher",
    players: [
      { id: "p1", name: "Alex The Grandmaster", isAi: false, score: 4, color: "#3B82F6", status: "active" },
      { id: "p2", name: "AI Opponent (Bot)", isAi: true, score: 3, color: "#10B981", status: "active" },
    ],
    ruleSource: {
      fileName: "catan_express_rules.pdf",
      fileType: "preset",
      fileSize: "142.5 KB",
      uploadedAt: new Date(Date.now() - 3600000).toISOString(),
      hasPdf: false,
      textContent: "Catan Island Express Official Rules: Hex resource production, trading, road and settlement construction, distance rules, 10 Victory Points to win.",
    },
    ruleAnalysis: {
      title: "Catan Island Express",
      overview: "Players establish settlements and roads across resource hexes (Wood, Brick, Wheat, Sheep, Ore) driven by dice rolls to reach 10 Victory Points.",
      winCondition: "First player to accumulate 10 Victory Points through settlements, cities, and longest road.",
      turnStructure: [
        "Phase 1: Roll 2d6 to determine hex production (7 activates the Robber)",
        "Phase 2: Trade resources with opponents or bank",
        "Phase 3: Spend resources to build roads, settlements, or cities",
        "Phase 4: Pass turn to next player clockwise"
      ],
      keyRules: [
        "Hexes matching dice roll produce cards for adjacent settlements.",
        "Distance Rule: Every settlement must have at least 2 empty road edges between itself and any other settlement.",
        "Cities replace existing settlements and produce 2 resource cards."
      ],
      forbiddenMoves: [
        "Building a settlement adjacent to another settlement (violates distance rule)",
        "Building roads or settlements without a continuous connected network",
        "Trading during an opponent's turn without agreement"
      ],
      teacherTips: [
        "Secure diverse resource numbers (e.g. 6, 8, 5, 9) early on.",
        "Plan your road path toward coastal harbors for favorable trade ratios."
      ],
      judgeChecklist: [
        "Verify intersection vacancy and distance constraints before settlement construction",
        "Check resource card deductions match building costs"
      ],
      playerStrategy: "Prioritize road expansion toward 6-Ore and 8-Wheat to build cities early.",
    },
    moves: [
      {
        id: "m_1",
        turnNumber: 1,
        playerId: "p1",
        playerName: "Alex The Grandmaster",
        actionType: "move",
        description: "Placed initial settlement at [6 Forest / 8 Hill] intersection and connected 1 road segment heading East.",
        timestamp: new Date(Date.now() - 2400000).toISOString(),
      },
      {
        id: "m_2",
        turnNumber: 1,
        playerId: "p2",
        playerName: "AI Opponent (Bot)",
        actionType: "move",
        description: "Placed settlement at [5 Field / 9 Pasture] and built road toward Harbor.",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: "m_3",
        turnNumber: 2,
        playerId: "p1",
        playerName: "Alex The Grandmaster",
        actionType: "move",
        description: "Rolled 2d6 = 8! Collected 1 Brick from Hill hex. Built road extension toward Gold Coast.",
        ruling: {
          isLegal: true,
          judgeComment: "Road connects continuously to existing network and cost was paid.",
          ruleCitation: "Section 3.1 Road Building",
        },
        timestamp: new Date(Date.now() - 900000).toISOString(),
      }
    ],
    chatHistory: [
      {
        id: "c_1",
        sender: "bot",
        role: "teacher",
        text: "Welcome to Catan Island Express! I have analyzed the uploaded rulebook PDF. The victory condition is 10 Victory Points. Turn 3 is active and it is your roll!",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "c_2",
        sender: "user",
        role: "teacher",
        text: "What do I need to build a city again?",
        timestamp: new Date(Date.now() - 1200000).toISOString(),
      },
      {
        id: "c_3",
        sender: "bot",
        role: "teacher",
        text: "According to the rules, a City requires 2 Wheat + 3 Ore. A city must replace an existing settlement you already own, and it awards 2 Victory Points instead of 1, plus doubles your resource output on that intersection!",
        timestamp: new Date(Date.now() - 1100000).toISOString(),
      }
    ],
    boardNotes: "Alex holds 1 Wood, 2 Brick, 1 Sheep. Bot is expanding toward the 3:1 Port.",
    photos: [],
    milestones: [
      { id: "ms_1", title: "First Settlement", description: "Construct initial territory outpost", targetPoints: 1, completed: true, completedByPlayerId: "p1" },
      { id: "ms_2", title: "Longest Road Contender", description: "Build 5 continuous road segments", targetPoints: 2, completed: false },
      { id: "ms_3", title: "First City Upgrade", description: "Upgrade settlement to productive metropolis", targetPoints: 2, completed: false }
    ],
    boardAnalysisHistory: []
  }
];

if (!fs.existsSync(GAMES_FILE)) {
  saveData(GAMES_FILE, DEFAULT_GAMES);
} else {
  const existing = loadData<any[]>(GAMES_FILE, []);
  if (existing.length === 0) {
    saveData(GAMES_FILE, DEFAULT_GAMES);
  }
}

// Sample starter game rule presets
const PRESET_RULES: Record<string, { title: string; text: string; overview: string }> = {
  catan_lite: {
    title: "Catan Island Express Rules",
    overview: "Players gather resources (Wood, Brick, Wheat, Sheep, Ore) by rolling dice each turn and build roads and settlements to reach 10 Victory Points.",
    text: `CATAN ISLAND EXPRESS - OFFICIAL RULES
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
- Trading with the bank is 4 identical resources for 1 of your choice unless at a Harbor.`
  },
  monopoly_deal: {
    title: "Property Duel (Card Battle Rules)",
    overview: "Fast-paced card game where players collect 3 complete property sets of different colors to win.",
    text: `PROPERTY DUEL - CORE RULES
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
- Sly Deal: Steal an incomplete single property from an opponent.`
  },
  dungeon_dice: {
    title: "Dungeon & Dragon Dice (TTRPG Mini Rules)",
    overview: "A tactical tabletop encounter where the Hero explores rooms, battles monsters, and rolls d20 checks to conquer the dungeon.",
    text: `DUNGEON & DRAGON DICE - MINI ENCOUNTER RULES
1. OBJECTIVE: Reach the Dragon's Sanctum (Room 4) and defeat the Guardian Dragon or recover the Sunstone.

2. TURN STRUCTURE:
Turn = 1 Action + 1 Movement + 1 Reaction.
Action: Attack (Roll 1d20 + Attack Mod vs Monster AC), Cast Spell (Cost 1 Mana), Drink Potion, or Disengage.
Defense: Monster strikes back on its turn. Rolling a 1 is a Critical Miss; rolling a 20 is a Critical Hit (double damage dice).

3. STATS:
Hero HP: 25. Armor Class (AC): 14. Attack Mod: +4. Damage: 1d8 + 2.
Mana: 3 slots. Heal Spell: restores 2d6 HP. Firebolt: deals 2d8 damage.`
  }
};

// Gemini API client lazy initializer
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

// ==================== API ROUTES ====================

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    backend: "express",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Users & Fake Auth
app.get("/api/users", (_req, res) => {
  const users = loadData(USERS_FILE, DEFAULT_USERS);
  res.json(users);
});

app.post("/api/auth/login", (req, res) => {
  const { username, displayName, avatar } = req.body;
  const users = loadData<any[]>(USERS_FILE, DEFAULT_USERS);

  let user = users.find(
    (u) => u.username.toLowerCase() === (username || "").toLowerCase()
  );

  if (!user) {
    const newUser = {
      id: "user_" + Date.now(),
      username: username ? username.trim().toLowerCase().replace(/\s+/g, "_") : "player_" + Math.floor(Math.random() * 1000),
      displayName: displayName || username || "Anonymous Player",
      avatar: avatar || "🎮",
      title: "Game Enthusiast",
      gamesPlayed: 0,
      gamesWon: 0,
      joinedAt: new Date().toISOString().split("T")[0],
    };
    users.push(newUser);
    saveData(USERS_FILE, users);
    user = newUser;
  }

  res.json({
    user,
    token: "fake-jwt-token-" + user.id + "-" + Date.now(),
  });
});

// Preset Rules List
app.get("/api/presets", (_req, res) => {
  res.json(PRESET_RULES);
});

// Games List & Create
app.get("/api/games", (req, res) => {
  const userId = (req.headers["x-user-id"] as string) || (req.query.userId as string);
  const games = loadData<any[]>(GAMES_FILE, []);
  
  if (userId) {
    const userGames = games.filter((g) => g.userId === userId);
    return res.json(userGames);
  }
  res.json(games);
});

app.get("/api/games/:id", (req, res) => {
  const games = loadData<any[]>(GAMES_FILE, []);
  const game = games.find((g) => g.id === req.params.id);
  if (!game) {
    return res.status(404).json({ error: "Game not found" });
  }
  res.json(game);
});

app.post("/api/games", (req, res) => {
  const {
    userId,
    title,
    category,
    activeChatbotRole,
    players,
    ruleSource,
    ruleAnalysis,
  } = req.body;

  const games = loadData<any[]>(GAMES_FILE, []);

  const newGame = {
    id: "game_" + Date.now(),
    userId: userId || "user_alex",
    title: title || "New Game Match",
    category: category || "board_game",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "in_progress",
    currentTurn: 1,
    activePlayerIndex: 0,
    activeChatbotRole: activeChatbotRole || "teacher",
    players: players || [
      { id: "p1", name: "Player 1", isAi: false, score: 0, color: "#3B82F6", status: "active" },
      { id: "p2", name: "AI Opponent", isAi: true, score: 0, color: "#10B981", status: "active" },
    ],
    ruleSource: ruleSource || {
      fileName: "custom_rules.txt",
      fileType: "text",
      uploadedAt: new Date().toISOString(),
      hasPdf: false,
    },
    ruleAnalysis: ruleAnalysis || null,
    moves: [],
    chatHistory: [
      {
        id: "msg_init",
        sender: "bot",
        role: activeChatbotRole || "teacher",
        text: `Welcome to ${title || "the game"}! I have analyzed your rules and I am ready in ${
          (activeChatbotRole || "teacher").toUpperCase()
        } mode. How would you like to begin?`,
        timestamp: new Date().toISOString(),
      },
    ],
    boardNotes: "Game initialized. Round 1 has begun.",
    photos: [],
    milestones: [],
    boardAnalysisHistory: [],
  };

  games.unshift(newGame);
  saveData(GAMES_FILE, games);

  // Update user's games count
  const users = loadData<any[]>(USERS_FILE, DEFAULT_USERS);
  const user = users.find((u) => u.id === newGame.userId);
  if (user) {
    user.gamesPlayed = (user.gamesPlayed || 0) + 1;
    saveData(USERS_FILE, users);
  }

  res.status(201).json(newGame);
});

// Update game
app.patch("/api/games/:id", (req, res) => {
  const games = loadData<any[]>(GAMES_FILE, []);
  const index = games.findIndex((g) => g.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Game not found" });
  }

  games[index] = {
    ...games[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  saveData(GAMES_FILE, games);
  res.json(games[index]);
});

// Delete game
app.delete("/api/games/:id", (req, res) => {
  const games = loadData<any[]>(GAMES_FILE, []);
  const filtered = games.filter((g) => g.id !== req.params.id);
  saveData(GAMES_FILE, filtered);
  res.json({ success: true, id: req.params.id });
});

// Add Move to Game (and optionally evaluate with Judge)
app.post("/api/games/:id/moves", async (req, res) => {
  const { playerId, playerName, actionType, description, evaluateWithJudge } = req.body;
  const games = loadData<any[]>(GAMES_FILE, []);
  const game = games.find((g) => g.id === req.params.id);

  if (!game) {
    return res.status(404).json({ error: "Game not found" });
  }

  let ruling = undefined;

  if (evaluateWithJudge) {
    const ai = getGeminiClient();
    if (ai) {
      try {
        const rulesText = game.ruleAnalysis
          ? `Game: ${game.ruleAnalysis.title}\nRules: ${game.ruleAnalysis.keyRules?.join("\n")}\nForbidden: ${game.ruleAnalysis.forbiddenMoves?.join("\n")}`
          : game.ruleSource?.textContent || "Standard tabletop rules.";

        const prompt = `You are an expert, impartial Game Judge / Arbiter.
Rulebook & Game Summary:
${rulesText}

Current Turn: ${game.currentTurn}
Player: ${playerName}
Proposed Action: "${description}"

Evaluate if this move/action is strictly legal according to the rules.
Output JSON:
{
  "isLegal": true or false,
  "judgeComment": "One concise sentence ruling whether this is allowed and why.",
  "ruleCitation": "Short reference or quote from the rules or standard rulebook principle."
}`;

        const geminiRes = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        if (geminiRes.text) {
          try {
            ruling = JSON.parse(geminiRes.text);
          } catch (e) {
            console.error("Failed to parse judge JSON", e);
          }
        }
      } catch (err) {
        console.error("Judge evaluation error:", err);
      }
    }
    
    if (!ruling) {
      ruling = {
        isLegal: true,
        judgeComment: "Action accepted under active game rules.",
        ruleCitation: "General Play Rules",
      };
    }
  }

  const newMove = {
    id: "move_" + Date.now(),
    turnNumber: game.currentTurn,
    playerId: playerId || "player_1",
    playerName: playerName || "Player",
    actionType: actionType || "move",
    description: description || "Performed turn action",
    ruling,
    timestamp: new Date().toISOString(),
  };

  game.moves = game.moves || [];
  game.moves.push(newMove);

  if (actionType === "pass" || actionType === "move") {
    if (game.players && game.players.length > 0) {
      game.activePlayerIndex = (game.activePlayerIndex + 1) % game.players.length;
      if (game.activePlayerIndex === 0) {
        game.currentTurn += 1;
      }
    }
  }

  game.updatedAt = new Date().toISOString();
  saveData(GAMES_FILE, games);

  res.json({ move: newMove, game });
});

// PDF Rule Upload & Gemini Analysis Endpoint
app.post("/api/rules/analyze", async (req, res) => {
  try {
    const { pdfBase64, textContent, fileName, presetKey } = req.body;

    let rulesRawText = textContent || "";

    if (presetKey && PRESET_RULES[presetKey]) {
      rulesRawText = PRESET_RULES[presetKey].text;
    }

    if (pdfBase64 && !rulesRawText) {
      try {
        const pdfParse = require("pdf-parse");
        const buffer = Buffer.from(pdfBase64, "base64");
        const pdfData = await pdfParse(buffer);
        if (pdfData && pdfData.text && pdfData.text.trim().length > 20) {
          rulesRawText = pdfData.text;
        }
      } catch (pdfErr) {
        console.warn("pdf-parse notice:", pdfErr);
      }
    }

    const ai = getGeminiClient();

    if (!ai) {
      const fallbackAnalysis = {
        title: fileName ? fileName.replace(/\.[^/.]+$/, "") : "Custom Game",
        overview: rulesRawText ? rulesRawText.slice(0, 200) + "..." : "Custom board game uploaded by player.",
        winCondition: "First player to achieve maximum points or complete scenario objective.",
        turnStructure: [
          "Phase 1: Roll dice or draw resource cards",
          "Phase 2: Trade or strategize actions",
          "Phase 3: Execute movement, building, or attacks",
          "Phase 4: Pass turn and check victory conditions"
        ],
        keyRules: [
          "Players take turns in clockwise order.",
          "Must follow distance and movement constraints specified in rules.",
          "Illegal actions can be challenged by the Judge."
        ],
        forbiddenMoves: [
          "Moving out of turn",
          "Exceeding resource or hand limits without discarding",
          "Violating spatial distance constraints"
        ],
        teacherTips: [
          "Focus on steady early-game resource production.",
          "Keep an eye on the leading opponent's score.",
          "Ask questions anytime if a card text feels ambiguous!"
        ],
        judgeChecklist: [
          "Verify turn phase sequence",
          "Check resource payment costs before building",
          "Confirm target eligibility for action cards"
        ],
        playerStrategy: "Balanced and tactical play, exploiting opponent openings while maintaining strong defenses.",
      };
      return res.json({ analysis: fallbackAnalysis, extractedText: rulesRawText.slice(0, 1000) });
    }

    let contents: any;

    if (pdfBase64) {
      contents = {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: pdfBase64,
            },
          },
          {
            text: `Analyze this game rulebook thoroughly. Extract and format the complete rule specifications for an AI chatbot assistant that will act as a Teacher, Judge, and Player.
Extract:
1. title: Exact game name
2. overview: 2-3 sentence summary of the game premise and mechanics
3. winCondition: Clear, concise win/victory condition
4. turnStructure: Array of strings describing the sequential phases of each player's turn
5. keyRules: Array of 5-8 most critical core rules players must know
6. forbiddenMoves: Array of 3-5 strictly illegal actions or common errors to guard against
7. teacherTips: Array of 3-4 pedagogical tips to guide beginners
8. judgeChecklist: Array of 3-4 checks an arbiter should perform when verifying moves
9. playerStrategy: Summary of strategic priorities when playing this game

Return strictly JSON matching this structure.`,
          },
        ],
      };
    } else {
      contents = `Analyze the following game rules. Extract and format the complete rule specifications for an AI chatbot assistant that will act as a Teacher, Judge, and Player.
RULES CONTENT:
${rulesRawText}

Extract:
1. title: Game name
2. overview: 2-3 sentence summary of the game
3. winCondition: Victory conditions
4. turnStructure: Array of strings for turn phases
5. keyRules: Array of 5-8 most important rules
6. forbiddenMoves: Array of 3-5 illegal actions or mistakes
7. teacherTips: Array of 3-4 helpful tips for beginners
8. judgeChecklist: Array of 3-4 things to check during rulings
9. playerStrategy: Overview of how an AI opponent should play

Return strictly JSON matching this structure.`;
    }

    const geminiRes = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsedJson = JSON.parse(geminiRes.text || "{}");
    res.json({
      analysis: parsedJson,
      extractedText: rulesRawText ? rulesRawText.slice(0, 2000) : "Processed directly via Gemini PDF parser.",
    });
  } catch (error: any) {
    console.error("Rule analysis error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze rules" });
  }
});

// Board Analysis with Gemini Vision Endpoint
app.post("/api/board/analyze", async (req, res) => {
  try {
    const { imageBase64, gameTitle, rulesContext, customNotes } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 is required" });
    }

    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        analysis: {
          summary: "Physical board view detected with active player components and tokens.",
          detectedPieces: [
            "Central game grid / tiles",
            "Player tokens and marker pieces in active quadrant",
            "Resource cards / score tracker on perimeter",
          ],
          boardStateScore: "Balanced territorial control with contested center",
          strategicAdvice: "Expand towards open resource nodes and fortify your weakest perimeter road segment.",
          suggestedNextMoves: [
            "Secure contested intersection before opponent takes turn",
            "Consolidate trade goods to avoid discard penalties",
            "Roll dice to check harvest phase"
          ],
          rulesComplianceNote: "Piece placement appears compliant with spatial distance rules.",
          timestamp: new Date().toISOString(),
        }
      });
    }

    const prompt = `You are a world-class board game referee and computer vision tactical analyst.
Analyze this photo of the physical tabletop board game "${gameTitle || 'Tabletop Game'}".

Rules & Context:
${rulesContext || 'Standard tabletop game rules and victory conditions apply.'}

Additional Board Notes from players:
${customNotes || 'None'}

Please extract and evaluate:
1. summary: A thorough 2-3 sentence description of the visible board state, active territories, piece clusters, and current phase.
2. detectedPieces: An array of strings detailing the specific pieces, cards, dice, tokens, or markers visible in the image.
3. boardStateScore: Assessment of who appears in the lead or board advantage.
4. strategicAdvice: Direct, high-level tactical advice for the player whose turn it is.
5. suggestedNextMoves: Array of 3 specific, legal, high-value move options they can execute.
6. rulesComplianceNote: Confirmation of whether piece spacing, tile connections, or visible cards comply with official rules.

Output strictly valid JSON matching this schema:
{
  "summary": "...",
  "detectedPieces": ["...", "..."],
  "boardStateScore": "...",
  "strategicAdvice": "...",
  "suggestedNextMoves": ["...", "..."],
  "rulesComplianceNote": "..."
}`;

    let cleanB64 = imageBase64;
    let mimeType = "image/jpeg";
    if (cleanB64.includes(",")) {
      const parts = cleanB64.split(",");
      if (parts[0].includes("png")) mimeType = "image/png";
      else if (parts[0].includes("webp")) mimeType = "image/webp";
      cleanB64 = parts[1];
    }

    const geminiRes = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanB64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(geminiRes.text || "{}");
    parsed.timestamp = new Date().toISOString();

    res.json({ analysis: parsed });
  } catch (error: any) {
    console.error("Board analysis error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze board image" });
  }
});

// Chatbot Interaction Endpoint (Teacher, Judge, Player)
app.post("/api/games/:id/chat", async (req, res) => {
  try {
    const { id } = req.params;
    const { message, role } = req.body;
    const games = loadData<any[]>(GAMES_FILE, []);
    const game = games.find((g) => g.id === id);

    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    const activeRole = role || game.activeChatbotRole || "teacher";
    game.activeChatbotRole = activeRole;

    const userMsg = {
      id: "msg_u_" + Date.now(),
      sender: "user",
      role: activeRole,
      text: message,
      timestamp: new Date().toISOString(),
    };
    game.chatHistory = game.chatHistory || [];
    game.chatHistory.push(userMsg);

    const ai = getGeminiClient();

    let botResponseText = "";
    let citation: string | undefined = undefined;
    let suggestedAction: string | undefined = undefined;

    if (!ai) {
      if (activeRole === "teacher") {
        botResponseText = `[Teacher Mode] Based on ${game.title}'s rules: To take your turn, follow the turn phases: 1) Roll or collect resources, 2) Trade or play action cards, 3) Build or move. Remember the win condition: ${game.ruleAnalysis?.winCondition || "Reach the score goal"}. Let me know which rule you'd like me to explain!`;
      } else if (activeRole === "judge") {
        botResponseText = `[Judge Ruling] I have reviewed the action against ${game.title}'s rulebook. The move is valid provided all prerequisite costs have been paid and no distance rules were violated. Ruling: LEGAL.`;
        citation = "Core Rulebook Section 2.1";
      } else {
        botResponseText = `[Player Turn] I roll the dice and evaluate my options! I will play my turn by advancing my position and conserving resources for next round. Your turn!`;
        suggestedAction = "Roll 2d6 or Pass Turn";
      }
    } else {
      const rulesContext = game.ruleAnalysis
        ? `Game Title: ${game.ruleAnalysis.title}
Overview: ${game.ruleAnalysis.overview}
Win Condition: ${game.ruleAnalysis.winCondition}
Turn Structure: ${game.ruleAnalysis.turnStructure?.join(" -> ")}
Core Rules: ${game.ruleAnalysis.keyRules?.join("; ")}
Forbidden Actions: ${game.ruleAnalysis.forbiddenMoves?.join("; ")}`
        : game.ruleSource?.textContent || "Standard board game rules.";

      const gameProgressContext = `Current Turn: ${game.currentTurn}
Active Player Index: ${game.activePlayerIndex} (${game.players[game.activePlayerIndex]?.name})
Players: ${game.players.map((p: any) => `${p.name} (Score: ${p.score})`).join(", ")}
Recent Moves:
${(game.moves || []).slice(-5).map((m: any) => `- Turn ${m.turnNumber} [${m.playerName}]: ${m.description}`).join("\n") || "No moves logged yet."}
Board Notes: ${game.boardNotes || "None"}`;

      const agentConfigDirectives = game.agentConfig
        ? `\nCUSTOM AGENT PROMPTING INSTRUCTIONS:
Persona Style: ${game.agentConfig.customPersonaPrompt || 'Default standard tabletop personality'}
Difficulty / Play Strength: ${game.agentConfig.difficulty || 'standard'}
Referee Strictness: ${game.agentConfig.strictness || 'standard'}
Specific Guidance / Constraints: ${game.agentConfig.customInstructions || 'None'}`
        : '';

      const photoContext = game.photos && game.photos.length > 0
        ? `\nUPLOADED PHOTOS: ${game.photos.length} game photo(s) on file (${game.photos.map((p: any) => `${p.category}: ${p.caption || 'No caption'}`).join('; ')}).`
        : '';

      const latestBoardVision = game.boardAnalysisHistory && game.boardAnalysisHistory.length > 0
        ? `\nLATEST BOARD COMPUTER VISION ANALYSIS:
Summary: ${game.boardAnalysisHistory[game.boardAnalysisHistory.length - 1].summary}
Advantage: ${game.boardAnalysisHistory[game.boardAnalysisHistory.length - 1].boardStateScore}
Tactics: ${game.boardAnalysisHistory[game.boardAnalysisHistory.length - 1].strategicAdvice}`
        : '';

      let systemPrompt = "";
      if (activeRole === "teacher") {
        systemPrompt = `You are a patient, articulate, and friendly Game Teacher / Mentor for the game "${game.title}".
Your goal is to teach the user how to play, explain rule subtleties, suggest beginner-friendly tips, and answer rule questions with clarity and encouragement.
Reference specific phases from the rulebook:
${rulesContext}

Current Game Status:
${gameProgressContext}
${agentConfigDirectives}
${photoContext}
${latestBoardVision}

Tone: Encouraging, instructive, pedagogical. Keep responses structured and easy to read during live play.`;
      } else if (activeRole === "judge") {
        systemPrompt = `You are an official, impartial Tournament Game Judge and Arbiter for "${game.title}".
Your duty is to strictly enforce the uploaded rulebook, resolve disputes, evaluate proposed player actions for legality, and quote rule citations.
If the player asks if an action or move is legal:
1. Clearly declare [LEGAL] or [ILLEGAL / INFRACTION].
2. Give the exact rationale based on the rulebook.
3. Suggest the correct legal procedure or applicable penalty.

Rules:
${rulesContext}

Current Game Status:
${gameProgressContext}
${agentConfigDirectives}
${photoContext}
${latestBoardVision}

Tone: Formal, objective, authoritative, concise.`;
      } else {
        systemPrompt = `You are an AI opponent playing the game "${game.title}" against the user!
You are participating as an active player. You play smartly, make tactical decisions according to the official rules, track your own simulated resources and score, react to the player's moves, and narrate your plays with sportsmanlike banter.
Rules:
${rulesContext}

Current Game Status:
${gameProgressContext}
${agentConfigDirectives}
${photoContext}
${latestBoardVision}

When it is your turn or when challenged, declare your chosen action clearly.`;
      }

      const chatContext = (game.chatHistory || [])
        .slice(-6)
        .map((c: any) => `${c.sender === "user" ? "Player" : "AI (" + c.role + ")"}: ${c.text}`)
        .join("\n");

      const prompt = `${systemPrompt}

RECENT CHAT HISTORY:
${chatContext}

USER'S LATEST MESSAGE:
"${message}"

Respond directly to the user in your designated role (${activeRole.toUpperCase()}). Include markdown formatting for key terms or dice rolls when appropriate.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });

      botResponseText = response.text || "I have received your message.";
    }

    const botMsg = {
      id: "msg_b_" + Date.now(),
      sender: "bot",
      role: activeRole,
      text: botResponseText,
      timestamp: new Date().toISOString(),
      citation,
      suggestedAction,
    };

    game.chatHistory.push(botMsg);
    game.updatedAt = new Date().toISOString();
    saveData(GAMES_FILE, games);

    res.json({ message: botMsg, game });
  } catch (err: any) {
    console.error("Chatbot error:", err);
    res.status(500).json({ error: err.message || "Chat processing failed" });
  }
});

// Vite middleware & Production Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GamePlay Companion server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
