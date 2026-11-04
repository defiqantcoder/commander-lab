import { describe, it, expect } from 'vitest';
import {
  calculateCardReprintRisk,
  analyzeDeckMarketLiquidation,
  KNOWN_RESERVED_LIST,
  STAPLE_BUDGET_SWAP_REGISTRY
} from './market';
import type { DeckCard } from '../components/types';

describe('Market & Liquidation Intelligence Engine', () => {
  describe('calculateCardReprintRisk', () => {
    it('grants 0 reprint risk to Reserved List cards', () => {
      expect(calculateCardReprintRisk("Gaea's Cradle", 800)).toBe(0);
      expect(calculateCardReprintRisk('Underground Sea', 750)).toBe(0);
      expect(calculateCardReprintRisk('Mox Diamond', 650)).toBe(0);
      expect(calculateCardReprintRisk('Sliver Queen', 250)).toBe(0);
      expect(calculateCardReprintRisk('Gilded Drake', 280)).toBe(0);
      expect(calculateCardReprintRisk('Intuition', 140)).toBe(0);
      expect(calculateCardReprintRisk('Time Spiral', 120)).toBe(0);
      expect(calculateCardReprintRisk("Mishra's Workshop", 2500)).toBe(0);
      expect(calculateCardReprintRisk('Bazaar of Baghdad', 2000)).toBe(0);
    });

    it('returns low risk score for sub-$2 cards and basic lands', () => {
      expect(calculateCardReprintRisk('Forest', 0.15, 'Basic Land — Forest')).toBe(10);
      expect(calculateCardReprintRisk('Llanowar Elves', 0.45, 'Creature — Elf Druid')).toBe(10);
      expect(calculateCardReprintRisk('Command Tower', 0.35, 'Land')).toBe(10);
    });

    it('calculates elevated risk for high-value reprint-vulnerable staples', () => {
      // $55 non-reserved card: 35 base + 40 (>=50) = 75
      const riskHigh = calculateCardReprintRisk('Rhystic Study', 55);
      expect(riskHigh).toBe(75);

      // $25 non-reserved card: 35 base + 30 (>=20) = 65
      const riskMed = calculateCardReprintRisk('Smothering Tithe', 25);
      expect(riskMed).toBe(65);

      // $12 non-reserved card: 35 base + 15 (>=10) = 50
      const riskTen = calculateCardReprintRisk('Heroic Intervention', 12);
      expect(riskTen).toBe(50);
    });

    it('adds extra vulnerability penalty for foil cards', () => {
      const regular = calculateCardReprintRisk('Esper Sentinel', 35, 'Artifact Creature', false);
      const foil = calculateCardReprintRisk('Esper Sentinel', 35, 'Artifact Creature', true);
      expect(foil).toBe(regular + 10);
    });
  });

  describe('analyzeDeckMarketLiquidation', () => {
    const testCommander: DeckCard = {
      id: 'cmd-1',
      name: 'Meren of Clan Nel Toth',
      typeLine: 'Legendary Creature — Human Shaman',
      manaCost: '{2}{B}{G}',
      cmc: 4,
      colorIdentity: ['B', 'G'],
      oracleText: 'Whenever another creature you control dies, you get an experience counter.',
      currentPriceUsd: 8.50,
      quantity: 1,
      role: 'commander', set: 'test', collectorNumber: '1', foil: false
    };

    const sampleDeckCards: DeckCard[] = [
      {
        id: 'c1',
        name: 'Gaea\'s Cradle',
        typeLine: 'Land',
        cmc: 0,
        colorIdentity: ['G'],
        oracleText: '{T}: Add {G} for each creature you control.',
        currentPriceUsd: 800.00,
        quantity: 1,
        role: 'other', set: 'test', collectorNumber: '1', foil: false, manaCost: ''
      },
      {
        id: 'c2',
        name: 'The Ozolith',
        typeLine: 'Legendary Artifact',
        cmc: 1,
        colorIdentity: [],
        oracleText: 'Whenever a creature you control leaves the battlefield...',
        currentPriceUsd: 42.00,
        quantity: 1,
        role: 'other', set: 'test', collectorNumber: '1', foil: false, manaCost: ''
      },
      {
        id: 'c3',
        name: 'Demonic Tutor',
        typeLine: 'Sorcery',
        cmc: 2,
        colorIdentity: ['B'],
        oracleText: 'Search your library for a card...',
        currentPriceUsd: 45.00,
        quantity: 1,
        role: 'other', set: 'test', collectorNumber: '1', foil: false, manaCost: ''
      },
      {
        id: 'c4',
        name: 'Llanowar Elves',
        typeLine: 'Creature — Elf Druid',
        cmc: 1,
        colorIdentity: ['G'],
        oracleText: '{T}: Add {G}.',
        currentPriceUsd: 0.25,
        quantity: 1,
        role: 'other', set: 'test', collectorNumber: '1', foil: false, manaCost: ''
      },
      {
        id: 'c5',
        name: 'Swamp',
        typeLine: 'Basic Land — Swamp',
        cmc: 0,
        colorIdentity: ['B'],
        oracleText: '{T}: Add {B}.',
        currentPriceUsd: 0.10,
        quantity: 1,
        role: 'other', set: 'test', collectorNumber: '1', foil: false, manaCost: ''
      }
    ];

    it('correctly calculates total value, vulnerable value, and reserved list allocation', () => {
      const report = analyzeDeckMarketLiquidation(sampleDeckCards, testCommander);

      // Total value: 800 (Cradle) + 42 (Ozolith) + 45 (Demonic Tutor) + 0.25 (Llanowar) + 0.10 (Swamp) + 8.50 (Meren) = 895.85
      expect(report.totalDeckValueUsd).toBeCloseTo(895.85, 2);
      expect(report.reservedListValueUsd).toBe(800.00);
      // Vulnerable: Ozolith (42) + Demonic Tutor (45) = 87.00 (Meren at 8.50 is < 10, riskScore 35 base = 35 -> Moderate Hold)
      expect(report.vulnerableValueUsd).toBe(87.00);
      expect(report.budgetStaplesCount).toBe(2); // Llanowar Elves + Swamp (< $2)
      expect(report.totalCardsEvaluated).toBe(6);
    });

    it('identifies critical risk staples and ranks them by price descending', () => {
      const report = analyzeDeckMarketLiquidation(sampleDeckCards, testCommander);

      expect(report.highRiskCards.length).toBe(2);
      expect(report.highRiskCards[0].name).toBe('Demonic Tutor');
      expect(report.highRiskCards[1].name).toBe('The Ozolith');
      expect(report.highRiskCards[0].action).toBe('Liquidate / Sell');
    });

    it('identifies reserved list safety vault cards', () => {
      const report = analyzeDeckMarketLiquidation(sampleDeckCards, testCommander);

      expect(report.reservedListCards.length).toBe(1);
      expect(report.reservedListCards[0].name).toBe("Gaea's Cradle");
      expect(report.reservedListCards[0].riskLevel).toBe('Reserved List');
      expect(report.reservedListCards[0].action).toBe('Safe Vault');
    });

    it('generates high-synergy budget replacement recommendations', () => {
      const report = analyzeDeckMarketLiquidation(sampleDeckCards, testCommander);

      expect(report.budgetReplacements.length).toBe(2);
      
      const ozolithSwap = report.budgetReplacements.find(r => r.originalCard === 'The Ozolith');
      expect(ozolithSwap).toBeDefined();
      expect(ozolithSwap?.replacementCard).toBe('Resourceful Defense');
      expect(ozolithSwap?.savings).toBeCloseTo(42.00 - 1.49, 2);

      const tutorSwap = report.budgetReplacements.find(r => r.originalCard === 'Demonic Tutor');
      expect(tutorSwap).toBeDefined();
      expect(tutorSwap?.replacementCard).toBe('Diabolic Tutor');
    });

    it('computes portfolio health score and liquidation advice', () => {
      const report = analyzeDeckMarketLiquidation(sampleDeckCards, testCommander);

      // Vulnerable ratio is 87 / 895.85 ~ 9.7%, so healthScore ~ 90%
      expect(report.portfolioHealthScore).toBeGreaterThanOrEqual(85);
      expect(report.liquidationAdvice).toContain('Balanced market profile');
    });

    it('warns when deck is dominated by reprint vulnerability', () => {
      const vulnerableOnlyCards: DeckCard[] = [
        {
          id: 'v1',
          name: 'Rhystic Study',
          typeLine: 'Enchantment',
          cmc: 3,
          colorIdentity: ['U'],
          oracleText: 'Whenever an opponent casts a spell...',
          currentPriceUsd: 60.00,
          quantity: 1,
          role: 'other', set: 'test', collectorNumber: '1', foil: false, manaCost: ''
        },
        {
          id: 'v2',
          name: 'Smothering Tithe',
          typeLine: 'Enchantment',
          cmc: 4,
          colorIdentity: ['W'],
          oracleText: 'Whenever an opponent draws a card...',
          currentPriceUsd: 30.00,
          quantity: 1,
          role: 'other', set: 'test', collectorNumber: '1', foil: false, manaCost: ''
        }
      ];

      const report = analyzeDeckMarketLiquidation(vulnerableOnlyCards);
      expect(report.portfolioHealthScore).toBeLessThanOrEqual(20);
      expect(report.liquidationAdvice).toContain('High reprint vulnerability');
    });
  });
});

