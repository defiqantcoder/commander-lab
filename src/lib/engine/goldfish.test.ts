import { describe, it, expect } from 'vitest';
import { GoldfishSimulator, type SimCard } from './goldfish';

describe('GoldfishSimulator', () => {
  function makeMockDeck(): SimCard[] {
    const deck: SimCard[] = [
      {
        id: 'cmd-1',
        name: 'Krenko, Mob Boss',
        typeLine: 'Legendary Creature — Goblin Warrior',
        cmc: 4,
        category: 'commander',
        isCommander: true
      }
    ];

    // 38 Mountains
    for (let i = 1; i <= 38; i++) {
      deck.push({
        id: `mtn-${i}`,
        name: 'Mountain',
        typeLine: 'Basic Land — Mountain',
        cmc: 0,
        category: 'land'
      });
    }

    // 10 Ramp spells (Sol Ring, Arcane Signet, etc.)
    for (let i = 1; i <= 10; i++) {
      deck.push({
        id: `ramp-${i}`,
        name: `Ramp Rock ${i}`,
        typeLine: 'Artifact',
        cmc: 2,
        category: 'ramp',
        oracleText: '{T}: Add {R}.'
      });
    }

    // 51 Spells
    for (let i = 1; i <= 51; i++) {
      deck.push({
        id: `spell-${i}`,
        name: `Goblin Spell ${i}`,
        typeLine: 'Creature — Goblin',
        cmc: (i % 4) + 1,
        category: 'engine'
      });
    }

    return deck;
  }

  it('initializes with 7 cards in hand and Commander in Command Zone', () => {
    const sim = new GoldfishSimulator(makeMockDeck());
    expect(sim.hand.length).toBe(7);
    expect(sim.commandZone.length).toBe(1);
    expect(sim.commandZone[0].name).toBe('Krenko, Mob Boss');
    expect(sim.library.length).toBe(92);
  });

  it('evaluates opening hand quality accurately', () => {
    const sim = new GoldfishSimulator(makeMockDeck());
    const evalResult = sim.evaluateHand();
    expect(['Excellent', 'Good', 'Risky', 'Unplayable']).toContain(evalResult.quality);
  });

  it('runs automated 5-turn simulation and tracks mana progression', () => {
    const sim = new GoldfishSimulator(makeMockDeck());
    const result = sim.runSimulation();

    expect(result.turns.length).toBe(5);
    expect(result.metrics.turn3ManaCapacity).toBeGreaterThanOrEqual(1);
    expect(result.metrics.manaEfficiencyPercentage).toBeGreaterThanOrEqual(0);
    expect(result.turns[4].turnNumber).toBe(5);
  });
});

