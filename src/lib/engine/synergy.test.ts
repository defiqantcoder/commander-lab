import { describe, it, expect } from 'vitest';
import {
  classifyCardRole,
  auditDeckSaltAndPower,
  generateSynergyGraph,
  type CardSynergyInput
} from './synergy';

describe('SynergyEngine', () => {
  it('classifies cards accurately into functional roles', () => {
    const rampCard: CardSynergyInput = {
      id: '1',
      name: 'Arcane Signet',
      typeLine: 'Artifact',
      oracleText: '{T}: Add one mana of any color in your commander\'s color identity.',
      cmc: 2
    };
    expect(classifyCardRole(rampCard)).toBe('ramp');

    const drawCard: CardSynergyInput = {
      id: '2',
      name: 'Rhystic Study',
      typeLine: 'Enchantment',
      oracleText: 'Whenever an opponent casts a spell, you may draw a card unless that player pays {1}.',
      cmc: 3
    };
    expect(classifyCardRole(drawCard)).toBe('draw');

    const removalCard: CardSynergyInput = {
      id: '3',
      name: 'Swords to Plowshares',
      typeLine: 'Instant',
      oracleText: 'Exile target creature.',
      cmc: 1
    };
    expect(classifyCardRole(removalCard)).toBe('interaction');
  });

  it('audits salt scores and detects notorious salt cards', () => {
    const cards: CardSynergyInput[] = [
      { id: '1', name: 'Armageddon', typeLine: 'Sorcery', cmc: 4 },
      { id: '2', name: 'Winter Orb', typeLine: 'Artifact', cmc: 2 },
      { id: '3', name: 'Thassa\'s Oracle', typeLine: 'Creature', cmc: 2 },
      { id: '4', name: 'Demonic Consultation', typeLine: 'Instant', cmc: 1 }
    ];

    const audit = auditDeckSaltAndPower(cards);
    expect(audit.highSaltCards.length).toBe(4);
    expect(audit.totalSaltScore).toBeGreaterThan(10);
    expect(audit.estimatedPowerBracket).toBe('Competitive');
  });

  it('generates Svelte Flow nodes and edges for combo pairs', () => {
    const cards: CardSynergyInput[] = [
      { id: 'c1', name: 'Urza, Lord High Artificer', typeLine: 'Legendary Creature', cmc: 4, category: 'commander' },
      { id: 'c2', name: 'Isochron Scepter', typeLine: 'Artifact', cmc: 2 },
      { id: 'c3', name: 'Dramatic Reversal', typeLine: 'Instant', cmc: 2 }
    ];

    const graph = generateSynergyGraph(cards);
    expect(graph.nodes.length).toBeGreaterThanOrEqual(3);
    expect(graph.edges.some(e => e.label?.includes('Infinite untap'))).toBe(true);
  });
});

