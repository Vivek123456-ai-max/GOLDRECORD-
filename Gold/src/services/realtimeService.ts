import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type ChangeCallback = (payload: { table: string; eventType: string; new?: any; old?: any }) => void;

let channel: RealtimeChannel | null = null;

export const realtimeService = {
  /**
   * Subscribe to all table changes in real-time across devices
   */
  subscribeToAllChanges(onDataChange: ChangeCallback): () => void {
    if (channel) {
      supabase.removeChannel(channel);
    }

    channel = supabase
      .channel('gold-journal-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trades' },
        (payload) => {
          onDataChange({ table: 'trades', eventType: payload.eventType, new: payload.new, old: payload.old });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_settings' },
        (payload) => {
          onDataChange({ table: 'user_settings', eventType: payload.eventType, new: payload.new, old: payload.old });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'balance_log' },
        (payload) => {
          onDataChange({ table: 'balance_log', eventType: payload.eventType, new: payload.new, old: payload.old });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('⚡ Realtime sync active across devices');
        }
      });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    };
  },
};
