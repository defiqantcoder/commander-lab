import { GoogleGenAI, Type } from '@google/genai';

export const GEMINI_DEFAULT_MODEL = 'gemini-3.8-flash';
export const GEMINI_FALLBACK_MODEL = 'gemini-2.5-flash';

export interface ArchetypeSuggestion {
  themeName: string;
  tagline: string;
  powerTier: 'Casual' | 'Focused' | 'Optimized';
  primaryEngine: string;
  obscureInteraction: string;
  keyWinCon: string;
  sampleKeyCards: string[];
}

export interface GeneratedDeckCard {
  name: string;
  category: 'commander' | 'ramp' | 'draw' | 'engine' | 'interaction' | 'payoff' | 'land';
  cmc: number;
  synergyRationale: string;
  budgetAlternative?: string;
}

export interface GeneratedDeckResult {
  commanderName: string;
  archetype: string;
  estimatedSaltScore: number;
  cards: GeneratedDeckCard[];
}

export interface GeminiTestResult {
  success: boolean;
  message: string;
}

/**
 * Retrieves the configured Google Gemini API key from localStorage or environment variables.
 */
export function getGeminiApiKey(): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    const key = window.localStorage.getItem('gemini_api_key');
    if (key) return key;
  }
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  return null;
}

/**
 * Stores the Google Gemini API key in localStorage.
 */
export function setGeminiApiKey(key: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('gemini_api_key', key.trim());
  }
}

/**
 * Removes the stored Google Gemini API key from localStorage.
 */
export function clearGeminiApiKey(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('gemini_api_key');
  }
}

/**
 * Tests a Google Gemini API key by making a lightweight verification call to the Gemini API.
 */
export async function testGeminiApiKey(apiKeyOverride?: string): Promise<GeminiTestResult> {
  const apiKey = (apiKeyOverride !== undefined ? apiKeyOverride : getGeminiApiKey())?.trim();

  if (!apiKey) {
    return {
      success: false,
      message: 'No API key provided. Please enter a valid Google Gemini API key.'
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: GEMINI_DEFAULT_MODEL,
      contents: 'Ping: Return the word "OK".'
    });

    if (response && response.text) {
      return {
        success: true,
        message: `Connection successful! Google Gemini (${GEMINI_DEFAULT_MODEL}) is ready.`
      };
    }

    return {
      success: false,
      message: 'Received empty response from Google Gemini API.'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while contacting Google Gemini API.';
    return {
      success: false,
      message: errorMessage
    };
  }
}

/**
 * Brainstorms 3-4 unconventional, fresh archetypes for a commander using Google Gemini.
 */
export async function brainstormArchetypes(
  commanderName: string,
  colorIdentity: string[],
  model: string = GEMINI_DEFAULT_MODEL
): Promise<ArchetypeSuggestion[]> {
  const apiKey = getGeminiApiKey();

  // If no API key configured, provide rich contextual offline suggestions
  if (!apiKey) {
    return [
      {
        themeName: `${commanderName} Hidden Engine`,
        tagline: 'Leverages non-obvious replacement effects and triggered ability chains.',
        powerTier: 'Focused',
        primaryEngine: 'Recursive loop with death triggers and modular counters.',
        obscureInteraction: 'Replacement effects modify event before triggers check board state.',
        keyWinCon: 'Looping ETB drain with value sacrifice outlets.',
        sampleKeyCards: ['Ashnod\'s Altar', 'Nim Deathmantle', 'Skullclamp', 'Pitiless Plunderer']
      },
      {
        themeName: 'Tempo & Stax-Lite Taxation',
        tagline: 'Asymmetric board slowing while developing explosive mana advantage.',
        powerTier: 'Optimized',
        primaryEngine: 'Rule-of-law style pacing paired with flash speed interaction.',
        obscureInteraction: 'Continuous effects apply in Layer 6 before abilities can be granted.',
        keyWinCon: 'Overwhelming resource disparity into combat evasion.',
        sampleKeyCards: ['Rhystic Study', 'Drannith Magistrate', 'Esper Sentinel', 'Aura Shards']
      },
      {
        themeName: 'Surprise Alternate Win-Con',
        tagline: 'Divergent win condition that bypasses combat damage entirely.',
        powerTier: 'Casual',
        primaryEngine: 'Self-mill or card draw acceleration with replacement protections.',
        obscureInteraction: 'Simultaneous state-based actions allow precision triggers.',
        keyWinCon: 'Alternate victory state triggered at upkeep.',
        sampleKeyCards: ['Laboratory Maniac', 'Approach of the Second Sun', 'Felidar Sovereign']
      }
    ];
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `You are an elite Magic: The Gathering rules judge and Commander architect powered by Google Gemini.
Analyze the commander "${commanderName}" with color identity [${colorIdentity.join(', ')}].
Brainstorm 3 distinct, fresh, unconventional deck themes. Focus on non-obvious replacement effects, triggered ability chains, and obscure rules interactions far beyond typical EDHREC staples.

Return a JSON array of objects with the following schema:
- themeName: string
- tagline: string
- powerTier: "Casual" | "Focused" | "Optimized"
- primaryEngine: string
- obscureInteraction: string
- keyWinCon: string
- sampleKeyCards: string[]`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              themeName: { type: Type.STRING },
              tagline: { type: Type.STRING },
              powerTier: { type: Type.STRING },
              primaryEngine: { type: Type.STRING },
              obscureInteraction: { type: Type.STRING },
              keyWinCon: { type: Type.STRING },
              sampleKeyCards: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['themeName', 'tagline', 'powerTier', 'primaryEngine', 'obscureInteraction', 'keyWinCon', 'sampleKeyCards']
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ArchetypeSuggestion[];
    }
  } catch (error) {
    console.error('Error in Gemini archetype brainstorming:', error);
  }

  return [];
}
