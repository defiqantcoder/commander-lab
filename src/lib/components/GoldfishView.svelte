<script lang="ts">
  import { ChevronLeft, ChevronRight, Dices, MoreHorizontal, RotateCcw, ScrollText, Swords } from 'lucide-svelte';
  import { GoldfishSimulator, type SimCard, type SimTurnAction, type SimTurnSnapshot } from '$lib/engine/goldfish';
  import type { DeckCard } from './types';

  let { cards, commander } = $props<{ cards: DeckCard[]; commander: DeckCard }>();
  const simulatorCards: SimCard[] = [
    ...cards.map((card) => ({
      id: card.id,
      name: card.name,
      typeLine: card.typeLine,
      cmc: card.cmc,
      manaCost: card.manaCost,
      oracleText: card.oracleText,
      category: card.role
    })),
    { id: commander.id, name: commander.name, typeLine: commander.typeLine, cmc: commander.cmc, manaCost: commander.manaCost, oracleText: commander.oracleText, category: 'commander', isCommander: true }
  ];

  let simulator = $state.raw(new GoldfishSimulator(simulatorCards));
  let selectedTurn = $state(0);
  let activeTab = $state<'hand' | 'sequence'>('hand');
  let kept = $state(false);
  let handCards = $state<SimCard[]>([...simulator.hand]);
  let battlefieldCards = $state<SimCard[]>([]);
  let graveyardCards = $state<SimCard[]>([]);
  let commandZoneCards = $state<SimCard[]>([...simulator.commandZone]);
  let snapshots = $state<SimTurnSnapshot[]>([]);
  let turnActions = $state<SimTurnAction[]>([]);
  let manaAvailable = $state(0);
  let manaCapacity = $state(0);
  let libraryCount = $state(simulator.library.length);
  let handAdvice = $state(simulator.evaluateHand());
  let visibleHand = $derived(selectedTurn === simulator.turnNumber ? handCards.map((card) => card.name) : snapshots.find((snapshot) => snapshot.turnNumber === selectedTurn)?.hand ?? handCards.map((card) => card.name));
  let visibleBattlefield = $derived(selectedTurn === simulator.turnNumber ? battlefieldCards.map((card) => card.name) : snapshots.find((snapshot) => snapshot.turnNumber === selectedTurn)?.battlefield ?? []);
  let visibleActions = $derived(selectedTurn === simulator.turnNumber ? turnActions : snapshots.find((snapshot) => snapshot.turnNumber === selectedTurn)?.actions ?? []);

  function syncFromSimulator(): void {
    handCards = [...simulator.hand];
    battlefieldCards = [...simulator.battlefield];
    graveyardCards = [...simulator.graveyard];
    commandZoneCards = [...simulator.commandZone];
    snapshots = [...simulator.turnSnapshots];
    manaAvailable = simulator.manaAvailable;
    manaCapacity = simulator.manaCapacity;
    libraryCount = simulator.library.length;
    handAdvice = simulator.evaluateHand();
  }

  function resetHand(): void {
    simulator = new GoldfishSimulator(simulatorCards);
    selectedTurn = 0;
    turnActions = [];
    kept = false;
    syncFromSimulator();
  }

  function mulligan(): void {
    if (simulator.turnNumber > 0) return;
    simulator.mulligan();
    kept = false;
    syncFromSimulator();
  }

  function advanceTurn(): void {
    if (!kept || simulator.turnNumber >= 5) return;
    turnActions = simulator.autoPlayTurn();
    selectedTurn = simulator.turnNumber;
    activeTab = 'hand';
    syncFromSimulator();
  }

  function selectTurn(turn: number): void {
    if (turn > simulator.turnNumber) {
      if (!kept) return;
      while (simulator.turnNumber < turn && simulator.turnNumber < 5) simulator.autoPlayTurn();
      syncFromSimulator();
    }
    selectedTurn = Math.min(turn, simulator.turnNumber);
    turnActions = snapshots.find((snapshot) => snapshot.turnNumber === selectedTurn)?.actions ?? [];
  }

  function playCard(cardName: string): void {
    if (selectedTurn === 0 || selectedTurn !== simulator.turnNumber) return;
    const card = simulator.hand.find((item) => item.name === cardName);
    if (!card) return;
    const isLand = /land/i.test(card.typeLine);
    const played = isLand ? simulator.playLand(card.id) : simulator.castSpell(card.id);
    if (!played) return;
    syncFromSimulator();
    recordManualAction({
      action: isLand ? 'play_land' : 'cast_spell',
      cardName: card.name,
      description: isLand ? `Manually played ${card.name}.` : `Manually cast ${card.name}.`
    });
  }

  function castCommander(): void {
    const card = simulator.commandZone[0];
    if (card && simulator.castSpell(card.id, true)) {
      syncFromSimulator();
      recordManualAction({ action: 'cast_spell', cardName: card.name, description: `Cast commander ${card.name}.` });
    }
  }

  function recordManualAction(action: SimTurnAction): void {
    turnActions = [...turnActions, action];
    snapshots = snapshots.map((snapshot) => snapshot.turnNumber === selectedTurn
      ? { ...snapshot, hand: handCards.map((card) => card.name), battlefield: battlefieldCards.map((card) => card.name), graveyard: graveyardCards.map((card) => card.name), manaCapacity, manaAvailable, actions: turnActions }
      : snapshot);
  }
</script>

<section class="bench">
  <div class="bench-heading">
    <div><div class="bench-kicker">GOLDFISH BENCH</div><h3>Opening line</h3></div>
    <div class="bench-actions"><button class="bench-icon" title="Reset simulation" aria-label="Reset simulation" onclick={resetHand}><RotateCcw size={14} /></button><button class="bench-icon" title="Deal a new hand" aria-label="Deal a new hand" onclick={resetHand}><Dices size={14} /></button></div>
  </div>

  <div class="turn-strip" aria-label="Select turn">
    {#each [1, 2, 3, 4, 5] as turn}
      <button class:current={selectedTurn === turn} class:played={turn <= simulator.turnNumber && turn !== selectedTurn} onclick={() => selectTurn(turn)} disabled={turn > simulator.turnNumber + 1 || (turn > simulator.turnNumber && !kept)} aria-label={`Turn ${turn}`}>
        <span>TURN</span><strong>{turn}</strong>
      </button>
    {/each}
  </div>

  <div class="board-summary">
    <div><span class="summary-label">Available mana</span><strong>{manaAvailable}<small> / {manaCapacity}</small></strong></div>
    <div><span class="summary-label">Battlefield</span><strong>{visibleBattlefield.length}<small> permanents</small></strong></div>
    <button title="More simulation options" aria-label="More simulation options"><MoreHorizontal size={16} /></button>
  </div>

  <div class="bench-tabs" role="tablist" aria-label="Simulation details">
    <button class:tab-active={activeTab === 'hand'} role="tab" aria-selected={activeTab === 'hand'} onclick={() => activeTab = 'hand'}><Swords size={13} /> Hand & board</button>
    <button class:tab-active={activeTab === 'sequence'} role="tab" aria-selected={activeTab === 'sequence'} onclick={() => activeTab = 'sequence'}><ScrollText size={13} /> Sequence</button>
  </div>

  {#if activeTab === 'hand'}
    <div class="hand-area">
      <div class="hand-advice" class:advice-good={handAdvice.quality === 'Excellent' || handAdvice.quality === 'Good'} class:advice-risky={handAdvice.quality === 'Risky' || handAdvice.quality === 'Unplayable'}>
        <div><strong>{handAdvice.quality}</strong><span>{handAdvice.recommendation}</span></div>
        {#if simulator.turnNumber === 0}
          <div class="advice-actions"><button class="bench-action" onclick={mulligan}>Mulligan <small>{simulator.mulliganCount}</small></button><button class="bench-action keep-action" class:kept onclick={() => kept = true}>{kept ? 'Hand kept' : 'Keep hand'}</button></div>
        {/if}
      </div>
      <div class="section-label">{selectedTurn === 0 ? 'OPENING HAND' : `TURN ${selectedTurn} HAND`} <span>{visibleHand.length} cards · {libraryCount} in library</span></div>
      <div class="hand-grid">
        {#each visibleHand as cardName, i}
          <button class="hand-card" title={selectedTurn > 0 && selectedTurn === simulator.turnNumber ? `Play ${cardName}` : cardName} onclick={() => playCard(cardName)} disabled={selectedTurn === 0 || selectedTurn !== simulator.turnNumber}>
            <div class={`hand-art art-${i % 5}`}><img src={`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}&format=image&version=small`} alt="" loading="lazy" /></div>
            <div class="hand-name">{cardName}</div>
          </button>
        {/each}
      </div>
      <div class="section-label battlefield-label">BATTLEFIELD <span>{visibleBattlefield.length} permanents</span></div>
      <div class="battlefield">
        {#if visibleBattlefield.length === 0}
          <span class="empty-board">No permanents on the battlefield</span>
        {:else}
          {#each visibleBattlefield as cardName, i}
            <div class="permanent"><span class={`mana-swatch swatch-${i % 4}`}></span>{cardName}</div>
          {/each}
        {/if}
      </div>
      {#if commandZoneCards.length > 0}
        <button class="commander-cast" onclick={castCommander} disabled={simulator.turnNumber === 0 || manaAvailable < commander.cmc}>Cast {commander.name} from command zone <span>{commander.cmc} mana</span></button>
      {/if}
      {#if graveyardCards.length > 0}<div class="graveyard-line">Graveyard <span>{graveyardCards.map((card) => card.name).join(' · ')}</span></div>{/if}
    </div>
  {:else}
    <div class="sequence-list">
      {#each visibleActions as action, i}
        <div class="sequence-step"><span class={`step-marker tone-${action.action}`}>{i + 1}</span><span class="step-copy"><strong>{action.cardName ?? action.action}</strong><small>{action.description}</small></span><span class="step-turn">T{selectedTurn}</span></div>
      {/each}
      {#if visibleActions.length === 0}<div class="empty-board">Keep a hand and advance a turn to build the sequence.</div>{/if}
    </div>
  {/if}

  <div class="bench-footer"><span class="simulation-state"><i></i> {selectedTurn === 0 ? 'Opening hand ready' : `${simulator.turnNumber} of 5 turns simulated`}</span><div><button class="advance" disabled={selectedTurn <= 1} onclick={() => selectTurn(selectedTurn - 1)} aria-label="Previous turn"><ChevronLeft size={14} /></button><button class="advance next-turn" disabled={!kept || simulator.turnNumber >= 5} onclick={advanceTurn} aria-label="Advance turn">Advance <ChevronRight size={14} /></button></div></div>
</section>

<style>
  .bench { padding: 13px; }
  .bench-heading { display: flex; align-items: center; justify-content: space-between; }
  .bench-kicker { color: #71717a; font-family: var(--mono); font-size: 8px; letter-spacing: .1em; }
  h3 { margin: 4px 0 0; color: #e4e4e7; font-size: 14px; font-weight: 600; }
  .bench-actions { display: flex; gap: 3px; }
  .bench-icon { display: grid; width: 27px; height: 27px; place-items: center; border: 1px solid #303036; border-radius: 5px; background: #19191d; color: #92929c; cursor: pointer; }
  .bench-icon:hover { color: #e4e4e7; }
  .turn-strip { display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px; margin: 14px 0 12px; }
  .turn-strip button { display: grid; min-height: 42px; place-content: center; gap: 2px; border: 1px solid #2d2d33; border-radius: 5px; background: #141417; color: #666671; cursor: pointer; }
  .turn-strip button span { font-family: var(--mono); font-size: 7px; }
  .turn-strip button strong { font-family: var(--mono); font-size: 12px; font-weight: 500; }
  .turn-strip button.current { border-color: rgba(56, 189, 248, .45); background: rgba(14, 116, 144, .17); color: #7dd3fc; }
  .turn-strip button.played { color: #a1a1aa; }
  .board-summary { display: grid; grid-template-columns: 1fr 1fr 24px; align-items: center; padding: 9px 10px; border: 1px solid #29292e; border-radius: 5px; background: #141417; }
  .board-summary > div { display: grid; gap: 4px; }
  .summary-label { color: #71717a; font-size: 9px; }
  .board-summary strong { color: #e4e4e7; font-family: var(--mono); font-size: 12px; font-weight: 500; }
  .board-summary small { color: #74747e; font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 400; }
  .board-summary button { display: grid; width: 24px; height: 24px; place-items: center; border: 0; background: transparent; color: #777780; }
  .bench-tabs { display: flex; gap: 13px; margin-top: 14px; border-bottom: 1px solid #29292e; }
  .bench-tabs button { display: inline-flex; align-items: center; gap: 6px; padding: 0 1px 8px; border: 0; border-bottom: 1px solid transparent; background: transparent; color: #777780; font-size: 9px; cursor: pointer; }
  .bench-tabs button.tab-active { border-bottom-color: #38bdf8; color: #c4c4cb; }
  .hand-area { padding-top: 12px; }
  .section-label { display: flex; justify-content: space-between; color: #777780; font-family: var(--mono); font-size: 8px; letter-spacing: .04em; }
  .section-label span { color: #5e5e68; }
  .hand-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px 5px; margin-top: 9px; }
  .hand-card { min-width: 0; padding: 0; border: 0; background: transparent; text-align: left; cursor: pointer; }
  .hand-card:disabled { cursor: default; }
  .hand-art { display: grid; aspect-ratio: 1.1 / .72; place-items: center; overflow: hidden; border: 1px solid rgba(255,255,255,.08); border-radius: 4px; background: linear-gradient(135deg, #1a3d44, #18211f 58%, #402a22); }
  .hand-art span { color: rgba(255,255,255,.3); font-size: 21px; font-weight: 700; }
  .hand-art img { width: 100%; height: 100%; object-fit: cover; }
  .art-1 { background: linear-gradient(135deg, #5a4632, #253642 55%, #22201d); }.art-2 { background: linear-gradient(135deg, #4b315b, #262330 60%, #343f2e); }.art-3 { background: linear-gradient(135deg, #5b5b43, #252927 55%, #153847); }.art-4 { background: linear-gradient(135deg, #42563f, #26312b 55%, #4e372c); }
  .hand-name { display: -webkit-box; min-height: 22px; overflow: hidden; margin-top: 4px; color: #a1a1aa; font-size: 8px; line-height: 1.25; text-overflow: ellipsis; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .battlefield-label { margin-top: 13px; }
  .battlefield { display: flex; min-height: 50px; flex-wrap: wrap; align-content: center; gap: 5px; margin-top: 7px; padding: 7px; border: 1px dashed #34343a; border-radius: 5px; background: rgba(9, 9, 11, .3); }
  .empty-board { width: 100%; color: #5f5f69; font-size: 9px; text-align: center; }
  .permanent { display: flex; max-width: 100%; align-items: center; gap: 5px; padding: 5px 6px; border: 1px solid #38383e; border-radius: 4px; background: #1c1c20; color: #b8b8c0; font-size: 8px; }
  .mana-swatch { width: 7px; height: 7px; flex: 0 0 auto; border-radius: 50%; background: #38bdf8; }.swatch-1 { background: #22c55e; }.swatch-2 { background: #a855f7; }.swatch-3 { background: #ef4444; }
  .sequence-list { display: grid; min-height: 235px; align-content: start; padding: 7px 0; }
  .sequence-step { display: grid; grid-template-columns: 20px 1fr 24px; align-items: center; gap: 8px; padding: 9px 3px; border-bottom: 1px solid #242428; }
  .step-marker { display: grid; width: 18px; height: 18px; place-items: center; border: 1px solid #3d3d44; border-radius: 50%; color: #a1a1aa; font-family: var(--mono); font-size: 8px; }
  .tone-engine { border-color: #745299; color: #c084fc; }.tone-land { border-color: #42604c; color: #86efac; }.tone-spell { border-color: #39738a; color: #7dd3fc; }
  .step-copy { display: grid; gap: 3px; }.step-copy strong { color: #c4c4cb; font-size: 9px; }.step-copy small { color: #777780; font-size: 8px; }
  .step-turn { color: #666671; font-family: var(--mono); font-size: 8px; text-align: right; }
  .bench-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 11px; border-top: 1px solid #25252a; }
  .simulation-state { display: inline-flex; align-items: center; gap: 6px; color: #777780; font-size: 9px; }
  .simulation-state i { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; }
  .bench-footer > div { display: flex; gap: 4px; }
  .advance { display: grid; width: 26px; height: 25px; place-items: center; border: 1px solid #34343a; border-radius: 4px; background: #19191d; color: #c4c4cb; cursor: pointer; }
  .advance:disabled { color: #484850; cursor: default; }
  .hand-advice { display:flex; align-items:center; justify-content:space-between; gap:8px; margin:10px 0; padding:8px; border:1px solid #3b3b35; border-radius:5px; background:#1c1a12; }
  .hand-advice.advice-good { border-color:#28543d; background:#101d17; }
  .hand-advice>div:first-child { display:grid; gap:3px; }
  .hand-advice strong { color:#fbbf24; font:9px var(--mono); text-transform:uppercase; }
  .advice-good strong { color:#86efac; }
  .hand-advice span { color:#a1a1aa; font-size:8px; line-height:1.4; }
  .advice-actions { display:flex; flex:0 0 auto; gap:4px; }
  .bench-action { min-height:25px; padding:0 6px; border:1px solid #3b3b42; border-radius:4px; background:#202024; color:#b8b8c0; font-size:8px; cursor:pointer; }
  .bench-action small { color:#777780; }
  .keep-action.kept { border-color:#2f6548; color:#86efac; }
  .commander-cast { display:flex; width:100%; justify-content:space-between; margin-top:8px; padding:8px; border:1px solid #34343a; border-radius:4px; background:#19191d; color:#c4c4cb; font-size:8px; cursor:pointer; }
  .commander-cast:disabled { color:#666671; cursor:default; }
  .commander-cast span { color:#777780; font-family:var(--mono); }
  .graveyard-line { display:grid; gap:4px; margin-top:9px; color:#777780; font:8px var(--mono); }
  .graveyard-line span { color:#a1a1aa; font-family:'Space Grotesk',sans-serif; }
  .tone-play_land { border-color:#42604c; color:#86efac; }.tone-cast_spell { border-color:#39738a; color:#7dd3fc; }.tone-draw { border-color:#745299; color:#c084fc; }
  .next-turn { display:flex; width:auto; gap:4px; padding:0 8px; font-size:8px; }
  @media (max-width: 500px) { .hand-advice { align-items:start; flex-direction:column; }.advice-actions { width:100%; }.advice-actions button { flex:1; } }
</style>
