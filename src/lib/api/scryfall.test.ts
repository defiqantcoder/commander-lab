import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateReprintRisk, getCardById, type ScryfallCard } from './scryfall';

vi.mock('$lib/db', () => ({
  db: {
    marketCache: {
      get: vi.fn(),
      put: vi.fn()
    }
  }
}));

describe('ScryfallAPI', () => {
  let originalFetch: any;

  beforeEach(() => {
    originalFetch = global.fetch;
    vi.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('spaces out concurrent requests by at least 100ms', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'mock-id' })
    });
    global.fetch = fetchMock;

    const start = Date.now();

    const promises = [
      getCardById('id-1'),
      getCardById('id-2'),
      getCardById('id-3')
    ];

    await Promise.all(promises);

    const end = Date.now();
    expect(end - start).toBeGreaterThanOrEqual(180);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('bypasses the rate-limiter when cached entries exist and are within TTL', async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    const mockData = { id: 'cached-id', name: 'Cached Card' };

    const { db } = await import('$lib/db');
    (db.marketCache.get as any).mockResolvedValue({
      data: mockData,
      cachedAt: Date.now()
    });

    global.indexedDB = {} as any;

    const start = Date.now();
    const result1 = await getCardById('id-cached-1');
    const result2 = await getCardById('id-cached-2');
    const end = Date.now();

    expect(result1).toEqual(mockData);
    expect(result2).toEqual(mockData);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(end - start).toBeLessThan(100);
  });
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

