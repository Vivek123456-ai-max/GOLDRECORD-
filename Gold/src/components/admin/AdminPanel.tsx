import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { adminService, GlobalPlatformStats } from '../../services/adminService';
import { Trade, UserSettings, BalanceLog, TradeInput, TradeResult, TradeDirection } from '../../types/database.types';
import {
  ShieldAlert,
  Database,
  Activity,
  DollarSign,
  TrendingUp,
  Download,
  Trash2,
  Edit,
  Plus,
  RefreshCw,
  LogOut,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Layers,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  Calendar,
} from 'lucide-react';

interface AdminPanelProps {
  onCloseAdmin: () => void;
  realtimeLogs: Array<{ id: string; timestamp: string; table: string; eventType: string; summary: string }>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onCloseAdmin, realtimeLogs }) => {
  const { logoutAdmin } = useAdmin();

  const [activeTab, setActiveTab] = useState<'trades' | 'balances' | 'realtime' | 'system'>('trades');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings[]>([]);
  const [balanceLogs, setBalanceLogs] = useState<BalanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterResult, setFilterResult] = useState('ALL');

  // Edit / Add modal in Admin
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);
  const [isAddAdjustmentOpen, setIsAddAdjustmentOpen] = useState(false);

  // New adjustment form
  const [adjUserId, setAdjUserId] = useState('');
  const [adjType, setAdjType] = useState<'deposit' | 'withdrawal' | 'starting_balance'>('deposit');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjNotes, setAdjNotes] = useState('');

  // Admin New Trade Form
  const [newTradeDate, setNewTradeDate] = useState(new Date().toISOString().slice(0, 10));
  const [newDirection, setNewDirection] = useState<TradeDirection>('BUY');
  const [newEntry, setNewEntry] = useState('');
  const [newExit, setNewExit] = useState('');
  const [newLot, setNewLot] = useState('0.10');
  const [newPl, setNewPl] = useState('');
  const [newResult, setNewResult] = useState<TradeResult>('PROFIT');
  const [newNotes, setNewNotes] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [tradesRes, settingsRes, balanceRes] = await Promise.all([
        adminService.getAllTrades(),
        adminService.getAllUserSettings(),
        adminService.getAllBalanceLogs(),
      ]);

      setTrades(tradesRes.data || []);
      setUserSettings(settingsRes.data || []);
      setBalanceLogs(balanceRes.data || []);
      if (settingsRes.data && settingsRes.data[0]) {
        setAdjUserId(settingsRes.data[0].user_id);
      }
    } catch (e) {
      console.error('Admin data fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const stats: GlobalPlatformStats = adminService.calculateGlobalStats(trades, balanceLogs, userSettings);

  // Filtered trades
  const filteredTrades = trades.filter((t) => {
    if (filterResult !== 'ALL' && t.result !== filterResult) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.symbol.toLowerCase().includes(q) ||
        t.user_id.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleDeleteTrade = async (id: string) => {
    if (!confirm('Admin: Delete this trade record permanently from Supabase?')) return;
    await adminService.deleteTrade(id);
    await fetchAdminData();
  };

  const handleUpdateTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrade) return;

    await adminService.updateTrade(editingTrade.id, {
      direction: editingTrade.direction,
      entry_price: Number(editingTrade.entry_price),
      exit_price: editingTrade.exit_price ? Number(editingTrade.exit_price) : null,
      tp: editingTrade.tp ? Number(editingTrade.tp) : null,
      sl: editingTrade.sl ? Number(editingTrade.sl) : null,
      lot_size: Number(editingTrade.lot_size),
      result: editingTrade.result,
      pl_amount: Number(editingTrade.pl_amount),
      notes: editingTrade.notes,
    });

    setEditingTrade(null);
    await fetchAdminData();
  };

  const handleCreateAdminTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    await adminService.createTrade({
      trade_date: newTradeDate,
      symbol: 'XAUUSD',
      direction: newDirection,
      entry_price: parseFloat(newEntry) || 2650,
      exit_price: newExit ? parseFloat(newExit) : null,
      lot_size: parseFloat(newLot) || 0.1,
      result: newResult,
      pl_amount: parseFloat(newPl) || 0,
      notes: newNotes,
      tags: ['Admin Injected'],
    });

    setIsAddTradeOpen(false);
    setNewEntry('');
    setNewExit('');
    setNewPl('');
    setNewNotes('');
    await fetchAdminData();
  };

  const handleAddAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(adjAmount);
    if (!adjUserId || isNaN(amt) || amt <= 0) return;

    await adminService.addBalanceAdjustment(adjUserId, adjType, amt, adjNotes);
    setIsAddAdjustmentOpen(false);
    setAdjAmount('');
    setAdjNotes('');
    await fetchAdminData();
  };

  const handleExportBackup = () => {
    adminService.exportDatabaseJSON(trades, userSettings, balanceLogs);
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans">
      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-40 bg-[#0c121e]/95 backdrop-blur-md border-b border-gold-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Super Admin Identity */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-amber-600 flex items-center justify-center shadow-lg shadow-gold-500/20">
                <ShieldAlert className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                    SUPER ADMIN CONSOLE
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold animate-pulse">
                    <Radio className="w-2.5 h-2.5" />
                    Realtime Sync Live
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">ktvivek12345@gmail.com (Root Access)</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={fetchAdminData}
                disabled={loading}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
                title="Refresh All Tables"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-gold-400' : ''}`} />
              </button>

              <button
                onClick={handleExportBackup}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-gold-400 hover:text-gold-300 border border-slate-800 text-xs font-semibold transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export DB Dump</span>
              </button>

              <button
                onClick={onCloseAdmin}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                Exit to Journal
              </button>

              <button
                onClick={() => {
                  logoutAdmin();
                  onCloseAdmin();
                }}
                className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-900/50 transition"
                title="Lock Admin Console"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Global KPI Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <p className="text-[10px] font-semibold uppercase text-slate-400">Total System Trades</p>
            <p className="text-xl font-extrabold text-white font-mono mt-1">{stats.totalTrades}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Across all accounts</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <p className="text-[10px] font-semibold uppercase text-slate-400">Total Traded Volume</p>
            <p className="text-xl font-extrabold text-gold-400 font-mono mt-1">{stats.totalVolumeLots} Lots</p>
            <p className="text-[10px] text-slate-500 mt-0.5">XAU/USD Gold</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <p className="text-[10px] font-semibold uppercase text-slate-400">Platform Net P&L</p>
            <p className={`text-xl font-extrabold font-mono mt-1 ${stats.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {stats.netPnL >= 0 ? '+' : ''}${stats.netPnL.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Net combined trader equity</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <p className="text-[10px] font-semibold uppercase text-slate-400">Gross Win Rate</p>
            <p className="text-xl font-extrabold text-emerald-400 font-mono mt-1">{stats.winRate}%</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Platform winning ratio</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <p className="text-[10px] font-semibold uppercase text-slate-400">Deposits / Withdrawals</p>
            <p className="text-sm font-extrabold text-slate-200 font-mono mt-1">
              +${stats.totalDeposits.toLocaleString()} / -${stats.totalWithdrawals.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Capital transactions</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <p className="text-[10px] font-semibold uppercase text-slate-400">Active Profiles</p>
            <p className="text-xl font-extrabold text-purple-400 font-mono mt-1">{stats.activeTradersCount}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Configured traders</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('trades')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'trades'
                ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Master Trades Table ({trades.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('balances')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'balances'
                ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Balances & Capital ({balanceLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('realtime')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'realtime'
                ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live Multi-Device Feed</span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'system'
                ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>System & Backup Tools</span>
          </button>
        </div>

        {/* TAB 1: ALL TRADES MANAGER */}
        {activeTab === 'trades' && (
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search trades, user id..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500"
                  />
                </div>
                <select
                  value={filterResult}
                  onChange={(e) => setFilterResult(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none"
                >
                  <option value="ALL">All Outcomes</option>
                  <option value="PROFIT">Profit</option>
                  <option value="LOSS">Loss</option>
                  <option value="BREAKEVEN">Breakeven</option>
                </select>
              </div>

              <button
                onClick={() => setIsAddTradeOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Force Add Trade</span>
              </button>
            </div>

            {/* Trades Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 uppercase font-semibold">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Trader ID</th>
                    <th className="py-2.5 px-3">Direction</th>
                    <th className="py-2.5 px-3">Entry/Exit</th>
                    <th className="py-2.5 px-3">Lot</th>
                    <th className="py-2.5 px-3 text-right">P&L Amount</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTrades.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-500">
                        No records in database.
                      </td>
                    </tr>
                  ) : (
                    filteredTrades.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                          {t.trade_date}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400 max-w-[120px] truncate" title={t.user_id}>
                          {t.user_id.slice(0, 8)}...
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`font-bold text-[10px] px-1.5 py-0.5 rounded ${
                              t.direction === 'BUY'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                            }`}
                          >
                            {t.direction}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                          {t.entry_price} → {t.exit_price || '-'}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-300">{t.lot_size}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                          <span className={Number(t.pl_amount) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {Number(t.pl_amount) >= 0 ? '+' : ''}${Number(t.pl_amount).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              t.result === 'PROFIT'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : t.result === 'LOSS'
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {t.result}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => setEditingTrade(t)}
                              className="p-1 rounded text-slate-400 hover:text-gold-400 hover:bg-slate-800 transition"
                              title="Edit Trade"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTrade(t.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                              title="Delete Trade"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: BALANCES & CAPITAL */}
        {activeTab === 'balances' && (
          <div className="space-y-6">
            {/* User Starting Balances */}
            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Trader Accounts & Starting Balances</h3>
                  <p className="text-xs text-slate-400">Manage base capital and currency per user</p>
                </div>
                <button
                  onClick={() => setIsAddAdjustmentOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Balance Adjustment</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 uppercase font-semibold">
                      <th className="py-2.5 px-3">User ID</th>
                      <th className="py-2.5 px-3">Starting Balance</th>
                      <th className="py-2.5 px-3">Currency</th>
                      <th className="py-2.5 px-3">Default Lot</th>
                      <th className="py-2.5 px-3">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {userSettings.map((u) => (
                      <tr key={u.user_id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-mono text-slate-300">{u.user_id}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                          ${Number(u.starting_balance).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-200">{u.currency}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">{u.default_lot_size}</td>
                        <td className="py-2.5 px-3 text-slate-400">{u.created_at?.slice(0, 10) || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Balance Logs Audit */}
            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5">
              <h3 className="text-sm font-bold text-white mb-3">Capital Transaction Audit Logs</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 uppercase font-semibold">
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">User ID</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3">Notes</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {balanceLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-500">
                          No balance transactions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      balanceLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/30">
                          <td className="py-2.5 px-3 text-slate-400">{log.created_at?.slice(0, 16).replace('T', ' ')}</td>
                          <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400 max-w-[120px] truncate">
                            {log.user_id.slice(0, 8)}...
                          </td>
                          <td className="py-2.5 px-3 capitalize font-semibold text-slate-200">
                            {log.entry_type.replace('_', ' ')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">
                            <span className={Number(log.amount) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              {Number(log.amount) >= 0 ? '+' : ''}${Number(log.amount).toLocaleString()}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 max-w-[150px] truncate">{log.notes || '-'}</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={async () => {
                                if (confirm('Delete this balance log?')) {
                                  await adminService.deleteBalanceLog(log.id);
                                  await fetchAdminData();
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LIVE REALTIME STREAM */}
        {activeTab === 'realtime' && (
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
                <h3 className="text-sm font-bold text-white">Live Multi-Device Database Event Stream</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Supabase Channel: <code className="text-gold-400">gold-journal-realtime-sync</code>
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Whenever any trade is added, edited, or deleted on any phone, laptop, or browser window, it instantly broadcasts here and updates all views.
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-xs">
              {realtimeLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p>Awaiting live database events from connected devices...</p>
                  <p className="text-[10px] mt-1 text-slate-600">Try creating or editing a trade in another window to see live broadcast</p>
                </div>
              ) : (
                realtimeLogs.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs animate-fadeIn"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">{ev.timestamp}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          ev.eventType === 'INSERT'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : ev.eventType === 'UPDATE'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {ev.eventType}
                      </span>
                      <span className="text-gold-400 font-bold">[{ev.table}]</span>
                      <span className="text-slate-300">{ev.summary}</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold">Synced</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SYSTEM & BACKUP TOOLS */}
        {activeTab === 'system' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-gold-400 font-bold text-sm">
                <Download className="w-4 h-4" />
                <h4>Full Database JSON Backup</h4>
              </div>
              <p className="text-xs text-slate-400">
                Exports an immutable snapshot of all trades, user balance configurations, and capital audit logs.
              </p>
              <button
                onClick={handleExportBackup}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition"
              >
                Download Complete Database Backup
              </button>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Radio className="w-4 h-4" />
                <h4>Realtime Replication Status</h4>
              </div>
              <p className="text-xs text-slate-400">
                Supabase Postgres Changes are configured on <code className="text-gold-400">public.trades</code>, <code className="text-gold-400">public.user_settings</code>, and <code className="text-gold-400">public.balance_log</code>.
              </p>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-emerald-400 space-y-1">
                <div>● postgres_changes: ENABLED</div>
                <div>● RLS Auth uid verification: ACTIVE</div>
                <div>● Auto Reconnect & Resubscribe: ENABLED</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ADMIN EDIT TRADE MODAL */}
      {editingTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Admin: Edit Trade #{editingTrade.id.slice(0, 8)}</h3>
            <form onSubmit={handleUpdateTrade} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Direction</label>
                  <select
                    value={editingTrade.direction}
                    onChange={(e) => setEditingTrade({ ...editingTrade, direction: e.target.value as TradeDirection })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-100"
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Outcome</label>
                  <select
                    value={editingTrade.result}
                    onChange={(e) => setEditingTrade({ ...editingTrade, result: e.target.value as TradeResult })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-100"
                  >
                    <option value="PROFIT">PROFIT</option>
                    <option value="LOSS">LOSS</option>
                    <option value="BREAKEVEN">BREAKEVEN</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Entry Price</label>
                  <input
                    type="number"
                    step="any"
                    value={editingTrade.entry_price}
                    onChange={(e) => setEditingTrade({ ...editingTrade, entry_price: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Exit Price</label>
                  <input
                    type="number"
                    step="any"
                    value={editingTrade.exit_price || ''}
                    onChange={(e) => setEditingTrade({ ...editingTrade, exit_price: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Lot Size</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingTrade.lot_size}
                    onChange={(e) => setEditingTrade({ ...editingTrade, lot_size: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Net P&L ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={editingTrade.pl_amount}
                    onChange={(e) => setEditingTrade({ ...editingTrade, pl_amount: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editingTrade.notes || ''}
                  onChange={(e) => setEditingTrade({ ...editingTrade, notes: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTrade(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-gold-500 text-slate-950 font-bold rounded text-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN FORCE ADD TRADE MODAL */}
      {isAddTradeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Admin: Direct Insert Trade</h3>
            <form onSubmit={handleCreateAdminTrade} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Trade Date</label>
                  <input
                    type="date"
                    value={newTradeDate}
                    onChange={(e) => setNewTradeDate(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Direction</label>
                  <select
                    value={newDirection}
                    onChange={(e) => setNewDirection(e.target.value as TradeDirection)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-100"
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Entry Price</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="2650.00"
                    value={newEntry}
                    onChange={(e) => setNewEntry(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Exit Price</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="2665.00"
                    value={newExit}
                    onChange={(e) => setNewExit(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Lot Size</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newLot}
                    onChange={(e) => setNewLot(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Outcome</label>
                  <select
                    value={newResult}
                    onChange={(e) => setNewResult(e.target.value as TradeResult)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-100"
                  >
                    <option value="PROFIT">PROFIT</option>
                    <option value="LOSS">LOSS</option>
                    <option value="BREAKEVEN">BREAKEVEN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Net P&L ($)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="150.00"
                    value={newPl}
                    onChange={(e) => setNewPl(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Admin reasoning..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddTradeOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-gold-500 text-slate-950 font-bold rounded text-xs"
                >
                  Insert Trade Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN ADD ADJUSTMENT MODAL */}
      {isAddAdjustmentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Admin: Insert Balance Adjustment</h3>
            <form onSubmit={handleAddAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Target Trader User ID</label>
                <input
                  type="text"
                  required
                  value={adjUserId}
                  onChange={(e) => setAdjUserId(e.target.value)}
                  placeholder="UUID"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-100 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Type</label>
                  <select
                    value={adjType}
                    onChange={(e) => setAdjType(e.target.value as any)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-100 text-xs"
                  >
                    <option value="deposit">Deposit</option>
                    <option value="withdrawal">Withdrawal</option>
                    <option value="starting_balance">Starting Balance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="1000.00"
                    value={adjAmount}
                    onChange={(e) => setAdjAmount(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-100 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Manual adjustment by admin..."
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-100 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddAdjustmentOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-gold-500 text-slate-950 font-bold rounded text-xs"
                >
                  Apply Balance Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
