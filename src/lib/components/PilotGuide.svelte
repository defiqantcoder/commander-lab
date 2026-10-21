<script lang="ts">
  import {
    AlertTriangle,
    ArrowRight,
    BookOpen,
    BrainCircuit,
    CheckCircle2,
    Clock,
    Database,
    Flame,
    Info,
    Layers,
    Loader2,
    Plus,
    RefreshCw,
    RotateCcw,
    Shield,
    Sparkles,
    Swords,
    Target,
    Zap
  } from 'lucide-svelte';
  import { generateDeckPlaybook, type ComboWalkthrough, type DeckPlaybook } from '$lib/engine/playbook';
  import { analyzeDeckWithAI, type AIDeckAnalysisResult } from '$lib/ai/gemini';
  import { getCollection } from '$lib/db';
  import type { SimCard } from '$lib/engine/goldfish';
  import type { DeckCard } from './types';

  let {
    cards,
    commander,
    deckName,
    archetype,
    onApplyAddition
  }: {
    cards: DeckCard[];
    commander: DeckCard;
    deckName: string;
    archetype: string;
    onApplyAddition?: (cardName: string) => Promise<void> | void;
  } = $props();

  let activeTab = $state<'phases' | 'combos' | 'synergy' | 'mulligan' | 'ai-scan'>('phases');
  let comboFilter = $state<'all' | 'inDeck' | 'missingOne'>('all');
  let expandedComboId = $state<string | null>(null);

  let isScanningAI = $state(false);
  let aiAnalysis = $state<AIDeckAnalysisResult | null>(null);
  let aiAnalysisError = $state<string | null>(null);
  let addingCard = $state<string | null>(null);
  let addSuccessMessage = $state<string | null>(null);

  async function runAIDeepScan(): Promise<void> {
    if (cards.length === 0 && !commander.name) return;
    isScanningAI = true;
    aiAnalysisError = null;
    try {
      let collectionCards: Array<{ name: string; typeLine?: string }> = [];
      try {
        const owned = await getCollection();
        if (owned && owned.length > 0) {
          collectionCards = owned.map((c) => ({ name: c.name, typeLine: c.typeLine }));
        }
      } catch {
        // Collection is optional
      }

      const deckCards = cards.map((c) => ({
        name: c.name,
        typeLine: c.typeLine,
        oracleText: c.oracleText
      }));

      const result = await analyzeDeckWithAI(
        commander.name || 'Your Commander',
        deckCards,
        collectionCards
      );
      aiAnalysis = result;
    } catch (err) {
      aiAnalysisError = err instanceof Error ? err.message : 'AI Deep Scan failed.';
    } finally {
      isScanningAI = false;
    }
  }

  async function handleAddUpgrade(cardName: string): Promise<void> {
    if (!onApplyAddition) return;
    addingCard = cardName;
    try {
      await onApplyAddition(cardName);
      addSuccessMessage = `Added ${cardName} to deck!`;
      setTimeout(() => {
        if (addSuccessMessage) addSuccessMessage = null;
      }, 3500);
    } finally {
      addingCard = null;
    }
  }

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

  let playbook = $derived<DeckPlaybook>(
    generateDeckPlaybook(
      cards.map((c) => toSimCard(c)),
      toSimCard(commander, true),
      archetype,
      deckName
    )
  );

  let filteredCombos = $derived.by<ComboWalkthrough[]>(() => {
    if (comboFilter === 'inDeck') {
      return playbook.combos.filter((c) => c.inDeckCount === c.totalCardsCount);
    }
    if (comboFilter === 'missingOne') {
      return playbook.combos.filter((c) => c.missingCards.length === 1);
    }
    return playbook.combos;
  });

  let inDeckComboCount = $derived(
    playbook.combos.filter((c) => c.inDeckCount === c.totalCardsCount).length
  );

  function toggleCombo(id: string): void {
    expandedComboId = expandedComboId === id ? null : id;
  }
</script>

{#if !commander.name && cards.length === 0}
  <div class="empty-playbook panel">
    <BookOpen size={32} class="empty-icon text-sky" />
    <h3>Piloting Playbook</h3>
    <p>Select a Commander or add cards to your deck in the Studio to automatically generate tactical phase-by-phase piloting instructions, combo lines, and recovery guides.</p>
  </div>
{:else}
<div class="playbook-container panel enter">
  <header class="playbook-header">
    <div class="header-main">
      <div class="badge-row">
        <span class="eyebrow"><BookOpen size={10} /> PILOTING PLAYBOOK</span>
        <span class="speed-badge"><Clock size={10} /> {playbook.estimatedSpeed}</span>
        <span class="archetype-badge">{playbook.archetype}</span>
      </div>
      <h2>{playbook.commanderName} Tactical Guide</h2>
      <p class="overview-text">{playbook.overview}</p>
    </div>
    <button class="ai-deep-scan-btn" onclick={() => { activeTab = 'ai-scan'; runAIDeepScan(); }} disabled={isScanningAI}>
      {#if isScanningAI}
        <Loader2 size={13} class="spinner" /> Scanning Deck...
      {:else}
        <BrainCircuit size={13} /> AI Deep Scan
      {/if}
    </button>
  </header>

  <nav class="playbook-nav" aria-label="Playbook sections">
    <button class:active={activeTab === 'phases'} onclick={() => (activeTab = 'phases')}>
      <Target size={13} />
      <span>Gameplan & Phases</span>
    </button>
    <button class:active={activeTab === 'combos'} onclick={() => (activeTab = 'combos')}>
      <Zap size={13} />
      <span>Combos & Loops</span>
      {#if inDeckComboCount > 0}
        <small class="pill in-deck">{inDeckComboCount}</small>
      {:else}
        <small class="pill">{playbook.combos.length}</small>
      {/if}
    </button>
    <button class:active={activeTab === 'synergy'} onclick={() => (activeTab = 'synergy')}>
      <Sparkles size={13} />
      <span>High Synergy Plays</span>
      <small class="pill">{playbook.synergyPlays.length}</small>
    </button>
    <button class:active={activeTab === 'mulligan'} onclick={() => (activeTab = 'mulligan')}>
      <Shield size={13} />
      <span>Mulligans & Recovery</span>
    </button>
    <button class:active={activeTab === 'ai-scan'} onclick={() => { activeTab = 'ai-scan'; if (!aiAnalysis && !isScanningAI) runAIDeepScan(); }}>
      <BrainCircuit size={13} class="text-sky" />
      <span>AI Deep Scan</span>
      {#if aiAnalysis}
        <small class="pill in-deck">Ready</small>
      {/if}
    </button>
  </nav>

  <div class="playbook-content">
    {#if activeTab === 'phases'}
      <div class="phases-view">
        <div class="phase-card early">
          <div class="phase-tag">
            <span class="turns">{playbook.gamePhases.early.turns}</span>
            <span class="phase-name">Early Game</span>
          </div>
          <h3>{playbook.gamePhases.early.title}</h3>
          <p class="objective"><strong>Objective:</strong> {playbook.gamePhases.early.objective}</p>

          <div class="key-cards">
            <span>Key Targets:</span>
            {#each playbook.gamePhases.early.keyCards as card}
              <code class="card-chip">{card}</code>
            {/each}
          </div>

          <div class="lists-grid">
            <div class="priorities">
              <h4><CheckCircle2 size={12} /> Execution Priorities</h4>
              <ul>
                {#each playbook.gamePhases.early.priorities as item}
                  <li>{item}</li>
                {/each}
              </ul>
            </div>
            <div class="warnings">
              <h4><AlertTriangle size={12} /> Tactical Traps</h4>
              <ul>
                {#each playbook.gamePhases.early.warnings as item}
                  <li>{item}</li>
                {/each}
              </ul>
            </div>
          </div>
        </div>

        <div class="phase-card mid">
          <div class="phase-tag">
            <span class="turns">{playbook.gamePhases.mid.turns}</span>
            <span class="phase-name">Mid Game</span>
          </div>
          <h3>{playbook.gamePhases.mid.title}</h3>
          <p class="objective"><strong>Objective:</strong> {playbook.gamePhases.mid.objective}</p>

          <div class="key-cards">
            <span>Key Targets:</span>
            {#each playbook.gamePhases.mid.keyCards as card}
              <code class="card-chip">{card}</code>
            {/each}
          </div>

          <div class="lists-grid">
            <div class="priorities">
              <h4><CheckCircle2 size={12} /> Execution Priorities</h4>
              <ul>
                {#each playbook.gamePhases.mid.priorities as item}
                  <li>{item}</li>
                {/each}
              </ul>
            </div>
            <div class="warnings">
              <h4><AlertTriangle size={12} /> Tactical Traps</h4>
              <ul>
                {#each playbook.gamePhases.mid.warnings as item}
                  <li>{item}</li>
                {/each}
              </ul>
            </div>
          </div>
        </div>

        <div class="phase-card late">
          <div class="phase-tag">
            <span class="turns">{playbook.gamePhases.late.turns}</span>
            <span class="phase-name">Late Game & Endgame</span>
          </div>
          <h3>{playbook.gamePhases.late.title}</h3>
          <p class="objective"><strong>Objective:</strong> {playbook.gamePhases.late.objective}</p>

          <div class="key-cards">
            <span>Key Targets:</span>
            {#each playbook.gamePhases.late.keyCards as card}
              <code class="card-chip">{card}</code>
            {/each}
          </div>

          <div class="lists-grid">
            <div class="priorities">
              <h4><CheckCircle2 size={12} /> Execution Priorities</h4>
              <ul>
                {#each playbook.gamePhases.late.priorities as item}
                  <li>{item}</li>
                {/each}
              </ul>
            </div>
            <div class="warnings">
              <h4><AlertTriangle size={12} /> Tactical Traps</h4>
              <ul>
                {#each playbook.gamePhases.late.warnings as item}
                  <li>{item}</li>
                {/each}
              </ul>
            </div>
          </div>
        </div>
      </div>
    {:else if activeTab === 'combos'}
      <div class="combos-view">
        <div class="filter-bar">
          <span>Show:</span>
          <button class:active={comboFilter === 'all'} onclick={() => (comboFilter = 'all')}>
            All Cataloged ({playbook.combos.length})
          </button>
          <button class:active={comboFilter === 'inDeck'} onclick={() => (comboFilter = 'inDeck')}>
            Fully In Deck ({inDeckComboCount})
          </button>
          <button
            class:active={comboFilter === 'missingOne'}
            onclick={() => (comboFilter = 'missingOne')}
          >
            Missing 1 Piece ({playbook.combos.filter((c) => c.missingCards.length === 1).length})
          </button>
        </div>

        <div class="combos-list">
          {#each filteredCombos as combo (combo.id)}
            <div
              class="combo-card"
              class:fully-owned={combo.inDeckCount === combo.totalCardsCount}
              class:expanded={expandedComboId === combo.id}
            >
              <div
                class="combo-summary"
                role="button"
                tabindex="0"
                onclick={() => toggleCombo(combo.id)}
                onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleCombo(combo.id); }}
              >
                <div class="combo-left">
                  <div class="combo-meta">
                    {#if combo.isInfinite}
                      <span class="badge infinite"><Flame size={10} /> Infinite Loop</span>
                    {:else}
                      <span class="badge finite"><Zap size={10} /> Finite Sequence</span>
                    {/if}
                    {#if combo.inDeckCount === combo.totalCardsCount}
                      <span class="badge complete"><CheckCircle2 size={10} /> In Active Deck</span>
                    {:else}
                      <span class="badge incomplete"
                        >{combo.inDeckCount}/{combo.totalCardsCount} In Deck</span
                      >
                    {/if}
                  </div>
                  <h4>{combo.name}</h4>
                  <div class="combo-cards">
                    {#each combo.cards as card}
                      <span
                        class="combo-card-pill"
                        class:missing={combo.missingCards.includes(card)}
                      >
                        {card}
                        {#if combo.missingCards.includes(card)}
                          <small>(needs addition)</small>
                        {/if}
                      </span>
                    {/each}
                  </div>
                </div>
                <div class="combo-right">
                  <span class="result-label">{combo.result}</span>
                  <button class="expand-btn">
                    {expandedComboId === combo.id ? 'Collapse' : 'Walkthrough'}
                  </button>
                </div>
              </div>

              {#if expandedComboId === combo.id}
                <div class="combo-details enter">
                  <div class="prereqs-box">
                    <strong><Clock size={12} /> Starting Prerequisites:</strong>
                    <ul>
                      {#each combo.prerequisites as req}
                        <li>{req}</li>
                      {/each}
                    </ul>
                  </div>

                  <div class="steps-box">
                    <strong><Zap size={12} /> Step-by-Step Execution:</strong>
                    <ol>
                      {#each combo.steps as step}
                        <li>{step}</li>
                      {/each}
                    </ol>
                  </div>

                  <div class="disruption-box">
                    <strong><Shield size={12} /> Disruption Windows (Opponent Counterplay):</strong>
                    <p>{combo.disruptionWindow}</p>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {:else if activeTab === 'synergy'}
      <div class="synergy-view">
        {#if playbook.synergyPlays.length === 0}
          <div class="empty-state">
            <Sparkles size={24} />
            <p>No special synergy packages detected yet. Add cards to see engine loops.</p>
          </div>
        {:else}
          <div class="synergy-grid">
            {#each playbook.synergyPlays as play (play.id)}
              <div class="synergy-card">
                <div class="synergy-header">
                  <span class="synergy-category {play.category}">{play.category}</span>
                  <h4>{play.title}</h4>
                </div>
                <div class="synergy-cards-row">
                  {#each play.cards as card, i}
                    <code class="syn-card">{card}</code>
                    {#if i < play.cards.length - 1}
                      <ArrowRight size={12} class="syn-arrow" />
                    {/if}
                  {/each}
                </div>
                <p class="synergy-desc">{play.description}</p>
                <div class="tactical-box">
                  <strong><Info size={11} /> Tactical Tip:</strong>
                  <span>{play.tacticalTip}</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {:else if activeTab === 'mulligan'}
      <div class="mulligan-view">
        <section class="mulligan-section">
          <h3><Target size={14} /> The Ideal Opening Hand</h3>
          <p class="mulligan-rec">{playbook.mulliganGuide.mulliganRecommendation}</p>
          <div class="checklist">
            {#each playbook.mulliganGuide.idealHandProfile as check}
              <div class="check-item">
                <CheckCircle2 size={13} class="check-icon" />
                <span>{check}</span>
              </div>
            {/each}
          </div>
        </section>

        <div class="mulligan-grid">
          <div class="mulligan-box keeps">
            <h4><CheckCircle2 size={13} /> Hands to KEEP</h4>
            <ul>
              {#each playbook.mulliganGuide.keepableCriteria as criterion}
                <li>{criterion}</li>
              {/each}
            </ul>
          </div>
          <div class="mulligan-box traps">
            <h4><AlertTriangle size={13} /> Hands to MULLIGAN (Traps)</h4>
            <ul>
              {#each playbook.mulliganGuide.trapHands as trap}
                <li>{trap}</li>
              {/each}
            </ul>
          </div>
        </div>

        <section class="recovery-section">
          <h3><RotateCcw size={14} /> Board Wipe & Disruption Recovery</h3>
          <div class="recovery-grid">
            <div class="rec-card">
              <h4>After a Board Wipe</h4>
              <ul>
                {#each playbook.recoveryTactics.boardWipeRecovery as tip}
                  <li>{tip}</li>
                {/each}
              </ul>
            </div>
            <div class="rec-card">
              <h4>Holding Up Interaction</h4>
              <ul>
                {#each playbook.recoveryTactics.interactionHoldGuidance as tip}
                  <li>{tip}</li>
                {/each}
              </ul>
            </div>
            <div class="rec-card">
              <h4>Against Stax & Hate Pieces</h4>
              <ul>
                {#each playbook.recoveryTactics.staxCounterplay as tip}
                  <li>{tip}</li>
                {/each}
              </ul>
            </div>
          </div>
        </section>
      </div>
    {:else if activeTab === 'ai-scan'}
      <div class="ai-scan-view enter">
        <div class="ai-scan-header">
          <div>
            <h3>Dynamic AI Deck & Synergy Inspection</h3>
            <p>Powered by Google Gemini · Dynamic loop analysis, non-linear synergy discovery, and owned collection cross-referencing.</p>
          </div>
          <button class="subtle-btn" onclick={runAIDeepScan} disabled={isScanningAI}>
            {#if isScanningAI}
              <Loader2 size={13} class="spinner" /> Inspecting Deck...
            {:else}
              <RefreshCw size={13} /> Re-scan Deck with Gemini
            {/if}
          </button>
        </div>

        {#if addSuccessMessage}
          <div class="add-alert enter">
            <CheckCircle2 size={14} class="text-emerald" />
            <span>{addSuccessMessage}</span>
          </div>
        {/if}

        {#if isScanningAI}
          <div class="ai-loading-box">
            <Loader2 size={32} class="spinner text-sky" />
            <h4>Gemini AI is scanning your cards...</h4>
            <p>Deep-inspecting card oracle texts, state-based action loops, obscure interactions, and cross-referencing your owned binder...</p>
          </div>
        {:else if aiAnalysisError}
          <div class="error-banner">
            <span>{aiAnalysisError}</span>
          </div>
        {:else if aiAnalysis}
          <div class="ai-analysis-content">
            <div class="deck-summary-card">
              <div class="summary-icon">
                <BrainCircuit size={20} class="text-sky" />
              </div>
              <div class="summary-text">
                <strong>Deck Composition Summary</strong>
                <p>{aiAnalysis.deckSummary}</p>
              </div>
            </div>

            <!-- Dynamic Combos Discovered -->
            <div class="ai-section">
              <div class="section-title-row">
                <Zap size={16} class="text-amber" />
                <h4>AI Discovered Dynamic Combos & Loops</h4>
                <small>Uncovered through dynamic rules text reasoning</small>
              </div>

              {#if aiAnalysis.dynamicCombos.length === 0}
                <div class="empty-state mini">
                  <Info size={20} class="text-zinc" />
                  <p>No infinite loops or game-winning combo lines detected in the current card pool.</p>
                </div>
              {:else}
                <div class="ai-combos-grid">
                  {#each aiAnalysis.dynamicCombos as combo}
                    <div class="ai-combo-card">
                      <div class="combo-head">
                        <div class="combo-title-wrap">
                          <span class="ai-badge">✨ Gemini AI Discovery</span>
                          <h4>{combo.name}</h4>
                        </div>
                        <span class={`type-pill ${combo.isInfinite ? 'infinite' : 'finite'}`}>
                          {combo.isInfinite ? 'Infinite Loop' : 'Synergy Line'}
                        </span>
                      </div>

                      <p class="combo-result">{combo.result}</p>

                      <div class="combo-pieces">
                        {#each combo.cards as card}
                          <span class="card-chip">{card}</span>
                        {/each}
                      </div>

                      {#if combo.prerequisites?.length}
                        <div class="combo-reqs">
                          <strong>Prerequisites:</strong>
                          <ul>
                            {#each combo.prerequisites as req}
                              <li>{req}</li>
                            {/each}
                          </ul>
                        </div>
                      {/if}

                      {#if combo.steps?.length}
                        <div class="combo-steps">
                          <strong>Execution Steps:</strong>
                          <ol>
                            {#each combo.steps as step}
                              <li>{step}</li>
                            {/each}
                          </ol>
                        </div>
                      {/if}

                      <div class="disruption-note">
                        <AlertTriangle size={11} />
                        <span><strong>Disruption Window:</strong> {combo.disruptionWindow}</span>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>

            <!-- Optional Collection Upgrades -->
            {#if aiAnalysis.collectionUpgrades?.length > 0}
              <div class="ai-section">
                <div class="section-title-row">
                  <Database size={16} class="text-emerald" />
                  <h4>Owned Collection Upgrades (In Your Binder)</h4>
                  <small>Cards you already own that slot into your deck's strategy</small>
                </div>

                <div class="upgrades-grid">
                  {#each aiAnalysis.collectionUpgrades as upg}
                    <div class="upgrade-card">
                      <div class="upg-head">
                        <div>
                          <strong class="upg-card-name">{upg.cardName}</strong>
                          <span class="upg-role">{upg.role}</span>
                        </div>
                        {#if onApplyAddition}
                          <button
                            class="add-upg-btn"
                            disabled={addingCard === upg.cardName}
                            onclick={() => handleAddUpgrade(upg.cardName)}
                          >
                            <Plus size={11} />
                            {addingCard === upg.cardName ? 'Adding...' : 'Add to Deck'}
                          </button>
                        {/if}
                      </div>
                      <p class="upg-reason">{upg.synergyReason}</p>
                      {#if upg.replacesCard}
                        <span class="replaces-tag">Suggested swap for: <em>{upg.replacesCard}</em></span>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- AI Piloting Secrets -->
            {#if aiAnalysis.pilotingSecrets?.length > 0}
              <div class="ai-section">
                <div class="section-title-row">
                  <Shield size={16} class="text-sky" />
                  <h4>Tactical Piloting Secrets & Timing</h4>
                  <small>Bespoke advice tailored to your exact 99</small>
                </div>

                <div class="secrets-grid">
                  {#each aiAnalysis.pilotingSecrets as sec}
                    <div class="secret-card">
                      <h4>{sec.title}</h4>
                      <p>{sec.tip}</p>
                      {#if sec.applicableCards?.length}
                        <div class="sec-cards">
                          {#each sec.applicableCards as c}
                            <span class="card-chip">{c}</span>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
{/if}

<style>
  .empty-playbook { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; text-align: center; gap: 10px; border: 1px dashed #2b2b30; border-radius: 8px; background: rgba(20, 20, 23, 0.4); margin: 20px auto; max-width: 580px; }
  .empty-playbook :global(.empty-icon) { color: #38bdf8; }
  .empty-playbook h3 { margin: 0; color: #f4f4f5; font-size: 16px; font-weight: 600; }
  .empty-playbook p { margin: 0; color: #94a3b8; font-size: 11px; line-height: 1.5; max-width: 440px; }
  .playbook-container { width: min(940px, 100%); margin: 16px auto 0; overflow: hidden; border: 1px solid #2b2b31; background: #111114; }
  .playbook-header { padding: 18px 22px; border-bottom: 1px solid #232328; background: linear-gradient(180deg, #18181d 0%, #111114 100%); }
  .badge-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .eyebrow { display: inline-flex; align-items: center; gap: 4px; color: #7dd3fc; font: 8px var(--mono); letter-spacing: 0.1em; text-transform: uppercase; }
  .speed-badge, .archetype-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; border: 1px solid #38bdf833; border-radius: 4px; background: #0e749020; color: #bae6fd; font: 8px var(--mono); }
  .archetype-badge { border-color: #a855f733; background: #581c8720; color: #e9d5ff; }
  h2 { margin: 0; color: #fafafa; font-size: 18px; font-weight: 600; }
  .overview-text { margin: 6px 0 0; color: #8e8e99; font-size: 10px; line-height: 1.5; }

  .playbook-nav { display: flex; border-bottom: 1px solid #232328; background: #141418; overflow-x: auto; }
  .playbook-nav button { display: inline-flex; align-items: center; gap: 7px; padding: 11px 16px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: #787882; font-size: 10px; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.15s ease; }
  .playbook-nav button:hover { color: #d4d4d8; }
  .playbook-nav button.active { color: #38bdf8; border-bottom-color: #38bdf8; background: #18181d; }
  .pill { padding: 1px 5px; border-radius: 3px; background: #27272e; color: #a1a1aa; font: 8px var(--mono); }
  .pill.in-deck { background: #14532d; color: #86efac; border: 1px solid #22c55e44; }

  .playbook-content { padding: 20px 22px; }

  /* Phases View */
  .phases-view { display: grid; gap: 16px; }
  .phase-card { padding: 16px; border: 1px solid #26262c; border-radius: 7px; background: #151519; }
  .phase-tag { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
  .phase-tag .turns { padding: 2px 6px; border-radius: 3px; font: 8px var(--mono); font-weight: 600; }
  .phase-card.early .turns { background: #0369a130; color: #7dd3fc; border: 1px solid #0284c755; }
  .phase-card.mid .turns { background: #581c8730; color: #d8b4fe; border: 1px solid #9333ea55; }
  .phase-card.late .turns { background: #991b1b30; color: #fca5a5; border: 1px solid #dc262655; }
  .phase-tag .phase-name { color: #71717a; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; }
  .phase-card h3 { margin: 4px 0 6px; color: #f4f4f5; font-size: 14px; font-weight: 600; }
  .objective { margin: 0 0 12px; color: #a1a1aa; font-size: 10px; line-height: 1.5; }
  .key-cards { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; font-size: 9px; color: #71717a; }
  .card-chip { padding: 2px 6px; border: 1px solid #33333b; border-radius: 4px; background: #1b1b22; color: #e4e4e7; font: 9px var(--mono); }
  .lists-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .priorities, .warnings { padding: 12px; border-radius: 5px; background: #101013; }
  .priorities h4, .warnings h4 { display: flex; align-items: center; gap: 5px; margin: 0 0 8px; font-size: 10px; font-weight: 600; }
  .priorities h4 { color: #86efac; }
  .warnings h4 { color: #fca5a5; }
  ul { margin: 0; padding-left: 14px; color: #a1a1aa; font-size: 9px; line-height: 1.5; }
  ul li { margin-bottom: 4px; }

  /* Combos View */
  .filter-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; font-size: 9px; color: #71717a; }
  .filter-bar button { padding: 4px 10px; border: 1px solid #2e2e36; border-radius: 4px; background: #17171c; color: #a1a1aa; font-size: 9px; cursor: pointer; }
  .filter-bar button.active { border-color: #38bdf866; background: #0e749033; color: #bae6fd; }
  .combos-list { display: grid; gap: 10px; }
  .combo-card { border: 1px solid #27272e; border-radius: 6px; background: #141418; overflow: hidden; transition: border-color 0.15s; }
  .combo-card.fully-owned { border-color: #22c55e44; }
  .combo-summary { display: flex; justify-content: space-between; align-items: center; gap: 14px; padding: 12px 14px; cursor: pointer; }
  .combo-summary:hover { background: #18181f; }
  .combo-meta { display: flex; gap: 6px; margin-bottom: 4px; }
  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 3px; font: 8px var(--mono); font-weight: 500; }
  .badge.infinite { background: #7f1d1d33; color: #fca5a5; border: 1px solid #ef444455; }
  .badge.finite { background: #07598533; color: #7dd3fc; border: 1px solid #0284c755; }
  .badge.complete { background: #14532d33; color: #86efac; border: 1px solid #22c55e55; }
  .badge.incomplete { background: #27272a; color: #a1a1aa; border: 1px solid #3f3f46; }
  .combo-left h4 { margin: 0 0 6px; color: #f4f4f5; font-size: 12px; font-weight: 600; }
  .combo-cards { display: flex; flex-wrap: wrap; gap: 5px; }
  .combo-card-pill { padding: 2px 6px; border: 1px solid #32323a; border-radius: 3px; background: #1c1c22; color: #d4d4d8; font: 8px var(--mono); }
  .combo-card-pill.missing { color: #f59e0b; border-color: #f59e0b55; }
  .combo-card-pill small { color: #a1a1aa; font-size: 7px; margin-left: 2px; }
  .combo-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
  .result-label { color: #86efac; font: 9px var(--mono); font-weight: 500; text-align: right; max-width: 260px; }
  .expand-btn { padding: 3px 8px; border: 1px solid #3f3f46; border-radius: 3px; background: #1f1f26; color: #cbd5e1; font-size: 8px; cursor: pointer; }

  .combo-details { padding: 14px; border-top: 1px solid #25252c; background: #0e0e11; display: grid; gap: 10px; }
  .prereqs-box, .steps-box, .disruption-box { padding: 10px 12px; border-radius: 4px; font-size: 9px; line-height: 1.5; }
  .prereqs-box { background: #16161c; border-left: 3px solid #38bdf8; }
  .steps-box { background: #16161c; border-left: 3px solid #22c55e; }
  .disruption-box { background: #1c1616; border-left: 3px solid #ef4444; }
  .prereqs-box strong, .steps-box strong, .disruption-box strong { display: flex; align-items: center; gap: 5px; color: #e4e4e7; margin-bottom: 4px; font-weight: 600; }
  .disruption-box strong { color: #fca5a5; }
  .disruption-box p { margin: 0; color: #cbd5e1; }
  ol { margin: 0; padding-left: 16px; color: #cbd5e1; }
  ol li { margin-bottom: 4px; }

  /* Synergy View */
  .synergy-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
  .synergy-card { padding: 14px; border: 1px solid #26262d; border-radius: 6px; background: #151519; display: flex; flex-direction: column; gap: 8px; }
  .synergy-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .synergy-header h4 { margin: 0; color: #f4f4f5; font-size: 11px; font-weight: 600; }
  .synergy-category { padding: 2px 5px; border-radius: 3px; font: 7px var(--mono); text-transform: uppercase; }
  .synergy-category.engine { background: #581c8733; color: #d8b4fe; border: 1px solid #9333ea44; }
  .synergy-category.protection { background: #0369a133; color: #7dd3fc; border: 1px solid #0284c744; }
  .synergy-category.mana { background: #14532d33; color: #86efac; border: 1px solid #22c55e44; }
  .synergy-category.value { background: #78350f33; color: #fde047; border: 1px solid #d9770644; }
  .synergy-cards-row { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
  .syn-card { padding: 2px 5px; border: 1px solid #33333d; border-radius: 3px; background: #1c1c23; color: #e4e4e7; font: 8px var(--mono); }
  .syn-arrow { color: #71717a; }
  .synergy-desc { margin: 0; color: #9d9da8; font-size: 9px; line-height: 1.5; }
  .tactical-box { padding: 7px 9px; border-radius: 4px; background: #101013; color: #cbd5e1; font-size: 8px; line-height: 1.4; border: 1px solid #232328; }
  .tactical-box strong { color: #7dd3fc; display: flex; align-items: center; gap: 4px; margin-bottom: 2px; }

  /* Mulligan View */
  .mulligan-view { display: grid; gap: 16px; }
  .mulligan-section { padding: 14px; border: 1px solid #26262d; border-radius: 6px; background: #151519; }
  .mulligan-section h3 { display: flex; align-items: center; gap: 6px; margin: 0 0 4px; color: #f4f4f5; font-size: 13px; font-weight: 600; }
  .mulligan-rec { margin: 0 0 10px; color: #38bdf8; font-size: 10px; font-weight: 500; }
  .checklist { display: grid; gap: 6px; }
  .check-item { display: flex; align-items: center; gap: 8px; color: #d4d4d8; font-size: 9px; }
  .check-icon { color: #22c55e; flex-shrink: 0; }

  .mulligan-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .mulligan-box { padding: 12px; border-radius: 6px; }
  .mulligan-box.keeps { background: #0c1a12; border: 1px solid #22c55e44; }
  .mulligan-box.traps { background: #1f0f0f; border: 1px solid #ef444444; }
  .mulligan-box h4 { display: flex; align-items: center; gap: 6px; margin: 0 0 8px; font-size: 10px; font-weight: 600; }
  .mulligan-box.keeps h4 { color: #86efac; }
  .mulligan-box.traps h4 { color: #fca5a5; }

  .recovery-section { padding: 14px; border: 1px solid #26262d; border-radius: 6px; background: #151519; }
  .recovery-section h3 { display: flex; align-items: center; gap: 6px; margin: 0 0 10px; color: #f4f4f5; font-size: 13px; font-weight: 600; }
  .recovery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; }
  .rec-card { padding: 10px; border-radius: 4px; background: #101014; border: 1px solid #232328; }
  .rec-card h4 { margin: 0 0 6px; color: #7dd3fc; font-size: 10px; font-weight: 600; }

  @media (max-width: 760px) {
    .lists-grid, .mulligan-grid { grid-template-columns: 1fr; }
    .combo-summary { flex-direction: column; align-items: flex-start; }
    .combo-right { align-items: flex-start; }
  }

  /* AI Deep Scan styles */
  .ai-deep-scan-btn {
    margin-left: auto;
    background: rgba(56, 189, 248, 0.12);
    border: 1px solid rgba(56, 189, 248, 0.4);
    color: #38bdf8;
    border-radius: 6px;
    padding: 0.45rem 0.85rem;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    transition: all 0.15s ease;
  }

  .ai-deep-scan-btn:hover:not(:disabled) {
    background: rgba(56, 189, 248, 0.22);
    border-color: #38bdf8;
  }

  .ai-deep-scan-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .ai-scan-view {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1rem 0;
  }

  .ai-scan-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  }

  .ai-scan-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #f8fafc;
  }

  .ai-scan-header p {
    margin: 0.2rem 0 0 0;
    font-size: 0.775rem;
    color: #94a3b8;
  }

  .ai-loading-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3.5rem 1rem;
    text-align: center;
    gap: 0.75rem;
  }

  .ai-loading-box h4 {
    margin: 0;
    font-size: 1.05rem;
    color: #f8fafc;
  }

  .ai-loading-box p {
    margin: 0;
    font-size: 0.8rem;
    color: #94a3b8;
    max-width: 480px;
  }

  .ai-analysis-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .deck-summary-card {
    display: flex;
    align-items: flex-start;
    gap: 0.85rem;
    padding: 1rem 1.25rem;
    border-radius: 8px;
    background: rgba(56, 189, 248, 0.08);
    border: 1px solid rgba(56, 189, 248, 0.3);
  }

  .summary-text strong {
    display: block;
    color: #38bdf8;
    font-size: 0.95rem;
    margin-bottom: 0.25rem;
  }

  .summary-text p {
    margin: 0;
    font-size: 0.825rem;
    color: #cbd5e1;
    line-height: 1.45;
  }

  .section-title-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.85rem;
  }

  .section-title-row h4 {
    margin: 0;
    font-size: 0.95rem;
    color: #f8fafc;
  }

  .section-title-row small {
    color: #64748b;
    font-size: 0.75rem;
  }

  .ai-combos-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .ai-combo-card {
    background: #0f172a;
    border: 1px solid rgba(168, 85, 247, 0.35);
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .combo-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }

  .combo-title-wrap h4 {
    margin: 0.25rem 0 0 0;
    font-size: 1rem;
    color: #f8fafc;
  }

  .ai-badge {
    font-size: 0.65rem;
    font-weight: 700;
    color: #c084fc;
    background: rgba(168, 85, 247, 0.15);
    border: 1px solid rgba(168, 85, 247, 0.3);
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    display: inline-block;
  }

  .type-pill {
    font-size: 0.68rem;
    font-weight: 700;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
  }

  .type-pill.infinite {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .type-pill.finite {
    background: rgba(34, 197, 94, 0.15);
    color: #4ade80;
    border: 1px solid rgba(34, 197, 94, 0.3);
  }

  .combo-result {
    margin: 0;
    font-size: 0.825rem;
    color: #a7f3d0;
    font-weight: 600;
  }

  .combo-pieces {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .combo-reqs, .combo-steps {
    font-size: 0.775rem;
    color: #cbd5e1;
    line-height: 1.4;
  }

  .combo-reqs strong, .combo-steps strong {
    color: #e2e8f0;
    display: block;
    margin-bottom: 0.2rem;
  }

  .combo-reqs ul, .combo-steps ol {
    margin: 0;
    padding-left: 1.25rem;
  }

  .disruption-note {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.725rem;
    color: #fca5a5;
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.2);
    padding: 0.4rem 0.6rem;
    border-radius: 4px;
  }

  .upgrades-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 0.85rem;
  }

  .upgrade-card {
    background: #0f172a;
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 8px;
    padding: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .upg-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .upg-card-name {
    color: #f8fafc;
    font-size: 0.875rem;
  }

  .upg-role {
    font-size: 0.65rem;
    color: #34d399;
    text-transform: uppercase;
    margin-left: 0.4rem;
  }

  .add-upg-btn {
    background: #059669;
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 0.3rem 0.6rem;
    font-size: 0.725rem;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    transition: all 0.15s ease;
  }

  .add-upg-btn:hover:not(:disabled) {
    background: #047857;
  }

  .upg-reason {
    margin: 0;
    font-size: 0.75rem;
    color: #cbd5e1;
    line-height: 1.35;
  }

  .replaces-tag {
    font-size: 0.68rem;
    color: #94a3b8;
  }

  .replaces-tag em {
    color: #f87171;
    font-style: normal;
  }

  .secrets-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 0.85rem;
  }

  .secret-card {
    background: #0f172a;
    border: 1px solid rgba(56, 189, 248, 0.3);
    border-radius: 8px;
    padding: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .secret-card h4 {
    margin: 0;
    font-size: 0.85rem;
    color: #38bdf8;
  }

  .secret-card p {
    margin: 0;
    font-size: 0.75rem;
    color: #cbd5e1;
    line-height: 1.4;
  }

  .sec-cards {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin-top: 0.25rem;
  }

  .add-alert {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.85rem;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.35);
    border-radius: 6px;
    color: #34d399;
    font-size: 0.8rem;
  }

  .subtle-btn {
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(51, 65, 85, 0.8);
    color: #cbd5e1;
    border-radius: 6px;
    padding: 0.4rem 0.75rem;
    font-size: 0.75rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    transition: all 0.15s ease;
  }

  .subtle-btn:hover:not(:disabled) {
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
</style>

