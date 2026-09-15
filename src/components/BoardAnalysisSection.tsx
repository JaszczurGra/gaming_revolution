import React, { useState } from 'react';
import { BoardAnalysisResult, GamePhoto } from '../types';
import { analyzeBoard } from '../utils/api';
import {
  Scan,
  Sparkles,
  Cpu,
  Target,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Upload,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';

interface BoardAnalysisSectionProps {
  gameTitle: string;
  rulesContext?: string;
  boardNotes?: string;
  photos: GamePhoto[];
  analysisHistory: BoardAnalysisResult[];
  onAnalysisComplete: (result: BoardAnalysisResult) => void;
  activeSelectedImage?: string | null;
}

export const BoardAnalysisSection: React.FC<BoardAnalysisSectionProps> = ({
  gameTitle,
  rulesContext = '',
  boardNotes = '',
  photos = [],
  analysisHistory = [],
  onAnalysisComplete,
  activeSelectedImage,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>(
    activeSelectedImage ||
      (photos.length > 0 ? photos[0].url : '') ||
      'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80'
  );
  const [customVisionPrompt, setCustomVisionPrompt] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync if active image passed from parent
  React.useEffect(() => {
    if (activeSelectedImage) {
      setSelectedImage(activeSelectedImage);
    }
  }, [activeSelectedImage]);

  const latestResult = analysisHistory.length > 0 ? analysisHistory[analysisHistory.length - 1] : null;

  const handleRunAnalysis = async () => {
    if (!selectedImage || analyzing) return;
    setAnalyzing(true);
    setError(null);

    try {
      // Clean base64 string if data URL
      const cleanBase64 = selectedImage.includes('base64,')
        ? selectedImage.split('base64,')[1]
        : selectedImage;

      const res = await analyzeBoard({
        imageBase64: cleanBase64,
        gameTitle,
        rulesContext,
        customNotes: `${boardNotes} ${customVisionPrompt}`.trim(),
      });

      onAnalysisComplete(res.analysis);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Vision board analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
            <Scan className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Board State Computer Vision Analysis
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                Gemini Vision Multimodal
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Inspects your physical board photograph to evaluate territory control, detect components, and recommend optimal tactical moves.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRunAnalysis}
          disabled={!selectedImage || analyzing}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-500/25 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          {analyzing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Scanning Board...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analyze Current Board</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/30 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Source Image Selector + Inspection results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Image Preview & Selection (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Target Board Photo</span>
            <span className="text-[11px] text-slate-400">
              {photos.length} available photo(s)
            </span>
          </div>

          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-700 shadow-inner">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt="Selected board for analysis"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
                <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                <span>No image selected</span>
              </div>
            )}
            <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-xs p-2 rounded-lg text-[10px] text-slate-300 flex items-center justify-between">
              <span>Ready for AI Vision Inspection</span>
              <span className="text-cyan-400 font-semibold">Live Camera / Photo</span>
            </div>
          </div>

          {/* Quick select among uploaded photos */}
          {photos.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1.5">
                Select Photo from Gallery
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {photos.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedImage(p.url)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                      selectedImage === p.url
                        ? 'border-cyan-500 ring-2 ring-cyan-500/30 scale-105'
                        : 'border-slate-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={p.url}
                      alt={p.caption || 'Thumbnail'}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Vision Focus Note */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Specific Tactical Focus for Vision Agent (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Focus on Red player's northern settlement progress..."
              value={customVisionPrompt}
              onChange={(e) => setCustomVisionPrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Right: Vision Analysis Output (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {latestResult ? (
            <div className="space-y-3.5 bg-slate-950/70 border border-slate-800 rounded-xl p-4.5">
              {/* Summary & Score Advantage */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400 block mb-1 flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5" /> Board State Recognition
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {latestResult.summary}
                  </p>
                </div>
              </div>

              {/* Advantage Meter */}
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Board Advantage / Status</span>
                  <span className="text-xs font-bold text-emerald-400">
                    {latestResult.boardStateScore || 'Evenly matched'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {latestResult.timestamp ? new Date(latestResult.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                </div>
              </div>

              {/* Detected components */}
              {latestResult.detectedPieces && latestResult.detectedPieces.length > 0 && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Recognized Pieces & Board Elements
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {latestResult.detectedPieces.map((piece, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-cyan-950/30 text-cyan-300 border border-cyan-500/20 text-[11px] flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                        {piece}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Strategic Advice */}
              {latestResult.strategicAdvice && (
                <div className="bg-indigo-950/20 border border-indigo-500/20 p-3 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-indigo-400" />
                    Tactical Strategic Guidance
                  </span>
                  <p className="text-xs text-indigo-200">
                    {latestResult.strategicAdvice}
                  </p>
                </div>
              )}

              {/* Suggested Next Moves */}
              {latestResult.suggestedNextMoves && latestResult.suggestedNextMoves.length > 0 && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 block mb-1.5 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" /> High-Value Suggested Moves
                  </span>
                  <div className="space-y-1.5">
                    {latestResult.suggestedNextMoves.map((move, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-2"
                      >
                        <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{move}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Compliance Note */}
              {latestResult.rulesComplianceNote && (
                <div className="text-[11px] text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 p-2 rounded-lg flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Rule Verification: {latestResult.rulesComplianceNote}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl space-y-2 p-6">
              <Scan className="w-8 h-8 text-cyan-400 mx-auto opacity-70" />
              <h4 className="text-xs font-bold text-white">No board scan performed yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Click "Analyze Current Board" to run Gemini multimodal vision on the photo. It will assess piece formations, score advantages, and suggest legal moves.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
