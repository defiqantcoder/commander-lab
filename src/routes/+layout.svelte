<script lang="ts">
  import '../app.css';
  import '@xyflow/svelte/dist/style.css';
  import { Command, Database, ShieldCheck, Sparkles } from 'lucide-svelte';

  let { children } = $props();
</script>

<div class="app-shell">
  <header class="topbar">
    <div class="topbar-left">
      <a class="brand" href="/" aria-label="Commander Lab home">
        <span class="brand-mark"><Command size={16} strokeWidth={2} /></span>
        <div class="brand-text">
          <span class="brand-name">COMMANDER LAB</span>
          <span class="brand-caption">Local Deck Architecture</span>
        </div>
      </a>
      <span class="version-badge">PWA v0.4</span>
    </div>

    <div class="topbar-right">
      <div class="status-pill" title="All collection cards and decks are stored locally in your browser via IndexedDB">
        <span class="status-dot"></span>
        <Database size={12} />
        <span>Local-First (Dexie)</span>
      </div>
      <div class="status-pill privacy-pill" title="Zero third-party tracking. Direct client-to-API communication.">
        <ShieldCheck size={12} />
        <span>Zero Telemetry</span>
      </div>
    </div>
  </header>
  {@render children()}
</div>

<style>
  .topbar-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .version-badge {
    padding: 3px 7px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.03);
    color: #9496a8;
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.04em;
  }
  .topbar-right {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: auto;
  }
  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    background: rgba(22, 24, 34, 0.7);
    color: #a0a4b8;
    font-family: var(--mono);
    font-size: 10px;
  }
  .status-pill :global(svg) {
    color: #7dd3fc;
  }
  .privacy-pill :global(svg) {
    color: #4ade80;
  }
  @media (max-width: 640px) {
    .version-badge, .privacy-pill {
      display: none;
    }
    .status-pill {
      padding: 4px 7px;
      font-size: 9px;
    }
  }
</style>
