import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import {
  db,
  addOrUpdateCollectionCard,
  getCollection,
  removeCollectionCard,
  saveDeck,
  getDeck,
  getAllDecks,
  deleteDeck,
  type CollectionCard,
  type SavedDeck,
} from "./index.js";

describe("CommanderLabDB Offline Tests", () => {
  beforeEach(async () => {
    // Clear all tables before each test to ensure a clean state
    await db.collection.clear();
    await db.decks.clear();
    await db.marketCache.clear();
    await db.simRuns.clear();
  });

  describe("CollectionCard Table Operations", () => {
    it("should add and retrieve a collection card", async () => {
      const card: CollectionCard = {
        id: "c1",
        name: "Sol Ring",
        set: "lea",
        collectorNumber: "1",
        foil: false,
        quantity: 1,
      };

      await addOrUpdateCollectionCard(card);

      const collection = await getCollection();
      expect(collection.length).toBe(1);
      expect(collection[0].name).toBe("Sol Ring");
      expect(collection[0].updatedAt).toBeInstanceOf(Date);
    });

    it("should update an existing collection card", async () => {
      const card: CollectionCard = {
        id: "c1",
        name: "Sol Ring",
        set: "lea",
        collectorNumber: "1",
        foil: false,
        quantity: 1,
      };

      await addOrUpdateCollectionCard(card);

      const updatedCard: CollectionCard = { ...card, quantity: 4 };
      await addOrUpdateCollectionCard(updatedCard);

      const collection = await getCollection();
      expect(collection.length).toBe(1);
      expect(collection[0].quantity).toBe(4);
    });

    it("should remove a collection card", async () => {
      const card: CollectionCard = {
        id: "c1",
        name: "Sol Ring",
        set: "lea",
        collectorNumber: "1",
        foil: false,
        quantity: 1,
      };

      await addOrUpdateCollectionCard(card);
      await removeCollectionCard("c1");

      const collection = await getCollection();
      expect(collection.length).toBe(0);
    });
  });

  describe("SavedDeck Table Operations", () => {
    it("should save and retrieve a deck", async () => {
      const deck: SavedDeck = {
        id: "d1",
        name: "My Awesome Deck",
        commanderId: "c1",
        archetype: "Aggro",
        saltScore: 0,
        cards: [],
        updatedAt: new Date(),
      };

      await saveDeck(deck);

      const retrievedDeck = await getDeck("d1");
      expect(retrievedDeck).toBeDefined();
      expect(retrievedDeck?.name).toBe("My Awesome Deck");
      expect(retrievedDeck?.updatedAt).toBeInstanceOf(Date);
    });

    it("should get all decks ordered by updatedAt (newest first)", async () => {
      const deck1: SavedDeck = {
        id: "d1",
        name: "Deck 1",
        commanderId: "c1",
        archetype: "Aggro",
        saltScore: 0,
        cards: [],
        updatedAt: new Date(Date.now() - 10000),
      };

      const deck2: SavedDeck = {
        id: "d2",
        name: "Deck 2",
        commanderId: "c2",
        archetype: "Control",
        saltScore: 0,
        cards: [],
        updatedAt: new Date(),
      };

      await saveDeck(deck1);
      await saveDeck(deck2);

      const decks = await getAllDecks();
      expect(decks.length).toBe(2);
      expect(decks[0].id).toBe("d2"); // newer deck should be first
      expect(decks[1].id).toBe("d1");
    });

    it("should update an existing deck", async () => {
      const deck: SavedDeck = {
        id: "d1",
        name: "My Awesome Deck",
        commanderId: "c1",
        archetype: "Aggro",
        saltScore: 0,
        cards: [],
        updatedAt: new Date(),
      };

      await saveDeck(deck);

      const updatedDeck = { ...deck, name: "My Even More Awesome Deck" };
      await saveDeck(updatedDeck);

      const retrievedDeck = await getDeck("d1");
      expect(retrievedDeck?.name).toBe("My Even More Awesome Deck");
    });

    it("should delete a deck", async () => {
      const deck: SavedDeck = {
        id: "d1",
        name: "My Awesome Deck",
        commanderId: "c1",
        archetype: "Aggro",
        saltScore: 0,
        cards: [],
        updatedAt: new Date(),
      };

      await saveDeck(deck);
      await deleteDeck("d1");

      const retrievedDeck = await getDeck("d1");
      expect(retrievedDeck).toBeUndefined();
    });
  });
});
