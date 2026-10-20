import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getGeminiApiKey, setGeminiApiKey } from './argon';

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
      // Mock window to not have localStorage or be undefined
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

      // Should not throw
      expect(() => setGeminiApiKey('new_api_key')).not.toThrow();
    });
  });
});
