import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { brainstormArchetypes, setGeminiApiKey, getGeminiApiKey } from './argon';
import { GoogleGenAI } from '@google/genai';

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

describe('argon', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv };
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('brainstormArchetypes', () => {
    it('returns offline suggestions when no API key is provided', async () => {
      process.env.GEMINI_API_KEY = '';
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
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('returns an empty array and logs error when generateContent throws', async () => {
      process.env.GEMINI_API_KEY = 'fake-api-key';
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const result = await brainstormArchetypes('Atraxa', ['W', 'U', 'B', 'G']);

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in Argon archetype brainstorming:', expect.any(Error));
    });
  });
});
