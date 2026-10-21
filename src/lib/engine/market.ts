import type { DeckCard } from '../components/types';

export interface MarketReplacement {
  originalCard: string;
  replacementCard: string;
  originalPrice: number;
  replacementPrice: number;
  savings: number;
  synergyNote: string;
}

export interface MarketCard {
  id: string;
  name: string;
  currentPriceUsd: number;
  reprintRiskScore: number; // 0–100
  riskLevel: 'Critical Risk' | 'High Risk' | 'Moderate' | 'Safe / Budget' | 'Reserved List';
  isReserved: boolean;
  action: 'Liquidate / Sell' | 'Monitor Closely' | 'Hold' | 'Safe Vault' | 'Budget Staple';
  recommendationNote: string;
  recommendedReplacement?: MarketReplacement;
}

export interface PortfolioLiquidationReport {
  totalDeckValueUsd: number;
  vulnerableValueUsd: number;
  reservedListValueUsd: number;
  budgetStaplesCount: number;
  totalCardsEvaluated: number;
  portfolioHealthScore: number; // 0–100 (100 = completely immune to reprint depreciation)
  highRiskCards: MarketCard[];
  reservedListCards: MarketCard[];
  allCards: MarketCard[];
  budgetReplacements: MarketReplacement[];
  liquidationAdvice: string;
}

// Known Reserved List staples that are immune to reprint collapse
export const KNOWN_RESERVED_LIST = new Set([
  'black lotus', 'mox pearl', 'mox sapphire', 'mox jet', 'mox ruby', 'mox emerald',
  'ancestral recall', 'time walk', 'timetwister',
  'underground sea', 'volcanic island', 'tropical island', 'tundra', 'bayou',
  'badlands', 'savannah', 'scrubland', 'taiga', 'plateau',
  'gaeas cradle', "gaea's cradle", 'serra\'s sanctum', 'tolarian academy',
  'wheel of fortune', 'yawgmoth\'s will', 'survival of the fittest',
  'mox diamond', 'lion\'s eye diamond', 'city of traitors', 'grim monolith',
  'chains of mephistopheles', 'the abyss', 'nether void', 'eureka', 'drop of honey',
  'tabernacle at pendrell vale', 'the tabernacle at pendrell vale',
  'metalworker', 'treachery', 'palinchron', 'academy rector', 'replenish',
  'earthcraft', 'aluren', 'corpse dance', 'null rod', 'humility', 'slivers queen', "sliver queen",
  'gilded drake', 'intuition', 'time spiral', 'copy artifact', 'transmute artifact',
  'power artifact', 'volrath\'s stronghold', 'volraths stronghold', 'lake of the dead',
  'yavimaya hollow', 'mind over matter', 'memory jar', 'squandered resources',
  'anvil of bogardan', 'winding canyons', 'scorched ruins', 'bazaar of baghdad',
  'mishra\'s workshop', 'mishras workshop', 'candelabra of tawnos',
  'hazezon tamar', 'angus mackenzie'
]);

// Master registry of high-value staples to sub-$2 high-synergy equivalents
export const STAPLE_BUDGET_SWAP_REGISTRY: Record<string, { replacement: string; estimatedPrice: number; synergyNote: string }> = {
  'the ozolith': {
    replacement: 'Resourceful Defense',
    estimatedPrice: 1.49,
    synergyNote: 'Retains 90% of The Ozolith counter preservation with the bonus of instant-speed counter transfers.'
  },
  'esper sentinel': {
    replacement: 'Syphon Mind',
    estimatedPrice: 0.35,
    synergyNote: 'Guarantees drawing 3 cards while forcing discard, avoiding opponent mana payments altogether.'
  },
  'hardened scales': {
    replacement: 'Conclave Mentor',
    estimatedPrice: 0.39,
    synergyNote: 'Replicates the extra +1/+1 counter trigger on a creature body with incidental lifegain upon death.'
  },
  'inexorable tide': {
    replacement: 'Flux Channeler',
    estimatedPrice: 1.15,
    synergyNote: 'Triggers proliferate on all noncreature spells at 3 CMC rather than 5 CMC.'
  },
  'rhystic study': {
    replacement: 'Reconnaissance Mission',
    estimatedPrice: 0.42,
    synergyNote: 'Draws cards whenever any evasive or token creature connects, without giving opponents the option to pay.'
  },
  'cyclonic rift': {
    replacement: 'Aetherize',
    estimatedPrice: 0.45,
    synergyNote: 'Asymmetric 4-mana bounce targeting attacking creatures; punishes lethal alpha swings at budget price.'
  },
  'smothering tithe': {
    replacement: 'Monologue Tax',
    estimatedPrice: 0.85,
    synergyNote: 'Punishes opponents for multi-spell turns by producing Treasure tokens without the reprint price tag.'
  },
  'demonic tutor': {
    replacement: 'Diabolic Tutor',
    estimatedPrice: 0.75,
    synergyNote: 'Unconditional any-card tutor to hand; 2 extra mana saves $40+ in reprint risk.'
  },
  'vampiric tutor': {
    replacement: 'Wishclaw Talisman',
    estimatedPrice: 2.10,
    synergyNote: 'Cheap 2-mana any-card tutor; sacrifice or bounce it before opponent can activate it.'
  },
  'fierce guardianship': {
    replacement: "An Offer You Can't Refuse",
    estimatedPrice: 1.40,
    synergyNote: 'Hard counters any noncreature spell for a single blue mana; 2 treasures is negligible late-game.'
  },
  'deflecting swat': {
    replacement: 'Bolt Bend',
    estimatedPrice: 0.85,
    synergyNote: 'Costs only a single red mana if you control an 8-power creature or modified commander.'
  },
  'heroic intervention': {
    replacement: 'Wrap in Vigor',
    estimatedPrice: 0.79,
    synergyNote: 'Regenerates every creature you control for 2 mana, shielding against damage and destroy sweepers.'
  },
  'teferi\'s protection': {
    replacement: 'Clever Concealment',
    estimatedPrice: 3.50,
    synergyNote: 'Convoke allows phasing out all nonland permanents for free with untapped token/creature boards.'
  },
  'deepglow skate': {
    replacement: 'Contagion Engine',
    estimatedPrice: 2.80,
    synergyNote: 'Provides double proliferate every turn cycle while placing initial -1/-1 counters on enemy creatures.'
  }
};

/**
 * Calculates the reprint risk score (0-100) for a card
 */
export function calculateCardReprintRisk(name: string, priceUsd: number, typeLine = '', isFoil = false): number {
  const normalized = name.toLowerCase().trim();

  // Reserved list cards will NEVER be reprinted in tournament-legal sets
  if (KNOWN_RESERVED_LIST.has(normalized)) {
    return 0;
  }

  // Basic lands and sub-$2 cards have negligible liquidation urgency
  if (priceUsd < 2.0 || /basic land/i.test(typeLine)) {
    return 10;
  }

  let risk = 35;

  // High price invites reprint targeting in Masters/Horizon/Secret Lair sets
  if (priceUsd >= 50) risk += 40;
  else if (priceUsd >= 20) risk += 30;
  else if (priceUsd >= 10) risk += 15;
  else if (priceUsd >= 5) risk += 10;

  // Foils/Special treatments carry higher collapse risk upon reprint
  if (isFoil) risk += 10;

  return Math.min(100, Math.max(0, risk));
}

/**
 * Analyzes the market liquidation posture of any deck or collection list
 */
export function analyzeDeckMarketLiquidation(
  cards: DeckCard[],
  commander?: DeckCard
): PortfolioLiquidationReport {
  const allList: DeckCard[] = commander
    ? [{ ...commander, role: 'commander', quantity: 1 }, ...cards]
    : [...cards];

  let totalValue = 0;
  let vulnerableValue = 0;
  let reservedListValue = 0;
  let budgetCount = 0;

  const analyzedCards: MarketCard[] = [];
  const highRiskCards: MarketCard[] = [];
  const reservedCards: MarketCard[] = [];
  const budgetReplacements: MarketReplacement[] = [];

  for (const card of allList) {
    const price = card.currentPriceUsd ?? 0;
    const qty = card.quantity || 1;
    const cardVal = price * qty;
    totalValue += cardVal;

    const normalizedName = card.name.toLowerCase().trim();
    const isReserved = KNOWN_RESERVED_LIST.has(normalizedName);
    const riskScore = calculateCardReprintRisk(card.name, price, card.typeLine, card.foil);

    let riskLevel: MarketCard['riskLevel'] = 'Moderate';
    let action: MarketCard['action'] = 'Hold';
    let note = 'Stable market baseline.';

    if (isReserved) {
      riskLevel = 'Reserved List';
      action = 'Safe Vault';
      note = 'Protected by the Reserved List policy; immune to reprint depreciation.';
      reservedListValue += cardVal;
    } else if (price < 2.0) {
      riskLevel = 'Safe / Budget';
      action = 'Budget Staple';
      note = 'Low dollar exposure; optimal budget staple to keep in active deck.';
      budgetCount++;
    } else if (riskScore >= 70 || price >= 20) {
      riskLevel = 'Critical Risk';
      action = 'Liquidate / Sell';
      note = `High value ($${price.toFixed(2)}) without reprint immunity. Prime target for Masters or Commander set reprint.`;
      vulnerableValue += cardVal;
    } else if (riskScore >= 50 || price >= 10) {
      riskLevel = 'High Risk';
      action = 'Monitor Closely';
      note = `Moderate-to-high price ($${price.toFixed(2)}). Watch spoiler seasons for reprint announcements.`;
      vulnerableValue += cardVal;
    }

    // Check for budget replacement
    let replacement: MarketReplacement | undefined;
    const swapData = STAPLE_BUDGET_SWAP_REGISTRY[normalizedName];
    if (swapData && price > swapData.estimatedPrice) {
      const savings = Math.max(0, price - swapData.estimatedPrice);
      replacement = {
        originalCard: card.name,
        replacementCard: swapData.replacement,
        originalPrice: price,
        replacementPrice: swapData.estimatedPrice,
        savings: parseFloat(savings.toFixed(2)),
        synergyNote: swapData.synergyNote
      };
      budgetReplacements.push(replacement);
    }

    const marketCard: MarketCard = {
      id: card.id,
      name: card.name,
      currentPriceUsd: price,
      reprintRiskScore: riskScore,
      riskLevel,
      isReserved,
      action,
      recommendationNote: note,
      recommendedReplacement: replacement
    };

    analyzedCards.push(marketCard);
    if (riskLevel === 'Critical Risk' || riskLevel === 'High Risk') {
      highRiskCards.push(marketCard);
    } else if (isReserved) {
      reservedCards.push(marketCard);
    }
  }

  // Sort high risk cards by price descending
  highRiskCards.sort((a, b) => b.currentPriceUsd - a.currentPriceUsd);
  budgetReplacements.sort((a, b) => b.savings - a.savings);

  // Calculate portfolio health score (0-100)
  // Higher score = safe deck (more reserved list / budget staples, less vulnerable value)
  let healthScore = 100;
  if (totalValue > 0) {
    const vulnerableRatio = vulnerableValue / totalValue;
    healthScore = Math.max(10, Math.round((1 - vulnerableRatio) * 100));
  }

  // Construct tactical liquidation advice
  let liquidationAdvice = '';
  if (highRiskCards.length === 0) {
    liquidationAdvice = 'Your deck is extraordinarily insulated against reprint crashes. Nearly all card value is anchored in budget staples or low-exposure game pieces.';
  } else if (vulnerableValue > totalValue * 0.5) {
    liquidationAdvice = `High reprint vulnerability: $${vulnerableValue.toFixed(2)} (${Math.round((vulnerableValue / totalValue) * 100)}% of your deck's value) is concentrated in ${highRiskCards.length} expensive non-reserved staples. Consider cashing out top targets (e.g., ${highRiskCards.slice(0, 2).map((c) => c.name).join(', ')}) into budget equivalents before upcoming Masters/Commander sets.`;
  } else {
    liquidationAdvice = `Balanced market profile: ${highRiskCards.length} high-value staples ($${vulnerableValue.toFixed(2)}) carry reprint exposure, but the majority of your deck consists of safe budget pieces. Monitor ${highRiskCards[0]?.name || 'key staples'} closely during new set spoiler seasons.`;
  }

  return {
    totalDeckValueUsd: parseFloat(totalValue.toFixed(2)),
    vulnerableValueUsd: parseFloat(vulnerableValue.toFixed(2)),
    reservedListValueUsd: parseFloat(reservedListValue.toFixed(2)),
    budgetStaplesCount: budgetCount,
    totalCardsEvaluated: allList.length,
    portfolioHealthScore: healthScore,
    highRiskCards,
    reservedListCards: reservedCards,
    allCards: analyzedCards,
    budgetReplacements,
    liquidationAdvice
  };
}

