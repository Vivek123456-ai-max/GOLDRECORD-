import { supabase } from '../lib/supabase';
import { Trade, UserSettings, BalanceLog, TradeInput } from '../types/database.types';

export interface GlobalPlatformStats {
  totalTrades: number;
  totalVolumeLots: number;
  grossProfit: number;
  grossLoss: number;
  netPnL: number;
  winRate: number;
  activeTradersCount: number;
  totalDeposits: number;
  totalWithdrawals: number;
}

export const adminService = {
  /**
   * Fetch all trades in the entire system
   */
  async getAllTrades(): Promise<{ data: Trade[] | null; error: any }> {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .order('trade_date', { ascending: false })
      .order('created_at', { ascending: false });

    return { data, error };
  },

  /**
   * Admin edit any trade
   */
  async updateTrade(id: string, updates: Partial<TradeInput>): Promise<{ data: Trade | null; error: any }> {
    const { data, error } = await supabase
      .from('trades')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Admin delete any trade
   */
  async deleteTrade(id: string): Promise<{ error: any }> {
    const { error } = await supabase.from('trades').delete().eq('id', id);
    return { error };
  },

  /**
   * Admin create a new trade
   */
  async createTrade(trade: TradeInput & { user_id?: string }): Promise<{ data: Trade | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = trade.user_id || user?.id || 'admin-system';

    const { data, error } = await supabase
      .from('trades')
      .insert([{ ...trade, user_id: userId }])
      .select()
      .single();

    return { data, error };
  },

  /**
   * Fetch all user settings
   */
  async getAllUserSettings(): Promise<{ data: UserSettings[] | null; error: any }> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .order('created_at', { ascending: false });

    return { data, error };
  },

  /**
   * Update any user settings
   */
  async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<{ data: UserSettings | null; error: any }> {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({ ...settings, user_id: userId, updated_at: new Date().toISOString() })
      .select()
      .single();

    return { data, error };
  },

  /**
   * Fetch all balance logs across the system
   */
  async getAllBalanceLogs(): Promise<{ data: BalanceLog[] | null; error: any }> {
    const { data, error } = await supabase
      .from('balance_log')
      .select('*')
      .order('created_at', { ascending: false });

    return { data, error };
  },

  /**
   * Admin add balance adjustment for a user
   */
  async addBalanceAdjustment(
    userId: string,
    entryType: 'deposit' | 'withdrawal' | 'adjustment' | 'starting_balance',
    amount: number,
    notes?: string
  ): Promise<{ data: BalanceLog | null; error: any }> {
    const adjustedAmount = entryType === 'withdrawal' ? -Math.abs(amount) : Math.abs(amount);

    const { data, error } = await supabase
      .from('balance_log')
      .insert([{
        user_id: userId,
        entry_type: entryType,
        amount: adjustedAmount,
        notes: notes || null,
      }])
      .select()
      .single();

    return { data, error };
  },

  /**
   * Admin delete a balance log
   */
  async deleteBalanceLog(id: string): Promise<{ error: any }> {
    const { error } = await supabase.from('balance_log').delete().eq('id', id);
    return { error };
  },

  /**
   * Compute Global System Analytics across all tables
   */
  calculateGlobalStats(trades: Trade[], balanceLogs: BalanceLog[], userSettings: UserSettings[]): GlobalPlatformStats {
    let totalVolumeLots = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let netPnL = 0;
    let winCount = 0;

    trades.forEach((t) => {
      totalVolumeLots += Number(t.lot_size || 0);
      const pl = Number(t.pl_amount || 0);
      netPnL += pl;
      if (pl > 0) {
        grossProfit += pl;
        winCount++;
      } else if (pl < 0) {
        grossLoss += Math.abs(pl);
      }
    });

    let totalDeposits = 0;
    let totalWithdrawals = 0;
    balanceLogs.forEach((log) => {
      const amt = Number(log.amount || 0);
      if (log.entry_type === 'deposit') totalDeposits += Math.abs(amt);
      if (log.entry_type === 'withdrawal') totalWithdrawals += Math.abs(amt);
    });

    const totalTrades = trades.length;
    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;

    return {
      totalTrades,
      totalVolumeLots: Math.round(totalVolumeLots * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      grossLoss: Math.round(grossLoss * 100) / 100,
      netPnL: Math.round(netPnL * 100) / 100,
      winRate: Math.round(winRate * 10) / 10,
      activeTradersCount: Math.max(1, userSettings.length),
      totalDeposits: Math.round(totalDeposits * 100) / 100,
      totalWithdrawals: Math.round(totalWithdrawals * 100) / 100,
    };
  },

  /**
   * Export full database as JSON
   */
  exportDatabaseJSON(trades: Trade[], settings: UserSettings[], logs: BalanceLog[]) {
    const backup = {
      exportDate: new Date().toISOString(),
      system: 'Gold Trading Journal Database Backup',
      tables: {
        trades,
        user_settings: settings,
        balance_log: logs,
      },
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `gold_journal_db_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },
};
