import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { APP_CONFIG } from '../config/appConfig';

// ─── Saheli Standalone AI Chat Service ────────────────────────────────────────
// Communicates with the local dev server proxy / Supabase Edge Function `saheli-chat`.
// Never exposes API keys on the client.
// ─────────────────────────────────────────────────────────────────────────────

export interface ChatMessageItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface SendMessageOptions {
  message: string;
  conversationHistory?: ChatMessageItem[];
  isDemoMode?: boolean;
}

export interface ChatServiceResponse {
  reply: string;
  success: boolean;
  isFallback?: boolean;
  error?: string;
}

// Curated general fallback responses when network/Gemini is offline
const DEMO_RESPONSES = [
  "I'm Saheli, your personal safety and assistance companion. I'm here to provide calm advice, safety tips, and guidance whenever you need it.",
  "Trust your instincts. If a situation or place ever feels uncomfortable, prioritize creating distance and moving toward well-lit, populated spaces.",
  "Staying alert and keeping in regular touch with a trusted friend or family member is one of the most effective safety habits.",
  "If you ever find yourself in an unfamiliar area, stay on main active roads and know where nearby open stores or public stations are located.",
];
let demoIndex = 0;

/**
 * Sends a message to the AI Assistant with automatic fallback & retry support
 */
export async function sendMessage(options: SendMessageOptions): Promise<ChatServiceResponse> {
  const { message, conversationHistory = [], isDemoMode = false } = options;
  const trimmed = message.trim();

  if (!trimmed) {
    return { reply: '', success: false, error: 'Message cannot be empty.' };
  }

  const payload = {
    message: trimmed,
    conversationHistory: conversationHistory.slice(-10),
  };

  // If explicitly in demo mode, use deterministic grounded fallback
  if (isDemoMode) {
    const fallbackReply = generateFallbackReply(trimmed);
    return {
      reply: fallbackReply,
      success: true,
      isFallback: true,
    };
  }

  // 1. Try local dev server API endpoint (real Gemini proxy in development)
  try {
    const devResponse = await fetch('/api/saheli-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (devResponse.ok) {
      const devData = await devResponse.json();
      if (devData?.reply) {
        return { reply: devData.reply, success: true };
      }
    }
  } catch (_devErr) {
    // Dev server API not available or in production bundle
  }

  // 2. If Supabase is configured, invoke the Edge Function
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.functions.invoke('saheli-chat', {
        body: payload,
      });

      if (!error && data?.reply) {
        return { reply: data.reply, success: true };
      }
      if (error) {
        console.warn('Supabase Edge Function saheli-chat error:', error);
      }
    } catch (invokeErr) {
      console.warn('Exception invoking saheli-chat via Supabase SDK:', invokeErr);
    }
  }

  // 3. Direct fetch fallback to Edge Function endpoint if available
  try {
    const supabaseUrl = APP_CONFIG.supabaseUrl;
    const anonKey = APP_CONFIG.supabaseAnonKey;
    const edgeUrl = supabaseUrl 
      ? `${supabaseUrl}/functions/v1/saheli-chat` 
      : APP_CONFIG.saheliEdgeFunctionUrl;

    if (edgeUrl) {
      const response = await fetch(edgeUrl, {
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
          return { reply: data.reply, success: true };
        }
      } else {
        const errData = await response.json().catch(() => null);
        if (errData?.reply) {
          return { reply: errData.reply, success: true, isFallback: true };
        }
      }
    }
  } catch (fetchErr) {
    console.warn('Direct HTTP fetch to saheli-chat failed:', fetchErr);
  }

  // 4. Graceful Deterministic Fallback Response
  const fallbackReply = generateFallbackReply(trimmed);
  return {
    reply: fallbackReply,
    success: true,
    isFallback: true,
  };
}

/**
 * Generates an accurate, standalone fallback response when Gemini API is offline
 */
export function generateFallbackReply(message: string): string {
  const msg = message.toLowerCase().trim();

  // 0. Greetings
  if (/^(hi|hello|hey|namaste|good morning|good evening|good afternoon|howdy|sup)($|\s|[!?.])/i.test(msg)) {
    return "Hi there! I'm **Saheli**, your personal AI safety & assistance companion 🛡️\n\nHow can I help you today? You can ask me for safety advice, de-escalation tips, emergency guidance, or everyday personal assistance.";
  }

  // 1. Immediate danger / emergency queries
  if (/\b(help|emergency|danger|unsafe|scared|follow|follows|followed|following|threat|stalk|stalking|attack|attacked|chased|chasing)\b/i.test(msg)) {
    return "🚨 **If you are in immediate danger, please call emergency services right away (112 / 911) or trigger the in-app Emergency SOS button.**\n\n1. Move immediately toward a crowded, well-lit public space (such as an open store, hotel lobby, or petrol station).\n2. Alert someone nearby or call a trusted friend.\n3. Keep your phone accessible and do not isolate yourself.";
  }

  // 2. De-escalation & uncomfortable situations
  if (/\b(de-escalat|confront|harass|uncomfortable|stranger|bothering)\b/i.test(msg)) {
    return "If dealing with an uncomfortable confrontation:\n\n1. **Create physical distance** — step back and avoid letting anyone corner you.\n2. **Use a calm, firm voice** — set clear boundaries without being aggressive.\n3. **Do not engage in prolonged arguments** — look for an exit route toward other people.\n4. Enter the nearest open business and ask staff for assistance if someone refuses to leave you alone.";
  }

  // 3. Night travel safety
  if (/\b(night|dark|evening|midnight|late)\b/i.test(msg)) {
    return "When traveling alone at night:\n\n1. **Stay on well-lit main thoroughfares** with active foot traffic and commercial presence.\n2. **Share your real-time location** with a trusted contact before starting your journey.\n3. **Stay alert** — avoid wearing noise-canceling headphones or looking down at your phone continuously.\n4. Walk with purpose and keep your keys/emergency contact ready.";
  }

  // 4. Self-defense & physical protection
  if (/\b(defense|technique|wrist|escape|choke|grab|physical)\b/i.test(msg)) {
    return "Core principles of personal physical safety:\n\n1. **Primary Goal:** Your objective is always to break free and escape to safety, never to stay and fight.\n2. **Target Vulnerable Areas:** If forced to defend yourself, aim for eyes, nose, throat, or groin to create a quick escape window.\n3. **Use Your Voice:** Shout loudly ('Back off!' or 'Help!') to attract immediate public attention and disorient the aggressor.\n4. **Run immediately** to a safe, populated area once you create space.";
  }

  // 5. General support
  const selected = DEMO_RESPONSES[demoIndex % DEMO_RESPONSES.length];
  demoIndex++;
  return selected;
}
