import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface JourneyEventData {
  journey_id: string;
  event_type: string;
  description: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  latitude?: number;
  longitude?: number;
  score_change?: number;
}

export const eventService = {
  async logEvent(data: JourneyEventData) {
    if (!isSupabaseConfigured()) return { data: { ...data, id: 'demo-event-id' }, error: null };
    return supabase.from('journey_events').insert(data).select().single();
  },

  async getEventsForJourney(journeyId: string) {
    if (!isSupabaseConfigured()) return { data: [], error: null };
    return supabase.from('journey_events')
      .select('*')
      .eq('journey_id', journeyId)
      .order('created_at', { ascending: false });
  }
};
