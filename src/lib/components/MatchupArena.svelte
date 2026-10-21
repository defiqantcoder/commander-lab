<script lang="ts">
  import {
    Activity,
    AlertTriangle,
    BrainCircuit,
    Check,
    ChevronDown,
    Clock,
    Crosshair,
    Flame,
    Info,
    Loader2,
    Plus,
    RefreshCw,
    RotateCcw,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Swords,
    Target,
    Trash2,
    TrendingUp,
    X,
    Zap
  } from 'lucide-svelte';
  import {
    EDHREC_BENCHMARK_DECKS,
    MatchupSimulator,
    createCustomOpponentDeck,
    type BenchmarkDeck,
    type MatchupReport
  } from '$lib/engine/matchup';
  import {
    analyzeMatchupWithAI,
    type AIMatchupCoachingResult
  } from '$lib/ai/gemini';
  import { autocompleteCardName } from '$lib/api/scryfall';
  import type { SimCard } from '$lib/engine/goldfish';
  import type { DeckCard, SavedDeck } from './types';

  let {
    cards,
    commander,
    savedDecks,
    deckName,
    onApplyAddition,
    onApplyCut
  }: {
    cards: DeckCard[];
    commander: DeckCard;
    savedDecks: SavedDeck[];
    deckName: string;
    onApplyAddition?: (cardName: string, role?: string) => Promise<void>;
    onApplyCut?: (cardName: string) => void;
  } = $props();

  let selectedOpponentId = $state(EDHREC_BENCHMARK_DECKS[0]?.id ?? '');
  let customOpponents = $state<BenchmarkDeck[]>([]);
  let report = $state<MatchupReport | null>(null);
  let isRunning = $state(false);
  let errorMessage = $state('');
  let pendingAction = $state<string | null>(null);

  // Custom Opponent Search State
  let isAddingCustomOpponent = $state(false);
  let customCommanderQuery = $state('');
  let customCommanderSuggestions = $state<string[]>([]);
  let isSearchingCommander = $state(false);
  let customCommanderArchetype = $state<'Aggro' | 'Control' | 'Midrange' | 'Combo'>('Midrange');
  let searchReqId = 0;

  // AI Strategic Matchup Coaching State
  let isAnalyzingAI = $state(false);
  let aiCoaching = $state<AIMatchupCoachingResult | null>(null);
  let aiCoachingError = $state<string | null>(null);
  let activeReportTab = $state<'ai-coaching' | 'heuristics' | 'turn-log'>('ai-coaching');

  $effect(() => {
    const q = customCommanderQuery.trim();
    if (q.length < 2) {
      customCommanderSuggestions = [];
      return;
    }
    const req = ++searchReqId;
    const timer = setTimeout(async () => {
      try {
        isSearchingCommander = true;
        const results = await autocompleteCardName(q);
        if (req === searchReqId) {
          customCommanderSuggestions = results;
        }
      } catch {
        if (req === searchReqId) customCommanderSuggestions = [];
      } finally {
        if (req === searchReqId) isSearchingCommander = false;
      }
    }, 180);
    return () => clearTimeout(timer);
  });

  function selectCustomCommander(name: string): void {
    const opp = createCustomOpponentDeck(name, customCommanderArchetype);
    customOpponents = [...customOpponents, opp];
    selectedOpponentId = opp.id;
    isAddingCustomOpponent = false;
    customCommanderQuery = '';
    customCommanderSuggestions = [];
    resetReport();
  }

  function isCardInDeck(name: string): boolean {
    return cards.some((c) => c.name.toLowerCase() === name.toLowerCase()) || commander.name.toLowerCase() === name.toLowerCase();
  }

  async function handleAddition(cardName: string, role?: string): Promise<void> {
    if (!onApplyAddition || isCardInDeck(cardName)) return;
    pendingAction = `add:${cardName}`;
    try {
      await onApplyAddition(cardName, role);
    } finally {
      pendingAction = null;
    }
  }

  function handleCut(cardName: string): void {
    if (!onApplyCut || !isCardInDeck(cardName)) return;
    onApplyCut(cardName);
  }

  let opponentOptions = $derived([
    ...EDHREC_BENCHMARK_DECKS.map((benchmark) => ({ id: benchmark.id, name: benchmark.name, description: benchmark.description, cards: benchmark.cards, isCustom: false })),
    ...customOpponents.map((custom) => ({ id: custom.id, name: custom.name, description: custom.description, cards: custom.cards, isCustom: true })),
    ...savedDecks.filter((savedDeck) => savedDeck.name.toLowerCase() !== deckName.toLowerCase()).map((savedDeck) => ({
      id: `saved:${savedDeck.id}`,
      name: savedDeck.name,
      description: `Saved deck · ${savedDeck.archetype}`,
      isCustom: false,
      cards: savedDeck.cards.map((card) => ({
        id: card.id,
        name: card.name,
        typeLine: card.typeLine ?? 'Unknown',
        cmc: card.cmc ?? 0,
        manaCost: card.manaCost,
        category: card.category,
        isCommander: card.category === 'commander'
      }))
    }))
  ]);
  let selectedOpponent = $derived(opponentOptions.find((option) => option.id === selectedOpponentId) ?? opponentOptions[0]);
  let winRate = $derived(report ? Math.round((report.playerWins / report.gamesSimulated) * 100) : 0);

  function toSimCard(card: DeckCard, isCommander = false): SimCard {
    return {
      id: card.id,
      name: card.name,
      typeLine: card.typeLine,
      cmc: card.cmc,
      manaCost: card.manaCost,
      oracleText: card.oracleText,
      category: isCommander ? 'commander' : card.role,
      isCommander,
      colorIdentity: card.colorIdentity
    };
  }

  async function runSparring(): Promise<void> {
    if (!selectedOpponent) return;
    isRunning = true;
    errorMessage = '';
    try {
      const playerCards = [toSimCard(commander, true), ...cards.map((card) => toSimCard(card))];
      const simulator = new MatchupSimulator(playerCards, selectedOpponent.cards, deckName, selectedOpponent.name);
      report = simulator.runMatchupSeries(5);
      
      // Auto-trigger AI coaching alongside the match report
      await runAICoaching(report);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unable to run this matchup.';
      report = null;
    } finally {
      isRunning = false;
    }
  }

  async function runAICoaching(currentReport?: MatchupReport | null): Promise<void> {
    if (!selectedOpponent) return;
    const rep = currentReport ?? report;
    isAnalyzingAI = true;
    aiCoachingError = null;
    try {
      const playerCards = [toSimCard(commander, true), ...cards.map((c) => toSimCard(c))];
      const stats = rep ? { playerWins: rep.playerWins, opponentWins: rep.opponentWins, gamesSimulated: rep.gamesSimulated } : undefined;
      const result = await analyzeMatchupWithAI(
        deckName,
        playerCards,
        selectedOpponent.name,
        selectedOpponent.cards,
        stats
      );
      aiCoaching = result;
    } catch (err) {
      aiCoachingError = err instanceof Error ? err.message : 'AI Matchup Coaching failed.';
    } finally {
      isAnalyzingAI = false;
    }
  }

  function resetReport(): void {
    report = null;
    aiCoaching = null;
    errorMessage = '';
    aiCoachingError = null;
  }
</script>

{#if cards.length === 0}
  <div class="empty-arena panel">
    <Target size={32} class="empty-icon text-sky" />
    <h3>Matchup Sparring Arena</h3>
    <p>Your deck is currently empty. Add cards or import your decklist in the Studio to benchmark, spar, and receive AI coaching against any commander.</p>
  </div>
{:else}
<section class="arena panel enter">
  <header class="arena-heading">
    <div>
      <span class="eyebrow"><Swords size={11} /> MATCHUP ARENA & SPARRING BENCH</span>
      <h2>Sparring & Strategic Coaching</h2>
      <p>Benchmark your current list against EDHREC archetypes, your saved decks, or any custom commander.</p>
    </div>
    <div class="arena-head-actions">
      {#if report}
        <button class="ai-coaching-head-btn" onclick={() => runAICoaching()} disabled={isAnalyzingAI}>
          <BrainCircuit size={13} />
          {isAnalyzingAI ? 'Thinking...' : 'AI Deep Dive'}
        </button>
      {/if}
      <span class="arena-mark"><Swords size={17} /></span>
    </div>
  </header>

  <div class="opponent-picker">
    <div class="picker-top-row">
      <div class="select-field">
        <label for="opponent-select">Opponent Deck</label>
        <div class="select-wrap">
          <select id="opponent-select" bind:value={selectedOpponentId} onchange={resetReport}>
            <optgroup label="EDHREC Benchmarks">
              {#each EDHREC_BENCHMARK_DECKS as benchmark (benchmark.id)}
                <option value={benchmark.id}>{benchmark.name}</option>
              {/each}
            </optgroup>
            {#if customOpponents.length > 0}
              <optgroup label="Custom Sparring Opponents">
                {#each customOpponents as custom (custom.id)}
                  <option value={custom.id}>{custom.name}</option>
                {/each}
              </optgroup>
            {/if}
            {#if savedDecks.length > 1}
              <optgroup label="Your Saved Decks">
                {#each savedDecks.filter((savedDeck) => savedDeck.name.toLowerCase() !== deckName.toLowerCase()) as savedDeck (savedDeck.id)}
                  <option value={`saved:${savedDeck.id}`}>{savedDeck.name}</option>
                {/each}
              </optgroup>
            {/if}
          </select>
          <ChevronDown size={13} />
        </div>
      </div>

      <div class="arena-actions">
        <button
          class="custom-opp-btn"
          class:active={isAddingCustomOpponent}
          onclick={() => isAddingCustomOpponent = !isAddingCustomOpponent}
          title="Search and spar against any commander"
        >
          <Plus size={13} />
          <span>Custom Opponent</span>
        </button>

        <button class="run-match" onclick={runSparring} disabled={isRunning || !selectedOpponent}>
          {#if isRunning}
            <Loader2 size={13} class="spinner" />
            <span>Simulating...</span>
          {:else}
            <Activity size={13} />
            <span>Spar 5 Games</span>
          {/if}
        </button>

        {#if report}
          <button class="reset-report" onclick={resetReport} aria-label="Clear matchup report" title="Clear report">
            <RotateCcw size={14} />
          </button>
        {/if}
      </div>
    </div>

    <!-- Custom Opponent Search Drawer -->
    {#if isAddingCustomOpponent}
      <div class="custom-opp-drawer enter">
        <div class="drawer-header">
          <div class="drawer-title">
            <Search size={14} class="text-sky" />
            <strong>Spar Against Any Commander</strong>
          </div>
          <button class="close-drawer-btn" onclick={() => isAddingCustomOpponent = false}>
            <X size={14} />
          </button>
        </div>

        <div class="drawer-body">
          <div class="search-input-wrap">
            <input
              type="text"
              bind:value={customCommanderQuery}
              placeholder="Search any commander name (e.g. Edgar Markov, Toxrill, Yuriko)..."
              aria-label="Search commander opponent"
            />
            {#if isSearchingCommander}
              <Loader2 size={13} class="spinner search-spin" />
            {/if}
          </div>

          <div class="archetype-choice-wrap">
            <label for="opp-arch-select">Opponent Playstyle:</label>
            <select id="opp-arch-select" bind:value={customCommanderArchetype}>
              <option value="Aggro">Aggro (Fast clock, low curve)</option>
              <option value="Control">Control (Removal, counterspells)</option>
              <option value="Midrange">Midrange (Value engine, recursion)</option>
              <option value="Combo">Combo (Tutors, explosive payoffs)</option>
            </select>
          </div>

          {#if customCommanderSuggestions.length > 0}
            <div class="commander-dropdown" role="listbox">
              {#each customCommanderSuggestions as name}
                <button
                  type="button"
                  class="suggestion-row"
                  onclick={() => selectCustomCommander(name)}
                >
                  <Sparkles size={11} class="text-sky" />
                  <span>{name}</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/if}

    {#if selectedOpponent}
      <p class="opp-desc">{selectedOpponent.description}</p>
    {/if}

    {#if errorMessage}
      <p class="error-message">{errorMessage}</p>
    {/if}
  </div>

  {#if report}
    <div class="report">
      <!-- High-Level Score Banner -->
      <div class="score-row">
        <div class="score">
          <strong>{report.playerWins}</strong>
          <span>WINS</span>
        </div>
        <div class="rate-meter" aria-label={`${winRate}% win rate`}>
          <div><i style={`width:${winRate}%`}></i></div>
          <strong>{winRate}% Win Rate</strong>
          <small>{report.gamesSimulated} simulated matches</small>
        </div>
        <div class="score opponent-score">
          <strong>{report.opponentWins}</strong>
          <span>LOSSES</span>
        </div>
      </div>

      <div class="report-metrics">
        <div>
          <span>Avg. Game Length</span>
          <strong>{report.averageWinningTurn} turns</strong>
        </div>
        <div>
          <span>Opponent Bench</span>
          <strong>{report.opponentDeckName}</strong>
        </div>
      </div>

      <!-- Report Section Tabs -->
      <div class="report-tabs">
        <button
          class:active={activeReportTab === 'ai-coaching'}
          onclick={() => activeReportTab = 'ai-coaching'}
        >
          <BrainCircuit size={13} class="text-sky" />
          <span>AI Matchup Coaching</span>
          {#if aiCoaching}
            <span class="active-dot"></span>
          {/if}
        </button>

        <button
          class:active={activeReportTab === 'heuristics'}
          onclick={() => activeReportTab = 'heuristics'}
        >
          <Target size={13} />
          <span>Matchup Weaknesses ({report.identifiedWeaknesses.length})</span>
        </button>

        <button
          class:active={activeReportTab === 'turn-log'}
          onclick={() => activeReportTab = 'turn-log'}
        >
          <Clock size={13} />
          <span>Turn-by-Turn Logs</span>
        </button>
      </div>

      <!-- Tab 1: AI Matchup Coaching -->
      {#if activeReportTab === 'ai-coaching'}
        <div class="tab-pane enter">
          {#if isAnalyzingAI}
            <div class="ai-loading-box">
              <Loader2 size={28} class="spinner text-sky" />
              <h4>Gemini AI is analyzing this matchup...</h4>
              <p>Simulating stack interactions, calculating the decisive pivot turn, and identifying critical threat removal targets...</p>
            </div>
          {:else if aiCoachingError}
            <div class="error-banner">
              <span>{aiCoachingError}</span>
            </div>
          {:else if aiCoaching}
            <div class="ai-coaching-layout">
              <!-- Pivot Turn Inflection Card -->
              <div class="pivot-turn-card">
                <div class="pivot-badge-row">
                  <span class="pivot-badge">
                    <Zap size={13} /> CRITICAL PIVOT TURN: TURN {aiCoaching.pivotTurn}
                  </span>
                </div>
                <p class="pivot-analysis">{aiCoaching.pivotTurnAnalysis}</p>
              </div>

              <!-- Priority Removal Targets -->
              {#if aiCoaching.priorityRemovalTargets?.length > 0}
                <div class="coaching-section">
                  <div class="sec-head">
                    <Crosshair size={14} class="text-red" />
                    <h4>Opponent Priority Removal Targets</h4>
                    <small>High-threat cards that must be neutralized immediately</small>
                  </div>
                  <div class="targets-grid">
                    {#each aiCoaching.priorityRemovalTargets as target}
                      <div class="target-card">
                        <div class="target-header">
                          <strong class="target-name">{target.cardName}</strong>
                          <span class="target-timing-tag"><Clock size={10} /> {target.optimalTiming}</span>
                        </div>
                        <p class="target-reason">{target.reason}</p>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}

              <!-- Strengths & Vulnerabilities -->
              <div class="pros-cons-grid">
                <div class="pros-card">
                  <h4><ShieldCheck size={13} /> Your Matchup Strengths</h4>
                  <ul>
                    {#each aiCoaching.matchupStrengths as strength}
                      <li>{strength}</li>
                    {/each}
                  </ul>
                </div>
                <div class="cons-card">
                  <h4><ShieldAlert size={13} /> Opponent Pressure & Traps</h4>
                  <ul>
                    {#each aiCoaching.matchupVulnerabilities as vuln}
                      <li>{vuln}</li>
                    {/each}
                  </ul>
                </div>
              </div>

              <!-- Matchup Sideboard Swaps -->
              <div class="sideboard-section">
                <div class="sec-head">
                  <TrendingUp size={14} class="text-emerald" />
                  <h4>Tailored Matchup Swaps</h4>
                  <small>Optimize your 99 specifically against {selectedOpponent.name}</small>
                </div>

                <div class="swaps-grid">
                  <div class="swap-col">
                    <span class="col-tag tag-add"><Plus size={11} /> High-Impact Additions</span>
                    {#each aiCoaching.sideboardSwaps.suggestedAdditions as addition}
                      <div class="rec-item">
                        <div class="rec-header">
                          <strong>{addition.cardName}</strong>
                          <span>{addition.role}</span>
                        </div>
                        <p>{addition.reason}</p>
                        {#if onApplyAddition}
                          <div class="rec-actions">
                            {#if isCardInDeck(addition.cardName)}
                              <span class="status-badge in-deck"><Check size={11} /> In deck</span>
                            {:else}
                              <button
                                class="swap-action add-action"
                                disabled={pendingAction === `add:${addition.cardName}`}
                                onclick={() => handleAddition(addition.cardName, addition.role)}
                              >
                                <Plus size={11} /> {pendingAction === `add:${addition.cardName}` ? 'Adding...' : 'Add to deck'}
                              </button>
                            {/if}
                          </div>
                        {/if}
                      </div>
                    {/each}
                  </div>

                  <div class="swap-col">
                    <span class="col-tag tag-cut"><Trash2 size={11} /> Recommended Cuts</span>
                    {#each aiCoaching.sideboardSwaps.suggestedCuts as cut}
                      <div class="rec-item">
                        <div class="rec-header">
                          <strong>{cut.cardName}</strong>
                        </div>
                        <p>{cut.reason}</p>
                        {#if onApplyCut}
                          <div class="rec-actions">
                            {#if !isCardInDeck(cut.cardName)}
                              <span class="status-badge cut-done"><Check size={11} /> Removed</span>
                            {:else}
                              <button class="swap-action cut-action" onclick={() => handleCut(cut.cardName)}>
                                <Trash2 size={11} /> Cut from deck
                              </button>
                            {/if}
                          </div>
                        {/if}
                      </div>
                    {/each}
                  </div>
                </div>
              </div>

              <!-- Tactical Game Plan -->
              <div class="tactical-directive-card">
                <strong><Sparkles size={13} /> Tactical Matchup Directive</strong>
                <p>{aiCoaching.tacticalGamePlan}</p>
              </div>
            </div>
          {/if}
        </div>

      <!-- Tab 2: Heuristic Weaknesses & Base Suggestions -->
      {:else if activeReportTab === 'heuristics'}
        <div class="tab-pane enter">
          <div class="report-section">
            <h3><Target size={13} /> Structural Weaknesses Identified</h3>
            <ul>
              {#each report.identifiedWeaknesses as weakness}
                <li>{weakness}</li>
              {/each}
            </ul>
          </div>

          <div class="recommendations">
            <section>
              <h3><TrendingUp size={13} /> Suggested Additions</h3>
              {#each report.recommendedImprovements.suggestedAdditions as addition}
                <div class="rec-item">
                  <div class="rec-header">
                    <strong>{addition.cardName}</strong>
                    <span>{addition.role}</span>
                  </div>
                  <p>{addition.reason}</p>
                  {#if onApplyAddition}
                    <div class="rec-actions">
                      {#if isCardInDeck(addition.cardName)}
                        <span class="status-badge in-deck"><Check size={11} /> In deck</span>
                      {:else}
                        <button
                          class="swap-action add-action"
                          disabled={pendingAction === `add:${addition.cardName}`}
                          onclick={() => handleAddition(addition.cardName, addition.role)}
                        >
                          <Plus size={11} /> {pendingAction === `add:${addition.cardName}` ? 'Adding...' : 'Add to deck'}
                        </button>
                      {/if}
                    </div>
                  {/if}
                </div>
              {/each}
            </section>

            <section>
              <h3><ChevronDown size={13} /> Suggested Cuts</h3>
              {#each report.recommendedImprovements.suggestedCuts as cut}
                <div class="rec-item">
                  <div class="rec-header">
                    <strong>{cut.cardName}</strong>
                  </div>
                  <p>{cut.reason}</p>
                  {#if onApplyCut}
                    <div class="rec-actions">
                      {#if !isCardInDeck(cut.cardName)}
                        <span class="status-badge cut-done"><Check size={11} /> Removed</span>
                      {:else}
                        <button class="swap-action cut-action" onclick={() => handleCut(cut.cardName)}>
                          <Trash2 size={11} /> Cut from deck
                        </button>
                      {/if}
                    </div>
                  {/if}
                </div>
              {/each}
            </section>
          </div>

          <p class="coaching">{report.recommendedImprovements.coachingAdvice}</p>
        </div>

      <!-- Tab 3: Turn-by-Turn Logs -->
      {:else if activeReportTab === 'turn-log'}
        <div class="tab-pane enter">
          <div class="turn-log">
            <h3>Sample Match Turn Log (Game 1)</h3>
            {#each report.turnLogs as turn, index (`${turn.turn}-${turn.activePlayer}-${index}`)}
              <div class="log-row">
                <span>T{turn.turn} · {turn.activePlayer === 'player' ? 'You' : 'Opponent'}</span>
                <span>{turn.manaAvailable} mana</span>
                <p>{turn.actions.length ? turn.actions.join(' · ') : 'No spells cast'}</p>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <div class="arena-empty">
      <span><Swords size={20} /></span>
      <strong>Ready to Spar</strong>
      <small>Select an opponent above or add a custom commander, then click "Spar 5 Games".</small>
    </div>
  {/if}
</section>
{/if}

<style>
  .empty-arena { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; text-align: center; gap: 10px; border: 1px dashed #2b2b30; border-radius: 8px; background: rgba(20, 20, 23, 0.4); margin: 20px auto; max-width: 540px; }
  .empty-arena :global(.empty-icon) { color: #38bdf8; }
  .empty-arena h3 { margin: 0; color: #f4f4f5; font-size: 16px; font-weight: 600; }
  .empty-arena p { margin: 0; color: #94a3b8; font-size: 11px; line-height: 1.5; max-width: 400px; }

  .arena { width: min(940px, 100%); margin: 16px auto 0; overflow: hidden; }
  .arena-heading { display: flex; align-items: center; justify-content: space-between; padding: 17px 18px; border-bottom: 1px solid #25252a; }
  .eyebrow { display: inline-flex; align-items: center; gap: 4px; color: #7dd3fc; font: 8px var(--mono); letter-spacing: .1em; text-transform: uppercase; }
  h2 { margin: 4px 0 0; color: #f4f4f5; font-size: 17px; font-weight: 600; }
  .arena-heading p, .opp-desc { margin: 5px 0 0; color: #888891; font-size: 9px; }
  .arena-head-actions { display: flex; align-items: center; gap: 8px; }
  .ai-coaching-head-btn { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border: 1px solid #38bdf855; border-radius: 5px; background: #0e749020; color: #38bdf8; font-size: 10px; font-weight: 600; cursor: pointer; transition: all .15s ease; }
  .ai-coaching-head-btn:hover:not(:disabled) { background: #0e749040; border-color: #38bdf8; }
  .arena-mark { display: grid; width: 34px; height: 34px; place-items: center; border: 1px solid #38bdf83d; border-radius: 6px; background: #0e749020; color: #7dd3fc; }

  .opponent-picker { padding: 14px 18px; border-bottom: 1px solid #25252a; display: flex; flex-direction: column; gap: 10px; }
  .picker-top-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .select-field { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 260px; }
  .select-field label { color: #a1a1aa; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
  .select-wrap { position: relative; }
  select { width: 100%; height: 32px; appearance: none; padding: 0 28px 0 9px; border: 1px solid #34343a; border-radius: 4px; background: #141417; color: #d4d4d8; font-size: 9px; }
  .select-wrap :global(svg) { position: absolute; top: 10px; right: 9px; pointer-events: none; color: #777780; }

  .arena-actions { display: flex; align-items: center; gap: 6px; }
  .custom-opp-btn { display: inline-flex; min-height: 32px; align-items: center; gap: 5px; padding: 0 10px; border: 1px solid #3f3f46; border-radius: 4px; background: #18181b; color: #d4d4d8; font-size: 9px; cursor: pointer; transition: all .15s ease; }
  .custom-opp-btn:hover, .custom-opp-btn.active { border-color: #38bdf8; color: #38bdf8; background: #0e749015; }
  .run-match { display: inline-flex; min-height: 32px; align-items: center; gap: 6px; padding: 0 12px; border: 1px solid #38bdf855; border-radius: 4px; background: #0e749033; color: #bae6fd; font-size: 9px; font-weight: 600; cursor: pointer; transition: all .15s ease; }
  .run-match:hover:not(:disabled) { background: #0e749060; border-color: #38bdf8; }
  .run-match:disabled { opacity: .55; cursor: wait; }
  .reset-report { display: grid; width: 32px; height: 32px; place-items: center; border: 1px solid #34343a; border-radius: 4px; background: #17171a; color: #a1a1aa; cursor: pointer; }
  .reset-report:hover { color: #f4f4f5; border-color: #52525b; }

  .custom-opp-drawer { background: #16161b; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 6px; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
  .drawer-header { display: flex; align-items: center; justify-content: space-between; }
  .drawer-title { display: flex; align-items: center; gap: 6px; color: #f8fafc; font-size: 11px; }
  .close-drawer-btn { background: transparent; border: none; color: #71717a; cursor: pointer; padding: 2px; }
  .close-drawer-btn:hover { color: #f4f4f5; }
  .drawer-body { display: flex; flex-direction: column; gap: 8px; position: relative; }
  .search-input-wrap { position: relative; }
  .search-input-wrap input { width: 100%; height: 32px; padding: 0 28px 0 10px; border: 1px solid #34343a; border-radius: 4px; background: #0f172a; color: #f8fafc; font-size: 9px; outline: none; }
  .search-input-wrap input:focus { border-color: #38bdf8; }
  :global(.search-spin) { position: absolute; right: 9px; top: 9px; color: #38bdf8; }
  .archetype-choice-wrap { display: flex; align-items: center; gap: 8px; font-size: 9px; color: #94a3b8; }
  .archetype-choice-wrap select { height: 26px; font-size: 8px; width: 220px; }
  .commander-dropdown { position: absolute; top: 36px; left: 0; right: 0; z-index: 30; background: #0f172a; border: 1px solid #38bdf855; border-radius: 5px; max-height: 180px; overflow-y: auto; padding: 4px; box-shadow: 0 10px 25px rgba(0,0,0,0.7); }
  .suggestion-row { display: flex; width: 100%; align-items: center; gap: 6px; padding: 6px 8px; border: none; background: transparent; color: #cbd5e1; font-size: 9px; cursor: pointer; border-radius: 3px; text-align: left; }
  .suggestion-row:hover { background: #0e749030; color: #38bdf8; }

  .error-message { margin: 0; color: #fca5a5; font-size: 9px; }

  .report { padding: 14px 18px 18px; }
  .score-row { display: grid; grid-template-columns: 60px 1fr 60px; align-items: center; gap: 14px; padding: 8px 0 14px; }
  .score { display: grid; justify-items: center; gap: 2px; color: #86efac; }
  .score strong { font: 500 23px var(--mono); }
  .score span { font: 7px var(--mono); letter-spacing: .06em; }
  .opponent-score { color: #fca5a5; }
  .rate-meter { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 5px 9px; }
  .rate-meter>div { height: 6px; overflow: hidden; border-radius: 5px; background: #422b2b; }
  .rate-meter i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #22c55e, #7dd3fc); }
  .rate-meter strong { color: #d4d4d8; font: 10px var(--mono); }
  .rate-meter small { grid-column: 1/-1; color: #71717a; font-size: 8px; }
  .report-metrics { display: grid; grid-template-columns: 1fr 2fr; gap: 10px; padding: 10px 0; border-block: 1px solid #25252a; }
  .report-metrics div { display: grid; gap: 4px; }
  .report-metrics span { color: #777780; font-size: 8px; }
  .report-metrics strong { overflow: hidden; color: #d4d4d8; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }

  /* Report Tabs */
  .report-tabs { display: flex; gap: 4px; border-bottom: 1px solid #25252a; margin-top: 14px; }
  .report-tabs button { display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: #71717a; font-size: 9px; font-weight: 600; cursor: pointer; transition: all .15s ease; }
  .report-tabs button.active { color: #38bdf8; border-bottom-color: #38bdf8; }
  .active-dot { width: 5px; height: 5px; border-radius: 50%; background: #22c55e; }

  .tab-pane { padding-top: 14px; }

  /* AI Coaching Elements */
  .ai-loading-box { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2.5rem 1rem; text-align: center; gap: 0.5rem; }
  .ai-loading-box h4 { margin: 0; color: #f8fafc; font-size: 11px; }
  .ai-loading-box p { margin: 0; color: #94a3b8; font-size: 8px; max-width: 400px; }

  .ai-coaching-layout { display: flex; flex-direction: column; gap: 14px; }
  .pivot-turn-card { background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 6px; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; }
  .pivot-badge { display: inline-flex; align-items: center; gap: 4px; color: #fbbf24; font: 8px var(--mono); font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
  .pivot-analysis { margin: 0; color: #fef08a; font-size: 9px; line-height: 1.45; }

  .coaching-section { display: flex; flex-direction: column; gap: 8px; }
  .sec-head { display: flex; align-items: center; gap: 6px; }
  .sec-head h4 { margin: 0; color: #f4f4f5; font-size: 10px; }
  .sec-head small { color: #64748b; font-size: 8px; }

  .targets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 8px; }
  .target-card { background: #141418; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; padding: 8px 10px; display: flex; flex-direction: column; gap: 3px; }
  .target-header { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
  .target-name { color: #f87171; font-size: 9px; }
  .target-timing-tag { font: 7px var(--mono); color: #fbbf24; background: rgba(245, 158, 11, 0.12); padding: 1px 4px; border-radius: 3px; }
  .target-reason { margin: 0; color: #94a3b8; font-size: 8px; line-height: 1.35; }

  .pros-cons-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .pros-card, .cons-card { padding: 10px 12px; border-radius: 6px; }
  .pros-card { background: rgba(34, 197, 94, 0.06); border: 1px solid rgba(34, 197, 94, 0.25); }
  .cons-card { background: rgba(239, 68, 68, 0.06); border: 1px solid rgba(239, 68, 68, 0.25); }
  .pros-card h4 { display: flex; align-items: center; gap: 5px; margin: 0 0 6px; color: #86efac; font-size: 9px; font-weight: 600; }
  .cons-card h4 { display: flex; align-items: center; gap: 5px; margin: 0 0 6px; color: #fca5a5; font-size: 9px; font-weight: 600; }

  .sideboard-section { display: flex; flex-direction: column; gap: 8px; }
  .swaps-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .swap-col { display: flex; flex-direction: column; gap: 8px; }
  .col-tag { display: inline-flex; align-items: center; gap: 4px; font: 8px var(--mono); font-weight: 700; text-transform: uppercase; }
  .tag-add { color: #86efac; }
  .tag-cut { color: #fca5a5; }

  .tactical-directive-card { background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 6px; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; }
  .tactical-directive-card strong { display: flex; align-items: center; gap: 5px; color: #38bdf8; font-size: 9px; }
  .tactical-directive-card p { margin: 0; color: #bae6fd; font-size: 8px; line-height: 1.45; }

  /* Heuristics elements */
  .report-section h3, .recommendations h3, .turn-log h3 { display: flex; align-items: center; gap: 6px; margin: 0 0 8px; color: #c4c4cb; font-size: 9px; font-weight: 600; }
  .report-section h3 :global(svg), .recommendations h3 :global(svg) { color: #7dd3fc; }
  ul { display: grid; gap: 5px; margin: 0; padding-left: 15px; color: #a1a1aa; font-size: 8px; line-height: 1.45; }
  .recommendations { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 14px; }
  .recommendations section { min-width: 0; }
  .rec-item { display: flex; flex-direction: column; gap: 5px; padding: 8px 0; border-top: 1px solid #25252a; }
  .rec-header { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
  .rec-header strong { overflow: hidden; color: #d4d4d8; font-size: 9px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
  .rec-header>span { color: #7dd3fc; font: 7px var(--mono); text-transform: uppercase; }
  .rec-item p { margin: 0; color: #8d8d97; font-size: 8px; line-height: 1.35; }
  .rec-actions { display: flex; align-items: center; gap: 6px; margin-top: 2px; }
  .swap-action { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 4px; font-size: 8px; font-weight: 500; cursor: pointer; transition: all .15s ease; }
  .add-action { border: 1px solid #22c55e55; background: #14532d30; color: #86efac; }
  .add-action:hover:not(:disabled) { background: #14532d60; border-color: #22c55e99; }
  .add-action:disabled { opacity: .6; cursor: wait; }
  .cut-action { border: 1px solid #ef444455; background: #7f1d1d30; color: #fca5a5; }
  .cut-action:hover { background: #7f1d1d60; border-color: #ef444499; }
  .status-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 7px; font-family: var(--mono); }
  .status-badge.in-deck { border: 1px solid #22c55e33; background: #14532d20; color: #86efac; }
  .status-badge.cut-done { border: 1px solid #71717a44; background: #27272a30; color: #a1a1aa; }
  .coaching { margin: 13px 0; padding: 9px 10px; border: 1px solid #34343a; border-radius: 4px; background: #17171a; color: #a1a1aa; font-size: 9px; line-height: 1.5; }

  /* Turn Log elements */
  .turn-log { padding-top: 8px; }
  .turn-log h3 { color: #a1a1aa; font-size: 10px; }
  .log-row { display: grid; grid-template-columns: 1fr auto; gap: 3px 8px; padding: 6px 0; border-top: 1px solid #202024; }
  .log-row span { color: #8d8d97; font: 8px var(--mono); text-transform: capitalize; }
  .log-row span:nth-child(2) { color: #7dd3fc; }
  .log-row p { grid-column: 1/-1; margin: 0; color: #777780; font-size: 8px; line-height: 1.4; }

  .arena-empty { display: grid; min-height: 240px; align-content: center; justify-items: center; gap: 8px; color: #777780; text-align: center; }
  .arena-empty>span { display: grid; width: 40px; height: 40px; place-items: center; border: 1px solid #34343a; border-radius: 8px; background: #19191d; color: #7dd3fc; }
  .arena-empty strong { color: #c4c4cb; font-size: 11px; }
  .arena-empty small { font-size: 9px; }

  .error-banner { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.35); color: #fca5a5; padding: 0.6rem 0.85rem; border-radius: 6px; font-size: 8px; }

  :global(.spinner) { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  :global(.text-sky) { color: #38bdf8; }
  :global(.text-red) { color: #f87171; }
  :global(.text-emerald) { color: #34d399; }

  @media(max-width: 760px) {
    .pros-cons-grid, .swaps-grid, .recommendations { grid-template-columns: 1fr; gap: 10px; }
    .picker-top-row { flex-direction: column; align-items: stretch; }
    .arena-actions { width: 100%; justify-content: flex-end; }
  }
</style>
