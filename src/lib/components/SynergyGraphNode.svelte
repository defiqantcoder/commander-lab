<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte';

  export let id: string;
  export let data: {
    label: string;
    cardName: string;
    category: string;
    role: string;
    cmc: number;
  };
  export let width: number | undefined = undefined;
  export let height: number | undefined = undefined;
  export let sourcePosition: Position | undefined = undefined;
  export let targetPosition: Position | undefined = undefined;
  export let dragHandle: string | undefined = undefined;
  export let parentId: string | undefined = undefined;
  export let type: string;
  export let dragging: boolean;
  export let zIndex: number;
  export let selectable: boolean;
  export let deletable: boolean;
  export let selected: boolean;
  export let draggable: boolean;
  export let isConnectable: boolean;
  export let positionAbsoluteX: number;
  export let positionAbsoluteY: number;

  $: tone = data.category === 'commander' ? 'commander' : data.category === 'payoff' ? 'payoff' : data.category === 'engine' ? 'engine' : 'combo';
</script>

<div class={`graph-node tone-${tone}`} class:node-dragging={dragging} aria-selected={selected} data-node-id={id} data-width={width} data-height={height} data-source-position={sourcePosition} data-target-position={targetPosition} data-drag-handle={dragHandle} data-parent-id={parentId} data-node-type={type} data-z-index={zIndex} data-selectable={selectable} data-deletable={deletable} data-draggable={draggable} data-connectable={isConnectable} data-position-x={positionAbsoluteX} data-position-y={positionAbsoluteY}>
  <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
  <span class="node-kind">{data.role}</span>
  <strong>{data.label}</strong>
  <span class="node-meta">{data.cmc > 0 ? `${data.cmc} mana value` : 'No mana cost'}</span>
  <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
</div>

<style>
  .graph-node { position: relative; display: grid; min-width: 142px; max-width: 190px; gap: 5px; padding: 10px 11px; border: 1px solid #3e3e47; border-radius: 6px; background: #202024; color: #e4e4e7; box-shadow: 0 5px 16px #0005; }
  .graph-node strong { overflow: hidden; font-size: 10px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
  .node-kind { color: #a1a1aa; font-family: var(--mono); font-size: 7px; letter-spacing: .06em; text-transform: uppercase; }
  .node-meta { color: #777780; font-family: var(--mono); font-size: 8px; }
  .tone-commander { border-color: #d4d4d8; background: linear-gradient(145deg, #28282b, #1d1d20); }
  .tone-engine { border-color: #22c55e80; }
  .tone-combo { border-color: #38bdf880; }
  .tone-payoff { border-color: #a855f780; }
  .node-dragging { box-shadow: 0 8px 24px #0008; }
  :global(.svelte-flow__handle) { width: 7px; height: 7px; border: 1px solid #09090b; background: #7dd3fc; }
  .tone-commander :global(.svelte-flow__handle) { background: #f9fafb; }
  .tone-engine :global(.svelte-flow__handle) { background: #22c55e; }
  .tone-payoff :global(.svelte-flow__handle) { background: #a855f7; }
</style>
