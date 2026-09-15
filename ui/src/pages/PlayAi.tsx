import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, addDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { Send, ArrowLeft, Loader2, Lock, Zap, Camera, Image as ImageIcon, X, Play, Square, Eye, EyeOff, Sparkles } from 'lucide-react';
import Webcam from 'react-webcam';
import clsx from 'clsx';
import { compressImage } from '../lib/imageCompressor';

type Message = { role: string; content: string; imageUrl?: string | null };

export default function PlayAi() {
  const { gameId } = useParams();
  const { user, profile, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [game, setGame] = useState<any>(null);
  const [history, setHistory] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [isColorblind, setIsColorblind] = useState(() => {
    return localStorage.getItem('colorblindMode') === 'true';
  });

  const toggleColorblind = () => {
    setIsColorblind(prev => {
      const nextVal = !prev;
      localStorage.setItem('colorblindMode', String(nextVal));
      return nextVal;
    });
  };

  const handleIdentifyColors = async () => {
    if (!imagePreview || !user) {
      alert("Please upload or capture a photo of your board game first using the Camera/Image buttons below, then click 'Analyze Board Colors' to identify piece colors.");
      return;
    }
    
    let currentSessionId = sessionId;

    if (history.length === 0 && profile && !profile.isPro) {
      try {
        const today = new Date().toISOString();
        await updateDoc(doc(db, 'users', user.uid), { 
          lastPlayedDate: today,
          dailyGameCount: 1 
        });
        await refreshProfile();
        
        const docRef = await addDoc(collection(db, 'sessions'), {
          ownerId: user.uid,
          gameId: gameId,
          status: 'ongoing',
          outcome: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          history: []
        });
        currentSessionId = docRef.id;
        setSessionId(currentSessionId);
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, 'users');
        return;
      }
    } else if (!currentSessionId) {
      try {
        const docRef = await addDoc(collection(db, 'sessions'), {
          ownerId: user.uid,
          gameId: gameId,
          status: 'ongoing',
          outcome: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          history: []
        });
        currentSessionId = docRef.id;
        setSessionId(currentSessionId);
      } catch (e) {
         console.error(e);
      }
    }
    
    const userMessage = "Analyze this board game image. Differentiate and identify all game pieces, tokens, roads, resources, and cards by color and location so that a colorblind player can easily tell them apart.";
    const base64ToSend = imagePreview;

    const newHistory = [...history, { role: 'user', content: userMessage, imageUrl: base64ToSend }];
    setHistory(newHistory);
    
    setInput('');
    setImagePreview(null);
    setLoading(true);
    
    if (currentSessionId) {
       updateDoc(doc(db, 'sessions', currentSessionId), { history: newHistory, updatedAt: new Date().toISOString() }).catch(console.error);
    }

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          gameName: game?.name,
          gameNotes: game?.notes,
          pdfUrl: game?.pdfUrl,
          history: history,
          imageBase64: base64ToSend
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Server error');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No readable stream");

      const decoder = new TextDecoder();
      let streamedText = '';
      setHistory(prev => [...prev, { role: 'model', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        streamedText += decoder.decode(value, { stream: true });
        setHistory(prev => {
          const newH = [...prev];
          newH[newH.length - 1].content = streamedText;
          return newH;
        });
      }

      setHistory(prev => {
        if (currentSessionId) {
           updateDoc(doc(db, 'sessions', currentSessionId), { history: prev, updatedAt: new Date().toISOString() }).catch(console.error);
        }
        return prev;
      });

    } catch (error: any) {
      console.error(error);
      alert('Failed to analyze board: ' + (error.message || 'An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  };

  const [showCamera, setShowCamera] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isCapturingLive, setIsCapturingLive] = useState(false);
  
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const liveIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Load existing session history
  useEffect(() => {
    const loadSession = async () => {
      if (!user || !gameId) return;
      try {
        const q = query(collection(db, 'sessions'), where('ownerId', '==', user.uid), where('gameId', '==', gameId), where('status', '==', 'ongoing'));
        const snap = await getDocs(q);
        let latestSession = null;
        let latestDate = 0;
        
        snap.forEach(doc => {
          const data = doc.data();
          const d = new Date(data.createdAt).getTime();
          if (d > latestDate) {
            latestDate = d;
            latestSession = { id: doc.id, ...data };
          }
        });

        if (latestSession) {
          setSessionId(latestSession.id);
          if (latestSession.history) {
            setHistory(latestSession.history);
          }
        }
      } catch (e) {
        console.error("Error loading session:", e);
      }
    };
    loadSession();
  }, [user, gameId]);

  // Handle Live Mode Polling
  const handleLiveCapture = useCallback(async () => {
    if (!webcamRef.current || !isLiveMode || isCapturingLive || !sessionId) return;
    
    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) return;

    setIsCapturingLive(true);
    
    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: "Analyze the current board state and take your turn as the AI opponent based on what you see.",
          gameName: game?.name,
          gameNotes: game?.notes,
          pdfUrl: game?.pdfUrl,
          history: history, // Provide context
          imageBase64: screenshot
        })
      });
      if (!res.ok) throw new Error("Stream error");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No readable stream");

      const decoder = new TextDecoder();
      let streamedText = '';
      setHistory(prev => [...prev, { role: 'model', content: "👀 Live Move: " }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        streamedText += decoder.decode(value, { stream: true });
        
        setHistory(prev => {
          const newH = [...prev];
          newH[newH.length - 1].content = "👀 Live Move: " + streamedText;
          return newH;
        });
      }
      
      // Update DB after stream finishes
      setHistory(prev => {
        if (sessionId) {
          updateDoc(doc(db, 'sessions', sessionId), { history: prev, updatedAt: new Date().toISOString() }).catch(console.error);
        }
        return prev;
      });

    } catch (error) {
      console.error("Live capture error:", error);
    } finally {
      setIsCapturingLive(false);
    }
  }, [game, history, isLiveMode, isCapturingLive, sessionId]);

  useEffect(() => {
    if (isLiveMode) {
      setShowCamera(true);
      // Capture every 15 seconds for opponent turns
      liveIntervalRef.current = window.setInterval(handleLiveCapture, 15000);
    } else {
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    }
    return () => {
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    };
  }, [isLiveMode, handleLiveCapture]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setLoading(true);
        const compressed = await compressImage(file);
        setImagePreview(compressed);
        setShowCamera(false);
        setIsLiveMode(false);
      } catch (err: any) {
        console.error("Compression error:", err);
        alert("Failed to process and compress image: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCapture = async () => {
    if (webcamRef.current) {
      const screenshot = webcamRef.current.getScreenshot();
      if (screenshot) {
        try {
          setLoading(true);
          const compressed = await compressImage(screenshot);
          setImagePreview(compressed);
          setShowCamera(false);
          setIsLiveMode(false);
        } catch (err: any) {
          console.error("Webcam compression error:", err);
          setImagePreview(screenshot); // Fallback to raw screenshot if canvas compression fails
          setShowCamera(false);
          setIsLiveMode(false);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const toggleLiveMode = () => {
    if (isLiveMode) {
      setIsLiveMode(false);
    } else {
      setIsLiveMode(true);
      setImagePreview(null);
    }
  };

  // ... (Rest of useAuth hooks untouched)

  useEffect(() => {
    const verifyStripe = async (sessionId: string) => {
      try {
        const res = await fetch('/api/stripe/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, userId: user?.uid })
        });
        const data = await res.json();
        if (data.success && user) {
          await updateDoc(doc(db, 'users', user.uid), { isPro: true });
          await refreshProfile();
        }
      } catch (e) {
        console.error(e);
      } finally {
        searchParams.delete('session_id');
        setSearchParams(searchParams);
      }
    };

    if (searchParams.has('session_id') && user) {
      verifyStripe(searchParams.get('session_id')!);
    }
  }, [searchParams, user, setSearchParams, refreshProfile]);

  useEffect(() => {
    const fetchGame = async () => {
      if (!gameId) return;
      try {
        const snap = await getDoc(doc(db, 'games', gameId));
        if (snap.exists()) {
          setGame({ id: snap.id, ...snap.data() });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `games/${gameId}`);
      }
    };
    fetchGame();
  }, [gameId]);

  useEffect(() => {
    if (!profile) return;
    const checkLimits = async () => {
      if (profile.isPro) {
        setCanPlay(true);
        setCheckingAccess(false);
        return;
      }
      const today = new Date().toISOString().split('T')[0];
      const lastPlayed = profile.lastPlayedDate?.split('T')[0];

      if (lastPlayed !== today || profile.dailyGameCount === 0) {
        setCanPlay(true);
      } else {
        setCanPlay(false);
      }
      setCheckingAccess(false);
    };
    checkLimits();
  }, [profile]);

  const handleSend = async () => {
    if ((!input.trim() && !imagePreview) || loading || !user) return;

    let currentSessionId = sessionId;

    if (history.length === 0 && profile && !profile.isPro) {
      try {
        const today = new Date().toISOString();
        await updateDoc(doc(db, 'users', user.uid), { 
          lastPlayedDate: today,
          dailyGameCount: 1 
        });
        await refreshProfile();
        
        const docRef = await addDoc(collection(db, 'sessions'), {
          ownerId: user.uid,
          gameId: gameId,
          status: 'ongoing',
          outcome: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          history: []
        });
        currentSessionId = docRef.id;
        setSessionId(currentSessionId);
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, 'users');
        return;
      }
    } else if (!currentSessionId) {
      // Create session for pro users if missing
      try {
        const docRef = await addDoc(collection(db, 'sessions'), {
          ownerId: user.uid,
          gameId: gameId,
          status: 'ongoing',
          outcome: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          history: []
        });
        currentSessionId = docRef.id;
        setSessionId(currentSessionId);
      } catch (e) {
         console.error(e);
      }
    }
    
    const userMessage = input.trim() || (imagePreview ? "Here is my move based on this board state." : "");
    const base64ToSend = imagePreview || undefined;

    const newHistory = [...history, { role: 'user', content: userMessage, imageUrl: base64ToSend }];
    setHistory(newHistory);
    
    // Clear input bar and image preview immediately to prevent lingering in the UI
    setInput('');
    setImagePreview(null);
    setLoading(true);
    
    // Save to DB immediately with the user message
    if (currentSessionId) {
       updateDoc(doc(db, 'sessions', currentSessionId), { history: newHistory, updatedAt: new Date().toISOString() }).catch(console.error);
    }

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          gameName: game?.name,
          gameNotes: game?.notes,
          pdfUrl: game?.pdfUrl,
          history: history,
          imageBase64: base64ToSend
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Server error');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No readable stream");

      const decoder = new TextDecoder();
      let streamedText = '';
      setHistory(prev => [...prev, { role: 'model', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        streamedText += decoder.decode(value, { stream: true });
        setHistory(prev => {
          const newH = [...prev];
          newH[newH.length - 1].content = streamedText;
          return newH;
        });
      }

      // Save to DB after stream finishes
      setHistory(prev => {
        if (currentSessionId) {
           updateDoc(doc(db, 'sessions', currentSessionId), { history: prev, updatedAt: new Date().toISOString() }).catch(console.error);
        }
        return prev;
      });

    } catch (error: any) {
      console.error(error);
      alert('Failed to send message: ' + (error.message || 'An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.uid,
          returnUrl: window.location.href
        })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error(e);
      alert('Failed to initiate checkout.');
    }
  };

  if (!game || checkingAccess) return <div className="p-8 text-center">Loading...</div>;

  if (!canPlay) {
    return (
      <div className="flex flex-col items-center justify-center max-w-lg mx-auto min-h-[60vh] text-center space-y-6 bg-white dark:bg-slate-800 p-12 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-full">
          <Lock className="w-12 h-12 text-amber-600 dark:text-amber-500" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Daily Limit Reached</h2>
        <p className="text-slate-600 dark:text-slate-300 text-lg">
          You've used your 1 free AI game for today. Upgrade to unlimited access to keep playing and practicing your skills.
        </p>
        <button 
          onClick={handleUpgrade}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors w-full"
        >
          <Zap className="w-5 h-5 text-amber-300" /> Unlock Unlimited Play for $9.99
        </button>
        <Link to={`/game/${gameId}`} className="text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-slate-200 underline">Return to Game Profile</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-5rem)] md:h-[calc(100vh-8rem)] md:max-h-[800px] max-w-4xl mx-auto bg-white dark:bg-slate-800 md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="bg-rose-50 dark:bg-rose-900/20 border-b border-rose-200 dark:border-rose-900/50 p-4 shrink-0 flex items-center justify-between gap-2 flex-wrap md:flex-nowrap">
        <div className="flex items-center gap-4">
          <Link to={`/game/${gameId}`} className="text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 p-2 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="font-bold text-rose-900 dark:text-rose-100 line-clamp-1">Playing: {game.name}</h2>
            <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">AI Opponent Mode</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleColorblind}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm shrink-0",
              isColorblind
                ? "bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700"
                : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
            )}
            title="Toggle Colorblind Friendly Mode (Daltonism assistance)"
          >
            {isColorblind ? <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>CB Friendly</span>
          </button>

          <button 
            onClick={toggleLiveMode}
            className={clsx("flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 rounded-full text-xs md:text-sm font-bold transition-all shadow-sm shrink-0", isLiveMode ? "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 animate-pulse border border-rose-200 dark:border-rose-800" : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600")}
          >
            {isLiveMode ? (
              <><Square className="w-3 h-3 md:w-4 md:h-4 fill-current" /> <span className="hidden sm:inline">Stop Live Play</span><span className="sm:hidden">Stop</span></>
            ) : (
              <><Play className="w-3 h-3 md:w-4 md:h-4 fill-current" /> <span className="hidden sm:inline">Start Live Play</span><span className="sm:hidden">Start Live</span></>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/50">
        {history.length === 0 && (
          <div className="text-center text-slate-500 dark:text-slate-400 mt-10 max-w-md mx-auto">
            <p className="font-medium">Ready to play?</p>
            <p className="text-sm mt-2">Describe the setup or make your first move. The AI will act as your opponent.</p>
          </div>
        )}
        {history.map((msg, i) => {
          const isUser = msg.role === 'user';
          return (
            <div key={i} className={clsx('flex flex-col', isUser ? 'items-end' : 'items-start')}>
              {isColorblind && (
                <span className="text-[10px] font-extrabold tracking-widest text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1 uppercase">
                  {isUser ? '● Player Message' : '■ Assistant Response'}
                </span>
              )}
              <div className={clsx(
                'max-w-[90%] md:max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
                isColorblind
                  ? (isUser 
                      ? 'bg-slate-900 dark:bg-black border-2 border-slate-700 dark:border-slate-600 text-white font-bold rounded-br-sm' 
                      : 'bg-white dark:bg-slate-950 border-2 border-slate-900 dark:border-white text-slate-950 dark:text-white font-semibold rounded-bl-sm')
                  : (isUser 
                      ? 'bg-indigo-600 text-white rounded-br-sm' 
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm')
              )}>
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="User Upload" className="max-w-full rounded-lg mb-2 max-h-48 md:max-h-64 object-contain" />
                )}
                {msg.content}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-rose-600" /> AI is thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-3 md:p-4 shrink-0 flex flex-col gap-3">
        {isColorblind && (
          <div className="flex items-center justify-between gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-xs">
            <span className="text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> CB Vision Helper:
            </span>
            <button
              onClick={handleIdentifyColors}
              className="bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-extrabold px-3 py-1.5 rounded-lg shadow transition-colors flex items-center gap-1 outline-none focus:ring-2 focus:ring-amber-500"
              title="Asks the AI to identify all colors and pieces on the current board screenshot"
            >
              🔍 Analyze Board Colors
            </button>
          </div>
        )}

        {showCamera && (
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 flex justify-center items-center h-48 shrink-0">
            {/* @ts-ignore */}
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.8}
              videoConstraints={{ facingMode: "environment" }}
              className="w-full h-full object-contain"
            />
            {isLiveMode ? (
              <div className="absolute top-3 left-3 bg-rose-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md animate-pulse flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                LIVE OPPONENT
              </div>
            ) : (
              <div className="absolute bottom-3 flex gap-2">
                <button onClick={handleCapture} className="bg-white text-slate-900 px-4 py-1.5 rounded-full text-sm font-bold shadow-md hover:bg-slate-100 transition-colors">Capture</button>
                <button onClick={() => setShowCamera(false)} className="bg-slate-800/80 text-white px-4 py-1.5 rounded-full text-sm shadow-md hover:bg-slate-800 transition-colors">Cancel</button>
              </div>
            )}
          </div>
        )}

        {imagePreview && !showCamera && (
          <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex justify-center items-center h-32 md:h-48 shrink-0">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
            <button 
              onClick={() => setImagePreview(null)} 
              className="absolute top-2 right-2 bg-slate-900/50 text-white p-1.5 rounded-full hover:bg-slate-900/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1 md:gap-2">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          <button 
            onClick={() => { setShowCamera(false); fileInputRef.current?.click(); }}
            className="p-2.5 md:p-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors shrink-0"
            title="Upload Image"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => { setImagePreview(null); setShowCamera(!showCamera); }}
            className={clsx("p-2.5 md:p-3 rounded-xl transition-colors shrink-0", showCamera ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600")}
            title="Toggle Camera"
          >
            <Camera className="w-5 h-5" />
          </button>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isColorblind ? "Ask about colors, pieces, or opponent moves..." : "Describe your move..."}
            className="flex-1 w-0 min-w-0 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border-none rounded-xl px-3 md:px-4 py-2.5 md:py-3 focus:ring-2 focus:ring-rose-500 transition-all outline-none text-sm md:text-base font-medium"
          />
          <button 
            onClick={handleSend}
            disabled={loading || (!input.trim() && !imagePreview)}
            className="bg-rose-600 text-white p-2.5 md:p-3 rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
