// Saheli AI — Emergency SOS Dispatch Edge Function
// Dispatches real SOS notifications via Twilio Programmable Messaging API.
// Strictly authenticates caller, verifies incident ownership, and fetches recipients server-side.
// Never exposes provider API keys or service role secrets to the frontend.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SendSOSPayload {
  incidentId: string;
  force?: boolean;
}

interface DeliveryResult {
  contactId: string;
  name: string;
  maskedPhone: string;
  relationship: string;
  status: 'SENT' | 'SIMULATED' | 'FAILED' | 'INVALID_PHONE' | 'PROVIDER_NOT_CONFIGURED';
  deliveredAt: string;
  error?: string;
  twilioSid?: string;
}

function maskPhone(phone: string): string {
  const clean = phone.replace(/[^\d+]/g, '');
  if (clean.length <= 4) return '••••';
  const prefix = clean.startsWith('+') ? clean.slice(0, 3) : clean.slice(0, 2);
  const suffix = clean.slice(-3);
  return `${prefix} ••••• ••${suffix}`;
}

// Normalize phone to E.164 format (e.g. +919876543210)
function normalizePhoneToE164(phone: string): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  const digitsOnly = trimmed.replace(/[^\d]/g, '');

  if (trimmed.startsWith('+')) {
    if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
      return `+${digitsOnly}`;
    }
  }

  // If 10 digits without country code, default to India (+91)
  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`;
  }

  // If 12 digits starting with 91
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return `+${digitsOnly}`;
  }

  if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
    return `+${digitsOnly}`;
  }

  return null;
}

Deno.serve(async (req: Request) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || supabaseAnonKey;

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase environment is not configured in Edge Runtime.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Authenticate the caller with their JWT
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid user session token.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Parse minimal payload: ONLY incidentId and optional force flag
    const body: SendSOSPayload = await req.json();
    const { incidentId, force = false } = body;

    if (!incidentId || typeof incidentId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'incidentId is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Verify incident ownership and retrieve incident details securely on the server
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: incident, error: incidentError } = await adminClient
      .from('incidents')
      .select('*')
      .eq('id', incidentId)
      .single();

    if (incidentError || !incident) {
      return new Response(
        JSON.stringify({ error: 'Incident not found or inaccessible.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (incident.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: You do not own this incident.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Duplicate SOS Protection: Prevent spamming / repeated triggers within 60s cooldown unless force is set
    const lastNotifiedAt = incident.updated_at ? new Date(incident.updated_at).getTime() : 0;
    const now = Date.now();
    const isWithinCooldown = incident.trusted_contacts_notified && (now - lastNotifiedAt < 60000);

    if (isWithinCooldown && !force) {
      return new Response(
        JSON.stringify({
          success: true,
          incidentId,
          duplicatePrevented: true,
          message: incident.sos_message || 'SOS already active for this incident.',
          deliveryStatus: incident.delivery_status || 'SENT',
          results: incident.contacts_notified || [],
          cooldownRemainingSeconds: Math.max(0, Math.ceil((60000 - (now - lastNotifiedAt)) / 1000)),
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Retrieve User Name securely
    let userName = user.user_metadata?.name || user.user_metadata?.full_name;
    if (!userName) {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();
      userName = profile?.name;
    }
    if (!userName) {
      userName = user.email ? user.email.split('@')[0] : 'User';
    }

    // 7. Format Location Link according to exact specification:
    // "SAHELI SOS: [Name] may need assistance. Latest location: [map link]. Incident: [ID]."
    // If no location available -> "Location unavailable." (Do not invent coordinates)
    let locationText = 'Location unavailable.';
    const lat = incident.latitude;
    const lng = incident.longitude;

    if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      locationText = `https://maps.google.com/?q=${lat},${lng}`;
    }

    const sosMessage = `SAHELI SOS: ${userName} may need assistance. Latest location: ${locationText}. Incident: ${incidentId}.`;

    // 8. Retrieve User's Enabled Emergency Contacts with Explicit Consent
    const { data: contacts, error: contactsError } = await adminClient
      .from('trusted_contacts')
      .select('*')
      .eq('user_id', user.id)
      .eq('enabled', true)
      .eq('consent_given', true);

    if (contactsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve trusted contacts.', details: contactsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const activeContacts = contacts || [];
    const results: DeliveryResult[] = [];

    // 9. Read Twilio Credentials from Server-Side Secrets
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken  = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioFromNumber = Deno.env.get('TWILIO_FROM_NUMBER');

    const isTwilioConfigured = !!(twilioAccountSid && twilioAuthToken && twilioFromNumber);

    for (const contact of activeContacts) {
      const masked = maskPhone(contact.phone);
      const e164Phone = normalizePhoneToE164(contact.phone);

      if (!e164Phone) {
        results.push({
          contactId: contact.id,
          name: contact.name,
          maskedPhone: masked,
          relationship: contact.relationship || 'Contact',
          status: 'INVALID_PHONE',
          deliveredAt: new Date().toISOString(),
          error: 'Phone number could not be formatted to E.164 standard',
        });
        continue;
      }

      if (isTwilioConfigured) {
        try {
          const authString = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;

          const twilioResponse = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              Authorization: `Basic ${authString}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: e164Phone,
              From: twilioFromNumber!,
              Body: sosMessage,
            }),
          });

          const resJson = await twilioResponse.json().catch(() => ({}));

          if (twilioResponse.ok && resJson.sid) {
            results.push({
              contactId: contact.id,
              name: contact.name,
              maskedPhone: masked,
              relationship: contact.relationship || 'Contact',
              status: 'SENT',
              deliveredAt: new Date().toISOString(),
              twilioSid: resJson.sid,
            });
          } else {
            results.push({
              contactId: contact.id,
              name: contact.name,
              maskedPhone: masked,
              relationship: contact.relationship || 'Contact',
              status: 'FAILED',
              deliveredAt: new Date().toISOString(),
              error: resJson.message || `Twilio dispatch failed with status ${twilioResponse.status}`,
            });
          }
        } catch (dispatchErr: any) {
          results.push({
            contactId: contact.id,
            name: contact.name,
            maskedPhone: masked,
            relationship: contact.relationship || 'Contact',
            status: 'FAILED',
            deliveredAt: new Date().toISOString(),
            error: dispatchErr.message || 'Network error during Twilio dispatch',
          });
        }
      } else {
        // Safe simulation when server secrets are not configured in dev/sandbox
        results.push({
          contactId: contact.id,
          name: contact.name,
          maskedPhone: masked,
          relationship: contact.relationship || 'Contact',
          status: 'PROVIDER_NOT_CONFIGURED',
          deliveredAt: new Date().toISOString(),
        });
      }
    }

    // 10. Compute Overall Delivery Summary & Update Incident
    const sentCount = results.filter(r => r.status === 'SENT').length;
    const failedCount = results.filter(r => r.status === 'FAILED' || r.status === 'INVALID_PHONE').length;
    const providerMissingCount = results.filter(r => r.status === 'PROVIDER_NOT_CONFIGURED').length;

    let deliverySummary: 'SENT' | 'PARTIAL' | 'FAILED' | 'SIMULATED' | 'NO_CONTACTS' = 'NO_CONTACTS';

    if (results.length === 0) {
      deliverySummary = 'NO_CONTACTS';
    } else if (sentCount === results.length) {
      deliverySummary = 'SENT';
    } else if (sentCount > 0) {
      deliverySummary = 'PARTIAL';
    } else if (providerMissingCount === results.length) {
      deliverySummary = 'SIMULATED';
    } else {
      deliverySummary = 'FAILED';
    }

    await adminClient
      .from('incidents')
      .update({
        trusted_contacts_notified: results.length > 0,
        sos_message: sosMessage,
        delivery_status: deliverySummary,
        contacts_notified: results,
        updated_at: new Date().toISOString(),
      })
      .eq('id', incidentId);

    // 11. Return Safe Delivery Response (Never expose provider credentials)
    return new Response(
      JSON.stringify({
        success: true,
        incidentId,
        message: sosMessage,
        deliveryStatus: deliverySummary,
        contactsCount: activeContacts.length,
        results,
        providerConfigured: isTwilioConfigured,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
