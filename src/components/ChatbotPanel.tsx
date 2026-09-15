import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Game, ChatbotRole, ChatMessage } from '../types';
import { sendChatMessage } from '../utils/api';
import { BoardDiagram, parseBoardState } from './BoardDiagram';
import {
  BookOpen,
  Scale,
  Bot,
  Send,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  BookmarkPlus,
  Compass,
  Zap,
} from 'lucide-react';

interface ChatbotPanelProps {
  game: Game;
  onUpdateGame: (updatedGame: Game) => void;
  onLogBotMove?: (description: string) => void;
}

const QUICK_CHIPS: Record<ChatbotRole, string[]> = {
  teacher: [
    'Explain the turn phases step-by-step',
    'What is the win condition for this game?',
    'What is the best opening move strategy?',
    'Can you give me a beginner tip?',
  ],
  judge: [
    'Is it legal to trade cards out of turn?',
    'Resolve dispute: What happens on a tie roll?',
    'Check move: Can I build without road connection?',
    'What is the penalty for exceeding hand limit?',
  ],
  player: [
    "It's your turn, roll the dice and make your move!",
    'What is your next target on the board?',
    'I challenge your position, what do you do?',
    'Declare your action for this round',
  ],
};

export const ChatbotPanel: React.FC<ChatbotPanelProps> = ({ game, onUpdateGame, onLogBotMove }) => {
  const [activeRole, setActiveRole] = useState<ChatbotRole>(game.activeChatbotRole || 'teacher');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync role if game updates
  useEffect(() => {
    if (game.activeChatbotRole && game.activeChatbotRole !== activeRole) {
      setActiveRole(game.activeChatbotRole);
    }
  }, [game.activeChatbotRole]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [game.chatHistory, loading]);

  // Extract the most recent board-state JSON emitted by the model (<!-- BOARD_STATE_START --> blocks).
  const BOARD_START = '<!-- BOARD_STATE_START -->';
  const BOARD_END = '<!-- BOARD_STATE_END -->';
  const boardState = useMemo(() => {
    const history = game.chatHistory ?? [];
    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i];
      if (msg.sender !== 'bot') continue;
      const text = msg.text ?? '';
      const start = text.indexOf(BOARD_START);
      const end = text.indexOf(BOARD_END);
      if (start !== -1 && end !== -1) {
        const raw = text.slice(start + BOARD_START.length, end).trim();
        const parsed = parseBoardState(raw);
        if (parsed) return parsed;
      }
    }
    return null;
  }, [game.chatHistory]);

  const handleRoleSwitch = (role: ChatbotRole) => {
    setActiveRole(role);
    onUpdateGame({
      ...game,
      activeChatbotRole: role,
    });
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage(game.id, textToSend.trim(), activeRole);
      onUpdateGame(res.game);
    } catch (err: any) {
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const roleStyles = {
    teacher: {
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/30',
      activeTab: 'bg-indigo-600 text-white shadow-md',
      name: 'Teacher / Tutor',
      desc: 'Explains rules & guides moves',
      icon: BookOpen,
    },
    judge: {
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      activeTab: 'bg-amber-600 text-white shadow-md',
      name: 'Judge / Referee',
      desc: 'Validates legality & cites rules',
      icon: Scale,
    },
    player: {
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      activeTab: 'bg-emerald-600 text-white shadow-md',
      name: 'Player / Opponent',
      desc: 'Plays turns & challenges you',
      icon: Bot,
    },
  };

  const currentRoleStyle = roleStyles[activeRole];

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Role Switcher Tabs */}
      <div className="p-3 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Chatbot Role Mode
          </span>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${currentRoleStyle.bg} ${currentRoleStyle.color} ${currentRoleStyle.border} border`}>
            Active: {currentRoleStyle.name}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
          {(['teacher', 'judge', 'player'] as ChatbotRole[]).map((r) => {
            const isSelected = activeRole === r;
            const item = roleStyles[r];
            const Icon = item.icon;
            return (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleSwitch(r)}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isSelected ? item.activeTab : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="capitalize">{r}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-400 mt-2 px-1">{currentRoleStyle.desc}</p>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {game.chatHistory.map((msg) => {
          const isBot = msg.sender === 'bot';
          const msgRole = msg.role || 'teacher';
          const msgRoleStyle = roleStyles[msgRole] || roleStyles.teacher;
          const RoleIcon = msgRoleStyle.icon;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
            >
              {/* Sender label */}
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400">
                {isBot ? (
                  <>
                    <span className={`flex items-center gap-1 font-semibold ${msgRoleStyle.color}`}>
                      <RoleIcon className="w-3 h-3" />
                      {msgRoleStyle.name}
                    </span>
                    <span>•</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </>
                ) : (
                  <>
                    <span>You</span>
                    <span>•</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  isBot
                    ? 'bg-slate-800/90 text-slate-200 border border-slate-700/80 shadow-sm'
                    : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Judge Citation if attached */}
                {msg.citation && (
                  <div className="mt-2 pt-2 border-t border-slate-700 text-[11px] text-amber-300 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 shrink-0" />
                    <span>Citation: {msg.citation}</span>
                  </div>
                )}

                {/* Log Bot Move button when in Player mode */}
                {isBot && msg.role === 'player' && onLogBotMove && (
                  <div className="mt-2.5 pt-2 border-t border-slate-700 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onLogBotMove(msg.text.slice(0, 160))}
                      className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <BookmarkPlus className="w-3 h-3" />
                      Log Bot Action to Turn History
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-2">
            <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-xs text-slate-300 flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-400 rounded-full animate-ping" />
              <span>AI {currentRoleStyle.name} is thinking with rulebook context...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Chips */}
      <div className="px-3 pt-2 pb-1 bg-slate-950/60 border-t border-slate-800">
        <div className="text-[10px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" />
          Suggested Questions:
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          {QUICK_CHIPS[activeRole].map((chip, idx) => (
            <button
              key={idx}
              type="button"
              disabled={loading}
              onClick={() => handleSend(chip)}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors shrink-0 cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Live Board State Panel */}
      <div className="px-3 py-2 border-t border-slate-800 bg-slate-950/40">
        <div className="text-[10px] text-slate-400 font-semibold mb-1.5 flex items-center gap-1">
          <Compass className="w-3 h-3 text-teal-400" />
          Live Board State
        </div>
        {boardState ? (
          <BoardDiagram board={boardState} />
        ) : (
          <p className="text-[10px] text-slate-600 italic">
            Upload a photo or describe the board — the AI will render a live hex diagram here.
          </p>
        )}
      </div>

      {/* Input Form */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={`Ask the ${currentRoleStyle.name}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white flex items-center justify-center transition-all shadow-md shadow-indigo-600/25 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
