import type { SimCard } from './goldfish';

export interface BenchmarkDeck {
  id: string;
  name: string;
  commanderName: string;
  archetype: 'Aggro' | 'Control' | 'Midrange' | 'Combo';
  description: string;
  cards: SimCard[];
}

export interface MatchTurnLog {
  turn: number;
  activePlayer: 'player' | 'opponent';
  manaAvailable: number;
  actions: string[];
  playerLife: number;
  opponentLife: number;
  playerBoardCount: number;
  opponentBoardCount: number;
}

export interface MatchupReport {
  playerDeckName: string;
  opponentDeckName: string;
  gamesSimulated: number;
  playerWins: number;
  opponentWins: number;
  averageWinningTurn: number;
  turnLogs: MatchTurnLog[];
  identifiedWeaknesses: string[];
  keyTurningPoints: string[];
  recommendedImprovements: {
    suggestedAdditions: Array<{ cardName: string; reason: string; role: string }>;
    suggestedCuts: Array<{ cardName: string; reason: string }>;
    coachingAdvice: string;
  };
}

// Built-in EDHREC archetype benchmark decks for zero-setup AI sparring
export const EDHREC_BENCHMARK_DECKS: BenchmarkDeck[] = [
  {
    id: 'edhrec-krenko-aggro',
    name: 'EDHREC Benchmark: Krenko Goblin Aggro',
    commanderName: 'Krenko, Mob Boss',
    archetype: 'Aggro',
    description: 'Blistering fast mono-red token beatdown. Tests early interaction and board-wipe speed.',
    cards: [
      { id: 'b-cmd-1', name: 'Krenko, Mob Boss', typeLine: 'Legendary Creature — Goblin Warrior', cmc: 4, category: 'commander', isCommander: true },
      ...Array.from({ length: 36 }, (_, i) => ({ id: `b-mtn-${i}`, name: 'Mountain', typeLine: 'Basic Land — Mountain', cmc: 0, category: 'land' })),
      ...Array.from({ length: 10 }, (_, i) => ({ id: `b-ramp-${i}`, name: `Sol Ring / Mana Rock ${i}`, typeLine: 'Artifact', cmc: 2, category: 'ramp' })),
      ...Array.from({ length: 25 }, (_, i) => ({ id: `b-goblin-${i}`, name: `Goblin Raider ${i}`, typeLine: 'Creature — Goblin', cmc: (i % 3) + 1, category: 'engine' })),
      ...Array.from({ length: 15 }, (_, i) => ({ id: `b-payoff-${i}`, name: `Goblin Chieftain ${i}`, typeLine: 'Creature — Goblin', cmc: (i % 3) + 3, category: 'payoff' })),
      ...Array.from({ length: 13 }, (_, i) => ({ id: `b-removal-${i}`, name: `Lightning Bolt ${i}`, typeLine: 'Instant', cmc: 1, category: 'interaction' }))
    ]
  },
  {
    id: 'edhrec-talrand-control',
    name: 'EDHREC Benchmark: Talrand Spellslinger Control',
    commanderName: 'Talrand, Sky Summoner',
    archetype: 'Control',
    description: 'Heavy counterspell density and steady evasive 2/2 Drake generation.',
    cards: [
      { id: 'b-cmd-2', name: 'Talrand, Sky Summoner', typeLine: 'Legendary Creature — Merfolk Wizard', cmc: 4, category: 'commander', isCommander: true },
      ...Array.from({ length: 37 }, (_, i) => ({ id: `b-isl-${i}`, name: 'Island', typeLine: 'Basic Land — Island', cmc: 0, category: 'land' })),
      ...Array.from({ length: 10 }, (_, i) => ({ id: `b-rock-${i}`, name: `Arcane Signet ${i}`, typeLine: 'Artifact', cmc: 2, category: 'ramp' })),
      ...Array.from({ length: 22 }, (_, i) => ({ id: `b-counter-${i}`, name: `Counterspell ${i}`, typeLine: 'Instant', cmc: 2, category: 'interaction' })),
      ...Array.from({ length: 18 }, (_, i) => ({ id: `b-cantrip-${i}`, name: `Ponder / Preordain ${i}`, typeLine: 'Sorcery', cmc: 1, category: 'draw' })),
      ...Array.from({ length: 12 }, (_, i) => ({ id: `b-wipe-${i}`, name: `Cyclonic Rift ${i}`, typeLine: 'Instant', cmc: (i % 3) + 4, category: 'interaction' }))
    ]
  },
  {
    id: 'edhrec-meren-midrange',
    name: 'EDHREC Benchmark: Meren Graveyard Midrange',
    commanderName: 'Meren of Clan Nel Toth',
    archetype: 'Midrange',
    description: 'Relentless attrition with sacrifice outlets and end-step creature reanimation.',
    cards: [
      { id: 'b-cmd-3', name: 'Meren of Clan Nel Toth', typeLine: 'Legendary Creature — Human Shaman', cmc: 4, category: 'commander', isCommander: true },
      ...Array.from({ length: 36 }, (_, i) => ({ id: `b-land-${i}`, name: `Overgrown Tomb ${i}`, typeLine: 'Land', cmc: 0, category: 'land' })),
      ...Array.from({ length: 12 }, (_, i) => ({ id: `b-dork-${i}`, name: `Llanowar Elves ${i}`, typeLine: 'Creature — Elf Druid', cmc: 1, category: 'ramp' })),
      ...Array.from({ length: 20 }, (_, i) => ({ id: `b-sac-${i}`, name: `Sakura-Tribe Elder ${i}`, typeLine: 'Creature', cmc: 2, category: 'engine' })),
      ...Array.from({ length: 16 }, (_, i) => ({ id: `b-attrition-${i}`, name: `Fleshbag Marauder ${i}`, typeLine: 'Creature', cmc: 3, category: 'interaction' })),
      ...Array.from({ length: 15 }, (_, i) => ({ id: `b-bomb-${i}`, name: `Grave Titan ${i}`, typeLine: 'Creature', cmc: 6, category: 'payoff' }))
    ]
  }
];

/**
 * Creates an authentic 100-card simulated sparring opponent anchored by any commander.
 */
export function createCustomOpponentDeck(
  commanderName: string,
  archetype: 'Aggro' | 'Control' | 'Midrange' | 'Combo' = 'Midrange'
): BenchmarkDeck {
  const isAggro = archetype === 'Aggro';
  const isControl = archetype === 'Control';

  const landCount = isAggro ? 35 : isControl ? 38 : 36;
  const rampCount = isAggro ? 10 : 12;
  const removalCount = isControl ? 20 : 12;
  const engineCount = isAggro ? 28 : isControl ? 15 : 24;
  const payoffCount = 100 - (1 + landCount + rampCount + removalCount + engineCount);

  return {
    id: `custom-opp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: `Custom Benchmark: ${commanderName}`,
    commanderName,
    archetype,
    description: `Custom sparring benchmark anchored by ${commanderName} (${archetype}).`,
    cards: [
      { id: 'c-cmd', name: commanderName, typeLine: 'Legendary Creature', cmc: 4, category: 'commander', isCommander: true },
      ...Array.from({ length: landCount }, (_, i) => ({ id: `c-land-${i}`, name: 'Command Tower / Land', typeLine: 'Land', cmc: 0, category: 'land' })),
      ...Array.from({ length: rampCount }, (_, i) => ({ id: `c-ramp-${i}`, name: `Arcane Signet ${i}`, typeLine: 'Artifact', cmc: 2, category: 'ramp' })),
      ...Array.from({ length: engineCount }, (_, i) => ({ id: `c-eng-${i}`, name: `Synergy Engine ${i}`, typeLine: 'Creature', cmc: (i % 3) + 2, category: 'engine' })),
      ...Array.from({ length: removalCount }, (_, i) => ({ id: `c-rem-${i}`, name: `Removal / Interaction ${i}`, typeLine: 'Instant', cmc: (i % 2) + 1, category: 'interaction' })),
      ...Array.from({ length: payoffCount }, (_, i) => ({ id: `c-pay-${i}`, name: `Key Payoff ${i}`, typeLine: 'Spell', cmc: (i % 3) + 4, category: 'payoff' }))
    ]
  };
}

export class MatchupSimulator {
  private deckA: SimCard[];
  private deckB: SimCard[];
  private deckAName: string;
  private deckBName: string;

  constructor(deckA: SimCard[], deckB: SimCard[], deckAName = 'Your Deck', deckBName = 'Opponent Deck') {
    this.deckA = deckA;
    this.deckB = deckB;
    this.deckAName = deckAName;
    this.deckBName = deckBName;
  }

  /**
   * Simulates a single game between two decks up to 8 turns
   */
  public simulateGame(): {
    winner: 'player' | 'opponent' | 'draw';
    turnEnded: number;
    logs: MatchTurnLog[];
    playerStalled: boolean;
    playerSufferedEarlyDamage: boolean;
  } {
    let playerLife = 40;
    let opponentLife = 40;
    let playerMana = 0;
    let opponentMana = 0;
    let playerBoard: SimCard[] = [];
    let opponentBoard: SimCard[] = [];
    let playerHand = [...this.deckA.slice(0, 7)];
    let opponentHand = [...this.deckB.slice(0, 7)];
    let playerStalled = false;
    let playerSufferedEarlyDamage = false;

    const logs: MatchTurnLog[] = [];

    for (let turn = 1; turn <= 8; turn++) {
      // --- PLAYER TURN ---
      playerMana = Math.min(turn + playerBoard.filter(c => /ramp/i.test(c.category || '')).length, 12);
      const playerActions: string[] = [];

      // Check stall condition: Turn 3+ with <= 2 mana
      if (turn === 3 && playerMana <= 2) {
        playerStalled = true;
      }

      // Player casts spells
      const playable = playerHand.filter(c => c.cmc <= playerMana && !/land/i.test(c.typeLine));
      if (playable.length > 0) {
        const spell = playable[0];
        playerHand = playerHand.filter(c => c.id !== spell.id);
        playerBoard.push(spell);
        playerActions.push(`Cast ${spell.name} (CMC ${spell.cmc})`);

        // If removal spell, remove opponent threat
        if (/interaction/i.test(spell.category || '') && opponentBoard.length > 0) {
          const target = opponentBoard.pop()!;
          playerActions.push(`Removed opponent threat: ${target.name}`);
        }
      }

      // Player attacks
      const playerAttackPower = playerBoard.filter(c => /creature/i.test(c.typeLine)).length * 2;
      if (playerAttackPower > 0) {
        opponentLife = Math.max(0, opponentLife - playerAttackPower);
        playerActions.push(`Attacked for ${playerAttackPower} damage (Opponent Life: ${opponentLife})`);
      }

      logs.push({
        turn,
        activePlayer: 'player',
        manaAvailable: playerMana,
        actions: playerActions,
        playerLife,
        opponentLife,
        playerBoardCount: playerBoard.length,
        opponentBoardCount: opponentBoard.length
      });

      if (opponentLife <= 0) {
        return { winner: 'player', turnEnded: turn, logs, playerStalled, playerSufferedEarlyDamage };
      }

      // --- OPPONENT TURN ---
      opponentMana = Math.min(turn + opponentBoard.filter(c => /ramp/i.test(c.category || '')).length, 12);
      const opponentActions: string[] = [];

      const oppPlayable = opponentHand.filter(c => c.cmc <= opponentMana && !/land/i.test(c.typeLine));
      if (oppPlayable.length > 0) {
        const oppSpell = oppPlayable[0];
        opponentHand = opponentHand.filter(c => c.id !== oppSpell.id);
        opponentBoard.push(oppSpell);
        opponentActions.push(`Opponent cast ${oppSpell.name} (CMC ${oppSpell.cmc})`);

        if (/interaction/i.test(oppSpell.category || '') && playerBoard.length > 0) {
          const removed = playerBoard.pop()!;
          opponentActions.push(`Opponent removed your permanent: ${removed.name}`);
        }
      }

      const oppAttackPower = opponentBoard.filter(c => /creature/i.test(c.typeLine)).length * 2;
      if (oppAttackPower > 0) {
        playerLife = Math.max(0, playerLife - oppAttackPower);
        opponentActions.push(`Opponent attacked for ${oppAttackPower} damage (Your Life: ${playerLife})`);
        if (turn <= 4 && oppAttackPower >= 4) {
          playerSufferedEarlyDamage = true;
        }
      }

      logs.push({
        turn,
        activePlayer: 'opponent',
        manaAvailable: opponentMana,
        actions: opponentActions,
        playerLife,
        opponentLife,
        playerBoardCount: playerBoard.length,
        opponentBoardCount: opponentBoard.length
      });

      if (playerLife <= 0) {
        return { winner: 'opponent', turnEnded: turn, logs, playerStalled, playerSufferedEarlyDamage };
      }
    }

    const winner = playerLife > opponentLife ? 'player' : 'opponent';
    return { winner, turnEnded: 8, logs, playerStalled, playerSufferedEarlyDamage };
  }

  /**
   * Runs a 5-game sparring match and generates targeted AI deck coaching
   */
  public runMatchupSeries(gameCount = 5): MatchupReport {
    let playerWins = 0;
    let opponentWins = 0;
    let totalTurns = 0;
    let stalledGames = 0;
    let aggroWeakGames = 0;
    let sampleLogs: MatchTurnLog[] = [];

    for (let g = 0; g < gameCount; g++) {
      const result = this.simulateGame();
      if (result.winner === 'player') playerWins++;
      else opponentWins++;

      totalTurns += result.turnEnded;
      if (result.playerStalled) stalledGames++;
      if (result.playerSufferedEarlyDamage) aggroWeakGames++;
      if (g === 0) sampleLogs = result.logs;
    }

    const avgTurn = Number((totalTurns / gameCount).toFixed(1));
    const weaknesses: string[] = [];
    const turningPoints: string[] = [];

    if (stalledGames >= 2) {
      weaknesses.push('Mana Curve Bottleneck: Stalled on Turn 3 in multiple test games due to low land/ramp density.');
      turningPoints.push('Turn 3: Insufficient early ramp left mana unspent while opponent developed board.');
    }
    if (aggroWeakGames >= 2) {
      weaknesses.push('Early Defensive Gap: Suffered heavy unblocked combat damage prior to Turn 4.');
      turningPoints.push('Turns 2–3: Lack of low-cost blockers or spot removal permitted early opponent aggression.');
    }
    if (opponentWins > playerWins) {
      weaknesses.push(`Negative Clock Disparity: ${this.deckBName} successfully established faster board velocity.`);
    }

    if (weaknesses.length === 0) {
      weaknesses.push('Stable Baseline: Deck curved out reliably across Turn 1–5 without major structural stalls.');
      turningPoints.push('Turn 4: Stabilized board and successfully transitioned into mid-game engine value.');
    }

    // Generate targeted suggestions based on identified weaknesses
    const suggestedAdditions = [];
    const suggestedCuts = [];

    if (stalledGames >= 2) {
      suggestedAdditions.push(
        { cardName: 'Arcane Signet', role: 'Ramp', reason: 'Guarantees reliable 2-mana fixing to prevent Turn 3 stalls.' },
        { cardName: 'Fellwar Stone', role: 'Ramp', reason: 'Unconditional early acceleration to smooth out the opening hand curve.' }
      );
      suggestedCuts.push({ cardName: 'Highest CMC Payoff (>6 CMC)', reason: 'Cuts top-heavy spells that sit uncastable during opening turns.' });
    }

    if (aggroWeakGames >= 2) {
      suggestedAdditions.push(
        { cardName: 'Swords to Plowshares', role: 'Interaction', reason: 'Instant-speed 1-mana answer to fast commanders and attackers.' },
        { cardName: 'Toxic Deluge', role: 'Board Wipe', reason: 'Low-cost reset to stabilize before combat damage becomes lethal.' }
      );
      suggestedCuts.push({ cardName: 'Slow Do-Nothing Enchantment', reason: 'Replace slow, high-maintenance value engines with immediate interaction.' });
    }

    if (suggestedAdditions.length === 0) {
      suggestedAdditions.push(
        { cardName: 'Heroic Intervention', role: 'Protection', reason: 'Protects established board against opponent reset spells.' }
      );
      suggestedCuts.push({ cardName: 'Conditional Cantrip', reason: 'Optimize slot for higher-impact protection.' });
    }

    return {
      playerDeckName: this.deckAName,
      opponentDeckName: this.deckBName,
      gamesSimulated: gameCount,
      playerWins,
      opponentWins,
      averageWinningTurn: avgTurn,
      turnLogs: sampleLogs,
      identifiedWeaknesses: weaknesses,
      keyTurningPoints: turningPoints,
      recommendedImprovements: {
        suggestedAdditions,
        suggestedCuts,
        coachingAdvice: playerWins >= opponentWins
          ? `Strong performance (${playerWins}/${gameCount} wins). Solid core curve against ${this.deckBName}. Focus on tightening protection.`
          : `Sparring identified vulnerability against ${this.deckBName} (${opponentWins}/${gameCount} losses). Bolster early interaction and mana fixing to prevent falling behind.`
      }
    };
  }
}

