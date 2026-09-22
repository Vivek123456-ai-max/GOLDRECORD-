import React from 'react';
import {
  PerformanceStats,
  Trade,
  UserSettings,
  BalanceLog,
  TradeInput,
} from '../types/database.types';
import { StatCard } from './StatCard';
import { EquityChart } from './EquityChart';
import { DailyPnLChart } from './DailyPnLChart';
import { TradeHistoryTable } from './TradeHistoryTable';
import { analyticsService } from '../services/analyticsService';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Award,
  BarChart2,
  Calendar,
  Flame,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

interface DashboardProps {
  stats: PerformanceStats;
  trades: Trade[];
  settings: UserSettings | null;
  balanceLogs: BalanceLog[];
  onOpenAddTrade: () => void;
  onOpenSettings: () => void;
  onSaveSettings: (settings: Partial<UserSettings>) => Promise<void>;
  onEditTrade: (trade: Trade) => void;
  onDeleteTrade: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  trades,
  settings,
  balanceLogs,
  onOpenAddTrade,
  onOpenSettings,
  onSaveSettings,
  onEditTrade,
  onDeleteTrade,
}) => {
  const [quickBalanceInput, setQuickBalanceInput] = React.useState<string>('');
  const [savingBalance, setSavingBalance] = React.useState<boolean>(false);
  const currencySymbol = stats.currency === 'INR' ? '₹' : '$';

  const formatCurrency = (val: number) => {
    return `${currencySymbol}${val.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const equityData = analyticsService.buildEquityCurve(trades, stats.startingBalance);
  const dailyData = analyticsService.buildDailyPnL(trades);

  const handleQuickSetBalance = async (amount: number) => {
    setSavingBalance(true);
    try {
      await onSaveSettings({ starting_balance: amount });
      setQuickBalanceInput('');
    } finally {
      setSavingBalance(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Starting Balance Prompt Banner (If balance is 0 or user wants quick setup) */}
      {stats.startingBalance === 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-gold-950/50 via-slate-900 to-amber-950/40 border border-gold-500/40 p-5 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-gold-500/20 text-gold-400 border border-gold-500/30">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Set Your Account Starting Balance</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-400">
                    Step 1
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Enter your starting trading capital to begin tracking your equity curve and account growth.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[500, 1000, 5000, 10000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickSetBalance(amt)}
                  disabled={savingBalance}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-gold-500 hover:text-slate-950 text-gold-300 border border-slate-700 font-mono text-xs font-bold transition"
                >
                  {currencySymbol}{amt.toLocaleString()}
                </button>
              ))}

              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  placeholder="Custom $"
                  value={quickBalanceInput}
                  onChange={(e) => setQuickBalanceInput(e.target.value)}
                  className="w-28 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-gold-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const amt = parseFloat(quickBalanceInput);
                    if (!isNaN(amt) && amt > 0) handleQuickSetBalance(amt);
                  }}
                  disabled={savingBalance || !quickBalanceInput}
                  className="px-3.5 py-1.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold text-xs transition disabled:opacity-40"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Current Balance */}
        <StatCard
          title="Account Balance"
          value={formatCurrency(stats.currentBalance)}
          subtitle={`Start: ${formatCurrency(stats.startingBalance)}`}
          icon={DollarSign}
          variant="gold"
          onClick={onOpenSettings}
          actionLabel="Edit"
        />

        {/* Today's PnL */}
        <StatCard
          title="Today's P&L"
          value={`${stats.todayPnL >= 0 ? '+' : ''}${formatCurrency(stats.todayPnL)}`}
          subtitle="All trades closed today"
          icon={Calendar}
          variant={stats.todayPnL > 0 ? 'emerald' : stats.todayPnL < 0 ? 'rose' : 'default'}
        />

        {/* Total Net PnL */}
        <StatCard
          title="Net Profit / Loss"
          value={`${stats.totalPnL >= 0 ? '+' : ''}${formatCurrency(stats.totalPnL)}`}
          subtitle={`${stats.totalTrades} closed trades`}
          icon={TrendingUp}
          variant={stats.totalPnL > 0 ? 'emerald' : stats.totalPnL < 0 ? 'rose' : 'default'}
        />

        {/* Win Rate */}
        <StatCard
          title="Win Rate"
          value={`${stats.winRate}%`}
          subtitle={`${stats.winTrades}W / ${stats.lossTrades}L / ${stats.breakevenTrades}BE`}
          icon={Percent}
          variant={stats.winRate >= 50 ? 'emerald' : 'rose'}
        />

        {/* Profit Factor */}
        <StatCard
          title="Profit Factor"
          value={stats.profitFactor.toString()}
          subtitle="Gross Profit / Gross Loss"
          icon={Award}
          variant={stats.profitFactor >= 1.5 ? 'emerald' : 'gold'}
        />

        {/* Best / Worst Trade */}
        <StatCard
          title="Best Trade"
          value={formatCurrency(stats.bestTrade)}
          subtitle={`Worst: ${formatCurrency(stats.worstTrade)}`}
          icon={Flame}
          variant="gold"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EquityChart data={equityData} currency={stats.currency} />
        <DailyPnLChart data={dailyData} currency={stats.currency} />
      </div>

      {/* Trading Journal History Table */}
      <TradeHistoryTable
        trades={trades}
        stats={stats}
        traderEmail={settings?.user_id}
        currency={stats.currency}
        onEditTrade={onEditTrade}
        onDeleteTrade={onDeleteTrade}
      />
    </div>
  );
};
