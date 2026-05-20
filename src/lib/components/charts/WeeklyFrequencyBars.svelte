<script lang="ts">
  import { getContext } from 'svelte';
  import type { Readable } from 'svelte/store';
  import type { ScaleBand, ScaleLinear } from 'd3-scale';
  import type { WeeklyCount } from '$lib/utils/analytics';

  const { data, xScale, yScale, height } = getContext<{
    data: Readable<WeeklyCount[]>;
    xScale: Readable<ScaleBand<string>>;
    yScale: Readable<ScaleLinear<number, number>>;
    height: Readable<number>;
  }>('LayerCake');
</script>

<g class="weekly-frequency-bars">
  {#each $data as d (d.week_start)}
    {@const x = $xScale(d.week_start) ?? 0}
    {@const bw = $xScale.bandwidth()}
    {@const y = d.count === 0 ? $height : $yScale(d.count)}
    {@const h = d.count === 0 ? 0 : $height - $yScale(d.count)}
    <rect
      class="weekly-frequency-bar"
      class:weekly-frequency-bar-empty={d.count === 0}
      {x}
      {y}
      width={bw}
      height={h}
      rx="3"
    />
  {/each}
</g>

<style>
  .weekly-frequency-bar {
    fill: var(--color-brand);
  }
  .weekly-frequency-bar-empty {
    fill: var(--color-line);
  }
</style>
