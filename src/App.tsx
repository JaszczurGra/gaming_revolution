import React, { useState, useEffect } from 'react';
import { Game, User } from './types';
import { fetchGames, fetchUsers, loginUser, deleteGame } from './utils/api';
import { Header } from './components/Header';
import { FakeLoginModal } from './components/FakeLoginModal';
import { CreateGameModal } from './components/CreateGameModal';
import { GameList } from './components/GameList';
import { GameArena } from './components/GameArena';
import { RulesViewerModal } from './components/RulesViewerModal';
import { Sparkles, Shield, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [presetUsers, setPresetUsers] = useState<User[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCreateGameModalOpen, setIsCreateGameModalOpen] = useState(false);
  const [inspectRulesGame, setInspectRulesGame] = useState<Game | null>(null);

  // 1. Load initial users and restore session
  useEffect(() => {
    async function initAuth() {
      try {
        const users = await fetchUsers();
        setPresetUsers(users);

        // Check local storage for previous user
        const storedUserJson = localStorage.getItem('gameplay_user');
        if (storedUserJson) {
          try {
            const parsed = JSON.parse(storedUserJson);
            setCurrentUser(parsed);
          } catch {
            if (users.length > 0) setCurrentUser(users[0]);
          }
        } else if (users.length > 0) {
          setCurrentUser(users[0]);
          localStorage.setItem('gameplay_user', JSON.stringify(users[0]));
        }
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  // 2. Load games whenever currentUser changes
  useEffect(() => {
    if (!currentUser) return;

    async function loadGames() {
      setLoading(true);
      try {
        const userGames = await fetchGames(currentUser?.id);
        setGames(userGames);

        // If active game is in the list, keep it updated
        if (activeGame) {
          const fresh = userGames.find((g) => g.id === activeGame.id);
          if (fresh) setActiveGame(fresh);
        } else if (userGames.length > 0 && !activeGame) {
          // Keep on dashboard by default or allow opening
        }
      } catch (err) {
        console.error('Failed to load games:', err);
      } finally {
        setLoading(false);
      }
    }

    loadGames();
  }, [currentUser?.id]);

  // Handle switching preset user
  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('gameplay_user', JSON.stringify(user));
    setActiveGame(null);
  };

  // Handle custom fake login
  const handleCreateCustomUser = async (username: string, displayName: string, avatar: string) => {
    const res = await loginUser({ username, displayName, avatar });
    setCurrentUser(res.user);
    localStorage.setItem('gameplay_user', JSON.stringify(res.user));
    setActiveGame(null);
  };

  // Handle new game created
  const handleGameCreated = (newGame: Game) => {
    setGames((prev) => [newGame, ...prev]);
    setActiveGame(newGame);
  };

  // Handle game update from arena or chat
  const handleUpdateGame = (updatedGame: Game) => {
    setActiveGame(updatedGame);
    setGames((prev) => prev.map((g) => (g.id === updatedGame.id ? updatedGame : g)));
  };

  // Handle game deletion
  const handleDeleteGame = async (id: string) => {
    const confirm = window.confirm('Are you sure you want to delete this game and all stored progress?');
    if (!confirm) return;

    try {
      await deleteGame(id);
      setGames((prev) => prev.filter((g) => g.id !== id));
      if (activeGame?.id === id) {
        setActiveGame(null);
      }
    } catch (err) {
      console.error('Failed to delete game:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navigation */}
      <Header
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenNewGame={() => setIsCreateGameModalOpen(true)}
        onGoHome={() => setActiveGame(null)}
        activeGameTitle={activeGame?.title}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        {loading && !activeGame && games.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Loading game session and rulebook databases...</p>
          </div>
        ) : activeGame ? (
          <GameArena
            game={activeGame}
            onUpdateGame={handleUpdateGame}
            onBackToDashboard={() => setActiveGame(null)}
          />
        ) : (
          <GameList
            games={games}
            currentUser={currentUser}
            onSelectGame={(game) => setActiveGame(game)}
            onOpenNewGame={() => setIsCreateGameModalOpen(true)}
            onDeleteGame={handleDeleteGame}
            onOpenRules={(game) => setInspectRulesGame(game)}
          />
        )}
      </main>

      {/* Modals */}
      <FakeLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={currentUser}
        presetUsers={presetUsers}
        onSelectUser={handleSelectUser}
        onCreateCustomUser={handleCreateCustomUser}
      />

      {currentUser && (
        <CreateGameModal
          isOpen={isCreateGameModalOpen}
          onClose={() => setIsCreateGameModalOpen(false)}
          userId={currentUser.id}
          userName={currentUser.displayName}
          onGameCreated={handleGameCreated}
        />
      )}

      <RulesViewerModal
        isOpen={!!inspectRulesGame}
        onClose={() => setInspectRulesGame(null)}
        game={inspectRulesGame}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>GamePlay Companion • AI Rulebook Engine & Tabletop Referee</span>
          <span className="text-[11px] text-slate-600">
            Multimodal Gemini 3.8 Flash • Persistent Game Progress Storage
          </span>
        </div>
      </footer>
    </div>
  );
}
