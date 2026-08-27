import { APP_CONFIG } from '../config/appConfig';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

// ─── Saheli Gemini Chat Service ───────────────────────────────────────────────
// Calls the Supabase Edge Function `saheli-chat` (Server-Side Gemini API call).
// Never exposes GEMINI_API_KEY on the client.
// ─────────────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface SaheliChatRequest {
  message: string;
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

// Legacy format adapter
export interface GeminiChatRequest {
  messages: ChatMessage[];
  systemPrompt?: string;
  contextData?: Record<string, unknown>;
  routeContext?: SaheliChatRequest['routeContext'];
  relevantResources?: SaheliChatRequest['relevantResources'];
}

/**
 * Sends a message to the Saheli Gemini AI companion via Supabase Edge Function `saheli-chat`.
 */
export async function sendSaheliChat(request: SaheliChatRequest): Promise<string> {
  const payload = {
    message: request.message,
    conversationHistory: request.conversationHistory || [],
    journeyContext: request.journeyContext,
    routeContext: request.routeContext,
    relevantResources: request.relevantResources || [],
  };

  // 1. Try invoking through the official Supabase SDK if configured
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.functions.invoke('saheli-chat', {
        body: payload,
      });

      if (!error && data?.reply) {
        return data.reply;
      }
      if (error) {
        console.warn('Supabase edge function invoke returned error:', error);
      }
    } catch (invokeErr) {
      console.warn('Error invoking Supabase saheli-chat function via SDK:', invokeErr);
    }
  }

  // 2. Direct fetch attempt to the Edge Function endpoint
  try {
    const supabaseUrl = APP_CONFIG.supabaseUrl;
    const anonKey = APP_CONFIG.supabaseAnonKey;
    const edgeEndpoint = supabaseUrl 
      ? `${supabaseUrl}/functions/v1/saheli-chat` 
      : APP_CONFIG.saheliEdgeFunctionUrl;

    const response = await fetch(edgeEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(anonKey ? { 'Authorization': `Bearer ${anonKey}`, 'apikey': anonKey } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.reply) {
        return data.reply;
      }
    } else {
      const errData = await response.json().catch(() => null);
      if (errData?.reply) {
        return errData.reply;
      }
    }
  } catch (fetchErr) {
    console.warn('Direct fetch to saheli-chat edge function failed:', fetchErr);
  }

  // 3. Context-aware fallback response if Edge Function / Gemini API is unreachable
  return getContextualFallback(request);
}

/**
 * Backwards compatibility adapter for legacy callers
 */
export async function sendChatMessage(request: GeminiChatRequest): Promise<string> {
  const lastUserMessage = [...request.messages].reverse().find(m => m.role === 'user')?.content || '';
  const history = request.messages
    .filter(m => m.content !== lastUserMessage)
    .map(m => ({ role: m.role, content: m.content }));

  return sendSaheliChat({
    message: lastUserMessage,
    conversationHistory: history,
    journeyContext: request.contextData as any,
    routeContext: request.routeContext,
    relevantResources: request.relevantResources,
  });
}

function getContextualFallback(request: SaheliChatRequest): string {
  const msg = request.message.toLowerCase();

  if (/help|emergency|danger|unsafe|scared|followed|threat/i.test(msg)) {
    return "🚨 **If you feel in immediate danger, please use the Emergency SOS button right away or contact local emergency services (112 / 911).** Stay in populated, well-lit areas and share your live location with your trusted contacts.";
  }

  if (/route|score|why|recommend/i.test(msg)) {
    const score = request.journeyContext?.routeSafetyScore ?? request.routeContext?.score;
    if (score !== undefined) {
      return `Saheli evaluated your route with a **Route Safety Score of ${score}/100**. This score reflects verified lighting conditions, safe-haven access (such as open pharmacies and police stations), and lower historical risk factors along the corridor.`;
    }
    return "Saheli recommends routes based on multi-factor predictive safety analysis—including verified safe havens, active street lighting, and crowd density along the path.";
  }

  if (/learn|video|defense|technique/i.test(msg)) {
    return "You can explore practical self-defense techniques in the **Learn** tab, featuring verified guides on situational awareness, wrist-grab escapes, de-escalation, and night travel safety.";
  }

  return "I'm Saheli, your safety companion. I'm monitoring your commute to ensure you have proactive guidance and quick access to emergency tools whenever you need them.";
}

export const SAHELI_SYSTEM_PROMPT = `
You are Saheli, a calm and practical personal safety companion.
Your responsibilities:
- provide practical safety guidance
- prioritize avoiding confrontation
- prioritize moving toward public or safer locations
- explain Saheli's route recommendations and Route Safety Scores
- recommend relevant self-defense resources
- explain journey status
- guide users toward the Emergency feature when appropriate
`.trim();
