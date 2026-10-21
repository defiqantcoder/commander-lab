import type { SimCard } from './goldfish';

export interface ComboWalkthrough {
  id: string;
  name: string;
  cards: string[];
  isInfinite: boolean;
  result: string;
  prerequisites: string[];
  steps: string[];
  disruptionWindow: string;
  inDeckCount: number;
  totalCardsCount: number;
  missingCards: string[];
}

export interface SynergyPlay {
  id: string;
  title: string;
  cards: string[];
  category: 'engine' | 'combat' | 'protection' | 'mana' | 'value';
  description: string;
  tacticalTip: string;
}

export interface GamePhaseGuide {
  turns: string;
  title: string;
  objective: string;
  keyCards: string[];
  priorities: string[];
  warnings: string[];
}

export interface MulliganGuide {
  idealHandProfile: string[];
  keepableCriteria: string[];
  trapHands: string[];
  mulliganRecommendation: string;
}

export interface DeckPlaybook {
  deckName: string;
  commanderName: string;
  archetype: string;
  overview: string;
  estimatedSpeed: 'Fast (Turns 3–5)' | 'Balanced (Turns 6–8)' | 'Long Game (Turns 9+)';
  gamePhases: {
    early: GamePhaseGuide;
    mid: GamePhaseGuide;
    late: GamePhaseGuide;
  };
  combos: ComboWalkthrough[];
  synergyPlays: SynergyPlay[];
  mulliganGuide: MulliganGuide;
  recoveryTactics: {
    boardWipeRecovery: string[];
    interactionHoldGuidance: string[];
    staxCounterplay: string[];
  };
}

// Master registry of known Commander combo interactions and walkthroughs
export const MASTER_COMBO_REGISTRY: Array<{
  name: string;
  cards: string[];
  isInfinite: boolean;
  result: string;
  prerequisites: string[];
  steps: string[];
  disruptionWindow: string;
}> = [
  {
    name: 'Heliod + Walking Ballista',
    cards: ['Heliod, Sun-Crowned', 'Walking Ballista'],
    isInfinite: true,
    result: 'Infinite damage to all opponents and infinite lifegain',
    prerequisites: [
      'Heliod, Sun-Crowned on the battlefield',
      'Walking Ballista on the battlefield with at least two +1/+1 counters',
      '{1}{W} available to activate Heliod’s lifelink ability'
    ],
    steps: [
      'Activate Heliod targeting Walking Ballista to give it lifelink until end of turn for {1}{W}.',
      'Remove a +1/+1 counter from Walking Ballista to deal 1 damage to any target (opponent or creature).',
      'Because Ballista has lifelink, dealing 1 damage causes you to gain 1 life.',
      'Heliod’s triggered ability triggers whenever you gain life. Target Walking Ballista to put a +1/+1 counter on it.',
      'Repeat steps 2–4 infinitely to deal lethal damage to all opponents.'
    ],
    disruptionWindow: 'Opponents can cast instant-speed removal in response to Heliod’s lifelink activation, or when Walking Ballista removes a counter down to 1 before lifelink damage and Heliod trigger resolve.'
  },
  {
    name: 'Isochron Scepter + Dramatic Reversal',
    cards: ['Isochron Scepter', 'Dramatic Reversal'],
    isInfinite: true,
    result: 'Infinite mana and infinite untaps of all nonland permanents',
    prerequisites: [
      'Isochron Scepter on battlefield with Dramatic Reversal imprinted',
      'Nonland mana producers (mana rocks/dorks) capable of producing at least 3 mana, including {2}'
    ],
    steps: [
      'Tap nonland mana permanents to generate at least 3 mana (e.g., Sol Ring + Arcane Signet).',
      'Pay {2} and tap Isochron Scepter to cast the copy of Dramatic Reversal without paying its mana cost.',
      'Dramatic Reversal resolves, untapping all nonland permanents you control (including Isochron Scepter and the mana sources).',
      'You net at least 1 surplus mana per iteration.',
      'Repeat steps 1–3 infinitely for infinite mana, storm count, and untap triggers.'
    ],
    disruptionWindow: 'Opponents can destroy Isochron Scepter with artifact removal or counter the Dramatic Reversal copy.'
  },
  {
    name: 'Thassa’s Oracle + Demonic Consultation / Tainted Pact',
    cards: ["Thassa's Oracle", 'Demonic Consultation'],
    isInfinite: false,
    result: 'Immediate game victory through library exile',
    prerequisites: [
      '{U}{U}{B} available',
      'Both cards in hand'
    ],
    steps: [
      'Cast Thassa’s Oracle for {U}{U}.',
      'When Thassa’s Oracle enters the battlefield, its triggered ability goes on the stack.',
      'In response to the ETB trigger, cast Demonic Consultation for {B}, naming a card not in your library.',
      'Demonic Consultation resolves, exiling your entire library.',
      'Thassa’s Oracle’s ETB trigger resolves. Your devotion to blue is greater than or equal to the number of cards in your library (0), winning you the game.'
    ],
    disruptionWindow: 'Opponents must counter Demonic Consultation or force you to draw a card while your library is empty before Oracle trigger resolves.'
  },
  {
    name: 'Kiki-Jiki + Deceiver Exarch / Felidar Guardian',
    cards: ['Kiki-Jiki, Mirror Breaker', 'Deceiver Exarch'],
    isInfinite: true,
    result: 'Infinite hasty creature token copies to win through combat',
    prerequisites: [
      'Kiki-Jiki and untap creature (Deceiver Exarch / Felidar Guardian) on battlefield without summoning sickness on Kiki-Jiki'
    ],
    steps: [
      'Tap Kiki-Jiki to create a token copy of Deceiver Exarch with haste.',
      'The token enters the battlefield, triggering its ability. Target the original Kiki-Jiki to untap it.',
      'The untap trigger resolves, untapping Kiki-Jiki.',
      'Repeat steps 1–3 arbitrary number of times.',
      'Attack all opponents with the infinite army of hasty 1/4 tokens.'
    ],
    disruptionWindow: 'Instant speed spot removal on Kiki-Jiki in response to the first copy activation.'
  },
  {
    name: 'Ashnod’s Altar + Nim Deathmantle Loop',
    cards: ["Ashnod's Altar", 'Nim Deathmantle'],
    isInfinite: true,
    result: 'Infinite ETB, death triggers, and colorless mana (with creature creating 2+ tokens)',
    prerequisites: [
      'Ashnod’s Altar and Nim Deathmantle on battlefield',
      'A creature that creates at least two tokens upon entering (or dying), e.g. Grave Titan, Weaponcraft Enthusiast, or Wurmcoil Engine'
    ],
    steps: [
      'Sacrifice the token-making creature to Ashnod’s Altar to produce {C}{C}.',
      'Sacrifice one of its tokens to Ashnod’s Altar to produce another {C}{C} (total {C}{C}{C}{C}).',
      'Nim Deathmantle triggers on the creature dying: pay {4} to return the creature to the battlefield and attach Deathmantle.',
      'The creature enters, generating new tokens.',
      'Repeat infinitely. Net extra mana or extra tokens on each iteration depending on token output.'
    ],
    disruptionWindow: 'Disenchant effects on Nim Deathmantle or graveyard exile in response to the death trigger.'
  },
  {
    name: 'Sanguine Bond + Exquisite Blood',
    cards: ['Sanguine Bond', 'Exquisite Blood'],
    isInfinite: true,
    result: 'Automatic lethal life drain loop targeting all opponents',
    prerequisites: [
      'Both enchantments on the battlefield',
      'Any damage or lifegain event to trigger the chain'
    ],
    steps: [
      'Deal any amount of damage to an opponent or gain any amount of life.',
      'Exquisite Blood triggers on opponent life loss, causing you to gain that much life.',
      'Sanguine Bond triggers on you gaining life, causing target opponent to lose that much life.',
      'This chain repeats automatically until all opponents reach 0 life.'
    ],
    disruptionWindow: 'Enchantment removal cast while either trigger is on the stack.'
  },
  {
    name: 'Dualcaster Mage + Twinflame',
    cards: ['Dualcaster Mage', 'Twinflame'],
    isInfinite: true,
    result: 'Infinite hasty Dualcaster Mage token copies to attack for lethal',
    prerequisites: [
      '{2}{R}{R}{R} available',
      'Twinflame and Dualcaster Mage in hand',
      'At least one creature on the battlefield to legally target with Twinflame'
    ],
    steps: [
      'Cast Twinflame targeting any creature you control, leaving it on the stack.',
      'Cast Dualcaster Mage in response. Its ETB ability triggers, targeting Twinflame.',
      'Copy Twinflame and target the Dualcaster Mage with the copy.',
      'The copy resolves, creating a token copy of Dualcaster Mage with haste.',
      'The new token triggers its ETB, targeting the original Twinflame still on the stack.',
      'Repeat infinitely to make infinite hasty tokens and attack all opponents.'
    ],
    disruptionWindow: 'Instant-speed spot removal targeting Dualcaster Mage in response to its ETB trigger (before the Twinflame copy is created), or counterspells targeting Twinflame or Dualcaster Mage.'
  },
  {
    name: 'Krenko + Thornbite Staff / Umbral Mantle',
    cards: ['Krenko, Mob Boss', 'Thornbite Staff'],
    isInfinite: true,
    result: 'Infinite Goblins, infinite ETB triggers, and infinite death triggers',
    prerequisites: [
      'Krenko, Mob Boss equipped with Thornbite Staff',
      'A sacrifice outlet (e.g. Skirk Prospector, Goblin Bombardment, Ashnod’s Altar) and at least one other Goblin on the battlefield'
    ],
    steps: [
      'Tap Krenko to create Goblin tokens equal to the number of Goblins you control.',
      'Sacrifice a Goblin to your sac outlet (producing mana, damage, or counters).',
      'Thornbite Staff triggers whenever a creature dies, untapping the equipped Krenko.',
      'Repeat infinitely for arbitrarily large numbers of Goblins and triggers.'
    ],
    disruptionWindow: 'Instant speed creature removal targeting Krenko when tapped before untap trigger resolves.'
  },
  {
    name: 'Meren + Spore Frog Lock',
    cards: ['Meren of Clan Nel Toth', 'Spore Frog'],
    isInfinite: false,
    result: 'Recurring combat damage fog against the primary threatening attacker each turn cycle',
    prerequisites: [
      'Meren of Clan Nel Toth on battlefield with at least 1 experience counter',
      'Spore Frog on battlefield or in graveyard'
    ],
    steps: [
      'During the most threatening opponent’s combat step, sacrifice Spore Frog to prevent all combat damage that turn.',
      'Spore Frog dying gives Meren an additional experience counter.',
      'At the beginning of your end step, Meren triggers: return Spore Frog from your graveyard directly to the battlefield.',
      'Spore Frog is ready on the battlefield to fog another opponent on the subsequent turn cycle.'
    ],
    disruptionWindow: 'Graveyard exile (Bojuka Bog, Soul-Guide Lantern) in response to the end-step trigger, or removal on Meren.'
  },
  {
    name: 'Bolas’s Citadel + Sensei’s Divining Top + Aetherflux Reservoir',
    cards: ["Bolas's Citadel", "Sensei's Divining Top", 'Aetherflux Reservoir'],
    isInfinite: true,
    result: 'Infinite storm count, infinite lifegain, infinite card draw, and lethal 50-damage laser strike to all opponents',
    prerequisites: [
      "Bolas's Citadel and Aetherflux Reservoir on the battlefield",
      "Sensei's Divining Top on the battlefield or in hand",
      'At least 2 life available to initiate the first Top cast'
    ],
    steps: [
      "Tap Sensei's Divining Top to draw a card and place Top on the top of your library.",
      "With Bolas's Citadel, pay 1 life to cast Sensei's Divining Top from the top of your library.",
      'Aetherflux Reservoir triggers on cast, gaining you life equal to your current storm count for the turn.',
      'Because Aetherflux generates more life on each consecutive cast than the 1 life spent, your life total increases exponentially.',
      'Repeat steps 1–4 to accumulate over 150 life and draw any desired cards from your deck.',
      'Pay 50 life to activate Aetherflux Reservoir, dealing 50 damage to an opponent. Repeat to eliminate every opponent at the table.'
    ],
    disruptionWindow: "Instant-speed artifact removal targeting Aetherflux Reservoir or Bolas's Citadel in response to Top's draw activation."
  },
  {
    name: 'Underworld Breach + Brain Freeze + Lion’s Eye Diamond',
    cards: ['Underworld Breach', 'Brain Freeze', "Lion's Eye Diamond"],
    isInfinite: true,
    result: 'Infinite storm count, infinite colored mana, infinite self-mill, and lethal table-wide mill',
    prerequisites: [
      'Underworld Breach on the battlefield',
      "Brain Freeze and Lion's Eye Diamond in graveyard or in hand",
      'At least 3 other cards in graveyard to pay initial escape costs'
    ],
    steps: [
      "Cast Lion's Eye Diamond and sacrifice it, discarding your hand to generate {U}{U}{U}.",
      'Escape Brain Freeze from your graveyard by exiling 3 cards and paying {1}{U}.',
      'Target yourself with the storm copies of Brain Freeze to mill cards from your library into your graveyard, fueling future escape costs.',
      "Escape Lion's Eye Diamond from your graveyard, sacrifice it for mana, and repeat.",
      'Once storm count exceeds opponent library sizes, cast Brain Freeze targeting each opponent to mill their entire libraries.'
    ],
    disruptionWindow: "Enchantment removal targeting Underworld Breach, or instant-speed graveyard exile (Endurance, Faerie Macabre) in response to escape."
  },
  {
    name: 'Basalt Monolith + Rings of Brighthearth',
    cards: ['Basalt Monolith', 'Rings of Brighthearth'],
    isInfinite: true,
    result: 'Infinite colorless mana',
    prerequisites: [
      'Basalt Monolith and Rings of Brighthearth on the battlefield',
      '{2} mana available to start the loop'
    ],
    steps: [
      'Tap Basalt Monolith to produce {C}{C}{C}.',
      "Pay {3} to activate Basalt Monolith's untap ability, putting it on the stack.",
      'Rings of Brighthearth triggers: pay {2} using your available mana to copy the untap ability.',
      'The copied untap ability resolves, untapping Basalt Monolith.',
      'With the original untap ability still on the stack, tap Basalt Monolith to produce {C}{C}{C} (3 mana floating).',
      'The original untap ability resolves, untapping Basalt Monolith again.',
      'Tap Basalt Monolith for {C}{C}{C} (now 6 mana floating). You net {1} colorless mana per loop.',
      'Repeat steps 2–7 infinitely to produce arbitrarily large colorless mana.'
    ],
    disruptionWindow: 'Artifact removal targeting Basalt Monolith in response to the untap activation or copy trigger.'
  },
  {
    name: 'Mikaeus, the Unhallowed + Triskelion',
    cards: ['Mikaeus, the Unhallowed', 'Triskelion'],
    isInfinite: true,
    result: 'Infinite damage to all opponents and creatures',
    prerequisites: [
      'Mikaeus, the Unhallowed and Triskelion on the battlefield',
      'Triskelion enters with 3 counters (Mikaeus grants +1/+1 passively to non-Human creatures)'
    ],
    steps: [
      'Remove a +1/+1 counter from Triskelion to deal 1 damage to an opponent.',
      'Remove the remaining two +1/+1 counters from Triskelion to deal 1 damage each to Triskelion itself.',
      "Triskelion now has 2 damage marked on its 2/2 body (from Mikaeus's passive anthem), causing it to die as a state-based action.",
      'Because Triskelion had zero +1/+1 counters when it died, Mikaeus’s Undying ability triggers, returning it to the battlefield with four +1/+1 counters.',
      'Remove two counters to deal 2 damage to opponents, and remove the other two counters to deal 2 damage to Triskelion, killing it again.',
      'Repeat steps 2–5 infinitely to deal lethal damage to all opponents.'
    ],
    disruptionWindow: 'Instant-speed graveyard removal in response to the Undying trigger, or creature removal on Mikaeus.'
  },
  {
    name: 'Scurry Oak + Ivy Lane Denizen',
    cards: ['Scurry Oak', 'Ivy Lane Denizen'],
    isInfinite: true,
    result: 'Infinite 1/1 green Squirrel tokens, infinite ETB triggers, and an infinitely large Scurry Oak',
    prerequisites: [
      'Ivy Lane Denizen on the battlefield',
      'Scurry Oak on the battlefield (or entering)',
      'Any green creature entering the battlefield or a +1/+1 counter placed on Scurry Oak'
    ],
    steps: [
      'Place a +1/+1 counter on Scurry Oak (or have a green creature enter, triggering Ivy Lane Denizen to place a counter on Scurry Oak).',
      'Scurry Oak triggers whenever one or more +1/+1 counters are put on it: create a 1/1 green Squirrel creature token.',
      'The Squirrel token enters the battlefield. Because it is a green creature, Ivy Lane Denizen triggers.',
      'Target Scurry Oak with Ivy Lane Denizen’s trigger to put another +1/+1 counter on it.',
      'The new counter on Scurry Oak triggers its token creation ability again.',
      'Repeat steps 2–5 infinitely to amass an arbitrarily large Squirrel army and an infinitely large Scurry Oak.'
    ],
    disruptionWindow: 'Creature removal targeting Scurry Oak in response to the initial counter placement trigger.'
  },
  {
    name: 'Niv-Mizzet, Parun + Curiosity / Ophidian Eye',
    cards: ['Niv-Mizzet, Parun', 'Curiosity'],
    isInfinite: true,
    result: 'Arbitrarily large card draw and direct ping damage equal to library size',
    prerequisites: [
      'Niv-Mizzet, Parun on the battlefield',
      'Curiosity attached to Niv-Mizzet, Parun (or Ophidian Eye / Tandem Lookout paired)',
      'A card draw, instant/sorcery cast, or damage event to trigger Niv-Mizzet'
    ],
    steps: [
      'Draw a card or cast an instant/sorcery to trigger Niv-Mizzet, Parun.',
      'Niv-Mizzet deals 1 damage to target opponent.',
      'Curiosity triggers on enchanted creature dealing damage to an opponent, instructing you to draw a card.',
      'Drawing a card triggers Niv-Mizzet to deal another 1 damage.',
      'Repeat steps 2–4 to draw your library and eliminate opponents. You can stop the loop by targeting a creature instead of an opponent.'
    ],
    disruptionWindow: 'Spot removal or enchantment destruction targeting Niv-Mizzet or Curiosity in response to a ping or draw trigger.'
  },
  {
    name: 'Witherbloom Apprentice + Chain of Smog',
    cards: ['Witherbloom Apprentice', 'Chain of Smog'],
    isInfinite: true,
    result: 'Infinite magecraft drain triggers to eliminate all opponents',
    prerequisites: [
      'Witherbloom Apprentice on the battlefield',
      'Chain of Smog in hand',
      '{1}{B} mana available'
    ],
    steps: [
      'Cast Chain of Smog targeting yourself for {1}{B}.',
      'Witherbloom Apprentice triggers (magecraft): each opponent loses 1 life and you gain 1 life.',
      'Chain of Smog resolves: discard two cards and choose to copy the spell, targeting yourself again.',
      'The copied spell triggers Witherbloom Apprentice’s magecraft trigger again.',
      'Repeat infinitely by choosing to copy Chain of Smog targeting yourself (empty hand does not stop the copy clause) until all opponents reach 0 life.'
    ],
    disruptionWindow: 'Creature removal targeting Witherbloom Apprentice or counterspell targeting the original Chain of Smog.'
  },
  {
    name: 'Basalt Monolith + Kinnan, Bonder Prodigy',
    cards: ['Basalt Monolith', 'Kinnan, Bonder Prodigy'],
    isInfinite: true,
    result: 'Infinite colorless mana to activate Kinnan and put all non-Human creatures onto the battlefield',
    prerequisites: [
      'Basalt Monolith and Kinnan, Bonder Prodigy on the battlefield'
    ],
    steps: [
      'Tap Basalt Monolith for mana. Kinnan’s static ability adds an additional {C}, producing {C}{C}{C}{C} (4 colorless mana).',
      'Pay {3} to activate Basalt Monolith’s untap ability.',
      'Basalt Monolith untaps, leaving {1} colorless mana floating in your mana pool.',
      'Repeat steps 1–3 infinitely to generate arbitrarily large colorless mana.',
      'Activate Kinnan’s {5}{G}{U} ability repeatedly to dig through your library and put every non-Human creature onto the battlefield.'
    ],
    disruptionWindow: 'Artifact removal on Basalt Monolith or creature removal on Kinnan in response to the untap activation.'
  },
  {
    name: 'Karmic Guide + Reveillark Loop',
    cards: ['Karmic Guide', 'Reveillark'],
    isInfinite: true,
    result: 'Infinite ETB, death triggers, and infinite creature recursion of power <= 2',
    prerequisites: [
      'Karmic Guide and Reveillark (both on battlefield or one in graveyard)',
      'A sacrifice outlet on the battlefield (e.g. Ashnod’s Altar, Viscera Seer, Goblin Bombardment)'
    ],
    steps: [
      'Sacrifice Karmic Guide to your sacrifice outlet.',
      'Sacrifice Reveillark to your sacrifice outlet.',
      'Reveillark’s leaves-the-battlefield trigger targets Karmic Guide and any other creature with power 2 or less in your graveyard.',
      'Karmic Guide returns to the battlefield and its ETB trigger targets Reveillark.',
      'Reveillark returns to the battlefield.',
      'Repeat steps 1–5 infinitely for infinite mana, infinite damage, or infinite mill depending on your sacrifice outlet.'
    ],
    disruptionWindow: 'Instant-speed graveyard exile (Endurance, Soul-Guide Lantern) in response to Reveillark’s or Karmic Guide’s triggers.'
  },
  {
    name: 'Dockside Extortionist + Temur Sabertooth',
    cards: ['Dockside Extortionist', 'Temur Sabertooth'],
    isInfinite: true,
    result: 'Infinite Treasure tokens, infinite ETB triggers, and infinite colored mana',
    prerequisites: [
      'Temur Sabertooth and Dockside Extortionist on the battlefield',
      'Opponents control at least 5 artifacts and/or enchantments (4 to break even, 5+ nets surplus mana)'
    ],
    steps: [
      'Pay {1}{G} to activate Temur Sabertooth, returning Dockside Extortionist to your hand.',
      'Cast Dockside Extortionist for {1}{R}.',
      'Dockside enters the battlefield, creating 5 or more Treasure tokens.',
      'Sacrifice 4 Treasures for {1}{G}{1}{R}, keeping 1 surplus Treasure.',
      'Repeat steps 1–4 infinitely for infinite Treasures and infinite colored mana.'
    ],
    disruptionWindow: 'Creature removal targeting Temur Sabertooth or Dockside Extortionist in response to the bounce activation or ETB trigger.'
  }
];

/**
 * Extracts colors from a mana cost string like "{3}{W}{U}{B}{G}" or commander color identity
 */
export function extractColors(manaCost = '', colorIdentity?: string[]): string[] {
  if (colorIdentity && colorIdentity.length > 0) {
    const colorMap: Record<string, string> = {
      W: 'White',
      U: 'Blue',
      B: 'Black',
      R: 'Red',
      G: 'Green'
    };
    return colorIdentity.map((c) => colorMap[c.toUpperCase()] || c);
  }
  const colors: string[] = [];
  if (/W/i.test(manaCost)) colors.push('White');
  if (/U/i.test(manaCost)) colors.push('Blue');
  if (/B/i.test(manaCost)) colors.push('Black');
  if (/R/i.test(manaCost)) colors.push('Red');
  if (/G/i.test(manaCost)) colors.push('Green');
  return colors;
}

/**
 * Dynamically detects high synergy plays based on ANY commander and cards in the deck
 */
export function detectDynamicSynergyPlays(cards: SimCard[], commander: SimCard, archetype = ''): SynergyPlay[] {
  const plays: SynergyPlay[] = [];
  const cardNames = new Set([commander.name.toLowerCase(), ...cards.map((c) => c.name.toLowerCase())]);
  const cText = (commander.oracleText || '').toLowerCase();
  const cType = (commander.typeLine || '').toLowerCase();
  const cName = commander.name;
  const arch = archetype.toLowerCase();

  // 1. Counter & Proliferate Synergies
  const isCounterCommander = /counter|proliferate/i.test(cText);
  if (isCounterCommander || cardNames.has('evolution sage')) {
    if (cardNames.has('hardened scales')) {
      plays.push({
        id: 'syn-counters-scales',
        title: `Exponential Growth: Hardened Scales + ${cName}`,
        cards: ['Hardened Scales', cName],
        category: 'engine',
        description: 'Hardened Scales adds an extra counter on every counter-placement event, compounding continuous counter triggers exponentially.',
        tacticalTip: 'Prioritize placing the first counter early; each subsequent trigger or proliferate will scale up without requiring extra mana investment.'
      });
    }

    if (cardNames.has('the ozolith')) {
      plays.push({
        id: 'syn-ozolith-preservation',
        title: `Board Wipe Insurance: The Ozolith + ${cName}`,
        cards: ['The Ozolith', cName],
        category: 'protection',
        description: `When opponents remove your modified creatures or cast a board wipe, The Ozolith catches every single counter. When ${cName} returns, combat immediately transfers every counter back.`,
        tacticalTip: `Keep The Ozolith loaded on the battlefield. Even after a board wipe, casting ${cName} lets you swing with an immediate lethal threat during combat.`
      });
    }

    if (cardNames.has('deepglow skate')) {
      plays.push({
        id: 'syn-deepglow-multiplier',
        title: `The Doubling Turn: Deepglow Skate Finisher`,
        cards: ['Deepglow Skate', cName],
        category: 'value',
        description: 'Deepglow Skate doubles every counter on every permanent you control upon entering the battlefield. This can push loyalty to ultimate threshold or double power for lethal.',
        tacticalTip: 'Wait until you have at least 3 distinct permanents with counters before deploying. If you control Planeswalkers, double loyalty and activate ultimate abilities immediately.'
      });
    }

    if (cardNames.has('evolution sage')) {
      plays.push({
        id: 'syn-landfall-proliferate',
        title: `Landfall Velocity: Evolution Sage + Fetchlands`,
        cards: ['Evolution Sage', cName],
        category: 'engine',
        description: 'Every land entering triggers a proliferate. Fetch lands and ramp spells trigger multiple proliferates in a single turn cycle.',
        tacticalTip: 'Hold uncracked fetchlands until Evolution Sage is on the battlefield to trigger back-to-back proliferate events before opponents can untap.'
      });
    }
  }

  // 2. Token & Go-Wide Synergies
  const isTokenCommander = /create.*token|token creature|goblins you control|tokens you control/i.test(cText);
  if (isTokenCommander) {
    if (cardNames.has('purphoros, god of the forge') || cardNames.has('impact tremors')) {
      const burnCard = cardNames.has('purphoros, god of the forge') ? 'Purphoros, God of the Forge' : 'Impact Tremors';
      plays.push({
        id: 'syn-token-burn',
        title: `Burn Clock: ${burnCard} + ${cName}`,
        cards: [burnCard, cName],
        category: 'combat',
        description: `Each token created deals direct damage to each opponent, converting board development into unavoidable table-wide burn.`,
        tacticalTip: `Resolve ${burnCard} before activating ${cName}'s token production. You often do not even need to attack to win the game.`
      });
    }

    if (cardNames.has('shared animosity') || cardNames.has('coat of arms')) {
      const anthem = cardNames.has('shared animosity') ? 'Shared Animosity' : 'Coat of Arms';
      plays.push({
        id: 'syn-tribal-pump',
        title: `Overwhelming Swarm: ${anthem} + ${cName}`,
        cards: [anthem, cName],
        category: 'combat',
        description: `As token count scales, each attacking creature gains massive power, transforming small 1/1s into lethal attackers.`,
        tacticalTip: `Calculate total attacking power before combat. Even 6 or 7 tokens can swing for 40+ total damage in a single alpha strike.`
      });
    }
  }

  // 3. Spellslinger & Storm Synergies
  const isSpellsCommander = /instant.*sorcery|whenever you cast.*noncreature|magecraft|draw.*spell/i.test(cText);
  if (isSpellsCommander || arch.includes('spell') || arch.includes('storm')) {
    if (cardNames.has('archmage emeritus') || cardNames.has('whirlwind denial')) {
      plays.push({
        id: 'syn-spell-chain',
        title: `Perpetual Draw: Archmage Emeritus + ${cName}`,
        cards: ['Archmage Emeritus', cName],
        category: 'value',
        description: `Every cheap instant or cantrip you cast replaces itself while triggering ${cName}'s abilities, fueling continuous spell chains.`,
        tacticalTip: 'Hold low-cost 1-mana cantrips (Opt, Brainstorm, Ponder) until your engine piece is on board to immediately draw into protection.'
      });
    }
  }

  // 4. Graveyard & Aristocrats Synergies
  const isGraveyardCommander = /graveyard|dies|sacrifice|reanimate/i.test(cText);
  if (isGraveyardCommander || arch.includes('graveyard') || arch.includes('aristocrat') || arch.includes('reanimat')) {
    if (cardNames.has('blood artist') || cardNames.has('zulaport cutthroat')) {
      const drainCard = cardNames.has('blood artist') ? 'Blood Artist' : 'Zulaport Cutthroat';
      plays.push({
        id: 'syn-aristocrat-drain',
        title: `Life Siphon: ${drainCard} + ${cName}`,
        cards: [drainCard, cName],
        category: 'value',
        description: `Every creature sacrificed or recycled through the graveyard drains opponents and buffers your life total, turning removal into win conditions.`,
        tacticalTip: `Sacrifice utility creatures in response to exile removal to ensure you get death triggers and experience or graveyard counters.`
      });
    }
  }

  // 5. Artifacts & Affinity Synergies
  const isArtifactCommander = /artifact|metalcraft|affinity|improvise|modular|thopter|construct/i.test(cText) ||
    /artifact|construct|equipment/i.test(cType) ||
    arch.includes('artifact') || arch.includes('affinity') || arch.includes('cheerios');

  if (isArtifactCommander || cardNames.has('mystic forge') || cardNames.has('unwinding clock') || cardNames.has('cranial plating')) {
    if (cardNames.has('mystic forge') || cardNames.has('the reality chip')) {
      const topDeckEngine = cardNames.has('mystic forge') ? 'Mystic Forge' : 'The Reality Chip';
      plays.push({
        id: 'syn-artifact-forge',
        title: `Artifact Card Velocity: ${topDeckEngine} + Top-Deck Casts`,
        cards: [topDeckEngine, cName],
        category: 'engine',
        description: `Cast artifact spells directly from the top of your library. When paired with low-CMC artifacts or cost-reducers, you cycle through your deck without spending cards from hand.`,
        tacticalTip: `If an opponent targets ${topDeckEngine} with removal, hold priority to cast the top card or activate abilities before the removal resolves.`
      });
    }

    if (cardNames.has('unwinding clock')) {
      plays.push({
        id: 'syn-artifact-clock',
        title: `Quadruple Untap Engine: Unwinding Clock + Mana Rocks`,
        cards: ['Unwinding Clock', cName],
        category: 'mana',
        description: 'Unwinding Clock untaps all your artifacts during each other player’s untap step. With mana rocks and activated artifact engines, you unlock a fresh turn’s worth of mana on every opponent’s turn.',
        tacticalTip: 'Save instant-speed spells, mana sinks, and token-generation activations for opponents’ end steps to make full use of your untapping artifacts.'
      });
    }

    if (cardNames.has('cranial plating') || cardNames.has('nettlecyst')) {
      const statCard = cardNames.has('cranial plating') ? 'Cranial Plating' : 'Nettlecyst';
      plays.push({
        id: 'syn-artifact-plating',
        title: `Affinity Power Spike: ${statCard} + ${cName}`,
        cards: [statCard, cName],
        category: 'combat',
        description: `Scales creature power by the total number of artifacts you control, transforming utility creatures or ${cName} into lethal single-turn threats.`,
        tacticalTip: 'Cranial Plating has an instant-speed {B}{B} attach ability that bypasses normal equip sorcery speed; attach it after blockers are declared to push lethal damage.'
      });
    }

    if (cardNames.has('scrap trawler') || cardNames.has('goblin welder') || cardNames.has('emry, lurker of the loch')) {
      const recurCard = cardNames.has('scrap trawler')
        ? 'Scrap Trawler'
        : cardNames.has('goblin welder')
        ? 'Goblin Welder'
        : 'Emry, Lurker of the Loch';
      plays.push({
        id: 'syn-artifact-recur',
        title: `Scrap Recursion Chain: ${recurCard} Engine`,
        cards: [recurCard, cName],
        category: 'value',
        description: `Recycles destroyed or sacrificed artifacts back to your hand or battlefield. Sacrifice cheap artifact tokens (Treasures, Clues, Thopters) to recover high-impact combo pieces.`,
        tacticalTip: 'Sacrifice artifacts in response to opponent exile removal so your high-value artifacts end up safely in the graveyard ready for recursion.'
      });
    }
  }

  // 6. Enchantress & Aura Synergies
  const isEnchantressCommander = /enchantment|constellation|aura|enchanted/i.test(cText) ||
    arch.includes('enchant') || arch.includes('aura') || arch.includes('bogles');

  if (isEnchantressCommander || cardNames.has('sythis, harvest’s hand') || cardNames.has('sythis, harvest\'s hand') || cardNames.has('argothian enchantress') || cardNames.has("enchantress's presence")) {
    const enchantressCard = cardNames.has('sythis, harvest’s hand') || cardNames.has('sythis, harvest\'s hand')
      ? "Sythis, Harvest's Hand"
      : cardNames.has('argothian enchantress')
      ? 'Argothian Enchantress'
      : cardNames.has("enchantress's presence")
      ? "Enchantress's Presence"
      : 'Enchantress Engine';

    plays.push({
      id: 'syn-enchantress-draw',
      title: `Enchantress Velocity Engine: ${enchantressCard} + Low-CMC Auras`,
      cards: [enchantressCard, cName],
      category: 'engine',
      description: `Every enchantment cast replaces itself with one or more card draws. Chaining low-CMC auras and ramp enchantments generates continuous hand velocity.`,
      tacticalTip: 'Deploy your enchantress engine before casting cheap ramp auras. Keep 1 mana open to cast protection (Tamiyo’s Safekeeping, Heroic Intervention) to defend your draw engine.'
    });

    if (cardNames.has('sanctum weaver') || cardNames.has("serra's sanctum")) {
      const manaCard = cardNames.has('sanctum weaver') ? 'Sanctum Weaver' : "Serra's Sanctum";
      plays.push({
        id: 'syn-enchantress-mana',
        title: `Exponential Mana Surge: ${manaCard} Scaling`,
        cards: [manaCard, cName],
        category: 'mana',
        description: `Taps for mana equal to your enchantment count across all colors, producing massive mana bursts to resolve high-CMC win conditions in a single turn.`,
        tacticalTip: `Untapping ${manaCard} with utility effects or granting it haste allows you to generate game-ending mana pools in a single turn.`
      });
    }

    if (cardNames.has('hallowed haunting') || cardNames.has('sigil of the empty throne')) {
      const finisherCard = cardNames.has('hallowed haunting') ? 'Hallowed Haunting' : 'Sigil of the Empty Throne';
      plays.push({
        id: 'syn-enchantress-tokens',
        title: `Ethereal Swarm Finisher: ${finisherCard}`,
        cards: [finisherCard, cName],
        category: 'combat',
        description: `Converts every subsequent enchantment spell into flying Angel or scaling Spirit tokens. Hallowed Haunting grants flying and vigilance to your entire modified board.`,
        tacticalTip: `Hold off on casting cheap utility enchantments until ${finisherCard} is safely on the battlefield to maximize token generation.`
      });
    }
  }

  // 7. Group Hug & Pillowfort Synergies
  const isGroupHugCommander = /each player draws|each player|opponents may|group hug|pillowfort|parley/i.test(cText) ||
    /kwain|gluntch|kynaios|braids, conjurer|xantcha|zedruu|selvala/i.test(cName.toLowerCase()) ||
    arch.includes('hug') || arch.includes('pillowfort');

  if (isGroupHugCommander || cardNames.has('ghostly prison') || cardNames.has('propaganda') || cardNames.has('sphere of safety') || cardNames.has('smothering tithe')) {
    if (cardNames.has('ghostly prison') || cardNames.has('propaganda') || cardNames.has('sphere of safety')) {
      const fortCard = cardNames.has('sphere of safety')
        ? 'Sphere of Safety'
        : cardNames.has('ghostly prison')
        ? 'Ghostly Prison'
        : 'Propaganda';

      plays.push({
        id: 'syn-pillowfort-tax',
        title: `Impenetrable Fortress: ${fortCard} Attack Taxation`,
        cards: [fortCard, cName],
        category: 'protection',
        description: `Forces opponents to pay {2} or {X} mana per creature to attack you. As opponents build large token or go-wide boards, attacking you becomes mathematically prohibitive.`,
        tacticalTip: 'Pillowfort pieces redirect combat aggression towards other players. Encourage rivals to trade attacks while you quietly assemble your endgame.'
      });
    }

    if (cardNames.has('smothering tithe')) {
      const hugDrawCard = cardNames.has('howling mine')
        ? 'Howling Mine'
        : cardNames.has('font of mythos')
        ? 'Font of Mythos'
        : cardNames.has('kwain, itinerant meddler')
        ? 'Kwain, Itinerant Meddler'
        : cName;

      plays.push({
        id: 'syn-hug-tithe-break',
        title: `Resource Parity Break: Smothering Tithe + Symmetrical Draw`,
        cards: ['Smothering Tithe', hugDrawCard],
        category: 'mana',
        description: `While symmetrical draw effects give all players extra cards, Smothering Tithe taxes every draw, creating 3+ Treasure tokens per turn cycle and heavily tilting resource parity in your favor.`,
        tacticalTip: 'Stockpile your Treasure tokens rather than spending them piecemeal; cash them in all at once to resolve an overwhelming game-ending finisher.'
      });
    }
  }

  // 8. Wheels & Discard Synergies
  const isWheelCommander = /discard|whenever.*player.*draws|whenever.*opponent.*draws|wheel|punish.*draw/i.test(cText) ||
    /nekusar|sheoldred|tergrid|tinstrider|xyris|brallin|shabraz|kroxa|tinybones|nath/i.test(cName.toLowerCase()) ||
    arch.includes('wheel') || arch.includes('discard');

  if (isWheelCommander || cardNames.has('windfall') || cardNames.has('wheel of fortune') || cardNames.has('dark deal') || cardNames.has('sheoldred, the apocalypse')) {
    const hasWheelSpell = cardNames.has('windfall') || cardNames.has('wheel of fortune') || cardNames.has('dark deal') || cardNames.has('whispering madness') || cardNames.has('reforge the soul');
    const wheelSpell = cardNames.has('windfall')
      ? 'Windfall'
      : cardNames.has('wheel of fortune')
      ? 'Wheel of Fortune'
      : cardNames.has('dark deal')
      ? 'Dark Deal'
      : 'Wheel Effect';

    if (cardNames.has('sheoldred, the apocalypse') || cardNames.has('orcish bowmasters') || /nekusar/i.test(cName)) {
      const punisherCard = cardNames.has('sheoldred, the apocalypse')
        ? 'Sheoldred, the Apocalypse'
        : cardNames.has('orcish bowmasters')
        ? 'Orcish Bowmasters'
        : cName;

      plays.push({
        id: 'syn-wheel-burn',
        title: `Lethal Wheel Combustion: ${punisherCard} + ${wheelSpell}`,
        cards: [punisherCard, wheelSpell],
        category: 'combat',
        description: `Forcing all opponents to draw 7 cards triggers ${punisherCard} 7 times per opponent (21 triggers total), dealing 14–21 damage per player or generating an overwhelming army of Orc tokens.`,
        tacticalTip: 'Float your mana before casting the wheel so you can immediately cast instant-speed interaction or additional punishment spells drawn from your fresh 7-card hand.'
      });
    }

    if (cardNames.has('notion thief') || cardNames.has('narset, parter of veils')) {
      const lockCard = cardNames.has('notion thief') ? 'Notion Thief' : 'Narset, Parter of Veils';
      plays.push({
        id: 'syn-wheel-lock',
        title: `One-Sided Hand Strip: ${lockCard} + ${wheelSpell}`,
        cards: [lockCard, wheelSpell],
        category: 'value',
        description: `Resolving a wheel with ${lockCard} forces each opponent to discard their entire hand while denying them any draws, leaving opponents empty-handed while you draw 21+ cards.`,
        tacticalTip: `Flash in Notion Thief on an opponent’s end step or in response to a wheel spell on the stack so opponents have no window to react at sorcery speed.`
      });
    }

    if (cardNames.has('waste not') || cardNames.has('tergrid, god of fright')) {
      const payoffCard = cardNames.has('waste not') ? 'Waste Not' : 'Tergrid, God of Fright';
      plays.push({
        id: 'syn-discard-harvest',
        title: `Discard Plunder Harvest: ${payoffCard} Cascade`,
        cards: [payoffCard, cName],
        category: 'engine',
        description: `Each card opponents discard yields black mana bursts, 2/2 zombie tokens, card draws, or direct permanent theft onto your battlefield.`,
        tacticalTip: 'Wait until opponents have 5+ cards in hand before triggering a discard wave to maximize stolen permanents and generated mana.'
      });
    }
  }

  // 9. Lifegain & Drain Synergies
  const isLifegainCommander = /gain.*life|whenever you gain life|life total|lifelink/i.test(cText) ||
    /liesa|vito|dina|karlov|trelasarra|bilbo|oloro|kethis|amalia|kambal/i.test(cName.toLowerCase()) ||
    arch.includes('life') || arch.includes('drain');

  if (isLifegainCommander || cardNames.has('aetherflux reservoir') || cardNames.has("bolas's citadel") || cardNames.has('vito, thorn of the dusk rose') || cardNames.has('dina, soul steeper')) {
    if (cardNames.has('aetherflux reservoir')) {
      plays.push({
        id: 'syn-lifegain-aetherflux',
        title: `Orbital Strike Laser: Aetherflux Reservoir`,
        cards: ['Aetherflux Reservoir', cName],
        category: 'combat',
        description: 'Consecutive spells cast gain exponentially increasing life (1, 2, 3, 4...). Once your life total exceeds 50, pay 50 life to deal 50 unpreventable damage to any target at instant speed.',
        tacticalTip: 'Build a safety buffer of at least 65+ life before firing; dropping down to exactly 1 life leaves you vulnerable to instant-speed burn or priority disruption.'
      });
    }

    if (cardNames.has('vito, thorn of the dusk rose') || cardNames.has('dina, soul steeper') || cardNames.has('marauding blight-priest')) {
      const drainCard = cardNames.has('vito, thorn of the dusk rose')
        ? 'Vito, Thorn of the Dusk Rose'
        : cardNames.has('dina, soul steeper')
        ? 'Dina, Soul Steeper'
        : 'Marauding Blight-Priest';

      const soulCard = cardNames.has('soul warden')
        ? 'Soul Warden'
        : cardNames.has("soul's attendant")
        ? "Soul's Attendant"
        : cardNames.has('authority of the consuls')
        ? 'Authority of the Consuls'
        : cName;

      plays.push({
        id: 'syn-lifegain-drain-engine',
        title: `Passive Table Drain: ${drainCard} + Lifegain Triggers`,
        cards: [drainCard, soulCard],
        category: 'value',
        description: `Every creature entering under any player’s control triggers lifegain, immediately causing ${drainCard} to drain opponents’ life totals without needing to attack.`,
        tacticalTip: 'Encourage opponents to cast creatures or create tokens; their board development passively accelerates the death clock against the table.'
      });
    }

    if (cardNames.has("bolas's citadel")) {
      const pairCard = cardNames.has("sensei's divining top") ? "Sensei's Divining Top" : cName;
      plays.push({
        id: 'syn-lifegain-citadel',
        title: `Life as Mana Cascade: Bolas's Citadel Velocity`,
        cards: ["Bolas's Citadel", pairCard],
        category: 'engine',
        description: `Cast spells directly from your library by paying life instead of mana. Lifegain triggers replenish your life pool, allowing near-infinite spell chains and a 10-damage tap finisher.`,
        tacticalTip: 'Keep a fetchland or shuffle effect ready to clear a second land from the top of your library and sustain the Citadel cascade.'
      });
    }
  }

  // 10. Card Draw & Tax Synergies (Universal)
  if (cardNames.has('esper sentinel')) {
    plays.push({
      id: 'syn-esper-tax',
      title: 'Taxation Engine: Esper Sentinel Advantage',
      cards: ['Esper Sentinel', cName],
      category: 'mana',
      description: 'Opponents must pay mana equal to Esper Sentinel’s power to prevent you from drawing. Any power increase turns it into an unpayable Rhystic Study.',
      tacticalTip: 'Equip or place counters on Esper Sentinel early. Raising its power to 3 or 4 virtually guarantees drawing a card off every noncreature spell opponents cast.'
    });
  }

  // 11. Fast Mana Opener (Universal)
  if (cardNames.has('sol ring') && cardNames.has('arcane signet')) {
    plays.push({
      id: 'syn-fast-mana-opener',
      title: `Turn 1 Acceleration: Sol Ring into Mana Rock`,
      cards: ['Sol Ring', 'Arcane Signet'],
      category: 'mana',
      description: `Playing Sol Ring on Turn 1 enables casting Arcane Signet immediately, establishing 4–5 mana available by Turn 2.`,
      tacticalTip: `Enables deploying ${cName} multiple turns ahead of schedule, seizing table momentum before opponents establish interaction.`
    });
  }

  return plays;
}

/**
 * Builds dynamic game phase instructions tailored to ANY commander and deck archetype
 */
export function buildDynamicGamePhases(cards: SimCard[], commander: SimCard, archetype: string): DeckPlaybook['gamePhases'] {
  const cmc = commander.cmc ?? 4;
  const colors = extractColors(commander.manaCost, commander.colorIdentity);
  const colorCount = colors.length;
  const cName = commander.name;
  const arch = archetype.toLowerCase();

  // Determine early turn horizon based on commander CMC
  const earlyTurns = cmc <= 3 ? 'Turns 1–2' : cmc <= 5 ? 'Turns 1–3' : 'Turns 1–4';
  const midTurns = cmc <= 3 ? 'Turns 3–5' : cmc <= 5 ? 'Turns 4–6' : 'Turns 5–7';
  const lateTurns = cmc <= 3 ? 'Turns 6+' : cmc <= 5 ? 'Turns 7+' : 'Turns 8+';

  // Identify early ramp and setup cards present in deck
  const earlyRampCards = cards.filter((c) => c.category === 'ramp' && (c.cmc ?? 0) <= 3).map((c) => c.name).slice(0, 4);
  const earlyEngineCards = cards.filter((c) => c.category === 'engine' && (c.cmc ?? 0) <= 3).map((c) => c.name).slice(0, 3);
  const earlyTargets = [...new Set([...earlyRampCards, ...earlyEngineCards])].slice(0, 4);
  if (earlyTargets.length === 0) earlyTargets.push('Sol Ring', 'Arcane Signet', 'Mana Rocks');

  // Identify late payoffs
  const latePayoffCards = cards.filter((c) => (c.category === 'payoff' || (c.cmc ?? 0) >= 5)).map((c) => c.name).slice(0, 3);
  if (latePayoffCards.length === 0) latePayoffCards.push(cName, 'Key Payoff Spells');

  // 1. Dynamic Early Game Priorities & Warnings
  const earlyPriorities: string[] = [];
  if (colorCount >= 3) {
    earlyPriorities.push(`Prioritize land fetching and color fixing (${colors.slice(0, 3).join('/')}) to avoid being locked out of colored pips.`);
  } else {
    earlyPriorities.push(`Deploy 1–2 CMC mana rocks or mana dorks on curve to accelerate commander deployment.`);
  }

  if (cmc <= 2) {
    earlyPriorities.push(`Leverage ${cName}'s immediate presence on Turns 1–2: unlock free spells (Deflecting Swat, Fierce Guardianship) and active mana rocks (Mox Amber, Springleaf Drum).`);
    earlyPriorities.push(`Establish early chip pressure or low-cost engine triggers before opponents establish blockers.`);
  } else if (cmc >= 7) {
    earlyPriorities.push(`Chain early 1–2 CMC ramp into compound acceleration (4-CMC ramp spells, mana doublers, Thran Dynamo) to reach the ${cmc}-mana threshold rapidly.`);
    earlyPriorities.push(`Deploy early defensive roadblocks or chump blockers to preserve your life total against aggressive starts.`);
  } else {
    earlyPriorities.push(`Lay down early engine pieces or setup permanents before casting ${cName}.`);
  }

  if (arch.includes('artifact') || arch.includes('affinity')) {
    earlyPriorities.push(`Deploy cheap 0–1 CMC artifact baubles to build metalcraft and affinity counts ahead of schedule.`);
  } else if (arch.includes('enchant')) {
    earlyPriorities.push(`Cast low-cost aura ramp (Wild Growth, Utopia Sprawl) and early draw engines to generate early card velocity.`);
  } else if (arch.includes('hug') || arch.includes('pillowfort')) {
    earlyPriorities.push(`Lay down early taxation or symmetrical draw pieces to redirect opponent aggression toward each other.`);
  } else if (arch.includes('wheel') || arch.includes('discard')) {
    earlyPriorities.push(`Sculpt your hand and develop mana while waiting for opponents to fill their hands for maximum wheel impact.`);
  } else if (arch.includes('life')) {
    earlyPriorities.push(`Deploy cheap soul warden or lifegain triggers to start stacking life increments from opponent plays.`);
  } else {
    earlyPriorities.push(`Never miss a land drop during the first 3 turns; land consistency is paramount.`);
  }

  const earlyWarnings: string[] = [
    `Do not rush ${cName} onto an empty board if opponents are holding open mana for spot removal or counterspells.`
  ];

  if (cmc <= 2) {
    earlyWarnings.push(`Avoid dumping your entire opening hand on Turn 1–2 without card draw in reserve; an early sweep or removal spell can permanently stall low-curve decks.`);
  } else if (cmc >= 7) {
    earlyWarnings.push(`Do not keep opening hands without multiple mana ramp sources or color fixing; falling behind on mana with a high-CMC commander is fatal.`);
  } else {
    earlyWarnings.push(`Avoid keeping 1-land or 2-land opening hands that lack early mana ramp.`);
  }

  // 2. Dynamic Mid Game Priorities & Warnings
  const midPriorities: string[] = [
    `Resolve ${cName} during a turn where you can extract immediate value or hold up protection.`
  ];

  if (arch.includes('artifact')) {
    midPriorities.push(`Assemble untap or recursion engines (Unwinding Clock, Scrap Trawler, Mystic Forge) to continuously out-value opponents.`);
  } else if (arch.includes('enchant')) {
    midPriorities.push(`Cycle through enchantments to draw multiple cards per turn while fortifying defenses with Sphere of Safety or Sterling Grove.`);
  } else if (arch.includes('hug') || arch.includes('pillowfort')) {
    midPriorities.push(`Break resource symmetry with Smothering Tithe or Gluntch while opponents expend resources fighting each other.`);
  } else if (arch.includes('wheel')) {
    midPriorities.push(`Deploy punishment permanents (Sheoldred, Megrim, Orcish Bowmasters, Waste Not) right before casting a table-wide wheel.`);
  } else if (arch.includes('life')) {
    midPriorities.push(`Compound lifegain triggers with drain pieces (Vito, Dina) and build your life total toward the 50+ threshold.`);
  } else if (arch.includes('spell') || arch.includes('storm')) {
    midPriorities.push(`Chain cheap cantrips with magecraft/spellslinger payoffs, maintaining open mana for counterspells.`);
  } else if (arch.includes('graveyard') || arch.includes('aristocrat')) {
    midPriorities.push(`Establish recurring sacrifice-and-reanimate loops, draining opponents while keeping your board resilient.`);
  } else {
    midPriorities.push(`Activate core synergy feedback loops to pull ahead on resources, cards, or board state.`);
  }

  midPriorities.push(`Preserve 1–2 mana for instant-speed interaction (counterspells or removal) to defend your engine against sweeps.`);

  const midWarnings: string[] = [
    `Do not overcommit your entire hand to the battlefield without holding insurance against board wipes.`,
    `Track opponent open mana; bait counterspells with secondary spells before committing core pieces.`
  ];

  if (arch.includes('wheel')) {
    midWarnings.push(`Never cast a wheel without punishment or thief pieces in play unless you are empty-handed; wheels give opponents 21 fresh cards.`);
  } else if (arch.includes('graveyard')) {
    midWarnings.push(`Beware of mass graveyard exile (Rest in Peace, Bojuka Bog) when stocking your graveyard; hold sacrifice outlets to respond.`);
  }

  // 3. Dynamic Late Game Priorities & Warnings
  const latePriorities: string[] = [
    `Deploy high-impact payoffs (${latePayoffCards.slice(0, 2).join(' or ')}) to establish an insurmountable clock.`,
    `Focus down the highest-threat opponent first (control or combo players holding interaction).`,
    `Always keep backup mana open to protect your winning turn against opponent disruption.`
  ];

  if (arch.includes('life')) {
    latePriorities.push(`Activate Aetherflux Reservoir’s 50-damage laser or Bolas’s Citadel drain to cleanly eliminate opponents without combat.`);
  } else if (arch.includes('wheel')) {
    latePriorities.push(`Chain back-to-back wheels with damage punishers to burn 40+ life across the entire table simultaneously.`);
  } else if (arch.includes('token') || arch.includes('combat')) {
    latePriorities.push(`Execute an alpha strike using mass pump (Shared Animosity, Coat of Arms) or ETB burn triggers.`);
  }

  const lateWarnings: string[] = [
    `Beware of mass exile effects (e.g. Farewell, Cyclonic Rift) that bypass indestructible or graveyard recursion.`,
    `Never initiate a vulnerable win attempt without calculating opponent response windows.`
  ];

  return {
    early: {
      turns: earlyTurns,
      title: colorCount >= 3 ? 'Color Fixing & Mana Ramp' : 'Mana Acceleration & Board Setup',
      objective: colorCount >= 3
        ? `Establish all ${colorCount} colors (${colors.join(', ')}) of mana, accelerate past ${cmc} mana, and deploy low-CMC utility permanents.`
        : `Accelerate into ${cmc} mana to cast ${cName} on curve while establishing early board presence.`,
      keyCards: earlyTargets,
      priorities: earlyPriorities,
      warnings: earlyWarnings
    },
    mid: {
      turns: midTurns,
      title: 'Engine Deployment & Value Compounding',
      objective: `Resolve ${cName} with value or protection backup, compound synergy triggers, and establish resilient card advantage.`,
      keyCards: [cName, ...cards.filter((c) => c.category === 'engine').map((c) => c.name).slice(0, 3)],
      priorities: midPriorities,
      warnings: midWarnings
    },
    late: {
      turns: lateTurns,
      title: 'Executing Win Conditions & Closing the Table',
      objective: `Deploy decisive payoffs, execute combo lines, or assemble lethal combat damage to eliminate opponents.`,
      keyCards: latePayoffCards,
      priorities: latePriorities,
      warnings: lateWarnings
    }
  };
}

/**
 * Builds dynamic mulligan rules tailored to the deck's colors, curve, and archetype
 */
export function buildDynamicMulliganGuide(cards: SimCard[], commander: SimCard, archetype = ''): MulliganGuide {
  const colors = extractColors(commander.manaCost, commander.colorIdentity);
  const colorCount = colors.length;
  const cName = commander.name;
  const cmc = commander.cmc ?? 4;
  const isAggroOrLowCmc = cmc <= 2 || /aggro|fast|burn/i.test(archetype);
  const isHighCmc = cmc >= 7 || /ramp|big|heavy|late/i.test(archetype);

  const idealProfile: string[] = [
    colorCount >= 3
      ? `3 lands representing at least ${Math.min(colorCount, 3)} different colors`
      : '3 lands with balanced color requirements',
    isHighCmc
      ? '2 pieces of cheap mana acceleration (Sol Ring, 2-CMC rocks, or green land ramp)'
      : '1 low-CMC mana acceleration spell (Sol Ring, Arcane Signet, or mana dork)',
    isAggroOrLowCmc
      ? `1 proactive 1-2 CMC threat or enabler to deploy before ${cName}`
      : `1 low-cost card advantage or engine piece to play before ${cName}`,
    '1 piece of cheap interaction or removal to disrupt early opponent momentum'
  ];

  if (isAggroOrLowCmc) {
    idealProfile.push('1 cheap protection spell or interaction (e.g. 1-CMC counter, hexproof, or ward protection)');
  } else if (isHighCmc) {
    idealProfile.push('1 mid-game stabilizing spell, defensive roadblock, or sweeper to survive go-wide boards');
  }

  const keepableCriteria: string[] = [
    `3 lands + 1 ramp spell: Guarantees casting ${cName} on or ahead of curve.`,
    '2 lands + Sol Ring + 2-mana rock: Supercharged explosive opener establishing an insurmountable mana lead.',
    '3 lands + 1 draw engine + 1 interaction: Resilient attrition hand that will not stall out in the mid-game.',
    isHighCmc
      ? '3-4 lands + 2 ramp sources + 1 defensive piece: Essential foundation for casting high-cost battlecruiser commanders.'
      : '2-3 lands + 1-2 low-cost proactive plays + 1 piece of interaction: Ideal curve-out sequence with early board presence.',
    'Command Zone Synergy: Any opening hand with early enablers that trigger your commander immediately upon resolution.'
  ];

  const trapHands: string[] = [
    'The "Expensive Bomb" Trap: Hands with 3 lands and all 5+ CMC spells with zero early plays; leaves you defenseless for 4 turns.',
    colorCount >= 3
      ? `The "Color Screwed" Trap: Hands with lands producing only 1 or 2 colors in a ${colorCount}-color deck without fixing.`
      : 'The "Flooded" Trap: Hands with 5 or 6 lands and only 1 actionable spell.',
    'The "Zero Ramp" Hand: 4 lands and only mid-game spells with no acceleration; immediately falls behind faster pods.',
    'The "All-Engine, No-Mana" Trap: Hands overflowing with powerful synergistic engines or combo payoffs but only 1 land; will stall completely.',
    'The "Greedy 1-Lander" Trap: 1 land with Sol Ring or a mana dork that folds instantly to a single piece of opponent removal on turn 1.'
  ];

  const mulliganRecommendation = isAggroOrLowCmc
    ? `Be aggressive with Commander mulligans: a fast low-curve deck needs proactive turn 1-2 plays. Throw back slow, passive 4-land hands.`
    : isHighCmc
    ? `Take full advantage of the free London Mulligan: throw back hands that lack multiple ramp sources or early defense, as falling behind on mana is fatal.`
    : `Take full advantage of the free London Mulligan in Commander: throw back any hand that cannot deploy an active play or ramp by Turn 2 or 3.`;

  return {
    idealHandProfile: idealProfile,
    keepableCriteria,
    trapHands,
    mulliganRecommendation
  };
}

/**
 * Builds dynamic recovery tactics for ANY deck and archetype
 */
export function buildDynamicRecoveryTactics(commander: SimCard, cards: SimCard[] = [], archetype = ''): DeckPlaybook['recoveryTactics'] {
  const cName = commander.name;
  const arch = archetype.toLowerCase();
  const cardNames = new Set(cards.map((c) => c.name.toLowerCase()));

  const boardWipeRecovery: string[] = [
    `The "Sandbagging" Rule: Never commit your entire hand to the battlefield. Keep at least 1 high-value engine or burst draw spell in reserve to rebuild immediately post-wipe.`,
    `Commander Re-cast Strategy: With ample mana developed in the early game, re-casting ${cName} with commander tax can immediately re-establish your strategy. Calculate commander tax ({2} per previous cast) before spending mana.`,
    `Non-creature Assets: Value engines anchored on artifacts, enchantments, and lands survive standard creature board wipes; lean on them to recover tempo immediately on your untap step.`,
    `Floating Mana & Sac Outlets in Response: If an opponent casts a board wipe, hold priority and activate sacrifice outlets (Ashnod's Altar, Viscera Seer, Goblin Bombardment) to convert doomed creatures into mana, scry triggers, or death drain before they leave the battlefield.`,
    `Handling Destroy vs. Exile vs. Bounce: Indestructible effects (Heroic Intervention, Boros Charm) only stop destruction; against mass exile (Farewell, Sunfall), rely on phasing (Teferi's Protection, Clever Concealment). Against mass bounce (Cyclonic Rift), prioritize redeploying low-CMC mana rocks before the cleanup step to avoid discarding.`
  ];

  if (arch.includes('graveyard') || arch.includes('reanimat') || cardNames.has('living death')) {
    boardWipeRecovery.push(`Graveyard Mass-Reanimation: Treat opponent board wipes as fuel for mass reanimation (Living Death, Rise of the Dark Realms, Patriarch's Bidding); let your board die, then reanimate everything on your turn for game-winning ETB triggers.`);
  }

  if (arch.includes('aristocrat') || cardNames.has('blood artist') || cardNames.has('zulaport cutthroat')) {
    boardWipeRecovery.push(`Stacking Simultaneous Death Triggers: In a board wipe, all creatures die simultaneously. Position your drain engines (Blood Artist, Zulaport Cutthroat) to trigger for every dying creature, often dealing 15–30 direct damage to close the game as the wipe resolves.`);
  }

  const interactionHoldGuidance: string[] = [
    `Threat Hierarchy (Combos > Stax Locks > Opponent Win-Conditions): Save premium spot removal strictly for game-ending combo pieces, asymmetric stax locks, or lethal attackers. Never waste removal on incidental utility creatures or commander ramp.`,
    `The 2-Mana Bluff: Always keep 1–2 mana open (especially with Blue, Black, or White sources) when passing turns. Even with a weak hand, open mana signals counterspells or removal and deters opponents from attacking you or attempting combo wins.`,
    `Timing Removal at the Last Possible Window: Cast removal on the active opponent's end step right before your turn, or during combat after attackers are officially declared. Never act at sorcery speed on your own turn unless removing a stax piece that blocks your play.`,
    `Stack Sequencing & Priority Windows: When an opponent casts a game-threatening spell, do not immediately counter it if other players also have open mana. Pass priority to force opponents to burn their interaction first; Commander is a multiplayer game.`,
    `Defensive Protection Over Disruption: When piloting a synergy or combo deck, preserve your counterspells and protective spells (Fierce Guardianship, Deflecting Swat, Veil of Summer, Heroic Intervention) to defend your own winning turn rather than policing the entire table.`
  ];

  const staxCounterplay: string[] = [
    `Against Rule of Law / Arcane Laboratory / Deafening Silence: Pivot from multi-spell storm turns to high-impact single spells and activated abilities. Leverage flash spells or abilities on opponent end steps to bypass the 1-spell-per-turn limitation.`,
    `Against Rest in Peace / Dauthi Voidwalker / Graveyard Hate: Stop discarding to loot spells and pivot to direct battlefield permanents and combat pressure. Tutor directly for enchantment/creature removal before committing combo lines.`,
    `Against Collector Ouphe / Null Rod / Stony Silence: If artifact mana is locked down, shift to land-based ramp, creature dorks, and colored spells. Save targeted removal for the hate piece on the end step prior to your winning turn.`,
    `Against Anti-Search & Anti-Draw (Opposition Agent, Orcish Bowmasters, Narset): Cease cracking fetchlands and tutoring while Opposition Agent is on the battlefield. Against Bowmasters, avoid mass draw spells; rely on impulse draw (exile and play) or single card draws.`,
    `Against Commander Lockdown (Drannith Magistrate, Imprisoned in the Moon, Song of the Dryads): Prioritize generic spot removal on Drannith Magistrate. If ${cName} is turned into a land or aura, sacrifice it to a sac outlet or destroy the land to return ${cName} to the command zone.`,
    `Against Blood Moon / Back to Basics / Nonbasic Land Hate: Fetch at least 2–3 basic lands during early turns if your deck runs multiple colors. Keep colored mana rocks (Arcane Signet, Talismans) active to cast colored spells through Blood Moon.`
  ];

  return {
    boardWipeRecovery,
    interactionHoldGuidance,
    staxCounterplay
  };
}

/**
 * Universal Deck Playbook generator for ANY Commander and deck list
 */
export function generateDeckPlaybook(
  deckCards: SimCard[],
  commander: SimCard,
  archetype = 'Custom Archetype',
  deckName = 'Deck Playbook'
): DeckPlaybook {
  const cardNames = new Set([commander.name.toLowerCase(), ...deckCards.map((c) => c.name.toLowerCase())]);

  // Match combos from master registry against cards present in deck
  const evaluatedCombos: ComboWalkthrough[] = MASTER_COMBO_REGISTRY.map((combo, idx) => {
    let presentCount = 0;
    const missing: string[] = [];

    for (const card of combo.cards) {
      if (cardNames.has(card.toLowerCase())) {
        presentCount++;
      } else {
        missing.push(card);
      }
    }

    return {
      id: `combo-${idx}`,
      name: combo.name,
      cards: combo.cards,
      isInfinite: combo.isInfinite,
      result: combo.result,
      prerequisites: combo.prerequisites,
      steps: combo.steps,
      disruptionWindow: combo.disruptionWindow,
      inDeckCount: presentCount,
      totalCardsCount: combo.cards.length,
      missingCards: missing
    };
  }).sort((a, b) => b.inDeckCount - a.inDeckCount);

  const synergyPlays = detectDynamicSynergyPlays(deckCards, commander, archetype);
  const gamePhases = buildDynamicGamePhases(deckCards, commander, archetype);
  const mulliganGuide = buildDynamicMulliganGuide(deckCards, commander, archetype);
  const recoveryTactics = buildDynamicRecoveryTactics(commander, deckCards, archetype);

  let estimatedSpeed: DeckPlaybook['estimatedSpeed'] = 'Balanced (Turns 6–8)';
  if (/aggro|burn|fast/i.test(archetype) || (commander.cmc ?? 4) <= 2) {
    estimatedSpeed = 'Fast (Turns 3–5)';
  } else if (/control|stax|late|long/i.test(archetype) || (commander.cmc ?? 4) >= 6) {
    estimatedSpeed = 'Long Game (Turns 9+)';
  }

  return {
    deckName,
    commanderName: commander.name,
    archetype,
    overview: `A strategic piloting playbook for ${deckName} commanded by ${commander.name}. This playbook covers opening hand mulligan discipline, phase-by-phase execution, combo loops, and recovery lines after disruption.`,
    estimatedSpeed,
    gamePhases,
    combos: evaluatedCombos,
    synergyPlays,
    mulliganGuide,
    recoveryTactics
  };
}
