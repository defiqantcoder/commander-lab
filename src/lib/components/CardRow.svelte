<script lang="ts">
  import { ArrowUpRight, Coins, Sparkles } from 'lucide-svelte';
  import { manaSymbols, type DeckCard } from './types';

  export let card: DeckCard;
  export let onselect: (card: DeckCard) => void = () => {};

  const roleTone: Record<string, string> = {
    ramp: 'green', draw: 'blue', engine: 'violet', interaction: 'red', payoff: 'amber', commander: 'white'
  };
</script>

<button class="row" onclick={() => onselect(card)} aria-label={`View ${card.name}`}>
  <span class="card-thumb">
    <img src={`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(card.name)}&format=image&version=small`} alt="" loading="lazy" />
  </span>
  <span class="card-main">
    <span class="name-line"><strong>{card.name}</strong>{#if card.foil}<Sparkles size={12} class="foil" aria-label="Foil" />{/if}</span>
    <span class="type-line">{card.typeLine}</span>
  </span>
  <span class="mana-cost">{#each manaSymbols(card.manaCost) as pip}<i class={`mana-pip pip-${pip.toLowerCase()}`}>{pip}</i>{/each}</span>
  <span class={`role role-${roleTone[card.role] ?? 'white'}`}>{card.role}</span>
  <span class="quantity">×{card.quantity}</span>
  <span class="price">${(card.currentPriceUsd ?? 0).toFixed(2)}</span>
  <span class="row-action"><ArrowUpRight size={14} /></span>
</button>

<style>
  .row { display: grid; width: 100%; grid-template-columns: 34px minmax(130px, 1fr) 70px 88px 32px 62px 20px; align-items: center; gap: 10px; padding: 8px 12px; border: 0; border-bottom: 1px solid #222226; background: transparent; text-align: left; cursor: pointer; transition: background .14s ease; }
  .row:hover { background: rgba(63, 63, 70, .2); }
  .card-thumb { width: 30px; height: 38px; overflow: hidden; border: 1px solid #3f3f46; border-radius: 4px; background: linear-gradient(145deg, #27272a, #121214); }
  .card-thumb img { width: 100%; height: 100%; object-fit: cover; }
  .card-main { display: grid; min-width: 0; gap: 3px; }
  .name-line { display: flex; min-width: 0; align-items: center; gap: 5px; color: #e4e4e7; font-size: 11px; }
  .name-line strong { overflow: hidden; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
  .type-line { overflow: hidden; color: #71717a; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
  .foil { flex: 0 0 auto; color: #f0abfc; }
  .mana-cost, .quantity, .price { color: #a1a1aa; font-family: var(--mono); font-size: 10px; white-space: nowrap; }
  .mana-cost { display: flex; align-items: center; gap: 2px; }
  .mana-pip { display: grid; min-width: 14px; height: 14px; place-items: center; padding: 0 2px; border: 1px solid #66666d; border-radius: 50%; background: #deded9; color: #18181b; font-size: 8px; font-style: normal; line-height: 1; }
  .pip-w { background: #f9fafb; }.pip-u { border-color: #38bdf8; background: #0369a1; color: #e0f2fe; }.pip-b { border-color: #a855f7; background: #27202d; color: #e9d5ff; }.pip-r { border-color: #ef4444; background: #7f1d1d; color: #fee2e2; }.pip-g { border-color: #22c55e; background: #14532d; color: #dcfce7; }
  .quantity { color: #71717a; text-align: center; }
  .price { color: #a3e635; text-align: right; }
  .role { justify-self: start; padding: 3px 6px; border: 1px solid currentColor; border-radius: 4px; font-family: var(--mono); font-size: 8px; line-height: 1; text-transform: uppercase; }
  .role-green { color: #4ade80; background: rgba(34, 197, 94, .07); }
  .role-blue { color: #7dd3fc; background: rgba(56, 189, 248, .07); }
  .role-violet { color: #c084fc; background: rgba(168, 85, 247, .08); }
  .role-red { color: #f87171; background: rgba(239, 68, 68, .07); }
  .role-amber { color: #fbbf24; background: rgba(245, 158, 11, .07); }
  .role-white { color: #e4e4e7; background: rgba(249, 250, 251, .06); }
  .row-action { color: #52525b; }
  @media (max-width: 680px) {
    .row { grid-template-columns: 32px minmax(100px, 1fr) 58px 28px 54px; gap: 7px; padding: 8px; }
    .mana-cost, .role, .row-action { display: none; }
  }
</style>
