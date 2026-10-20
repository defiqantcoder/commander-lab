import Dexie, { type Table } from 'dexie';

export interface CardImageUris {
  small?: string;
  normal?: string;
  large?: string;
  art_crop?: string;
  png?: string;
}

export interface CollectionCard {
  id: string; // Scryfall UUID
  name: string;
  set: string;
  collectorNumber: string;
  foil: boolean;
  purchasePrice?: number;
  currentPriceUsd?: number;
  quantity: number;
  reprintRiskScore?: number;
  colors?: string[];
  colorIdentity?: string[];
  manaCost?: string;
  cmc?: number;
  typeLine?: string;
  imageUris?: CardImageUris;
  updatedAt?: Date;
}

export interface DeckCardEntry {
  id: string;
  name: string;
  category: 'commander' | 'ramp' | 'draw' | 'engine' | 'interaction' | 'payoff' | 'land' | 'other';
  synergyNotes?: string;
  quantity: number;
  manaCost?: string;
  cmc?: number;
  typeLine?: string;
  imageUris?: CardImageUris;
  colorIdentity?: string[];
}

export interface SavedDeck {
  id: string;
  name: string;
  commanderId: string;
  commanderName?: string;
  archetype: string;
  saltScore: number;
  powerLevel?: number;
  cards: DeckCardEntry[];
  updatedAt: Date;
}

export interface MarketCacheEntry<T = unknown> {
  id: string; // Scryfall UUID or query string
  name: string;
  data: T;
  cachedAt: number; // epoch ms
}

export interface SimRun {
  id: string;
  deckId: string;
  commanderName: string;
  timestamp: number;
  turns: Array<{
    turnNumber: number;
    hand: string[];
    battlefield: string[];
    graveyard: string[];
    manaAvailable: number;
    actionsTaken: string[];
  }>;
  summary: {
    turn3Mana: number;
    turn4PayoffsCast: number;
    mulliganCount: number;
    curvedOut: boolean;
  };
}

export class CommanderLabDB extends Dexie {
  collection!: Table<CollectionCard, string>;
  decks!: Table<SavedDeck, string>;
  marketCache!: Table<MarketCacheEntry<unknown>, string>;
  simRuns!: Table<SimRun, string>;

  constructor() {
    super('CommanderLabDB');
    this.version(1).stores({
      collection: 'id, name, set, currentPriceUsd, reprintRiskScore, updatedAt',
      decks: 'id, name, commanderId, archetype, updatedAt',
      marketCache: 'id, name, cachedAt',
      simRuns: 'id, deckId, timestamp'
    });
  }
}

export const db = new CommanderLabDB();

// Helper database operations
export async function getCollection(): Promise<CollectionCard[]> {
  return await db.collection.toArray();
}

export async function addOrUpdateCollectionCard(card: CollectionCard): Promise<string> {
  card.updatedAt = new Date();
  return await db.collection.put(card);
}

export async function removeCollectionCard(id: string): Promise<void> {
  await db.collection.delete(id);
}

export async function getDeck(id: string): Promise<SavedDeck | undefined> {
  return await db.decks.get(id);
}

export async function getAllDecks(): Promise<SavedDeck[]> {
  return await db.decks.orderBy('updatedAt').reverse().toArray();
}

export async function saveDeck(deck: SavedDeck): Promise<string> {
  deck.updatedAt = new Date();
  return await db.decks.put(deck);
}

export async function deleteDeck(id: string): Promise<void> {
  await db.decks.delete(id);
}

