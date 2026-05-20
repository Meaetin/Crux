<script lang="ts">
  import { getContext } from 'svelte';
  import { line, curveMonotoneX } from 'd3-shape';
  import type { Readable } from 'svelte/store';

  type AccessorFn = (d: unknown) => number;
  const { data, xGet, yGet } = getContext<{
    data: Readable<unknown[]>;
    xGet: Readable<AccessorFn>;
    yGet: Readable<AccessorFn>;
  }>('LayerCake');

  const path = $derived(
    line<unknown>().x($xGet).y($yGet).curve(curveMonotoneX)($data) ?? ''
  );
</script>

<path class="weight-trend-path" d={path} />

<style>
  .weight-trend-path {
    fill: none;
    stroke: var(--color-brand);
    stroke-width: 2;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
</style>
