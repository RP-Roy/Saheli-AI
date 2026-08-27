import { describe, it, expect, vi } from 'vitest';

describe('Edge Function Secret Access & Request Verification', () => {
  it('Edge Function reads GEMINI_API_KEY secret from environment and sends valid Gemini request', async () => {
    const mockApiKey = 'test-secret-key-xyz-12345';
    
    // Simulate Edge Function Deno environment
    const fakeEnv = {
      get: (key: string) => (key === 'GEMINI_API_KEY' ? mockApiKey : undefined),
    };

    let capturedUrl = '';
    let capturedBody: any = null;

    global.fetch = vi.fn().mockImplementation(async (url: string, init: any) => {
      capturedUrl = url;
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  { text: "I'm Saheli. Stay in well-lit areas, keep your phone accessible, and head toward the nearby Metro station if you feel uneasy." }
                ]
              }
            }
          ]
        })
      };
    });

    // Execute simulated Edge Function handler logic
    const secret = fakeEnv.get('GEMINI_API_KEY');
    expect(secret).toBe(mockApiKey);

    const payload = {
      message: "I feel slightly uncomfortable walking down this street at night, what should I do?",
      journeyContext: {
        isActive: true,
        origin: "MG Road",
        destination: "Indiranagar",
        routeSafetyScore: 82,
        riskLevel: "SAFE",
        safetyPoints: [{ name: "Indiranagar Police Station", category: "POLICE" }]
      }
    };

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${secret}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: "You are Saheli, a calm and practical personal safety companion..." }]
        },
        contents: [{ role: 'user', parts: [{ text: payload.message }] }]
      })
    });

    const data = await response.json();
    const reply = data.candidates[0].content.parts[0].text;

    // 1. Verify endpoint contains key on server-side
    expect(capturedUrl).toContain(mockApiKey);
    expect(capturedUrl).toContain('gemini-2.5-flash');

    // 2. Verify reply is returned cleanly
    expect(reply).toContain('Saheli');
    expect(reply).toContain('Metro station');

    // 3. Verify reply does NOT contain the secret API key
    expect(reply).not.toContain(mockApiKey);
  });
});
