export type ChatbotRole = 'teacher' | 'judge' | 'player';

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  title: string;
  gamesPlayed: number;
  gamesWon: number;
  joinedAt: string;
}

export interface RuleAnalysis {
  title: string;
  overview: string;
  winCondition: string;
  turnStructure: string[];
  keyRules: string[];
  forbiddenMoves: string[];
  teacherTips: string[];
  judgeChecklist: string[];
  playerStrategy: string;
}

export interface PlayerState {
  id: string;
  name: string;
  isAi: boolean;
  score: number;
  color: string;
  status: 'active' | 'passed' | 'eliminated' | 'winner';
  resources?: string;
}

export interface GameMove {
  id: string;
  turnNumber: number;
  playerId: string;
  playerName: string;
  actionType: 'move' | 'dice_roll' | 'card_play' | 'score_update' | 'rule_check' | 'pass' | 'custom';
  description: string;
  ruling?: {
    isLegal: boolean;
    judgeComment: string;
    ruleCitation?: string;
  };
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  role: ChatbotRole;
  text: string;
  timestamp: string;
  citation?: string;
  suggestedAction?: string;
}

export interface GamePhoto {
  id: string;
  url: string;
  caption?: string;
  uploadedAt: string;
  category: 'board' | 'components' | 'cards' | 'score' | 'general';
}

export interface BoardAnalysisResult {
  summary: string;
  detectedPieces: string[];
  boardStateScore: string;
  strategicAdvice: string;
  suggestedNextMoves: string[];
  rulesComplianceNote?: string;
  timestamp: string;
}

export interface AgentPromptConfig {
  customPersonaPrompt?: string;
  temperature?: number;
  difficulty?: 'beginner' | 'standard' | 'grandmaster';
  strictness?: 'forgiving' | 'standard' | 'tournament_strict';
  customInstructions?: string;
}

export interface MilestoneProgress {
  id: string;
  title: string;
  description: string;
  targetPoints: number;
  completed: boolean;
  completedAt?: string;
  completedByPlayerId?: string;
}

export interface Game {
  id: string;
  userId: string;
  title: string;
  category: 'board_game' | 'card_game' | 'strategy' | 'rpg' | 'party' | 'custom';
  createdAt: string;
  updatedAt: string;
  status: 'in_progress' | 'completed' | 'paused';
  currentTurn: number;
  activePlayerIndex: number;
  activeChatbotRole: ChatbotRole;
  players: PlayerState[];
  ruleSource: {
    fileName: string;
    fileType: 'pdf' | 'text' | 'preset';
    fileSize?: string;
    uploadedAt: string;
    hasPdf: boolean;
    pdfBase64?: string;
    textContent?: string;
  };
  ruleAnalysis?: RuleAnalysis;
  moves: GameMove[];
  chatHistory: ChatMessage[];
  boardNotes: string;
  winnerId?: string;
  photos?: GamePhoto[];
  boardAnalysisHistory?: BoardAnalysisResult[];
  agentConfig?: AgentPromptConfig;
  milestones?: MilestoneProgress[];
}
