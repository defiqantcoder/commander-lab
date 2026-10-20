export interface CardCheckItem {
  id: string;
  name: string;
  quantity: number;
  colorIdentity: string[]; // e.g. ['U', 'B']
  typeLine: string;
  isCommander?: boolean;
  oracleText?: string;
}

export interface ValidationError {
  type: 'deck_size' | 'color_identity' | 'singleton' | 'banned' | 'invalid_commander';
  message: string;
  cardName?: string;
}

export interface ValidationWarning {
  type: 'high_salt' | 'low_land_count' | 'missing_ramp' | 'partner_pairing';
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  totalCards: number;
  commanderCount: number;
  colorIdentity: string[];
  errors: ValidationError[];
  warnings: ValidationWarning[];
  breakdown: {
    lands: number;
    nonLands: number;
  };
}

// Official Commander Banlist (updated with recent RC bans: Mana Crypt, Jeweled Lotus, Dockside Extortionist, Nadu)
export const COMMANDER_BANLIST = new Set<string>([
  'Ancestral Recall',
  'Balance',
  'Biorhythm',
  'Black Lotus',
  'Braids, Cabal Minion',
  'Chaos Orb',
  'Coalition Victory',
  'Channel',
  'Dockside Extortionist',
  'Emrakul, the Aeons Torn',
  'Erayo, Soratami Ascendant',
  'Falling Star',
  'Fastbond',
  'Flash',
  'Gifts Ungiven',
  'Golos, Tireless Pilgrim',
  'Griselbrand',
  'Hullbreacher',
  'Iona, Shield of Emeria',
  'Jeweled Lotus',
  'Karakas',
  'Leovold, Emissary of Trest',
  'Library of Alexandria',
  'Limited Resources',
  'Lutri, the Spellchaser',
  'Mana Crypt',
  'Mox Emerald',
  'Mox Jet',
  'Mox Pearl',
  'Mox Ruby',
  'Mox Sapphire',
  'Nadu, Winged Wisdom',
  'Panoptic Mirror',
  'Paradox Engine',
  'Primeval Titan',
  'Prophet of Kruphix',
  'Recurring Nightmare',
  'Rofellos, Llanowar Emissary',
  'Shahrazad',
  'Sundering Titan',
  'Sway of the Stars',
  'Sylvan Primordial',
  'Time Vault',
  'Time Walk',
  'Tinker',
  'Tolarian Academy',
  'Trade Secrets',
  'Upheaval',
  'Yawgmoth\'s Bargain'
]);

// Cards that circumvent the singleton rule
const UNRESTRICTED_CARD_NAMES = new Set<string>([
  'Plains',
  'Island',
  'Swamp',
  'Mountain',
  'Forest',
  'Wastes',
  'Snow-Covered Plains',
  'Snow-Covered Island',
  'Snow-Covered Swamp',
  'Snow-Covered Mountain',
  'Snow-Covered Forest',
  'Snow-Covered Wastes',
  'Relentless Rats',
  'Rat Colony',
  'Shadowborn Apostle',
  'Persistent Petitioners',
  'Dragon\'s Approach',
  'Nazgûl',
  'Slime Against Humanity',
  'Hare Apparent',
  'Seven Dwarves' // Allows up to 7
]);

function validateCommanderPresence(commanders: CardCheckItem[], errors: ValidationError[]) {
  if (commanders.length === 0) {
    errors.push({
      type: 'invalid_commander',
      message: 'Deck must have at least one designated Commander.'
    });
  } else if (commanders.length > 2) {
    errors.push({
      type: 'invalid_commander',
      message: 'Commander decks cannot have more than 2 commanders (e.g. Partner / Friends Forever / Background pairs).'
    });
  }
}

function getCommanderColors(commanders: CardCheckItem[], errors: ValidationError[]): string[] {
  const commanderColorSet = new Set<string>();
  for (const cmd of commanders) {
    const isLegendaryCreature = /legendary.*creature/i.test(cmd.typeLine);
    const isPlaneswalkerCommander =
      /planeswalker/i.test(cmd.typeLine) && /can be your commander/i.test(cmd.oracleText || '');
    const isBackgroundCommander =
      /legendary.*background/i.test(cmd.typeLine);

    if (!isLegendaryCreature && !isPlaneswalkerCommander && !isBackgroundCommander) {
      errors.push({
        type: 'invalid_commander',
        message: `${cmd.name} is not an eligible commander (must be Legendary Creature, eligible Planeswalker, or Background).`,
        cardName: cmd.name
      });
    }

    cmd.colorIdentity.forEach((c) => commanderColorSet.add(c.toUpperCase()));
  }
  return Array.from(commanderColorSet);
}

function validateDeckSize(totalCount: number, errors: ValidationError[]) {
  if (totalCount !== 100) {
    errors.push({
      type: 'deck_size',
      message: `Total deck count is ${totalCount} cards. Commander decks must have exactly 100 cards.`
    });
  }
}

function validateCards(
  cards: CardCheckItem[],
  commanderColors: string[],
  errors: ValidationError[]
): number {
  let landCount = 0;
  const nameCounts = new Map<string, number>();
  const commanderColorSet = new Set(commanderColors);

  for (const card of cards) {
    const qty = card.quantity || 1;
    const name = card.name.trim();

    if (/land/i.test(card.typeLine)) {
      landCount += qty;
    }

    if (COMMANDER_BANLIST.has(name)) {
      errors.push({
        type: 'banned',
        message: `${name} is banned in the Commander / EDH format.`,
        cardName: name
      });
    }

    const currentCount = (nameCounts.get(name) || 0) + qty;
    nameCounts.set(name, currentCount);

    if (currentCount > 1 && !UNRESTRICTED_CARD_NAMES.has(name)) {
      if (name === 'Seven Dwarves' && currentCount <= 7) {
        // Allowed
      } else {
        errors.push({
          type: 'singleton',
          message: `${name} violates singleton rule (${currentCount} copies present).`,
          cardName: name
        });
      }
    }

    if (!card.isCommander && card.colorIdentity.length > 0) {
      const invalidColors = card.colorIdentity.filter(
        (c) => !commanderColorSet.has(c.toUpperCase())
      );
      if (invalidColors.length > 0) {
        errors.push({
          type: 'color_identity',
          message: `${name} has color identity [${invalidColors.join(', ')}] which is not in the commander's identity [${commanderColors.join(', ') || 'Colorless'}].`,
          cardName: name
        });
      }
    }
  }

  return landCount;
}

function validateDeckHealth(landCount: number, warnings: ValidationWarning[]) {
  if (landCount > 0 && landCount < 30) {
    warnings.push({
      type: 'low_land_count',
      message: `Low land count detected (${landCount} lands). Recommended baseline is 34-38 lands.`
    });
  }
}

export function validateDeck(cards: CardCheckItem[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const commanders = cards.filter((c) => c.isCommander);
  const totalCount = cards.reduce((sum, c) => sum + (c.quantity || 1), 0);

  validateCommanderPresence(commanders, errors);
  const commanderColors = getCommanderColors(commanders, errors);
  validateDeckSize(totalCount, errors);
  const landCount = validateCards(cards, commanderColors, errors);
  validateDeckHealth(landCount, warnings);

  return {
    valid: errors.length === 0,
    totalCards: totalCount,
    commanderCount: commanders.length,
    colorIdentity: commanderColors,
    errors,
    warnings,
    breakdown: {
      lands: landCount,
      nonLands: totalCount - landCount
    }
  };
}

