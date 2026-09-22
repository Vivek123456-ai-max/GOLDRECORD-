import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import {
  TrendingUp,
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  ShieldAlert,
  BarChart3,
  Layers,
  Sparkles,
} from 'lucide-react';

export const AuthGate: React.FC = () => {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const { openAdminLogin } = useAdmin();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Secret 5-tap counter on logo for mobile admin access
  const [logoTapCount, setLogoTapCount] = useState(0);
  const handleLogoTap = () => {
    const next = logoTapCount + 1;
    if (next >= 5) {
      setLogoTapCount(0);
      openAdminLogin();
    } else {
      setLogoTapCount(next);
      setTimeout(() => setLogoTapCount(0), 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await signUpWithEmail(email, password);
        if (error) throw error;
        if (data?.user && !data?.session) {
          setSuccessMsg('Registration successful! Please check your email to confirm registration or sign in directly.');
        } else {
          setSuccessMsg('Account created successfully! Loading your clean journal...');
        }
      } else {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col justify-between selection:bg-gold-500/30 selection:text-gold-200">
      {/* Top Simple Header */}
      <header className="border-b border-slate-800/80 bg-[#0a0f18]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div
            onClick={handleLogoTap}
            className="flex items-center gap-3 cursor-pointer select-none"
            title="Gold Journal"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-amber-700 flex items-center justify-center shadow-lg shadow-gold-500/20 ring-1 ring-gold-400/30 active:scale-95 transition">
              <TrendingUp className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-gold-200 via-gold-400 to-amber-500 bg-clip-text text-transparent">
                GOLD JOURNAL
              </span>
              <p className="text-[11px] text-slate-400">Personal XAU/USD Trading Analytics</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <ShieldCheck className="w-4 h-4 text-gold-400" />
            <span className="hidden sm:inline">Protected Cloud System</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-gold-500/5 relative overflow-hidden backdrop-blur-sm">
          {/* Top glow accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent"></div>

          {/* Heading */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/30 text-gold-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              {isSignUp ? 'Create Trader Account' : 'Sign In Required'}
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              {isSignUp
                ? 'Register your account to access your clean journal and start logging gold trades'
                : 'Please sign in to access your personal trading records, equity curve & analytics'}
            </p>
          </div>

          {/* Sign In / Sign Up Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-5">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                !isSignUp
                  ? 'bg-gradient-to-r from-gold-500 to-amber-600 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                isSignUp
                  ? 'bg-gradient-to-r from-gold-500 to-amber-600 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
              <UserCheck className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-gold-500 via-gold-400 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-gold-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>{isSignUp ? 'Create My Journal' : 'Sign In to Journal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Features highlight note */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>100% Private Data</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-400"></span>
              <span>PDF Report Export</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              <span>Realtime Cloud Sync</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>Clean Zero Initial Data</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 border-t border-slate-800/60 text-xs text-slate-500">
        Gold Trading Journal • Built for XAU/USD Traders
      </footer>
    </div>
  );
};
