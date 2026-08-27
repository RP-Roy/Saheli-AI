import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface IncidentData {
  id?: string;
  journey_id?: string | null;
  user_id: string;
  risk_level: string;
  latitude?: number;
  longitude?: number;
  location_name?: string;
  sos_message?: string;
  delivery_status?: string;
  contacts_notified?: any[];
  response_status?: 'OPEN' | 'RESOLVED' | 'FALSE_ALARM';
  trusted_contacts_notified?: boolean;
  triggered_at?: string;
  resolved_at?: string | null;
}

export interface SOSDispatchResult {
  success: boolean;
  incidentId: string;
  message: string;
  deliveryStatus: 'SENT' | 'SIMULATED' | 'PARTIAL' | 'FAILED' | 'NO_CONTACTS';
  contactsCount: number;
  duplicatePrevented?: boolean;
  cooldownRemainingSeconds?: number;
  results: Array<{
    contactId: string;
    name: string;
    maskedPhone: string;
    relationship: string;
    status: 'SENT' | 'SIMULATED' | 'FAILED' | 'INVALID_PHONE' | 'PROVIDER_NOT_CONFIGURED';
    deliveredAt: string;
    error?: string;
    twilioSid?: string;
  }>;
  providerConfigured?: boolean;
  error?: string;
}

export const incidentService = {
  async triggerIncident(data: IncidentData): Promise<{ data: IncidentData | null; error: any }> {
    const payload = {
      ...data,
      journey_id: data.journey_id || null,
      response_status: 'OPEN' as const,
      trusted_contacts_notified: false,
      delivery_status: 'PENDING',
      triggered_at: data.triggered_at || new Date().toISOString(),
    };

    if (!isSupabaseConfigured() || data.user_id === 'demo-user') {
      const demoIncident: IncidentData = {
        ...payload,
        id: `inc-${Date.now()}`,
      };
      return { data: demoIncident, error: null };
    }

    try {
      const { data: inserted, error } = await supabase
        .from('incidents')
        .insert(payload)
        .select()
        .single();

      if (error) {
        // Fallback to local incident representation if DB fails
        return { data: { ...payload, id: `inc-fallback-${Date.now()}` }, error };
      }

      return { data: inserted as IncidentData, error: null };
    } catch (err: any) {
      return { data: { ...payload, id: `inc-fallback-${Date.now()}` }, error: err };
    }
  },

  async resolveIncident(id: string, resolution: 'RESOLVED' | 'FALSE_ALARM' = 'RESOLVED'): Promise<{ data: any; error: any }> {
    if (!isSupabaseConfigured()) {
      return { data: { id, response_status: resolution, resolved_at: new Date().toISOString() }, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('incidents')
        .update({
          response_status: resolution,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      return { data, error };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  async getActiveIncidents(userId: string): Promise<{ data: IncidentData[]; error: any }> {
    if (!isSupabaseConfigured() || userId === 'demo-user') {
      return { data: [], error: null };
    }

    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .eq('user_id', userId)
        .eq('response_status', 'OPEN')
        .order('triggered_at', { ascending: false });

      return { data: (data || []) as IncidentData[], error };
    } catch (err: any) {
      return { data: [], error: err };
    }
  },

  async sendSOSNotification(
    incidentId: string,
    options?: {
      force?: boolean;
      demoLocation?: { lat?: number; lng?: number; address?: string };
    }
  ): Promise<SOSDispatchResult> {
    // In Demo Mode or unconfigured backend, simulate realistic server response matching exact format
    if (!isSupabaseConfigured()) {
      const loc = options?.demoLocation;
      const mapLink = loc?.lat && loc?.lng ? `https://maps.google.com/?q=${loc.lat},${loc.lng}` : 'Location unavailable.';
      const formattedMessage = `SAHELI SOS: Demo User may need assistance. Latest location: ${mapLink}. Incident: ${incidentId}.`;

      return {
        success: true,
        incidentId,
        message: formattedMessage,
        deliveryStatus: 'SIMULATED',
        contactsCount: 3,
        results: [
          {
            contactId: 'c1',
            name: 'Priya Sharma',
            maskedPhone: '+91 ••••• ••210',
            relationship: 'Mother',
            status: 'SIMULATED',
            deliveredAt: new Date().toISOString(),
          },
          {
            contactId: 'c2',
            name: 'Arjun Mehta',
            maskedPhone: '+91 ••••• ••211',
            relationship: 'Brother',
            status: 'SIMULATED',
            deliveredAt: new Date().toISOString(),
          },
          {
            contactId: 'c3',
            name: 'Sneha Reddy',
            maskedPhone: '+91 ••••• ••109',
            relationship: 'Best Friend',
            status: 'SIMULATED',
            deliveredAt: new Date().toISOString(),
          },
        ],
        providerConfigured: false,
      };
    }

    try {
      // Secure invocation of Supabase Edge Function passing only incidentId (and optional force flag)
      const { data, error } = await supabase.functions.invoke('send-sos', {
        body: {
          incidentId,
          force: options?.force ?? false,
        },
      });

      if (error) {
        return {
          success: false,
          incidentId,
          message: 'Failed to dispatch SOS notification via server.',
          deliveryStatus: 'FAILED',
          contactsCount: 0,
          results: [],
          error: error.message || 'Edge function error',
        };
      }

      return data as SOSDispatchResult;
    } catch (err: any) {
      return {
        success: false,
        incidentId,
        message: 'Notification service encountered a network error.',
        deliveryStatus: 'FAILED',
        contactsCount: 0,
        results: [],
        error: err.message || 'Network error',
      };
    }
  }
};
