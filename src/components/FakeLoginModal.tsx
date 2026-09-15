import React, { useState } from 'react';
import { User } from '../types';
import { UserCheck, Shield, Sparkles, X, Check, Award } from 'lucide-react';

interface FakeLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  presetUsers: User[];
  onSelectUser: (user: User) => void;
  onCreateCustomUser: (username: string, displayName: string, avatar: string) => Promise<void>;
}

const AVATAR_CHOICES = ['🧙‍♂️', '🎲', '⚖️', '👑', '🐉', '⚔️', '🛡️', '🎯', '🚀', '🦊', '🦉', '🤖'];

export const FakeLoginModal: React.FC<FakeLoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  presetUsers,
  onSelectUser,
  onCreateCustomUser,
}) => {
  const [tab, setTab] = useState<'presets' | 'custom'>('presets');
  const [customUsername, setCustomUsername] = useState('');
  const [customDisplayName, setCustomDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🎲');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUsername.trim()) return;
    setLoading(true);
    try {
      await onCreateCustomUser(
        customUsername.trim(),
        customDisplayName.trim() || customUsername.trim(),
        selectedAvatar
      );
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Fake Login & Authentication</h3>
              <p className="text-xs text-slate-400">Select an existing persona or create a game profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1 mx-6 mt-4 rounded-xl">
          <button
            type="button"
            onClick={() => setTab('presets')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              tab === 'presets'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Preset Personas
          </button>
          <button
            type="button"
            onClick={() => setTab('custom')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              tab === 'custom'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Custom Account
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {tab === 'presets' ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 mb-3">
                Choose a pre-configured player account to instantly load their game history and stats:
              </p>
              {presetUsers.map((user) => {
                const isSelected = currentUser?.id === user.id;
                return (
                  <div
                    key={user.id}
                    onClick={() => {
                      onSelectUser(user);
                      onClose();
                    }}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30'
                        : 'bg-slate-800/60 border-slate-700/70 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-1 bg-slate-800 rounded-lg">{user.avatar}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{user.displayName}</span>
                          {isSelected && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> Active
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>@{user.username}</span>
                          <span>•</span>
                          <span className="text-indigo-300 font-medium">{user.title}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-200 flex items-center gap-1 justify-end">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        {user.gamesWon} Wins
                      </div>
                      <div className="text-[10px] text-slate-400">{user.gamesPlayed} games played</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleCreateCustom} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Choose an Avatar
                </label>
                <div className="flex flex-wrap gap-2 p-2 bg-slate-950/50 border border-slate-800 rounded-xl">
                  {AVATAR_CHOICES.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedAvatar(emoji)}
                      className={`text-2xl w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                        selectedAvatar === emoji
                          ? 'bg-indigo-600 text-white scale-110 shadow-md ring-2 ring-indigo-400'
                          : 'hover:bg-slate-800'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Username <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. dragon_slayer_99"
                  value={customUsername}
                  onChange={(e) => setCustomUsername(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sir Roland of Eldoria"
                  value={customDisplayName}
                  onChange={(e) => setCustomDisplayName(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !customUsername.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  {loading ? 'Creating Account...' : 'Sign In as Custom Player'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
