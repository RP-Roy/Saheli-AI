// Saheli AI — Saheli Companion Chat Edge Function
// Proxies conversational requests securely to Google Gemini API (Server-Side)
// Deployed on Supabase Edge Functions — GEMINI_API_KEY is stored strictly in Edge Function secrets.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Types for strictly allowed input
interface IncomingChatPayload {
  message?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  journeyContext?: {
    isActive?: boolean;
    origin?: string;
    destination?: string;
    etaMins?: number;
    routeSafetyScore?: number;
    riskLevel?: string;
    deviationDetected?: boolean;
    safetyPoints?: Array<{ name: string; type?: string; category?: string; distanceMeters?: number }>;
  };
  routeContext?: {
    originLabel?: string;
    destinationLabel?: string;
    score?: number;
    level?: string;
    reasons?: string[];
    strengths?: string[];
    weaknesses?: string[];
    nearbyPlaces?: Array<{ name: string; type: string; distanceMeters?: number }>;
    maxStretchWithoutPlacesMeters?: number;
    detourRatio?: number;
  };
  relevantResources?: Array<{
    id: string;
    title: string;
    category: string;
    description?: string;
    duration?: string;
  }>;
}

// ─── Base System Instructions for Saheli Standalone AI Companion ──────────────
const SAHELI_SYSTEM_INSTRUCTION = `
You are Saheli, an empathetic, calm, and practical AI personal safety and assistance companion for women and solo travelers.

Your core mission:
- Provide practical, reassuring, and immediate assistance for safety, travel, emotional reassurance, de-escalation, and everyday personal guidance.
- Prioritize avoiding confrontation, establishing clear boundaries, and moving toward well-lit, populated public spaces.
- For emergency situations or immediate danger, always emphasize contacting local emergency services (112 / 911) and reaching out to trusted contacts.
- Provide direct, thoughtful, and helpful answers on general safety, commuting precautions, personal protection, and de-escalation strategies.
- Tone: Empathetic, calm, clear, and actionable. Keep responses concise and easy to read on mobile devices.
`.trim();

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
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
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '') {
      return new Response(
        JSON.stringify({
          error: 'GEMINI_API_KEY secret is not configured in Supabase Edge Function environment.',
          code: 'MISSING_API_KEY',
          reply: "I'm currently unable to connect to Gemini because the GEMINI_API_KEY secret is not set in the server environment."
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: IncomingChatPayload = await req.json();
    const userMessage = body.message?.trim();

    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: 'Message is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fullSystemInstruction = SAHELI_SYSTEM_INSTRUCTION;

    // ─── Format Multi-Turn Conversation Contents for Gemini ───────────────────
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(body.conversationHistory)) {
      for (const historyItem of body.conversationHistory.slice(-10)) { // keep last 10 turns
        if (historyItem.content && (historyItem.role === 'user' || historyItem.role === 'assistant')) {
          contents.push({
            role: historyItem.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: historyItem.content }]
          });
        }
      }
    }

    // Append the latest user message
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    // ─── Call Google Gemini API ───────────────────────────────────────────────
    // Using current fast model gemini-3.6-flash
    const GEMINI_MODEL = 'gemini-3.6-flash';
    const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const geminiPayload = {
      systemInstruction: {
        parts: [{ text: fullSystemInstruction }]
      },
      contents,
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 600,
        topP: 0.9,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    };

    const geminiResponse = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error(`Gemini API responded with status ${geminiResponse.status}:`, errorText);
      return new Response(
        JSON.stringify({
          error: `Gemini API returned error (${geminiResponse.status})`,
          details: errorText,
          reply: "I am having difficulty reaching my safety intelligence service right now. If you feel unsafe, please tap the Emergency button or contact your trusted circle immediately."
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    const replyText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!replyText) {
      return new Response(
        JSON.stringify({
          reply: "I understand your question. Please ensure you stay aware of your surroundings and reach out to your trusted contacts or use Emergency SOS if needed."
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ reply: replyText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('saheli-chat edge function exception:', err);
    return new Response(
      JSON.stringify({
        error: 'An internal error occurred processing your request.',
        details: err?.message || String(err),
        reply: "I encountered an error processing that message. Please try again or use the Emergency features if you need immediate assistance."
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
