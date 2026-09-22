import { supabase } from '../lib/supabase';
import { UserSettings, BalanceLog, CurrencyType } from '../types/database.types';

export const balanceService = {
  /**
   * Fetch current user settings (starting balance, currency, etc.)
   */
  async getUserSettings(): Promise<{ data: UserSettings | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!data && !error) {
      // Create initial settings if not existing
      const initialSettings: UserSettings = {
        user_id: user.id,
        starting_balance: 1000,
        currency: 'USD',
        default_lot_size: 0.01,
        default_risk_pct: 1.0,
      };
      const { data: inserted, error: insertError } = await supabase
        .from('user_settings')
        .insert([initialSettings])
        .select()
        .single();
      return { data: inserted, error: insertError };
    }

    return { data, error };
  },

  /**
   * Update starting balance, currency, or risk settings
   */
  async updateUserSettings(settings: Partial<UserSettings>): Promise<{ data: UserSettings | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('user_settings')
      .upsert({ ...settings, user_id: user.id, updated_at: new Date().toISOString() })
      .select()
      .single();

    return { data, error };
  },

  /**
   * Get balance transaction logs
   */
  async getBalanceLogs(): Promise<{ data: BalanceLog[] | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('balance_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  /**
   * Add a deposit or withdrawal
   */
  async addAdjustment(entryType: 'deposit' | 'withdrawal' | 'adjustment', amount: number, notes?: string): Promise<{ data: BalanceLog | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'User not authenticated' };

    const adjustedAmount = entryType === 'withdrawal' ? -Math.abs(amount) : Math.abs(amount);

    const { data, error } = await supabase
      .from('balance_log')
      .insert([{
        user_id: user.id,
        entry_type: entryType,
        amount: adjustedAmount,
        notes: notes || null
      }])
      .select()
      .single();

    return { data, error };
  }
};
