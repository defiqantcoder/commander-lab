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

  it('validates decks with Partner commanders', () => {
    const partnerA: CardCheckItem = {
      id: 'p-1',
      name: 'Vial Smasher the Fierce',
      quantity: 1,
      colorIdentity: ['B', 'R'],
      typeLine: 'Legendary Creature — Goblin Berserker',
      oracleText: 'Partner',
      isCommander: true
    };
    const partnerB: CardCheckItem = {
      id: 'p-2',
      name: 'Thrasios, Triton Hero',
      quantity: 1,
      colorIdentity: ['U', 'G'],
      typeLine: 'Legendary Creature — Merfolk Wizard',
      oracleText: 'Partner',
      isCommander: true
    };

    const cards: CardCheckItem[] = [partnerA, partnerB];
    for (let i = 1; i <= 98; i++) {
      cards.push({
        id: `card-${i}`,
        name: `Card ${i}`,
        quantity: 1,
        colorIdentity: ['U'],
        typeLine: 'Creature'
      });
    }

    const result = validateDeck(cards);
    expect(result.valid).toBe(true);
    expect(result.commanderCount).toBe(2);
    expect(result.colorIdentity).toContain('B');
    expect(result.colorIdentity).toContain('R');
    expect(result.colorIdentity).toContain('U');
    expect(result.colorIdentity).toContain('G');
    expect(result.warnings.some(w => w.type === 'partner_pairing')).toBe(true);
  });

  it('validates Background pairing', () => {
    const commander: CardCheckItem = {
      id: 'c-1',
      name: 'Abdel Adrian, Gorion\'s Ward',
      quantity: 1,
      colorIdentity: ['W'],
      typeLine: 'Legendary Creature — Human Warrior',
      oracleText: 'Choose a Background',
      isCommander: true
    };
    const background: CardCheckItem = {
      id: 'b-1',
      name: 'Candlekeep Sage',
      quantity: 1,
      colorIdentity: ['U'],
      typeLine: 'Legendary Enchantment — Background',
      oracleText: 'Commander creatures you own have...',
      isCommander: true
    };

    const cards: CardCheckItem[] = [commander, background];
    for (let i = 1; i <= 98; i++) {
      cards.push({
        id: `card-${i}`,
        name: `Card ${i}`,
        quantity: 1,
        colorIdentity: ['U'],
        typeLine: 'Creature'
      });
    }

    const result = validateDeck(cards);
    expect(result.valid).toBe(true);
    expect(result.commanderCount).toBe(2);
    expect(result.colorIdentity).toContain('W');
    expect(result.colorIdentity).toContain('U');
  });

  it('extracts color identity correctly for MDFCs and split cards', () => {
    const cards: CardCheckItem[] = [
      commanderAtraya,
      {
        id: 'mdfc-1',
        name: 'Bala Ged Recovery // Bala Ged Sanctuary',
        quantity: 1,
        colorIdentity: ['G'],
        typeLine: 'Sorcery // Land'
      },
      {
        id: 'split-1',
        name: 'Commit // Memory',
        quantity: 1,
        colorIdentity: ['U'],
        typeLine: 'Instant // Sorcery'
      }
    ];
    for (let i = 3; i < 100; i++) {
      cards.push({
        id: `card-${i}`,
        name: `Card ${i}`,
        quantity: 1,
        colorIdentity: ['W'],
        typeLine: 'Creature'
      });
    }

    const result = validateDeck(cards);
    expect(result.valid).toBe(true);
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

  it('accepts Shorikai, Genesis Engine as an eligible commander under CR 903.3', () => {
    const shorikai: CardCheckItem = {
      id: 'shorikai-1',
      name: 'Shorikai, Genesis Engine',
      quantity: 1,
      colorIdentity: ['W', 'U'],
      typeLine: 'Legendary Artifact — Vehicle',
      oracleText: 'Crew 8. Shorikai, Genesis Engine can be your commander.',
      isCommander: true
    };

    const cards: CardCheckItem[] = [shorikai];
    for (let i = 1; i < 100; i++) {
      cards.push({
        id: `card-${i}`,
        name: `Card ${i}`,
        quantity: 1,
        colorIdentity: ['W'],
        typeLine: 'Artifact'
      });
    }

    const result = validateDeck(cards);
    expect(result.errors.some((e) => e.type === 'invalid_commander')).toBe(false);
  });

  it('permits up to 7 copies of Seven Dwarves', () => {
    const cards: CardCheckItem[] = [
      commanderAtraya,
      {
        id: 'dwarf-1',
        name: 'Seven Dwarves',
        quantity: 7,
        colorIdentity: ['R'], // Notice Red will flag color identity, so let's test singleton specifically
        typeLine: 'Creature — Dwarf'
      }
    ];

    for (let i = 8; i < 100; i++) {
      cards.push({
        id: `card-${i}`,
        name: `Card ${i}`,
        quantity: 1,
        colorIdentity: ['W'],
        typeLine: 'Creature'
      });
    }

    const result = validateDeck(cards);
    expect(result.errors.some((e) => e.type === 'singleton')).toBe(false);
  });
});

