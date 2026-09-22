import React, { useState, useMemo } from 'react';
import { Trade, CurrencyType, TradeResult, TradeDirection, PerformanceStats } from '../types/database.types';
import { pdfExportService } from '../services/pdfExportService';
import {
  Search,
  Filter,
  Download,
  FileText,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Tag,
  ArrowUpDown,
} from 'lucide-react';

interface TradeHistoryTableProps {
  trades: Trade[];
  stats?: PerformanceStats;
  traderEmail?: string;
  currency: CurrencyType;
  onEditTrade: (trade: Trade) => void;
  onDeleteTrade: (id: string) => void;
}

export const TradeHistoryTable: React.FC<TradeHistoryTableProps> = ({
  trades,
  stats,
  traderEmail,
  currency,
  onEditTrade,
  onDeleteTrade,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [resultFilter, setResultFilter] = useState<string>('ALL');
  const [directionFilter, setDirectionFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'date' | 'pnl' | 'lot'>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const currencySymbol = currency === 'INR' ? '₹' : '$';

  // Filter and Sort Logic
  const filteredTrades = useMemo(() => {
    return trades
      .filter((t) => {
        // Result filter
        if (resultFilter !== 'ALL' && t.result !== resultFilter) return false;

        // Direction filter
        if (directionFilter !== 'ALL' && t.direction !== directionFilter) return false;

        // Search text (symbol, notes, tags)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesSymbol = t.symbol.toLowerCase().includes(q);
          const matchesNotes = t.notes?.toLowerCase().includes(q);
          const matchesTags = t.tags?.some((tag) => tag.toLowerCase().includes(q));
          if (!matchesSymbol && !matchesNotes && !matchesTags) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'date') {
          const tA = new Date(`${a.trade_date}T${a.trade_time || '00:00:00'}`).getTime();
          const tB = new Date(`${b.trade_date}T${b.trade_time || '00:00:00'}`).getTime();
          diff = tA - tB;
        } else if (sortField === 'pnl') {
          diff = Number(a.pl_amount) - Number(b.pl_amount);
        } else if (sortField === 'lot') {
          diff = Number(a.lot_size) - Number(b.lot_size);
        }
        return sortAsc ? diff : -diff;
      });
  }, [trades, resultFilter, directionFilter, searchQuery, sortField, sortAsc]);

  // Pagination slice
  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage) || 1;
  const paginatedTrades = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTrades.slice(start, start + itemsPerPage);
  }, [filteredTrades, currentPage, itemsPerPage]);

  const handleSort = (field: 'date' | 'pnl' | 'lot') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // CSV Export handler
  const handleExportCSV = () => {
    if (trades.length === 0) return;

    const headers = [
      'Trade Date',
      'Time',
      'Symbol',
      'Direction',
      'Entry Price',
      'TP',
      'SL',
      'Exit Price',
      'Lot Size',
      'Result',
      'P&L Amount',
      'R:R Ratio',
      'Tags',
      'Notes',
    ];

    const rows = trades.map((t) => [
      t.trade_date,
      t.trade_time || '',
      t.symbol,
      t.direction,
      t.entry_price,
      t.tp || '',
      t.sl || '',
      t.exit_price || '',
      t.lot_size,
      t.result,
      t.pl_amount,
      t.risk_reward_ratio ? `1:${t.risk_reward_ratio}` : '',
      (t.tags || []).join('; '),
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gold_trades_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-xl bg-slate-900/90 backdrop-blur-sm border border-slate-800 p-4 sm:p-6">
      {/* Title & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>Trading Journal & History</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-gold-400 border border-slate-700">
              {filteredTrades.length} records
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Detailed log of all XAU/USD gold trades with notes & analytics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (stats) {
                pdfExportService.exportTradingReportPDF(trades, stats, traderEmail, currency);
              }
            }}
            disabled={trades.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-500/20 hover:bg-gold-500/30 text-gold-300 text-xs font-semibold border border-gold-500/40 transition disabled:opacity-40"
            title="Download PDF Trading Statement"
          >
            <FileText className="w-3.5 h-3.5 text-gold-400" />
            <span>Download PDF Report</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={trades.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 text-gold-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 my-4">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search notes, tags..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Result Filter */}
          <select
            value={resultFilter}
            onChange={(e) => {
              setResultFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-gold-500"
          >
            <option value="ALL">All Outcomes</option>
            <option value="PROFIT">Win (Profit)</option>
            <option value="LOSS">Loss</option>
            <option value="BREAKEVEN">Breakeven</option>
          </select>

          {/* Direction Filter */}
          <select
            value={directionFilter}
            onChange={(e) => {
              setDirectionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-gold-500"
          >
            <option value="ALL">All Directions</option>
            <option value="BUY">BUY Only</option>
            <option value="SELL">SELL Only</option>
          </select>

          {/* Page size */}
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-gold-500"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/40">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold">
              <th
                onClick={() => handleSort('date')}
                className="py-3 px-3 cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1">
                  <span>Date & Time</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3">Symbol / Dir</th>
              <th className="py-3 px-3">Entry & Exit</th>
              <th className="py-3 px-3">TP / SL</th>
              <th
                onClick={() => handleSort('lot')}
                className="py-3 px-3 cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1">
                  <span>Lot</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3">R:R</th>
              <th
                onClick={() => handleSort('pnl')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Net P&L</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">Outcome</th>
              <th className="py-3 px-3">Tags & Notes</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {paginatedTrades.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-500">
                  No trade records found. Click &quot;Log Trade&quot; to add your first record.
                </td>
              </tr>
            ) : (
              paginatedTrades.map((t) => {
                const isProfit = Number(t.pl_amount) > 0;
                const isLoss = Number(t.pl_amount) < 0;

                return (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-900/50 transition group"
                  >
                    {/* Date */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-medium text-slate-200">{t.trade_date}</div>
                      {t.trade_time && (
                        <div className="text-[10px] text-slate-500">{t.trade_time}</div>
                      )}
                    </td>

                    {/* Symbol & Direction */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-bold text-slate-200">{t.symbol}</div>
                      <span
                        className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          t.direction === 'BUY'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                        }`}
                      >
                        {t.direction === 'BUY' ? (
                          <TrendingUp className="w-2.5 h-2.5" />
                        ) : (
                          <TrendingDown className="w-2.5 h-2.5" />
                        )}
                        {t.direction}
                      </span>
                    </td>

                    {/* Entry / Exit */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono">
                      <div className="text-slate-200">
                        <span className="text-slate-500 text-[10px]">In:</span> {t.entry_price}
                      </div>
                      {t.exit_price ? (
                        <div className="text-slate-400 text-[11px]">
                          <span className="text-slate-500 text-[10px]">Out:</span> {t.exit_price}
                        </div>
                      ) : (
                        <div className="text-slate-600 text-[10px]">-</div>
                      )}
                    </td>

                    {/* TP / SL */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                      <div className="text-emerald-400/90">
                        <span className="text-slate-500 text-[10px]">TP:</span> {t.tp || '-'}
                      </div>
                      <div className="text-rose-400/90">
                        <span className="text-slate-500 text-[10px]">SL:</span> {t.sl || '-'}
                      </div>
                    </td>

                    {/* Lot Size */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-300 font-semibold">
                      {t.lot_size}
                    </td>

                    {/* R:R Ratio */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-gold-400 text-xs">
                      {t.risk_reward_ratio ? `1:${t.risk_reward_ratio}` : '-'}
                    </td>

                    {/* Net P&L */}
                    <td className="py-3 px-3 whitespace-nowrap text-right font-mono font-bold text-sm">
                      <span
                        className={
                          isProfit
                            ? 'text-emerald-400'
                            : isLoss
                            ? 'text-rose-400'
                            : 'text-slate-300'
                        }
                      >
                        {isProfit ? '+' : ''}
                        {currencySymbol}
                        {Number(t.pl_amount).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>

                    {/* Result Badge */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          t.result === 'PROFIT'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : t.result === 'LOSS'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-700/40 text-slate-400 border border-slate-600'
                        }`}
                      >
                        {t.result}
                      </span>
                    </td>

                    {/* Tags & Notes */}
                    <td className="py-3 px-3 max-w-xs">
                      <div className="flex flex-wrap gap-1 mb-1">
                        {(t.tags || []).map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-gold-300 border border-slate-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      {t.notes && (
                        <p className="text-slate-400 text-[11px] truncate max-w-[200px]" title={t.notes}>
                          {t.notes}
                        </p>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {deletingId === t.id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              onDeleteTrade(t.id);
                              setDeletingId(null);
                            }}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="px-1.5 py-1 bg-slate-800 text-slate-400 hover:text-white rounded text-[10px]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                          <button
                            onClick={() => onEditTrade(t)}
                            className="p-1 rounded text-slate-400 hover:text-gold-400 hover:bg-slate-800 transition"
                            title="Edit Trade"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(t.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                            title="Delete Trade"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredTrades.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
          <div>
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredTrades.length)} of{' '}
            {filteredTrades.length} trades
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-800 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-800 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
