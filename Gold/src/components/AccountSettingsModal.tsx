import React, { useState } from 'react';
import { UserSettings, CurrencyType, BalanceLog } from '../types/database.types';
import { X, DollarSign, Wallet, ArrowDownRight, ArrowUpRight, Check, AlertCircle } from 'lucide-react';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings | null;
  balanceLogs: BalanceLog[];
  onSaveSettings: (settings: Partial<UserSettings>) => Promise<void>;
  onAddAdjustment: (type: 'deposit' | 'withdrawal' | 'adjustment', amount: number, notes?: string) => Promise<void>;
  onClearAllTrades?: () => Promise<void>;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  balanceLogs,
  onSaveSettings,
  onAddAdjustment,
  onClearAllTrades,
}) => {
  const [startingBalance, setStartingBalance] = useState<string>(
    settings?.starting_balance?.toString() || '1000'
  );
  const [currency, setCurrency] = useState<CurrencyType>(settings?.currency || 'USD');
  const [defaultLotSize, setDefaultLotSize] = useState<string>(
    settings?.default_lot_size?.toString() || '0.01'
  );

  // Adjustment Form
  const [adjType, setAdjType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [adjAmount, setAdjAmount] = useState<string>('');
  const [adjNotes, setAdjNotes] = useState<string>('');
  const [adjLoading, setAdjLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSettingsLoading(true);

    try {
      await onSaveSettings({
        starting_balance: parseFloat(startingBalance) || 1000,
        currency,
        default_lot_size: parseFloat(defaultLotSize) || 0.01,
      });
      setMessage({ text: 'Account settings updated successfully!', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update settings', type: 'error' });
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleAddAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(adjAmount);
    if (isNaN(amt) || amt <= 0) {
      setMessage({ text: 'Please enter a valid positive amount.', type: 'error' });
      return;
    }

    setAdjLoading(true);
    try {
      await onAddAdjustment(adjType, amt, adjNotes);
      setAdjAmount('');
      setAdjNotes('');
      setMessage({
        text: `${adjType === 'deposit' ? 'Deposit' : 'Withdrawal'} of ${amt} logged!`,
        type: 'success',
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to record adjustment', type: 'error' });
    } finally {
      setAdjLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-2xl my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/30">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Account & Balance Settings</h2>
              <p className="text-xs text-slate-400">Configure starting balance, currency & capital changes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-300'
                : 'bg-rose-950/50 border border-rose-800 text-rose-300'
            }`}
          >
            {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="mt-5 space-y-6">
          {/* Section 1: Initial Account Configuration */}
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <h3 className="text-xs font-bold text-gold-400 uppercase tracking-wider">
              1. Base Capital & Currency
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Starting Balance</label>
                <input
                  type="number"
                  step="any"
                  value={startingBalance}
                  onChange={(e) => setStartingBalance(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyType)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-gold-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Default Lot Size</label>
                <input
                  type="number"
                  step="0.01"
                  value={defaultLotSize}
                  onChange={(e) => setDefaultLotSize(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={settingsLoading}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-gold-400 border border-slate-700 rounded-lg text-xs font-bold transition disabled:opacity-50"
              >
                {settingsLoading ? 'Saving...' : 'Update Base Settings'}
              </button>
            </div>
          </form>

          {/* Section 2: Deposit / Withdrawal Logger */}
          <form onSubmit={handleAddAdjustment} className="pt-4 border-t border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-gold-400 uppercase tracking-wider">
              2. Log Deposit or Withdrawal
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Action Type</label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setAdjType('deposit')}
                    className={`py-1.5 px-2 rounded-md font-bold text-xs flex items-center justify-center gap-1 transition ${
                      adjType === 'deposit'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <ArrowDownRight className="w-3 h-3" />
                    Deposit
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjType('withdrawal')}
                    className={`py-1.5 px-2 rounded-md font-bold text-xs flex items-center justify-center gap-1 transition ${
                      adjType === 'withdrawal'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <ArrowUpRight className="w-3 h-3" />
                    Withdraw
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Amount ({currency === 'INR' ? '₹' : '$'})
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="500.00"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Bank wire, top-up..."
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={adjLoading}
                className="px-4 py-1.5 bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-slate-950 rounded-lg text-xs font-bold transition disabled:opacity-50"
              >
                {adjLoading ? 'Recording...' : `Record ${adjType === 'deposit' ? 'Deposit' : 'Withdrawal'}`}
              </button>
            </div>
          </form>

          {/* Section 3: Recent Balance Changes History */}
          {balanceLogs.length > 0 && (
            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-400 mb-2">Recent Capital Activity</h4>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {balanceLogs.slice(0, 5).map((log) => {
                  const isPositive = Number(log.amount) >= 0;
                  return (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-200 capitalize">
                          {log.entry_type.replace('_', ' ')}
                        </span>
                        {log.notes && <span className="text-slate-400 ml-2">({log.notes})</span>}
                      </div>
                      <span
                        className={`font-mono font-bold ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {currency === 'INR' ? '₹' : '$'}
                        {Number(log.amount).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 4: Reset & Clear All Trades */}
          {onClearAllTrades && (
            <div className="pt-4 border-t border-rose-950/60 p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-rose-300">Reset & Clear All Trade Records</h4>
                <p className="text-[11px] text-slate-400">
                  Delete all logged trades and reset journal metrics to clean 0.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Are you sure you want to delete ALL logged trades and reset your metrics to 0?')) {
                    await onClearAllTrades();
                    setMessage({ text: 'All trades deleted! Journal reset to 0.', type: 'success' });
                  }
                }}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition whitespace-nowrap shadow-md shadow-rose-900/30"
              >
                Clear All Trades (Reset to 0)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
