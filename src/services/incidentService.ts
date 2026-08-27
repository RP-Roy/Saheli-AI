import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface IncidentData {
  journey_id: string;
  user_id: string;
  risk_level: string;
  latitude?: number;
  longitude?: number;
}

export const incidentService = {
  async triggerIncident(data: IncidentData) {
    if (!isSupabaseConfigured()) return { data: { ...data, id: 'demo-incident' }, error: null };
    return supabase.from('incidents').insert(data).select().single();
  },

  async resolveIncident(id: string, resolution: 'RESOLVED' | 'FALSE_ALARM') {
    if (!isSupabaseConfigured()) return { data: null, error: null };
    return supabase.from('incidents').update({
      response_status: resolution,
      resolved_at: new Date().toISOString()
    }).eq('id', id);
  },

  async getActiveIncidents(userId: string) {
    if (!isSupabaseConfigured()) return { data: [], error: null };
    return supabase.from('incidents')
      .select('*')
      .eq('user_id', userId)
      .eq('response_status', 'OPEN');
  }
};
