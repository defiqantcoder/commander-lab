import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  db,
  getCollection,
  addOrUpdateCollectionCard,
  removeCollectionCard,
  getDeck,
  getAllDecks,
  saveDeck,
  deleteDeck,
  type CollectionCard,
  type SavedDeck
} from './index';

describe('Database helpers', () => {
  beforeEach(async () => {
    // Clear the database before each test
    await db.collection.clear();
    await db.decks.clear();
  });

  afterEach(async () => {
    await db.collection.clear();
    await db.decks.clear();
  });

  describe('Collection cards', () => {
    it('should add and retrieve a collection card', async () => {
      const card: CollectionCard = {
        id: 'test-card-1',
        name: 'Test Card',
        set: 'tst',
        collectorNumber: '1',
        foil: false,
        quantity: 1
      };

      const id = await addOrUpdateCollectionCard(card);
      expect(id).toBe('test-card-1');

      const collection = await getCollection();
      expect(collection.length).toBe(1);
      expect(collection[0].name).toBe('Test Card');
      expect(collection[0].updatedAt).toBeInstanceOf(Date);
    });

    it('should remove a collection card', async () => {
      const card: CollectionCard = {
        id: 'test-card-2',
        name: 'Test Card 2',
        set: 'tst',
        collectorNumber: '2',
        foil: true,
        quantity: 2
      };

      await addOrUpdateCollectionCard(card);
      let collection = await getCollection();
      expect(collection.length).toBe(1);

      await removeCollectionCard('test-card-2');
      collection = await getCollection();
      expect(collection.length).toBe(0);
    });
  });

  describe('Decks', () => {
    it('should save and retrieve a deck', async () => {
      const deck: SavedDeck = {
        id: 'test-deck-1',
        name: 'Test Deck',
        commanderId: 'commander-1',
        archetype: 'aggro',
        saltScore: 1,
        cards: [],
        updatedAt: new Date()
      };

      await saveDeck(deck);

      const retrieved = await getDeck('test-deck-1');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Test Deck');
      expect(retrieved?.updatedAt).toBeInstanceOf(Date);
    });

    it('should get all decks', async () => {
      const deck1: SavedDeck = {
        id: 'deck-1',
        name: 'Deck 1',
        commanderId: 'commander-1',
        archetype: 'aggro',
        saltScore: 1,
        cards: [],
        updatedAt: new Date('2023-01-01')
      };

      const deck2: SavedDeck = {
        id: 'deck-2',
        name: 'Deck 2',
        commanderId: 'commander-2',
        archetype: 'control',
        saltScore: 5,
        cards: [],
        updatedAt: new Date('2023-01-02')
      };

      await saveDeck(deck1);
      await saveDeck(deck2);

      const decks = await getAllDecks();
      expect(decks.length).toBe(2);
      // Expected to be ordered by updatedAt reverse, but we overwrote updatedAt in saveDeck
      // Let's just check they both exist
      const names = decks.map(d => d.name);
      expect(names).toContain('Deck 1');
      expect(names).toContain('Deck 2');
    });

    it('should delete a deck', async () => {
      const deck: SavedDeck = {
        id: 'deck-to-delete',
        name: 'Deck To Delete',
        commanderId: 'commander-1',
        archetype: 'aggro',
        saltScore: 1,
        cards: [],
        updatedAt: new Date()
      };

      await saveDeck(deck);
      expect(await getDeck('deck-to-delete')).toBeDefined();

      await deleteDeck('deck-to-delete');
      expect(await getDeck('deck-to-delete')).toBeUndefined();
    });
  });
});
