<script lang="ts">
  import { getContext } from 'svelte';
  import type { Readable } from 'svelte/store';
  import type { ScaleLinear } from 'd3-scale';

  let { ticks = 4, format = (d: number) => d.toFixed(0) }: { ticks?: number; format?: (d: number) => string } =
    $props();

  const { width, yScale } = getContext<{
    width: Readable<number>;
    yScale: Readable<ScaleLinear<number, number>>;
  }>('LayerCake');

  const tickValues = $derived($yScale.ticks(ticks));
</script>

<g class="chart-axis-y">
  {#each tickValues as tick (tick)}
    <g class="chart-axis-y-tick" transform="translate(0, {$yScale(tick)})">
      <line class="chart-axis-y-line" x1="0" x2={$width} />
      <text class="chart-axis-y-label" x="-6" y="0" dy="0.32em" text-anchor="end">
        {format(tick)}
      </text>
    </g>
  {/each}
</g>

<style>
  .chart-axis-y-line {
    stroke: var(--color-line);
    stroke-dasharray: 2 3;
  }
  .chart-axis-y-label {
    font-size: 10px;
    fill: var(--color-fg-faint);
    font-feature-settings: 'tnum';
  }
</style>
