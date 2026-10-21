<script lang="ts">
  import {
    BrainCircuit,
    Check,
    Coins,
    Compass,
    Database,
    Flame,
    Layers,
    Loader2,
    RefreshCw,
    Shield,
    Sparkles,
    Wand2,
    X,
    Zap
  } from 'lucide-svelte';
  import {
    brainstormArchetypes,
    generateFreshDeckWithAI,
    type ArchetypeSuggestion,
    type GeneratedDeckResult
  } from '$lib/ai/gemini';
  import type { DeckCard, CollectionCard } from './types';

  let {
    open = false,
    commander,
    userCollection = [],
    onclose = () => {},
    onApplyDeck = (_deck: GeneratedDeckResult) => {}
  }: {
    open: boolean;
    commander: DeckCard;
    userCollection?: CollectionCard[];
    onclose: () => void;
    onApplyDeck?: (deck: GeneratedDeckResult) => Promise<void> | void;
  } = $props();

  let step = $state<'archetypes' | 'preview'>('archetypes');
  let isBrainstorming = $state(false);
  let isGenerating = $state(false);
  let errorMessage = $state('');

  let archetypes = $state<ArchetypeSuggestion[]>([]);
  let selectedArchetype = $state<ArchetypeSuggestion | null>(null);
  let customArchetypeName = $state('');
  let powerTier = $state<'Casual' | 'Focused' | 'Optimized'>('Casual');
  let useCollection = $state(false);

  let generatedDeck = $state<GeneratedDeckResult | null>(null);

  // Sync and brainstorm when opened if archetypes are empty
  $effect(() => {
    if (open && commander?.name && archetypes.length === 0 && !isBrainstorming) {
      loadArchetypes();
    }
  });

  async function loadArchetypes(): Promise<void> {
    if (!commander?.name) return;
    isBrainstorming = true;
    errorMessage = '';
    try {
      const results = await brainstormArchetypes(commander.name, commander.colorIdentity ?? []);
      archetypes = results;
      if (results.length > 0) {
        selectedArchetype = results[0];
        if (results[0].powerTier && ['Casual', 'Focused', 'Optimized'].includes(results[0].powerTier)) {
          powerTier = results[0].powerTier as 'Casual' | 'Focused' | 'Optimized';
        }
      }
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Failed to brainstorm archetypes.';
    } finally {
      isBrainstorming = false;
    }
  }

  async function handleGenerateDeck(): Promise<void> {
    if (!commander?.name) return;
    const theme = customArchetypeName.trim() || selectedArchetype?.themeName || 'Dynamic Synergy';
    isGenerating = true;
    errorMessage = '';

    try {
      const ownedNames = useCollection ? userCollection.map((c) => c.name) : [];
      const result = await generateFreshDeckWithAI(
        commander.name,
        commander.colorIdentity ?? [],
        theme,
        ownedNames,
        powerTier
      );
      generatedDeck = result;
      step = 'preview';
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Failed to generate deck.';
    } finally {
      isGenerating = false;
    }
  }

  async function handleApplyDeck(): Promise<void> {
    if (!generatedDeck) return;
    await onApplyDeck(generatedDeck);
    onclose();
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      onclose();
    }
  }

  function getPowerBadgeClass(power: string): string {
    switch (power.toLowerCase()) {
      case 'optimized':
        return 'badge-optimized';
      case 'focused':
        return 'badge-focused';
      default:
        return 'badge-casual';
    }
  }
</script>

{#if open}
  <div class="modal-backdrop" onclick={onclose} onkeydown={handleKeydown} role="presentation">
    <dialog
      open
      class="modal-dialog architect-dialog"
      onclick={(e) => e.stopPropagation()}
      aria-labelledby="architect-title"
      aria-modal="true"
    >
      <div class="modal-header">
        <div class="header-icon-wrap">
          <BrainCircuit size={20} class="text-sky" />
        </div>
        <div class="header-text">
          <h2 id="architect-title">AI Deck Architect</h2>
          <p>
            Powered by Google Gemini · Unconventional archetypes, obscure rules synergies, & fresh builds
          </p>
        </div>
        <button class="close-btn" onclick={onclose} aria-label="Close modal">
          <X size={18} />
        </button>
      </div>

      {#if !commander.name}
        <div class="no-commander-warning">
          <Sparkles size={24} />
          <h3>No Commander Selected</h3>
          <p>Please select a commander in the Studio before generating an AI deck.</p>
          <button class="primary-btn" onclick={onclose}>Return to Studio</button>
        </div>
      {:else}
        <div class="modal-body">
          {#if errorMessage}
            <div class="error-banner">
              <span>{errorMessage}</span>
            </div>
          {/if}

          {#if step === 'archetypes'}
            <div class="step-container">
              <div class="section-intro">
                <span class="commander-badge">
                  <Compass size={13} /> {commander.name}
                </span>
                <p>
                  Choose a fresh, unconventional archetype brainstormed for <strong>{commander.name}</strong>, or enter your own custom theme.
                </p>
              </div>

              {#if isBrainstorming}
                <div class="loading-state">
                  <Loader2 size={32} class="spinner" />
                  <h4>Brainstorming Unconventional Archetypes...</h4>
                  <p>Analyzing obscure rules interactions, replacement effects, and non-linear engines for {commander.name}...</p>
                </div>
              {:else}
                <div class="archetypes-grid">
                  {#each archetypes as arch}
                    <button
                      type="button"
                      class="archetype-card"
                      class:selected={selectedArchetype?.themeName === arch.themeName}
                      onclick={() => {
                        selectedArchetype = arch;
                        if (arch.powerTier && ['Casual', 'Focused', 'Optimized'].includes(arch.powerTier)) {
                          powerTier = arch.powerTier as 'Casual' | 'Focused' | 'Optimized';
                        }
                      }}
                    >
                      <div class="card-top">
                        <span class={`power-badge ${getPowerBadgeClass(arch.powerTier)}`}>
                          {arch.powerTier}
                        </span>
                        {#if selectedArchetype?.themeName === arch.themeName}
                          <span class="selected-pill"><Check size={12} /> Selected</span>
                        {/if}
                      </div>

                      <h4 class="theme-name">{arch.themeName}</h4>
                      <p class="tagline">{arch.tagline}</p>

                      <div class="theme-detail">
                        <span class="detail-label"><Zap size={11} /> Primary Engine:</span>
                        <span class="detail-val">{arch.primaryEngine}</span>
                      </div>

                      <div class="theme-detail">
                        <span class="detail-label"><Flame size={11} /> Obscure Interaction:</span>
                        <span class="detail-val">{arch.obscureInteraction}</span>
                      </div>

                      <div class="theme-detail">
                        <span class="detail-label"><Compass size={11} /> Key Win-Con:</span>
                        <span class="detail-val">{arch.keyWinCon}</span>
                      </div>

                      {#if arch.sampleKeyCards?.length}
                        <div class="sample-cards">
                          {#each arch.sampleKeyCards.slice(0, 3) as card}
                            <span class="sample-tag">{card}</span>
                          {/each}
                        </div>
                      {/if}
                    </button>
                  {/each}
                </div>

                <div class="power-tier-container">
                  <div class="power-tier-header">
                    <span class="power-tier-title">Select Deck Power Bracket:</span>
                    <span class="power-tier-active-hint">
                      Active: <strong class={`text-${powerTier.toLowerCase()}`}>{powerTier}</strong>
                    </span>
                  </div>
                  <div class="power-tier-options">
                    <button
                      type="button"
                      class="tier-choice-card tier-casual"
                      class:tier-active={powerTier === 'Casual'}
                      onclick={() => powerTier = 'Casual'}
                    >
                      <div class="tier-top">
                        <span class="tier-indicator casual-ind"></span>
                        <span class="tier-name">🌿 Casual Deck</span>
                        <span class="bracket-badge">Bracket 1–2</span>
                      </div>
                      <p class="tier-desc">Kitchen-table friendly. Focuses on fun board synergy & flavor. Strictly no fast mana or 2-card infinite combos.</p>
                    </button>

                    <button
                      type="button"
                      class="tier-choice-card tier-focused"
                      class:tier-active={powerTier === 'Focused'}
                      onclick={() => powerTier = 'Focused'}
                    >
                      <div class="tier-top">
                        <span class="tier-indicator focused-ind"></span>
                        <span class="tier-name">⚡ Focused Deck</span>
                        <span class="bracket-badge">Bracket 3</span>
                      </div>
                      <p class="tier-desc">Cohesive game plan with consistent ramp, solid card draw, and resilient interaction package.</p>
                    </button>

                    <button
                      type="button"
                      class="tier-choice-card tier-optimized"
                      class:tier-active={powerTier === 'Optimized'}
                      onclick={() => powerTier = 'Optimized'}
                    >
                      <div class="tier-top">
                        <span class="tier-indicator optimized-ind"></span>
                        <span class="tier-name">🔥 Optimized Deck</span>
                        <span class="bracket-badge">Bracket 4</span>
                      </div>
                      <p class="tier-desc">High-velocity curve, efficient tutors, fast mana acceleration, and compact win lines.</p>
                    </button>
                  </div>
                </div>

                <div class="custom-theme-box">
                  <label for="custom-theme-input">Or specify a custom archetype idea:</label>
                  <input
                    id="custom-theme-input"
                    type="text"
                    bind:value={customArchetypeName}
                    placeholder="e.g. Obscure Artifact Storm, Pillowfort Stax-Lite, Wheels Drain..."
                  />
                </div>

                <div class="collection-toggle-row">
                  <label class="collection-label">
                    <input
                      type="checkbox"
                      bind:checked={useCollection}
                    />
                    <span class="checkbox-custom"></span>
                    <div class="collection-text">
                      <span class="collection-title">
                        <Database size={13} /> Prioritize cards from my collection <small>(Optional)</small>
                      </span>
                      <span class="collection-desc">
                        {userCollection.length > 0 ? `${userCollection.length} cards in binder — AI will prioritize owned cards where synergistic.` : 'No cards currently in binder. AI will pull freely from all MTG cards.'}
                      </span>
                    </div>
                  </label>

                  <button class="subtle-btn" onclick={loadArchetypes} title="Re-brainstorm themes">
                    <RefreshCw size={13} /> New Themes
                  </button>
                </div>
              {/if}
            </div>
          {:else if step === 'preview' && generatedDeck}
            <div class="preview-container">
              <div class="preview-header">
                <div>
                  <div class="preview-title-row">
                    <h3>{generatedDeck.archetype}</h3>
                    <span class={`power-badge ${getPowerBadgeClass(powerTier)}`}>
                      {powerTier === 'Casual' ? '🌿 Casual' : powerTier === 'Focused' ? '⚡ Focused' : '🔥 Optimized'}
                    </span>
                  </div>
                  <p>Tailored <strong>{commander.name}</strong> list · Estimated Salt: <strong>{generatedDeck.estimatedSaltScore}/100</strong></p>
                </div>
                <button class="subtle-btn" onclick={() => step = 'archetypes'}>
                  Back to Archetypes
                </button>
              </div>

              <div class="cards-preview-scroll">
                {#each ['ramp', 'draw', 'engine', 'interaction', 'payoff', 'land'] as cat}
                  {@const catCards = generatedDeck.cards.filter((c) => c.category === cat)}
                  {#if catCards.length > 0}
                    <div class="category-block">
                      <div class="category-title">
                        <span class="cat-pill">{cat.toUpperCase()}</span>
                        <small>{catCards.length} cards</small>
                      </div>
                      <div class="category-cards-list">
                        {#each catCards as card}
                          <div class="preview-card-item">
                            <div class="card-main">
                              <span class="card-name">{card.name}</span>
                              <span class="card-cmc">{card.cmc} CMC</span>
                            </div>
                            <p class="synergy-rationale">{card.synergyRationale}</p>
                            {#if card.budgetAlternative}
                              <div class="budget-alt">
                                <Coins size={11} />
                                <span>Budget swap: <strong>{card.budgetAlternative}</strong></span>
                              </div>
                            {/if}
                          </div>
                        {/each}
                      </div>
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <div class="modal-footer">
          <button class="subtle-btn" onclick={onclose}>Cancel</button>

          {#if step === 'archetypes'}
            <button
              class="primary-btn"
              disabled={isGenerating || isBrainstorming}
              onclick={handleGenerateDeck}
            >
              {#if isGenerating}
                <Loader2 size={14} class="spinner" /> Generating {powerTier} Deck...
              {:else}
                <Wand2 size={14} /> Build {powerTier} Deck with AI
              {/if}
            </button>
          {:else}
            <button
              class="primary-btn accent-btn"
              onclick={handleApplyDeck}
            >
              <Check size={14} /> Load Deck into Studio
            </button>
          {/if}
        </div>
      {/if}
    </dialog>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(4, 8, 16, 0.75);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-dialog.architect-dialog {
    background: #0f172a;
    border: 1px solid rgba(56, 189, 248, 0.25);
    border-radius: 12px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.65), 0 0 35px rgba(56, 189, 248, 0.15);
    color: #e2e8f0;
    width: 100%;
    max-width: 820px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1.15rem 1.5rem;
    background: rgba(15, 23, 42, 0.95);
    border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  }

  .header-icon-wrap {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: rgba(56, 189, 248, 0.12);
    border: 1px solid rgba(56, 189, 248, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .header-text h2 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: #f8fafc;
    letter-spacing: -0.01em;
  }

  .header-text p {
    margin: 0.15rem 0 0 0;
    font-size: 0.75rem;
    color: #94a3b8;
  }

  .close-btn {
    margin-left: auto;
    background: transparent;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 0.4rem;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }

  .close-btn:hover {
    color: #f1f5f9;
    background: rgba(255, 255, 255, 0.08);
  }

  .modal-body {
    padding: 1.25rem 1.5rem;
    overflow-y: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .no-commander-warning {
    padding: 3rem 1.5rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    color: #94a3b8;
  }

  .no-commander-warning h3 {
    color: #f8fafc;
    margin: 0;
  }

  .section-intro {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .section-intro p {
    margin: 0;
    font-size: 0.825rem;
    color: #94a3b8;
  }

  .commander-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.65rem;
    background: rgba(56, 189, 248, 0.15);
    border: 1px solid rgba(56, 189, 248, 0.35);
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    color: #38bdf8;
    white-space: nowrap;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
    gap: 0.75rem;
  }

  .loading-state h4 {
    margin: 0;
    font-size: 1.05rem;
    color: #f8fafc;
  }

  .loading-state p {
    margin: 0;
    font-size: 0.825rem;
    color: #94a3b8;
    max-width: 480px;
  }

  .archetypes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: 0.85rem;
    margin-bottom: 1rem;
  }

  .archetype-card {
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(51, 65, 85, 0.8);
    border-radius: 8px;
    padding: 0.85rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .archetype-card:hover {
    background: rgba(30, 41, 59, 0.95);
    border-color: rgba(56, 189, 248, 0.4);
    transform: translateY(-2px);
  }

  .archetype-card.selected {
    background: rgba(56, 189, 248, 0.08);
    border-color: #38bdf8;
    box-shadow: 0 0 15px rgba(56, 189, 248, 0.15);
  }

  .card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .power-badge {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
  }

  .badge-casual {
    background: rgba(34, 197, 94, 0.15);
    color: #4ade80;
    border: 1px solid rgba(34, 197, 94, 0.3);
  }

  .badge-focused {
    background: rgba(245, 158, 11, 0.15);
    color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }

  .badge-optimized {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .preview-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .power-tier-container {
    background: rgba(20, 24, 36, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 0.9rem;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .power-tier-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .power-tier-title {
    font-size: 0.75rem;
    font-weight: 700;
    color: #e2e8f0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .power-tier-active-hint {
    font-size: 0.72rem;
    color: #94a3b8;
  }

  .text-casual { color: #4ade80; }
  .text-focused { color: #fbbf24; }
  .text-optimized { color: #f87171; }

  .power-tier-options {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.65rem;
  }

  .tier-choice-card {
    background: rgba(15, 18, 28, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 7px;
    padding: 0.75rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .tier-choice-card:hover {
    background: rgba(22, 27, 42, 0.9);
    border-color: rgba(255, 255, 255, 0.18);
    transform: translateY(-1px);
  }

  .tier-choice-card.tier-active.tier-casual {
    border-color: #22c55e;
    background: rgba(34, 197, 94, 0.1);
    box-shadow: 0 0 14px rgba(34, 197, 94, 0.15);
  }

  .tier-choice-card.tier-active.tier-focused {
    border-color: #f59e0b;
    background: rgba(245, 158, 11, 0.1);
    box-shadow: 0 0 14px rgba(245, 158, 11, 0.15);
  }

  .tier-choice-card.tier-active.tier-optimized {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
    box-shadow: 0 0 14px rgba(239, 68, 68, 0.15);
  }

  .tier-top {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .tier-indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .casual-ind { background: #22c55e; }
  .focused-ind { background: #f59e0b; }
  .optimized-ind { background: #ef4444; }

  .tier-name {
    font-size: 0.78rem;
    font-weight: 700;
    color: #f1f5f9;
  }

  .bracket-badge {
    margin-left: auto;
    font-size: 0.62rem;
    font-family: var(--mono);
    color: #8b90a4;
    background: rgba(255, 255, 255, 0.05);
    padding: 0.1rem 0.35rem;
    border-radius: 3px;
  }

  .tier-desc {
    margin: 0;
    font-size: 0.68rem;
    color: #9499ab;
    line-height: 1.35;
  }

  @media (max-width: 720px) {
    .power-tier-options {
      grid-template-columns: 1fr;
    }
  }

  .selected-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.68rem;
    font-weight: 700;
    color: #38bdf8;
  }

  .theme-name {
    margin: 0;
    font-size: 0.925rem;
    font-weight: 700;
    color: #f8fafc;
  }

  .tagline {
    margin: 0;
    font-size: 0.75rem;
    color: #94a3b8;
    line-height: 1.35;
  }

  .theme-detail {
    font-size: 0.725rem;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .detail-label {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-weight: 600;
    color: #cbd5e1;
  }

  .detail-val {
    color: #94a3b8;
    line-height: 1.3;
  }

  .sample-cards {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin-top: 0.25rem;
  }

  .sample-tag {
    font-size: 0.65rem;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(51, 65, 85, 0.7);
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    color: #cbd5e1;
  }

  .custom-theme-box {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: 0.75rem;
  }

  .custom-theme-box label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #cbd5e1;
  }

  .custom-theme-box input {
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(51, 65, 85, 0.9);
    border-radius: 6px;
    color: #f8fafc;
    padding: 0.55rem 0.75rem;
    font-size: 0.825rem;
  }

  .custom-theme-box input:focus {
    outline: none;
    border-color: #38bdf8;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
  }

  .collection-toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(51, 65, 85, 0.6);
    border-radius: 8px;
    gap: 1rem;
  }

  .collection-label {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    cursor: pointer;
  }

  .collection-text {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .collection-title {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: #f1f5f9;
  }

  .collection-desc {
    font-size: 0.725rem;
    color: #94a3b8;
  }

  .preview-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  }

  .preview-header h3 {
    margin: 0;
    font-size: 1.05rem;
    color: #f8fafc;
  }

  .preview-header p {
    margin: 0.2rem 0 0 0;
    font-size: 0.775rem;
    color: #94a3b8;
  }

  .cards-preview-scroll {
    max-height: 480px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-right: 0.5rem;
  }

  .category-block {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .category-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .cat-pill {
    font-size: 0.68rem;
    font-weight: 700;
    background: rgba(56, 189, 248, 0.15);
    color: #38bdf8;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    border: 1px solid rgba(56, 189, 248, 0.3);
  }

  .category-title small {
    color: #64748b;
    font-size: 0.75rem;
  }

  .category-cards-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 0.5rem;
  }

  .preview-card-item {
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(51, 65, 85, 0.6);
    border-radius: 6px;
    padding: 0.5rem 0.65rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .card-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-name {
    font-size: 0.8rem;
    font-weight: 600;
    color: #f1f5f9;
  }

  .card-cmc {
    font-size: 0.7rem;
    color: #94a3b8;
    background: rgba(30, 41, 59, 0.6);
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
  }

  .synergy-rationale {
    margin: 0;
    font-size: 0.7rem;
    color: #94a3b8;
    line-height: 1.3;
  }

  .budget-alt {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.68rem;
    color: #fbbf24;
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    background: rgba(15, 23, 42, 0.95);
    border-top: 1px solid rgba(51, 65, 85, 0.6);
  }

  .primary-btn {
    background: #0284c7;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 0.55rem 1rem;
    font-size: 0.825rem;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    transition: all 0.15s ease;
  }

  .primary-btn:hover:not(:disabled) {
    background: #0369a1;
  }

  .primary-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .accent-btn {
    background: #10b981;
  }

  .accent-btn:hover:not(:disabled) {
    background: #059669;
  }

  .subtle-btn {
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(51, 65, 85, 0.8);
    color: #cbd5e1;
    border-radius: 6px;
    padding: 0.55rem 0.85rem;
    font-size: 0.825rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    transition: all 0.15s ease;
  }

  .subtle-btn:hover {
    background: rgba(51, 65, 85, 0.8);
    color: #f8fafc;
  }

  .error-banner {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.35);
    color: #fca5a5;
    padding: 0.6rem 0.85rem;
    border-radius: 6px;
    font-size: 0.8rem;
  }

  :global(.spinner) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .text-sky {
    color: #38bdf8;
  }
</style>

