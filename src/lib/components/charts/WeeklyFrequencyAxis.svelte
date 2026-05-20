<script lang="ts">
  import { getContext } from 'svelte';
  import type { Readable } from 'svelte/store';
  import type { ScaleBand } from 'd3-scale';

  const { data, xScale, height } = getContext<{
    data: Readable<{ week_start: string }[]>;
    xScale: Readable<ScaleBand<string>>;
    height: Readable<number>;
  }>('LayerCake');

  function monthLabel(iso: string): string {
    return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { month: 'short' });
  }

  // Show month labels at month boundaries to keep the axis readable on a 12-week strip
  const labels = $derived.by(() => {
    const out: { x: number; label: string }[] = [];
    let lastMonth = '';
    for (const d of $data) {
      const m = monthLabel(d.week_start);
      if (m !== lastMonth) {
        const x = ($xScale(d.week_start) ?? 0) + $xScale.bandwidth() / 2;
        out.push({ x, label: m });
        lastMonth = m;
      }
    }
    return out;
  });
</script>

<g class="weekly-frequency-axis" transform="translate(0, {$height})">
  {#each labels as l (l.x)}
    <text class="weekly-frequency-axis-label" x={l.x} y="14" text-anchor="middle">
      {l.label}
    </text>
  {/each}
</g>

<style>
  .weekly-frequency-axis-label {
    font-size: 10px;
    fill: var(--color-fg-faint);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
</style>
