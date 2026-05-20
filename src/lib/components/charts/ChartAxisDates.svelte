<script lang="ts">
  import { getContext } from 'svelte';
  import type { Readable } from 'svelte/store';
  import type { ScaleTime } from 'd3-scale';

  let { ticks = 3 }: { ticks?: number } = $props();

  const { height, xScale } = getContext<{
    height: Readable<number>;
    xScale: Readable<ScaleTime<number, number>>;
  }>('LayerCake');

  const tickValues = $derived($xScale.ticks(ticks));

  function fmt(d: Date): string {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
</script>

<g class="chart-axis-dates" transform="translate(0, {$height})">
  {#each tickValues as tick (tick.getTime())}
    <text
      class="chart-axis-dates-label"
      x={$xScale(tick)}
      y="14"
      text-anchor="middle"
    >
      {fmt(tick)}
    </text>
  {/each}
</g>

<style>
  .chart-axis-dates-label {
    font-size: 10px;
    fill: var(--color-fg-faint);
    font-feature-settings: 'tnum';
  }
</style>
