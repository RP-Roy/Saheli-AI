import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendSaheliChat, type SaheliChatRequest } from './gemini';
import { APP_CONFIG } from '../config/appConfig';

describe('Saheli Chat & Edge Function Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Handles normal safety questions gracefully', async () => {
    const mockReply = "Hello! I am Saheli. Make sure to stay aware of your surroundings and keep your phone charged.";
    
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ reply: mockReply }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const request: SaheliChatRequest = {
      message: 'Hello, how can you help me stay safe today?',
      conversationHistory: [],
    };

    const reply = await sendSaheliChat(request);
    expect(reply).toBe(mockReply);
    expect(global.fetch).toHaveBeenCalled();
    
    // Verify request payload schema
    const callArgs = (global.fetch as any).mock.calls[0];
    const sentBody = JSON.parse(callArgs[1].body);
    expect(sentBody.message).toBe('Hello, how can you help me stay safe today?');
    expect(sentBody.conversationHistory).toEqual([]);
  });

  it('2. Grounded route questions send routeContext & journeyContext to Edge Function', async () => {
    const mockReply = "Your selected route has a Route Safety Score of 85/100 due to nearby police coverage and well-lit corridors.";

    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ reply: mockReply }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const request: SaheliChatRequest = {
      message: 'Why is this route recommended?',
      journeyContext: {
        isActive: true,
        origin: 'MG Road',
        destination: 'Indiranagar',
        etaMins: 18,
        routeSafetyScore: 85,
        riskLevel: 'SAFE',
        deviationDetected: false,
        safetyPoints: [
          { name: 'Indiranagar Police Station', category: 'POLICE', distanceMeters: 120 },
          { name: 'Apollo Pharmacy 24x7', category: 'PHARMACY', distanceMeters: 50 },
        ],
      },
      routeContext: {
        score: 85,
        level: 'HIGHER_SAFETY_COVERAGE',
        reasons: ['Strong police coverage nearby', 'Open 24/7 pharmacy on path'],
        strengths: ['Indiranagar Police Station is 120m away'],
      },
    };

    const reply = await sendSaheliChat(request);
    expect(reply).toBe(mockReply);

    const callArgs = (global.fetch as any).mock.calls[0];
    const sentBody = JSON.parse(callArgs[1].body);
    expect(sentBody.journeyContext.routeSafetyScore).toBe(85);
    expect(sentBody.journeyContext.safetyPoints.length).toBe(2);
    expect(sentBody.routeContext.reasons).toContain('Strong police coverage nearby');
  });

  it('3. Immediate emergency questions prioritize SOS controls and emergency contacts', async () => {
    // When Edge function responds with emergency directives
    const mockReply = "🚨 If you feel in immediate danger, please use the in-app Emergency SOS button or call emergency services (112) immediately.";

    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ reply: mockReply }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const request: SaheliChatRequest = {
      message: 'Someone is following me and I feel unsafe, what do I do?',
      journeyContext: {
        isActive: true,
        origin: 'Station',
        destination: 'Home',
        routeSafetyScore: 40,
        riskLevel: 'HIGH_RISK',
      },
    };

    const reply = await sendSaheliChat(request);
    expect(reply).toContain('Emergency SOS');

    // Also verify contextual fallback prioritizes emergency when network is offline
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));
    const fallbackReply = await sendSaheliChat(request);
    expect(fallbackReply).toContain('Emergency SOS');
    expect(fallbackReply).toContain('112');
  });

  it('4. Handles missing GEMINI_API_KEY server secret with structured error response', async () => {
    // Edge Function returns 503 MISSING_API_KEY
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: 'GEMINI_API_KEY secret is not configured in Supabase Edge Function environment.',
          code: 'MISSING_API_KEY',
          reply: "I'm currently unable to connect to Gemini because the GEMINI_API_KEY secret is not set in the server environment.",
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    const request: SaheliChatRequest = {
      message: 'What should I do if I am traveling alone at night?',
    };

    const reply = await sendSaheliChat(request);
    expect(reply).toContain('GEMINI_API_KEY');
  });

  it('5. Handles Gemini API errors / timeouts gracefully with safe fallback', async () => {
    // Edge function responds with 502 / 500 error from upstream Gemini
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: 'Gemini API returned error (500)',
          reply: 'I am having difficulty reaching my safety intelligence service right now. If you feel unsafe, please tap the Emergency button or contact your trusted circle immediately.',
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    const request: SaheliChatRequest = {
      message: 'Can you give me safety tips for public transport?',
    };

    const reply = await sendSaheliChat(request);
    expect(reply).toContain('safety intelligence service');

    // Also verify when server throws completely unparsed network error
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Internal Server Error'));
    const fallbackReply = await sendSaheliChat({
      message: 'Why did you recommend this route?',
      journeyContext: {
        routeSafetyScore: 78,
      },
    });
    expect(fallbackReply).toContain('Route Safety Score of 78/100');
  });
});
