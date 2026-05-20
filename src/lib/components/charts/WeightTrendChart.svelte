<script lang="ts">
  import { LayerCake, Svg } from 'layercake';
  import { scaleTime } from 'd3-scale';
  import { extent } from 'd3-array';
  import type { BodyMetric, UnitSystem } from '$lib/db/schema';
  import { kgToLb } from '$lib/utils/units';
  import WeightTrendPath from './WeightTrendPath.svelte';
  import WeightTrendDots from './WeightTrendDots.svelte';
  import ChartAxisY from './ChartAxisY.svelte';
  import ChartAxisDates from './ChartAxisDates.svelte';

  let {
    entries,
    unitSystem
  }: {
    entries: BodyMetric[];
    unitSystem: UnitSystem;
  } = $props();

  const points = $derived(
    entries
      .filter((e) => e.weight != null)
      .map((e) => {
        const kg = e.weight as number;
        const displayWeight = unitSystem === 'metric' ? kg : kgToLb(kg);
        return {
          t: new Date(e.recorded_at).getTime(),
          w: displayWeight
        };
      })
      .sort((a, b) => a.t - b.t)
  );

  const xDomain = $derived(extent(points, (p) => p.t) as [number, number]);
  const yDomain = $derived.by<[number, number]>(() => {
    const values = points.map((p) => p.w);
    if (!values.length) return [0, 1];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = max === min ? Math.max(0.5, max * 0.02) : (max - min) * 0.15;
    return [min - pad, max + pad];
  });
</script>

<div class="weight-trend-chart-container">
  {#if points.length < 2}
    <div class="weight-trend-chart-empty">
      <p>Log {points.length === 0 ? 'one weight' : 'one more weight'} to see a trend.</p>
    </div>
  {:else}
    <LayerCake
      padding={{ top: 12, right: 14, bottom: 22, left: 38 }}
      x="t"
      y="w"
      xScale={scaleTime()}
      xDomain={xDomain}
      yDomain={yDomain}
      data={points}
    >
      <Svg>
        <ChartAxisY ticks={4} />
        <ChartAxisDates />
        <WeightTrendPath />
        <WeightTrendDots />
      </Svg>
    </LayerCake>
  {/if}
</div>

<style>
  .weight-trend-chart-container {
    width: 100%;
    height: 180px;
    background: var(--color-surface-1);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-lg);
    padding: 4px;
  }
  .weight-trend-chart-empty {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-fg-muted);
    font-size: 0.875rem;
  }
</style>
