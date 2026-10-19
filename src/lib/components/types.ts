export interface CollectionCard {
  id: string;
  name: string;
  set: string;
  collectorNumber: string;
  foil: boolean;
  purchasePrice?: number;
  currentPriceUsd?: number;
  quantity: number;
  reprintRiskScore?: number;
}

export type CardRole = 'ramp' | 'draw' | 'engine' | 'interaction' | 'payoff' | 'commander';

export interface DeckCard extends CollectionCard {
  manaCost: string;
  cmc: number;
  role: CardRole;
  typeLine: string;
  synergyNotes?: string;
  budgetReplacement?: string;
}

export interface SavedDeck {
  id: string;
  name: string;
  commanderId: string;
  archetype: string;
  saltScore: number;
  cards: { id: string; name: string; category: string; synergyNotes: string }[];
  updatedAt: Date;
}

export function manaSymbols(manaCost: string): string[] {
  return manaCost.match(/\{([^}]+)\}/g)?.map((symbol) => symbol.slice(1, -1)) ?? [];
}
