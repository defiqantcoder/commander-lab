import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  generateFreshDeckWithAI,
  analyzeDeckWithAI,
  analyzeMarketWithAI,
  GEMINI_DEFAULT_MODEL,
} from "./gemini";

// Mock the @google/genai module
const mockGenerateContent = vi.fn();
vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => {
      return {
        models: {
          generateContent: mockGenerateContent,
        },
      };
    }),
    Type: {
      ARRAY: "ARRAY",
      OBJECT: "OBJECT",
      STRING: "STRING",
      NUMBER: "NUMBER",
      BOOLEAN: "BOOLEAN",
    },
  };
});

describe("AI Features Stress Tests", () => {
  const originalEnv = process.env;
  const originalWindow = global.window;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    mockGenerateContent.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
    global.window = originalWindow;
    vi.clearAllMocks();
  });

  describe("generateFreshDeckWithAI", () => {
    it("returns offline fallback when no API key is provided", async () => {
      process.env.GEMINI_API_KEY = "";
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("gemini_api_key");
      }

      const result = await generateFreshDeckWithAI(
        "Atraxa",
        ["G", "W", "U", "B"],
        "Artifact Storm",
      );
      expect(mockGenerateContent).not.toHaveBeenCalled();
      expect(result.commanderName).toBe("Atraxa");
      expect(result.archetype).toBe("Artifact Storm");
      expect(result.estimatedSaltScore).toBeGreaterThan(0);
      expect(result.cards.length).toBeGreaterThan(0);
      expect(result.cards[0].category).toBeDefined();
      expect(result.cards[0].synergyRationale).toBeDefined();
    });

    it("handles optional user collection card arrays without failing when empty or omitted", async () => {
      process.env.GEMINI_API_KEY = "fake-api-key";
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({
          commanderName: "Test",
          archetype: "Test Arch",
          estimatedSaltScore: 5,
          cards: [],
        }),
      });
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({
          commanderName: "Test",
          archetype: "Test Arch",
          estimatedSaltScore: 5,
          cards: [],
        }),
      });

      // Omitted collection
      await generateFreshDeckWithAI("Test Commander", ["W"], "Test");

      // Empty collection
      await generateFreshDeckWithAI("Test Commander", ["W"], "Test", []);

      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });

    it("returns mocked API responses with diverse archetypes", async () => {
      process.env.GEMINI_API_KEY = "fake-api-key";
      const mockResponses = [
        {
          archetype: "Artifact Storm",
          cards: [
            {
              name: "Sol Ring",
              category: "ramp",
              cmc: 1,
              synergyRationale: "Good",
            },
          ],
        },
        {
          archetype: "Spellslinger",
          cards: [
            {
              name: "Brainstorm",
              category: "draw",
              cmc: 1,
              synergyRationale: "Good",
            },
          ],
        },
        {
          archetype: "Voltron",
          cards: [
            {
              name: "Lightning Greaves",
              category: "interaction",
              cmc: 2,
              synergyRationale: "Good",
            },
          ],
        },
        {
          archetype: "Enchantress",
          cards: [
            {
              name: "Wild Growth",
              category: "ramp",
              cmc: 1,
              synergyRationale: "Good",
            },
          ],
        },
      ];

      for (let i = 0; i < mockResponses.length; i++) {
        mockGenerateContent.mockResolvedValueOnce({
          text: JSON.stringify({
            commanderName: "Test",
            archetype: mockResponses[i].archetype,
            estimatedSaltScore: 5,
            cards: mockResponses[i].cards,
          }),
        });

        const result = await generateFreshDeckWithAI(
          "Test",
          ["W"],
          mockResponses[i].archetype,
        );
        expect(result.archetype).toBe(mockResponses[i].archetype);
        expect(result.cards[0].name).toBe(mockResponses[i].cards[0].name);
      }
      expect(mockGenerateContent).toHaveBeenCalledTimes(4);
    });
  });
  describe("analyzeDeckWithAI", () => {
    it("returns offline fallback returning dynamicCombos, collectionUpgrades, and pilotingSecrets", async () => {
      process.env.GEMINI_API_KEY = "";
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("gemini_api_key");
      }

      const result = await analyzeDeckWithAI(
        "Krenko, Mob Boss",
        [{ name: "Skirk Prospector" }],
        [{ name: "Impact Tremors" }],
      );
      expect(mockGenerateContent).not.toHaveBeenCalled();

      expect(result.dynamicCombos.length).toBeGreaterThan(0);
      expect(result.collectionUpgrades.length).toBeGreaterThan(0);
      expect(result.pilotingSecrets.length).toBeGreaterThan(0);
    });

    it("returns mocked API responses with multi-card infinite combos and owned collection upgrades", async () => {
      process.env.GEMINI_API_KEY = "fake-api-key";
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({
          deckSummary: "A fast goblin deck.",
          dynamicCombos: [
            {
              name: "Kiki-Jiki + Zealous Conscripts",
              cards: ["Kiki-Jiki, Mirror Breaker", "Zealous Conscripts"],
              isInfinite: true,
              result: "Infinite hasty tokens",
              prerequisites: ["Both on battlefield"],
              steps: [
                "Tap Kiki-Jiki targeting Conscripts",
                "Conscripts copy untaps Kiki-Jiki",
              ],
              disruptionWindow:
                "Instant speed removal on Kiki-Jiki in response to untap trigger",
            },
          ],
          collectionUpgrades: [
            {
              cardName: "Dockside Extortionist",
              role: "ramp",
              synergyReason: "Extremely good in red",
            },
          ],
          pilotingSecrets: [
            {
              title: "Hold Krenko",
              tip: "Wait to cast Krenko until you can activate him immediately.",
              applicableCards: ["Krenko, Mob Boss", "Lightning Greaves"],
            },
          ],
        }),
      });

      const result = await analyzeDeckWithAI(
        "Krenko, Mob Boss",
        [],
        [{ name: "Dockside Extortionist" }],
      );
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);

      expect(result.dynamicCombos.length).toBe(1);
      expect(result.dynamicCombos[0].isInfinite).toBe(true);
      expect(result.collectionUpgrades.length).toBe(1);
      expect(result.collectionUpgrades[0].cardName).toBe(
        "Dockside Extortionist",
      );
    });
  });
  describe("analyzeMarketWithAI", () => {
    it("returns offline fallback correctly calculating sell recommendations and safe havens", async () => {
      process.env.GEMINI_API_KEY = "";
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("gemini_api_key");
      }

      const cards = [
        { name: "Mana Crypt", currentPriceUsd: 150, isReserved: false },
        { name: "Gaea's Cradle", currentPriceUsd: 800, isReserved: true },
        { name: "Sol Ring", currentPriceUsd: 1.5, isReserved: false },
      ];

      const result = await analyzeMarketWithAI(cards);
      expect(mockGenerateContent).not.toHaveBeenCalled();

      expect(result.sellRecommendations.length).toBe(1);
      expect(result.sellRecommendations[0].cardName).toBe("Mana Crypt");
      expect(result.sellRecommendations[0].urgency).toBe("Immediate");

      expect(result.safeHavenHoldings.length).toBe(2);
      expect(
        result.safeHavenHoldings.some((c) => c.cardName === "Gaea's Cradle"),
      ).toBe(true);
      expect(
        result.safeHavenHoldings.some((c) => c.cardName === "Sol Ring"),
      ).toBe(true);
    });

    it("returns mocked API response targeting urgency classifications", async () => {
      process.env.GEMINI_API_KEY = "fake-api-key";
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({
          overallMarketVerdict: "Market looks unstable.",
          portfolioHealthAssessment: "High Risk",
          sellRecommendations: [
            {
              cardName: "Jeweled Lotus",
              currentPriceUsd: 90,
              urgency: "Upcoming Cycle",
              reasonToSell: "Commander Masters soon",
              projectedReprintWindow: "Q3",
              budgetSwap: "Lotus Petal",
              estimatedSavings: 80,
            },
          ],
          safeHavenHoldings: [],
        }),
      });

      const cards = [{ name: "Jeweled Lotus", currentPriceUsd: 90 }];
      const result = await analyzeMarketWithAI(cards);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);

      expect(result.sellRecommendations.length).toBe(1);
      expect(result.sellRecommendations[0].urgency).toBe("Upcoming Cycle");
    });
  });
});
