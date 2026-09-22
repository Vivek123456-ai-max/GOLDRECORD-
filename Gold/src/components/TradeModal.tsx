import React, { useState, useEffect } from 'react';
import { Trade, TradeInput, TradeDirection, TradeResult, CurrencyType } from '../types/database.types';
import { X, Calculator, Plus, Tag, HelpCircle, Check, AlertCircle } from 'lucide-react';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trade: TradeInput) => Promise<void>;
  editTrade?: Trade | null;
  currency: CurrencyType;
  defaultLotSize?: number;
}

export const TradeModal: React.FC<TradeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editTrade,
  currency,
  defaultLotSize = 0.01,
}) => {
  const [direction, setDirection] = useState<TradeDirection>('BUY');
  const [symbol, setSymbol] = useState('XAUUSD');
  const [tradeDate, setTradeDate] = useState(new Date().toISOString().slice(0, 10));
  const [tradeTime, setTradeTime] = useState(
    new Date().toTimeString().slice(0, 5)
  );
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [tp, setTp] = useState<string>('');
  const [sl, setSl] = useState<string>('');
  const [exitPrice, setExitPrice] = useState<string>('');
  const [lotSize, setLotSize] = useState<string>(defaultLotSize.toString());
  const [result, setResult] = useState<TradeResult>('PROFIT');
  const [plAmount, setPlAmount] = useState<string>('');
  const [riskReward, setRiskReward] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currencySymbol = currency === 'INR' ? '₹' : '$';

  // Pre-fill fields when editing
  useEffect(() => {
    if (editTrade) {
      setDirection(editTrade.direction);
      setSymbol(editTrade.symbol || 'XAUUSD');
      setTradeDate(editTrade.trade_date);
      setTradeTime(editTrade.trade_time || '');
      setEntryPrice(editTrade.entry_price?.toString() || '');
      setTp(editTrade.tp?.toString() || '');
      setSl(editTrade.sl?.toString() || '');
      setExitPrice(editTrade.exit_price?.toString() || '');
      setLotSize(editTrade.lot_size?.toString() || '0.01');
      setResult(editTrade.result);
      setPlAmount(editTrade.pl_amount?.toString() || '');
      setRiskReward(editTrade.risk_reward_ratio ? `1:${editTrade.risk_reward_ratio}` : '');
      setNotes(editTrade.notes || '');
      setTags(editTrade.tags || []);
    } else {
      // Reset form
      setDirection('BUY');
      setSymbol('XAUUSD');
      setTradeDate(new Date().toISOString().slice(0, 10));
      setTradeTime(new Date().toTimeString().slice(0, 5));
      setEntryPrice('');
      setTp('');
      setSl('');
      setExitPrice('');
      setLotSize(defaultLotSize.toString());
      setResult('PROFIT');
      setPlAmount('');
      setRiskReward('');
      setNotes('');
      setTags(['London Session']);
    }
  }, [editTrade, isOpen, defaultLotSize]);

  // Live Auto-calculate R:R
  useEffect(() => {
    const entry = parseFloat(entryPrice);
    const tpVal = parseFloat(tp);
    const slVal = parseFloat(sl);

    if (!isNaN(entry) && !isNaN(tpVal) && !isNaN(slVal) && entry > 0) {
      let reward = 0;
      let risk = 0;

      if (direction === 'BUY') {
        reward = tpVal - entry;
        risk = entry - slVal;
      } else {
        reward = entry - tpVal;
        risk = slVal - entry;
      }

      if (risk > 0 && reward > 0) {
        const ratio = (reward / risk).toFixed(2);
        setRiskReward(`1:${ratio}`);
      }
    }
  }, [entryPrice, tp, sl, direction]);

  // Live P&L Estimate Calculation for Gold (1 Lot = 100 Contract size)
  const handleAutoCalcPnL = () => {
    const entry = parseFloat(entryPrice);
    const exit = parseFloat(exitPrice);
    const lots = parseFloat(lotSize);

    if (isNaN(entry) || isNaN(exit) || isNaN(lots)) {
      setErrorMsg('Please enter valid Entry Price, Exit Price, and Lot Size to auto-calculate P&L.');
      return;
    }

    // Gold Standard contract: 1 Lot = 100 oz. Price diff of $1 with 1.0 Lot = $100
    let points = 0;
    if (direction === 'BUY') {
      points = exit - entry;
    } else {
      points = entry - exit;
    }

    const calculated = points * lots * 100;
    const rounded = Math.round(calculated * 100) / 100;
    setPlAmount(rounded.toString());

    if (rounded > 0) {
      setResult('PROFIT');
    } else if (rounded < 0) {
      setResult('LOSS');
    } else {
      setResult('BREAKEVEN');
    }
    setErrorMsg(null);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const entry = parseFloat(entryPrice);
    const pl = parseFloat(plAmount);
    const lots = parseFloat(lotSize);

    if (isNaN(entry) || entry <= 0) {
      setErrorMsg('Please enter a valid Entry Price.');
      return;
    }

    if (isNaN(pl)) {
      setErrorMsg('Please enter the P&L Amount (use negative for loss, positive for profit).');
      return;
    }

    if (isNaN(lots) || lots <= 0) {
      setErrorMsg('Please enter a valid Lot Size.');
      return;
    }

    let rrNumeric: number | null = null;
    if (riskReward.includes(':')) {
      const parts = riskReward.split(':');
      if (parts[1]) rrNumeric = parseFloat(parts[1]);
    } else if (!isNaN(parseFloat(riskReward))) {
      rrNumeric = parseFloat(riskReward);
    }

    const tradeData: TradeInput = {
      trade_date: tradeDate,
      trade_time: tradeTime || null,
      symbol: symbol.toUpperCase() || 'XAUUSD',
      direction,
      entry_price: entry,
      tp: tp ? parseFloat(tp) : null,
      sl: sl ? parseFloat(sl) : null,
      exit_price: exitPrice ? parseFloat(exitPrice) : null,
      lot_size: lots,
      result,
      pl_amount: pl,
      risk_reward_ratio: rrNumeric,
      notes: notes.trim() || null,
      tags: tags,
    };

    setSaving(true);
    try {
      await onSave(tradeData);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving trade');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white">
              {editTrade ? 'Edit Trade Record' : 'Log New Gold Trade'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Record entry, exits, TP/SL, and results for XAU/USD
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs sm:text-sm">
          {/* Row 1: Direction & Symbol */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Trade Direction</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDirection('BUY')}
                  className={`py-2 px-3 rounded-lg font-bold text-xs uppercase tracking-wider transition ${
                    direction === 'BUY'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  🟢 BUY (Long)
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('SELL')}
                  className={`py-2 px-3 rounded-lg font-bold text-xs uppercase tracking-wider transition ${
                    direction === 'SELL'
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  🔴 SELL (Short)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Symbol / Instrument</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="XAUUSD"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>

          {/* Row 2: Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Trade Date</label>
              <input
                type="date"
                required
                value={tradeDate}
                onChange={(e) => setTradeDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Entry Time (Optional)</label>
              <input
                type="time"
                value={tradeTime}
                onChange={(e) => setTradeTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>

          {/* Row 3: Prices (Entry, TP, SL, Exit) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Entry Price *</label>
              <input
                type="number"
                step="any"
                required
                placeholder="2650.50"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono text-sm focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Take Profit (TP)</label>
              <input
                type="number"
                step="any"
                placeholder="2670.00"
                value={tp}
                onChange={(e) => setTp(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-emerald-300 font-mono text-sm focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Stop Loss (SL)</label>
              <input
                type="number"
                step="any"
                placeholder="2640.00"
                value={sl}
                onChange={(e) => setSl(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-rose-300 font-mono text-sm focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Exit Price</label>
              <input
                type="number"
                step="any"
                placeholder="2665.00"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono text-sm focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>

          {/* Row 4: Lot Size & Auto Calculate Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Lot Size *</label>
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                placeholder="0.10"
                value={lotSize}
                onChange={(e) => setLotSize(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono text-sm focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Risk : Reward</label>
              <input
                type="text"
                placeholder="1:2.5"
                value={riskReward}
                onChange={(e) => setRiskReward(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-gold-400 font-mono text-sm focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={handleAutoCalcPnL}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-gold-400 hover:text-gold-300 border border-slate-700 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition text-xs"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Auto-Calc P&L</span>
              </button>
            </div>
          </div>

          {/* Row 5: Result & P&L Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Trade Outcome</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['PROFIT', 'LOSS', 'BREAKEVEN'] as TradeResult[]).map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setResult(res)}
                    className={`py-1.5 px-2 rounded-md font-bold text-xs uppercase tracking-wider transition ${
                      result === res
                        ? res === 'PROFIT'
                          ? 'bg-emerald-600 text-white'
                          : res === 'LOSS'
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Net P&L ({currencySymbol}) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 font-mono font-bold text-slate-400">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="+150.00 or -50.00"
                  value={plAmount}
                  onChange={(e) => {
                    setPlAmount(e.target.value);
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) {
                      if (val > 0) setResult('PROFIT');
                      else if (val < 0) setResult('LOSS');
                      else setResult('BREAKEVEN');
                    }
                  }}
                  className={`w-full pl-8 pr-3 py-2 bg-slate-900 border rounded-lg font-mono font-bold text-sm focus:outline-none ${
                    parseFloat(plAmount) > 0
                      ? 'border-emerald-500/50 text-emerald-400'
                      : parseFloat(plAmount) < 0
                      ? 'border-rose-500/50 text-rose-400'
                      : 'border-slate-800 text-slate-100'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Row 6: Strategy Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tags / Strategy</label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gold-500/10 text-gold-400 border border-gold-500/20 text-xs"
                >
                  <Tag className="w-3 h-3" />
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-400 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Breakout, London Open, News Trade"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-gold-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
              >
                Add Tag
              </button>
            </div>
          </div>

          {/* Row 7: Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Trade Notes & Reasoning</label>
            <textarea
              rows={2}
              placeholder="Why did you take this trade? Confluence factors, psychological state, execution details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-gold-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold transition text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-slate-950 rounded-lg font-bold transition text-xs shadow-md shadow-gold-500/20 disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{editTrade ? 'Update Trade' : 'Save Trade Record'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
