import { describe, it, expect } from 'vitest';
import { validateDeck, type CardCheckItem } from './validator';

describe('CommanderValidator', () => {
  const commanderAtraya: CardCheckItem = {
    id: 'cmd-1',
    name: 'Atraxa, Praetors\' Voice',
    quantity: 1,
    colorIdentity: ['W', 'U', 'B', 'G'],
    typeLine: 'Legendary Creature — Phyrexian Angel Horror',
    isCommander: true
  };

  it('fails if deck does not have exactly 100 cards', () => {
    const cards: CardCheckItem[] = [commanderAtraya];
    const result = validateDeck(cards);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.type === 'deck_size')).toBe(true);
  });

  it('fails if deck contains banned cards', () => {
    const cards: CardCheckItem[] = [
      commanderAtraya,
      {
        id: 'ban-1',
        name: 'Mana Crypt',
        quantity: 1,
        colorIdentity: [],
        typeLine: 'Artifact'
      }
    ];
    // Fill to 100
    for (let i = 2; i < 100; i++) {
      cards.push({
        id: `card-${i}`,
        name: `Card ${i}`,
        quantity: 1,
        colorIdentity: ['W'],
        typeLine: 'Creature'
      });
    }

    const result = validateDeck(cards);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.type === 'banned' && e.cardName === 'Mana Crypt')).toBe(true);
  });

  it('detects color identity violations', () => {
    const cards: CardCheckItem[] = [
      commanderAtraya, // W, U, B, G (no Red!)
      {
        id: 'red-1',
        name: 'Lightning Bolt',
        quantity: 1,
        colorIdentity: ['R'],
        typeLine: 'Instant'
      }
    ];
    for (let i = 2; i < 100; i++) {
      cards.push({
        id: `card-${i}`,
        name: `Card ${i}`,
        quantity: 1,
        colorIdentity: ['W'],
        typeLine: 'Creature'
      });
    }

    const result = validateDeck(cards);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.type === 'color_identity' && e.cardName === 'Lightning Bolt')).toBe(true);
  });

  it('enforces singleton rule but allows basic lands', () => {
    const cards: CardCheckItem[] = [
      commanderAtraya,
      {
        id: 'dup-1',
        name: 'Sol Ring',
        quantity: 2,
        colorIdentity: [],
        typeLine: 'Artifact'
      }
    ];
    // Add 97 Plains (basic land is allowed)
    cards.push({
      id: 'plains-1',
      name: 'Plains',
      quantity: 97,
      colorIdentity: ['W'],
      typeLine: 'Basic Land — Plains'
    });

    const result = validateDeck(cards);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.type === 'singleton' && e.cardName === 'Sol Ring')).toBe(true);
    expect(result.errors.some(e => e.cardName === 'Plains')).toBe(false);
  });

  it('passes a fully valid 100-card deck', () => {
    const cards: CardCheckItem[] = [commanderAtraya];
    // 35 Plains
    cards.push({
      id: 'plains-id',
      name: 'Plains',
      quantity: 35,
      colorIdentity: ['W'],
      typeLine: 'Basic Land — Plains'
    });
    // 64 unique spells in Atraxa colors
    for (let i = 1; i <= 64; i++) {
      cards.push({
        id: `spell-${i}`,
        name: `Synergy Spell ${i}`,
        quantity: 1,
        colorIdentity: ['U'],
        typeLine: 'Enchantment'
      });
    }

    const result = validateDeck(cards);
    expect(result.totalCards).toBe(100);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });
});

