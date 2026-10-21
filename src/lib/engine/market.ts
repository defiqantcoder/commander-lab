import type { CollectionCard, SavedDeck } from '../db';

/**
 * Calculates a reprint risk score (0-100) for a card based on its attributes.
 * Higher score means higher risk of losing value due to a reprint.
 *
 * Rules:
 * - Basic lands always have a score of 0.
 * - Reserved list cards always have a score of 0.
 * - Foils get a +10 penalty to their score.
 * - Cards under $2.00 get a low score (e.g., 10).
 * - Cards between $2.00 and $10.00 get a moderate score (e.g., 40).
 * - Cards above $10.00 get a high score (e.g., 80) unless on reserved list.
 */
export function calculateCardReprintRisk(card: CollectionCard): number {
  if (isBasicLand(card.typeLine)) return 0;
  if (isReservedList(card.name)) return 0;

  let baseScore = 0;
  const price = card.currentPriceUsd || 0;

  if (price < 2.00) {
    baseScore = 10;
  } else if (price <= 10.00) {
    baseScore = 40;
  } else {
    baseScore = 80;
  }

  if (card.foil) {
    baseScore = Math.min(100, baseScore + 10);
  }

  return baseScore;
}

export function isBasicLand(typeLine?: string): boolean {
  if (!typeLine) return false;
  return typeLine.toLowerCase().includes('basic') && typeLine.toLowerCase().includes('land');
}

const RESERVED_LIST = new Set([
  'ancestral recall',
  'badlands',
  'bayou',
  'black lotus',
  'city of traitors',
  'drop of honey',
  'gaea\'s cradle',
  'gaeas cradle',
  'grim monolith',
  'lion\'s eye diamond',
  'lions eye diamond',
  'mox emerald',
  'mox jet',
  'mox pearl',
  'mox ruby',
  'mox sapphire',
  'plateau',
  'savannah',
  'scrubland',
  'survival of the fittest',
  'taiga',
  'time vault',
  'time walk',
  'timetwister',
  'tropical island',
  'tundra',
  'underground sea',
  'volcanic island',
  'wheel of fortune'
]);

export function isReservedList(cardName: string): boolean {
  const normalized = cardName.toLowerCase().replace(/[^a-z0-9 ]/g, '');

  // Create normalized set for checking
  const normalizedSet = new Set(Array.from(RESERVED_LIST).map(name =>
    name.toLowerCase().replace(/[^a-z0-9 ]/g, '')
  ));

  return normalizedSet.has(normalized);
}

export interface PortfolioLiquidationResult {
  totalValue: number;
  liquidationValue: number;
  reservedListValue: number;
  reprintVulnerableValue: number;
}

/**
 * Calculates the liquidation value of a deck.
 * Liquidation value is generally ~60% of market value for standard cards.
 * Bulk commons (< $0.10) have 0 liquidation value.
 * Reserved list cards might retain ~80% value.
 */
export function calculatePortfolioLiquidation(cards: CollectionCard[]): PortfolioLiquidationResult {
  let totalValue = 0;
  let liquidationValue = 0;
  let reservedListValue = 0;
  let reprintVulnerableValue = 0;

  for (const card of cards) {
    const price = (card.currentPriceUsd || 0) * (card.quantity || 1);
    totalValue += price;

    if (isReservedList(card.name)) {
      reservedListValue += price;
      liquidationValue += price * 0.8;
    } else {
      const riskScore = calculateCardReprintRisk(card);
      if (riskScore > 50) {
        reprintVulnerableValue += price;
      }

      if (price < 0.10 * (card.quantity || 1)) {
        // Bulk has 0 liquidation value
        liquidationValue += 0;
      } else {
        liquidationValue += price * 0.6;
      }
    }
  }

  return {
    totalValue,
    liquidationValue,
    reservedListValue,
    reprintVulnerableValue
  };
}
