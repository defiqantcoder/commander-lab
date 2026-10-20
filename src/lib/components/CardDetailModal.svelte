<script lang="ts">
  import { ArrowDownRight, ExternalLink, Sparkles, X } from 'lucide-svelte';
  import type { DeckCard } from './types';

  export let card: DeckCard | null = null;
  export let inDeck = false;
  export let ontoggle: (card: DeckCard) => void = () => {};
  export let onclose: () => void = () => {};

  function focusDialog(node: HTMLDialogElement): { destroy?: () => void } {
    node.focus();
    return {};
  }

  function handleDialogKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      onclose();
    }
  }
</script>

{#if card}
  <div class="scrim" role="presentation" onclick={(event) => event.target === event.currentTarget && onclose()}>
    <dialog open autofocus tabindex="-1" use:focusDialog class="detail-modal" aria-modal="true" aria-labelledby="detail-title" onkeydown={handleDialogKeydown}>
      <button class="close icon-button" onclick={onclose} aria-label="Close card details"><X size={17} /></button>
      <div class="detail-art">
        <img src={`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(card.name)}&format=image&version=normal`} alt={`${card.name} card image`} />
        <span class="art-caption">SCRYFALL · {card.set.toUpperCase()} #{card.collectorNumber}</span>
      </div>
      <div class="detail-copy">
        <div class="eyebrow">{card.typeLine}</div>
        <h2 id="detail-title">{card.name}</h2>
        <div class="meta-row"><span class="mana">{card.manaCost}</span><span class="role">{card.role}</span><span class="edition">{card.set.toUpperCase()}</span></div>
        <div class="detail-price"><span>Market price</span><strong>${(card.currentPriceUsd ?? 0).toFixed(2)}</strong>{#if card.foil}<span class="foil"><Sparkles size={13} /> Foil</span>{/if}</div>
        <button class="deck-toggle" class:in-deck={inDeck} onclick={() => ontoggle(card)}>{inDeck ? 'Remove from deck' : 'Add to deck'}</button>
        <section class="note-block">
          <div class="block-title"><Sparkles size={14} /> Synergy note</div>
          <p>{card.synergyNotes ?? 'Supports the deck’s core plan by adding another layer of value to the counter and proliferate engine.'}</p>
        </section>
        <section class="replacement-block">
          <div class="block-title"><ArrowDownRight size={14} /> Budget alternative</div>
          <div class="replacement-line"><strong>{card.budgetReplacement ?? 'Evolution Sage'}</strong><span>Similar role · lower market price</span></div>
        </section>
        <a class="scryfall-link" href={`https://scryfall.com/search?q=${encodeURIComponent(card.name)}`} target="_blank" rel="noreferrer">Open on Scryfall <ExternalLink size={13} /></a>
      </div>
    </dialog>
  </div>
{/if}

<style>
  .scrim { position: fixed; z-index: 50; inset: 0; display: grid; place-items: center; padding: 20px; background: rgba(0, 0, 0, .78); backdrop-filter: blur(8px); }
  .detail-modal { position: relative; display: grid; width: min(760px, 100%); max-height: min(620px, 92vh); grid-template-columns: minmax(230px, .8fr) 1fr; overflow: auto; margin: 0; padding: 0; border: 1px solid #3f3f46; border-radius: 9px; background: #131316; color: inherit; box-shadow: 0 24px 90px rgba(0,0,0,.5); animation: rise-in .2s ease both; }
  .close { position: absolute; z-index: 2; top: 10px; right: 10px; border-color: rgba(255,255,255,.13); background: rgba(9,9,11,.72); color: #e4e4e7; }
  .detail-art { position: relative; min-height: 360px; overflow: hidden; background: #202024; }
  .detail-art img { width: 100%; height: 100%; position: absolute; object-fit: cover; }
  .art-caption { position: absolute; right: 10px; bottom: 10px; left: 10px; color: rgba(255,255,255,.76); font-family: var(--mono); font-size: 8px; text-shadow: 0 1px 5px #000; }
  .detail-copy { display: flex; flex-direction: column; padding: 28px 24px 22px; }
  h2 { margin: 6px 32px 10px 0; color: #fafafa; font-size: 22px; line-height: 1.15; }
  .meta-row { display: flex; align-items: center; gap: 8px; }
  .mana, .role, .edition { padding: 5px 7px; border: 1px solid #34343a; border-radius: 4px; color: #c4c4cb; font-family: var(--mono); font-size: 9px; text-transform: uppercase; }
  .role { color: #7dd3fc; }
  .detail-price { display: flex; align-items: center; gap: 10px; margin: 22px 0 16px; padding: 11px 0; border-block: 1px solid #29292e; color: #8d8d97; font-size: 11px; }
  .detail-price strong { margin-left: auto; color: #bef264; font-family: var(--mono); font-size: 14px; font-weight: 500; }
  .deck-toggle { min-height:32px; margin:0 0 17px; border:1px solid #3f3f46; border-radius:5px; background:#1b1b20; color:#d4d4d8; font-size:10px; cursor:pointer; }
  .deck-toggle:hover { border-color:#38bdf8; color:#bae6fd; }
  .deck-toggle.in-deck { border-color:#28543d; color:#86efac; }
  .foil { display: inline-flex; align-items: center; gap: 4px; color: #e879f9; font-size: 10px; }
  .note-block, .replacement-block { margin-bottom: 16px; }
  .block-title { display: flex; align-items: center; gap: 7px; color: #d4d4d8; font-size: 11px; font-weight: 600; }
  .block-title :global(svg) { color: #7dd3fc; }
  p { margin: 7px 0 0; color: #92929c; font-size: 11px; line-height: 1.6; }
  .replacement-line { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 9px; padding: 10px; border: 1px solid #2e2e34; border-radius: 5px; background: #19191d; }
  .replacement-line strong { color: #e4e4e7; font-size: 11px; }
  .replacement-line span { color: #777780; font-size: 9px; text-align: right; }
  .scryfall-link { display: inline-flex; align-items: center; gap: 6px; margin-top: auto; padding-top: 16px; color: #7dd3fc; font-size: 10px; }
  @media (max-width: 560px) { .scrim { align-items: end; padding: 0; } .detail-modal { width: 100%; max-height: 92vh; grid-template-columns: 100px minmax(0, 1fr); border-radius: 10px 10px 0 0; } .detail-art { min-height: 150px; } .detail-copy { padding: 20px 14px 18px; } h2 { font-size: 17px; } .replacement-line { align-items: start; flex-direction: column; gap: 4px; } .replacement-line span { text-align: left; } }
</style>
