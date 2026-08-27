import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const checkinService = {
  async triggerCheckin(journeyId: string) {
    if (!isSupabaseConfigured()) return { data: { id: 'demo-checkin', journey_id: journeyId }, error: null };
    return supabase.from('safety_checkins').insert({ journey_id: journeyId }).select().single();
  },

  async respondToCheckin(id: string, responseStatus: 'SAFE' | 'HELP_NEEDED') {
    if (!isSupabaseConfigured()) return { data: null, error: null };
    return supabase.from('safety_checkins').update({
      status: responseStatus,
      responded_at: new Date().toISOString()
    }).eq('id', id);
  },

  async getPendingCheckin(journeyId: string) {
    if (!isSupabaseConfigured()) return { data: null, error: null };
    return supabase.from('safety_checkins')
      .select('*')
      .eq('journey_id', journeyId)
      .eq('status', 'PENDING')
      .single();
  }
};
