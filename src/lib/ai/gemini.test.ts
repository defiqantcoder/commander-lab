import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getGeminiApiKey,
  setGeminiApiKey,
  clearGeminiApiKey,
  testGeminiApiKey,
  brainstormArchetypes,
  generateFreshDeckWithAI,
  analyzeDeckWithAI,
  analyzeMarketWithAI,
  analyzeMatchupWithAI,
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
      STRING: 'STRING',
      NUMBER: 'NUMBER',
      BOOLEAN: 'BOOLEAN'
    }
  };
});

describe('gemini engine', () => {
  beforeEach(() => {
    mockGenerateContent.mockClear();
  });

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

  describe('generateFreshDeckWithAI', () => {
    it('returns offline deck structure when no API key is provided and collection is optional', async () => {
      process.env.GEMINI_API_KEY = '';
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('gemini_api_key');
      }

      // Without collection
      const resultNoCollection = await generateFreshDeckWithAI('Krenko, Mob Boss', ['R'], 'Goblin Swarm');
      expect(resultNoCollection.commanderName).toBe('Krenko, Mob Boss');
      expect(resultNoCollection.cards.length).toBeGreaterThan(0);
      expect(mockGenerateContent).not.toHaveBeenCalled();

      // With optional collection
      const resultWithCollection = await generateFreshDeckWithAI('Krenko, Mob Boss', ['R'], 'Goblin Swarm', ['Sol Ring', 'Goblin Chieftain']);
      expect(resultWithCollection.commanderName).toBe('Krenko, Mob Boss');
      expect(resultWithCollection.cards.length).toBeGreaterThan(0);
    });

    it('returns parsed generated deck when API call succeeds', async () => {
      process.env.GEMINI_API_KEY = 'fake-api-key';
      const mockDeck = {
        commanderName: 'Krenko, Mob Boss',
        archetype: 'Goblin Burn & Tokens',
        estimatedSaltScore: 35,
        cards: [
          { name: 'Goblin Bombardment', category: 'payoff', cmc: 2, synergyRationale: 'Converts infinite tokens into table-wide lethal burn.' },
          { name: 'Skirk Prospector', category: 'ramp', cmc: 1, synergyRationale: 'Sacrifice outlet for red mana acceleration.' }
        ]
      };
      mockGenerateContent.mockResolvedValueOnce({ text: JSON.stringify(mockDeck) });

      const result = await generateFreshDeckWithAI('Krenko, Mob Boss', ['R'], 'Goblin Burn & Tokens', ['Skirk Prospector']);
      expect(result.commanderName).toBe('Krenko, Mob Boss');
      expect(result.cards.length).toBe(2);
      expect(result.cards[0].name).toBe('Goblin Bombardment');
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: GEMINI_DEFAULT_MODEL
        })
      );
    });

    it('handles API errors gracefully during deck generation', async () => {
      process.env.GEMINI_API_KEY = 'fake-api-key';
      mockGenerateContent.mockRejectedValueOnce(new Error('Generation Error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await generateFreshDeckWithAI('Krenko, Mob Boss', ['R'], 'Goblin Burn');
      expect(result.cards).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('analyzeDeckWithAI', () => {
    it('returns offline deck analysis when no API key is set', async () => {
      process.env.GEMINI_API_KEY = '';
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('gemini_api_key');
      }

      const deckCards = [
        { name: 'Ashnod\'s Altar', typeLine: 'Artifact' },
        { name: 'Nim Deathmantle', typeLine: 'Artifact — Equipment' }
      ];
      const collectionCards = [
        { name: 'Grave Titan', typeLine: 'Creature — Giant' }
      ];

      const result = await analyzeDeckWithAI('Meren of Clan Nel Toth', deckCards, collectionCards);
      expect(result.deckSummary).toContain('Meren of Clan Nel Toth');
      expect(result.dynamicCombos.length).toBeGreaterThan(0);
      expect(result.collectionUpgrades.length).toBe(1);
      expect(result.collectionUpgrades[0].cardName).toBe('Grave Titan');
      expect(result.pilotingSecrets.length).toBeGreaterThan(0);
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('returns parsed AI analysis when API call succeeds', async () => {
      process.env.GEMINI_API_KEY = 'fake-api-key';
      const mockAnalysis = {
        deckSummary: 'High-power Golgari aristocrats deck with dense recursion.',
        dynamicCombos: [
          {
            name: 'Nim Deathmantle + Ashnod\'s Altar + Grave Titan',
            cards: ['Nim Deathmantle', 'Ashnod\'s Altar', 'Grave Titan'],
            isInfinite: true,
            result: 'Infinite colorless mana and 2/2 Zombie tokens',
            prerequisites: ['All 3 pieces on board or ready to cast'],
            steps: ['Sac Titan + 1 token', 'Pay 4 for Deathmantle trigger', 'Titan enters creating 2 tokens'],
            disruptionWindow: 'Instant removal on Deathmantle or graveyard exile in response to trigger'
          }
        ],
        collectionUpgrades: [
          {
            cardName: 'Viscera Seer',
            synergyReason: 'Zero-mana free sacrifice outlet owned in your collection.',
            role: 'engine'
          }
        ],
        pilotingSecrets: [
          {
            title: 'Sandbagging Grave Titan',
            tip: 'Hold Grave Titan in hand until after opponents commit board wipes.',
            applicableCards: ['Grave Titan']
          }
        ]
      };
      mockGenerateContent.mockResolvedValueOnce({ text: JSON.stringify(mockAnalysis) });

      const result = await analyzeDeckWithAI('Meren of Clan Nel Toth', [{ name: 'Grave Titan' }]);
      expect(result.dynamicCombos.length).toBe(1);
      expect(result.dynamicCombos[0].isInfinite).toBe(true);
      expect(result.collectionUpgrades[0].cardName).toBe('Viscera Seer');
    });

    it('handles AI analysis error gracefully', async () => {
      process.env.GEMINI_API_KEY = 'fake-api-key';
      mockGenerateContent.mockRejectedValueOnce(new Error('Rate limit'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await analyzeDeckWithAI('Meren', []);
      expect(result.dynamicCombos).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('analyzeMarketWithAI', () => {
    it('returns offline market analysis when no API key is provided', async () => {
      process.env.GEMINI_API_KEY = '';
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('gemini_api_key');
      }

      const cards = [
        { name: 'Underground Sea', currentPriceUsd: 750, isReserved: true },
        { name: 'Smothering Tithe', currentPriceUsd: 25, isReserved: false },
        { name: 'Sol Ring', currentPriceUsd: 1.5, isReserved: false }
      ];

      const result = await analyzeMarketWithAI(cards);
      expect(result.overallMarketVerdict).toContain('Portfolio contains');
      expect(result.sellRecommendations.some((c) => c.cardName === 'Smothering Tithe')).toBe(true);
      expect(result.safeHavenHoldings.some((c) => c.cardName === 'Underground Sea')).toBe(true);
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('returns parsed AI market analysis when API call succeeds', async () => {
      process.env.GEMINI_API_KEY = 'fake-api-key';
      const mockMarketResult = {
        overallMarketVerdict: 'Strong portfolio with $400 in vulnerable reprint targets.',
        portfolioHealthAssessment: 'Moderate risk — swap non-reserved cards to capture value.',
        sellRecommendations: [
          {
            cardName: 'Smothering Tithe',
            currentPriceUsd: 25,
            urgency: 'Upcoming Cycle',
            reasonToSell: 'Frequent commander precon target; sell into peak demand before next reprint.',
            projectedReprintWindow: 'Q3 Commander Legends product',
            budgetSwap: 'Monologue Tax',
            estimatedSavings: 22
          }
        ],
        safeHavenHoldings: [
          {
            cardName: 'Gaea\'s Cradle',
            currentPriceUsd: 850,
            reasonToHold: 'Reserved list staple with zero reprint risk under WotC policy.'
          }
        ]
      };
      mockGenerateContent.mockResolvedValueOnce({ text: JSON.stringify(mockMarketResult) });

      const result = await analyzeMarketWithAI([{ name: 'Smothering Tithe', currentPriceUsd: 25 }]);
      expect(result.sellRecommendations[0].budgetSwap).toBe('Monologue Tax');
      expect(result.safeHavenHoldings[0].cardName).toBe("Gaea's Cradle");
    });

    it('handles AI market analysis error gracefully', async () => {
      process.env.GEMINI_API_KEY = 'fake-api-key';
      mockGenerateContent.mockRejectedValueOnce(new Error('Network error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await analyzeMarketWithAI([]);
      expect(result.sellRecommendations).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('analyzeMatchupWithAI', () => {
    it('returns rich offline matchup coaching when no API key is provided', async () => {
      process.env.GEMINI_API_KEY = '';
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('gemini_api_key');
      }

      const result = await analyzeMatchupWithAI(
        'Urza Stax',
        [{ name: 'Urza, Lord High Artificer', category: 'commander' }, { name: 'Static Orb' }],
        'Krenko Aggro',
        [{ name: 'Krenko, Mob Boss', category: 'commander' }, { name: 'Goblin Chieftain' }],
        { playerWins: 3, opponentWins: 2, gamesSimulated: 5 }
      );

      expect(result.pivotTurn).toBe(3);
      expect(result.pivotTurnAnalysis).toContain('Turn 3');
      expect(result.priorityRemovalTargets.length).toBeGreaterThan(0);
      expect(result.priorityRemovalTargets[0].cardName).toBe('Krenko, Mob Boss');
      expect(result.sideboardSwaps.suggestedAdditions.length).toBeGreaterThan(0);
      expect(result.tacticalGamePlan).toContain('Krenko, Mob Boss');
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('returns parsed AI matchup coaching when API call succeeds', async () => {
      process.env.GEMINI_API_KEY = 'fake-api-key';
      const mockCoachingResult = {
        matchupVerdict: 'High-leverage control vs aggro dynamic.',
        pivotTurn: 4,
        pivotTurnAnalysis: 'Turn 4 defines the game: Krenko looks to tap with haste.',
        priorityRemovalTargets: [
          {
            cardName: 'Thornbite Staff',
            reason: 'Infinite goblin untap engine piece.',
            optimalTiming: 'Remove in response to equip trigger.'
          }
        ],
        matchupStrengths: ['Superior card draw and asymmetric stax locks.'],
        matchupVulnerabilities: ['Vulnerable to red burn if life drops below 15.'],
        sideboardSwaps: {
          suggestedAdditions: [
            { cardName: 'Aetherize', role: 'Interaction', reason: 'Bounces entire goblin army during combat.' }
          ],
          suggestedCuts: [
            { cardName: 'Rhystic Study', reason: 'Too slow when facing immediate lethal damage.' }
          ]
        },
        tacticalGamePlan: 'Deploy early blockers and hold Aetherize until Krenko alpha strikes.'
      };
      mockGenerateContent.mockResolvedValueOnce({ text: JSON.stringify(mockCoachingResult) });

      const result = await analyzeMatchupWithAI(
        'Urza Stax',
        [{ name: 'Urza' }],
        'Krenko Aggro',
        [{ name: 'Krenko' }]
      );

      expect(result.pivotTurn).toBe(4);
      expect(result.priorityRemovalTargets[0].cardName).toBe('Thornbite Staff');
      expect(result.sideboardSwaps.suggestedAdditions[0].cardName).toBe('Aetherize');
      expect(result.sideboardSwaps.suggestedCuts[0].cardName).toBe('Rhystic Study');
    });

    it('handles AI matchup analysis error gracefully', async () => {
      process.env.GEMINI_API_KEY = 'fake-api-key';
      mockGenerateContent.mockRejectedValueOnce(new Error('Timeout'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await analyzeMatchupWithAI('Deck A', [], 'Deck B', []);
      expect(result.pivotTurn).toBe(4);
      expect(result.matchupVerdict).toContain('Unable to generate');
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
