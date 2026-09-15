import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, Activity, Swords, Image as ImageIcon } from 'lucide-react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function Dashboard() {
  const { user } = useAuth();
  const [games, setGames] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [newGameFile, setNewGameFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchGames = async () => {
      try {
        const q = query(collection(db, 'games'), where('ownerId', '==', user.uid));
        const snap = await getDocs(q);
        setGames(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'games');
      }
    };
    const fetchSessions = async () => {
      try {
        const q = query(collection(db, 'sessions'), where('ownerId', '==', user.uid));
        const snap = await getDocs(q);
        setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'sessions');
      }
    };
    fetchGames();
    fetchSessions();
  }, [user]);

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newGameName) return;
    setUploading(true);

    try {
      let pdfUrl = '';
      if (newGameFile) {
        setUploadStatus('Uploading PDF (this may take a moment)...');
        const storage = getStorage();
        const fileRef = ref(storage, `users/${user.uid}/games/${Date.now()}_${newGameFile.name}`);
        await uploadBytes(fileRef, newGameFile);
        pdfUrl = await getDownloadURL(fileRef);
      }

      setUploadStatus('Saving game profile...');
      const docRef = await addDoc(collection(db, 'games'), {
        ownerId: user.uid,
        name: newGameName,
        pdfUrl,
        notes: '',
        createdAt: new Date().toISOString()
      });

      setGames([...games, { id: docRef.id, ownerId: user.uid, name: newGameName, pdfUrl, notes: '', createdAt: new Date().toISOString() }]);
      setIsCreating(false);
      setNewGameName('');
      setNewGameFile(null);
    } catch (error: any) {
      console.error(error);
      alert('Failed to create game. If the upload hangs or fails, please ensure Firebase Cloud Storage is enabled in your Firebase Console. Error: ' + error.message);
    } finally {
      setUploading(false);
      setUploadStatus('');
    }
  };

  return (
    <div className="space-y-12">
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="text-indigo-600 dark:text-indigo-400" /> My Library
          </h2>
          <button 
            onClick={() => setIsCreating(!isCreating)}
            className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Game
          </button>
        </div>

        {isCreating && (
          <form onSubmit={handleCreateGame} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8 max-w-lg">
            <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Add New Game</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Game Name</label>
                <input 
                  type="text" required
                  value={newGameName} onChange={e => setNewGameName(e.target.value)}
                  className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g. Catan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rulebook PDF (Optional)</label>
                <input 
                  type="file" accept="application/pdf"
                  onChange={e => setNewGameFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">Cancel</button>
                <button type="submit" disabled={uploading} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium">
                  {uploading ? (uploadStatus || 'Saving...') : 'Save Game'}
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map(g => (
            <Link key={g.id} to={`/game/${g.id}`} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-md transition-shadow group flex flex-col h-48">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{g.name}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-auto line-clamp-2">{g.notes || "No custom notes."}</p>
              <div className="flex items-center justify-between text-sm mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  {g.pdfUrl ? <ImageIcon className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> : <BookOpen className="w-4 h-4" />}
                  {g.pdfUrl ? 'PDF Attached' : 'Text Rules'}
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-medium group-hover:translate-x-1 transition-transform flex items-center">Open &rarr;</span>
              </div>
            </Link>
          ))}
          {games.length === 0 && !isCreating && (
            <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 border-dashed rounded-2xl text-slate-500 dark:text-slate-400">
              No games in your library yet. Add one to get started!
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-6">
          <Activity className="text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Recent Matches</h2>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {sessions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">No gameplay history found.</div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {sessions.map(s => (
                <li key={s.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between transition-colors">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Vs AI Opponent</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    s.status === 'finished' ? 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500'
                  }`}>
                    {s.status.toUpperCase()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
