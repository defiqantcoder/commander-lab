import { describe, it, expect } from 'vitest';
import { MatchupSimulator, EDHREC_BENCHMARK_DECKS, createCustomOpponentDeck } from './matchup';
import type { SimCard } from './goldfish';

describe('MatchupSimulator', () => {
  const testDeck: SimCard[] = [
    { id: '1', name: 'Atraxa, Praetors\' Voice', typeLine: 'Legendary Creature', cmc: 4, category: 'commander' },
    ...Array.from({ length: 36 }, (_, i) => ({ id: `land-${i}`, name: 'Plains', typeLine: 'Basic Land', cmc: 0, category: 'land' })),
    ...Array.from({ length: 12 }, (_, i) => ({ id: `ramp-${i}`, name: `Arcane Signet ${i}`, typeLine: 'Artifact', cmc: 2, category: 'ramp' })),
    ...Array.from({ length: 25 }, (_, i) => ({ id: `creature-${i}`, name: `Knight ${i}`, typeLine: 'Creature', cmc: 3, category: 'engine' })),
    ...Array.from({ length: 15 }, (_, i) => ({ id: `removal-${i}`, name: `Swords ${i}`, typeLine: 'Instant', cmc: 1, category: 'interaction' })),
    ...Array.from({ length: 11 }, (_, i) => ({ id: `bomb-${i}`, name: `Titan ${i}`, typeLine: 'Creature', cmc: 6, category: 'payoff' }))
  ];

  it('contains valid pre-configured EDHREC benchmark decks', () => {
    expect(EDHREC_BENCHMARK_DECKS.length).toBeGreaterThanOrEqual(3);
    const krenko = EDHREC_BENCHMARK_DECKS.find(d => d.id === 'edhrec-krenko-aggro');
    expect(krenko).toBeDefined();
    expect(krenko?.cards.length).toBe(100);
  });

  it('simulates a single game with turn logs and life totals', () => {
    const oppDeck = EDHREC_BENCHMARK_DECKS[0].cards;
    const sim = new MatchupSimulator(testDeck, oppDeck, 'Test Atraxa', 'EDHREC Krenko');
    const result = sim.simulateGame();

    expect(['player', 'opponent', 'draw']).toContain(result.winner);
    expect(result.turnEnded).toBeGreaterThanOrEqual(1);
    expect(result.logs.length).toBeGreaterThanOrEqual(1);
    expect(result.logs[0].playerLife).toBe(40);
  });

  it('runs a 5-game series and produces targeted coaching improvements', () => {
    const oppDeck = EDHREC_BENCHMARK_DECKS[0].cards;
    const sim = new MatchupSimulator(testDeck, oppDeck, 'Test Atraxa', 'EDHREC Krenko');
    const report = sim.runMatchupSeries(5);

    expect(report.gamesSimulated).toBe(5);
    expect(report.playerWins + report.opponentWins).toBe(5);
    expect(report.identifiedWeaknesses.length).toBeGreaterThanOrEqual(1);
    expect(report.recommendedImprovements.suggestedAdditions.length).toBeGreaterThanOrEqual(1);
    expect(report.recommendedImprovements.coachingAdvice.length).toBeGreaterThan(10);
  });

  it('creates an authentic 100-card custom opponent deck for any commander', () => {
    const custom = createCustomOpponentDeck('Edgar Markov', 'Aggro');
    expect(custom.cards.length).toBe(100);
    expect(custom.commanderName).toBe('Edgar Markov');
    expect(custom.archetype).toBe('Aggro');
    expect(custom.cards[0].name).toBe('Edgar Markov');
    expect(custom.cards[0].isCommander).toBe(true);

    // Verify it spars properly
    const sim = new MatchupSimulator(testDeck, custom.cards, 'Player Deck', custom.name);
    const report = sim.runMatchupSeries(3);
    expect(report.gamesSimulated).toBe(3);
    expect(report.playerWins + report.opponentWins).toBe(3);
  });
});

