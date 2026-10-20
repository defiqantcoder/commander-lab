import { describe, it, expect } from 'vitest';
import { generateDeckPlaybook, MASTER_COMBO_REGISTRY, extractColors } from './playbook';
import type { SimCard } from './goldfish';

describe('Universal Deck Playbook & Piloting Engine', () => {
  it('extracts colors accurately from mana cost strings', () => {
    expect(extractColors('{3}{W}{U}{B}{G}')).toEqual(['White', 'Blue', 'Black', 'Green']);
    expect(extractColors('{2}{R}{R}')).toEqual(['Red']);
    expect(extractColors('{2}{U}{U}')).toEqual(['Blue']);
    expect(extractColors('{2}{B}{G}')).toEqual(['Black', 'Green']);
    expect(extractColors('{C}')).toEqual([]);
  });

  it('generates tailored piloting guide for Krenko, Mob Boss (Mono-Red Token Aggro)', () => {
    const krenko: SimCard = {
      id: 'krenko',
      name: 'Krenko, Mob Boss',
      typeLine: 'Legendary Creature — Goblin Warrior',
      cmc: 4,
      manaCost: '{2}{R}{R}',
      oracleText: '{T}: Create X 1/1 red Goblin creature tokens, where X is the number of Goblins you control.',
      category: 'commander',
      isCommander: true
    };

    const krenkoCards: SimCard[] = [
      { id: '1', name: 'Thornbite Staff', typeLine: 'Artifact — Equipment', cmc: 2, category: 'engine' },
      { id: '2', name: 'Skirk Prospector', typeLine: 'Creature — Goblin', cmc: 1, category: 'ramp' },
      { id: '3', name: 'Sol Ring', typeLine: 'Artifact', cmc: 1, category: 'ramp' },
      { id: '4', name: 'Arcane Signet', typeLine: 'Artifact', cmc: 2, category: 'ramp' },
      { id: '5', name: 'Impact Tremors', typeLine: 'Enchantment', cmc: 2, category: 'engine' },
      { id: '6', name: 'Shared Animosity', typeLine: 'Enchantment', cmc: 3, category: 'payoff' }
    ];

    const playbook = generateDeckPlaybook(krenkoCards, krenko, 'Goblin Token Aggro', 'Krenko Mob Swarm');

    expect(playbook.commanderName).toBe('Krenko, Mob Boss');
    expect(playbook.deckName).toBe('Krenko Mob Swarm');
    expect(playbook.archetype).toBe('Goblin Token Aggro');
    expect(playbook.estimatedSpeed).toBe('Fast (Turns 3–5)');

    // Combos: Krenko + Thornbite Staff should be detected
    const krenkoCombo = playbook.combos.find((c) => c.name.includes('Krenko + Thornbite Staff'));
    expect(krenkoCombo).toBeDefined();
    expect(krenkoCombo?.inDeckCount).toBe(2);
    expect(krenkoCombo?.missingCards.length).toBe(0);
    expect(krenkoCombo?.isInfinite).toBe(true);

    // Synergy plays: Impact Tremors and Shared Animosity with Krenko
    const titles = playbook.synergyPlays.map((p) => p.title);
    expect(titles.some((t) => t.includes('Burn Clock') && t.includes('Krenko'))).toBe(true);
    expect(titles.some((t) => t.includes('Overwhelming Swarm') && t.includes('Krenko'))).toBe(true);

    // Phases should mention Krenko
    expect(playbook.gamePhases.mid.objective).toContain('Krenko, Mob Boss');
  });

  it('generates tailored piloting guide for Talrand, Sky Summoner (Mono-Blue Spellslinger Control)', () => {
    const talrand: SimCard = {
      id: 'talrand',
      name: 'Talrand, Sky Summoner',
      typeLine: 'Legendary Creature — Merfolk Wizard',
      cmc: 4,
      manaCost: '{2}{U}{U}',
      oracleText: 'Whenever you cast an instant or sorcery spell, create a 2/2 blue Drake creature token with flying.',
      category: 'commander',
      isCommander: true
    };

    const talrandCards: SimCard[] = [
      { id: '1', name: 'Isochron Scepter', typeLine: 'Artifact', cmc: 2, category: 'engine' },
      { id: '2', name: 'Dramatic Reversal', typeLine: 'Instant', cmc: 2, category: 'engine' },
      { id: '3', name: 'Archmage Emeritus', typeLine: 'Creature', cmc: 4, category: 'engine' },
      { id: '4', name: 'Sol Ring', typeLine: 'Artifact', cmc: 1, category: 'ramp' }
    ];

    const playbook = generateDeckPlaybook(talrandCards, talrand, 'Draw-Go Spellslinger Control', 'Talrand Control');

    expect(playbook.commanderName).toBe('Talrand, Sky Summoner');
    expect(playbook.estimatedSpeed).toBe('Long Game (Turns 9+)');

    // Combos: Isochron Scepter + Dramatic Reversal
    const scepterCombo = playbook.combos.find((c) => c.name.includes('Isochron Scepter'));
    expect(scepterCombo).toBeDefined();
    expect(scepterCombo?.inDeckCount).toBe(2);
    expect(scepterCombo?.missingCards.length).toBe(0);

    // Synergy: Archmage Emeritus with Talrand
    const titles = playbook.synergyPlays.map((p) => p.title);
    expect(titles.some((t) => t.includes('Archmage Emeritus') && t.includes('Talrand'))).toBe(true);
  });

  it('generates tailored piloting guide for Meren of Clan Nel Toth (Golgari Graveyard Midrange)', () => {
    const meren: SimCard = {
      id: 'meren',
      name: 'Meren of Clan Nel Toth',
      typeLine: 'Legendary Creature — Human Shaman',
      cmc: 4,
      manaCost: '{2}{B}{G}',
      oracleText: 'Whenever another creature you control dies, you get an experience counter. At beginning of your end step, return target creature card from your graveyard.',
      category: 'commander',
      isCommander: true
    };

    const merenCards: SimCard[] = [
      { id: '1', name: 'Spore Frog', typeLine: 'Creature — Frog', cmc: 1, category: 'interaction' },
      { id: '2', name: 'Blood Artist', typeLine: 'Creature — Vampire', cmc: 2, category: 'engine' },
      { id: '3', name: 'Ashnod’s Altar', typeLine: 'Artifact', cmc: 3, category: 'engine' }
    ];

    const playbook = generateDeckPlaybook(merenCards, meren, 'Graveyard Reanimator Midrange', 'Meren Attrition');

    expect(playbook.commanderName).toBe('Meren of Clan Nel Toth');

    // Combo: Meren + Spore Frog Lock
    const frogCombo = playbook.combos.find((c) => c.name.includes('Spore Frog'));
    expect(frogCombo).toBeDefined();
    expect(frogCombo?.inDeckCount).toBe(2);

    // Synergy: Blood Artist with Meren
    const titles = playbook.synergyPlays.map((p) => p.title);
    expect(titles.some((t) => t.includes('Blood Artist') && t.includes('Meren'))).toBe(true);
  });

  it('adapts game phases and mulligan guide to multi-color and mono-color commanders', () => {
    const monoRedCommander: SimCard = {
      id: 'ragavan',
      name: 'Ragavan, Nimble Pilferer',
      typeLine: 'Legendary Creature — Monkey Pirate',
      cmc: 1,
      manaCost: '{R}',
      category: 'commander',
      isCommander: true
    };

    const playbook = generateDeckPlaybook([], monoRedCommander, 'Voltron Aggro');
    expect(playbook.gamePhases.early.turns).toBe('Turns 1–2');
    expect(playbook.estimatedSpeed).toBe('Fast (Turns 3–5)');
    expect(playbook.mulliganGuide.trapHands[1]).not.toContain('color-screwed');
  });
});
