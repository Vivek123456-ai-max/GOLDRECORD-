import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useAdmin } from './contexts/AdminContext';
import { tradeService } from './services/tradeService';
import { balanceService } from './services/balanceService';
import { analyticsService } from './services/analyticsService';
import { realtimeService } from './services/realtimeService';
import { Trade, TradeInput, UserSettings, BalanceLog } from './types/database.types';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { TradeModal } from './components/TradeModal';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import { AuthModal } from './components/AuthModal';
import { AuthGate } from './components/AuthGate';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminPanel } from './components/admin/AdminPanel';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useAdmin();

  const [trades, setTrades] = useState<Trade[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [balanceLogs, setBalanceLogs] = useState<BalanceLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Realtime multi-device sync event stream
  const [realtimeLogs, setRealtimeLogs] = useState<
    Array<{ id: string; timestamp: string; table: string; eventType: string; summary: string }>
  >([]);

  // Modals state
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setTrades([]);
      setSettings(null);
      setBalanceLogs([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [tradesRes, settingsRes, balanceRes] = await Promise.all([
        tradeService.getTrades(),
        balanceService.getUserSettings(),
        balanceService.getBalanceLogs(),
      ]);

      if (tradesRes.error) console.warn('Trades fetch warning:', tradesRes.error);
      if (settingsRes.error) console.warn('Settings fetch warning:', settingsRes.error);

      setTrades(tradesRes.data || []);
      setSettings(
        settingsRes.data || {
          user_id: user.id,
          starting_balance: 0,
          currency: 'USD',
          default_lot_size: 0.01,
          default_risk_pct: 1.0,
        }
      );
      setBalanceLogs(balanceRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data from Supabase');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial Data Fetch when user logs in
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Realtime Multi-Device Synchronization
  useEffect(() => {
    const unsubscribe = realtimeService.subscribeToAllChanges((payload) => {
      const timeStr = new Date().toTimeString().slice(0, 8);
      const summary = payload.new?.id
        ? `Record #${payload.new.id.slice(0, 8)} (${payload.new.symbol || payload.new.entry_type || 'updated'})`
        : payload.old?.id
        ? `Record #${payload.old.id.slice(0, 8)} deleted`
        : 'Modified';

      setRealtimeLogs((prev) => [
        {
          id: `rt-${Date.now()}-${Math.random()}`,
          timestamp: timeStr,
          table: payload.table,
          eventType: payload.eventType,
          summary,
        },
        ...prev.slice(0, 49),
      ]);

      // Silently refetch data to keep UI synced across all devices
      if (user) {
        tradeService.getTrades().then((res) => {
          if (res.data) setTrades(res.data);
        });
        balanceService.getUserSettings().then((res) => {
          if (res.data) setSettings(res.data);
        });
        balanceService.getBalanceLogs().then((res) => {
          if (res.data) setBalanceLogs(res.data);
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Auto-switch to Admin Panel if admin logs in
  useEffect(() => {
    if (isAdmin) {
      setShowAdminPanel(true);
    }
  }, [isAdmin]);

  // Handle Save / Add Trade
  const handleSaveTrade = async (tradeInput: TradeInput) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (editingTrade) {
      const { error } = await tradeService.updateTrade(editingTrade.id, tradeInput);
      if (error) throw error;
    } else {
      const { error } = await tradeService.createTrade(tradeInput);
      if (error) throw error;
    }

    setEditingTrade(null);
    await fetchData();
  };

  // Handle Delete Trade
  const handleDeleteTrade = async (id: string) => {
    if (!user) return;

    const { error } = await tradeService.deleteTrade(id);
    if (error) {
      alert(`Could not delete trade: ${error.message || error}`);
      return;
    }
    await fetchData();
  };

  // Handle Update Settings
  const handleSaveSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return;

    const { error } = await balanceService.updateUserSettings(newSettings);
    if (error) throw error;
    await fetchData();
  };

  // Handle Deposit / Withdrawal
  const handleAddAdjustment = async (
    type: 'deposit' | 'withdrawal' | 'adjustment',
    amount: number,
    notes?: string
  ) => {
    if (!user) return;

    const { error } = await balanceService.addAdjustment(type, amount, notes);
    if (error) throw error;
    await fetchData();
  };

  // Handle Clear All Trades (Reset to 0)
  const handleClearAllTrades = async () => {
    if (!user) return;
    const { error } = await tradeService.clearAllTrades();
    if (error) {
      alert(`Could not clear trades: ${error.message || error}`);
      return;
    }
    await fetchData();
  };

  // If Admin View is active, render Admin Master Control Center
  if (showAdminPanel && isAdmin) {
    return (
      <>
        <AdminPanel
          onCloseAdmin={() => setShowAdminPanel(false)}
          realtimeLogs={realtimeLogs}
        />
        <AdminLoginModal />
      </>
    );
  }

  // Loading state while checking auth session
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#070b12] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Verifying session...</p>
      </div>
    );
  }

  // Mandatory Sign In Gate: If user is not logged in, show Auth Gate
  if (!user) {
    return (
      <>
        <AuthGate />
        <AdminLoginModal />
      </>
    );
  }

  // Performance calculations
  const stats = analyticsService.calculateStats(trades, settings, balanceLogs);

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 font-sans">
      {/* Top Navigation */}
      <Navbar
        onOpenAddTrade={() => {
          setEditingTrade(null);
          setIsTradeModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenAdminPanel={() => setShowAdminPanel(true)}
        currency={stats.currency}
        currentBalance={stats.currentBalance}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 gap-3">
            <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
            <p className="text-sm font-medium text-slate-400">Loading your Gold Journal...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-200 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 px-3 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded-lg text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        ) : (
          <Dashboard
            stats={stats}
            trades={trades}
            settings={settings}
            balanceLogs={balanceLogs}
            onOpenAddTrade={() => {
              setEditingTrade(null);
              setIsTradeModalOpen(true);
            }}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onSaveSettings={handleSaveSettings}
            onEditTrade={(trade) => {
              setEditingTrade(trade);
              setIsTradeModalOpen(true);
            }}
            onDeleteTrade={handleDeleteTrade}
          />
        )}
      </main>

      {/* Modals */}
      <TradeModal
        isOpen={isTradeModalOpen}
        onClose={() => {
          setIsTradeModalOpen(false);
          setEditingTrade(null);
        }}
        onSave={handleSaveTrade}
        editTrade={editingTrade}
        currency={stats.currency}
        defaultLotSize={settings?.default_lot_size || 0.01}
      />

      <AccountSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        balanceLogs={balanceLogs}
        onSaveSettings={handleSaveSettings}
        onAddAdjustment={handleAddAdjustment}
        onClearAllTrades={handleClearAllTrades}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Hidden Super Admin Modal (Triggered by Cmd+Shift+A or 5-tap on logo) */}
      <AdminLoginModal />
    </div>
  );
};
