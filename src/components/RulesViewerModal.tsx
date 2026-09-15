import React from 'react';
import { Game } from '../types';
import { X, BookOpen, Trophy, ShieldAlert, CheckSquare, Lightbulb, Compass, FileText } from 'lucide-react';

interface RulesViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game | null;
}

export const RulesViewerModal: React.FC<RulesViewerModalProps> = ({ isOpen, onClose, game }) => {
  if (!isOpen || !game) return null;

  const analysis = game.ruleAnalysis;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl my-8 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {game.title} - Official Rulebook
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>Source: {game.ruleSource.fileName}</span>
                {game.ruleSource.fileSize && <span>({game.ruleSource.fileSize})</span>}
                <span className="text-indigo-400 font-medium">AI Analyzed</span>
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-200">
          {/* Overview */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1.5 flex items-center gap-1.5">
              <Compass className="w-4 h-4" /> Game Overview
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              {analysis?.overview || 'Tabletop rules loaded for this game session.'}
            </p>
          </div>

          {/* Win condition */}
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-1.5">
              <Trophy className="w-4 h-4" /> Victory Condition
            </h4>
            <p className="text-sm text-amber-100 font-medium">
              {analysis?.winCondition || 'Reach the designated score or achieve victory objective.'}
            </p>
          </div>

          {/* Turn Sequence */}
          {analysis?.turnStructure && analysis.turnStructure.length > 0 && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Turn Structure & Sequence
              </h4>
              <div className="space-y-2">
                {analysis.turnStructure.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs">
                    <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center justify-center shrink-0 font-bold text-[11px]">
                      {idx + 1}
                    </span>
                    <span className="text-slate-300 pt-0.5">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Rules & Forbidden Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4" /> Core Rules
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                {analysis?.keyRules && analysis.keyRules.length > 0
                  ? analysis.keyRules.map((r, i) => <li key={i}>{r}</li>)
                  : <li>Follow standard turn order and card play conditions.</li>}
              </ul>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-400 mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> Forbidden Actions
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                {analysis?.forbiddenMoves && analysis.forbiddenMoves.length > 0
                  ? analysis.forbiddenMoves.map((m, i) => <li key={i}>{m}</li>)
                  : <li>Actions executed out of turn or with insufficient resources.</li>}
              </ul>
            </div>
          </div>

          {/* Teacher Tips & Judge Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4" /> Teacher Guide
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {analysis?.teacherTips && analysis.teacherTips.length > 0
                  ? analysis.teacherTips.map((t, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-indigo-400">•</span>
                        <span>{t}</span>
                      </li>
                    ))
                  : <li>Ask the Teacher chatbot anytime during your match for advice!</li>}
              </ul>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4" /> Judge Checklist
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {analysis?.judgeChecklist && analysis.judgeChecklist.length > 0
                  ? analysis.judgeChecklist.map((c, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-400">•</span>
                        <span>{c}</span>
                      </li>
                    ))
                  : <li>Verify turn sequence, cost payment, and move validity.</li>}
              </ul>
            </div>
          </div>

          {/* Raw Rulebook snippet if available */}
          {game.ruleSource.textContent && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> Extracted Rulebook Text
              </h4>
              <pre className="text-[11px] text-slate-400 whitespace-pre-wrap max-h-48 overflow-y-auto font-mono bg-slate-900 p-3 rounded-lg border border-slate-800">
                {game.ruleSource.textContent}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
