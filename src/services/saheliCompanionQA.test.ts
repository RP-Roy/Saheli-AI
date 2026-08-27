import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendMessage, generateFallbackReply } from './chatService';

describe('Saheli Standalone AI Companion QA Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Scenario 1: Greetings ──────────────────────────────────────────────────
  it('1. Greetings — returns warm, helpful standalone assistant welcome', async () => {
    const res = await sendMessage({
      message: 'hi',
      isDemoMode: true,
    });

    expect(res.success).toBe(true);
    expect(res.reply).toContain('Saheli');
    expect(res.reply).toMatch(/assistant|safety|help/i);
    expect(res.reply).not.toContain('Route Safety Score');
  });

  // ─── Scenario 2: General Safety Question ─────────────────────────────────────
  it('2. General safety question — provides concise, non-alarmist practical advice', async () => {
    const res = await sendMessage({
      message: 'What general safety tips do you recommend for daily commuting?',
      isDemoMode: true,
    });

    expect(res.success).toBe(true);
    expect(res.reply.length).toBeGreaterThan(20);
    expect(res.reply).not.toContain('GEMINI_API_KEY');
    expect(res.reply).not.toContain('AIzaSy');
  });

  // ─── Scenario 3: Night-Travel Question ───────────────────────────────────────
  it('3. Night-travel question — emphasizes lighting, sharing live status, and awareness', async () => {
    const res = await sendMessage({
      message: 'I have to travel alone at night. What precautions should I take?',
      isDemoMode: true,
    });

    expect(res.success).toBe(true);
    expect(res.reply.toLowerCase()).toMatch(/night|light|location|alert|keys/);
  });

  // ─── Scenario 4: De-escalation Question ──────────────────────────────────────
  it('4. De-escalation question — provides actionable boundary setting and exit strategies', async () => {
    const res = await sendMessage({
      message: 'How can I de-escalate an uncomfortable stranger confrontation?',
      isDemoMode: true,
    });

    expect(res.success).toBe(true);
    expect(res.reply).toMatch(/distance|calm|boundaries|exit|assistance/i);
  });

  // ─── Scenario 5: Self-Defense Principles ─────────────────────────────────────
  it('5. Self-defense principles — emphasizes escape and creating distance over fighting', async () => {
    const res = await sendMessage({
      message: 'What are the core physical self-defense principles?',
      isDemoMode: true,
    });

    expect(res.success).toBe(true);
    expect(res.reply).toMatch(/escape|break free|voice|run/i);
  });

  // ─── Scenario 6: Immediate-Danger Question ──────────────────────────────────
  it('6. Immediate-danger question — prioritizes 112 / 911 emergency services and in-app SOS', async () => {
    const res = await sendMessage({
      message: 'Help me, someone is following me and I feel in danger!',
      isDemoMode: true,
    });

    expect(res.success).toBe(true);
    expect(res.reply).toContain('Emergency SOS');
    expect(res.reply).toMatch(/112|911/);
  });

  // ─── Scenario 7: Missing Gemini API Key ─────────────────────────────────────
  it('7. Missing Gemini API key — handles HTTP 503 from server without exposing secret keys', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: 'GEMINI_API_KEY secret is not configured in Supabase Edge Function environment.',
          code: 'MISSING_API_KEY',
          reply: "I'm currently unable to connect to Gemini because the GEMINI_API_KEY secret is not set in the server environment.",
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const res = await sendMessage({
      message: 'How can I prepare for a solo cab ride?',
      isDemoMode: false,
    });

    expect(res.success).toBe(true);
    expect(res.reply).toContain('GEMINI_API_KEY');
    expect(res.reply).not.toContain('AIzaSy');
  });

  // ─── Scenario 8: Gemini API Failure ─────────────────────────────────────────
  it('8. Gemini API failure — handles HTTP 502 gracefully with safe fallback', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: 'Gemini API returned error (500)',
          reply: 'I am having difficulty reaching my safety intelligence service right now. If you feel unsafe, please tap the Emergency button or contact your trusted circle immediately.',
        }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const res = await sendMessage({
      message: 'What should I do if someone approaches me?',
      isDemoMode: false,
    });

    expect(res.success).toBe(true);
    expect(res.reply).toContain('safety intelligence service');
    expect(res.reply).toContain('Emergency');
  });

  // ─── Scenario 9: Supabase / Network Offline Fallback ────────────────────────
  it('9. Supabase function offline — falls back to standalone supportive advice', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch: Connection refused'));

    const res = await sendMessage({
      message: 'I am nervous walking back home in the dark.',
      isDemoMode: false,
    });

    expect(res.success).toBe(true);
    expect(res.isFallback).toBe(true);
    expect(res.reply.length).toBeGreaterThan(20);
  });
});
