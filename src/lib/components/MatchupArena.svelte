<script lang="ts">
  import { Activity, ChevronDown, RotateCcw, Swords, Target, TrendingUp } from 'lucide-svelte';
  import { EDHREC_BENCHMARK_DECKS, MatchupSimulator, type MatchupReport } from '$lib/engine/matchup';
  import type { SimCard } from '$lib/engine/goldfish';
  import type { DeckCard, SavedDeck } from './types';

  let { cards, commander, savedDecks, deckName }: { cards: DeckCard[]; commander: DeckCard; savedDecks: SavedDeck[]; deckName: string } = $props();
  let selectedOpponentId = $state(EDHREC_BENCHMARK_DECKS[0]?.id ?? '');
  let report = $state<MatchupReport | null>(null);
  let isRunning = $state(false);
  let errorMessage = $state('');

  let opponentOptions = $derived([
    ...EDHREC_BENCHMARK_DECKS.map((benchmark) => ({ id: benchmark.id, name: benchmark.name, description: benchmark.description, cards: benchmark.cards })),
    ...savedDecks.filter((savedDeck) => savedDeck.id !== 'deck-atraxa-proliferate').map((savedDeck) => ({
      id: `saved:${savedDeck.id}`,
      name: savedDeck.name,
      description: `Saved deck · ${savedDeck.archetype}`,
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
      isCommander
    };
  }

  function runSparring(): void {
    if (!selectedOpponent) return;
    isRunning = true;
    errorMessage = '';
    try {
      const playerCards = [toSimCard(commander, true), ...cards.map((card) => toSimCard(card))];
      const simulator = new MatchupSimulator(playerCards, selectedOpponent.cards, deckName, selectedOpponent.name);
      report = simulator.runMatchupSeries(5);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unable to run this matchup.';
      report = null;
    } finally {
      isRunning = false;
    }
  }

  function resetReport(): void {
    report = null;
    errorMessage = '';
  }
</script>

<section class="arena panel">
  <header class="arena-heading">
    <div>
      <span class="eyebrow">MATCHUP ARENA</span>
      <h2>Sparring report</h2>
      <p>Benchmark your current list against an archetype or saved deck.</p>
    </div>
    <span class="arena-mark"><Swords size={17} /></span>
  </header>

  <div class="opponent-picker">
    <label for="opponent-select">Opponent deck</label>
    <div class="select-wrap">
      <select id="opponent-select" bind:value={selectedOpponentId}>
        <optgroup label="EDHREC benchmarks">
          {#each EDHREC_BENCHMARK_DECKS as benchmark (benchmark.id)}
            <option value={benchmark.id}>{benchmark.name}</option>
          {/each}
        </optgroup>
        {#if savedDecks.length > 1}
          <optgroup label="Saved decks">
            {#each savedDecks.filter((savedDeck) => savedDeck.id !== 'deck-atraxa-proliferate') as savedDeck (savedDeck.id)}
              <option value={`saved:${savedDeck.id}`}>{savedDeck.name}</option>
            {/each}
          </optgroup>
        {/if}
      </select>
      <ChevronDown size={13} />
    </div>
    {#if selectedOpponent}<p>{selectedOpponent.description}</p>{/if}
    <div class="arena-actions"><button class="run-match" onclick={runSparring} disabled={isRunning || !selectedOpponent}><Activity size={14} />{isRunning ? 'Simulating...' : 'Run 5 games'}</button>{#if report}<button class="reset-report" onclick={resetReport} aria-label="Clear matchup report" title="Clear report"><RotateCcw size={14} /></button>{/if}</div>
    {#if errorMessage}<p class="error-message">{errorMessage}</p>{/if}
  </div>

  {#if report}
    <div class="report">
      <div class="score-row">
        <div class="score"><strong>{report.playerWins}</strong><span>WINS</span></div>
        <div class="rate-meter" aria-label={`${winRate}% win rate`}><div><i style={`width:${winRate}%`}></i></div><strong>{winRate}%</strong><small>{report.gamesSimulated} games</small></div>
        <div class="score opponent-score"><strong>{report.opponentWins}</strong><span>LOSSES</span></div>
      </div>
      <div class="report-metrics"><div><span>Avg. game length</span><strong>{report.averageWinningTurn} turns</strong></div><div><span>Opponent</span><strong>{report.opponentDeckName}</strong></div></div>

      <div class="report-section"><h3><Target size={13} /> Weaknesses</h3><ul>{#each report.identifiedWeaknesses as weakness}<li>{weakness}</li>{/each}</ul></div>
      <div class="recommendations">
        <section><h3><TrendingUp size={13} /> Suggested additions</h3>{#each report.recommendedImprovements.suggestedAdditions as addition}<div class="rec-item"><strong>{addition.cardName}</strong><span>{addition.role}</span><p>{addition.reason}</p></div>{/each}</section>
        <section><h3><ChevronDown size={13} /> Suggested cuts</h3>{#each report.recommendedImprovements.suggestedCuts as cut}<div class="rec-item"><strong>{cut.cardName}</strong><p>{cut.reason}</p></div>{/each}</section>
      </div>
      <p class="coaching">{report.recommendedImprovements.coachingAdvice}</p>
      <div class="turn-log"><h3>Sample turn log</h3>{#each report.turnLogs as turn, index (`${turn.turn}-${turn.activePlayer}-${index}`)}<div class="log-row"><span>T{turn.turn} · {turn.activePlayer === 'player' ? 'You' : 'Opponent'}</span><span>{turn.manaAvailable} mana</span><p>{turn.actions.length ? turn.actions.join(' · ') : 'No spells cast'}</p></div>{/each}</div>
    </div>
  {:else}
    <div class="arena-empty"><span><Swords size={20} /></span><strong>Ready when you are</strong><small>Choose an opponent and run five simulated games.</small></div>
  {/if}
</section>

<style>
  .arena { width:min(920px,100%); margin:16px auto 0; overflow:hidden; }
  .arena-heading { display:flex; align-items:center; justify-content:space-between; padding:17px 18px; border-bottom:1px solid #25252a; }
  .eyebrow { color:#73737d; font:8px var(--mono); letter-spacing:.1em; }
  h2 { margin:4px 0 0; color:#f4f4f5; font-size:17px; font-weight:600; }
  .arena-heading p,.opponent-picker>p { margin:5px 0 0; color:#888891; font-size:9px; }
  .arena-mark { display:grid; width:34px; height:34px; place-items:center; border:1px solid #38bdf83d; border-radius:6px; background:#0e749020; color:#7dd3fc; }
  .opponent-picker { display:grid; grid-template-columns:130px minmax(160px,1fr) auto; align-items:center; gap:8px; padding:12px 18px; border-bottom:1px solid #25252a; }
  .opponent-picker>label { color:#a1a1aa; font-size:9px; }
  .select-wrap { position:relative; }
  select { width:100%; height:31px; appearance:none; padding:0 28px 0 9px; border:1px solid #34343a; border-radius:4px; background:#141417; color:#d4d4d8; font-size:9px; }
  .select-wrap :global(svg) { position:absolute; top:9px; right:9px; pointer-events:none; color:#777780; }
  .opponent-picker>p { grid-column:2 / 4; margin:0; }
  .arena-actions { display:flex; grid-column:3; grid-row:1; gap:5px; }
  .run-match { display:inline-flex; min-height:31px; align-items:center; gap:6px; padding:0 10px; border:1px solid #38bdf855; border-radius:4px; background:#0e749033; color:#bae6fd; font-size:9px; cursor:pointer; }
  .run-match:disabled { opacity:.55; cursor:wait; }
  .reset-report { display:grid; width:31px; height:31px; place-items:center; border:1px solid #34343a; border-radius:4px; background:#17171a; color:#a1a1aa; cursor:pointer; }
  .error-message { grid-column:1/-1!important; color:#fca5a5!important; }
  .arena-empty { display:grid; min-height:260px; align-content:center; justify-items:center; gap:8px; color:#777780; text-align:center; }
  .arena-empty>span { display:grid; width:40px; height:40px; place-items:center; border:1px solid #34343a; border-radius:8px; background:#19191d; color:#7dd3fc; }
  .arena-empty strong { color:#c4c4cb; font-size:11px; }
  .arena-empty small { font-size:9px; }
  .report { padding:14px 18px 18px; }
  .score-row { display:grid; grid-template-columns:60px 1fr 60px; align-items:center; gap:14px; padding:8px 0 14px; }
  .score { display:grid; justify-items:center; gap:2px; color:#86efac; }.score strong { font:500 23px var(--mono); }.score span { font:7px var(--mono); letter-spacing:.06em; }
  .opponent-score { color:#fca5a5; }
  .rate-meter { display:grid; grid-template-columns:1fr auto; align-items:center; gap:5px 9px; }.rate-meter>div { height:6px; overflow:hidden; border-radius:5px; background:#422b2b; }.rate-meter i { display:block; height:100%; border-radius:inherit; background:linear-gradient(90deg,#22c55e,#7dd3fc); }.rate-meter strong { color:#d4d4d8; font:10px var(--mono); }.rate-meter small { grid-column:1/-1; color:#71717a; font-size:8px; }
  .report-metrics { display:grid; grid-template-columns:1fr 2fr; gap:10px; padding:10px 0; border-block:1px solid #25252a; }.report-metrics div { display:grid; gap:4px; }.report-metrics span { color:#777780; font-size:8px; }.report-metrics strong { overflow:hidden; color:#d4d4d8; font-size:9px; text-overflow:ellipsis; white-space:nowrap; }
  .report-section { margin-top:13px; }.report-section h3,.recommendations h3,.turn-log h3 { display:flex; align-items:center; gap:6px; margin:0 0 8px; color:#c4c4cb; font-size:9px; font-weight:600; }.report-section h3 :global(svg),.recommendations h3 :global(svg) { color:#7dd3fc; }
  ul { display:grid; gap:5px; margin:0; padding-left:15px; color:#a1a1aa; font-size:9px; line-height:1.45; }
  .recommendations { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-top:14px; }.recommendations section { min-width:0; }.rec-item { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:3px 8px; padding:8px 0; border-top:1px solid #25252a; }.rec-item strong { overflow:hidden; color:#d4d4d8; font-size:9px; text-overflow:ellipsis; white-space:nowrap; }.rec-item>span { color:#7dd3fc; font:7px var(--mono); text-transform:uppercase; }.rec-item p { grid-column:1/-1; margin:0; color:#777780; font-size:8px; line-height:1.4; }
  .coaching { margin:13px 0; padding:9px 10px; border:1px solid #34343a; border-radius:4px; background:#17171a; color:#a1a1aa; font-size:9px; line-height:1.5; }
  .turn-log { border-top:1px solid #25252a; padding-top:12px; }.turn-log h3 { color:#a1a1aa; }.log-row { display:grid; grid-template-columns:1fr auto; gap:3px 8px; padding:6px 0; border-top:1px solid #202024; }.log-row span { color:#8d8d97; font:8px var(--mono); text-transform:capitalize; }.log-row span:nth-child(2) { color:#7dd3fc; }.log-row p { grid-column:1/-1; margin:0; color:#777780; font-size:8px; line-height:1.4; }
  @media(max-width:600px) { .opponent-picker { grid-template-columns:1fr auto; }.opponent-picker>label { grid-column:1/-1; }.select-wrap { grid-column:1; }.arena-actions { grid-column:2; }.opponent-picker>p { grid-column:1/-1; }.report,.arena-heading { padding-inline:12px; }.recommendations { gap:10px; } }
</style>
