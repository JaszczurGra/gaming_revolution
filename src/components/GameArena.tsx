import React, { useState } from 'react';
import { Game, PlayerState, GameMove, GamePhoto, BoardAnalysisResult, AgentPromptConfig, MilestoneProgress, RuleAnalysis, ChatbotRole } from '../types';
import { logMove, updateGame } from '../utils/api';
import { ChatbotPanel } from './ChatbotPanel';
import { DiceRoller } from './DiceRoller';
import { RulesViewerModal } from './RulesViewerModal';
import { PhotoUploadSection } from './PhotoUploadSection';
import { BoardAnalysisSection } from './BoardAnalysisSection';
import { AgentPromptingSection } from './AgentPromptingSection';
import { PdfRuleAnalysisSection } from './PdfRuleAnalysisSection';
import { ProgressTrackerSection } from './ProgressTrackerSection';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Clock,
  Dices,
  Flag,
  Play,
  Save,
  Scale,
  ShieldAlert,
  Trophy,
  Users,
  ChevronRight,
  Sparkles,
  Download,
  Camera,
  Scan,
  Sliders,
  TrendingUp,
  Gamepad2,
} from 'lucide-react';

interface GameArenaProps {
  game: Game;
  onUpdateGame: (game: Game) => void;
  onBackToDashboard: () => void;
}

type ArenaTab = 'play' | 'photos' | 'pdf_rules' | 'agent_prompting' | 'board_analysis' | 'progress';

export const GameArena: React.FC<GameArenaProps> = ({ game, onUpdateGame, onBackToDashboard }) => {
  const [activeTab, setActiveTab] = useState<ArenaTab>('play');
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [moveDescription, setMoveDescription] = useState('');
  const [checkWithJudge, setCheckWithJudge] = useState(true);
  const [loggingMove, setLoggingMove] = useState(false);
  const [boardNotes, setBoardNotes] = useState(game.boardNotes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [selectedPhotoForVision, setSelectedPhotoForVision] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string>(
    new Date(game.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  const activePlayer = game.players[game.activePlayerIndex] || game.players[0];

  // Helper to persist partial updates to game state
  const handleSaveGamePatch = async (patch: Partial<Game>) => {
    try {
      const updated = await updateGame(game.id, patch);
      onUpdateGame(updated);
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Failed to save game patch', err);
    }
  };

  // Adjust player score
  const handleScoreChange = async (playerId: string, delta: number) => {
    const updatedPlayers = game.players.map((p) => {
      if (p.id === playerId) {
        const newScore = Math.max(0, p.score + delta);
        return { ...p, score: newScore };
      }
      return p;
    });

    handleSaveGamePatch({ players: updatedPlayers });
  };

  // Log a player move
  const handleLogMove = async (customDesc?: string) => {
    const desc = customDesc || moveDescription;
    if (!desc.trim() || loggingMove) return;

    setLoggingMove(true);
    try {
      const res = await logMove(game.id, {
        playerId: activePlayer.id,
        playerName: activePlayer.name,
        actionType: 'move',
        description: desc.trim(),
        evaluateWithJudge: checkWithJudge,
      });

      onUpdateGame(res.game);
      setMoveDescription('');
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Failed to log move', err);
    } finally {
      setLoggingMove(false);
    }
  };

  // Pass Turn
  const handlePassTurn = async () => {
    setLoggingMove(true);
    try {
      const res = await logMove(game.id, {
        playerId: activePlayer.id,
        playerName: activePlayer.name,
        actionType: 'pass',
        description: `${activePlayer.name} passed their turn.`,
        evaluateWithJudge: false,
      });
      onUpdateGame(res.game);
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Failed to pass turn', err);
    } finally {
      setLoggingMove(false);
    }
  };

  // Save notes
  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const updated = await updateGame(game.id, { boardNotes });
      onUpdateGame(updated);
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Failed to save notes', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Advance manual round / turn counter
  const handleAdvanceRound = () => {
    handleSaveGamePatch({
      currentTurn: game.currentTurn + 1,
      moves: [
        ...(game.moves || []),
        {
          id: 'turn_adv_' + Date.now(),
          turnNumber: game.currentTurn + 1,
          playerId: activePlayer.id,
          playerName: 'System Arbiter',
          actionType: 'move',
          description: `Turn advanced to Round ${game.currentTurn + 1}.`,
          timestamp: new Date().toISOString(),
        },
      ],
    });
  };

  // Declare winner / Complete game
  const handleDeclareWinner = async (player: PlayerState) => {
    const confirm = window.confirm(`Declare ${player.name} as the Winner of ${game.title}?`);
    if (!confirm) return;

    handleSaveGamePatch({
      status: 'completed',
      winnerId: player.id,
      boardNotes: `${boardNotes}\n[VICTORY]: ${player.name} won the match!`,
    });
  };

  // Handlers for the 5 new sections:
  const handlePhotosChange = (updatedPhotos: GamePhoto[]) => {
    handleSaveGamePatch({ photos: updatedPhotos });
  };

  const handleSelectPhotoForBoardAnalysis = (photoUrl: string) => {
    setSelectedPhotoForVision(photoUrl);
    setActiveTab('board_analysis');
  };

  const handleBoardAnalysisComplete = (newResult: BoardAnalysisResult) => {
    const currentHistory = game.boardAnalysisHistory || [];
    handleSaveGamePatch({
      boardAnalysisHistory: [...currentHistory, newResult],
      boardNotes: `${boardNotes}\n[Vision Scan ${new Date().toLocaleTimeString()}]: ${newResult.summary}`.trim(),
    });
  };

  const handleAgentConfigSave = (newConfig: AgentPromptConfig) => {
    handleSaveGamePatch({ agentConfig: newConfig });
  };

  const handleRoleChange = (newRole: ChatbotRole) => {
    handleSaveGamePatch({ activeChatbotRole: newRole });
  };

  const handlePdfAnalysisUpdate = (newAnalysis: RuleAnalysis) => {
    handleSaveGamePatch({ ruleAnalysis: newAnalysis });
  };

  const handleMilestonesChange = (updatedMilestones: MilestoneProgress[]) => {
    handleSaveGamePatch({ milestones: updatedMilestones });
  };

  // Export game save JSON
  const handleExportSave = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(game, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${game.title.replace(/\s+/g, '_')}_save.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Rules Modal */}
      <RulesViewerModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        game={game}
      />

      {/* Top Banner: Navigation, Match Title, Auto-Save Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 lg:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors cursor-pointer"
            title="Return to Saved Games Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg lg:text-xl font-bold text-white tracking-tight">{game.title}</h1>
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                game.status === 'completed'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}>
                {game.status === 'completed' ? 'Completed' : 'In Progress'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="capitalize text-slate-300">{game.category.replace('_', ' ')}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-indigo-300">
                <BookOpen className="w-3.5 h-3.5" />
                {game.ruleSource.fileName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                Turn #{game.currentTurn}
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Badges & Actions */}
        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
          {/* Saved Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Progress Stored ({lastSavedTime})</span>
          </div>

          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            Official Rules
          </button>

          <button
            type="button"
            onClick={handleExportSave}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Export Game Save (.json)"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Section Switcher Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800 scrollbar-none">
        {[
          { id: 'play', label: 'Play & Scoreboard', icon: Gamepad2, badge: undefined },
          { id: 'photos', label: 'Photo Uploads', icon: Camera, badge: game.photos?.length ? `${game.photos.length}` : undefined },
          { id: 'pdf_rules', label: 'PDF Rule Analyzer', icon: BookOpen, badge: game.ruleAnalysis ? 'Active' : undefined },
          { id: 'agent_prompting', label: 'Agent Prompting', icon: Sliders, badge: game.activeChatbotRole },
          { id: 'board_analysis', label: 'Board Vision Scan', icon: Scan, badge: game.boardAnalysisHistory?.length ? `${game.boardAnalysisHistory.length}` : undefined },
          { id: 'progress', label: 'Progress Tracker', icon: TrendingUp, badge: `Turn ${game.currentTurn}` },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ArenaTab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-indigo-400 border border-slate-700'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Playing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Arena Column: 7 cols */}
        <div className="lg:col-span-7 space-y-6">
          {/* TAB 1: CORE PLAY & SCOREBOARD */}
          {activeTab === 'play' && (
            <>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Player Scoreboard & Turn Order</h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Active Turn:</span>
                <span
                  className="px-2 py-0.5 rounded font-bold text-white shadow-sm flex items-center gap-1"
                  style={{ backgroundColor: activePlayer?.color || '#4F46E5' }}
                >
                  {activePlayer?.name}
                  {activePlayer?.isAi && ' 🤖'}
                </span>
              </div>
            </div>

            {/* Players List with Quick Score Adjusters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {game.players.map((player, idx) => {
                const isCurrentTurn = idx === game.activePlayerIndex;
                const isWinner = game.winnerId === player.id;

                return (
                  <div
                    key={player.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isWinner
                        ? 'bg-amber-950/30 border-amber-500/50 ring-1 ring-amber-500/30'
                        : isCurrentTurn
                        ? 'bg-slate-800/90 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/20'
                        : 'bg-slate-950/50 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: player.color }}
                        />
                        <span className="text-xs font-bold text-white truncate max-w-[120px]">
                          {player.name}
                        </span>
                        {player.isAi && (
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1 py-0.2 rounded">
                            AI
                          </span>
                        )}
                        {isWinner && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                            <Trophy className="w-3 h-3 text-amber-400" /> Winner
                          </span>
                        )}
                      </div>
                      {isCurrentTurn && (
                        <span className="text-[10px] font-semibold text-indigo-400 animate-pulse">
                          Taking Turn
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                          Points / Score
                        </span>
                        <span className="text-xl font-black text-white">{player.score}</span>
                      </div>

                      {/* Score +/- buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleScoreChange(player.id, -1)}
                          className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                          title="Minus 1 point"
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleScoreChange(player.id, 1)}
                          className="w-7 h-7 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                          title="Plus 1 point"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleScoreChange(player.id, 5)}
                          className="px-1.5 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold text-[11px] flex items-center justify-center transition-colors cursor-pointer"
                          title="Plus 5 points"
                        >
                          +5
                        </button>
                        {game.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => handleDeclareWinner(player)}
                            className="p-1 text-slate-500 hover:text-amber-400 transition-colors ml-1 cursor-pointer"
                            title="Declare as Winner"
                          >
                            <Trophy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabletop Utilities: Dice Roller */}
          <DiceRoller
            onDiceRoll={(rollText) => {
              setMoveDescription((prev) => (prev ? `${prev} | ${rollText}` : rollText));
            }}
          />

          {/* Turn Action Logger */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400" />
                Log Turn Move ({activePlayer?.name})
              </h3>
              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkWithJudge}
                  onChange={(e) => setCheckWithJudge(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                />
                <span className="flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-amber-400" />
                  Evaluate with Judge
                </span>
              </label>
            </div>

            <div className="space-y-3">
              <textarea
                rows={3}
                placeholder={`Describe ${activePlayer?.name}'s move (e.g. "Built a settlement at hex intersection 6-8-3", "Played Deal Breaker on blue property set", "Cast Firebolt on Goblin for 12 damage")...`}
                value={moveDescription}
                onChange={(e) => setMoveDescription(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleLogMove()}
                    disabled={!moveDescription.trim() || loggingMove}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{loggingMove ? 'Checking & Saving...' : 'Confirm Move'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handlePassTurn}
                    disabled={loggingMove}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                  >
                    Pass Turn
                  </button>
                </div>

                {checkWithJudge && (
                  <span className="text-[11px] text-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    AI Arbiter will certify against uploaded rules
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Chronological Move History Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Flag className="w-4 h-4 text-indigo-400" />
                Turn-by-Turn Move History ({game.moves?.length || 0} Actions)
              </h3>
              <span className="text-[11px] text-slate-400">All moves stored in database</span>
            </div>

            {game.moves && game.moves.length > 0 ? (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {game.moves.slice().reverse().map((move) => (
                  <div
                    key={move.id}
                    className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-bold">
                          Turn {move.turnNumber}
                        </span>
                        <span className="font-semibold text-white">{move.playerName}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(move.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-slate-300 text-xs">{move.description}</p>

                    {/* Ruling if evaluated */}
                    {move.ruling && (
                      <div
                        className={`p-2 rounded-lg border text-[11px] flex items-start gap-2 ${
                          move.ruling.isLegal
                            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                        }`}
                      >
                        {move.ruling.isLegal ? (
                          <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                        ) : (
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                        )}
                        <div>
                          <span className="font-bold mr-1">
                            [{move.ruling.isLegal ? 'LEGAL' : 'RULE INFRACTION'}]:
                          </span>
                          <span>{move.ruling.judgeComment}</span>
                          {move.ruling.ruleCitation && (
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              Ref: {move.ruling.ruleCitation}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">
                No moves logged yet. Enter your first move above or ask the AI Teacher for opening guidance!
              </div>
            )}
          </div>

          {/* Board Notes & State Scratchpad */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                Persistent Board State & Notes
              </h3>
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Save className="w-3 h-3" />
                {isSavingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
            <textarea
              rows={3}
              placeholder="Record board positions, active trade offers, or inventory here... (automatically stored)"
              value={boardNotes}
              onChange={(e) => setBoardNotes(e.target.value)}
              onBlur={handleSaveNotes}
              className="w-full bg-slate-950/70 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
            </>
          )}

          {/* TAB 2: FOR UPLOADING PHOTOS */}
          {activeTab === 'photos' && (
            <PhotoUploadSection
              photos={game.photos || []}
              onPhotosChange={handlePhotosChange}
              onSelectForBoardAnalysis={handleSelectPhotoForBoardAnalysis}
            />
          )}

          {/* TAB 3: FOR ANALYZING PDF WITH RULES */}
          {activeTab === 'pdf_rules' && (
            <PdfRuleAnalysisSection
              currentAnalysis={game.ruleAnalysis}
              ruleSource={game.ruleSource}
              onAnalysisUpdate={handlePdfAnalysisUpdate}
            />
          )}

          {/* TAB 4: FOR AGENT PROMPTING */}
          {activeTab === 'agent_prompting' && (
            <AgentPromptingSection
              currentConfig={game.agentConfig}
              activeRole={game.activeChatbotRole || 'teacher'}
              onSaveConfig={handleAgentConfigSave}
              onRoleChange={handleRoleChange}
            />
          )}

          {/* TAB 5: FOR ANALYZING A BOARD */}
          {activeTab === 'board_analysis' && (
            <BoardAnalysisSection
              gameTitle={game.title}
              rulesContext={game.ruleAnalysis?.overview || game.ruleSource?.textContent || ''}
              boardNotes={game.boardNotes || ''}
              photos={game.photos || []}
              analysisHistory={game.boardAnalysisHistory || []}
              onAnalysisComplete={handleBoardAnalysisComplete}
              activeSelectedImage={selectedPhotoForVision}
            />
          )}

          {/* TAB 6: FOR A PROGRESS TRACKER */}
          {activeTab === 'progress' && (
            <ProgressTrackerSection
              currentTurn={game.currentTurn}
              players={game.players}
              milestones={game.milestones || []}
              totalMovesCount={game.moves?.length || 0}
              onMilestonesChange={handleMilestonesChange}
              onAdvanceTurn={handleAdvanceRound}
              onPlayerScoreChange={handleScoreChange}
            />
          )}
        </div>

        {/* Right / AI Chatbot Column: 5 cols */}
        <div className="lg:col-span-5 h-[760px] sticky top-20">
          <ChatbotPanel
            game={game}
            onUpdateGame={onUpdateGame}
            onLogBotMove={(botAction) => {
              handleLogMove(`[AI Opponent Move]: ${botAction}`);
            }}
          />
        </div>
      </div>
    </div>
  );
};
