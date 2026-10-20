<script lang="ts">
  import { Background, BackgroundVariant, Controls, MiniMap, SvelteFlow } from '@xyflow/svelte';
  import { Focus, GitBranch } from 'lucide-svelte';
  import { writable } from 'svelte/store';
  import { generateSynergyGraph } from '$lib/engine/synergy';
  import type { SynergyEdge, SynergyNode } from '$lib/engine/synergy';
  import type { DeckCard } from './types';

  export let cards: DeckCard[] = [];
  const nodes = writable<SynergyNode[]>([]);
  const edges = writable<SynergyEdge[]>([]);
  let nodeCount = 0;
  let edgeCount = 0;

  $: graph = generateSynergyGraph(cards.map((card) => ({
    id: card.id,
    name: card.name,
    typeLine: card.typeLine,
    oracleText: card.oracleText,
    manaCost: card.manaCost,
    cmc: card.cmc,
    category: card.role
  })));
  $: nodes.set(toFlowNodes());
  $: edges.set(graph.edges as SynergyEdge[]);
  $: nodeCount = graph.nodes.length;
  $: edgeCount = graph.edges.length;

  function toFlowNodes(): SynergyNode[] {
    return graph.nodes.map((node) => ({ ...node, type: 'default' }));
  }

  function resetPositions(): void {
    nodes.set(toFlowNodes().map((node) => ({ ...node, position: { ...node.position } })));
  }
</script>

<div class="graph-shell">
  <div class="graph-toolbar"><span><GitBranch size={13} /> ENGINE MAP</span><button onclick={resetPositions} aria-label="Reset graph layout" title="Reset graph layout"><Focus size={14} /></button></div>
  <div class="flow-stage">
    <SvelteFlow {nodes} {edges} fitView>
      <Background variant={BackgroundVariant.Dots} gap={20} />
      <Controls />
      <MiniMap pannable zoomable />
    </SvelteFlow>
  </div>
  <div class="graph-legend"><span><i class="legend-blue"></i>Enabler</span><span><i class="legend-green"></i>Engine</span><span><i class="legend-violet"></i>Payoff</span><span class="chain-count">{nodeCount} nodes · {edgeCount} links</span></div>
</div>

<style>
  .graph-shell { display: flex; min-height: 270px; flex-direction: column; }
  .graph-toolbar { display: flex; height: 34px; align-items: center; justify-content: space-between; padding: 0 10px; border-bottom: 1px solid #25252a; color: #898992; font-family: var(--mono); font-size: 8px; letter-spacing: .06em; }
  .graph-toolbar span { display: flex; align-items: center; gap: 6px; }
  .graph-toolbar :global(svg) { color: #7dd3fc; }
  .graph-toolbar button { display: grid; width: 25px; height: 25px; place-items: center; border: 0; border-radius: 4px; background: transparent; color: #8d8d97; cursor: pointer; }
  .flow-stage { height: 235px; min-height: 0; }
  .flow-stage :global(.svelte-flow) { background: #111114; }
  .flow-stage :global(.svelte-flow__node) { min-width: 115px; padding: 9px 10px; border: 1px solid #3e3e47; border-radius: 5px; background: #202024; color: #e4e4e7; font-family: 'Space Grotesk', sans-serif; font-size: 10px; box-shadow: 0 4px 14px rgba(0,0,0,.22); }
  .flow-stage :global(.svelte-flow__node-input) { border-color: #39738a; }
  .flow-stage :global(.svelte-flow__node-output) { border-color: #745299; }
  .flow-stage :global(.svelte-flow__edge-path) { stroke: #5f8294; stroke-width: 1.4; }
  .flow-stage :global(.svelte-flow__edge-text) { fill: #a1a1aa; font-size: 8px; }
  .flow-stage :global(.svelte-flow__controls) { border: 1px solid #34343a; border-radius: 5px; background: #19191d; box-shadow: none; }
  .flow-stage :global(.svelte-flow__controls-button) { width: 23px; height: 23px; border-bottom-color: #34343a; background: transparent; fill: #a1a1aa; }
  .flow-stage :global(.svelte-flow__minimap) { border: 1px solid #34343a; border-radius: 4px; background: #19191d; }
  .graph-legend { display: flex; min-height: 30px; align-items: center; gap: 10px; padding: 0 10px; border-top: 1px solid #25252a; color: #888891; font-family: var(--mono); font-size: 8px; }
  .graph-legend span { display: inline-flex; align-items: center; gap: 4px; }
  .graph-legend i { width: 6px; height: 6px; border-radius: 2px; }
  .legend-blue { background: #38bdf8; }.legend-green { background: #22c55e; }.legend-violet { background: #a855f7; }
  .chain-count { margin-left: auto; color: #5e5e68; }
</style>
