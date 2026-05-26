// __tests__/gemini.fallback.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { aiAgentService } from '../services/aiAgent';

// Provide a minimal mock for localStorage used in getGeminiApiKey


describe('Gemini fallback handling', () => {
  const history: any[] = [];
  const userMessage = 'Teste fallback';

  beforeEach(() => {
    // Mock localStorage for the duration of each test
    (globalThis as any).localStorage = {
      getItem: vi.fn().mockReturnValue('FAKE_API_KEY'),
      setItem: vi.fn(),
    };
    // Reset fetch mock
    (globalThis as any).fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should use fallback model on quota exceeded error', async () => {
    (globalThis as any).fetch
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Quota exceeded' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'Resposta fallback quota' }] } }],
        }),
      });

    const result = await aiAgentService.sendMessage(history, userMessage);
    expect(result.text).toContain('Resposta fallback quota');
    expect(result.pendingAction).toBeNull();
  });

  it('should use fallback model on model not found error', async () => {
    (globalThis as any).fetch
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: { message: 'Model not found' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'Resposta fallback model' }] } }],
        }),
      });

    const result = await aiAgentService.sendMessage(history, userMessage);
    expect(result.text).toContain('Resposta fallback model');
    expect(result.pendingAction).toBeNull();
  });

  it('should use fallback model on temporary unavailable error', async () => {
    (globalThis as any).fetch
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ error: { message: 'Service temporarily unavailable' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'Resposta fallback temp' }] } }],
        }),
      });

    const result = await aiAgentService.sendMessage(history, userMessage);
    expect(result.text).toContain('Resposta fallback temp');
    expect(result.pendingAction).toBeNull();
  });
});
