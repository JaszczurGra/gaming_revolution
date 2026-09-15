import React, { useState } from 'react';
import { Game, User } from '../types';
import {
  Dice6,
  Plus,
  Play,
  Trash2,
  BookOpen,
  Calendar,
  Clock,
  Trophy,
  Users,
  Sparkles,
  Bot,
  Scale,
} from 'lucide-react';

interface GameListProps {
  games: Game[];
  currentUser: User | null;
  onSelectGame: (game: Game) => void;
  onOpenNewGame: () => void;
  onDeleteGame: (id: string) => void;
  onOpenRules: (game: Game) => void;
}

export const GameList: React.FC<GameListProps> = ({
  games,
  currentUser,
  onSelectGame,
  onOpenNewGame,
  onDeleteGame,
  onOpenRules,
}) => {
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [search, setSearch] = useState('');

  const filteredGames = games.filter((g) => {
    if (filter !== 'all' && g.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        g.title.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        g.ruleSource.fileName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeCount = games.filter((g) => g.status === 'in_progress').length;
  const completedCount = games.filter((g) => g.status === 'completed').length;
  const totalMoves = games.reduce((acc, g) => acc + (g.moves?.length || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Welcome Hero / User Profile Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Smart Rulebook AI & Game Master</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {currentUser?.displayName || 'Player'}!
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Upload any game rulebook in PDF format. The chatbot automatically extracts mechanics and
              stands ready to guide you as a <span className="text-indigo-300 font-medium">Teacher</span>, referee moves as a <span className="text-amber-300 font-medium">Judge</span>, or compete as an <span className="text-emerald-300 font-medium">Opponent</span>.
            </p>
          </div>

          <button
            onClick={onOpenNewGame}
            className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Game</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Active Matches
            </span>
            <span className="text-2xl font-black text-white">{activeCount}</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Completed Games
            </span>
            <span className="text-2xl font-black text-indigo-300">{completedCount}</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Turns & Moves Stored
            </span>
            <span className="text-2xl font-black text-emerald-400">{totalMoves}</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Logged Persona
            </span>
            <span className="text-sm font-bold text-slate-200 truncate block mt-1">
              {currentUser?.avatar} {currentUser?.title || 'Player'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl w-full sm:w-auto">
          {(['all', 'in_progress', 'completed'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                filter === f
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search by game title, category, or rulebook..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Games Cards Grid */}
      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGames.map((game) => {
            const activePlayer = game.players[game.activePlayerIndex] || game.players[0];

            return (
              <div
                key={game.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all hover:shadow-2xl flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header: Category badge & Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                      {game.category.replace('_', ' ')}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        game.status === 'completed'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {game.status === 'completed' ? 'Completed' : 'In Progress'}
                    </span>
                  </div>

                  {/* Title & Rule file */}
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {game.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <BookOpen className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{game.ruleSource.fileName}</span>
                  </div>

                  {/* Players list snippet */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> Players ({game.players.length})
                      </span>
                      <span className="font-semibold text-slate-300">Turn #{game.currentTurn}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {game.players.map((p) => (
                        <div
                          key={p.id}
                          className="px-2 py-0.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] flex items-center gap-1.5"
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                          <span className="font-medium text-slate-200">{p.name}</span>
                          <span className="font-bold text-indigo-400">{p.score}pts</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chatbot Role badge & Moves tally */}
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      {game.activeChatbotRole === 'judge' ? (
                        <Scale className="w-3.5 h-3.5 text-amber-400" />
                      ) : game.activeChatbotRole === 'player' ? (
                        <Bot className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                      <span className="capitalize">{game.activeChatbotRole} mode</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {game.moves?.length || 0} moves • {game.chatHistory?.length || 0} messages
                    </span>
                  </div>
                </div>

                {/* Actions bottom */}
                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onOpenRules(game)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Inspect Rules Analysis"
                    >
                      <BookOpen className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteGame(game.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Delete Game"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectGame(game)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Play & Resume</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
            <Dice6 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No games found</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Create a new game and upload a rulebook PDF to start playing with the AI Teacher, Judge, and Opponent!
            </p>
          </div>
          <div>
            <button
              onClick={onOpenNewGame}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Game</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
