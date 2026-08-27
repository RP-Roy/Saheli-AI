import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { RiskLevel } from '../config/appConfig';

export interface JourneyData {
  id?: string;
  user_id: string;
  start_lat: number;
  start_lng: number;
  destination_name: string;
  destination_lat: number;
  destination_lng: number;
  expected_duration_minutes: number;
  start_time?: string;
  current_lat?: number;
  current_lng?: number;
  confidence_score?: number; // Legacy
  route_type?: import('../config/demoConfig').RouteType;
  route_safety_score?: number;
  risk_level?: RiskLevel;
  status?: string;
}

export const journeyService = {
  async createJourney(data: JourneyData) {
    if (!isSupabaseConfigured()) {
      return { data: { ...data, id: 'demo-journey-id', created_at: new Date().toISOString() }, error: null };
    }
    return supabase.from('journeys').insert(data).select().single();
  },

  async updatePosition(id: string, lat: number, lng: number, score: number, riskLevel: RiskLevel) {
    if (!isSupabaseConfigured()) return { data: null, error: null };
    return supabase.from('journeys').update({
      current_lat: lat,
      current_lng: lng,
      route_safety_score: score,
      risk_level: riskLevel
    }).eq('id', id);
  },

  async endJourney(id: string) {
    if (!isSupabaseConfigured()) return { data: null, error: null };
    return supabase.from('journeys').update({
      status: 'COMPLETED',
      completed_at: new Date().toISOString()
    }).eq('id', id);
  },

  async getActiveJourney(userId: string) {
    if (!isSupabaseConfigured()) return { data: null, error: null };
    return supabase.from('journeys')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
  },

  subscribeToJourney(journeyId: string, callback: (payload: any) => void) {
    if (!isSupabaseConfigured()) {
      return { unsubscribe: () => {} };
    }
    
    const channel = supabase
      .channel(`journey_${journeyId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'journeys', filter: `id=eq.${journeyId}` },
        callback
      )
      .subscribe();

    return channel;
  }
};
