import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { PlusCircle, Sliders, LogOut, LogIn, TrendingUp, Sparkles, ShieldAlert } from 'lucide-react';
import { CurrencyType } from '../types/database.types';

interface NavbarProps {
  onOpenAddTrade: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenAdminPanel?: () => void;
  currency: CurrencyType;
  currentBalance: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAddTrade,
  onOpenSettings,
  onOpenAuth,
  onOpenAdminPanel,
  currency,
  currentBalance,
}) => {
  const { user, signOut } = useAuth();
  const { isAdmin, openAdminLogin } = useAdmin();
  const [logoTapCount, setLogoTapCount] = useState(0);

  const handleLogoTap = () => {
    const nextCount = logoTapCount + 1;
    if (nextCount >= 5) {
      setLogoTapCount(0);
      openAdminLogin();
    } else {
      setLogoTapCount(nextCount);
      setTimeout(() => setLogoTapCount(0), 3000);
    }
  };

  const formatCurrency = (val: number) => {
    const symbol = currency === 'INR' ? '₹' : '$';
    return `${symbol}${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand (Secret 5-Tap for mobile admin access) */}
          <div
            onClick={handleLogoTap}
            className="flex items-center gap-3 cursor-pointer select-none"
            title="Gold Journal"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 via-gold-500 to-amber-700 flex items-center justify-center shadow-lg shadow-gold-500/20 ring-1 ring-gold-400/30 active:scale-95 transition">
              <TrendingUp className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-gold-200 via-gold-400 to-amber-500 bg-clip-text text-transparent">
                  GOLD JOURNAL
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-gold-500/10 text-gold-400 border border-gold-500/20">
                  XAU/USD
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Trading Performance & Journal</p>
            </div>
          </div>

          {/* Right Section: Balance & Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Super Admin Console Button (Only visible when Admin is logged in) */}
            {isAdmin && (
              <button
                onClick={onOpenAdminPanel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-500/20 text-gold-300 border border-gold-500/40 text-xs font-bold shadow-sm hover:bg-gold-500/30 transition animate-pulse"
              >
                <ShieldAlert className="w-4 h-4 text-gold-400" />
                <span className="hidden sm:inline">Admin Console</span>
              </button>
            )}

            {/* Running Balance Pill (Click to set/edit balance) */}
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-gold-500/40 transition group cursor-pointer"
              title="Click to set/edit account balance"
            >
              <span className="text-xs text-slate-400 font-medium group-hover:text-gold-300 transition">Balance:</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                {formatCurrency(currentBalance)}
              </span>
              <span className="text-[10px] text-slate-500 group-hover:text-gold-400 ml-0.5">✏️</span>
            </button>

            {/* Quick Add Trade Button */}
            <button
              onClick={onOpenAddTrade}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-md shadow-gold-500/20 transition duration-150 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>Log Trade</span>
            </button>

            {/* Account Settings */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
              title="Account & Balance Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Auth / Profile */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-medium text-slate-200 truncate max-w-[120px]">
                    {user?.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Cloud Sync
                  </span>
                </div>
                <button
                  onClick={signOut}
                  className="p-2 rounded-lg bg-slate-900/60 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/50 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
