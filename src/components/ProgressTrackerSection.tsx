import React, { useState } from 'react';
import { MilestoneProgress, PlayerState } from '../types';
import {
  Trophy,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  TrendingUp,
  Award,
  Zap,
  Star,
  Users,
  Flag,
} from 'lucide-react';

interface ProgressTrackerSectionProps {
  currentTurn: number;
  players: PlayerState[];
  milestones: MilestoneProgress[];
  totalMovesCount: number;
  onMilestonesChange: (milestones: MilestoneProgress[]) => void;
  onAdvanceTurn?: () => void;
  onPlayerScoreChange?: (playerId: string, delta: number) => void;
}

const DEFAULT_MILESTONES: MilestoneProgress[] = [
  {
    id: 'm_1',
    title: 'First Territory Settlement',
    description: 'Establish your initial base or placement on the board.',
    targetPoints: 1,
    completed: true,
    completedAt: 'Turn 1',
  },
  {
    id: 'm_2',
    title: 'Resource Expansion Engine',
    description: 'Connect road or route across 3 continuous tiles.',
    targetPoints: 2,
    completed: false,
  },
  {
    id: 'm_3',
    title: 'Midgame Stronghold / City Upgrade',
    description: 'Upgrade an existing outpost into a 2-point production hub.',
    targetPoints: 4,
    completed: false,
  },
  {
    id: 'm_4',
    title: 'Grandmaster Victory Threshold',
    description: 'Reach maximum victory point requirement to win match.',
    targetPoints: 10,
    completed: false,
  },
];

export const ProgressTrackerSection: React.FC<ProgressTrackerSectionProps> = ({
  currentTurn,
  players = [],
  milestones = [],
  totalMovesCount,
  onMilestonesChange,
  onAdvanceTurn,
  onPlayerScoreChange,
}) => {
  const activeMilestones = milestones.length > 0 ? milestones : DEFAULT_MILESTONES;
  const [newTitle, setNewTitle] = useState('');
  const [newPoints, setNewPoints] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);

  const completedCount = activeMilestones.filter((m) => m.completed).length;
  const progressPercent = Math.round((completedCount / (activeMilestones.length || 1)) * 100);

  // Leader calculation
  const leader = [...players].sort((a, b) => b.score - a.score)[0];

  const handleToggleMilestone = (id: string) => {
    const updated = activeMilestones.map((m) => {
      if (m.id === id) {
        return {
          ...m,
          completed: !m.completed,
          completedAt: !m.completed ? `Turn ${currentTurn}` : undefined,
        };
      }
      return m;
    });
    onMilestonesChange(updated);
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newM: MilestoneProgress = {
      id: 'mile_' + Date.now(),
      title: newTitle.trim(),
      description: `Custom goal set for Turn ${currentTurn}`,
      targetPoints: Number(newPoints) || 1,
      completed: false,
    };

    onMilestonesChange([...activeMilestones, newM]);
    setNewTitle('');
    setNewPoints(1);
    setShowAddForm(false);
  };

  const handleDeleteMilestone = (id: string) => {
    onMilestonesChange(activeMilestones.filter((m) => m.id !== id));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Match Progress & Milestone Tracker
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Turn {currentTurn}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Real-time campaign progress, victory point curves, and objective achievements stored persistently.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Objective</span>
        </button>
      </div>

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Current Round
          </span>
          <div className="flex items-center justify-between">
            <span className="text-lg font-extrabold text-white">Turn {currentTurn}</span>
            {onAdvanceTurn && (
              <button
                type="button"
                onClick={onAdvanceTurn}
                className="text-[10px] px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors cursor-pointer"
              >
                + Next Turn
              </button>
            )}
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Move Logged
          </span>
          <div className="text-lg font-extrabold text-indigo-400">
            {totalMovesCount} {totalMovesCount === 1 ? 'Action' : 'Actions'}
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Objectives Completed
          </span>
          <div className="text-lg font-extrabold text-emerald-400">
            {completedCount} / {activeMilestones.length}
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Leading Player
          </span>
          <div className="text-xs font-bold text-amber-300 truncate flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{leader ? `${leader.name} (${leader.score} pts)` : 'Tied'}</span>
          </div>
        </div>
      </div>

      {/* Progress Completion Bar */}
      <div className="space-y-1.5 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-semibold flex items-center gap-1.5">
            <Flag className="w-3.5 h-3.5 text-amber-400" /> Match Objective Completion
          </span>
          <span className="text-amber-400 font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Player Score Quick Adjusters */}
      {players.length > 0 && onPlayerScoreChange && (
        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Player Standings & Quick Point Adjustment
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800"
              >
                <div className="flex items-center gap-2 truncate">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: p.color || '#6366F1' }}
                  />
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {p.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-bold text-amber-400 mr-1">
                    {p.score} pts
                  </span>
                  <button
                    type="button"
                    onClick={() => onPlayerScoreChange(p.id, -1)}
                    className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => onPlayerScoreChange(p.id, 1)}
                    className="w-5 h-5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Milestone Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddMilestone}
          className="bg-slate-950/80 p-3 rounded-xl border border-indigo-500/30 flex flex-col sm:flex-row gap-2 items-center"
        >
          <input
            type="text"
            placeholder="Objective title (e.g. Build Longest Road, Defeat Goblin Boss)..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full"
          />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="number"
              min={1}
              max={50}
              value={newPoints}
              onChange={(e) => setNewPoints(parseInt(e.target.value) || 1)}
              className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-indigo-500"
              title="Target victory points"
            />
            <span className="text-xs text-slate-400">pts</span>
            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Add
            </button>
          </div>
        </form>
      )}

      {/* Milestone Checklists */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Key Campaign Milestones
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {activeMilestones.map((m) => (
            <div
              key={m.id}
              onClick={() => handleToggleMilestone(m.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                m.completed
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-100'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5">
                  {m.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-bold ${
                        m.completed ? 'line-through text-slate-400' : 'text-slate-200'
                      }`}
                    >
                      {m.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/20">
                      +{m.targetPoints} VP
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                    {m.description}
                  </p>
                  {m.completedAt && (
                    <span className="text-[9px] text-emerald-400 font-semibold block mt-1">
                      Completed {m.completedAt}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteMilestone(m.id);
                }}
                className="text-slate-600 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                title="Delete milestone"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
