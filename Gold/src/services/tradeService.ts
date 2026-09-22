import { supabase } from '../lib/supabase';
import { Trade, TradeInput } from '../types/database.types';

export const tradeService = {
  /**
   * Fetch all trades for the current authenticated user
   */
  async getTrades(): Promise<{ data: Trade[] | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('trade_date', { ascending: false })
      .order('created_at', { ascending: false });

    return { data, error };
  },

  /**
   * Add a new trade record
   */
  async createTrade(trade: TradeInput): Promise<{ data: Trade | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'User not authenticated' };

    const newTrade = {
      ...trade,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from('trades')
      .insert([newTrade])
      .select()
      .single();

    return { data, error };
  },

  /**
   * Update an existing trade
   */
  async updateTrade(id: string, updates: Partial<TradeInput>): Promise<{ data: Trade | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('trades')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Delete a trade record
   */
  async deleteTrade(id: string): Promise<{ error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'User not authenticated' };

    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    return { error };
  },

  /**
   * Delete all trades for the current authenticated user (Reset to clean zero)
   */
  async clearAllTrades(): Promise<{ error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'User not authenticated' };

    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('user_id', user.id);

    return { error };
  }
};
