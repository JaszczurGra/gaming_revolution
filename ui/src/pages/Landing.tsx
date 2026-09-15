import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Brain, ArrowRight, Shield } from 'lucide-react';

export default function Landing() {
  const { user, signInAnon, signInGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center max-w-3xl mx-auto">
      <div className="bg-indigo-100 p-4 rounded-full mb-8">
        <Brain className="w-16 h-16 text-indigo-600" />
      </div>
      <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
        Master Any Board Game with AI
      </h1>
      <p className="text-xl text-slate-600 mb-12 leading-relaxed">
        Upload rulebooks, ask live questions, get tactical advice from images, and play against an advanced AI opponent. Your personal board game companion.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
        <button 
          onClick={signInAnon}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          Try Now for Free <ArrowRight className="w-5 h-5" />
        </button>
        <button 
          onClick={signInGoogle}
          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <Shield className="w-5 h-5 text-emerald-600" /> Create Account
        </button>
      </div>
      <p className="mt-6 text-sm text-slate-500">
        Try instantly without an account. Link your Google account later to save your library permanently.
      </p>
    </div>
  );
}
