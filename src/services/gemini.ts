import { APP_CONFIG } from '../config/appConfig';

// ─── Gemini Chat Service ──────────────────────────────────────────────────────
// Calls the Supabase Edge Function which proxies to Google Gemini.
// Falls back to a static demo response when edge function is unavailable.
// ─────────────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface GeminiChatRequest {
  messages: ChatMessage[];
  systemPrompt?: string;
  contextData?: Record<string, unknown>;
}

// Demo fallback responses
const DEMO_RESPONSES = [
  "I'm Saheli, your safety companion. I'm here to help you stay safe during your journey. Your current journey confidence score is high — everything looks good! 🟢",
  "I notice you're asking about your journey status. Based on your current route and position, everything is within normal parameters. Keep going safely!",
  "For self-defence resources, I recommend checking the **Learn** section — we have curated videos on situational awareness, de-escalation, and physical techniques.",
  "Your trusted contacts are ready. Priya, Arjun, and Sneha will be notified immediately if a safety incident is detected.",
  "The safest approach is always to trust your instincts. If something feels wrong, you can trigger a manual check-in or share your location directly from the Journey screen.",
];

let demoResponseIndex = 0;

export async function sendChatMessage(request: GeminiChatRequest): Promise<string> {
  // Try the Edge Function first
  try {
    const response = await fetch(APP_CONFIG.geminiEdgeFunctionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (response.ok) {
      const data = await response.json();
      return data.reply as string;
    }
  } catch {
    // Fall through to demo mode
  }

  // Demo fallback: rotate through canned responses
  await new Promise(r => setTimeout(r, 1000 + Math.random() * 500)); // fake latency
  const reply = DEMO_RESPONSES[demoResponseIndex % DEMO_RESPONSES.length];
  demoResponseIndex++;
  return reply;
}

// System prompt for Saheli companion
export const SAHELI_SYSTEM_PROMPT = `
You are Saheli, a warm, calm, and trustworthy AI safety companion for women.
Your primary roles:
1. Explain the user's current journey safety status and route recommendations in simple, reassuring language.
2. Recommend relevant self-defence and safety learning resources when appropriate.
3. Guide users through emergency procedures calmly.
4. NEVER calculate safety scores or override the deterministic risk engine. The provided Route Safety Score is the source of truth.
5. NEVER claim a road is "dangerous". Use precise wording like "This route has more limited safety-supporting coverage."
6. Be concise, empathetic, and action-oriented.
7. Respond in English unless the user writes in another language.
`.trim();
