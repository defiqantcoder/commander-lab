<script lang="ts">
  import { Background, Controls, MiniMap, SvelteFlow } from '@xyflow/svelte';
  import { Focus, GitBranch } from 'lucide-svelte';

  let nodes = [
    { id: '1', position: { x: 10, y: 105 }, data: { label: 'Hardened Scales' }, type: 'input' },
    { id: '2', position: { x: 220, y: 105 }, data: { label: 'Counter engine' } },
    { id: '3', position: { x: 430, y: 25 }, data: { label: 'Evolution Sage' } },
    { id: '4', position: { x: 430, y: 185 }, data: { label: 'Atraxa, Praetors’ Voice' }, type: 'output' },
    { id: '5', position: { x: 640, y: 105 }, data: { label: 'Proliferate loop' } }
  ];
  let edges = [
    { id: 'e1-2', source: '1', target: '2', animated: true, label: '+1 counter' },
    { id: 'e2-3', source: '2', target: '3', label: 'landfall' },
    { id: 'e2-4', source: '2', target: '4', label: 'upkeep' },
    { id: 'e3-5', source: '3', target: '5', animated: true },
    { id: 'e4-5', source: '4', target: '5' }
  ];
</script>

<div class="graph-shell">
  <div class="graph-toolbar"><span><GitBranch size={13} /> ENGINE MAP</span><button aria-label="Fit graph to view" title="Fit graph to view"><Focus size={14} /></button></div>
  <div class="flow-stage">
    <SvelteFlow bind:nodes bind:edges fitView>
      <Background color="#34343a" gap={20} />
      <Controls />
      <MiniMap pannable zoomable />
    </SvelteFlow>
  </div>
  <div class="graph-legend"><span><i class="legend-blue"></i>Enabler</span><span><i class="legend-green"></i>Engine</span><span><i class="legend-violet"></i>Payoff</span><span class="chain-count">5 nodes · 5 links</span></div>
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
