import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { BookOpen, FileText, MessageCircle, Swords, Save, ArrowLeft } from 'lucide-react';

export default function GameProfile() {
  const { gameId } = useParams();
  const [game, setGame] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchGame = async () => {
      if (!gameId) return;
      try {
        const snap = await getDoc(doc(db, 'games', gameId));
        if (snap.exists()) {
          setGame({ id: snap.id, ...snap.data() });
          setNotes(snap.data().notes || '');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `games/${gameId}`);
      }
    };
    fetchGame();
  }, [gameId]);

  const handleSaveNotes = async () => {
    if (!gameId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'games', gameId), { notes });
      alert('Notes saved!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    } finally {
      setSaving(false);
    }
  };

  if (!game) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading game profile...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
      
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">{game.name}</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 flex items-center gap-2">
          Added {new Date(game.createdAt).toLocaleDateString()}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to={`/game/${gameId}/chat`} className="flex flex-col items-center justify-center p-8 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-2xl transition-colors group">
            <MessageCircle className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-indigo-900 dark:text-indigo-100 text-lg">Rules Assistant</span>
            <span className="text-indigo-600/70 dark:text-indigo-300/70 text-sm mt-1 text-center">Ask rules & get live help</span>
          </Link>
          
          <Link to={`/game/${gameId}/play`} className="flex flex-col items-center justify-center p-8 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-2xl transition-colors group">
            <Swords className="w-10 h-10 text-rose-600 dark:text-rose-400 mb-3 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-rose-900 dark:text-rose-100 text-lg">Play AI Opponent</span>
            <span className="text-rose-600/70 dark:text-rose-300/70 text-sm mt-1 text-center">Challenge the Gemini engine</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="text-indigo-600 dark:text-indigo-400" /> Reference Material
          </h2>
          {game.pdfUrl ? (
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate mr-4">Official Rulebook (PDF)</span>
              <a href={game.pdfUrl} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-semibold shrink-0">
                View &rarr;
              </a>
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-sm italic">No PDF uploaded. The AI will rely on its general knowledge and your custom notes.</p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen className="text-indigo-600 dark:text-indigo-400" /> Custom Rules & Notes
          </h2>
          <textarea 
            className="flex-1 w-full rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white resize-none p-3 focus:ring-indigo-500 focus:border-indigo-500 min-h-[150px] text-sm"
            placeholder="Add house rules, clarifications, or setup notes here. The AI will read these."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <button 
            onClick={handleSaveNotes} disabled={saving}
            className="mt-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 self-end flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      </div>
    </div>
  );
}
