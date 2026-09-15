import { Game, User, RuleAnalysis, ChatMessage, GameMove } from "../types";

export async function fetchHealth(): Promise<{ status: string; hasApiKey: boolean }> {
  const res = await fetch("/api/health");
  return res.json();
}

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch("/api/users");
  return res.json();
}

export async function loginUser(payload: { username: string; displayName?: string; avatar?: string }): Promise<{ user: User; token: string }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function fetchGames(userId?: string): Promise<Game[]> {
  const headers: Record<string, string> = {};
  if (userId) {
    headers["x-user-id"] = userId;
  }
  const res = await fetch("/api/games", { headers });
  return res.json();
}

export async function fetchGame(id: string): Promise<Game> {
  const res = await fetch(`/api/games/${id}`);
  if (!res.ok) throw new Error("Game not found");
  return res.json();
}

export async function createGame(gameData: Partial<Game>): Promise<Game> {
  const res = await fetch("/api/games", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(gameData),
  });
  return res.json();
}

export async function updateGame(id: string, patch: Partial<Game>): Promise<Game> {
  const res = await fetch(`/api/games/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return res.json();
}

export async function deleteGame(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/games/${id}`, {
    method: "DELETE",
  });
  return res.json();
}

export async function analyzeRules(payload: {
  pdfBase64?: string;
  textContent?: string;
  fileName?: string;
  presetKey?: string;
}): Promise<{ analysis: RuleAnalysis; extractedText: string }> {
  const res = await fetch("/api/rules/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to analyze rules" }));
    throw new Error(error.error || "Analysis failed");
  }
  return res.json();
}

export async function sendChatMessage(
  gameId: string,
  message: string,
  role: "teacher" | "judge" | "player"
): Promise<{ message: ChatMessage; game: Game }> {
  const res = await fetch(`/api/games/${gameId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, role }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to send chat message" }));
    throw new Error(error.error || "Chat failed");
  }
  return res.json();
}

export async function logMove(
  gameId: string,
  payload: {
    playerId: string;
    playerName: string;
    actionType: string;
    description: string;
    evaluateWithJudge?: boolean;
  }
): Promise<{ move: GameMove; game: Game }> {
  const res = await fetch(`/api/games/${gameId}/moves`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function fetchPresets(): Promise<Record<string, { title: string; text: string; overview: string }>> {
  const res = await fetch("/api/presets");
  return res.json();
}

export async function analyzeBoard(payload: {
  imageBase64: string;
  gameTitle?: string;
  rulesContext?: string;
  customNotes?: string;
}): Promise<{ analysis: any }> {
  const res = await fetch("/api/board/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to analyze board" }));
    throw new Error(error.error || "Board analysis failed");
  }
  return res.json();
}
