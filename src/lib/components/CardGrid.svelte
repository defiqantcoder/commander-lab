<script lang="ts">
  import { LayoutGrid, List } from 'lucide-svelte';
  import CardRow from './CardRow.svelte';
  import { manaSymbols, type DeckCard } from './types';

  export let cards: DeckCard[] = [];
  export let onselect: (card: DeckCard) => void = () => {};
  export let view: 'grid' | 'list' = 'grid';
</script>

<div class="card-list" class:list-mode={view === 'list'}>
  {#if view === 'grid'}
    {#each cards as card (card.id)}
      <button class="grid-card" onclick={() => onselect(card)} aria-label={`View ${card.name}`}>
        <span class="art-frame">
          <img src={`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(card.name)}&format=image&version=normal`} alt={`${card.name} card art`} loading="lazy" />
          {#if card.foil}<span class="foil-tag">FOIL</span>{/if}
          <span class="quantity-tag">×{card.quantity}</span>
        </span>
        <span class="card-info">
          <span class="card-heading"><strong>{card.name}</strong><span class="price">${(card.currentPriceUsd ?? 0).toFixed(2)}</span></span>
          <span class="card-subheading"><span class="mana-pips">{#each manaSymbols(card.manaCost) as pip}<i class={`mana-pip pip-${pip.toLowerCase()}`}>{pip}</i>{/each}</span><span class="dot-separator">·</span><span>{card.typeLine}</span></span>
          <span class="role-label">{card.role}</span>
        </span>
      </button>
    {/each}
  {:else}
    <div class="list-header"><span>Card</span><span>Cost</span><span>Role</span><span>Qty</span><span>Market</span></div>
    {#each cards as card (card.id)}
      <CardRow {card} {onselect} />
    {/each}
  {/if}
  {#if cards.length === 0}
    <div class="empty-state">No cards match these filters.</div>
  {/if}
</div>

<style>
  .card-list { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; padding: 12px; }
  .grid-card { min-width: 0; overflow: hidden; padding: 0; border: 1px solid #2b2b30; border-radius: 6px; background: #141417; text-align: left; cursor: pointer; transition: transform .16s ease, border-color .16s ease, background .16s ease; }
  .grid-card:hover { transform: translateY(-2px); border-color: #52525b; background: #1a1a1e; }
  .art-frame { position: relative; display: block; overflow: hidden; aspect-ratio: 1.42 / 1; background: radial-gradient(ellipse at 45% 20%, #31313a, #141417 72%); }
  .art-frame img { width: 100%; height: 100%; object-fit: cover; transition: transform .3s ease; }
  .grid-card:hover .art-frame img { transform: scale(1.035); }
  .foil-tag, .quantity-tag { position: absolute; top: 7px; padding: 4px 6px; border: 1px solid rgba(255,255,255,.18); border-radius: 4px; background: rgba(9, 9, 11, .8); font-family: var(--mono); font-size: 8px; }
  .foil-tag { left: 7px; color: #f0abfc; }
  .quantity-tag { right: 7px; color: #e4e4e7; }
  .card-info { display: grid; gap: 6px; padding: 9px; }
  .card-heading { display: flex; min-width: 0; justify-content: space-between; gap: 6px; }
  .card-heading strong { overflow: hidden; color: #e4e4e7; font-size: 10px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
  .price { flex: 0 0 auto; color: #a3e635; font-family: var(--mono); font-size: 9px; }
  .card-subheading { display: flex; min-width: 0; gap: 5px; overflow: hidden; color: #777780; font-size: 9px; white-space: nowrap; }
  .card-subheading span:last-child { overflow: hidden; text-overflow: ellipsis; }
  .mana-pips { display: inline-flex; flex: 0 0 auto; align-items: center; gap: 2px; }
  .mana-pip { display: grid; min-width: 13px; height: 13px; place-items: center; padding: 0 2px; border: 1px solid #66666d; border-radius: 50%; background: #deded9; color: #18181b; font-size: 7px; font-style: normal; line-height: 1; }
  .pip-w { background: #f9fafb; }.pip-u { border-color: #38bdf8; background: #0369a1; color: #e0f2fe; }.pip-b { border-color: #a855f7; background: #27202d; color: #e9d5ff; }.pip-r { border-color: #ef4444; background: #7f1d1d; color: #fee2e2; }.pip-g { border-color: #22c55e; background: #14532d; color: #dcfce7; }
  .dot-separator { color: #52525b; }
  .role-label { color: #8d8d97; font-family: var(--mono); font-size: 8px; text-transform: uppercase; }
  .list-mode { display: block; padding: 0 0 4px; }
  .list-header { display: grid; grid-template-columns: minmax(130px, 1fr) 70px 88px 32px 62px; gap: 10px; padding: 9px 12px; border-bottom: 1px solid #2b2b30; color: #666671; font-family: var(--mono); font-size: 8px; text-transform: uppercase; }
  .list-header span:first-child { grid-column: 1; }
  .list-header span:nth-child(2) { grid-column: 2; }
  .list-header span:nth-child(3) { grid-column: 3; }
  .list-header span:nth-child(4) { grid-column: 4; }
  .list-header span:nth-child(5) { grid-column: 5; text-align: right; }
  .empty-state { padding: 34px 15px; color: #71717a; font-size: 12px; text-align: center; }
  @media (max-width: 1100px) { .card-list:not(.list-mode) { grid-template-columns: repeat(5, minmax(0, 1fr)); } }
  @media (max-width: 760px) { .card-list:not(.list-mode) { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; padding: 9px; } .card-info { padding: 7px; } .card-heading strong { font-size: 9px; } }
  @media (max-width: 420px) { .card-list:not(.list-mode) { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
