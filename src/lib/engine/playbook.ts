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
      'Walking Ballista on the battlefield with at least two +1/+1 counters (or one counter if Heliod can give lifelink immediately)',
      '{1}{W} available to activate Heliod’s lifelink ability'
    ],
    steps: [
      'Activate Heliod targeting Walking Ballista to give it lifelink until end of turn for {1}{W}.',
      'Remove a +1/+1 counter from Walking Ballista to deal 1 damage to any target (opponent or creature).',
      'Because Ballista has lifelink, dealing 1 damage causes you to gain 1 life.',
      'Heliod’s triggered ability triggers whenever you gain life. Target Walking Ballista to put a +1/+1 counter on it.',
      'Repeat steps 2–4 infinitely to deal lethal damage to all opponents.'
    ],
    disruptionWindow: 'Opponents can cast instant-speed removal in response to Heliod’s lifelink activation, or when Walking Ballista has only 1 counter remaining.'
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
      'A creature that creates at least two tokens upon entering (or dying), e.g. Grave Titan, Marionette Apprentice'
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
    disruptionWindow: 'Removal targeting the initial creature in response to Twinflame, or counterspell targeting Dualcaster Mage.'
  },
  {
    name: 'Krenko + Thornbite Staff / Umbral Mantle',
    cards: ['Krenko, Mob Boss', 'Thornbite Staff'],
    isInfinite: true,
    result: 'Infinite Goblins, infinite ETB triggers, and infinite death triggers',
    prerequisites: [
      'Krenko, Mob Boss equipped with Thornbite Staff',
      'A sacrifice outlet (e.g. Skirk Prospector, Goblin Bombardment, Ashnod’s Altar) or at least 2 goblins on board'
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
    result: 'Complete recurring combat damage fog lock against all opponents',
    prerequisites: [
      'Meren of Clan Nel Toth on battlefield with at least 1 experience counter',
      'Spore Frog on battlefield or in graveyard'
    ],
    steps: [
      'During opponents’ combat steps, sacrifice Spore Frog to prevent all combat damage that turn.',
      'Spore Frog dying gives Meren an additional experience counter.',
      'At the beginning of your end step, Meren triggers: return Spore Frog from your graveyard directly to the battlefield.',
      'Repeat every turn cycle to render opponent combat damage completely ineffective.'
    ],
    disruptionWindow: 'Graveyard exile (Bojuka Bog, Soul-Guide Lantern) in response to the end-step trigger, or removal on Meren.'
  }
];

/**
 * Extracts colors from a mana cost string like "{3}{W}{U}{B}{G}"
 */
export function extractColors(manaCost = ''): string[] {
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
export function detectDynamicSynergyPlays(cards: SimCard[], commander: SimCard): SynergyPlay[] {
  const plays: SynergyPlay[] = [];
  const cardNames = new Set([commander.name.toLowerCase(), ...cards.map((c) => c.name.toLowerCase())]);
  const cText = (commander.oracleText || '').toLowerCase();

  // 1. Counter & Proliferate Synergies
  const isCounterCommander = /counter|proliferate/i.test(cText);
  if (isCounterCommander || cardNames.has('evolution sage')) {
    if (cardNames.has('hardened scales')) {
      plays.push({
        id: 'syn-counters-scales',
        title: `Exponential Growth: Hardened Scales + ${commander.name}`,
        cards: ['Hardened Scales', commander.name],
        category: 'engine',
        description: 'Hardened Scales adds an extra counter on every counter-placement event, compounding continuous counter triggers exponentially.',
        tacticalTip: 'Prioritize placing the first counter early; each subsequent trigger or proliferate will scale up without requiring extra mana investment.'
      });
    }

    if (cardNames.has('the ozolith')) {
      plays.push({
        id: 'syn-ozolith-preservation',
        title: `Board Wipe Insurance: The Ozolith + ${commander.name}`,
        cards: ['The Ozolith', commander.name],
        category: 'protection',
        description: `When opponents remove your modified creatures or cast a board wipe, The Ozolith catches every single counter. When ${commander.name} returns, combat immediately transfers every counter back.`,
        tacticalTip: `Keep The Ozolith loaded on the battlefield. Even after a board wipe, casting ${commander.name} lets you swing with an immediate lethal threat during combat.`
      });
    }

    if (cardNames.has('deepglow skate')) {
      plays.push({
        id: 'syn-deepglow-multiplier',
        title: `The Doubling Turn: Deepglow Skate Finisher`,
        cards: ['Deepglow Skate', commander.name],
        category: 'value',
        description: 'Deepglow Skate doubles every counter on every permanent you control upon entering the battlefield. This can push loyalty to ultimate threshold or double power for lethal.',
        tacticalTip: 'Wait until you have at least 3 distinct permanents with counters before deploying. If you control Planeswalkers, double loyalty and activate ultimate abilities immediately.'
      });
    }

    if (cardNames.has('evolution sage')) {
      plays.push({
        id: 'syn-landfall-proliferate',
        title: `Landfall Velocity: Evolution Sage + Fetchlands`,
        cards: ['Evolution Sage', commander.name],
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
        title: `Burn Clock: ${burnCard} + ${commander.name}`,
        cards: [burnCard, commander.name],
        category: 'combat',
        description: `Each token created deals direct damage to each opponent, converting board development into unavoidable table-wide burn.`,
        tacticalTip: `Resolve ${burnCard} before activating ${commander.name}'s token production. You often do not even need to attack to win the game.`
      });
    }

    if (cardNames.has('shared animosity') || cardNames.has('coat of arms')) {
      const anthem = cardNames.has('shared animosity') ? 'Shared Animosity' : 'Coat of Arms';
      plays.push({
        id: 'syn-tribal-pump',
        title: `Overwhelming Swarm: ${anthem} + ${commander.name}`,
        cards: [anthem, commander.name],
        category: 'combat',
        description: `As token count scales, each attacking creature gains massive power, transforming small 1/1s into lethal attackers.`,
        tacticalTip: `Calculate total attacking power before combat. Even 6 or 7 tokens can swing for 40+ total damage in a single alpha strike.`
      });
    }
  }

  // 3. Spellslinger & Storm Synergies
  const isSpellsCommander = /instant.*sorcery|whenever you cast.*noncreature|magecraft|draw.*spell/i.test(cText);
  if (isSpellsCommander) {
    if (cardNames.has('archmage emeritus') || cardNames.has('whirlwind denial')) {
      plays.push({
        id: 'syn-spell-chain',
        title: `Perpetual Draw: Archmage Emeritus + ${commander.name}`,
        cards: ['Archmage Emeritus', commander.name],
        category: 'value',
        description: `Every cheap instant or cantrip you cast replaces itself while triggering ${commander.name}'s abilities, fueling continuous spell chains.`,
        tacticalTip: 'Hold low-cost 1-mana cantrips (Opt, Brainstorm, Ponder) until your engine piece is on board to immediately draw into protection.'
      });
    }
  }

  // 4. Graveyard & Aristocrats Synergies
  const isGraveyardCommander = /graveyard|dies|sacrifice|reanimate/i.test(cText);
  if (isGraveyardCommander) {
    if (cardNames.has('blood artist') || cardNames.has('zulaport cutthroat')) {
      const drainCard = cardNames.has('blood artist') ? 'Blood Artist' : 'Zulaport Cutthroat';
      plays.push({
        id: 'syn-aristocrat-drain',
        title: `Life Siphon: ${drainCard} + ${commander.name}`,
        cards: [drainCard, commander.name],
        category: 'value',
        description: `Every creature sacrificed or recycled through the graveyard drains opponents and buffers your life total, turning removal into win conditions.`,
        tacticalTip: `Sacrifice utility creatures in response to exile removal to ensure you get death triggers and experience or graveyard counters.`
      });
    }
  }

  // 5. Card Draw & Tax Synergies (Universal)
  if (cardNames.has('esper sentinel')) {
    plays.push({
      id: 'syn-esper-tax',
      title: 'Taxation Engine: Esper Sentinel Advantage',
      cards: ['Esper Sentinel', commander.name],
      category: 'mana',
      description: 'Opponents must pay mana equal to Esper Sentinel’s power to prevent you from drawing. Any power increase turns it into an unpayable Rhystic Study.',
      tacticalTip: 'Equip or place counters on Esper Sentinel early. Raising its power to 3 or 4 virtually guarantees drawing a card off every noncreature spell opponents cast.'
    });
  }

  // 6. Fast Mana Opener (Universal)
  if (cardNames.has('sol ring') && cardNames.has('arcane signet')) {
    plays.push({
      id: 'syn-fast-mana-opener',
      title: `Turn 1 Acceleration: Sol Ring into Mana Rock`,
      cards: ['Sol Ring', 'Arcane Signet'],
      category: 'mana',
      description: `Playing Sol Ring on Turn 1 enables casting Arcane Signet immediately, establishing 4–5 mana available by Turn 2.`,
      tacticalTip: `Enables deploying ${commander.name} multiple turns ahead of schedule, seizing table momentum before opponents establish interaction.`
    });
  }

  return plays;
}

/**
 * Builds dynamic game phase instructions tailored to ANY commander and deck archetype
 */
export function buildDynamicGamePhases(cards: SimCard[], commander: SimCard, archetype: string): DeckPlaybook['gamePhases'] {
  const cmc = commander.cmc ?? 4;
  const colors = extractColors(commander.manaCost);
  const colorCount = colors.length;
  const cName = commander.name;

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

  return {
    early: {
      turns: earlyTurns,
      title: colorCount >= 3 ? 'Color Fixing & Mana Ramp' : 'Mana Acceleration & Board Setup',
      objective: colorCount >= 3
        ? `Establish all ${colorCount} colors (${colors.join(', ')}) of mana, accelerate past ${cmc} mana, and deploy low-CMC utility permanents.`
        : `Accelerate into ${cmc} mana to cast ${cName} on curve while establishing early board presence.`,
      keyCards: earlyTargets,
      priorities: [
        colorCount >= 3
          ? `Prioritize land fetching and color fixing to avoid being locked out of colored pips.`
          : `Deploy 1–2 CMC mana rocks or mana dorks on curve to accelerate commander deployment.`,
        `Lay down early engine pieces or setup permanents before casting ${cName}.`,
        `Never miss a land drop during the first 3 turns; land consistency is paramount.`
      ],
      warnings: [
        `Do not rush ${cName} onto an empty board if opponents are holding open mana for spot removal or counterspells.`,
        `Avoid keeping 1-land or 2-land opening hands that lack early mana ramp.`
      ]
    },
    mid: {
      turns: midTurns,
      title: 'Engine Deployment & Value Compounding',
      objective: `Resolve ${cName} with value or protection backup, compound synergy triggers, and establish resilient card advantage.`,
      keyCards: [cName, ...cards.filter((c) => c.category === 'engine').map((c) => c.name).slice(0, 3)],
      priorities: [
        `Resolve ${cName} during a turn where you can extract immediate value or hold up protection.`,
        `Activate core synergy feedback loops to pull ahead on resources, cards, or board state.`,
        `Preserve 1–2 mana for instant-speed interaction (counterspells or removal) to defend your engine against sweeps.`
      ],
      warnings: [
        `Do not overcommit your entire hand to the battlefield without holding insurance against board wipes.`,
        `Track opponent open mana; bait counterspells with secondary spells before committing core pieces.`
      ]
    },
    late: {
      turns: lateTurns,
      title: 'Executing Win Conditions & Closing the Table',
      objective: `Deploy decisive payoffs, execute combo lines, or assemble lethal combat damage to eliminate opponents.`,
      keyCards: latePayoffCards,
      priorities: [
        `Deploy high-impact payoffs (${latePayoffCards.slice(0, 2).join(' or ')}) to establish an insurmountable clock.`,
        `Focus down the highest-threat opponent first (control or combo players holding interaction).`,
        `Always keep backup mana open to protect your winning turn against opponent disruption.`
      ],
      warnings: [
        `Beware of mass exile effects (e.g. Farewell, Cyclonic Rift) that bypass indestructible or graveyard recursion.`,
        `Never initiate a vulnerable win attempt without calculating opponent response windows.`
      ]
    }
  };
}

/**
 * Builds dynamic mulligan rules tailored to the deck's colors and curve
 */
export function buildDynamicMulliganGuide(cards: SimCard[], commander: SimCard): MulliganGuide {
  const colors = extractColors(commander.manaCost);
  const colorCount = colors.length;
  const cName = commander.name;
  const cmc = commander.cmc ?? 4;

  const idealProfile = [
    colorCount >= 3
      ? `3 lands representing at least ${Math.min(colorCount, 3)} different colors`
      : '3 lands with balanced color requirements',
    '1 low-CMC mana acceleration spell (Sol Ring, Arcane Signet, or mana dork)',
    `1 low-cost card advantage or engine piece to play before ${cName}`,
    '1 piece of cheap interaction or removal to disrupt early opponent momentum'
  ];

  const keepableCriteria = [
    `3 lands + 1 ramp spell: Guarantees casting ${cName} on or ahead of curve.`,
    '2 lands + Sol Ring + 2-mana rock: Supercharged explosive opener establishing an insurmountable mana lead.',
    '3 lands + 1 draw engine + 1 interaction: Resilient attrition hand that will not stall out in the mid-game.'
  ];

  const trapHands = [
    'The "Expensive Bomb" Trap: Hands with 3 lands and all 5+ CMC spells with zero early plays; leaves you defenseless for 4 turns.',
    colorCount >= 3
      ? `The "Color Screwed" Trap: Hands with lands producing only 1 or 2 colors in a ${colorCount}-color deck without fixing.`
      : 'The "Flooded" Trap: Hands with 5 or 6 lands and only 1 actionable spell.',
    'The "Zero Ramp" Hand: 4 lands and only mid-game spells with no acceleration; immediately falls behind faster pods.'
  ];

  return {
    idealHandProfile: idealProfile,
    keepableCriteria,
    trapHands,
    mulliganRecommendation: `Take full advantage of the free London Mulligan in Commander: throw back any hand that cannot deploy an active play or ramp by Turn 2 or 3.`
  };
}

/**
 * Builds dynamic recovery tactics for ANY deck
 */
export function buildDynamicRecoveryTactics(commander: SimCard): DeckPlaybook['recoveryTactics'] {
  const cName = commander.name;

  return {
    boardWipeRecovery: [
      `Engine Redistribution: Do not overcommit all creatures from hand. Keep at least 1 high-value engine or draw spell in reserve to rebuild immediately.`,
      `Commander Re-cast: With ample mana developed in the early game, re-casting ${cName} with commander tax can immediately re-establish your strategy.`,
      `Non-creature Assets: Value engines anchored on artifacts, enchantments, and lands survive standard creature board wipes; lean on them to recover tempo.`
    ],
    interactionHoldGuidance: [
      `Save premium spot removal strictly for game-ending combo pieces, stax locks, or lethal attackers. Never waste removal on incidental utility creatures.`,
      `Always keep 1–2 mana open if opponents suspect you have instant interaction; the threat of removal often deters attacks.`
    ],
    staxCounterplay: [
      `Against Rule of Law / Collector Ouphe: Pivot to single-spell impact and activated abilities on existing board pieces rather than storm chains.`,
      `Against Rest in Peace / Graveyard Hate: Rely on direct battlefield permanents and combat pressure rather than graveyard recursion.`
    ]
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

  const synergyPlays = detectDynamicSynergyPlays(deckCards, commander);
  const gamePhases = buildDynamicGamePhases(deckCards, commander, archetype);
  const mulliganGuide = buildDynamicMulliganGuide(deckCards, commander);
  const recoveryTactics = buildDynamicRecoveryTactics(commander);

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
