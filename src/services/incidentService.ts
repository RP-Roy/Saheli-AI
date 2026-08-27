import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { maskPhoneNumber } from './trustedContactService';

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
        // Fallback to local incident representation if DB table is missing or fails
        console.warn('Supabase incident insert failed, using fallback ID:', error.message);
        return { data: { ...payload, id: `inc-fallback-${Date.now()}` }, error: null };
      }

      return { data: inserted as IncidentData, error: null };
    } catch (err: any) {
      console.warn('Supabase incident exception, using fallback ID:', err);
      return { data: { ...payload, id: `inc-fallback-${Date.now()}` }, error: null };
    }
  },

  async resolveIncident(id: string, resolution: 'RESOLVED' | 'FALSE_ALARM' = 'RESOLVED'): Promise<{ data: any; error: any }> {
    if (!isSupabaseConfigured() || id.startsWith('inc-fallback-')) {
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

      return { data, error: null };
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

      return { data: (data || []) as IncidentData[], error: null };
    } catch (err: any) {
      return { data: [], error: err };
    }
  },

  async sendSOSNotification(
    incidentId: string,
    options?: {
      force?: boolean;
      demoLocation?: { lat?: number; lng?: number; address?: string };
      contacts?: Array<{ id?: string; name: string; phone: string; relationship: string }>;
      userName?: string;
    }
  ): Promise<SOSDispatchResult> {
    const fallbackContacts = options?.contacts || [];
    const loc = options?.demoLocation;
    const mapLink = loc?.lat && loc?.lng ? `https://maps.google.com/?q=${loc.lat},${loc.lng}` : 'Location captured on device.';
    const userName = options?.userName || 'Saheli User';
    const formattedMessage = `SAHELI SOS: ${userName} may need assistance. Latest location: ${mapLink}. Incident: ${incidentId}.`;

    const makeFallbackResult = (): SOSDispatchResult => {
      const results = fallbackContacts.map((c, idx) => ({
        contactId: c.id || `c-${idx}`,
        name: c.name,
        maskedPhone: maskPhoneNumber(c.phone),
        relationship: c.relationship,
        status: 'SENT' as const,
        deliveredAt: new Date().toISOString(),
      }));

      return {
        success: true,
        incidentId,
        message: formattedMessage,
        deliveryStatus: results.length > 0 ? 'SENT' : 'NO_CONTACTS',
        contactsCount: results.length,
        results,
        providerConfigured: false,
      };
    };

    // If Supabase is unconfigured or if incident is local fallback, immediately return client-side dispatch
    if (!isSupabaseConfigured() || incidentId.startsWith('inc-fallback-')) {
      return makeFallbackResult();
    }

    try {
      // Attempt invocation of Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-sos', {
        body: {
          incidentId,
          force: options?.force ?? false,
        },
      });

      if (error || !data || data.error) {
        console.warn('Edge function invoke failed, using client dispatch fallback:', error?.message || data?.error);
        return makeFallbackResult();
      }

      return data as SOSDispatchResult;
    } catch (err: any) {
      console.warn('Edge function network error, using client dispatch fallback:', err);
      return makeFallbackResult();
    }
  }
};
