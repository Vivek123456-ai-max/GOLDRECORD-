import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { CurrencyType } from '../types/database.types';
import { BarChart3 } from 'lucide-react';

interface DailyPnLChartProps {
  data: Array<{
    date: string;
    profit: number;
    loss: number;
    net: number;
    tradesCount: number;
  }>;
  currency: CurrencyType;
}

export const DailyPnLChart: React.FC<DailyPnLChartProps> = ({ data, currency }) => {
  const symbol = currency === 'INR' ? '₹' : '$';

  const formatCurrency = (val: number) => {
    return `${symbol}${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl text-xs space-y-1">
          <p className="font-semibold text-slate-300">{point.date}</p>
          <p className="text-slate-400">Total Trades: {point.tradesCount}</p>
          <p className={`font-bold font-mono ${point.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            Net P&L: {point.net >= 0 ? '+' : ''}{symbol}{point.net.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl bg-slate-900/90 backdrop-blur-sm border border-slate-800 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gold-400" />
            <h3 className="text-base font-bold text-white">Daily Net P&L</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Day-by-day profit and loss performance
          </p>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(d) => {
                const parts = d.split('-');
                return parts.length === 3 ? `${parts[1]}/${parts[2]}` : d;
              }}
            />
            <YAxis
              tickFormatter={formatCurrency}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
            <Bar dataKey="net" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.net >= 0 ? '#10b981' : '#ef4444'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
