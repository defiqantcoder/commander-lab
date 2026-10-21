<script lang="ts">
  import {
    AlertTriangle,
    ArrowLeftRight,
    ArrowRight,
    CheckCircle2,
    CircleDollarSign,
    Coins,
    Lock,
    RefreshCw,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    TrendingDown,
    TrendingUp,
    Vault
  } from 'lucide-svelte';
  import {
    analyzeDeckMarketLiquidation,
    type MarketCard,
    type MarketReplacement,
    type PortfolioLiquidationReport
  } from '$lib/engine/market';
  import type { DeckCard } from './types';

  let {
    cards,
    commander,
    deckName,
    onApplySwap
  }: {
    cards: DeckCard[];
    commander: DeckCard;
    deckName: string;
    onApplySwap?: (originalCardName: string, replacementCardName: string) => Promise<void> | void;
  } = $props();

  let activeTab = $state<'watchlist' | 'swaps' | 'vault' | 'matrix'>('watchlist');
  let filterRisk = $state<'all' | 'high' | 'safe' | 'reserved'>('all');
  let swappingCard = $state<string | null>(null);
  let swapSuccessMessage = $state<string | null>(null);

  let report = $derived<PortfolioLiquidationReport>(
    analyzeDeckMarketLiquidation(cards, commander)
  );

  let filteredMatrixCards = $derived<MarketCard[]>(() => {
    let list = report.allCards;
    if (filterRisk === 'high') {
      list = list.filter((c) => c.riskLevel === 'Critical Risk' || c.riskLevel === 'High Risk');
    } else if (filterRisk === 'safe') {
      list = list.filter((c) => c.riskLevel === 'Safe / Budget');
    } else if (filterRisk === 'reserved') {
      list = list.filter((c) => c.isReserved);
    }
    return [...list].sort((a, b) => b.currentPriceUsd - a.currentPriceUsd);
  });

  async function handleSwap(swap: MarketReplacement): Promise<void> {
    if (!onApplySwap) return;
    swappingCard = swap.originalCard;
    try {
      await onApplySwap(swap.originalCard, swap.replacementCard);
      swapSuccessMessage = `Swapped ${swap.originalCard} for ${swap.replacementCard} (Saved $${swap.savings.toFixed(2)})`;
      setTimeout(() => {
        if (swapSuccessMessage) swapSuccessMessage = null;
      }, 4000);
    } finally {
      swappingCard = null;
    }
  }

  function getHealthColor(score: number): string {
    if (score >= 80) return '#22c55e';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  }

  function getRiskBadgeClass(level: MarketCard['riskLevel']): string {
    switch (level) {
      case 'Critical Risk':
        return 'badge-critical';
      case 'High Risk':
        return 'badge-high';
      case 'Reserved List':
        return 'badge-reserved';
      case 'Safe / Budget':
        return 'badge-safe';
      default:
        return 'badge-moderate';
    }
  }
</script>

{#if cards.length === 0 && !commander.name}
  <div class="empty-market panel">
    <Coins size={32} class="empty-icon text-sky" />
    <h3>Market & Liquidation Advisor</h3>
    <p>Your deck is currently empty. Add cards or import your decklist in the Studio to evaluate portfolio health, calculate reprint risk scores, and view high-synergy budget liquidation swaps.</p>
  </div>
{:else}
<div class="market-container panel enter">
  <header class="market-header">
    <div class="header-main">
      <div class="badge-row">
        <span class="eyebrow"><Coins size={11} /> MARKET INTELLIGENCE</span>
        <span class="portfolio-tag">Liquidation Advisor</span>
        <span class="deck-tag">{deckName}</span>
      </div>
      <h2>Portfolio & Reprint Exposure</h2>
      <p class="overview-text">
        Quantifies reprint depreciation vulnerability, safeguards your Reserved List positions, and provides actionable sub-$2 high-synergy budget liquidation swaps.
      </p>
    </div>

    <div class="health-gauge" style={`--score-color: ${getHealthColor(report.portfolioHealthScore)}`}>
      <div class="gauge-ring">
        <span class="gauge-value">{report.portfolioHealthScore}</span>
        <small class="gauge-label">Health Score</small>
      </div>
      <div class="gauge-meta">
        {#if report.portfolioHealthScore >= 80}
          <div class="gauge-badge status-good"><ShieldCheck size={12} /> Fortified</div>
          <p>Insulated from reprint collapses.</p>
        {:else if report.portfolioHealthScore >= 50}
          <div class="gauge-badge status-warn"><Shield size={12} /> Moderate Exposure</div>
          <p>Monitor spoiler seasons closely.</p>
        {:else}
          <div class="gauge-badge status-crit"><ShieldAlert size={12} /> High Vulnerability</div>
          <p>Urgent candidate for budget liquidation.</p>
        {/if}
      </div>
    </div>
  </header>

  <!-- Metric Overview Cards -->
  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-head">
        <span>Total Deck Value</span>
        <CircleDollarSign size={14} class="text-sky" />
      </div>
      <strong>${report.totalDeckValueUsd.toFixed(2)}</strong>
      <small>{report.totalCardsEvaluated} cards assessed</small>
    </div>

    <div class="metric-card" class:danger={report.vulnerableValueUsd > report.totalDeckValueUsd * 0.4}>
      <div class="metric-head">
        <span>Vulnerable Value</span>
        <TrendingDown size={14} class="text-red" />
      </div>
      <strong class="danger-text">${report.vulnerableValueUsd.toFixed(2)}</strong>
      <small>{report.highRiskCards.length} high-risk reprint targets</small>
    </div>

    <div class="metric-card">
      <div class="metric-head">
        <span>Reserved List Safe</span>
        <Vault size={14} class="text-emerald" />
      </div>
      <strong class="safe-text">${report.reservedListValueUsd.toFixed(2)}</strong>
      <small>{report.reservedListCards.length} non-reprintable assets</small>
    </div>

    <div class="metric-card">
      <div class="metric-head">
        <span>Budget Staples</span>
        <CheckCircle2 size={14} class="text-amber" />
      </div>
      <strong class="budget-text">{report.budgetStaplesCount}</strong>
      <small>Cards under $2.00 baseline</small>
    </div>
  </div>

  <!-- Tactical Liquidation Advice Banner -->
  <div class="advice-banner" class:urgent={report.highRiskCards.length > 2}>
    <div class="advice-icon">
      {#if report.portfolioHealthScore >= 80}
        <ShieldCheck size={18} />
      {:else}
        <AlertTriangle size={18} />
      {/if}
    </div>
    <div class="advice-content">
      <strong>Tactical Liquidation Advisory</strong>
      <p>{report.liquidationAdvice}</p>
    </div>
  </div>

  {#if swapSuccessMessage}
    <div class="swap-alert enter">
      <CheckCircle2 size={14} />
      <span>{swapSuccessMessage}</span>
    </div>
  {/if}

  <!-- Tab Navigation -->
  <nav class="market-nav" aria-label="Market sections">
    <button class:active={activeTab === 'watchlist'} onclick={() => (activeTab = 'watchlist')}>
      <TrendingDown size={13} />
      <span>Reprint Watchlist</span>
      {#if report.highRiskCards.length > 0}
        <span class="count-pill pill-danger">{report.highRiskCards.length}</span>
      {/if}
    </button>
    <button class:active={activeTab === 'swaps'} onclick={() => (activeTab = 'swaps')}>
      <ArrowLeftRight size={13} />
      <span>Budget Swapper</span>
      {#if report.budgetReplacements.length > 0}
        <span class="count-pill pill-accent">{report.budgetReplacements.length}</span>
      {/if}
    </button>
    <button class:active={activeTab === 'vault'} onclick={() => (activeTab = 'vault')}>
      <Lock size={13} />
      <span>Reserved List Vault</span>
      {#if report.reservedListCards.length > 0}
        <span class="count-pill pill-gold">{report.reservedListCards.length}</span>
      {/if}
    </button>
    <button class:active={activeTab === 'matrix'} onclick={() => (activeTab = 'matrix')}>
      <Coins size={13} />
      <span>Price Matrix</span>
    </button>
  </nav>

  <!-- Tab 1: Reprint Risk Watchlist -->
  {#if activeTab === 'watchlist'}
    <section class="section-pane enter">
      <div class="pane-header">
        <div>
          <h3>High-Value Non-Reserved Cards</h3>
          <p>These staples hold high dollar value but carry no reprint protection. When reprinted in Masters or Commander sets, prices typically plummet 40–70%.</p>
        </div>
      </div>

      {#if report.highRiskCards.length === 0}
        <div class="empty-state">
          <ShieldCheck size={32} class="empty-icon text-emerald" />
          <h4>No High-Risk Staples Detected</h4>
          <p>Your deck does not contain any volatile high-value cards at imminent risk of reprint collapse.</p>
        </div>
      {:else}
        <div class="watchlist-grid">
          {#each report.highRiskCards as card (card.id)}
            <div class="risk-card">
              <div class="risk-card-head">
                <div class="risk-card-title">
                  <strong>{card.name}</strong>
                  <span class={`risk-badge ${getRiskBadgeClass(card.riskLevel)}`}>{card.riskLevel}</span>
                </div>
                <div class="risk-price">
                  <span>${card.currentPriceUsd.toFixed(2)}</span>
                </div>
              </div>

              <div class="risk-meter-container">
                <div class="risk-meter-labels">
                  <small>Reprint Exposure</small>
                  <strong>{card.reprintRiskScore}%</strong>
                </div>
                <div class="risk-meter-bar">
                  <div
                    class="risk-meter-fill"
                    style={`width: ${card.reprintRiskScore}%; background-color: ${card.reprintRiskScore >= 70 ? '#ef4444' : '#f59e0b'}`}
                  ></div>
                </div>
              </div>

              <p class="risk-note">{card.recommendationNote}</p>

              {#if card.recommendedReplacement}
                <div class="replacement-box">
                  <div class="replacement-head">
                    <span class="rep-label"><Sparkles size={11} /> Suggested Alternative:</span>
                    <strong>{card.recommendedReplacement.replacementCard}</strong>
                    <span class="rep-price">~${card.recommendedReplacement.replacementPrice.toFixed(2)}</span>
                  </div>
                  <p class="rep-synergy">{card.recommendedReplacement.synergyNote}</p>
                  <div class="rep-actions">
                    <span class="save-tag">Save ${card.recommendedReplacement.savings.toFixed(2)}</span>
                    {#if onApplySwap}
                      <button
                        class="swap-btn"
                        disabled={swappingCard === card.name}
                        onclick={() => handleSwap(card.recommendedReplacement!)}
                      >
                        {#if swappingCard === card.name}
                          <RefreshCw size={11} class="spin" /> Swapping...
                        {:else}
                          <ArrowLeftRight size={11} /> Swap to Budget
                        {/if}
                      </button>
                    {/if}
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </section>

  <!-- Tab 2: Budget Swapper -->
  {:else if activeTab === 'swaps'}
    <section class="section-pane enter">
      <div class="pane-header">
        <div>
          <h3>One-Click Budget Liquidation Swaps</h3>
          <p>Direct replacements curated to preserve critical combo loops and engine density while reducing cash exposure to sub-$2 cards.</p>
        </div>
      </div>

      {#if report.budgetReplacements.length === 0}
        <div class="empty-state">
          <CheckCircle2 size={32} class="empty-icon text-emerald" />
          <h4>No Swaps Needed</h4>
          <p>None of the cards currently in your deck require immediate budget substitutions.</p>
        </div>
      {:else}
        <div class="swaps-table-container">
          <table class="swaps-table">
            <thead>
              <tr>
                <th>Current Card</th>
                <th>Price</th>
                <th></th>
                <th>Budget Replacement</th>
                <th>Price</th>
                <th>Net Savings</th>
                <th>Synergy Preservation</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {#each report.budgetReplacements as swap (swap.originalCard)}
                <tr>
                  <td class="bold-cell">{swap.originalCard}</td>
                  <td class="price-cell text-red">${swap.originalPrice.toFixed(2)}</td>
                  <td class="arrow-cell"><ArrowRight size={12} /></td>
                  <td class="bold-cell text-sky">{swap.replacementCard}</td>
                  <td class="price-cell text-emerald">${swap.replacementPrice.toFixed(2)}</td>
                  <td class="savings-cell">+${swap.savings.toFixed(2)}</td>
                  <td class="synergy-cell">{swap.synergyNote}</td>
                  <td class="action-cell">
                    {#if onApplySwap}
                      <button
                        class="swap-btn-table"
                        disabled={swappingCard === swap.originalCard}
                        onclick={() => handleSwap(swap)}
                      >
                        {#if swappingCard === swap.originalCard}
                          <RefreshCw size={11} class="spin" />
                        {:else}
                          <ArrowLeftRight size={11} /> Swap
                        {/if}
                      </button>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>

  <!-- Tab 3: Reserved List Safety Vault -->
  {:else if activeTab === 'vault'}
    <section class="section-pane enter">
      <div class="pane-header">
        <div>
          <h3>Reserved List Safe Haven</h3>
          <p>Cards on the official Magic: The Gathering Reserved List are contractually protected from tournament-legal reprint. Their value is driven solely by organic scarcity and commander demand.</p>
        </div>
      </div>

      {#if report.reservedListCards.length === 0}
        <div class="empty-state">
          <Vault size={32} class="empty-icon text-zinc" />
          <h4>No Reserved List Cards in Deck</h4>
          <p>Your deck contains no Reserved List positions. All cards are subject to potential reprint cycles.</p>
        </div>
      {:else}
        <div class="vault-grid">
          {#each report.reservedListCards as card (card.id)}
            <div class="vault-card">
              <div class="vault-card-head">
                <div class="vault-title">
                  <Lock size={13} class="text-amber" />
                  <strong>{card.name}</strong>
                </div>
                <strong class="vault-price">${card.currentPriceUsd.toFixed(2)}</strong>
              </div>
              <div class="vault-status">
                <span class="vault-badge"><ShieldCheck size={10} /> Safe Vault Asset</span>
                <span class="risk-score-zero">0% Reprint Exposure</span>
              </div>
              <p class="vault-note">{card.recommendationNote}</p>
            </div>
          {/each}
        </div>
      {/if}
    </section>

  <!-- Tab 4: Price Matrix & Full Deck Valuation -->
  {:else if activeTab === 'matrix'}
    <section class="section-pane enter">
      <div class="pane-header">
        <div>
          <h3>Card Value & Risk Matrix</h3>
          <p>Comprehensive roster of all cards evaluated with calculated reprint exposure scores.</p>
        </div>
        <div class="filter-group">
          <button class:active={filterRisk === 'all'} onclick={() => (filterRisk = 'all')}>All ({report.allCards.length})</button>
          <button class:active={filterRisk === 'high'} onclick={() => (filterRisk = 'high')}>Vulnerable ({report.highRiskCards.length})</button>
          <button class:active={filterRisk === 'safe'} onclick={() => (filterRisk = 'safe')}>Budget ({report.budgetStaplesCount})</button>
          <button class:active={filterRisk === 'reserved'} onclick={() => (filterRisk = 'reserved')}>Reserved ({report.reservedListCards.length})</button>
        </div>
      </div>

      <div class="matrix-table-container">
        <table class="swaps-table">
          <thead>
            <tr>
              <th>Card Name</th>
              <th>Market Price</th>
              <th>Reprint Risk</th>
              <th>Classification</th>
              <th>Tactical Action</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredMatrixCards() as card (card.id)}
              <tr>
                <td class="bold-cell">{card.name}</td>
                <td class="price-cell">${card.currentPriceUsd.toFixed(2)}</td>
                <td class="risk-meter-td">
                  <div class="table-risk-bar">
                    <span class="table-risk-val">{card.reprintRiskScore}%</span>
                    <div class="bar-bg">
                      <div
                        class="bar-fill"
                        style={`width: ${card.reprintRiskScore}%; background-color: ${card.reprintRiskScore >= 70 ? '#ef4444' : card.reprintRiskScore >= 40 ? '#f59e0b' : '#22c55e'}`}
                      ></div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class={`risk-badge ${getRiskBadgeClass(card.riskLevel)}`}>{card.riskLevel}</span>
                </td>
                <td class="action-desc-cell">{card.action}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>
  {/if}
</div>
{/if}

<style>
  .empty-market { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; text-align: center; gap: 10px; border: 1px dashed #2b2b30; border-radius: 8px; background: rgba(20, 20, 23, 0.4); margin: 20px auto; max-width: 580px; }
  .empty-market :global(.empty-icon) { color: #38bdf8; }
  .empty-market h3 { margin: 0; color: #f4f4f5; font-size: 16px; font-weight: 600; }
  .empty-market p { margin: 0; color: #94a3b8; font-size: 11px; line-height: 1.5; max-width: 440px; }
  .market-container {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.5rem;
    background: #090d16;
    border: 1px solid #1e293b;
    border-radius: 12px;
    color: #e2e8f0;
  }

  .market-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1.5rem;
    border-bottom: 1px solid #1e293b;
    padding-bottom: 1.25rem;
  }

  .header-main {
    flex: 1;
  }

  .badge-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.1);
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    border: 1px solid rgba(56, 189, 248, 0.2);
  }

  .portfolio-tag, .deck-tag {
    font-size: 0.68rem;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    background: #1e293b;
    color: #94a3b8;
  }

  h2 {
    font-size: 1.4rem;
    font-weight: 700;
    margin: 0 0 0.35rem;
    color: #f8fafc;
  }

  .overview-text {
    font-size: 0.85rem;
    line-height: 1.45;
    color: #94a3b8;
    margin: 0;
    max-width: 680px;
  }

  /* Health Gauge */
  .health-gauge {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: #0f172a;
    border: 1px solid #1e293b;
    padding: 0.75rem 1.25rem;
    border-radius: 10px;
  }

  .gauge-ring {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 68px;
    height: 68px;
    border-radius: 50%;
    border: 3px solid var(--score-color);
    box-shadow: 0 0 16px -2px var(--score-color);
  }

  .gauge-value {
    font-size: 1.45rem;
    font-weight: 800;
    color: #f8fafc;
    line-height: 1;
  }

  .gauge-label {
    font-size: 0.58rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #94a3b8;
    margin-top: 2px;
  }

  .gauge-meta {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .gauge-meta p {
    margin: 0;
    font-size: 0.72rem;
    color: #94a3b8;
    max-width: 140px;
    line-height: 1.3;
  }

  .gauge-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    width: fit-content;
  }

  .status-good {
    background: rgba(34, 197, 94, 0.15);
    color: #4ade80;
    border: 1px solid rgba(34, 197, 94, 0.3);
  }

  .status-warn {
    background: rgba(245, 158, 11, 0.15);
    color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }

  .status-crit {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  /* Metric Cards */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.85rem;
  }

  .metric-card {
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 8px;
    padding: 0.85rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .metric-card.danger {
    border-color: rgba(239, 68, 68, 0.4);
    background: rgba(239, 68, 68, 0.05);
  }

  .metric-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .metric-card strong {
    font-size: 1.35rem;
    font-weight: 700;
    color: #f8fafc;
  }

  .metric-card small {
    font-size: 0.72rem;
    color: #64748b;
  }

  .text-sky { color: #38bdf8; }
  .text-red { color: #ef4444; }
  .text-emerald { color: #22c55e; }
  .text-amber { color: #f59e0b; }
  .text-zinc { color: #94a3b8; }
  .danger-text { color: #f87171 !important; }
  .safe-text { color: #4ade80 !important; }
  .budget-text { color: #38bdf8 !important; }

  /* Advice Banner */
  .advice-banner {
    display: flex;
    gap: 0.85rem;
    background: rgba(56, 189, 248, 0.06);
    border: 1px solid rgba(56, 189, 248, 0.2);
    border-radius: 8px;
    padding: 0.85rem 1rem;
    align-items: flex-start;
  }

  .advice-banner.urgent {
    background: rgba(239, 68, 68, 0.08);
    border-color: rgba(239, 68, 68, 0.3);
  }

  .advice-icon {
    margin-top: 2px;
    color: #38bdf8;
  }

  .advice-banner.urgent .advice-icon {
    color: #ef4444;
  }

  .advice-content strong {
    display: block;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #f8fafc;
    margin-bottom: 0.2rem;
  }

  .advice-content p {
    margin: 0;
    font-size: 0.82rem;
    line-height: 1.4;
    color: #cbd5e1;
  }

  .swap-alert {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(34, 197, 94, 0.15);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #4ade80;
    padding: 0.6rem 0.85rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  /* Nav Tabs */
  .market-nav {
    display: flex;
    gap: 0.5rem;
    border-bottom: 1px solid #1e293b;
    padding-bottom: 0.5rem;
    overflow-x: auto;
  }

  .market-nav button {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 0.82rem;
    font-weight: 600;
    padding: 0.45rem 0.85rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .market-nav button:hover {
    color: #f8fafc;
    background: #1e293b;
  }

  .market-nav button.active {
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.12);
    border: 1px solid rgba(56, 189, 248, 0.25);
  }

  .count-pill {
    font-size: 0.65rem;
    padding: 0.1rem 0.35rem;
    border-radius: 999px;
    font-weight: 700;
  }

  .pill-danger { background: rgba(239, 68, 68, 0.2); color: #f87171; }
  .pill-accent { background: rgba(56, 189, 248, 0.2); color: #38bdf8; }
  .pill-gold { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }

  /* Sections */
  .section-pane {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .pane-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 1rem;
  }

  .pane-header h3 {
    margin: 0 0 0.25rem;
    font-size: 1.05rem;
    color: #f8fafc;
  }

  .pane-header p {
    margin: 0;
    font-size: 0.8rem;
    color: #94a3b8;
    max-width: 720px;
    line-height: 1.4;
  }

  /* Watchlist Grid */
  .watchlist-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1rem;
  }

  .risk-card {
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .risk-card-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .risk-card-title {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .risk-card-title strong {
    font-size: 0.95rem;
    color: #f8fafc;
  }

  .risk-price span {
    font-size: 1.15rem;
    font-weight: 800;
    color: #ef4444;
  }

  .risk-badge {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    width: fit-content;
  }

  .badge-critical { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
  .badge-high { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
  .badge-moderate { background: rgba(148, 163, 184, 0.2); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.3); }
  .badge-reserved { background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }
  .badge-safe { background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); }

  .risk-meter-container {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .risk-meter-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    color: #94a3b8;
  }

  .risk-meter-labels strong {
    color: #f8fafc;
  }

  .risk-meter-bar {
    width: 100%;
    height: 6px;
    background: #1e293b;
    border-radius: 999px;
    overflow: hidden;
  }

  .risk-meter-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.3s ease;
  }

  .risk-note {
    margin: 0;
    font-size: 0.78rem;
    line-height: 1.4;
    color: #94a3b8;
  }

  .replacement-box {
    background: #090d16;
    border: 1px solid rgba(56, 189, 248, 0.2);
    border-radius: 6px;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .replacement-head {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
    font-size: 0.8rem;
  }

  .rep-label {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    color: #38bdf8;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .replacement-head strong {
    color: #f8fafc;
  }

  .rep-price {
    color: #4ade80;
    font-weight: 700;
  }

  .rep-synergy {
    margin: 0;
    font-size: 0.75rem;
    color: #94a3b8;
    line-height: 1.35;
  }

  .rep-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.25rem;
  }

  .save-tag {
    font-size: 0.72rem;
    font-weight: 700;
    color: #4ade80;
    background: rgba(34, 197, 94, 0.1);
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
  }

  .swap-btn, .swap-btn-table {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    background: #0284c7;
    color: #ffffff;
    border: none;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.3rem 0.65rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .swap-btn:hover:not(:disabled), .swap-btn-table:hover:not(:disabled) {
    background: #0369a1;
  }

  .swap-btn:disabled, .swap-btn-table:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Table styles */
  .swaps-table-container, .matrix-table-container {
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 8px;
    overflow-x: auto;
  }

  .swaps-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
    text-align: left;
  }

  .swaps-table th {
    background: #090d16;
    color: #94a3b8;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.68rem;
    letter-spacing: 0.05em;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #1e293b;
  }

  .swaps-table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #1e293b;
    color: #cbd5e1;
    vertical-align: middle;
  }

  .swaps-table tr:last-child td {
    border-bottom: none;
  }

  .bold-cell {
    font-weight: 600;
    color: #f8fafc !important;
  }

  .price-cell {
    font-weight: 700;
  }

  .arrow-cell {
    color: #64748b;
  }

  .savings-cell {
    color: #4ade80;
    font-weight: 700;
  }

  .synergy-cell {
    font-size: 0.75rem;
    color: #94a3b8;
    max-width: 260px;
    line-height: 1.35;
  }

  /* Vault styles */
  .vault-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }

  .vault-card {
    background: #0f172a;
    border: 1px solid rgba(168, 85, 247, 0.3);
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .vault-card-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .vault-title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: #f8fafc;
    font-weight: 700;
  }

  .vault-price {
    font-size: 1.1rem;
    font-weight: 800;
    color: #c084fc;
  }

  .vault-status {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.7rem;
  }

  .vault-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    background: rgba(168, 85, 247, 0.15);
    color: #c084fc;
    font-weight: 700;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
  }

  .risk-score-zero {
    color: #4ade80;
    font-weight: 700;
  }

  .vault-note {
    margin: 0;
    font-size: 0.75rem;
    color: #94a3b8;
    line-height: 1.35;
  }

  /* Filter buttons in matrix */
  .filter-group {
    display: flex;
    gap: 0.35rem;
  }

  .filter-group button {
    background: #0f172a;
    border: 1px solid #1e293b;
    color: #94a3b8;
    font-size: 0.72rem;
    padding: 0.3rem 0.6rem;
    border-radius: 4px;
    cursor: pointer;
  }

  .filter-group button.active {
    background: rgba(56, 189, 248, 0.15);
    border-color: #38bdf8;
    color: #38bdf8;
    font-weight: 700;
  }

  .table-risk-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .table-risk-val {
    font-size: 0.72rem;
    font-weight: 700;
    width: 32px;
  }

  .bar-bg {
    flex: 1;
    min-width: 60px;
    height: 5px;
    background: #1e293b;
    border-radius: 999px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: 999px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2.5rem;
    background: #0f172a;
    border: 1px dashed #1e293b;
    border-radius: 8px;
    text-align: center;
    gap: 0.5rem;
  }

  .empty-state h4 {
    margin: 0;
    font-size: 1rem;
    color: #f8fafc;
  }

  .empty-state p {
    margin: 0;
    font-size: 0.8rem;
    color: #94a3b8;
    max-width: 400px;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .enter {
    animation: enterFade 0.2s ease-out;
  }

  @keyframes enterFade {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>

