export interface CardSynergyInput {
  id: string;
  name: string;
  typeLine: string;
  oracleText?: string;
  manaCost?: string;
  cmc: number;
  category?: string;
}

export interface SynergyNode {
  id: string;
  type: string;
  data: {
    label: string;
    cardName: string;
    category: string;
    role: string;
    cmc: number;
  };
  position: { x: number; y: number };
}

export interface SynergyEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  style?: string;
}

export interface SynergyGraphData {
  nodes: SynergyNode[];
  edges: SynergyEdge[];
}

export interface SaltScoreAudit {
  totalSaltScore: number;
  averageSaltScore: number;
  highSaltCards: Array<{ name: string; score: number; reason: string }>;
  estimatedPowerBracket: 'Casual' | 'Focused' | 'Optimized' | 'Competitive';
  estimatedPowerNumber: number; // 1 - 10
}

// Well-known high salt cards in the EDH community
export const NOTORIOUS_SALT_CARDS: Record<string, { score: number; reason: string }> = {
  'Armageddon': { score: 4.2, reason: 'Mass Land Destruction' },
  'Winter Orb': { score: 3.9, reason: 'Symmetric Resource Lock' },
  'Stasis': { score: 3.8, reason: 'Total Untap Lock' },
  'Static Orb': { score: 3.7, reason: 'Turn Skipping / Untap Limiter' },
  'Ravages of War': { score: 3.6, reason: 'Mass Land Destruction' },
  'Vorinclex, Voice of Hunger': { score: 3.5, reason: 'Severe Mana Denial' },
  'Thassa\'s Oracle': { score: 3.4, reason: 'Fast Two-Card Instant Win' },
  'Demonic Consultation': { score: 3.3, reason: 'Tainted Pact / Thoracle Enabler' },
  'Cyclonic Rift': { score: 3.2, reason: 'Asymmetric Instant Board Reset' },
  'Expropriate': { score: 3.2, reason: 'Multiple Extra Turns + Theft' },
  'Rhystic Study': { score: 3.0, reason: 'Continuous Tax & Heavy Card Advantage' },
  'Smothering Tithe': { score: 3.0, reason: 'Passive Treasure Generation on Draw' },
  'Drannith Magistrate': { score: 3.0, reason: 'Commander Cast Lockout' },
  'Opposition Agent': { score: 3.1, reason: 'Search Theft & Total Tutor Denial' },
  'Jin-Gitaxias, Core Augur': { score: 3.3, reason: 'Complete Hand Destruction' },
  'Tergrid, God of Fright': { score: 3.4, reason: 'Mass Sacrifice Theft' }
};

// Known combo pairs for recursion & win-con graphs
const NOTABLE_COMBO_PAIRS: Array<{
  pair: [string, string];
  interaction: string;
  isInfinite: boolean;
}> = [
  {
    pair: ['Thassa\'s Oracle', 'Demonic Consultation'],
    interaction: 'Exiles library for immediate game victory',
    isInfinite: false
  },
  {
    pair: ['Thassa\'s Oracle', 'Tainted Pact'],
    interaction: 'Exiles library for immediate game victory',
    isInfinite: false
  },
  {
    pair: ['Isochron Scepter', 'Dramatic Reversal'],
    interaction: 'Infinite untap & infinite mana with nonland mana rocks >= 3',
    isInfinite: true
  },
  {
    pair: ['Kiki-Jiki, Mirror Breaker', 'Deceiver Exarch'],
    interaction: 'Infinite hasty token copies for combat damage',
    isInfinite: true
  },
  {
    pair: ['Kiki-Jiki, Mirror Breaker', 'Restoration Angel'],
    interaction: 'Infinite hasty token copies for combat damage',
    isInfinite: true
  },
  {
    pair: ['Heliod, Sun-Crowned', 'Walking Ballista'],
    interaction: 'Infinite ping damage and infinite lifegain',
    isInfinite: true
  },
  {
    pair: ['Ashnod\'s Altar', 'Nim Deathmantle'],
    interaction: 'Recursion loop generating infinite ETB/death triggers with token creators',
    isInfinite: true
  },
  {
    pair: ['Sanguine Bond', 'Exquisite Blood'],
    interaction: 'Infinite life loss / lifegain trigger drain chain',
    isInfinite: true
  }
];

/**
 * Categorizes a card into a functional deck role
 */
export function classifyCardRole(card: CardSynergyInput): 'commander' | 'ramp' | 'draw' | 'engine' | 'interaction' | 'payoff' | 'land' | 'other' {
  if (card.category === 'commander') return 'commander';
  if (/land/i.test(card.typeLine)) return 'land';

  const text = (card.oracleText || '').toLowerCase();

  // Ramp
  if (
    /add (one|two|three|\d+|any|\{[wubrgc\d]\})?.*mana/i.test(text) ||
    /add \{[wubrgc\d]\}/i.test(text) ||
    /search your library for a (basic )?land/i.test(text) ||
    /create (a )?treasure token/i.test(text)
  ) {
    if (card.cmc <= 4) return 'ramp';
  }

  // Draw
  if (
    /draw (a|\d+) cards?/i.test(text) ||
    /look at the top.*put.*into your hand/i.test(text) ||
    /impulse/i.test(text)
  ) {
    return 'draw';
  }

  // Interaction / Removal / Counterspells
  if (
    /counter target/i.test(text) ||
    /destroy (target|all)/i.test(text) ||
    /exile (target|all)/i.test(text) ||
    /deals? \d+ damage to (target|any)/i.test(text) ||
    /return target.*to its owner's hand/i.test(text)
  ) {
    return 'interaction';
  }

  // Payoff / Win-con
  if (
    /you win the game/i.test(text) ||
    /opponents? lose(s)? the game/i.test(text) ||
    /extra turn/i.test(text) ||
    card.cmc >= 6
  ) {
    return 'payoff';
  }

  // Engine
  if (
    /whenever/i.test(text) ||
    /at the beginning of/i.test(text) ||
    /return.*from your graveyard/i.test(text)
  ) {
    return 'engine';
  }

  return 'other';
}

const FREE_SPELLS = new Set(['Force of Will', 'Force of Negation', 'Fierce Guardianship', 'Deflecting Swat', 'Pact of Negation']);
const FAST_MANA = new Set(['Sol Ring', 'Mana Vault', 'Chrome Mox', 'Mox Diamond', 'Lotus Petal']);

/**
 * Audits Salt Score & Power Level of a deck
 */
export function auditDeckSaltAndPower(cards: CardSynergyInput[]): SaltScoreAudit {
  let totalSalt = 0;
  const highSaltList: Array<{ name: string; score: number; reason: string }> = [];

  let hasThoracle = false;
  let hasConsultationOrPact = false;
  let hasFreeSpells = 0;
  let fastManaCount = 0;

  for (const card of cards) {
    const saltInfo = NOTORIOUS_SALT_CARDS[card.name];
    if (saltInfo) {
      totalSalt += saltInfo.score;
      highSaltList.push({
        name: card.name,
        score: saltInfo.score,
        reason: saltInfo.reason
      });
    }

    if (card.name === "Thassa's Oracle") {
      hasThoracle = true;
    } else if (card.name === 'Demonic Consultation' || card.name === 'Tainted Pact') {
      hasConsultationOrPact = true;
    }

    if (FREE_SPELLS.has(card.name)) {
      hasFreeSpells++;
    }

    if (FAST_MANA.has(card.name)) {
      fastManaCount++;
    }
  }

  const avgSalt = cards.length > 0 ? Number((totalSalt / cards.length).toFixed(3)) : 0;

  // Check fast mana and combo density to determine power level
  const hasThoracleCombo = hasThoracle && hasConsultationOrPact;

  let power = 5.0; // Baseline casual-focused
  if (highSaltList.length > 3) power += 1.5;
  if (hasThoracleCombo) power += 2.5;
  if (hasFreeSpells >= 2) power += 1.0;
  if (fastManaCount >= 3) power += 1.0;

  const boundedPower = Math.min(10, Math.max(1, Number(power.toFixed(1))));

  let bracket: 'Casual' | 'Focused' | 'Optimized' | 'Competitive' = 'Focused';
  if (boundedPower <= 4.5) bracket = 'Casual';
  else if (boundedPower <= 6.5) bracket = 'Focused';
  else if (boundedPower <= 8.5) bracket = 'Optimized';
  else bracket = 'Competitive';

  return {
    totalSaltScore: Number(totalSalt.toFixed(2)),
    averageSaltScore: avgSalt,
    highSaltCards: highSaltList,
    estimatedPowerBracket: bracket,
    estimatedPowerNumber: boundedPower
  };
}

/**
 * Generates interactive Svelte Flow nodes and edges for combo and synergy loops
 */
export function generateSynergyGraph(cards: CardSynergyInput[]): SynergyGraphData {
  const nodes: SynergyNode[] = [];
  const edges: SynergyEdge[] = [];
  const cardMap = new Map<string, CardSynergyInput>();

  cards.forEach(c => cardMap.set(c.name, c));

  // Find commanders
  const commanders = cards.filter(c => c.category === 'commander');
  let currentY = 50;

  // Add commander nodes at root
  commanders.forEach((cmd, idx) => {
    nodes.push({
      id: `cmd-${cmd.id || idx}`,
      type: 'commanderNode',
      data: {
        label: cmd.name,
        cardName: cmd.name,
        category: 'commander',
        role: 'Commander',
        cmc: cmd.cmc
      },
      position: { x: 300 + idx * 220, y: currentY }
    });
  });

  currentY += 150;

  // Check known combo interactions
  let comboIdx = 0;
  for (const combo of NOTABLE_COMBO_PAIRS) {
    const cardA = cardMap.get(combo.pair[0]);
    const cardB = cardMap.get(combo.pair[1]);

    if (cardA && cardB) {
      const nodeAId = `node-${cardA.id || combo.pair[0]}`;
      const nodeBId = `node-${cardB.id || combo.pair[1]}`;

      if (!nodes.some(n => n.id === nodeAId)) {
        nodes.push({
          id: nodeAId,
          type: 'comboNode',
          data: {
            label: cardA.name,
            cardName: cardA.name,
            category: 'engine',
            role: 'Combo Piece',
            cmc: cardA.cmc
          },
          position: { x: 100 + (comboIdx % 3) * 260, y: currentY }
        });
      }

      if (!nodes.some(n => n.id === nodeBId)) {
        nodes.push({
          id: nodeBId,
          type: 'comboNode',
          data: {
            label: cardB.name,
            cardName: cardB.name,
            category: 'payoff',
            role: 'Win Condition',
            cmc: cardB.cmc
          },
          position: { x: 100 + (comboIdx % 3) * 260, y: currentY + 120 }
        });
      }

      edges.push({
        id: `edge-${cardA.id}-${cardB.id}`,
        source: nodeAId,
        target: nodeBId,
        label: combo.interaction,
        animated: combo.isInfinite,
        style: combo.isInfinite ? 'stroke: #EF4444; stroke-width: 2;' : 'stroke: #38BDF8;'
      });

      // Link to commander if applicable
      if (commanders.length > 0) {
        edges.push({
          id: `edge-cmd-${nodeAId}`,
          source: `cmd-${commanders[0].id || 0}`,
          target: nodeAId,
          label: 'Enables Engine',
          animated: false
        });
      }

      comboIdx++;
    }
  }

  // If no known combo pairs found, build theme/engine chain from high-impact cards
  if (edges.length === 0 && cards.length > 0) {
    const engines = cards.filter(c => classifyCardRole(c) === 'engine').slice(0, 4);
    const payoffs = cards.filter(c => classifyCardRole(c) === 'payoff').slice(0, 3);

    engines.forEach((eng, i) => {
      const engId = `node-eng-${eng.id || i}`;
      nodes.push({
        id: engId,
        type: 'engineNode',
        data: {
          label: eng.name,
          cardName: eng.name,
          category: 'engine',
          role: 'Value Engine',
          cmc: eng.cmc
        },
        position: { x: 80 + i * 220, y: currentY }
      });

      if (commanders.length > 0) {
        edges.push({
          id: `edge-cmd-eng-${i}`,
          source: `cmd-${commanders[0].id || 0}`,
          target: engId,
          label: 'Synergizes With',
          animated: true
        });
      }
    });

    payoffs.forEach((pay, j) => {
      const payId = `node-pay-${pay.id || j}`;
      nodes.push({
        id: payId,
        type: 'payoffNode',
        data: {
          label: pay.name,
          cardName: pay.name,
          category: 'payoff',
          role: 'Win-Con Payoff',
          cmc: pay.cmc
        },
        position: { x: 140 + j * 240, y: currentY + 140 }
      });

      if (engines.length > 0) {
        edges.push({
          id: `edge-eng-pay-${j}`,
          source: `node-eng-${engines[j % engines.length].id || (j % engines.length)}`,
          target: payId,
          label: 'Powers Win-Con',
          animated: false
        });
      }
    });
  }

  return { nodes, edges };
}

