// [/] Jules
import { db } from '$lib/db';

export interface ScryfallCard {
  id: string;
  name: string;
  mana_cost?: string;
  cmc: number;
  type_line: string;
  oracle_text?: string;
  colors?: string[];
  color_identity: string[];
  keywords?: string[];
  set: string;
  set_name?: string;
  collector_number: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'mythic' | 'special' | 'bonus';
  reserved: boolean;
  reprint: boolean;
  prices: {
    usd?: string | null;
    usd_foil?: string | null;
    usd_etched?: string | null;
    eur?: string | null;
    tix?: string | null;
  };
  image_uris?: {
    small?: string;
    normal?: string;
    large?: string;
    png?: string;
    art_crop?: string;
    border_crop?: string;
  };
  card_faces?: Array<{
    name: string;
    mana_cost?: string;
    type_line?: string;
    oracle_text?: string;
    image_uris?: {
      small?: string;
      normal?: string;
      large?: string;
      art_crop?: string;
    };
  }>;
  legalities?: Record<string, string>;
  edhrec_rank?: number;
  salt_score?: number;
}

export interface ScryfallSearchResponse {
  total_cards: number;
  has_more: boolean;
  next_page?: string;
  data: ScryfallCard[];
}

export interface ScryfallAutocompleteResponse {
  total_values: number;
  data: string[];
}

// Rate Limiter: Minimum 100ms between calls
class RequestQueue {
  private lastRequestTime = 0;
  private readonly minDelayMs = 100;
  private queue: Array<() => Promise<void>> = [];
  private isProcessing = false;

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const now = Date.now();
          const elapsed = now - this.lastRequestTime;
          if (elapsed < this.minDelayMs) {
            await new Promise((r) => setTimeout(r, this.minDelayMs - elapsed));
          }
          this.lastRequestTime = Date.now();
          const result = await fn();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    while (this.queue.length > 0) {
      const nextFn = this.queue.shift();
      if (nextFn) {
        await nextFn();
      }
    }
    this.isProcessing = false;
  }
}

const queue = new RequestQueue();
const SCRYFALL_BASE = 'https://api.scryfall.com';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function fetchWithCache<T>(cacheKey: string, url: string): Promise<T> {
  // 1. Check IndexedDB cache if available in browser
  try {
    if (typeof indexedDB !== 'undefined' && db?.marketCache) {
      const cached = await db.marketCache.get(cacheKey);
      if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
        return cached.data as T;
      }
    }
  } catch (e) {
    console.warn('Cache lookup failed, proceeding with network fetch:', e);
  }

  // 2. Fetch via rate-limited queue
  const data = await queue.enqueue(async () => {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CommanderLab/1.0 (https://github.com/commander-lab)',
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Card or query not found (404)`);
      }
      throw new Error(`Scryfall API error: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
  });

  // 3. Save to cache asynchronously
  try {
    if (typeof indexedDB !== 'undefined' && db?.marketCache) {
      await db.marketCache.put({
        id: cacheKey,
        name: cacheKey,
        data,
        cachedAt: Date.now()
      });
    }
  } catch (e) {
    console.warn('Failed to cache Scryfall response:', e);
  }

  return data;
}

/**
 * Searches Scryfall for cards matching full syntax query
 */
export async function searchCards(query: string, page = 1): Promise<ScryfallSearchResponse> {
  const encodedQuery = encodeURIComponent(query);
  const cacheKey = `search:${query}:${page}`;
  const url = `${SCRYFALL_BASE}/cards/search?q=${encodedQuery}&page=${page}`;
  return await fetchWithCache<ScryfallSearchResponse>(cacheKey, url);
}

/**
 * Fetches card by exact or fuzzy name
 */
export async function getCardByName(name: string, exact = false): Promise<ScryfallCard> {
  const param = exact ? `exact=${encodeURIComponent(name)}` : `fuzzy=${encodeURIComponent(name)}`;
  const cacheKey = `name:${exact ? 'exact' : 'fuzzy'}:${name.toLowerCase()}`;
  const url = `${SCRYFALL_BASE}/cards/named?${param}`;
  return await fetchWithCache<ScryfallCard>(cacheKey, url);
}

/**
 * Fetches card by Scryfall UUID
 */
export async function getCardById(id: string): Promise<ScryfallCard> {
  const cacheKey = `id:${id}`;
  const url = `${SCRYFALL_BASE}/cards/${id}`;
  return await fetchWithCache<ScryfallCard>(cacheKey, url);
}

/**
 * Autocompletes card names as the user types
 */
export async function autocompleteCardName(partial: string): Promise<string[]> {
  if (!partial || partial.trim().length < 2) return [];
  const encoded = encodeURIComponent(partial.trim());
  const cacheKey = `autocomplete:${partial.toLowerCase()}`;
  const url = `${SCRYFALL_BASE}/cards/autocomplete?q=${encoded}`;
  try {
    const res = await fetchWithCache<ScryfallAutocompleteResponse>(cacheKey, url);
    return res.data;
  } catch {
    return [];
  }
}

/**
 * Evaluates reprint risk score (0 to 100):
 * - 0: Reserved list or virtually zero reprint risk
 * - 100: Extreme reprint risk (high non-reserved staple price, long gap since last reprint)
 */
export function calculateReprintRisk(card: ScryfallCard): number {
  if (card.reserved) {
    return 0; // Reserved list cards will not be reprinted in tournament-legal sets
  }

  const price = parseFloat(card.prices.usd || '0');
  if (price < 2.0) {
    return 10; // Low-value cards have negligible market liquidation urgency
  }

  let risk = 30;

  // Higher prices invite reprint targeting in Masters / Commander sets
  if (price > 40) risk += 35;
  else if (price > 20) risk += 25;
  else if (price > 10) risk += 15;

  // Rarity weighting
  if (card.rarity === 'mythic') risk += 15;
  else if (card.rarity === 'rare') risk += 10;

  // Format popularity multiplier
  if (card.edhrec_rank && card.edhrec_rank < 500) {
    risk += 15;
  }

  return Math.min(100, Math.max(0, risk));
}

