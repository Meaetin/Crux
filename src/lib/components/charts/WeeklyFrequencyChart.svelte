<script lang="ts">
  import { LayerCake, Svg } from 'layercake';
  import { scaleBand } from 'd3-scale';
  import type { WeeklyCount } from '$lib/utils/analytics';
  import WeeklyFrequencyBars from './WeeklyFrequencyBars.svelte';
  import ChartAxisY from './ChartAxisY.svelte';
  import WeeklyFrequencyAxis from './WeeklyFrequencyAxis.svelte';

  let { counts }: { counts: WeeklyCount[] } = $props();

  const maxCount = $derived(Math.max(1, ...counts.map((c) => c.count)));
</script>

<div class="weekly-frequency-chart-container">
  {#if counts.length === 0}
    <div class="weekly-frequency-chart-empty">
      <p>No workouts yet.</p>
    </div>
  {:else}
    <LayerCake
      padding={{ top: 12, right: 14, bottom: 22, left: 26 }}
      x="week_start"
      y="count"
      xScale={scaleBand<string>().paddingInner(0.25).paddingOuter(0.1)}
      yDomain={[0, maxCount]}
      data={counts}
    >
      <Svg>
        <ChartAxisY ticks={Math.min(4, maxCount)} />
        <WeeklyFrequencyAxis />
        <WeeklyFrequencyBars />
      </Svg>
    </LayerCake>
  {/if}
</div>

<style>
  .weekly-frequency-chart-container {
    width: 100%;
    height: 180px;
    background: var(--color-surface-1);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-lg);
    padding: 4px;
  }
  .weekly-frequency-chart-empty {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-fg-muted);
    font-size: 0.875rem;
  }
</style>
