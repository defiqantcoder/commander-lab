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

  it('generates tailored synergies and phase guidance for Artifacts/Affinity (Urza, Lord High Artificer)', () => {
    const urza: SimCard = {
      id: 'urza',
      name: 'Urza, Lord High Artificer',
      typeLine: 'Legendary Creature — Human Artificer',
      cmc: 4,
      manaCost: '{2}{U}{U}',
      oracleText: 'When Urza enters the battlefield, create a 0/0 colorless Construct artifact creature token with "This creature gets +1/+1 for each artifact you control." Tap an untapped artifact you control: Add {U}.',
      category: 'commander',
      isCommander: true
    };

    const urzaCards: SimCard[] = [
      { id: '1', name: 'Mystic Forge', typeLine: 'Artifact', cmc: 4, category: 'engine' },
      { id: '2', name: 'Unwinding Clock', typeLine: 'Artifact', cmc: 4, category: 'engine' },
      { id: '3', name: 'Cranial Plating', typeLine: 'Artifact — Equipment', cmc: 2, category: 'payoff' },
      { id: '4', name: 'Scrap Trawler', typeLine: 'Artifact Creature', cmc: 3, category: 'engine' }
    ];

    const playbook = generateDeckPlaybook(urzaCards, urza, 'Artifact Combo', 'Urza Stax');

    const titles = playbook.synergyPlays.map((p) => p.title);
    expect(titles.some((t) => t.includes('Mystic Forge'))).toBe(true);
    expect(titles.some((t) => t.includes('Unwinding Clock'))).toBe(true);
    expect(titles.some((t) => t.includes('Cranial Plating'))).toBe(true);
    expect(titles.some((t) => t.includes('Scrap Trawler'))).toBe(true);

    // Verify tactical tips exist
    const clockPlay = playbook.synergyPlays.find((p) => p.title.includes('Unwinding Clock'));
    expect(clockPlay?.tacticalTip).toContain('opponents’ end steps');

    // Verify artifact phase priorities
    expect(playbook.gamePhases.early.priorities.some((p) => p.includes('metalcraft and affinity'))).toBe(true);
    expect(playbook.gamePhases.mid.priorities.some((p) => p.includes('Unwinding Clock'))).toBe(true);
  });

  it('generates tailored synergies and phase guidance for Enchantress (Sythis, Harvest’s Hand)', () => {
    const sythis: SimCard = {
      id: 'sythis',
      name: 'Sythis, Harvest’s Hand',
      typeLine: 'Legendary Enchantment Creature — God',
      cmc: 2,
      manaCost: '{G}{W}',
      oracleText: 'Whenever you cast an enchantment spell, you gain 1 life and draw a card.',
      category: 'commander',
      isCommander: true
    };

    const sythisCards: SimCard[] = [
      { id: '1', name: 'Sanctum Weaver', typeLine: 'Enchantment Creature', cmc: 2, category: 'ramp' },
      { id: '2', name: 'Hallowed Haunting', typeLine: 'Enchantment', cmc: 4, category: 'payoff' }
    ];

    const playbook = generateDeckPlaybook(sythisCards, sythis, 'Enchantress Pillowfort', 'Sythis Enchantments');

    const titles = playbook.synergyPlays.map((p) => p.title);
    expect(titles.some((t) => t.includes('Enchantress Velocity Engine'))).toBe(true);
    expect(titles.some((t) => t.includes('Sanctum Weaver'))).toBe(true);
    expect(titles.some((t) => t.includes('Hallowed Haunting'))).toBe(true);

    // Curve scaling for 2 CMC
    expect(playbook.gamePhases.early.turns).toBe('Turns 1–2');
    expect(playbook.gamePhases.early.priorities.some((p) => p.includes('Wild Growth'))).toBe(true);
  });

  it('generates tailored synergies for Group Hug & Pillowfort (Kwain, Itinerant Meddler)', () => {
    const kwain: SimCard = {
      id: 'kwain',
      name: 'Kwain, Itinerant Meddler',
      typeLine: 'Legendary Creature — Rabbit Wizard',
      cmc: 2,
      manaCost: '{W}{U}',
      oracleText: '{T}: Each player may draw a card. Then each player who drew a card this way gains 1 life.',
      category: 'commander',
      isCommander: true
    };

    const kwainCards: SimCard[] = [
      { id: '1', name: 'Ghostly Prison', typeLine: 'Enchantment', cmc: 3, category: 'interaction' },
      { id: '2', name: 'Smothering Tithe', typeLine: 'Enchantment', cmc: 4, category: 'engine' },
      { id: '3', name: 'Howling Mine', typeLine: 'Artifact', cmc: 2, category: 'engine' }
    ];

    const playbook = generateDeckPlaybook(kwainCards, kwain, 'Group Hug Pillowfort', 'Kwain Hug');

    const titles = playbook.synergyPlays.map((p) => p.title);
    expect(titles.some((t) => t.includes('Ghostly Prison'))).toBe(true);
    expect(titles.some((t) => t.includes('Smothering Tithe'))).toBe(true);

    const tithePlay = playbook.synergyPlays.find((p) => p.title.includes('Smothering Tithe'));
    expect(tithePlay?.category).toBe('mana');
    expect(tithePlay?.tacticalTip).toContain('Stockpile your Treasure tokens');
  });

  it('generates tailored synergies for Wheels & Discard (Nekusar, the Mindrazer)', () => {
    const nekusar: SimCard = {
      id: 'nekusar',
      name: 'Nekusar, the Mindrazer',
      typeLine: 'Legendary Creature — Zombie Wizard',
      cmc: 5,
      manaCost: '{2}{U}{B}{R}',
      oracleText: 'At the beginning of each player’s draw step, that player draws an additional card. Whenever an opponent draws a card, Nekusar deals 1 damage to that player.',
      category: 'commander',
      isCommander: true
    };

    const nekusarCards: SimCard[] = [
      { id: '1', name: 'Windfall', typeLine: 'Sorcery', cmc: 3, category: 'engine' },
      { id: '2', name: 'Sheoldred, the Apocalypse', typeLine: 'Legendary Creature', cmc: 4, category: 'payoff' },
      { id: '3', name: 'Notion Thief', typeLine: 'Creature', cmc: 4, category: 'interaction' },
      { id: '4', name: 'Waste Not', typeLine: 'Enchantment', cmc: 2, category: 'engine' }
    ];

    const playbook = generateDeckPlaybook(nekusarCards, nekusar, 'Wheels and Discard', 'Nekusar Wheel Burn');

    const titles = playbook.synergyPlays.map((p) => p.title);
    expect(titles.some((t) => t.includes('Lethal Wheel Combustion'))).toBe(true);
    expect(titles.some((t) => t.includes('One-Sided Hand Strip'))).toBe(true);
    expect(titles.some((t) => t.includes('Discard Plunder Harvest'))).toBe(true);

    // Check mid-phase warnings for wheels
    expect(playbook.gamePhases.mid.warnings.some((w) => w.includes('Never cast a wheel without punishment'))).toBe(true);
  });

  it('generates tailored synergies for Lifegain & Drain (Vito, Thorn of the Dusk Rose)', () => {
    const vito: SimCard = {
      id: 'vito',
      name: 'Vito, Thorn of the Dusk Rose',
      typeLine: 'Legendary Creature — Vampire Cleric',
      cmc: 3,
      manaCost: '{2}{B}',
      oracleText: 'Whenever you gain life, target opponent loses that much life. {3}{B}{B}: Creatures you control gain lifelink until end of turn.',
      category: 'commander',
      isCommander: true
    };

    const vitoCards: SimCard[] = [
      { id: '1', name: 'Aetherflux Reservoir', typeLine: 'Artifact', cmc: 4, category: 'payoff' },
      { id: '2', name: 'Soul Warden', typeLine: 'Creature', cmc: 1, category: 'engine' },
      { id: '3', name: "Bolas's Citadel", typeLine: 'Artifact', cmc: 6, category: 'engine' }
    ];

    const playbook = generateDeckPlaybook(vitoCards, vito, 'Lifegain Drain', 'Vito Drain');

    const titles = playbook.synergyPlays.map((p) => p.title);
    expect(titles.some((t) => t.includes('Orbital Strike Laser'))).toBe(true);
    expect(titles.some((t) => t.includes('Passive Table Drain'))).toBe(true);
    expect(titles.some((t) => t.includes('Life as Mana Cascade'))).toBe(true);

    const aetherfluxPlay = playbook.synergyPlays.find((p) => p.title.includes('Orbital Strike Laser'));
    expect(aetherfluxPlay?.tacticalTip).toContain('65+ life');
  });

  it('catalogues and identifies expanded master combo registry interactions', () => {
    expect(MASTER_COMBO_REGISTRY.some((c) => c.name.includes("Bolas’s Citadel + Sensei’s Divining Top + Aetherflux Reservoir"))).toBe(true);
    expect(MASTER_COMBO_REGISTRY.some((c) => c.name.includes('Underworld Breach + Brain Freeze'))).toBe(true);
    expect(MASTER_COMBO_REGISTRY.some((c) => c.name.includes('Basalt Monolith + Rings of Brighthearth'))).toBe(true);
    expect(MASTER_COMBO_REGISTRY.some((c) => c.name.includes('Mikaeus, the Unhallowed + Triskelion'))).toBe(true);
    expect(MASTER_COMBO_REGISTRY.some((c) => c.name.includes('Scurry Oak + Ivy Lane Denizen'))).toBe(true);
  });

  it('provides comprehensive recovery and stax counterplay tactics', () => {
    const commander: SimCard = {
      id: 'cmd',
      name: 'General Tazri',
      typeLine: 'Legendary Creature',
      cmc: 5,
      manaCost: '{4}{W}',
      category: 'commander',
      isCommander: true
    };

    const cards: SimCard[] = [
      { id: '1', name: 'Living Death', typeLine: 'Sorcery', cmc: 5, category: 'payoff' },
      { id: '2', name: 'Blood Artist', typeLine: 'Creature', cmc: 2, category: 'engine' }
    ];

    const playbook = generateDeckPlaybook(cards, commander, 'Graveyard Aristocrats', 'Tazri Reanimator');

    // Board wipe recovery
    expect(playbook.recoveryTactics.boardWipeRecovery.some((r) => r.includes('Sandbagging'))).toBe(true);
    expect(playbook.recoveryTactics.boardWipeRecovery.some((r) => r.includes('Floating Mana & Sac Outlets'))).toBe(true);
    expect(playbook.recoveryTactics.boardWipeRecovery.some((r) => r.includes('Handling Destroy vs. Exile vs. Bounce'))).toBe(true);
    expect(playbook.recoveryTactics.boardWipeRecovery.some((r) => r.includes('Graveyard Mass-Reanimation'))).toBe(true);
    expect(playbook.recoveryTactics.boardWipeRecovery.some((r) => r.includes('Stacking Simultaneous Death Triggers'))).toBe(true);

    // Interaction hold
    expect(playbook.recoveryTactics.interactionHoldGuidance.some((i) => i.includes('2-Mana Bluff'))).toBe(true);
    expect(playbook.recoveryTactics.interactionHoldGuidance.some((i) => i.includes('Threat Hierarchy'))).toBe(true);

    // Stax counterplay
    expect(playbook.recoveryTactics.staxCounterplay.some((s) => s.includes('Rule of Law'))).toBe(true);
    expect(playbook.recoveryTactics.staxCounterplay.some((s) => s.includes('Collector Ouphe'))).toBe(true);
    expect(playbook.recoveryTactics.staxCounterplay.some((s) => s.includes('Opposition Agent'))).toBe(true);
    expect(playbook.recoveryTactics.staxCounterplay.some((s) => s.includes('Drannith Magistrate'))).toBe(true);
  });
});
