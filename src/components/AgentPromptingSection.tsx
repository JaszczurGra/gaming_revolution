import React, { useState } from 'react';
import { AgentPromptConfig, ChatbotRole } from '../types';
import {
  Sliders,
  Bot,
  BrainCircuit,
  Scale,
  Sparkles,
  Zap,
  Save,
  RotateCcw,
  Check,
  ShieldCheck,
  MessageSquareCode,
} from 'lucide-react';

interface AgentPromptingSectionProps {
  currentConfig?: AgentPromptConfig;
  activeRole: ChatbotRole;
  onSaveConfig: (newConfig: AgentPromptConfig) => void;
  onRoleChange: (role: ChatbotRole) => void;
}

const PRESET_PERSONAS = [
  {
    name: 'Patient Grandmaster',
    role: 'teacher' as const,
    persona: 'Wise, articulate mentor who explains the subtle math, probabilities, and tactical reasons behind every move.',
    difficulty: 'standard' as const,
    strictness: 'standard' as const,
    instructions: 'Always explain the reasoning behind tactical choices and cite rule numbers when possible.',
  },
  {
    name: 'Tournament Arbiter',
    role: 'judge' as const,
    persona: 'Strict, no-nonsense competitive referee adhering strictly to official tournament rules.',
    difficulty: 'grandmaster' as const,
    strictness: 'tournament_strict' as const,
    instructions: 'Disallow any ambiguous or out-of-order phase actions. Provide explicit rulebook quotes.',
  },
  {
    name: 'Tactical Rival (Hard Bot)',
    role: 'player' as const,
    persona: 'Calculating, aggressive AI opponent who executes optimal point denial and trades competitively.',
    difficulty: 'grandmaster' as const,
    strictness: 'standard' as const,
    instructions: 'Focus on cutting off opponent expansion routes and keeping score pressure high.',
  },
  {
    name: 'Casual Game Night Pal',
    role: 'player' as const,
    persona: 'Friendly, humorous board game enthusiast who loves playful banter, thematic commentary, and fun risks.',
    difficulty: 'beginner' as const,
    strictness: 'forgiving' as const,
    instructions: 'Keep responses light-hearted, celebrate good player rolls, and suggest creative thematic plays.',
  },
];

export const AgentPromptingSection: React.FC<AgentPromptingSectionProps> = ({
  currentConfig,
  activeRole,
  onSaveConfig,
  onRoleChange,
}) => {
  const [customPersona, setCustomPersona] = useState(
    currentConfig?.customPersonaPrompt || ''
  );
  const [difficulty, setDifficulty] = useState<'beginner' | 'standard' | 'grandmaster'>(
    currentConfig?.difficulty || 'standard'
  );
  const [strictness, setStrictness] = useState<'forgiving' | 'standard' | 'tournament_strict'>(
    currentConfig?.strictness || 'standard'
  );
  const [customInstructions, setCustomInstructions] = useState(
    currentConfig?.customInstructions || ''
  );
  const [savedStatus, setSavedStatus] = useState(false);

  const handleApply = () => {
    onSaveConfig({
      customPersonaPrompt: customPersona,
      difficulty,
      strictness,
      customInstructions,
    });
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2500);
  };

  const handleApplyPreset = (p: (typeof PRESET_PERSONAS)[0]) => {
    setCustomPersona(p.persona);
    setDifficulty(p.difficulty);
    setStrictness(p.strictness);
    setCustomInstructions(p.instructions);
    onRoleChange(p.role);
    onSaveConfig({
      customPersonaPrompt: p.persona,
      difficulty: p.difficulty,
      strictness: p.strictness,
      customInstructions: p.instructions,
    });
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2500);
  };

  const handleReset = () => {
    setCustomPersona('');
    setDifficulty('standard');
    setStrictness('standard');
    setCustomInstructions('');
    onSaveConfig({
      customPersonaPrompt: '',
      difficulty: 'standard',
      strictness: 'standard',
      customInstructions: '',
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Agent Prompting & Persona Configuration
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Active: {activeRole.toUpperCase()}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Customize the AI assistant's system instructions, referee strictness, difficulty level, and conversational persona.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
          >
            {savedStatus ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Prompt Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Apply Prompt</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preset Personas Row */}
      <div>
        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          Fast Persona Templates
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PRESET_PERSONAS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 text-left transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold text-white group-hover:text-indigo-300">
                    {p.name}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-semibold">
                    {p.role}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                  {p.persona}
                </p>
              </div>
              <span className="text-[10px] text-indigo-400 font-medium mt-2 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Use Preset
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Sliders & Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Role Switcher & Difficulty */}
        <div className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Active Agent Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['teacher', 'judge', 'player'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onRoleChange(r)}
                  className={`p-2 rounded-lg text-xs font-semibold capitalize flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeRole === r
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {r === 'teacher' && <BrainCircuit className="w-3.5 h-3.5" />}
                  {r === 'judge' && <Scale className="w-3.5 h-3.5" />}
                  {r === 'player' && <Bot className="w-3.5 h-3.5" />}
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Bot Opponent Tactical Difficulty
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['beginner', 'standard', 'grandmaster'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`p-2 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    difficulty === d
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Judge Strictness & Ruling Leniency
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['forgiving', 'standard', 'tournament_strict'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStrictness(s)}
                  className={`p-2 rounded-lg text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                    strictness === s
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Custom Persona & Specific Instructions Prompt */}
        <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Custom Persona & Speaking Style
            </label>
            <input
              type="text"
              placeholder="e.g. Victorian gentleman, robotic AI referee, or medieval dungeon master..."
              value={customPersona}
              onChange={(e) => setCustomPersona(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Custom Agent Instructions / Rule Directives
            </label>
            <textarea
              rows={3}
              placeholder="Provide specific guidelines, e.g. 'Never trade wheat for brick under 2:1 ratio', 'Always enforce 30-second turn limit', 'Explain dice odds in percentages'..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none font-mono"
            />
          </div>

          <div className="text-[11px] text-indigo-300/80 flex items-center gap-1.5 bg-indigo-950/30 border border-indigo-500/20 p-2 rounded-lg">
            <MessageSquareCode className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
            <span>These prompt constraints are passed to Gemini server-side with each chat turn.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
