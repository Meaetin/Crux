<script lang="ts">
  import { getContext } from 'svelte';
  import type { Readable } from 'svelte/store';

  type AccessorFn = (d: unknown) => number;
  const { data, xGet, yGet } = getContext<{
    data: Readable<unknown[]>;
    xGet: Readable<AccessorFn>;
    yGet: Readable<AccessorFn>;
  }>('LayerCake');
</script>

<g class="weight-trend-dots">
  {#each $data as d (`${$xGet(d)}-${$yGet(d)}`)}
    <circle class="weight-trend-dot" cx={$xGet(d)} cy={$yGet(d)} r="3" />
  {/each}
</g>

<style>
  .weight-trend-dot {
    fill: var(--color-brand);
  }
</style>
