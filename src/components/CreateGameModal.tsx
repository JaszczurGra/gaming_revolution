import React, { useState, useRef } from 'react';
import { Game, RuleAnalysis, ChatbotRole, PlayerState } from '../types';
import { analyzeRules, fetchPresets } from '../utils/api';
import {
  X,
  Upload,
  FileText,
  Sparkles,
  BookOpen,
  Scale,
  Bot,
  Users,
  AlertCircle,
  CheckCircle2,
  Dice5,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface CreateGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  onGameCreated: (game: Game) => void;
}

export const CreateGameModal: React.FC<CreateGameModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  onGameCreated,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Game['category']>('board_game');
  const [sourceType, setSourceType] = useState<'pdf' | 'preset' | 'text'>('pdf');
  const [activeRole, setActiveRole] = useState<ChatbotRole>('teacher');

  // PDF upload state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);

  // Preset & Text state
  const [selectedPreset, setSelectedPreset] = useState<'catan_lite' | 'monopoly_deal' | 'dungeon_dice'>('catan_lite');
  const [rawText, setRawText] = useState('');

  // Players
  const [players, setPlayers] = useState<PlayerState[]>([
    { id: 'p1', name: userName || 'Player 1', isAi: false, score: 0, color: '#3B82F6', status: 'active' },
    { id: 'p2', name: 'AI Opponent', isAi: true, score: 0, color: '#10B981', status: 'active' },
  ]);

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<RuleAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process selected file to base64
  const handleFileSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setAnalysisError('Please upload a valid PDF document (.pdf)');
      return;
    }
    setAnalysisError(null);
    setPdfFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '));
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || '';
      setPdfBase64(base64);
      // Automatically trigger rule analysis for the PDF
      runAnalysis({ pdfBase64: base64, fileName: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const runAnalysis = async (params: { pdfBase64?: string; textContent?: string; fileName?: string; presetKey?: string }) => {
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const res = await analyzeRules(params);
      setAnalysis(res.analysis);
      if (res.analysis.title && !title) {
        setTitle(res.analysis.title);
      }
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || 'Failed to analyze rules');
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePresetChange = (presetKey: 'catan_lite' | 'monopoly_deal' | 'dungeon_dice') => {
    setSelectedPreset(presetKey);
    const names = {
      catan_lite: 'Catan Island Express',
      monopoly_deal: 'Property Duel (Card Battle)',
      dungeon_dice: 'Dungeon & Dragon Dice Encounter',
    };
    setTitle(names[presetKey]);
    runAnalysis({ presetKey });
  };

  const handleAddPlayer = () => {
    const nextIdx = players.length + 1;
    const colors = ['#F59E0B', '#EC4899', '#8B5CF6', '#14B8A6'];
    const color = colors[players.length % colors.length];
    setPlayers([
      ...players,
      {
        id: 'p_' + Date.now(),
        name: `Player ${nextIdx}`,
        isAi: false,
        score: 0,
        color,
        status: 'active',
      },
    ]);
  };

  const handleRemovePlayer = (id: string) => {
    if (players.length <= 1) return;
    setPlayers(players.filter((p) => p.id !== id));
  };

  const handlePlayerChange = (id: string, field: keyof PlayerState, value: any) => {
    setPlayers(
      players.map((p) => {
        if (p.id === id) {
          return { ...p, [field]: value };
        }
        return p;
      })
    );
  };

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setAnalysisError('Please enter a game title');
      return;
    }

    setSubmitting(true);
    try {
      const gamePayload: Partial<Game> = {
        userId,
        title: title.trim(),
        category,
        activeChatbotRole: activeRole,
        players,
        ruleSource: {
          fileName: pdfFile ? pdfFile.name : sourceType === 'preset' ? `${selectedPreset}_preset.pdf` : 'custom_rules.txt',
          fileType: sourceType,
          fileSize: pdfFile ? `${(pdfFile.size / 1024).toFixed(1)} KB` : undefined,
          uploadedAt: new Date().toISOString(),
          hasPdf: !!pdfBase64,
          pdfBase64: pdfBase64 || undefined,
          textContent: rawText || undefined,
        },
        ruleAnalysis: analysis || {
          title: title.trim(),
          overview: 'Custom tabletop game match initialized with uploaded rules.',
          winCondition: 'First player to reach the victory threshold.',
          turnStructure: ['Phase 1: Roll or Draw', 'Phase 2: Action or Trade', 'Phase 3: Resolve & Pass'],
          keyRules: ['Follow turn order', 'Obey rulebook constraints'],
          forbiddenMoves: ['Playing out of turn', 'Cheating on costs'],
          teacherTips: ['Plan ahead each turn', 'Check rule citations with the chatbot'],
          judgeChecklist: ['Verify move conditions', 'Confirm costs paid'],
          playerStrategy: 'Tactical play with balanced resource management.',
        },
      };

      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gamePayload),
      });

      if (!res.ok) throw new Error('Failed to create game');
      const newGame = await res.json();
      onGameCreated(newGame);
      onClose();
    } catch (err: any) {
      setAnalysisError(err.message || 'Error creating game');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl my-8 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Dice5 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create New Game</h2>
              <p className="text-xs text-slate-400">
                Upload a rulebook PDF for AI Teacher, Judge, or Player analysis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleCreateGame} className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {analysisError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{analysisError}</span>
            </div>
          )}

          {/* Section 1: Basic Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Game Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Catan Championship, Poker Night, Dungeon Crawl"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-950/70 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="board_game">Board Game</option>
                <option value="card_game">Card Game</option>
                <option value="strategy">Strategy</option>
                <option value="rpg">Tabletop RPG</option>
                <option value="party">Party / Trivia</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          {/* Section 2: Rulebook Source Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                Upload Rulebook (PDF) or Select Rules
              </label>
              <span className="text-[11px] text-slate-400">PDFs are analyzed using Gemini vision</span>
            </div>

            {/* Source Type Switcher */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setSourceType('pdf')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
                  sourceType === 'pdf'
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload PDF Rulebook
              </button>
              <button
                type="button"
                onClick={() => {
                  setSourceType('preset');
                  handlePresetChange(selectedPreset);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
                  sourceType === 'preset'
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Official Presets (Instant)
              </button>
              <button
                type="button"
                onClick={() => setSourceType('text')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
                  sourceType === 'text'
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Paste Text
              </button>
            </div>

            {/* Tab 1: PDF Dropzone */}
            {sourceType === 'pdf' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    dragOver
                      ? 'border-indigo-400 bg-indigo-950/40'
                      : pdfFile
                      ? 'border-emerald-500/50 bg-emerald-950/20'
                      : 'border-slate-700 hover:border-slate-500 bg-slate-950/40'
                  }`}
                >
                  {pdfFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-semibold text-white">{pdfFile.name}</div>
                        <div className="text-xs text-slate-400">
                          {(pdfFile.size / 1024).toFixed(1)} KB • Click to choose another PDF
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-indigo-300">Click to upload PDF rules</span>
                        <span className="text-xs text-slate-400"> or drag and drop</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Board game rulebooks, manuals, homebrew rules (.pdf)</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Presets */}
            {sourceType === 'preset' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    key: 'catan_lite',
                    name: 'Catan Island Express',
                    badge: 'Resource & Trading',
                    desc: 'Hex production, road/settlement distance rules, 10 VP goal.',
                  },
                  {
                    key: 'monopoly_deal',
                    name: 'Property Duel',
                    badge: 'Card Battle',
                    desc: 'Fast card collection, rent charges, forced deals & cancel reactions.',
                  },
                  {
                    key: 'dungeon_dice',
                    name: 'Dungeon & Dragon Dice',
                    badge: 'TTRPG Encounter',
                    desc: 'D20 skill checks, monster AC, spell slots & combat phases.',
                  },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handlePresetChange(item.key as any)}
                    className={`p-3 text-left rounded-xl border transition-all ${
                      selectedPreset === item.key
                        ? 'bg-indigo-950/40 border-indigo-500 text-white ring-1 ring-indigo-500/30'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-semibold text-indigo-300">{item.badge}</div>
                    <div className="text-sm font-bold text-white mt-0.5">{item.name}</div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">{item.desc}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Tab 3: Text */}
            {sourceType === 'text' && (
              <div className="space-y-2">
                <textarea
                  rows={4}
                  placeholder="Paste your rulebook text here... Include win conditions, turn sequence, and actions."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  disabled={!rawText.trim() || analyzing}
                  onClick={() => runAnalysis({ textContent: rawText })}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Analyze Pasted Rules
                </button>
              </div>
            )}
          </div>

          {/* Section 3: Live AI Rule Analysis Summary */}
          {analyzing ? (
            <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-xl flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
              <div>
                <div className="text-xs font-semibold text-indigo-200">Analyzing rulebook with Gemini AI...</div>
                <div className="text-[11px] text-slate-400">
                  Extracting turn phases, illegal actions, victory thresholds, and referee checklists.
                </div>
              </div>
            </div>
          ) : analysis ? (
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Rulebook Analysis Ready
                </span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                  {analysis.title || 'Official Rules'}
                </span>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <strong className="text-indigo-300">Overview: </strong>
                {analysis.overview}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-amber-300 font-semibold flex items-center gap-1 mb-1">
                    🏆 Win Condition
                  </span>
                  <p className="text-slate-300 text-[11px]">{analysis.winCondition}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-rose-300 font-semibold flex items-center gap-1 mb-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Illegal Actions Protected
                  </span>
                  <p className="text-slate-300 text-[11px] truncate">
                    {analysis.forbiddenMoves?.slice(0, 2).join('; ') || 'Strict distance & turn rules'}
                  </p>
                </div>
              </div>

              {analysis.turnStructure && analysis.turnStructure.length > 0 && (
                <div className="text-xs">
                  <span className="text-slate-400 font-semibold block mb-1">Turn Sequence:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.turnStructure.map((step, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700"
                      >
                        {step}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Section 4: Initial Chatbot Role */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Initial Chatbot Role (can be switched anytime during play)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  role: 'teacher' as ChatbotRole,
                  title: 'Teacher',
                  icon: BookOpen,
                  color: 'indigo',
                  desc: 'Explains rules step-by-step, teaches moves, answers "how-to" questions.',
                },
                {
                  role: 'judge' as ChatbotRole,
                  title: 'Judge',
                  icon: Scale,
                  color: 'amber',
                  desc: 'Referees games, verifies move legality, resolves player disputes with rule citations.',
                },
                {
                  role: 'player' as ChatbotRole,
                  title: 'Player',
                  icon: Bot,
                  color: 'emerald',
                  desc: 'Acts as an active opponent, makes tactical plays, takes turns and rolls dice.',
                },
              ].map((item) => {
                const isSelected = activeRole === item.role;
                const Icon = item.icon;
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setActiveRole(item.role)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-950/50 border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                        : 'bg-slate-800/60 border-slate-700/70 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-white">{item.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Players Configuration */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                Players Configuration
              </label>
              <button
                type="button"
                onClick={handleAddPlayer}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                + Add Player
              </button>
            </div>
            <div className="space-y-2">
              {players.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800"
                >
                  <input
                    type="color"
                    value={p.color}
                    onChange={(e) => handlePlayerChange(p.id, 'color', e.target.value)}
                    className="w-7 h-7 rounded border-none bg-transparent cursor-pointer"
                    title="Player Color"
                  />
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => handlePlayerChange(p.id, 'name', e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                    placeholder={`Player ${idx + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => handlePlayerChange(p.id, 'isAi', !p.isAi)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold border transition-all ${
                      p.isAi
                        ? 'bg-purple-950/50 border-purple-500/50 text-purple-300'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    {p.isAi ? '🤖 AI' : '👤 Human'}
                  </button>
                  {players.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePlayer(p.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || analyzing || !title.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <span>{submitting ? 'Creating Game...' : 'Initialize & Play Game'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
