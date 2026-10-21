<script lang="ts">
  import { onMount } from 'svelte';
  import { Activity, ArrowDownWideNarrow, BookOpen, BrainCircuit, Check, ChevronDown, ChevronRight, CircleDollarSign, Coins, Copy, Download, FileText, Filter, Grid2X2, Key, Layers3, List, PanelLeftClose, PanelRightClose, Plus, Search, Shield, Sparkles, Swords, Target, TrendingUp, Upload, WandSparkles, X } from 'lucide-svelte';
  import { getAllDecks, getDeck, saveDeck, getCollection, type CollectionCard } from '$lib/db';
  import CardGrid from './CardGrid.svelte';
  import CardDetailModal from './CardDetailModal.svelte';
  import ApiKeyModal from './ApiKeyModal.svelte';
  import AIDeckArchitectModal from './AIDeckArchitectModal.svelte';
  import GoldfishView from './GoldfishView.svelte';
  import MatchupArena from './MatchupArena.svelte';
  import PilotGuide from './PilotGuide.svelte';
  import MarketAdvisor from './MarketAdvisor.svelte';
  import SynergyGraph from './SynergyGraph.svelte';
  import { getGeminiApiKey, type GeneratedDeckResult } from '$lib/ai/gemini';
  import { autocompleteCardName, getCardByName, searchCards as searchScryfallCards, type ScryfallCard } from '$lib/api/scryfall';
  import { auditDeckSaltAndPower, classifyCardRole, generateSynergyGraph, type CardSynergyInput, type SaltScoreAudit, type SynergyGraphData } from '$lib/engine/synergy';
  import { detectDynamicSynergyPlays } from '$lib/engine/playbook';
  import { manaSymbols, type CardRole, type DeckCard, type SavedDeck } from './types';

  const roles: CardRole[] = ['ramp', 'draw', 'engine', 'interaction', 'payoff', 'land'];
  let deck = $state<SavedDeck>({
    id: 'deck-draft',
    name: 'Untitled Deck',
    commanderId: '',
    commanderName: '',
    archetype: 'Custom Deck',
    saltScore: 0,
    cards: [],
    updatedAt: new Date()
  });
  let commander = $state<DeckCard>({
    id: '',
    name: '',
    set: '',
    collectorNumber: '',
    foil: false,
    quantity: 1,
    currentPriceUsd: 0,
    manaCost: '',
    cmc: 0,
    role: 'commander',
    typeLine: 'Legendary Creature',
    oracleText: '',
    colorIdentity: []
  });
  let cards = $state<DeckCard[]>([]);
  let userCollection = $state<CollectionCard[]>([]);
  let graphCards = $derived(commander.name ? [commander, ...cards] : [...cards]);

  let nonLandCards = $derived(cards.filter((c) => c.role !== 'land'));
  let averageCmc = $derived(
    nonLandCards.length > 0
      ? (nonLandCards.reduce((sum, c) => sum + (c.cmc || 0), 0) / nonLandCards.length).toFixed(2)
      : '0.00'
  );
  let dynamicCurve = $derived(() => {
    const buckets = [
      { label: '0', count: 0 },
      { label: '1', count: 0 },
      { label: '2', count: 0 },
      { label: '3', count: 0 },
      { label: '4', count: 0 },
      { label: '5', count: 0 },
      { label: '6+', count: 0 }
    ];
    for (const c of nonLandCards) {
      const cmc = Math.floor(c.cmc || 0);
      if (cmc <= 0) buckets[0].count++;
      else if (cmc === 1) buckets[1].count++;
      else if (cmc === 2) buckets[2].count++;
      else if (cmc === 3) buckets[3].count++;
      else if (cmc === 4) buckets[4].count++;
      else if (cmc === 5) buckets[5].count++;
      else buckets[6].count++;
    }
    const maxCount = Math.max(1, ...buckets.map((b) => b.count));
    return buckets.map((b) => ({
      label: b.label,
      count: b.count,
      height: Math.round((b.count / maxCount) * 100)
    }));
  });

  let landCount = $derived(cards.filter((c) => c.role === 'land' || /land/i.test(c.typeLine || '')).length);
  let rampCount = $derived(cards.filter((c) => c.role === 'ramp').length);
  let drawCount = $derived(cards.filter((c) => c.role === 'draw').length);
  let interactionCount = $derived(cards.filter((c) => c.role === 'interaction').length);

  let dynamicHealthMetrics = $derived([
    { name: 'Land count', value: String(landCount), range: '/ 36–38', width: `${Math.min(100, Math.round((landCount / 37) * 100))}%` },
    { name: 'Ramp sources', value: String(rampCount), range: '/ 10–12', width: `${Math.min(100, Math.round((rampCount / 11) * 100))}%` },
    { name: 'Card advantage', value: String(drawCount), range: '/ 10–12', width: `${Math.min(100, Math.round((drawCount / 10) * 100))}%` },
    { name: 'Interaction', value: String(interactionCount), range: '/ 8–12', width: `${Math.min(100, Math.round((interactionCount / 10) * 100))}%` }
  ]);

  let deckHealthScore = $derived(() => {
    if (cards.length === 0) return 0;
    let score = 50;
    if (landCount >= 34 && landCount <= 40) score += 15;
    if (rampCount >= 8 && rampCount <= 14) score += 15;
    if (drawCount >= 8 && drawCount <= 14) score += 10;
    if (interactionCount >= 6 && interactionCount <= 14) score += 10;
    return Math.min(100, score);
  });

  let ownedInCollectionCount = $derived(() => {
    if (cards.length === 0) return 0;
    const collectionNames = new Set(userCollection.map((c) => c.name.toLowerCase().trim()));
    return cards.filter((c) => collectionNames.has(c.name.toLowerCase().trim())).length;
  });

  function initEmptyDeck(): void {
    deck = {
      id: `deck-${Date.now()}`,
      name: 'New Custom Deck',
      commanderId: '',
      commanderName: '',
      archetype: 'Custom Deck',
      saltScore: 0,
      cards: [],
      updatedAt: new Date()
    };
    commander = {
      id: '',
      name: '',
      set: '',
      collectorNumber: '',
      foil: false,
      quantity: 1,
      currentPriceUsd: 0,
      manaCost: '',
      cmc: 0,
      role: 'commander',
      typeLine: 'Legendary Creature',
      oracleText: '',
      colorIdentity: []
    };
    cards = [];
    lastSavedFingerprint = '';
    saveStatus = 'New empty deck created';
  }

  async function loadSavedDeck(storedDeck: SavedDeck): Promise<void> {
    deck = storedDeck;
    cards = storedDeck.cards.filter((entry) => entry.category !== 'commander').map(toDeckCardEntry);
    const commanderEntry = storedDeck.cards.find((entry) => entry.category === 'commander');
    if (commanderEntry) {
      commander = {
        id: commanderEntry.id,
        name: commanderEntry.name,
        set: '',
        collectorNumber: '',
        foil: false,
        quantity: 1,
        currentPriceUsd: 0,
        manaCost: commanderEntry.manaCost ?? '',
        cmc: commanderEntry.cmc ?? 0,
        role: 'commander',
        typeLine: commanderEntry.typeLine ?? 'Legendary Creature',
        oracleText: '',
        imageUris: commanderEntry.imageUris,
        colorIdentity: commanderEntry.colorIdentity ?? []
      };
      if (!commanderEntry.imageUris?.art_crop || !commanderEntry.colorIdentity?.length) {
        getCardByName(commanderEntry.name).then((sc) => {
          if (sc && commander.name === commanderEntry.name) {
            applyScryfallToCommander(sc);
          }
        }).catch(() => {});
      }
    } else if (storedDeck.commanderName) {
      commander = {
        id: storedDeck.commanderId || `cmd-${Date.now()}`,
        name: storedDeck.commanderName,
        set: '',
        collectorNumber: '',
        foil: false,
        quantity: 1,
        currentPriceUsd: 0,
        manaCost: '',
        cmc: 0,
        role: 'commander',
        typeLine: 'Legendary Creature',
        oracleText: '',
        colorIdentity: []
      };
      getCardByName(storedDeck.commanderName).then((sc) => {
        if (sc && deck.commanderName === storedDeck.commanderName) {
          applyScryfallToCommander(sc);
        }
      }).catch(() => {});
    } else {
      commander = {
        id: '',
        name: '',
        set: '',
        collectorNumber: '',
        foil: false,
        quantity: 1,
        currentPriceUsd: 0,
        manaCost: '',
        cmc: 0,
        role: 'commander',
        typeLine: 'Legendary Creature',
        oracleText: '',
        colorIdentity: []
      };
    }
    saveStatus = `Loaded ${storedDeck.name}`;
  }

  let activeRole = $state<CardRole | 'all'>('all');
  let sortBy = $state('name');
  let cardQuery = $state('');
  let suggestions = $state<string[]>([]);
  let activeSuggestionIndex = $state(-1);
  let searchResults = $state<DeckCard[] | null>(null);
  let searchResultsQuery = $state('');
  let searchError = $state('');
  let isSearching = $state(false);
  let savedDecks = $state<SavedDeck[]>([]);
  let persistenceReady = $state(false);
  let saveStatus = $state('Saved locally');
  let isSaving = $state(false);
  let lastSavedFingerprint = '';
  let deckAudit = $state<SaltScoreAudit | null>(null);
  let analyzedGraph = $state<SynergyGraphData | null>(null);
  let autocompleteRequestId = 0;
  let searchRequestId = 0;
  let view = $state<'grid' | 'list'>('grid');
  let selectedCard = $state<DeckCard | null>(null);
  let leftOpen = $state(true);
  let rightOpen = $state(true);
  let activeView = $state<'studio' | 'engines' | 'goldfish' | 'matchup' | 'playbook' | 'market'>('studio');
  let dynamicSynergyPlays = $derived(detectDynamicSynergyPlays(cards.map(c => ({ id: c.id, name: c.name, typeLine: c.typeLine, cmc: c.cmc, manaCost: c.manaCost, oracleText: c.oracleText, category: c.role })), { id: commander.id, name: commander.name, typeLine: commander.typeLine, cmc: commander.cmc, manaCost: commander.manaCost, oracleText: commander.oracleText, category: 'commander', isCommander: true }));
  let isChangingCommander = $state(false);
  let commanderQuery = $state('');
  let commanderSuggestions = $state<string[]>([]);
  let activeCommanderSuggestionIndex = $state(-1);
  let isSearchingCommander = $state(false);
  let commanderSearchError = $state('');
  let commanderAutocompleteRequestId = 0;
  let filteredCards = $derived((searchResults ?? cards).filter((card) => (activeRole === 'all' || card.role === activeRole) && (searchResults !== null || card.name.toLowerCase().includes(cardQuery.toLowerCase()))).sort((a, b) => sortBy === 'price' ? (b.currentPriceUsd ?? 0) - (a.currentPriceUsd ?? 0) : sortBy === 'mana' ? a.cmc - b.cmc : a.name.localeCompare(b.name)));
  let deckValue = $derived(cards.reduce((sum, card) => sum + (card.currentPriceUsd ?? 0) * card.quantity, 0));

  let showApiKeyModal = $state(false);
  let showAIArchitectModal = $state(false);
  let hasApiKey = $state(false);

  onMount(async () => {
    hasApiKey = !!getGeminiApiKey();
    try {
      savedDecks = await getAllDecks();
      userCollection = await getCollection();
      if (savedDecks.length > 0) {
        const sorted = [...savedDecks].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        await loadSavedDeck(sorted[0]);
      } else {
        initEmptyDeck();
      }
    } catch (error) {
      console.warn('Unable to load saved decks:', error);
      saveStatus = 'Local storage unavailable';
    } finally {
      persistenceReady = true;
    }
  });

  $effect(() => {
    const query = cardQuery.trim();
    if (query.length < 2) {
      suggestions = [];
      activeSuggestionIndex = -1;
      return;
    }

    suggestions = [];
    activeSuggestionIndex = -1;
    const requestId = ++autocompleteRequestId;
    const timeoutId = setTimeout(async () => {
      const names = await autocompleteCardName(query);
      if (requestId === autocompleteRequestId) {
        suggestions = names;
        activeSuggestionIndex = names.length > 0 ? 0 : -1;
      }
    }, 180);

    return () => clearTimeout(timeoutId);
  });

  $effect(() => {
    const query = commanderQuery.trim();
    if (query.length < 2) {
      commanderSuggestions = [];
      activeCommanderSuggestionIndex = -1;
      return;
    }

    commanderSuggestions = [];
    activeCommanderSuggestionIndex = -1;
    const reqId = ++commanderAutocompleteRequestId;
    const timeoutId = setTimeout(async () => {
      try {
        const names = await autocompleteCardName(query);
        if (reqId === commanderAutocompleteRequestId) {
          commanderSuggestions = names;
          activeCommanderSuggestionIndex = names.length > 0 ? 0 : -1;
        }
      } catch {
        if (reqId === commanderAutocompleteRequestId) {
          commanderSuggestions = [];
        }
      }
    }, 180);

    return () => clearTimeout(timeoutId);
  });

  $effect(() => {
    if (!persistenceReady) return;
    const fingerprint = deckFingerprint();
    if (fingerprint === lastSavedFingerprint) return;
    const timeoutId = setTimeout(() => {
      void persistDeck(fingerprint);
    }, 500);
    return () => clearTimeout(timeoutId);
  });

  function pipClass(symbol: string): string {
    const s = symbol.toUpperCase();
    if (s === 'W') return 'pip-white';
    if (s === 'U') return 'pip-blue';
    if (s === 'B') return 'pip-black';
    if (s === 'R') return 'pip-red';
    if (s === 'G') return 'pip-green';
    if (s === 'C') return 'pip-colorless';
    return 'pip-generic';
  }

  function applyScryfallToCommander(card: ScryfallCard): void {
    const imageArtCrop = card.image_uris?.art_crop || card.card_faces?.[0]?.image_uris?.art_crop;
    const imageNormal = card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal;
    const imageSmall = card.image_uris?.small || card.card_faces?.[0]?.image_uris?.small;
    const cost = card.mana_cost ?? card.card_faces?.[0]?.mana_cost ?? '';
    const oracle = card.oracle_text ?? card.card_faces?.map((f) => f.oracle_text).filter(Boolean).join('\n//\n') ?? '';
    const price = card.prices.usd ? Number(card.prices.usd) : undefined;

    commander = {
      id: card.id,
      name: card.name,
      set: card.set,
      collectorNumber: card.collector_number,
      foil: false,
      quantity: 1,
      currentPriceUsd: price !== undefined && Number.isFinite(price) ? price : undefined,
      manaCost: cost,
      cmc: card.cmc,
      role: 'commander',
      typeLine: card.type_line,
      oracleText: oracle,
      colorIdentity: card.color_identity,
      imageUris: {
        art_crop: imageArtCrop,
        normal: imageNormal,
        small: imageSmall
      }
    };
  }

  async function selectCommander(name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) return;
    isSearchingCommander = true;
    commanderSearchError = '';
    try {
      const card = await getCardByName(trimmed);
      if (!card) {
        throw new Error(`Commander "${trimmed}" not found`);
      }
      applyScryfallToCommander(card);
      cards = cards.filter((c) => c.name.toLowerCase() !== card.name.toLowerCase());
      deck.commanderId = card.id;
      deck.commanderName = card.name;
      isChangingCommander = false;
      commanderQuery = '';
      commanderSuggestions = [];
      saveStatus = `Commander changed to ${card.name}`;
      void persistDeck();
    } catch (err) {
      commanderSearchError = err instanceof Error ? err.message : `Failed to load "${trimmed}"`;
    } finally {
      isSearchingCommander = false;
    }
  }

  function handleCommanderKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' && commanderSuggestions.length > 0) {
      event.preventDefault();
      activeCommanderSuggestionIndex = (activeCommanderSuggestionIndex + 1) % commanderSuggestions.length;
    } else if (event.key === 'ArrowUp' && commanderSuggestions.length > 0) {
      event.preventDefault();
      activeCommanderSuggestionIndex = (activeCommanderSuggestionIndex - 1 + commanderSuggestions.length) % commanderSuggestions.length;
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (activeCommanderSuggestionIndex >= 0 && commanderSuggestions[activeCommanderSuggestionIndex]) {
        void selectCommander(commanderSuggestions[activeCommanderSuggestionIndex]);
      } else if (commanderQuery.trim()) {
        void selectCommander(commanderQuery.trim());
      }
    } else if (event.key === 'Escape') {
      isChangingCommander = false;
      commanderSuggestions = [];
      activeCommanderSuggestionIndex = -1;
    }
  }

  function toSynergyInput(card: DeckCard, isCommander = false): CardSynergyInput {
    return { id: card.id, name: card.name, typeLine: card.typeLine, oracleText: card.oracleText, manaCost: card.manaCost, cmc: card.cmc, category: isCommander ? 'commander' : card.role };
  }

  function toDeckCard(card: ScryfallCard): DeckCard {
    const role = classifyCardRole({ id: card.id, name: card.name, typeLine: card.type_line, oracleText: card.oracle_text, manaCost: card.mana_cost, cmc: card.cmc });
    const price = card.prices.usd ? Number(card.prices.usd) : undefined;
    return {
      id: card.id,
      name: card.name,
      set: card.set,
      collectorNumber: card.collector_number,
      foil: false,
      quantity: 1,
      currentPriceUsd: price !== undefined && Number.isFinite(price) ? price : undefined,
      manaCost: card.mana_cost ?? '',
      cmc: card.cmc,
      role,
      typeLine: card.type_line,
      oracleText: card.oracle_text,
      imageUris: card.image_uris,
      colorIdentity: card.color_identity
    };
  }

  function toDeckCardEntry(entry: SavedDeck['cards'][number]): DeckCard {
    const existing = cards.find((card) => card.id === entry.id || card.name === entry.name);
    return {
      ...existing,
      id: entry.id,
      name: entry.name,
      set: existing?.set ?? '',
      collectorNumber: existing?.collectorNumber ?? '',
      foil: existing?.foil ?? false,
      quantity: entry.quantity,
      purchasePrice: existing?.purchasePrice,
      currentPriceUsd: existing?.currentPriceUsd,
      manaCost: entry.manaCost ?? existing?.manaCost ?? '',
      cmc: entry.cmc ?? existing?.cmc ?? 0,
      role: entry.category,
      typeLine: entry.typeLine ?? existing?.typeLine ?? 'Unknown',
      imageUris: entry.imageUris ?? existing?.imageUris,
      colorIdentity: entry.colorIdentity ?? existing?.colorIdentity,
      synergyNotes: entry.synergyNotes ?? existing?.synergyNotes
    };
  }

  function deckFingerprint(): string {
    return JSON.stringify({ commanderId: commander.id, commanderName: commander.name, name: deck.name, archetype: deck.archetype, cards: cards.map((card) => `${card.id}:${card.quantity}:${card.role}`) });
  }

  async function persistDeck(fingerprint = deckFingerprint()): Promise<void> {
    isSaving = true;
    saveStatus = 'Saving changes...';
    const storedCards: SavedDeck['cards'] = [
      { id: commander.id, name: commander.name, category: 'commander', quantity: 1, manaCost: commander.manaCost, cmc: commander.cmc, typeLine: commander.typeLine, imageUris: commander.imageUris, colorIdentity: commander.colorIdentity },
      ...cards.map((card) => ({ id: card.id, name: card.name, category: card.role, quantity: card.quantity, synergyNotes: card.synergyNotes, manaCost: card.manaCost, cmc: card.cmc, typeLine: card.typeLine, imageUris: card.imageUris, colorIdentity: card.colorIdentity }))
    ];
    const savedDeck: SavedDeck = { ...deck, commanderId: commander.id, commanderName: commander.name, cards: storedCards, updatedAt: new Date() };
    try {
      await saveDeck(savedDeck);
      deck = savedDeck;
      lastSavedFingerprint = fingerprint;
      savedDecks = await getAllDecks();
      saveStatus = 'Saved locally';
    } catch (error) {
      console.warn('Unable to save deck:', error);
      saveStatus = 'Save failed';
    } finally {
      isSaving = false;
    }
  }

  function toggleDeckCard(card: DeckCard): void {
    if (card.role === 'commander') return;
    cards = cards.some((item) => item.id === card.id)
      ? cards.filter((item) => item.id !== card.id)
      : [...cards, card];
  }

  function setDeckCommander(card: DeckCard): void {
    const previousCommander = { ...commander, role: 'payoff' as CardRole };
    commander = {
      ...card,
      role: 'commander',
      quantity: 1
    };
    cards = cards.filter((item) => item.name.toLowerCase() !== card.name.toLowerCase());
    if (!cards.some((item) => item.name.toLowerCase() === previousCommander.name.toLowerCase())) {
      cards = [...cards, previousCommander];
    }
    deck.commanderId = commander.id;
    deck.commanderName = commander.name;
    saveStatus = `Set ${commander.name} as Commander`;
    void persistDeck();
  }

  function selectedCardIsInDeck(): boolean {
    const activeCard = selectedCard;
    return activeCard !== null && cards.some((card) => card.id === activeCard.id);
  }

  function handleDetailKeydown(event: KeyboardEvent): void {
    const activeCard = selectedCard;
    if (!activeCard) return;

    if (event.key === 'Escape') {
      selectedCard = null;
      return;
    }

    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const currentIndex = filteredCards.findIndex((card) => card.id === activeCard.id);
    const nextIndex = event.key === 'ArrowRight' ? currentIndex + 1 : currentIndex - 1;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= filteredCards.length) return;
    event.preventDefault();
    selectedCard = filteredCards[nextIndex];
  }

  async function runCardSearch(query = cardQuery): Promise<void> {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;

    const requestId = ++searchRequestId;
    isSearching = true;
    searchError = '';
    suggestions = [];
    try {
      const response = await searchScryfallCards(normalizedQuery);
      if (requestId !== searchRequestId) return;
      searchResults = response.data.map(toDeckCard);
      searchResultsQuery = normalizedQuery;
      activeRole = 'all';
    } catch (error) {
      if (requestId !== searchRequestId) return;
      searchResults = [];
      searchResultsQuery = normalizedQuery;
      searchError = error instanceof Error ? error.message : 'Scryfall search failed.';
    } finally {
      if (requestId === searchRequestId) isSearching = false;
    }
  }

  function chooseSuggestion(name: string): void {
    cardQuery = name;
    activeSuggestionIndex = -1;
    void runCardSearch(name);
  }

  function handleSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' && suggestions.length > 0) {
      event.preventDefault();
      activeSuggestionIndex = (activeSuggestionIndex + 1) % suggestions.length;
    } else if (event.key === 'ArrowUp' && suggestions.length > 0) {
      event.preventDefault();
      activeSuggestionIndex = (activeSuggestionIndex - 1 + suggestions.length) % suggestions.length;
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) chooseSuggestion(suggestions[activeSuggestionIndex]);
      else void runCardSearch();
    } else if (event.key === 'Escape') {
      suggestions = [];
      activeSuggestionIndex = -1;
    }
  }

  function analyzeDeck(): void {
    const analysisCards = [toSynergyInput(commander, true), ...cards.map((card) => toSynergyInput(card))];
    deckAudit = auditDeckSaltAndPower(analysisCards);
    analyzedGraph = generateSynergyGraph(analysisCards);
    activeView = 'engines';
  }

  async function applyArenaAddition(cardName: string, role = 'engine'): Promise<void> {
    if (cards.some((c) => c.name.toLowerCase() === cardName.toLowerCase())) return;
    try {
      const scryfallCard = await getCardByName(cardName);
      if (scryfallCard) {
        const newCard = toDeckCard(scryfallCard);
        newCard.role = (role as CardRole) || 'engine';
        cards = [...cards, newCard];
        saveStatus = `Added ${cardName}`;
      } else {
        const fallbackCard: DeckCard = {
          id: `custom-${Date.now()}`,
          name: cardName,
          set: 'custom',
          collectorNumber: '1',
          foil: false,
          quantity: 1,
          manaCost: '',
          role: (role as CardRole) || 'engine',
          cmc: 3,
          typeLine: 'Spell'
        };
        cards = [...cards, fallbackCard];
        saveStatus = `Added ${cardName}`;
      }
    } catch {
      saveStatus = `Could not add ${cardName}`;
    }
  }

  function applyArenaCut(cardName: string): void {
    const countBefore = cards.length;
    cards = cards.filter((c) => c.name.toLowerCase() !== cardName.toLowerCase());
    if (cards.length < countBefore) {
      saveStatus = `Removed ${cardName}`;
    }
  }

  async function applyBudgetSwap(originalCardName: string, replacementCardName: string): Promise<void> {
    applyArenaCut(originalCardName);
    await applyArenaAddition(replacementCardName);
    saveStatus = `Swapped ${originalCardName} for ${replacementCardName}`;
  }

  async function applyAIGeneratedDeck(generated: GeneratedDeckResult): Promise<void> {
    deck.archetype = generated.archetype;
    deck.saltScore = generated.estimatedSaltScore;
    if (commander.name) {
      deck.name = `${commander.name} — ${generated.archetype}`;
    }

    const loadedCards: DeckCard[] = [];
    for (const item of generated.cards) {
      try {
        const scryfallCard = await getCardByName(item.name);
        if (scryfallCard) {
          const dc = toDeckCard(scryfallCard);
          dc.role = item.category as CardRole;
          dc.synergyNotes = item.synergyRationale;
          dc.budgetReplacement = item.budgetAlternative;
          loadedCards.push(dc);
          continue;
        }
      } catch {
        // Fall back to generated card metadata
      }

      loadedCards.push({
        id: `gen-${Math.random().toString(36).substring(2, 9)}`,
        name: item.name,
        set: 'ai',
        collectorNumber: '1',
        foil: false,
        quantity: 1,
        manaCost: '',
        cmc: item.cmc,
        role: item.category as CardRole,
        typeLine: item.category === 'land' ? 'Land' : 'Spell',
        synergyNotes: item.synergyRationale,
        budgetReplacement: item.budgetAlternative
      });
    }

    cards = loadedCards;
    saveStatus = `AI generated ${loadedCards.length} cards for ${generated.archetype}`;
    await persistDeck();
  }

  let showIOModal = $state(false);
  let ioMode = $state<'export' | 'import'>('export');
  let importText = $state('');
  let importAppend = $state(false);
  let copyFeedback = $state(false);
  let isImporting = $state(false);

  function getExportDecklist(): string {
    const lines: string[] = [];
    lines.push('// Commander');
    lines.push(`1 ${commander.name}`);
    lines.push('');
    lines.push('// Mainboard');
    for (const card of cards) {
      lines.push(`${card.quantity || 1} ${card.name}`);
    }
    return lines.join('\n');
  }

  async function copyExportToClipboard(): Promise<void> {
    const text = getExportDecklist();
    await navigator.clipboard.writeText(text);
    copyFeedback = true;
    setTimeout(() => copyFeedback = false, 2000);
  }

  function downloadExportDecklist(): void {
    const text = getExportDecklist();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck.name.replace(/[^a-z0-9_-]/gi, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function processImport(): Promise<void> {
    if (!importText.trim()) return;
    isImporting = true;
    try {
      const lines = importText.split('\n');
      const newCards: DeckCard[] = [];
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith('//') || line.startsWith('#')) continue;
        const match = line.match(/^(\d+)?x?\s*(.+)$/);
        if (!match) continue;
        const qty = parseInt(match[1] || '1', 10);
        const rawName = match[2].replace(/\s*\([A-Za-z0-9]+\)\s*(\d+)?$/, '').trim();
        if (rawName.toLowerCase() === commander.name.toLowerCase()) continue;

        const existing = cards.find((c) => c.name.toLowerCase() === rawName.toLowerCase());
        if (existing) {
          newCards.push({ ...existing, quantity: qty });
        } else {
          newCards.push({
            id: `import-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: rawName,
            set: 'custom',
            collectorNumber: '1',
            foil: false,
            quantity: qty,
            manaCost: '',
            role: 'engine',
            cmc: 3,
            typeLine: 'Spell'
          });
        }
      }
      if (importAppend) {
        cards = [...cards, ...newCards.filter((nc) => !cards.some((c) => c.name.toLowerCase() === nc.name.toLowerCase()))];
      } else if (newCards.length > 0) {
        cards = newCards;
      }
      saveStatus = `Imported ${newCards.length} cards`;
      showIOModal = false;
      importText = '';
    } finally {
      isImporting = false;
    }
  }

  function roleCount(role: CardRole): number { return cards.filter((card) => card.role === role).length; }
</script>

<svelte:window onkeydown={handleDetailKeydown} />

<main class="page-wrap">
  <div class="workspace-heading enter">
    <div><div class="breadcrumb"><span>DECKS</span><ChevronRight size={12} /><span class="current-crumb">{deck.name}</span><i></i><span class="saved-label">{saveStatus}</span></div><h1><input class="deck-name-input" bind:value={deck.name} aria-label="Deck name" /><small>v.04</small></h1><div class="heading-meta"><span class="commander-label"><i></i>{commander.name}</span><b></b><span>{deck.archetype}</span><b></b><span>Updated just now</span></div></div>
    <div class="heading-actions">
      <button class="subtle-button ai-architect-btn" onclick={() => showAIArchitectModal = true} title="AI Deck Architect (Google Gemini)">
        <BrainCircuit size={13} />
        <span>AI Architect</span>
      </button>
      <button class="subtle-button key-button" onclick={() => showApiKeyModal = true} title="Configure Google Gemini API Key" aria-label="Configure Google Gemini API Key">
        <Key size={13} />
        <span>Gemini Key</span>
        {#if hasApiKey}
          <span class="key-status-dot active" title="API key configured"></span>
        {/if}
      </button>
      <button class="subtle-button" onclick={() => activeView = activeView === 'engines' ? 'studio' : 'engines'}><Activity size={13} /> Engine map</button>
      <button class="subtle-button" onclick={() => showIOModal = true}><FileText size={13} /> Decklist I/O</button>
      <button class="subtle-button" onclick={() => persistDeck()} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save deck'}</button>
      <button class="primary-button" onclick={analyzeDeck}><WandSparkles size={13} /> Analyze deck</button>
    </div>
  </div>

  <nav class="view-tabs" aria-label="Workspace views">
    <button class:active={activeView === 'studio'} onclick={() => activeView = 'studio'}><Layers3 size={14} /> Studio <small>{cards.length}</small></button>
    <button class:active={activeView === 'engines'} onclick={() => activeView = 'engines'}><Activity size={14} /> Synergy map</button>
    <button class:active={activeView === 'playbook'} onclick={() => activeView = 'playbook'}><BookOpen size={14} /> Pilot Guide</button>
    <button class:active={activeView === 'goldfish'} onclick={() => activeView = 'goldfish'}><Swords size={14} /> Goldfish</button>
    <button class:active={activeView === 'matchup'} onclick={() => activeView = 'matchup'}><Target size={14} /> Matchup Arena</button>
    <button class:active={activeView === 'market'} onclick={() => activeView = 'market'}><Coins size={14} /> Market Advisor</button>
    <span></span>
    <div class="identity" aria-label="Commander Color Identity">
      {#if commander.colorIdentity && commander.colorIdentity.length > 0}
        {#each commander.colorIdentity as color}
          <i class={`identity-pip identity-${color.toLowerCase()}`}>{color}</i>
        {/each}
      {:else}
        <i class="identity-pip identity-c">C</i>
      {/if}
    </div>
  </nav>

  {#if activeView === 'playbook'}
    <div class="single-view enter"><PilotGuide {cards} {commander} deckName={deck.name} archetype={deck.archetype} onApplyAddition={applyArenaAddition} /></div>
  {:else if activeView === 'goldfish'}
    <div class="single-view enter"><GoldfishView cards={cards} {commander} /></div>
  {:else if activeView === 'matchup'}
    <div class="matchup-view enter"><MatchupArena {cards} {commander} {savedDecks} deckName={deck.name} onApplyAddition={applyArenaAddition} onApplyCut={applyArenaCut} /></div>
  {:else if activeView === 'market'}
    <div class="single-view enter"><MarketAdvisor {cards} {commander} deckName={deck.name} onApplySwap={applyBudgetSwap} /></div>
  {:else if activeView === 'engines'}
    <div class="engines-view enter"><section class="panel engine-panel"><div class="panel-heading"><div><span class="panel-title">{deck.archetype} feedback loop</span><small>{analyzedGraph ? `${analyzedGraph.nodes.length} nodes · ${analyzedGraph.edges.length} links` : `Generated from ${graphCards.length} cards`}</small></div><button class="subtle-button" onclick={analyzeDeck}><Sparkles size={12} /> Recalculate</button></div><SynergyGraph cards={graphCards} graphData={analyzedGraph} /></section><aside class="panel engine-notes"><div class="panel-heading"><span class="panel-title">Engine notes</span><small class="live">● LIVE</small></div>{#if deckAudit}<div class="audit-summary"><div><span>Power bracket</span><strong>{deckAudit.estimatedPowerBracket} · {deckAudit.estimatedPowerNumber}/10</strong></div><div><span>Average salt</span><strong>{deckAudit.averageSaltScore}</strong></div><div><span>Notable cards</span><strong>{deckAudit.highSaltCards.length}</strong></div></div>{/if}{#if dynamicSynergyPlays.length > 0}{#each dynamicSynergyPlays.slice(0, 3) as play, i}<div class="note"><b>0{i + 1}</b><div><strong>{play.title}</strong><p>{play.description} {play.tacticalTip}</p></div></div>{/each}{:else}<div class="note"><b>01</b><div><strong>Core Commander Synergies</strong><p>Deploy {commander.name} on curve to anchor the deck’s primary engine loop.</p></div></div><div class="note"><b>02</b><div><strong>Mana Curve Acceleration</strong><p>Prioritize 1–2 CMC ramp to accelerate into early payoffs.</p></div></div><div class="note"><b>03</b><div><strong>Interaction Timing</strong><p>Save targeted interaction for game-ending opponent combo lines.</p></div></div>{/if}</aside></div>
  {:else}
    <div class="workspace" class:left-collapsed={!leftOpen} class:right-collapsed={!rightOpen}>
      {#if leftOpen}
        <aside class="left-rail enter">
          <section class="panel commander-card">
            <div class="commander-art">
              {#if commander.name && (commander.imageUris?.art_crop || commander.imageUris?.normal)}
                <img
                  src={commander.imageUris?.art_crop || commander.imageUris?.normal}
                  alt={commander.name}
                />
              {:else if commander.name}
                <img
                  src={`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(commander.name)}&format=image&version=art_crop`}
                  alt={commander.name}
                />
              {:else}
                <div class="no-commander-placeholder">
                  <Sparkles size={24} />
                  <span>No Commander Selected</span>
                </div>
              {/if}
              <span>COMMANDER</span>
              <button
                class="change-commander-badge-btn"
                onclick={() => { isChangingCommander = !isChangingCommander; commanderQuery = ''; commanderSuggestions = []; }}
                title="Change Commander"
                aria-label="Change Commander"
              >
                {#if isChangingCommander}
                  <X size={11} /> Cancel
                {:else}
                  <Sparkles size={11} /> {commander.name ? 'Switch' : 'Choose'}
                {/if}
              </button>
            </div>
            {#if isChangingCommander}
              <div class="commander-search-container">
                <div class="commander-search-input-wrap">
                  <Search size={12} />
                  <input
                    bind:value={commanderQuery}
                    placeholder="Search legendary creature..."
                    aria-label="Search new commander"
                    onkeydown={handleCommanderKeydown}
                  />
                  {#if isSearchingCommander}
                    <span class="search-spinner"></span>
                  {/if}
                </div>
                {#if commanderSuggestions.length > 0}
                  <div class="commander-suggestions-list" role="listbox" aria-label="Commander suggestions">
                    {#each commanderSuggestions as suggestion, idx}
                      <button
                        type="button"
                        role="option"
                        aria-selected={activeCommanderSuggestionIndex === idx}
                        class:active-suggestion={activeCommanderSuggestionIndex === idx}
                        onmouseenter={() => activeCommanderSuggestionIndex = idx}
                        onmousedown={(e) => e.preventDefault()}
                        onclick={() => selectCommander(suggestion)}
                      >
                        <Sparkles size={10} />
                        <span>{suggestion}</span>
                      </button>
                    {/each}
                  </div>
                {/if}
                {#if commanderSearchError}
                  <p class="commander-search-error">{commanderSearchError}</p>
                {/if}
              </div>
            {/if}
            <div class="commander-info">
              <div class="commander-title-row">
                <strong>{commander.name || 'No Commander Chosen'}</strong>
              </div>
              <small>{commander.typeLine || 'Legendary Creature'}</small>
              <div class="commander-stats">
                <span>{(commander.colorIdentity?.length ?? 0)} <small>colors</small></span>
                <span>{commander.cmc} <small>cmc</small></span>
                <button
                  class="change-commander-link"
                  onclick={() => { isChangingCommander = !isChangingCommander; commanderQuery = ''; commanderSuggestions = []; }}
                >
                  {isChangingCommander ? 'Close' : (commander.name ? 'Change Commander' : 'Select Commander')}
                </button>
              </div>
              <div class="commander-mana">
                {#each manaSymbols(commander.manaCost) as symbol}
                  <i class={pipClass(symbol)}>{symbol}</i>
                {/each}
                <span>SALT <b>{deck.saltScore}</b><i class="salt-meter"><b></b></i></span>
              </div>
            </div>
          </section>
          <section class="panel"><div class="panel-heading"><span class="panel-title">Mana curve</span><button class="mini-select">CMC <ChevronDown size={11} /></button></div><div class="curve-content"><div class="curve-total"><strong>{averageCmc}</strong><small>Average mana value</small></div><div class="curve-chart">{#each dynamicCurve() as bar}<div><small>{bar.count}</small><i style={`--height:${bar.height}%`}></i><small>{bar.label}</small></div>{/each}</div></div></section>
          <section class="panel"><div class="panel-heading"><span class="panel-title">Role balance</span><button class="icon-button" aria-label="Role settings"><ChevronDown size={14} /></button></div><div class="role-list">{#each roles as role}<button class="role-item" onclick={() => activeRole = activeRole === role ? 'all' : role}><i class={`role-mark role-${role}`}></i><span>{role}</span><b>{roleCount(role)}</b><i class="role-track"><i class={`bar-${role}`} style={`width:${Math.min(roleCount(role) * 10, 100)}%`}></i></i></button>{/each}</div><div class="role-foot"><span>Cards assigned</span><b>{cards.length} / 100</b></div></section>
        </aside>
      {:else}<button class="reopen" onclick={() => leftOpen = true} aria-label="Show commander panels"><PanelLeftClose size={15} /></button>{/if}

      <section class="center-rail enter"><section class="panel deck-panel"><div class="panel-heading"><div><span class="panel-title">Deck library</span><small class="library-total">{cards.length + (commander.name ? 1 : 0)} / 100 cards</small></div><div class="tools"><button class="icon-button" onclick={() => leftOpen = !leftOpen} aria-label="Toggle commander panels"><PanelLeftClose size={14} /></button><button class="icon-button" onclick={() => rightOpen = !rightOpen} aria-label="Toggle insight panels"><PanelRightClose size={14} /></button><button class="icon-button" aria-label="Additional filters"><Filter size={14} /></button></div></div>
        <div class="filter-toolbar"><div class="search-group"><label class="card-search"><Search size={13} /><input bind:value={cardQuery} placeholder="Find or filter cards..." aria-label="Search Scryfall cards" aria-autocomplete="list" aria-controls="scryfall-suggestions" aria-expanded={suggestions.length > 0} onkeydown={handleSearchKeydown} /></label><button class="search-submit" onclick={() => runCardSearch()} disabled={isSearching || !cardQuery.trim()} title="Search Scryfall" aria-label="Search Scryfall">{#if isSearching}<span class="search-spinner"></span>{:else}<Search size={13} />{/if}</button>{#if suggestions.length > 0}<div class="autocomplete-list" id="scryfall-suggestions" role="listbox" aria-label="Card name suggestions">{#each suggestions as suggestion, index}<button type="button" role="option" aria-selected={activeSuggestionIndex === index} class:suggestion-active={activeSuggestionIndex === index} onmouseenter={() => activeSuggestionIndex = index} onmousedown={(event) => event.preventDefault()} onclick={() => chooseSuggestion(suggestion)}><Search size={11} />{suggestion}</button>{/each}</div>{/if}</div><div class="role-filters"><button class:filter-active={activeRole === 'all'} onclick={() => activeRole = 'all'}>All <small>{(searchResults ?? cards).length}</small></button>{#each roles as role}<button class:filter-active={activeRole === role} onclick={() => activeRole = activeRole === role ? 'all' : role}>{role}</button>{/each}</div><div class="filter-controls"><label><ArrowDownWideNarrow size={12} /><select bind:value={sortBy} aria-label="Sort cards"><option value="name">Name</option><option value="mana">Mana value</option><option value="price">Price</option></select></label><button class:chosen={view === 'grid'} aria-label="Grid view" title="Grid view" onclick={() => view = 'grid'}><Grid2X2 size={13} /></button><button class:chosen={view === 'list'} aria-label="List view" title="List view" onclick={() => view = 'list'}><List size={14} /></button></div></div>
        {#if searchError}<p class="search-status error">{searchError}</p>{:else if searchResults}<p class="search-status">Scryfall results for “{searchResultsQuery}” · {searchResults.length} cards</p>{/if}
        <div class="card-summary"><span><i></i>{filteredCards.length} shown</span><span><CircleDollarSign size={12} />${deckValue.toFixed(2)} market value</span></div><CardGrid cards={filteredCards} {view} onselect={(card) => selectedCard = card} />{#if cards.length > 0}<button class="load-more">Showing {filteredCards.length} of {cards.length} cards <ChevronDown size={13} /></button>{/if}
      </section></section>

      {#if rightOpen}
        <aside class="right-rail enter"><section class="panel"><div class="panel-heading"><span class="panel-title">Deck health</span><strong class="health-score">● {deckHealthScore()}</strong></div><div class="health-metrics">{#each dynamicHealthMetrics as metric}<div><span>{metric.name}</span><strong>{metric.value} <small>{metric.range}</small></strong><i><b style={`width:${metric.width}`}></b></i></div>{/each}</div><div class="health-foot"><Shield size={12} /> 4 structural signals reviewed</div></section>
          <section class="panel synergy-panel"><div class="panel-heading"><span class="panel-title">Synergy map</span><button class="text-action" onclick={() => activeView = 'engines'}>Open map <ChevronRight size={12} /></button></div><div class="graph-preview"><SynergyGraph cards={graphCards} /></div></section>
          <section class="panel"><div class="panel-heading"><span class="panel-title">Collection value</span><TrendingUp size={14} color="#a3e635" /></div><div class="market-value"><strong>${deckValue.toFixed(2)}</strong><span>${userCollection.reduce((sum, c) => sum + (c.currentPriceUsd ?? 0) * (c.quantity || 1), 0).toFixed(2)} <small>in collection</small></span></div><div class="market-foot">Owned in collection <b>{ownedInCollectionCount()} / {cards.length}</b></div></section>
          <section class="panel saved-decks-panel"><div class="panel-heading"><span class="panel-title">Saved decks</span><div class="saved-header-tools"><button class="mini-new-btn" onclick={initEmptyDeck} title="Create empty deck"><Plus size={10} /> New</button><small class="saved-count">{savedDecks.length}</small></div></div>{#if savedDecks.length === 0}<p class="no-saved-decks">No saved decks yet.</p>{:else}<div class="saved-deck-list">{#each savedDecks.slice(0, 5) as savedDeck (savedDeck.id)}<button class="saved-deck-row" class:active-saved={savedDeck.id === deck.id} onclick={() => loadSavedDeck(savedDeck)}><span><strong>{savedDeck.name}</strong><small>{savedDeck.archetype}</small></span><b>{savedDeck.cards.length}</b></button>{/each}</div>{/if}</section>
          <section class="panel"><div class="panel-heading"><span class="panel-title">Test a hand</span><button class="text-action" onclick={() => activeView = 'goldfish'}>Open bench <ChevronRight size={12} /></button></div><button class="goldfish-teaser" onclick={() => activeView = 'goldfish'}><i><Swords size={15} /></i><span><strong>Turn 1–5 goldfish</strong><small>Keep, mulligan, sequence.</small></span><ChevronRight size={14} /></button></section>
        </aside>
      {:else}<button class="reopen" onclick={() => rightOpen = true} aria-label="Show deck insights"><PanelRightClose size={15} /></button>{/if}
    </div>
  {/if}
  <footer class="page-footer"><span><i class="status-dot"></i>Local workspace · nothing leaves this device</span><span>COMMANDER LAB · STUDIO 04</span></footer>
</main>

<CardDetailModal card={selectedCard} inDeck={selectedCardIsInDeck()} ontoggle={toggleDeckCard} onsetcommander={setDeckCommander} onclose={() => selectedCard = null} />

{#if showIOModal}
  <div class="scrim" role="presentation" onclick={(e) => e.target === e.currentTarget && (showIOModal = false)}>
    <div class="io-modal panel" role="dialog" aria-labelledby="io-title" aria-modal="true">
      <header class="io-header">
        <div class="io-title-wrap">
          <span class="eyebrow">DECKLIST MANAGER</span>
          <h2 id="io-title">Import & Export</h2>
        </div>
        <button class="icon-button close-btn" onclick={() => showIOModal = false} aria-label="Close modal"><X size={15} /></button>
      </header>
      <div class="io-tabs">
        <button class:active={ioMode === 'export'} onclick={() => ioMode = 'export'}><Download size={13} /> Export list</button>
        <button class:active={ioMode === 'import'} onclick={() => ioMode = 'import'}><Upload size={13} /> Import list</button>
      </div>
      <div class="io-body">
        {#if ioMode === 'export'}
          <p class="io-desc">Standard plain-text / MTGO clipboard format with Commander header.</p>
          <textarea readonly class="io-textarea" value={getExportDecklist()}></textarea>
          <div class="io-actions">
            <button class="primary-button" onclick={copyExportToClipboard}>
              {#if copyFeedback}<Check size={13} /> Copied!{:else}<Copy size={13} /> Copy to clipboard{/if}
            </button>
            <button class="subtle-button" onclick={downloadExportDecklist}><Download size={13} /> Download .txt</button>
          </div>
        {:else}
          <p class="io-desc">Paste decklist (e.g. <code>1 Sol Ring</code> or <code>Arcane Signet</code>). One card per line.</p>
          <textarea class="io-textarea" placeholder="Paste your decklist here..." bind:value={importText}></textarea>
          <div class="io-options">
            <label class="io-check"><input type="checkbox" bind:checked={importAppend} /> Append to existing cards (instead of replacing)</label>
          </div>
          <div class="io-actions">
            <button class="primary-button" disabled={isImporting || !importText.trim()} onclick={processImport}>
              <Upload size={13} /> {isImporting ? 'Importing...' : 'Import decklist'}
            </button>
            <button class="subtle-button" onclick={() => showIOModal = false}>Cancel</button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<ApiKeyModal
  open={showApiKeyModal}
  onclose={() => {
    showApiKeyModal = false;
    hasApiKey = !!getGeminiApiKey();
  }}
  onkeychange={(k) => (hasApiKey = k)}
/>

<AIDeckArchitectModal
  open={showAIArchitectModal}
  {commander}
  {userCollection}
  onclose={() => showAIArchitectModal = false}
  onApplyDeck={applyAIGeneratedDeck}
/>

<style>
  .key-button { display: inline-flex; align-items: center; gap: 6px; }
  .key-status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 6px rgba(34, 197, 94, 0.75); }
  .workspace-heading{display:flex;align-items:end;justify-content:space-between;gap:18px;padding:2px 0 16px}.breadcrumb{display:flex;align-items:center;gap:7px;color:#666671;font:8px var(--mono);letter-spacing:.06em}.current-crumb{color:#a1a1aa}.breadcrumb i{width:5px;height:5px;margin-left:5px;border-radius:50%;background:#22c55e}.saved-label{color:#777780;font:9px 'Space Grotesk',sans-serif;letter-spacing:0}h1{display:flex;align-items:center;gap:9px;margin:7px 0 5px;color:#fafafa;font-size:24px;font-weight:600;line-height:1.1}.deck-name-input{width:min(320px,55vw);min-width:150px;padding:0;border:0;border-bottom:1px solid transparent;outline:0;background:transparent;color:inherit;font:inherit}.deck-name-input:hover,.deck-name-input:focus{border-bottom-color:#3f3f46}h1 small{padding:4px 5px;border:1px solid #303036;border-radius:3px;color:#8d8d97;font:8px var(--mono)}.heading-meta{display:flex;align-items:center;gap:9px;color:#777780;font-size:9px}.commander-label{display:inline-flex;align-items:center;gap:6px;color:#c4c4cb}.commander-label i{width:6px;height:6px;border-radius:50%;background:#38bdf8;box-shadow:5px 0 #a855f7,10px 0 #22c55e;margin-right:9px}.heading-meta>b{width:1px;height:10px;background:#3f3f46}.heading-actions{display:flex;gap:7px}.primary-button{display:inline-flex;min-height:30px;align-items:center;gap:6px;padding:0 10px;border:1px solid #38bdf85f;border-radius:5px;background:#0e749033;color:#bae6fd;font-size:10px;cursor:pointer}
  .view-tabs{display:flex;height:40px;align-items:stretch;gap:18px;border-bottom:1px solid #303036}.view-tabs button{position:relative;display:inline-flex;align-items:center;gap:6px;padding:0 2px;border:0;background:transparent;color:#777780;font-size:10px;cursor:pointer}.view-tabs button.active{color:#e4e4e7}.view-tabs button.active:after{position:absolute;right:0;bottom:-1px;left:0;height:2px;background:#38bdf8;content:''}.view-tabs button small{padding:2px 5px;border-radius:3px;background:#26262b;color:#a1a1aa;font:8px var(--mono)}.view-tabs>span{flex:1}.identity{display:flex;align-items:center;gap:4px}.identity i{display:grid;width:16px;height:16px;place-items:center;border:1px solid #ffffff26;border-radius:50%;font:8px var(--mono);font-style:normal}.identity i.identity-w{background:#deded9;color:#27272a;border-color:#ffffff40}.identity i.identity-u{background:#075985;color:#e0f2fe;border-color:#38bdf866}.identity i.identity-b{background:#27202d;color:#e9d5ff;border-color:#a855f766}.identity i.identity-r{background:#7f1d1d;color:#fee2e2;border-color:#ef444466}.identity i.identity-g{background:#14532d;color:#dcfce7;border-color:#22c55e66}.identity i.identity-c{background:#3f3f46;color:#e4e4e7;border-color:#71717a66}
  .workspace{display:grid;grid-template-columns:minmax(205px,.82fr) minmax(390px,1.55fr) minmax(230px,.9fr);align-items:start;gap:11px;padding-top:13px}.workspace.left-collapsed{grid-template-columns:26px minmax(390px,1.6fr) minmax(230px,.9fr)}.workspace.right-collapsed{grid-template-columns:minmax(205px,.82fr) minmax(390px,1.6fr) 26px}.workspace.left-collapsed.right-collapsed{grid-template-columns:26px minmax(390px,1fr) 26px}.left-rail,.right-rail{display:grid;min-width:0;gap:9px}.commander-card{overflow:hidden}.commander-art{position:relative;height:115px;overflow:hidden;background:linear-gradient(120deg,#173744,#292234 54%,#36321d)}.commander-art img{width:100%;height:100%;object-fit:cover;object-position:50% 30%;opacity:.75}.commander-art>span{position:absolute;top:9px;left:9px;padding:4px 6px;border:1px solid #ffffff40;border-radius:3px;background:#09090b99;color:#e4e4e7;font:7px var(--mono);letter-spacing:.08em}.commander-info{padding:10px 11px}.commander-info strong{display:block;color:#e4e4e7;font-size:11px}.commander-info>small{display:block;margin-top:3px;color:#777780;font-size:8px}.commander-stats{display:flex;gap:12px;margin:10px 0;padding-bottom:9px;border-bottom:1px solid #29292e;color:#d4d4d8;font:9px var(--mono)}.commander-stats small{color:#777780;font:8px 'Space Grotesk',sans-serif}.commander-mana{display:flex;align-items:center;gap:4px}.commander-mana>i{display:grid;width:17px;height:17px;place-items:center;border:1px solid #777;border-radius:50%;background:#deded9;color:#18181b;font:8px var(--mono);font-style:normal}.commander-mana .pip-white{border-color:#e2e8f0;background:#deded9;color:#18181b}.commander-mana .pip-blue{border-color:#38bdf8;background:#0369a1;color:#e0f2fe}.commander-mana .pip-black{border-color:#a855f7;background:#27202d;color:#e9d5ff}.commander-mana .pip-red{border-color:#f87171;background:#991b1b;color:#fee2e2}.commander-mana .pip-green{border-color:#22c55e;background:#14532d;color:#dcfce7}.commander-mana .pip-colorless{border-color:#94a3b8;background:#475569;color:#f1f5f9}.commander-mana .pip-generic{border-color:#52525b;background:#27272a;color:#d4d4d8}.commander-mana>span{display:flex;align-items:center;gap:5px;margin-left:auto;color:#777780;font:7px var(--mono)}.commander-mana>span>b{color:#d4d4d8;font-size:9px;font-weight:500}.salt-meter{width:31px;height:3px;overflow:hidden;border-radius:2px;background:#35353a}.salt-meter>b{display:block;width:34%;height:100%;background:#f59e0b}
  .mini-select{display:flex;align-items:center;gap:4px;padding:4px;border:1px solid #303036;border-radius:3px;background:#18181b;color:#777780;font:8px var(--mono)}.curve-content{padding:10px 11px 8px}.curve-total{display:flex;align-items:baseline;gap:8px}.curve-total strong{color:#e4e4e7;font:500 16px var(--mono)}.curve-total small{color:#777780;font-size:8px}.curve-chart{display:grid;height:79px;grid-template-columns:repeat(7,1fr);align-items:end;gap:7px;margin-top:8px}.curve-chart>div{display:grid;height:100%;grid-template-rows:9px 1fr 11px;justify-items:center;align-items:end;gap:3px}.curve-chart small{color:#666671;font:7px var(--mono)}.curve-chart i{width:100%;height:var(--height);align-self:end;border:1px solid #38bdf82b;border-radius:3px 3px 0 0;background:linear-gradient(0deg,#0e749040,#38bdf88f)}.curve-chart>div:nth-child(4) i{background:linear-gradient(0deg,#22c55e22,#22c55e80)}
  .role-list{padding:5px 10px 1px}.role-item{display:grid;width:100%;grid-template-columns:14px 1fr 18px;align-items:center;gap:7px;padding:6px 0;border:0;background:transparent;color:#a1a1aa;font-size:9px;text-align:left;text-transform:capitalize;cursor:pointer}.role-item>b{color:#d4d4d8;font:9px var(--mono);text-align:right}.role-mark{width:12px;height:12px;border:1px solid currentColor;border-radius:4px}.role-ramp{color:#4ade80}.role-draw{color:#7dd3fc}.role-engine{color:#c084fc}.role-interaction{color:#f87171}.role-payoff{color:#fbbf24}.role-track{grid-column:2/4;height:2px;margin-top:-3px;border-radius:2px;background:#29292e}.role-track i{display:block;height:100%;background:currentColor}.bar-ramp{color:#22c55e}.bar-draw{color:#38bdf8}.bar-engine{color:#a855f7}.bar-interaction{color:#ef4444}.bar-payoff{color:#f59e0b}.role-foot,.market-foot{display:flex;justify-content:space-between;margin:2px 10px 9px;padding-top:8px;border-top:1px solid #29292e;color:#777780;font-size:8px}.role-foot b,.market-foot b{color:#a1a1aa;font:8px var(--mono)}
  .center-rail{min-width:0}.deck-panel{overflow:hidden}.panel-heading>div:first-child{display:flex;align-items:center;gap:8px}.library-total{color:#777780;font:8px var(--mono)}.tools{display:flex;gap:1px}.filter-toolbar{display:grid;grid-template-columns:minmax(100px,1fr) auto;gap:8px;padding:9px 11px;border-bottom:1px solid #25252a}.card-search{display:flex;min-width:0;height:28px;align-items:center;gap:6px;padding:0 7px;border:1px solid #303036;border-radius:4px;background:#101013;color:#71717a}.card-search input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#d4d4d8;font-size:9px}.card-search input::placeholder{color:#666671}.role-filters{display:flex;grid-column:1/-1;gap:4px;overflow:auto;scrollbar-width:none}.role-filters button{min-height:23px;flex:0 0 auto;padding:0 7px;border:1px solid #303036;border-radius:4px;background:#17171a;color:#777780;font-size:8px;text-transform:capitalize;cursor:pointer}.role-filters button.filter-active{border-color:#38bdf855;background:#0e749024;color:#7dd3fc}.role-filters small{color:#666671;font:8px var(--mono)}.filter-controls{display:flex;grid-column:1/-1;align-items:center;justify-content:end;gap:4px}.filter-controls label{display:flex;height:24px;align-items:center;gap:5px;padding:0 6px;border:1px solid #303036;border-radius:4px;color:#71717a}.filter-controls select{width:75px;border:0;outline:0;background:#17171a;color:#a1a1aa;font-size:8px}.filter-controls button{display:grid;width:25px;height:25px;place-items:center;border:1px solid transparent;border-radius:4px;background:transparent;color:#777780;cursor:pointer}.filter-controls button.chosen{border-color:#3a3a41;background:#222226;color:#e4e4e7}.card-summary{display:flex;justify-content:space-between;padding:8px 11px 0;color:#71717a;font:8px var(--mono)}.card-summary span{display:flex;align-items:center;gap:5px}.card-summary span:first-child i{width:5px;height:5px;border-radius:50%;background:#38bdf8}.card-summary span:last-child{color:#a3e635}.load-more{display:flex;width:calc(100% - 22px);min-height:28px;align-items:center;justify-content:center;gap:6px;margin:0 11px 9px;border:1px solid #2d2d33;border-radius:4px;background:#17171a;color:#85858f;font-size:8px}
  .search-group{display:flex;min-width:0;gap:4px}.search-group .card-search{flex:1}.search-submit{display:grid;width:28px;height:28px;flex:0 0 auto;place-items:center;border:1px solid #303036;border-radius:4px;background:#19191d;color:#7dd3fc;cursor:pointer}.search-submit:disabled{color:#55555e;cursor:default}.search-spinner{width:11px;height:11px;border:1px solid #575760;border-top-color:#7dd3fc;border-radius:50%;animation:search-spin .7s linear infinite}@keyframes search-spin{to{transform:rotate(360deg)}}.search-status{margin:0;padding:7px 11px;border-bottom:1px solid #25252a;color:#8d8d97;font-size:8px}.search-status.error{color:#fca5a5}
  .search-group{position:relative}.autocomplete-list{position:absolute;z-index:15;top:calc(100% + 4px);right:32px;left:0;display:grid;max-height:240px;overflow-y:auto;padding:4px;border:1px solid #38383f;border-radius:5px;background:#17171b;box-shadow:0 12px 28px #0009}.autocomplete-list button{display:flex;min-height:30px;align-items:center;gap:7px;padding:0 8px;border:0;border-radius:3px;background:transparent;color:#c4c4cb;font-size:9px;text-align:left;cursor:pointer}.autocomplete-list button :global(svg){color:#777780}.autocomplete-list button:hover,.autocomplete-list button.suggestion-active{background:#222a30;color:#e0f2fe}.autocomplete-list button.suggestion-active :global(svg){color:#38bdf8}
  .audit-summary{display:grid;gap:7px;padding:10px 11px;border-bottom:1px solid #25252a}.audit-summary>div{display:flex;align-items:center;justify-content:space-between;color:#888891;font-size:8px}.audit-summary strong{color:#d4d4d8;font:9px var(--mono)}
  .health-score{color:#bef264;font:10px var(--mono)}.health-metrics{display:grid;gap:9px;padding:11px}.health-metrics>div{display:grid;grid-template-columns:1fr auto;gap:5px;color:#888891;font-size:8px}.health-metrics strong{color:#d4d4d8;font:9px var(--mono)}.health-metrics small{color:#666671;font:8px 'Space Grotesk',sans-serif}.health-metrics>div>i{grid-column:1/-1;height:3px;overflow:hidden;border-radius:3px;background:#2b2b30}.health-metrics>div>i>b{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#0e7490,#38bdf8)}.health-foot{display:flex;align-items:center;gap:6px;padding:8px 11px;border-top:1px solid #25252a;color:#71717a;font-size:8px}.health-foot :global(svg){color:#a855f7}.text-action{display:flex;align-items:center;gap:2px;border:0;background:transparent;color:#7dd3fc;font-size:8px;cursor:pointer}.graph-preview{height:188px;overflow:hidden}.graph-preview :global(.graph-shell){min-height:0}.graph-preview :global(.graph-toolbar){height:24px}.graph-preview :global(.flow-stage){height:137px}.graph-preview :global(.graph-legend){min-height:27px;gap:6px;font-size:7px}.graph-preview :global(.chain-count),.graph-preview :global(.svelte-flow__minimap){display:none}.market-value{display:flex;align-items:baseline;gap:8px;padding:11px}.market-value strong{color:#f4f4f5;font:500 18px var(--mono)}.market-value span{color:#a3e635;font:8px var(--mono)}.market-value small{color:#777780;font:8px 'Space Grotesk',sans-serif}.goldfish-teaser{display:flex;width:100%;align-items:center;gap:9px;padding:10px;border:0;background:transparent;text-align:left;cursor:pointer}.goldfish-teaser>i{display:grid;width:30px;height:30px;place-items:center;border:1px solid #38bdf83d;border-radius:5px;background:#0e749021;color:#7dd3fc}.goldfish-teaser>span{display:grid;flex:1;gap:3px}.goldfish-teaser strong{color:#d4d4d8;font-size:9px}.goldfish-teaser small{color:#777780;font-size:8px}.reopen{position:sticky;top:76px;display:grid;width:25px;height:34px;place-items:center;border:1px solid #303036;border-radius:5px;background:#17171a;color:#a1a1aa;cursor:pointer}.page-footer{display:flex;justify-content:space-between;margin-top:17px;padding-top:10px;border-top:1px solid #232328;color:#5e5e68;font:8px var(--mono)}.page-footer span:first-child{display:flex;align-items:center;gap:6px}.page-footer .status-dot{width:5px;height:5px}
  .no-commander-placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#71717a;font-size:9px;gap:5px;background:#13151b}
  .saved-header-tools{display:flex;align-items:center;gap:6px}
  .mini-new-btn{display:inline-flex;align-items:center;gap:3px;padding:2px 6px;border:1px solid #38bdf840;border-radius:3px;background:#0e749020;color:#38bdf8;font-size:8px;font-weight:600;cursor:pointer}
  .mini-new-btn:hover{background:#0e749040}
  .saved-count{color:#7dd3fc;font:8px var(--mono)}.no-saved-decks{margin:0;padding:12px;color:#777780;font-size:8px}.saved-deck-list{display:grid;padding:3px 10px}.saved-deck-row{display:flex;width:100%;background:transparent;border:0;border-bottom:1px solid #25252a;align-items:center;justify-content:space-between;gap:8px;padding:8px 1px;text-align:left;cursor:pointer}.saved-deck-row:hover{background:#18181d}.saved-deck-row.active-saved{border-left:2px solid #38bdf8;padding-left:4px}.saved-deck-row:last-child{border-bottom:0}.saved-deck-row>span{display:grid;min-width:0;gap:3px}.saved-deck-row strong{overflow:hidden;color:#d4d4d8;font-size:9px;text-overflow:ellipsis;white-space:nowrap}.saved-deck-row small{color:#777780;font-size:8px}.saved-deck-row>b{color:#8d8d97;font:8px var(--mono)}
  .single-view{width:min(620px,100%);margin:15px auto 0}.engines-view{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(235px,.8fr);align-items:start;gap:11px;padding-top:13px}.engine-panel{overflow:hidden}.engine-panel .panel-heading{min-height:50px}.engine-panel .panel-heading small{display:block;margin-top:3px;color:#777780;font-size:8px}.live{color:#6fce8d!important;font:7px var(--mono)!important}.note{display:grid;grid-template-columns:19px 1fr;gap:8px;padding:11px;border-bottom:1px solid #25252a}.note>b{color:#38bdf8;font:9px var(--mono)}.note strong{color:#d4d4d8;font-size:9px}.note p{margin:5px 0 0;color:#888891;font-size:8px;line-height:1.5}
  @media(min-width:1150px){.filter-toolbar{grid-template-columns:minmax(90px,.7fr) auto}.role-filters{grid-column:auto}.filter-controls{grid-column:1/-1;margin-top:-3px}}
  @media(max-width:1050px){.workspace{grid-template-columns:minmax(200px,.8fr) minmax(360px,1.4fr)}.right-rail{grid-column:1/-1;grid-template-columns:repeat(2,minmax(0,1fr))}.workspace.left-collapsed{grid-template-columns:26px minmax(0,1fr)}.workspace.right-collapsed{grid-template-columns:minmax(200px,.8fr) minmax(360px,1.4fr) 26px}.workspace.left-collapsed.right-collapsed{grid-template-columns:26px minmax(0,1fr) 26px}.right-rail .synergy-panel{grid-row:span 2}}
  @media(max-width:760px){.workspace-heading{align-items:start;flex-direction:column;gap:11px}.heading-actions{width:100%}.heading-actions button{flex:1}.workspace{display:flex;flex-direction:column;gap:9px}.workspace>.left-rail{order:0;width:100%;grid-template-columns:repeat(2,minmax(0,1fr))}.commander-card{grid-column:1/-1}.center-rail{order:2;width:100%}.right-rail{order:3;width:100%;grid-template-columns:repeat(2,minmax(0,1fr))}.right-rail .synergy-panel{grid-row:auto}.workspace>.reopen{position:static;width:100%;height:26px;order:1}.filter-toolbar{grid-template-columns:1fr}.role-filters,.filter-controls{grid-column:1}.filter-controls{justify-content:space-between}.engines-view{grid-template-columns:1fr}.single-view{margin-top:9px}.page-footer{flex-direction:column;gap:8px}}
  @media(max-width:460px){h1{font-size:21px}.heading-meta{flex-wrap:wrap;row-gap:5px}.heading-meta>span:last-child,.heading-meta>b:last-of-type{display:none}.view-tabs{gap:12px}.view-tabs button{font-size:9px}.identity{gap:2px}.identity i{width:14px;height:14px;font-size:7px}.right-rail{grid-template-columns:1fr}.right-rail .synergy-panel{grid-row:auto}.card-summary{font-size:7px}.library-total{display:none}.commander-art{height:105px}}
  .role-land { color: #86efac; }
  .bar-land { color: #22c55e; }
  .io-modal { position: relative; width: min(540px, 92vw); max-height: 85vh; margin: 0; padding: 0; border: 1px solid #3f3f46; border-radius: 8px; background: #141417; color: inherit; box-shadow: 0 20px 70px rgba(0,0,0,.6); animation: rise-in .2s ease both; }
  .io-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid #27272a; }
  .io-title-wrap { display: flex; flex-direction: column; gap: 2px; }
  .io-title-wrap h2 { margin: 0; color: #f4f4f5; font-size: 15px; font-weight: 600; }
  .close-btn { display: grid; width: 28px; height: 28px; place-items: center; border: 1px solid #333338; border-radius: 4px; background: #1c1c20; color: #a1a1aa; cursor: pointer; }
  .close-btn:hover { color: #f4f4f5; border-color: #52525b; }
  .io-tabs { display: flex; border-bottom: 1px solid #27272a; background: #111114; }
  .io-tabs button { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: #71717a; font-size: 10px; font-weight: 500; cursor: pointer; }
  .io-tabs button.active { color: #38bdf8; border-bottom-color: #38bdf8; background: #16161a; }
  .io-body { padding: 16px 18px 20px; display: flex; flex-direction: column; gap: 10px; }
  .io-desc { margin: 0; color: #888891; font-size: 9px; line-height: 1.4; }
  .io-desc code { padding: 2px 4px; border: 1px solid #2d2d32; border-radius: 3px; background: #1c1c20; color: #7dd3fc; font-family: var(--mono); }
  .io-textarea { width: 100%; height: 210px; padding: 10px 12px; border: 1px solid #2e2e34; border-radius: 5px; background: #0c0c0e; color: #e4e4e7; font-family: var(--mono); font-size: 9px; line-height: 1.5; resize: vertical; outline: none; }
  .io-textarea:focus { border-color: #38bdf888; }
  .io-options { display: flex; align-items: center; gap: 8px; }
  .io-check { display: inline-flex; align-items: center; gap: 7px; color: #a1a1aa; font-size: 9px; cursor: pointer; }
  .io-actions { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
  .change-commander-badge-btn { position: absolute; top: 9px; right: 9px; display: inline-flex; align-items: center; gap: 4px; padding: 4px 7px; border: 1px solid #38bdf855; border-radius: 3px; background: #09090bcc; color: #7dd3fc; font: 8px var(--mono); letter-spacing: .04em; cursor: pointer; transition: all .15s ease; }
  .change-commander-badge-btn:hover { background: #0e7490; color: #f0f9ff; border-color: #38bdf8; }
  .change-commander-link { margin-left: auto; padding: 0; border: 0; background: transparent; color: #7dd3fc; font: 8px var(--mono); cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }
  .change-commander-link:hover { color: #bae6fd; }
  .commander-search-container { position: relative; padding: 8px 10px; background: #141418; border-bottom: 1px solid #27272a; }
  .commander-search-input-wrap { display: flex; align-items: center; gap: 6px; padding: 4px 8px; border: 1px solid #38bdf866; border-radius: 4px; background: #0c0c0e; color: #a1a1aa; }
  .commander-search-input-wrap input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: #f4f4f5; font-size: 9px; font-family: inherit; }
  .commander-search-input-wrap input::placeholder { color: #71717a; }
  .commander-suggestions-list { position: absolute; top: calc(100% + 2px); left: 10px; right: 10px; z-index: 25; display: grid; max-height: 190px; overflow-y: auto; padding: 4px; border: 1px solid #3f3f46; border-radius: 5px; background: #16161a; box-shadow: 0 10px 24px rgba(0,0,0,.7); }
  .commander-suggestions-list button { display: flex; min-height: 26px; align-items: center; gap: 6px; padding: 0 8px; border: 0; border-radius: 3px; background: transparent; color: #d4d4d8; font-size: 9px; text-align: left; cursor: pointer; }
  .commander-suggestions-list button:hover, .commander-suggestions-list button.active-suggestion { background: #0e749040; color: #7dd3fc; }
  .commander-search-error { margin: 5px 0 0; color: #f87171; font-size: 8px; }
  .commander-title-row { display: flex; align-items: center; justify-content: space-between; }
</style>
