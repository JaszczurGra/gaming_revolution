import React, { useState, useRef } from 'react';
import { RuleAnalysis } from '../types';
import { analyzeRules } from '../utils/api';
import {
  FileText,
  Sparkles,
  Upload,
  BookOpen,
  Scale,
  ShieldAlert,
  GraduationCap,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PdfRuleAnalysisSectionProps {
  currentAnalysis?: RuleAnalysis;
  ruleSource?: {
    fileName: string;
    fileType: 'pdf' | 'text' | 'preset';
    hasPdf: boolean;
    textContent?: string;
  };
  onAnalysisUpdate: (newAnalysis: RuleAnalysis) => void;
}

export const PdfRuleAnalysisSection: React.FC<PdfRuleAnalysisSectionProps> = ({
  currentAnalysis,
  ruleSource,
  onAnalysisUpdate,
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [customText, setCustomText] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'forbidden' | 'roles'>('overview');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setError('Please upload a valid PDF document (.pdf)');
      return;
    }
    setError(null);
    setAnalyzing(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = reader.result as string;
        const base64 = result.split(',')[1] || '';
        const res = await analyzeRules({
          pdfBase64: base64,
          fileName: file.name,
        });
        onAnalysisUpdate(res.analysis);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to analyze PDF rulebook');
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeText = async () => {
    if (!customText.trim() || analyzing) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await analyzeRules({
        textContent: customText,
        fileName: 'Updated Rules Text',
      });
      onAnalysisUpdate(res.analysis);
      setCustomText('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to analyze rules text');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              PDF Rules & Knowledge Engine
              {currentAnalysis && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {currentAnalysis.title}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Upload game rulebooks (PDF) or rule amendments. Gemini extracts turn phases, illegal actions, victory requirements, and referee checklists.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={analyzing}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>{analyzing ? 'Processing PDF...' : 'Upload New Rule PDF'}</span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
      />

      {error && (
        <div className="p-3 bg-rose-950/30 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Dropzone if no analysis exists or for re-upload */}
      {!currentAnalysis && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileUpload(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-slate-700 hover:border-slate-500 bg-slate-950/40'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2">
            <FileText className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-200">
            Drop rulebook PDF here or click to browse
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Gemini will parse all pages and extract rules for Teacher, Judge, and Player roles.
          </p>
        </div>
      )}

      {/* Tabs */}
      {currentAnalysis && (
        <div className="space-y-4">
          <div className="flex border-b border-slate-800 gap-2 overflow-x-auto scrollbar-none pb-1">
            {[
              { id: 'overview', label: 'Overview & Win Condition', icon: Sparkles },
              { id: 'rules', label: 'Turn Structure & Core Rules', icon: BookOpen },
              { id: 'forbidden', label: 'Forbidden Moves & Penalties', icon: ShieldAlert },
              { id: 'roles', label: 'Teacher & Judge Directives', icon: GraduationCap },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 min-h-[160px]">
            {activeTab === 'overview' && (
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                    Game Overview
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {currentAnalysis.overview}
                  </p>
                </div>
                <div className="bg-amber-950/20 border border-amber-500/20 p-3 rounded-lg">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-0.5">
                    Official Win Condition
                  </span>
                  <p className="text-xs font-medium text-amber-200">
                    {currentAnalysis.winCondition}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'rules' && (
              <div className="space-y-4">
                {currentAnalysis.turnStructure && currentAnalysis.turnStructure.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-2">
                      Sequential Turn Phases
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                      {currentAnalysis.turnStructure.map((phase, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-xs text-slate-300 flex items-start gap-2"
                        >
                          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-[11px] leading-snug">{phase}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Key Gameplay Rules
                  </span>
                  <div className="space-y-1.5">
                    {currentAnalysis.keyRules?.map((rule, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-xs text-slate-300 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'forbidden' && (
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-1">
                  Forbidden Actions & Violations
                </span>
                <div className="space-y-2">
                  {currentAnalysis.forbiddenMoves?.map((move, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/30 text-xs text-rose-200"
                    >
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{move}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'roles' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-indigo-950/20 border border-indigo-500/20 p-3 rounded-lg space-y-2">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                    Teacher Tips for Beginners
                  </span>
                  <ul className="text-xs text-indigo-200 space-y-1 list-disc list-inside">
                    {currentAnalysis.teacherTips?.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-purple-950/20 border border-purple-500/20 p-3 rounded-lg space-y-2">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
                    Judge Ruling Checklist
                  </span>
                  <ul className="text-xs text-purple-200 space-y-1 list-disc list-inside">
                    {currentAnalysis.judgeChecklist?.map((check, idx) => (
                      <li key={idx}>{check}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Add Custom Rules / Errata */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 space-y-2">
        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
          Add House Rules, Expansions or Errata Text
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. House Rule: Players get double resources on roll of 12..."
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={handleAnalyzeText}
            disabled={!customText.trim() || analyzing}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            Update Analysis
          </button>
        </div>
      </div>
    </div>
  );
};
