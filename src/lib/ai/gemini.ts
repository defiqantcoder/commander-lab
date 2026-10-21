import { GoogleGenAI, Type } from '@google/genai';

export const GEMINI_DEFAULT_MODEL = 'gemini-3.8-flash';
export const GEMINI_FALLBACK_MODEL = 'gemini-2.5-flash';

export interface ArchetypeSuggestion {
  themeName: string;
  tagline: string;
  powerTier: 'Casual' | 'Focused' | 'Optimized';
  primaryEngine: string;
  obscureInteraction: string;
  keyWinCon: string;
  sampleKeyCards: string[];
}

export interface GeneratedDeckCard {
  name: string;
  category: 'commander' | 'ramp' | 'draw' | 'engine' | 'interaction' | 'payoff' | 'land';
  cmc: number;
  synergyRationale: string;
  budgetAlternative?: string;
}

export interface GeneratedDeckResult {
  commanderName: string;
  archetype: string;
  estimatedSaltScore: number;
  cards: GeneratedDeckCard[];
}

export interface AIDynamicCombo {
  name: string;
  cards: string[];
  isInfinite: boolean;
  result: string;
  prerequisites: string[];
  steps: string[];
  disruptionWindow: string;
}

export interface AICollectionUpgrade {
  cardName: string;
  replacesCard?: string;
  synergyReason: string;
  role: 'ramp' | 'draw' | 'engine' | 'interaction' | 'payoff' | 'land';
}

export interface AIPilotingSecret {
  title: string;
  tip: string;
  applicableCards: string[];
}

export interface AIDeckAnalysisResult {
  deckSummary: string;
  dynamicCombos: AIDynamicCombo[];
  collectionUpgrades: AICollectionUpgrade[];
  pilotingSecrets: AIPilotingSecret[];
}

export interface AISellRecommendation {
  cardName: string;
  currentPriceUsd: number;
  urgency: 'Immediate' | 'Upcoming Cycle' | 'Monitor';
  reasonToSell: string;
  projectedReprintWindow: string;
  budgetSwap?: string;
  estimatedSavings?: number;
}

export interface AISafeHavenHolding {
  cardName: string;
  currentPriceUsd: number;
  reasonToHold: string;
}

export interface AIMarketAnalysisResult {
  overallMarketVerdict: string;
  portfolioHealthAssessment: string;
  sellRecommendations: AISellRecommendation[];
  safeHavenHoldings: AISafeHavenHolding[];
}

export interface AIPriorityRemovalTarget {
  cardName: string;
  reason: string;
  optimalTiming: string;
}

export interface AIMatchupCoachingResult {
  matchupVerdict: string;
  pivotTurn: number;
  pivotTurnAnalysis: string;
  priorityRemovalTargets: AIPriorityRemovalTarget[];
  matchupStrengths: string[];
  matchupVulnerabilities: string[];
  sideboardSwaps: {
    suggestedAdditions: Array<{ cardName: string; reason: string; role: string }>;
    suggestedCuts: Array<{ cardName: string; reason: string }>;
  };
  tacticalGamePlan: string;
}

export interface GeminiTestResult {
  success: boolean;
  message: string;
}

/**
 * Retrieves the configured Google Gemini API key from localStorage or environment variables.
 */
export function getGeminiApiKey(): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    const key = window.localStorage.getItem('gemini_api_key');
    if (key) return key;
  }
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  return null;
}

/**
 * Stores the Google Gemini API key in localStorage.
 */
export function setGeminiApiKey(key: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('gemini_api_key', key.trim());
  }
}

/**
 * Removes the stored Google Gemini API key from localStorage.
 */
export function clearGeminiApiKey(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('gemini_api_key');
  }
}

/**
 * Tests a Google Gemini API key by making a lightweight verification call to the Gemini API.
 */
export async function testGeminiApiKey(apiKeyOverride?: string): Promise<GeminiTestResult> {
  const apiKey = (apiKeyOverride !== undefined ? apiKeyOverride : getGeminiApiKey())?.trim();

  if (!apiKey) {
    return {
      success: false,
      message: 'No API key provided. Please enter a valid Google Gemini API key.'
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: GEMINI_DEFAULT_MODEL,
      contents: 'Ping: Return the word "OK".'
    });

    if (response && response.text) {
      return {
        success: true,
        message: `Connection successful! Google Gemini (${GEMINI_DEFAULT_MODEL}) is ready.`
      };
    }

    return {
      success: false,
      message: 'Received empty response from Google Gemini API.'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while contacting Google Gemini API.';
    return {
      success: false,
      message: errorMessage
    };
  }
}

/**
 * Brainstorms 3-4 unconventional, fresh archetypes for a commander using Google Gemini.
 */
export async function brainstormArchetypes(
  commanderName: string,
  colorIdentity: string[],
  model: string = GEMINI_DEFAULT_MODEL
): Promise<ArchetypeSuggestion[]> {
  const apiKey = getGeminiApiKey();

  // If no API key configured, provide rich contextual offline suggestions
  if (!apiKey) {
    return [
      {
        themeName: `${commanderName} Hidden Engine`,
        tagline: 'Leverages non-obvious replacement effects and triggered ability chains.',
        powerTier: 'Focused',
        primaryEngine: 'Recursive loop with death triggers and modular counters.',
        obscureInteraction: 'Replacement effects modify event before triggers check board state.',
        keyWinCon: 'Looping ETB drain with value sacrifice outlets.',
        sampleKeyCards: ['Ashnod\'s Altar', 'Nim Deathmantle', 'Skullclamp', 'Pitiless Plunderer']
      },
      {
        themeName: 'Tempo & Stax-Lite Taxation',
        tagline: 'Asymmetric board slowing while developing explosive mana advantage.',
        powerTier: 'Optimized',
        primaryEngine: 'Rule-of-law style pacing paired with flash speed interaction.',
        obscureInteraction: 'Continuous effects apply in Layer 6 before abilities can be granted.',
        keyWinCon: 'Overwhelming resource disparity into combat evasion.',
        sampleKeyCards: ['Rhystic Study', 'Drannith Magistrate', 'Esper Sentinel', 'Aura Shards']
      },
      {
        themeName: 'Surprise Alternate Win-Con',
        tagline: 'Divergent win condition that bypasses combat damage entirely.',
        powerTier: 'Casual',
        primaryEngine: 'Self-mill or card draw acceleration with replacement protections.',
        obscureInteraction: 'Simultaneous state-based actions allow precision triggers.',
        keyWinCon: 'Alternate victory state triggered at upkeep.',
        sampleKeyCards: ['Laboratory Maniac', 'Approach of the Second Sun', 'Felidar Sovereign']
      }
    ];
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `You are an elite Magic: The Gathering rules judge and Commander architect powered by Google Gemini.
Analyze the commander "${commanderName}" with color identity [${colorIdentity.join(', ')}].
Brainstorm 3 distinct, fresh, unconventional deck themes. Focus on non-obvious replacement effects, triggered ability chains, and obscure rules interactions far beyond typical EDHREC staples.

Return a JSON array of objects with the following schema:
- themeName: string
- tagline: string
- powerTier: "Casual" | "Focused" | "Optimized"
- primaryEngine: string
- obscureInteraction: string
- keyWinCon: string
- sampleKeyCards: string[]`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              themeName: { type: Type.STRING },
              tagline: { type: Type.STRING },
              powerTier: { type: Type.STRING },
              primaryEngine: { type: Type.STRING },
              obscureInteraction: { type: Type.STRING },
              keyWinCon: { type: Type.STRING },
              sampleKeyCards: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['themeName', 'tagline', 'powerTier', 'primaryEngine', 'obscureInteraction', 'keyWinCon', 'sampleKeyCards']
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ArchetypeSuggestion[];
    }
  } catch (error) {
    console.error('Error in Gemini archetype brainstorming:', error);
  }

  return [];
}

/**
 * Generates a complete, tailored deck of cards for a given commander and archetype
 * across the entire Magic: The Gathering card pool.
 * Optionally prioritizes cards from the user's collection if provided.
 */
export async function generateFreshDeckWithAI(
  commanderName: string,
  colorIdentity: string[],
  archetype: string,
  userCollectionCardNames: string[] = [],
  model: string = GEMINI_DEFAULT_MODEL
): Promise<GeneratedDeckResult> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    // Contextual offline fallback deck based on archetype and color identity
    return {
      commanderName,
      archetype,
      estimatedSaltScore: 28,
      cards: [
        { name: 'Sol Ring', category: 'ramp', cmc: 1, synergyRationale: 'Universal mana acceleration staple.' },
        { name: 'Arcane Signet', category: 'ramp', cmc: 2, synergyRationale: 'Universal colored mana fixing.' },
        { name: 'Command Tower', category: 'land', cmc: 0, synergyRationale: 'Universal commander land fixing.' },
        { name: 'Swords to Plowshares', category: 'interaction', cmc: 1, synergyRationale: 'Unconditional 1-mana instant removal.' },
        { name: 'Counterspell', category: 'interaction', cmc: 2, synergyRationale: 'Hard counter protection.' },
        { name: 'Rhystic Study', category: 'draw', cmc: 3, synergyRationale: 'Continuous card tax engine.', budgetAlternative: 'Mystic Remora' },
        { name: 'Heroic Intervention', category: 'interaction', cmc: 2, synergyRationale: 'Board protection against sweepers.' },
        { name: 'Beast Within', category: 'interaction', cmc: 3, synergyRationale: 'Versatile permanent removal.' },
        { name: 'Cultivate', category: 'ramp', cmc: 3, synergyRationale: 'Land ramp and hand fixing.' },
        { name: 'Kodama\'s Reach', category: 'ramp', cmc: 3, synergyRationale: 'Consistent mana ramp.' },
        { name: 'Skullclamp', category: 'draw', cmc: 1, synergyRationale: 'Card draw engine with tokens.', budgetAlternative: 'Morbid Curiosity' },
        { name: 'Ashnod\'s Altar', category: 'engine', cmc: 3, synergyRationale: 'Sacrifice outlet and mana acceleration.' },
        { name: 'Lightning Greaves', category: 'interaction', cmc: 2, synergyRationale: 'Protection and haste for commander.' },
        { name: 'Swiftfoot Boots', category: 'interaction', cmc: 2, synergyRationale: 'Hexproof defense.' },
        { name: 'Demonic Tutor', category: 'engine', cmc: 2, synergyRationale: 'Universal tutor for wincon.', budgetAlternative: 'Diabolic Intent' },
        { name: 'Cyclonic Rift', category: 'interaction', cmc: 2, synergyRationale: 'Asymmetric board wipe.', budgetAlternative: 'Aetherize' },
        { name: 'Fierce Guardianship', category: 'interaction', cmc: 3, synergyRationale: 'Free protection with commander.', budgetAlternative: 'Negate' },
        { name: 'Deflecting Swat', category: 'interaction', cmc: 3, synergyRationale: 'Free redirection defense.', budgetAlternative: 'Bolt Bend' },
        { name: 'Aetherflux Reservoir', category: 'payoff', cmc: 4, synergyRationale: 'Storm finisher and lifegain laser.' },
        { name: 'Bolas\'s Citadel', category: 'engine', cmc: 6, synergyRationale: 'Topdeck velocity and storm engine.' }
      ]
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const collectionContext = userCollectionCardNames.length > 0
    ? `The user optionally owns these cards: ${userCollectionCardNames.slice(0, 50).join(', ')}. You may prioritize fitting cards from this list where synergistic, but feel free to pull from the entire Magic card universe to make the deck fun, fresh, and complete.`
    : 'Pull from the entire Magic: The Gathering card pool to build the ideal fresh and fun deck.';

  const prompt = `You are an elite Magic: The Gathering Commander deck architect powered by Google Gemini.
Build a cohesive, fun, and fresh deck for Commander "${commanderName}" with color identity [${colorIdentity.join(', ')}] around the archetype "${archetype}".
${collectionContext}
Focus on creative, high-synergy interactions rather than only generic EDHREC staples. Include a solid balance of ramp, draw, engine, interaction, payoffs, and lands.
For high-dollar cards, provide a realistic budget alternative.

Return a JSON object conforming to:
- commanderName: string
- archetype: string
- estimatedSaltScore: number (0 to 100)
- cards: array of { name: string, category: 'ramp'|'draw'|'engine'|'interaction'|'payoff'|'land', cmc: number, synergyRationale: string, budgetAlternative?: string }`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            commanderName: { type: Type.STRING },
            archetype: { type: Type.STRING },
            estimatedSaltScore: { type: Type.NUMBER },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  cmc: { type: Type.NUMBER },
                  synergyRationale: { type: Type.STRING },
                  budgetAlternative: { type: Type.STRING }
                },
                required: ['name', 'category', 'cmc', 'synergyRationale']
              }
            }
          },
          required: ['commanderName', 'archetype', 'estimatedSaltScore', 'cards']
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as GeneratedDeckResult;
    }
  } catch (error) {
    console.error('Error in Gemini deck generation:', error);
  }

  return {
    commanderName,
    archetype,
    estimatedSaltScore: 25,
    cards: []
  };
}

/**
 * Dynamically analyzes the user's active deck and collection using Gemini.
 * Discovers obscure multi-card loops, non-obvious interactions, and owned collection upgrades.
 */
export async function analyzeDeckWithAI(
  commanderName: string,
  deckCards: Array<{ name: string; typeLine?: string; oracleText?: string }>,
  collectionCards: Array<{ name: string; typeLine?: string; oracleText?: string }> = [],
  model: string = GEMINI_DEFAULT_MODEL
): Promise<AIDeckAnalysisResult> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    // Rich offline simulation
    return {
      deckSummary: `Deck anchored by ${commanderName}. Contains ${deckCards.length} cards with balanced interaction and acceleration.`,
      dynamicCombos: [
        {
          name: `${commanderName} Synergy Loop`,
          cards: deckCards.slice(0, 2).map((c) => c.name),
          isInfinite: false,
          result: 'Accelerated board state and card advantage generation',
          prerequisites: [`${commanderName} on battlefield`, 'Open mana for interaction'],
          steps: ['Cast enabler spell', 'Trigger commander ability', 'Reinvest generated resources'],
          disruptionWindow: 'Opponents holding instant speed spot removal before trigger resolves.'
        }
      ],
      collectionUpgrades: collectionCards.slice(0, 3).map((c) => ({
        cardName: c.name,
        role: 'engine' as const,
        synergyReason: `Owned in your collection: complements ${commanderName}’s core ability.`
      })),
      pilotingSecrets: [
        {
          title: 'Timing Commander Deployment',
          tip: `Hold ${commanderName} until you have 1 mana floating for protection or an immediate trigger.`,
          applicableCards: [commanderName]
        }
      ]
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const deckListSummary = deckCards.map((c) => c.name).slice(0, 80).join(', ');
  const collectionListSummary = collectionCards.length > 0
    ? `Owned collection cards: ${collectionCards.map((c) => c.name).slice(0, 50).join(', ')}.`
    : 'No additional collection cards supplied.';

  const prompt = `You are a Level 3 Magic: The Gathering Judge and expert Commander coach powered by Google Gemini.
Analyze this Commander deck:
Commander: "${commanderName}"
Deck cards (${deckCards.length}): ${deckListSummary}
${collectionListSummary}

Please dynamically inspect the deck and collection:
1. Identify any multi-card combos, infinite loops, or game-winning synergy chains present in the deck cards.
2. From the user's OWNED collection cards (if provided), recommend 3–5 high-synergy upgrades to slot into the deck.
3. Provide 2–3 bespoke piloting secrets and interaction timing tips for this exact deck.

Return a JSON object conforming to:
- deckSummary: string
- dynamicCombos: array of { name: string, cards: string[], isInfinite: boolean, result: string, prerequisites: string[], steps: string[], disruptionWindow: string }
- collectionUpgrades: array of { cardName: string, replacesCard?: string, synergyReason: string, role: string }
- pilotingSecrets: array of { title: string, tip: string, applicableCards: string[] }`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            deckSummary: { type: Type.STRING },
            dynamicCombos: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  cards: { type: Type.ARRAY, items: { type: Type.STRING } },
                  isInfinite: { type: Type.BOOLEAN },
                  result: { type: Type.STRING },
                  prerequisites: { type: Type.ARRAY, items: { type: Type.STRING } },
                  steps: { type: Type.ARRAY, items: { type: Type.STRING } },
                  disruptionWindow: { type: Type.STRING }
                },
                required: ['name', 'cards', 'isInfinite', 'result', 'prerequisites', 'steps', 'disruptionWindow']
              }
            },
            collectionUpgrades: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  cardName: { type: Type.STRING },
                  replacesCard: { type: Type.STRING },
                  synergyReason: { type: Type.STRING },
                  role: { type: Type.STRING }
                },
                required: ['cardName', 'synergyReason', 'role']
              }
            },
            pilotingSecrets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  tip: { type: Type.STRING },
                  applicableCards: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['title', 'tip', 'applicableCards']
              }
            }
          },
          required: ['deckSummary', 'dynamicCombos', 'collectionUpgrades', 'pilotingSecrets']
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIDeckAnalysisResult;
    }
  } catch (error) {
    console.error('Error in Gemini deck analysis:', error);
  }

  return {
    deckSummary: 'Unable to analyze deck with AI at this time.',
    dynamicCombos: [],
    collectionUpgrades: [],
    pilotingSecrets: []
  };
}

/**
 * Analyzes cards in the user's deck to give actionable market advice on when to sell cards,
 * impending reprint vulnerabilities, and high-synergy budget liquidation swaps.
 */
export async function analyzeMarketWithAI(
  cards: Array<{ name: string; currentPriceUsd?: number; typeLine?: string; isReserved?: boolean }>,
  model: string = GEMINI_DEFAULT_MODEL
): Promise<AIMarketAnalysisResult> {
  const apiKey = getGeminiApiKey();

  // Find cards with price info
  const pricedCards = cards.filter((c) => (c.currentPriceUsd ?? 0) > 0);

  if (!apiKey) {
    // Heuristic offline fallback
    const expensiveNonReserved = pricedCards
      .filter((c) => (c.currentPriceUsd ?? 0) >= 15 && !c.isReserved)
      .slice(0, 3);
    const reservedOrSafe = pricedCards
      .filter((c) => c.isReserved || (c.currentPriceUsd ?? 0) < 2)
      .slice(0, 3);

    return {
      overallMarketVerdict: `Portfolio contains ${pricedCards.length} priced assets. ${expensiveNonReserved.length} high-value staples are vulnerable to upcoming reprint cycles.`,
      portfolioHealthAssessment: expensiveNonReserved.length > 2 ? 'High Exposure — Liquidation of reprint staples recommended.' : 'Stable Portfolio with controlled reprint exposure.',
      sellRecommendations: expensiveNonReserved.map((c) => ({
        cardName: c.name,
        currentPriceUsd: c.currentPriceUsd ?? 20,
        urgency: (c.currentPriceUsd ?? 0) >= 40 ? 'Immediate' : 'Upcoming Cycle',
        reasonToSell: 'Card is trading near peak valuation without Reserved List protection; high candidate for Masters or Commander precon reprints.',
        projectedReprintWindow: 'Next 6–12 months in upcoming Commander horizons/masters sets.',
        budgetSwap: 'Sub-$2 functional equivalent',
        estimatedSavings: Math.max(0, (c.currentPriceUsd ?? 20) - 2)
      })),
      safeHavenHoldings: reservedOrSafe.map((c) => ({
        cardName: c.name,
        currentPriceUsd: c.currentPriceUsd ?? 1,
        reasonToHold: c.isReserved
          ? 'Reserved List card: Immune to direct reprints under WotC reprint policy; safe store of value.'
          : 'Low-cost budget staple: Minimal downside price volatility.'
      }))
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const cardSummary = pricedCards.slice(0, 60).map((c) => `${c.name} ($${(c.currentPriceUsd ?? 0).toFixed(2)}${c.isReserved ? ', Reserved List' : ''})`).join('; ');

  const prompt = `You are a premier Magic: The Gathering finance advisor and portfolio strategist powered by Google Gemini.
Analyze the following Commander deck card portfolio:
${cardSummary}

Your objective:
1. Identify cards trading at peak market prices that lack Reserved List immunity and face severe reprint crash risk in upcoming sets (Masters sets, Commander precons, Horizons sets). Recommend specific optimal sell timing and high-synergy sub-$2 budget replacements.
2. Identify safe haven cards to hold (Reserved List cards, low-volatility foundation staples).
3. Deliver an overall market verdict and portfolio health assessment.

Return a JSON object conforming to:
- overallMarketVerdict: string
- portfolioHealthAssessment: string
- sellRecommendations: array of { cardName: string, currentPriceUsd: number, urgency: "Immediate" | "Upcoming Cycle" | "Monitor", reasonToSell: string, projectedReprintWindow: string, budgetSwap: string, estimatedSavings: number }
- safeHavenHoldings: array of { cardName: string, currentPriceUsd: number, reasonToHold: string }`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallMarketVerdict: { type: Type.STRING },
            portfolioHealthAssessment: { type: Type.STRING },
            sellRecommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  cardName: { type: Type.STRING },
                  currentPriceUsd: { type: Type.NUMBER },
                  urgency: { type: Type.STRING },
                  reasonToSell: { type: Type.STRING },
                  projectedReprintWindow: { type: Type.STRING },
                  budgetSwap: { type: Type.STRING },
                  estimatedSavings: { type: Type.NUMBER }
                },
                required: ['cardName', 'currentPriceUsd', 'urgency', 'reasonToSell', 'projectedReprintWindow']
              }
            },
            safeHavenHoldings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  cardName: { type: Type.STRING },
                  currentPriceUsd: { type: Type.NUMBER },
                  reasonToHold: { type: Type.STRING }
                },
                required: ['cardName', 'currentPriceUsd', 'reasonToHold']
              }
            }
          },
          required: ['overallMarketVerdict', 'portfolioHealthAssessment', 'sellRecommendations', 'safeHavenHoldings']
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIMarketAnalysisResult;
    }
  } catch (error) {
    console.error('Error in Gemini market analysis:', error);
  }

  return {
    overallMarketVerdict: 'Unable to complete AI market scan at this time.',
    portfolioHealthAssessment: 'Neutral',
    sellRecommendations: [],
    safeHavenHoldings: []
  };
}

/**
 * Generates bespoke AI coaching and matchup strategy comparing player deck vs opponent deck.
 * Pinpoints the critical pivot turn, priority removal targets, and sideboarding swaps.
 */
export async function analyzeMatchupWithAI(
  playerDeckName: string,
  playerCards: Array<{ name: string; typeLine?: string; category?: string }>,
  opponentDeckName: string,
  opponentCards: Array<{ name: string; typeLine?: string; category?: string }>,
  simulationStats?: { playerWins: number; opponentWins: number; gamesSimulated: number },
  model: string = GEMINI_DEFAULT_MODEL
): Promise<AIMatchupCoachingResult> {
  const apiKey = getGeminiApiKey();

  const playerCommander = playerCards.find((c) => c.category === 'commander')?.name || playerDeckName;
  const opponentCommander = opponentCards.find((c) => c.category === 'commander')?.name || opponentDeckName;

  if (!apiKey) {
    // Rich offline fallback
    const isAggro = /aggro|token|burn/i.test(opponentDeckName);
    const pivot = isAggro ? 3 : 5;
    return {
      matchupVerdict: `Competitive sparring series against ${opponentDeckName}. ${isAggro ? 'Early clock pressure requires immediate defensive stabilization.' : 'Mid-game engine race requires interaction pacing.'}`,
      pivotTurn: pivot,
      pivotTurnAnalysis: `Turn ${pivot} is the decisive inflection point. Opponent intends to deploy key threat or payoff; holding up 1–2 mana for instant interaction or a sweeper determines the outcome.`,
      priorityRemovalTargets: [
        {
          cardName: opponentCommander,
          reason: 'Primary engine and synergy anchor of the opponent deck.',
          optimalTiming: 'Remove immediately on cast or before first activated ability / attack step.'
        },
        {
          cardName: 'Core Engine / Value Permanent',
          reason: 'Compounds opponent resource generation and accelerates their clock.',
          optimalTiming: 'Target at opponent end step to deny untap value.'
        }
      ],
      matchupStrengths: [
        'Resilient mid-to-late game card advantage once stabilized.',
        'Sufficient ramp density to re-cast commander despite commander tax.'
      ],
      matchupVulnerabilities: [
        isAggro ? 'Vulnerable to explosive unblocked attacks prior to Turn 4.' : 'Vulnerable to heavy counterspell tax or asymmetric board sweeps.'
      ],
      sideboardSwaps: {
        suggestedAdditions: [
          { cardName: 'Toxic Deluge', role: 'Board Wipe', reason: 'Efficient 3-CMC reset that handles fast boards.' },
          { cardName: 'Swan Song', role: 'Interaction', reason: '1-mana counter to stop opponent game-winning spells.' }
        ],
        suggestedCuts: [
          { cardName: 'Top-Heavy (>6 CMC) Spell', reason: 'Too slow to impact the decisive early pivot turns.' }
        ]
      },
      tacticalGamePlan: `Play conservatively through Turns 1–${pivot}. Avoid over-committing to the board without protection mana open. Save targeted removal strictly for ${opponentCommander} or game-winning combos.`
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const playerSample = playerCards.slice(0, 40).map((c) => c.name).join(', ');
  const opponentSample = opponentCards.slice(0, 40).map((c) => c.name).join(', ');
  const statsSummary = simulationStats
    ? `Simulation score: Player ${simulationStats.playerWins} - Opponent ${simulationStats.opponentWins} (out of ${simulationStats.gamesSimulated} games).`
    : '';

  const prompt = `You are a world-class Magic: The Gathering competitive Commander coach powered by Google Gemini.
Analyze this Commander matchup:
- Player Deck: "${playerDeckName}" (Commander: ${playerCommander})
  Key cards: ${playerSample}
- Opponent Deck: "${opponentDeckName}" (Commander: ${opponentCommander})
  Key cards: ${opponentSample}
${statsSummary}

Please deliver an elite strategic matchup breakdown:
1. Identify the critical "Pivot Turn" (turn number 1-8) and explain why that turn decides the match.
2. List 2-3 Priority Removal Targets from the opponent's deck with optimal timing windows.
3. List the player's core matchup strengths and key vulnerabilities against this specific opponent.
4. Recommend 2 high-impact additions and 1-2 cuts to optimize against this opponent.
5. Provide a cohesive 2-sentence tactical game plan.

Return a JSON object conforming to:
- matchupVerdict: string
- pivotTurn: number (between 1 and 8)
- pivotTurnAnalysis: string
- priorityRemovalTargets: array of { cardName: string, reason: string, optimalTiming: string }
- matchupStrengths: array of strings
- matchupVulnerabilities: array of strings
- sideboardSwaps: {
    suggestedAdditions: array of { cardName: string, reason: string, role: string },
    suggestedCuts: array of { cardName: string, reason: string }
  }
- tacticalGamePlan: string`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchupVerdict: { type: Type.STRING },
            pivotTurn: { type: Type.NUMBER },
            pivotTurnAnalysis: { type: Type.STRING },
            priorityRemovalTargets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  cardName: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  optimalTiming: { type: Type.STRING }
                },
                required: ['cardName', 'reason', 'optimalTiming']
              }
            },
            matchupStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            matchupVulnerabilities: { type: Type.ARRAY, items: { type: Type.STRING } },
            sideboardSwaps: {
              type: Type.OBJECT,
              properties: {
                suggestedAdditions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      cardName: { type: Type.STRING },
                      reason: { type: Type.STRING },
                      role: { type: Type.STRING }
                    },
                    required: ['cardName', 'reason', 'role']
                  }
                },
                suggestedCuts: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      cardName: { type: Type.STRING },
                      reason: { type: Type.STRING }
                    },
                    required: ['cardName', 'reason']
                  }
                }
              },
              required: ['suggestedAdditions', 'suggestedCuts']
            },
            tacticalGamePlan: { type: Type.STRING }
          },
          required: [
            'matchupVerdict',
            'pivotTurn',
            'pivotTurnAnalysis',
            'priorityRemovalTargets',
            'matchupStrengths',
            'matchupVulnerabilities',
            'sideboardSwaps',
            'tacticalGamePlan'
          ]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIMatchupCoachingResult;
    }
  } catch (error) {
    console.error('Error in Gemini matchup analysis:', error);
  }

  return {
    matchupVerdict: 'Unable to generate AI matchup analysis at this time.',
    pivotTurn: 4,
    pivotTurnAnalysis: 'Focus on developing mana on curve and holding interaction.',
    priorityRemovalTargets: [],
    matchupStrengths: [],
    matchupVulnerabilities: [],
    sideboardSwaps: { suggestedAdditions: [], suggestedCuts: [] },
    tacticalGamePlan: 'Play to your core synergies while tracking opponent open mana.'
  };
}
