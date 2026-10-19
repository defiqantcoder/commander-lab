<script lang="ts">
  import { ChevronLeft, ChevronRight, Dices, MoreHorizontal, RotateCcw, ScrollText, Swords } from 'lucide-svelte';

  let selectedTurn = 2;
  let activeTab: 'hand' | 'sequence' = 'hand';
  const hands = [
    ['Breeding Pool', 'Sol Ring', 'Hardened Scales', 'Forest', 'Llanowar Elves', 'Deepglow Skate', 'Cultivate'],
    ['Command Tower', 'Arcane Signet', 'Evolution Sage', 'Forest', 'Farseek', 'Atraxa, Praetors’ Voice', 'Inexorable Tide'],
    ['Temple Garden', 'Sol Ring', 'Nissa, Voice of Zendikar', 'Island', 'Plains', 'Swords to Plowshares', 'The Ozolith'],
    ['Forest', 'Counterspell', 'Blooming Marsh', 'Nature’s Lore', 'Ozolith, the Shattered Spire', 'Swamp', 'Winding Constrictor'],
    ['Drowned Catacomb', 'Flux Channeler', 'Forest', 'Arcane Signet', 'Grateful Apparition', 'Island', 'Pernicious Deed']
  ];
  const sequence = [
    { turn: 1, title: 'Land drop', text: 'Play Command Tower', tone: 'land' },
    { turn: 1, title: 'Cast spell', text: 'Sol Ring · 1 mana floating', tone: 'spell' },
    { turn: 2, title: 'Land drop', text: 'Play Forest', tone: 'land' },
    { turn: 2, title: 'Cast spell', text: 'Arcane Signet · color fixing online', tone: 'spell' },
    { turn: 3, title: 'Engine online', text: 'Cast Evolution Sage', tone: 'engine' }
  ];

  $: currentHand = hands[selectedTurn - 1];
  $: turnSequence = sequence.filter((item) => item.turn <= selectedTurn);
</script>

<section class="bench">
  <div class="bench-heading">
    <div><div class="bench-kicker">GOLDFISH BENCH</div><h3>Opening line</h3></div>
    <div class="bench-actions"><button class="bench-icon" title="Restart simulation" aria-label="Restart simulation" onclick={() => { selectedTurn = 1; activeTab = 'hand'; }}><RotateCcw size={14} /></button><button class="bench-icon" title="Draw new hand" aria-label="Draw new hand"><Dices size={14} /></button></div>
  </div>

  <div class="turn-strip" aria-label="Select turn">
    {#each [1, 2, 3, 4, 5] as turn}
      <button class:current={selectedTurn === turn} class:played={turn < selectedTurn} onclick={() => selectedTurn = turn} aria-label={`Turn ${turn}`}>
        <span>TURN</span><strong>{turn}</strong>
      </button>
    {/each}
  </div>

  <div class="board-summary">
    <div><span class="summary-label">Available mana</span><strong>{selectedTurn + 1}<small> / {selectedTurn + 1}</small></strong></div>
    <div><span class="summary-label">Battlefield</span><strong>{Math.max(0, selectedTurn * 2 - 1)}<small> permanents</small></strong></div>
    <button title="More simulation options" aria-label="More simulation options"><MoreHorizontal size={16} /></button>
  </div>

  <div class="bench-tabs" role="tablist" aria-label="Simulation details">
    <button class:tab-active={activeTab === 'hand'} role="tab" aria-selected={activeTab === 'hand'} onclick={() => activeTab = 'hand'}><Swords size={13} /> Hand & board</button>
    <button class:tab-active={activeTab === 'sequence'} role="tab" aria-selected={activeTab === 'sequence'} onclick={() => activeTab = 'sequence'}><ScrollText size={13} /> Sequence</button>
  </div>

  {#if activeTab === 'hand'}
    <div class="hand-area">
      <div class="section-label">OPENING HAND <span>7 cards</span></div>
      <div class="hand-grid">
        {#each currentHand as card, i}
          <div class="hand-card" title={card}>
            <div class={`hand-art art-${i % 5}`}><span>{card.slice(0, 1)}</span></div>
            <div class="hand-name">{card}</div>
          </div>
        {/each}
      </div>
      <div class="section-label battlefield-label">BATTLEFIELD <span>{selectedTurn > 1 ? `${selectedTurn} permanents` : 'Empty'}</span></div>
      <div class="battlefield">
        {#if selectedTurn === 1}
          <span class="empty-board">Play a card to begin the line</span>
        {:else}
          {#each currentHand.slice(0, Math.min(3, selectedTurn)) as card, i}
            <div class="permanent"><span class={`mana-swatch swatch-${i % 4}`}></span>{card}</div>
          {/each}
        {/if}
      </div>
    </div>
  {:else}
    <div class="sequence-list">
      {#each turnSequence as step, i}
        <div class="sequence-step"><span class={`step-marker tone-${step.tone}`}>{i + 1}</span><span class="step-copy"><strong>{step.title}</strong><small>{step.text}</small></span><span class="step-turn">T{step.turn}</span></div>
      {/each}
    </div>
  {/if}

  <div class="bench-footer"><span class="simulation-state"><i></i> Simulation ready</span><div><button class="advance" disabled={selectedTurn === 1} onclick={() => selectedTurn = Math.max(1, selectedTurn - 1)} aria-label="Previous turn"><ChevronLeft size={14} /></button><button class="advance" disabled={selectedTurn === 5} onclick={() => selectedTurn = Math.min(5, selectedTurn + 1)} aria-label="Advance turn"><ChevronRight size={14} /></button></div></div>
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
  .hand-card { min-width: 0; }
  .hand-art { display: grid; aspect-ratio: 1.1 / .72; place-items: center; overflow: hidden; border: 1px solid rgba(255,255,255,.08); border-radius: 4px; background: linear-gradient(135deg, #1a3d44, #18211f 58%, #402a22); }
  .hand-art span { color: rgba(255,255,255,.3); font-size: 21px; font-weight: 700; }
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
</style>
