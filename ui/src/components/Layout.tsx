import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, LayoutDashboard, Brain, Swords, ShieldCheck, Zap, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Layout() {
  const { user, profile, logout, linkToGoogle } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col font-sans transition-colors">
      <header className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <Brain className="w-6 h-6 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xl text-slate-900 dark:text-white">Boardify</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
              title="Toggle Dark Mode"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user && (
              <div className="flex items-center gap-6">
                <nav className="hidden md:flex gap-4">
                  <Link to="/dashboard" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                </nav>
                
                <div className="flex items-center gap-4">
                  {user.isAnonymous ? (
                    <button onClick={linkToGoogle} className="text-sm font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1.5 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/50 flex items-center gap-1 transition-colors">
                      <ShieldCheck className="w-4 h-4" /> Save Account
                    </button>
                  ) : (
                    <span className="text-sm font-medium px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
                      {user.email}
                    </span>
                  )}
                  {profile?.isPro && (
                    <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 px-2 py-1 rounded">
                      <Zap className="w-3 h-3" /> Pro
                    </span>
                  )}
                  <button onClick={handleLogout} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-2 transition-colors">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
