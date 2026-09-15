import React from 'react';
import { User } from '../types';
import { Dice6, LogIn, Plus, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  onOpenLogin: () => void;
  onOpenNewGame: () => void;
  onGoHome: () => void;
  activeGameTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenLogin,
  onOpenNewGame,
  onGoHome,
  activeGameTitle,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Active View */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={onGoHome}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            <Dice6 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                GamePlay Companion
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                AI Rulebook Engine
              </span>
            </div>
            {activeGameTitle ? (
              <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
                Playing: <span className="text-indigo-300 font-medium">{activeGameTitle}</span>
              </p>
            ) : (
              <p className="text-xs text-slate-400">Rules Analyzer, Referee & Tabletop Opponent</p>
            )}
          </div>
        </div>

        {/* Actions & User Profile */}
        <div className="flex items-center gap-3">
          <button
            id="header-new-game-btn"
            onClick={onOpenNewGame}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-sm font-medium shadow-md shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Game</span>
          </button>

          {/* Fake Login / User Switcher */}
          {currentUser ? (
            <button
              id="header-user-profile-btn"
              onClick={onOpenLogin}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 transition-colors text-left cursor-pointer"
              title="Click to switch user or edit profile"
            >
              <span className="text-xl" role="img" aria-label="avatar">
                {currentUser.avatar || '🎮'}
              </span>
              <div className="hidden md:block">
                <div className="text-xs font-semibold text-slate-100 flex items-center gap-1">
                  {currentUser.displayName}
                  <UserCheck className="w-3 h-3 text-emerald-400" />
                </div>
                <div className="text-[10px] text-slate-400">
                  {currentUser.gamesWon}W / {currentUser.gamesPlayed} Matches
                </div>
              </div>
            </button>
          ) : (
            <button
              id="header-fake-login-btn"
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-indigo-400" />
              <span>Fake Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
