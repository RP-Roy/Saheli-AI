import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendMessage, generateFallbackReply } from './chatService';

describe('Saheli chatService — Standalone AI Assistant', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Tests normal chat with standalone message payload', async () => {
    const mockReply = "Hello! I am Saheli AI, your standalone safety and assistance companion.";
    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ reply: mockReply }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await sendMessage({
      message: 'Hello, what assistance can you provide?',
      conversationHistory: [],
      isDemoMode: false,
    });

    expect(result.success).toBe(true);
    expect(result.reply).toBe(mockReply);

    const callArgs = (global.fetch as any).mock.calls[0];
    const sentBody = JSON.parse(callArgs[1].body);
    expect(sentBody.message).toBe('Hello, what assistance can you provide?');
    expect(sentBody.conversationHistory).toEqual([]);
  });

  it('2. Tests multi-turn conversation history forwarding', async () => {
    const mockReply = "Based on our conversation, make sure you stay in well-lit areas.";
    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ reply: mockReply }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await sendMessage({
      message: 'What was the first step again?',
      conversationHistory: [
        { role: 'user', content: 'How do I handle an uncomfortable situation?' },
        { role: 'assistant', content: 'First, create physical distance and remain calm.' },
      ],
      isDemoMode: false,
    });

    expect(result.success).toBe(true);
    expect(result.reply).toBe(mockReply);

    const callArgs = (global.fetch as any).mock.calls[0];
    const sentBody = JSON.parse(callArgs[1].body);
    expect(sentBody.conversationHistory.length).toBe(2);
  });

  it('3. Tests API error & graceful fallback handling', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await sendMessage({
      message: 'What should I do if someone follows me?',
      isDemoMode: false,
    });

    expect(result.success).toBe(true);
    expect(result.isFallback).toBe(true);
    expect(result.reply).toContain('Emergency SOS');
  });

  it('4. Tests retry mechanism', async () => {
    // First attempt fails
    global.fetch = vi.fn().mockRejectedValue(new Error('Network disconnected'));

    const firstAttempt = await sendMessage({
      message: 'How do I stay safe at night?',
      isDemoMode: false,
    });
    expect(firstAttempt.isFallback).toBe(true);

    // Second attempt (retry) succeeds with live response
    const mockReply = "When traveling at night, always stay on main roads and keep trusted contacts informed.";
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ reply: mockReply }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const retryAttempt = await sendMessage({
      message: 'How do I stay safe at night?',
      isDemoMode: false,
    });
    expect(retryAttempt.success).toBe(true);
    expect(retryAttempt.reply).toBe(mockReply);
    expect(retryAttempt.isFallback).toBeFalsy();
  });

  it('5. Tests Demo Mode returns standalone deterministic responses without calling network', async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    const result = await sendMessage({
      message: 'Hello Saheli',
      isDemoMode: true,
    });

    expect(result.success).toBe(true);
    expect(result.isFallback).toBe(true);
    expect(result.reply).toContain('Saheli');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
