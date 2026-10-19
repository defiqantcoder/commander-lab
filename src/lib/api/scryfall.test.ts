import { describe, it, expect } from 'vitest';
import { calculateReprintRisk, type ScryfallCard } from './scryfall';

describe('ScryfallAPI', () => {
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

