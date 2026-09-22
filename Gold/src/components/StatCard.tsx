import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'gold' | 'emerald' | 'rose' | 'default';
  badge?: string;
  onClick?: () => void;
  actionLabel?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  badge,
  onClick,
  actionLabel,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'gold':
        return {
          iconBg: 'bg-gold-500/10 text-gold-400 border border-gold-500/30',
          border: 'border-gold-500/20 hover:border-gold-500/40',
          valueColor: 'text-gold-300',
        };
      case 'emerald':
        return {
          iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
          border: 'border-emerald-500/20 hover:border-emerald-500/40',
          valueColor: 'text-emerald-400',
        };
      case 'rose':
        return {
          iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
          border: 'border-rose-500/20 hover:border-rose-500/40',
          valueColor: 'text-rose-400',
        };
      default:
        return {
          iconBg: 'bg-slate-800 text-slate-300 border border-slate-700',
          border: 'border-slate-800 hover:border-slate-700',
          valueColor: 'text-slate-100',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl bg-slate-900/90 backdrop-blur-sm p-4 sm:p-5 border ${styles.border} transition-all duration-200 hover:shadow-lg ${
        onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-100 group' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
            {actionLabel && (
              <span className="text-[9px] text-gold-400 opacity-0 group-hover:opacity-100 transition font-bold underline underline-offset-1">
                {actionLabel}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <h3 className={`text-xl sm:text-2xl font-bold font-mono ${styles.valueColor}`}>
              {value}
            </h3>
            {badge && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>

        <div className={`p-2.5 rounded-xl ${styles.iconBg} shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
