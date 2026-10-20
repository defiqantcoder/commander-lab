import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getGeminiApiKey,
  setGeminiApiKey,
  clearGeminiApiKey,
  testGeminiApiKey,
  brainstormArchetypes,
  GEMINI_DEFAULT_MODEL
} from './gemini';

// Mock the @google/genai module
const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => {
      return {
        models: {
          generateContent: mockGenerateContent
        }
      };
    }),
    Type: {
      ARRAY: 'ARRAY',
      OBJECT: 'OBJECT',
      STRING: 'STRING'
    }
  };
});

describe('gemini engine', () => {
  describe('brainstormArchetypes', () => {
    it('returns offline suggestions when no API key is provided', async () => {
      process.env.GEMINI_API_KEY = '';
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('gemini_api_key');
      }
      const result = await brainstormArchetypes('Atraxa', ['W', 'U', 'B', 'G']);

      expect(result.length).toBe(3);
      expect(result[0].themeName).toBe('Atraxa Hidden Engine');
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('returns parsed response when API call is successful', async () => {
      process.env.GEMINI_API_KEY = 'fake-api-key';
      const mockSuggestions = [
        {
          themeName: 'Test Theme',
          tagline: 'Test Tagline',
          powerTier: 'Focused',
          primaryEngine: 'Test Engine',
          obscureInteraction: 'Test Interaction',
          keyWinCon: 'Test WinCon',
          sampleKeyCards: ['Card 1', 'Card 2']
        }
      ];
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockSuggestions) });

      const result = await brainstormArchetypes('Atraxa', ['W', 'U', 'B', 'G']);

      expect(result).toEqual(mockSuggestions);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: GEMINI_DEFAULT_MODEL
        })
      );
    });

    it('returns an empty array and logs error when generateContent throws', async () => {
      process.env.GEMINI_API_KEY = 'fake-api-key';
      mockGenerateContent.mockRejectedValue(new Error('API Error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await brainstormArchetypes('Atraxa', ['W', 'U', 'B', 'G']);

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('testGeminiApiKey', () => {
    it('returns failure when no API key is available', async () => {
      process.env.GEMINI_API_KEY = '';
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('gemini_api_key');
      }
      const res = await testGeminiApiKey();
      expect(res.success).toBe(false);
      expect(res.message).toContain('No API key provided');
    });

    it('returns failure when provided key is empty whitespace', async () => {
      const res = await testGeminiApiKey('   ');
      expect(res.success).toBe(false);
      expect(res.message).toContain('No API key provided');
    });

    it('verifies connection successfully with valid response', async () => {
      mockGenerateContent.mockResolvedValueOnce({ text: 'OK' });
      const res = await testGeminiApiKey('valid-key-123');

      expect(res.success).toBe(true);
      expect(res.message).toContain('Connection successful');
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: GEMINI_DEFAULT_MODEL,
          contents: expect.any(String)
        })
      );
    });

    it('handles API errors gracefully during verification', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('API key expired or invalid'));
      const res = await testGeminiApiKey('bad-key');

      expect(res.success).toBe(false);
      expect(res.message).toContain('API key expired or invalid');
    });

    it('handles empty response gracefully', async () => {
      mockGenerateContent.mockResolvedValueOnce({ text: '' });
      const res = await testGeminiApiKey('valid-key');

      expect(res.success).toBe(false);
      expect(res.message).toContain('Received empty response');
    });
  });
});

describe('API Key Management', () => {
  const originalEnv = process.env;
  const originalWindow = global.window;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    global.window = originalWindow;
    vi.clearAllMocks();
  });

  describe('getGeminiApiKey', () => {
    it('returns null if no key is set', () => {
      delete (global as any).window;
      delete process.env.GEMINI_API_KEY;
      expect(getGeminiApiKey()).toBeNull();
    });

    it('returns key from localStorage if available', () => {
      const mockGetItem = vi.fn().mockReturnValue('local_storage_key');
      global.window = {
        localStorage: {
          getItem: mockGetItem,
          setItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn(),
          length: 1,
          key: vi.fn()
        } as unknown as Storage
      } as unknown as Window & typeof globalThis;

      expect(getGeminiApiKey()).toBe('local_storage_key');
      expect(mockGetItem).toHaveBeenCalledWith('gemini_api_key');
    });

    it('returns key from process.env if localStorage is empty', () => {
      const mockGetItem = vi.fn().mockReturnValue(null);
      global.window = {
        localStorage: {
          getItem: mockGetItem,
          setItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn(),
          length: 0,
          key: vi.fn()
        } as unknown as Storage
      } as unknown as Window & typeof globalThis;

      process.env.GEMINI_API_KEY = 'env_var_key';

      expect(getGeminiApiKey()).toBe('env_var_key');
    });

    it('returns key from process.env if window is undefined', () => {
      delete (global as any).window;
      process.env.GEMINI_API_KEY = 'env_var_key_no_window';

      expect(getGeminiApiKey()).toBe('env_var_key_no_window');
    });
  });

  describe('setGeminiApiKey', () => {
    it('sets the key in localStorage and trims it', () => {
      const mockSetItem = vi.fn();
      global.window = {
        localStorage: {
          getItem: vi.fn(),
          setItem: mockSetItem,
          removeItem: vi.fn(),
          clear: vi.fn(),
          length: 0,
          key: vi.fn()
        } as unknown as Storage
      } as unknown as Window & typeof globalThis;

      setGeminiApiKey('  new_api_key  ');

      expect(mockSetItem).toHaveBeenCalledWith('gemini_api_key', 'new_api_key');
    });

    it('does nothing if window is undefined', () => {
      delete (global as any).window;
      expect(() => setGeminiApiKey('new_api_key')).not.toThrow();
    });
  });

  describe('clearGeminiApiKey', () => {
    it('removes the key from localStorage', () => {
      const mockRemoveItem = vi.fn();
      global.window = {
        localStorage: {
          getItem: vi.fn(),
          setItem: vi.fn(),
          removeItem: mockRemoveItem,
          clear: vi.fn(),
          length: 0,
          key: vi.fn()
        } as unknown as Storage
      } as unknown as Window & typeof globalThis;

      clearGeminiApiKey();

      expect(mockRemoveItem).toHaveBeenCalledWith('gemini_api_key');
    });

    it('does nothing if window is undefined', () => {
      delete (global as any).window;
      expect(() => clearGeminiApiKey()).not.toThrow();
    });
  });
});
