import type { CollectionCard as StoredCollectionCard, SavedDeck as StoredSavedDeck } from '$lib/db';

export type CollectionCard = StoredCollectionCard;
export type SavedDeck = StoredSavedDeck;
export type CardRole = 'commander' | 'ramp' | 'draw' | 'engine' | 'interaction' | 'payoff' | 'land' | 'other';

export interface DeckCard extends CollectionCard {
  manaCost: string;
  cmc: number;
  role: CardRole;
  typeLine: string;
  oracleText?: string;
  synergyNotes?: string;
  budgetReplacement?: string;
}

export function manaSymbols(manaCost: string): string[] {
  return manaCost.match(/\{([^}]+)\}/g)?.map((symbol) => symbol.slice(1, -1)) ?? [];
}
