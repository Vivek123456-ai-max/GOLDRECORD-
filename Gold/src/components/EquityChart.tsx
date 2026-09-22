import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CurrencyType } from '../types/database.types';
import { TrendingUp, Activity } from 'lucide-react';

interface EquityChartProps {
  data: Array<{
    date: string;
    balance: number;
    tradeNo: number;
    pnl: number;
    symbol?: string;
  }>;
  currency: CurrencyType;
}

export const EquityChart: React.FC<EquityChartProps> = ({ data, currency }) => {
  const symbol = currency === 'INR' ? '₹' : '$';

  const formatCurrency = (val: number) => {
    return `${symbol}${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const minBalance = Math.min(...data.map((d) => d.balance));
  const maxBalance = Math.max(...data.map((d) => d.balance));
  const yDomainMin = Math.floor(Math.max(0, minBalance * 0.95));
  const yDomainMax = Math.ceil(maxBalance * 1.05);

  const isNetPositive = data.length > 0 && data[data.length - 1].balance >= data[0].balance;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl text-xs space-y-1">
          <p className="font-semibold text-slate-300">
            {point.tradeNo === 0 ? 'Starting Balance' : `Trade #${point.tradeNo} (${point.date})`}
          </p>
          <p className="text-sm font-bold text-slate-100 font-mono">
            Balance: <span className="text-gold-400">{symbol}{point.balance.toLocaleString()}</span>
          </p>
          {point.tradeNo > 0 && (
            <p className={`font-medium ${point.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              Trade P&L: {point.pnl >= 0 ? '+' : ''}{symbol}{point.pnl.toLocaleString()}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl bg-slate-900/90 backdrop-blur-sm border border-slate-800 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gold-400" />
            <h3 className="text-base font-bold text-white">Account Equity Curve</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Cumulative balance growth across all closed gold trades
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300">
            <Activity className="w-3.5 h-3.5 text-gold-400" />
            <span>{data.length > 1 ? `${data.length - 1} Trades` : 'No Trades Yet'}</span>
          </span>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isNetPositive ? '#f59e0b' : '#ef4444'} stopOpacity={0.35} />
                <stop offset="95%" stopColor={isNetPositive ? '#f59e0b' : '#ef4444'} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="tradeNo"
              tickFormatter={(val) => (val === 0 ? 'Start' : `#${val}`)}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              domain={[yDomainMin, yDomainMax]}
              tickFormatter={formatCurrency}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              width={65}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="balance"
              stroke={isNetPositive ? '#f59e0b' : '#ef4444'}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#goldGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
