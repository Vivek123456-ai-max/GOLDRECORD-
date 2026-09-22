export type TradeDirection = 'BUY' | 'SELL';
export type TradeResult = 'PROFIT' | 'LOSS' | 'BREAKEVEN';
export type CurrencyType = 'USD' | 'INR';

export interface UserSettings {
  user_id: string;
  starting_balance: number;
  currency: CurrencyType;
  default_lot_size: number;
  default_risk_pct: number;
  created_at?: string;
  updated_at?: string;
}

export interface Trade {
  id: string;
  user_id: string;
  trade_date: string; // YYYY-MM-DD
  trade_time?: string | null;
  symbol: string;
  direction: TradeDirection;
  entry_price: number;
  tp?: number | null;
  sl?: number | null;
  exit_price?: number | null;
  lot_size: number;
  result: TradeResult;
  pl_amount: number;
  risk_reward_ratio?: number | null;
  notes?: string | null;
  tags?: string[];
  screenshot_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type TradeInput = Omit<Trade, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export interface BalanceLog {
  id: string;
  user_id: string;
  entry_type: 'starting_balance' | 'deposit' | 'withdrawal' | 'trade_pl' | 'adjustment';
  amount: number;
  balance_after?: number | null;
  ref_trade_id?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface TradeFilter {
  result?: TradeResult | 'ALL';
  direction?: TradeDirection | 'ALL';
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
}

export interface PerformanceStats {
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  breakevenTrades: number;
  winRate: number; // percentage e.g. 65.5
  totalPnL: number;
  todayPnL: number;
  profitFactor: number;
  bestTrade: number;
  worstTrade: number;
  startingBalance: number;
  currentBalance: number;
  currency: CurrencyType;
  averageWin: number;
  averageLoss: number;
  buyWinRate: number;
  sellWinRate: number;
}
