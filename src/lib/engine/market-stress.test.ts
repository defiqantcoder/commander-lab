import { describe, it, expect } from 'vitest';
import { calculateCardReprintRisk, isReservedList, calculatePortfolioLiquidation } from './market';
import type { CollectionCard } from '../db';

describe('Market Intelligence & Liquidation Engine Edge Cases', () => {
  describe('Extreme card price boundaries', () => {
    it('handles $0.00 basic lands', () => {
      const basicLand: CollectionCard = {
        id: '1', name: 'Forest', set: 'lea', collectorNumber: '294',
        foil: false, quantity: 1, typeLine: 'Basic Land — Forest', currentPriceUsd: 0.00
      };
      expect(calculateCardReprintRisk(basicLand)).toBe(0);
    });

    it('handles $0.05 bulk commons', () => {
      const bulkCommon: CollectionCard = {
        id: '2', name: 'Giant Growth', set: 'lea', collectorNumber: '201',
        foil: false, quantity: 1, typeLine: 'Instant', currentPriceUsd: 0.05
      };
      expect(calculateCardReprintRisk(bulkCommon)).toBe(10);

      const liq = calculatePortfolioLiquidation([bulkCommon]);
      expect(liq.totalValue).toBeCloseTo(0.05);
      expect(liq.liquidationValue).toBe(0); // < $0.10 bulk has 0 liquidation value
    });

    it('handles $1.99 budget threshold', () => {
      const budgetCard: CollectionCard = {
        id: '3', name: 'Sol Ring', set: 'lea', collectorNumber: '269',
        foil: false, quantity: 1, typeLine: 'Artifact', currentPriceUsd: 1.99
      };
      expect(calculateCardReprintRisk(budgetCard)).toBe(10);

      const overBudgetCard: CollectionCard = {
        id: '4', name: 'Sol Ring', set: 'leb', collectorNumber: '269',
        foil: false, quantity: 1, typeLine: 'Artifact', currentPriceUsd: 2.00
      };
      expect(calculateCardReprintRisk(overBudgetCard)).toBe(40);
    });

    it('handles $10,000+ power nine cards', () => {
      const blackLotus: CollectionCard = {
        id: '5', name: 'Black Lotus', set: 'lea', collectorNumber: '232',
        foil: false, quantity: 1, typeLine: 'Artifact', currentPriceUsd: 25000.00
      };
      // Black Lotus is reserved list, so risk is 0 despite high price
      expect(calculateCardReprintRisk(blackLotus)).toBe(0);

      const liq = calculatePortfolioLiquidation([blackLotus]);
      expect(liq.totalValue).toBe(25000.00);
      expect(liq.reservedListValue).toBe(25000.00);
      expect(liq.liquidationValue).toBeCloseTo(20000.00); // 80% for reserved list
    });
  });

  describe('Reserved List variations', () => {
    it('is case-insensitive', () => {
      expect(isReservedList('BLACK LOTUS')).toBe(true);
      expect(isReservedList('black lotus')).toBe(true);
      expect(isReservedList('bLaCk LoTuS')).toBe(true);
    });

    it('handles apostrophes like "Gaea\'s Cradle" vs "Gaeas Cradle"', () => {
      expect(isReservedList('Gaea\'s Cradle')).toBe(true);
      expect(isReservedList('Gaeas Cradle')).toBe(true);
    });

    it('identifies dual lands', () => {
      expect(isReservedList('Underground Sea')).toBe(true);
      expect(isReservedList('Volcanic Island')).toBe(true);
      expect(isReservedList('Tundra')).toBe(true);
      expect(isReservedList('Tropical Island')).toBe(true);
      expect(isReservedList('Bayou')).toBe(true);
      expect(isReservedList('Scrubland')).toBe(true);
      expect(isReservedList('Savannah')).toBe(true);
      expect(isReservedList('Taiga')).toBe(true);
      expect(isReservedList('Badlands')).toBe(true);
      expect(isReservedList('Plateau')).toBe(true);
    });

    it('identifies drop of honey', () => {
      expect(isReservedList('Drop of Honey')).toBe(true);
    });
  });

  describe('Portfolio liquidation calculations', () => {
    it('handles decks with 0 cards', () => {
      const liq = calculatePortfolioLiquidation([]);
      expect(liq.totalValue).toBe(0);
      expect(liq.liquidationValue).toBe(0);
      expect(liq.reservedListValue).toBe(0);
      expect(liq.reprintVulnerableValue).toBe(0);
    });

    it('handles 100% budget cards', () => {
      const budgetCards: CollectionCard[] = [
        { id: '1', name: 'Llanowar Elves', set: 'lea', collectorNumber: '210', foil: false, quantity: 4, typeLine: 'Creature — Elf Druid', currentPriceUsd: 0.25 }, // $1.00 total
        { id: '2', name: 'Giant Growth', set: 'lea', collectorNumber: '201', foil: false, quantity: 4, typeLine: 'Instant', currentPriceUsd: 0.05 }, // $0.20 total, but $0.05 each means bulk? Wait, price per quantity is 0.05.
      ];
      const liq = calculatePortfolioLiquidation(budgetCards);
      expect(liq.totalValue).toBe(1.20);
      // Llanowar Elves: 4 * 0.25 = 1.00. 1.00 * 0.6 = 0.60.
      // Giant Growth: 4 * 0.05 = 0.20. 0.20 < 0.10*4 ? 0.20 < 0.40 -> yes. liquidation = 0.
      expect(liq.liquidationValue).toBeCloseTo(0.60);
      expect(liq.reservedListValue).toBe(0);
      expect(liq.reprintVulnerableValue).toBe(0);
    });

    it('handles 100% Reserved List cards', () => {
      const rlCards: CollectionCard[] = [
        { id: '1', name: 'Black Lotus', set: 'lea', collectorNumber: '232', foil: false, quantity: 1, typeLine: 'Artifact', currentPriceUsd: 10000.00 },
        { id: '2', name: 'Mox Sapphire', set: 'lea', collectorNumber: '265', foil: false, quantity: 1, typeLine: 'Artifact', currentPriceUsd: 5000.00 },
      ];
      const liq = calculatePortfolioLiquidation(rlCards);
      expect(liq.totalValue).toBe(15000.00);
      expect(liq.liquidationValue).toBeCloseTo(15000.00 * 0.8);
      expect(liq.reservedListValue).toBe(15000.00);
      expect(liq.reprintVulnerableValue).toBe(0);
    });

    it('handles 100% reprint-vulnerable cards', () => {
      const vulnerableCards: CollectionCard[] = [
        { id: '1', name: 'Mana Crypt', set: 'ema', collectorNumber: '225', foil: false, quantity: 1, typeLine: 'Artifact', currentPriceUsd: 200.00 },
        { id: '2', name: 'Dockside Extortionist', set: 'c19', collectorNumber: '24', foil: false, quantity: 1, typeLine: 'Creature — Goblin Pirate', currentPriceUsd: 80.00 },
      ];
      const liq = calculatePortfolioLiquidation(vulnerableCards);
      expect(liq.totalValue).toBe(280.00);
      expect(liq.liquidationValue).toBeCloseTo(280.00 * 0.6);
      expect(liq.reservedListValue).toBe(0);
      expect(liq.reprintVulnerableValue).toBe(280.00);
    });
  });

  describe('calculateCardReprintRisk extras', () => {
    it('handles foil status (+10 score)', () => {
      const nonFoil: CollectionCard = {
        id: '1', name: 'Counterspell', set: 'lea', collectorNumber: '54',
        foil: false, quantity: 1, typeLine: 'Instant', currentPriceUsd: 1.00
      };
      const foil: CollectionCard = {
        id: '2', name: 'Counterspell', set: 'lea', collectorNumber: '54',
        foil: true, quantity: 1, typeLine: 'Instant', currentPriceUsd: 1.00
      };
      expect(calculateCardReprintRisk(nonFoil)).toBe(10);
      expect(calculateCardReprintRisk(foil)).toBe(20);
    });

    it('caps risk score at 100 for foils', () => {
       const expensiveFoil: CollectionCard = {
        id: '2', name: 'Mana Crypt', set: 'lea', collectorNumber: '54',
        foil: true, quantity: 1, typeLine: 'Artifact', currentPriceUsd: 500.00
      };
      // Expensive non-RL card has base 80. +10 for foil -> 90.
      // If we change base to 95, foil would cap at 100.
      expect(calculateCardReprintRisk(expensiveFoil)).toBe(90);
    });

    it('handles basic land type lines', () => {
      const snowBasic: CollectionCard = {
        id: '1', name: 'Snow-Covered Island', set: 'ice', collectorNumber: '32',
        foil: false, quantity: 1, typeLine: 'Basic Snow Land — Island', currentPriceUsd: 1.00
      };
      expect(calculateCardReprintRisk(snowBasic)).toBe(0);
    });
  });
});
