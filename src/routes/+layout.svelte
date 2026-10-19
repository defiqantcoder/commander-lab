<script lang="ts">
  import '../app.css';
  import '@xyflow/svelte/dist/style.css';
  import { Activity, ChevronDown, Command, Layers3, Search, Sparkles } from 'lucide-svelte';

  let { children } = $props();
  let searchTerm = $state('');
</script>

<div class="app-shell">
  <header class="topbar">
    <a class="brand" href="/" aria-label="Commander Lab home">
      <span class="brand-mark"><Command size={16} strokeWidth={1.8} /></span>
      <span><span class="brand-name">COMMANDER LAB</span><span class="brand-caption">Deck architecture studio</span></span>
    </a>
    <label class="commander-search"><Search size={14} /><input bind:value={searchTerm} placeholder="Find a commander or deck..." aria-label="Find a commander or deck" /><span class="shortcut">⌘ K</span></label>
    <nav class="header-archetypes" aria-label="Deck archetypes"><span class="archetype-chip active"><Sparkles size={11} /> Proliferate</span><span class="archetype-chip">+1/+1 counters</span><span class="archetype-chip">Midrange</span></nav>
    <div class="header-status"><span class="header-stat deck-stat"><Layers3 size={12} /><strong>01</strong> deck</span><span class="header-stat"><span class="status-dot"></span> Local</span><button class="profile-button" aria-label="Workspace status"><Activity size={14} /><ChevronDown size={11} /></button></div>
  </header>
  {@render children()}
</div>

<style>
  .shortcut { padding: 2px 5px; border: 1px solid #303036; border-radius: 3px; color: #71717a; font-family: var(--mono); font-size: 8px; white-space: nowrap; }
  .profile-button { display: inline-flex; height: 30px; align-items: center; gap: 4px; padding: 0 7px; border: 1px solid var(--line); border-radius: 4px; background: #151518; color: #a1a1aa; }
  @media (max-width: 640px) { .shortcut, .profile-button { display: none; } }
</style>
