import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as scryfall from './scryfall';
import { calculateReprintRisk, type ScryfallCard } from './scryfall';

describe('ScryfallAPI', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('searchCards', () => {
    it('generates correct cache key and URL', async () => {
      // Mock global fetch to capture the URL generated in fetchWithCache
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });
      global.fetch = mockFetch;

      // Need to mock indexedDB to prevent caching errors or warnings during tests
      const originalIndexedDB = global.indexedDB;
      global.indexedDB = undefined as any;

      await scryfall.searchCards('type:creature cmc=3');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.scryfall.com/cards/search?q=type%3Acreature%20cmc%3D3&page=1',
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: 'application/json'
          })
        })
      );

      // Restore indexedDB
      global.indexedDB = originalIndexedDB;
    });

    it('uses correct pagination', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });
      global.fetch = mockFetch;

      const originalIndexedDB = global.indexedDB;
      global.indexedDB = undefined as any;

      await scryfall.searchCards('elf', 2);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.scryfall.com/cards/search?q=elf&page=2',
        expect.any(Object)
      );

      global.indexedDB = originalIndexedDB;
    });
  });

  describe('calculateReprintRisk', () => {
    it('returns 0 reprint risk for Reserved List cards', () => {
      const card: ScryfallCard = {
        id: 'volcanic-island',
        name: 'Volcanic Island',
        cmc: 0,
        type_line: 'Land — Island Mountain',
        set: 'lea',
        collector_number: '280',
        rarity: 'rare',
        reserved: true,
        reprint: false,
        prices: { usd: '850.00' },
        color_identity: ['U', 'R']
      };
      expect(calculateReprintRisk(card)).toBe(0);
    });

    it('calculates higher reprint risk for expensive non-reserved staples', () => {
      const stapleCard: ScryfallCard = {
        id: 'rhystic-study',
        name: 'Rhystic Study',
        cmc: 3,
        type_line: 'Enchantment',
        set: 'pcy',
        collector_number: '45',
        rarity: 'rare',
        reserved: false,
        reprint: false,
        prices: { usd: '45.00' },
        edhrec_rank: 15,
        color_identity: ['U']
      };
      const risk = calculateReprintRisk(stapleCard);
      expect(risk).toBeGreaterThan(60);
    });

    it('returns low reprint risk for budget cards', () => {
      const cheapCard: ScryfallCard = {
        id: 'negate',
        name: 'Negate',
        cmc: 2,
        type_line: 'Instant',
        set: 'mom',
        collector_number: '68',
        rarity: 'common',
        reserved: false,
        reprint: true,
        prices: { usd: '0.25' },
        edhrec_rank: 200,
        color_identity: ['U']
      };
      expect(calculateReprintRisk(cheapCard)).toBe(10);
    });
  });
});
