<script lang="ts">
  import type { PersonalBest } from '$lib/utils/analytics';
  import { formatPersonalBest } from '$lib/utils/analytics';
  import GradeChip from './GradeChip.svelte';
  import Icon from './Icon.svelte';

  let { prs }: { prs: PersonalBest[] } = $props();

  const single = $derived(prs.length === 1 ? prs[0] : null);
  const visibleChips = $derived(prs.slice(0, 4));
  const overflow = $derived(Math.max(0, prs.length - visibleChips.length));
</script>

<a
  class="today-pr-callout press-feedback"
  href="/metrics#personal-bests"
  aria-label={single
    ? `New V${single.grade} on ${single.exercise_name}, ${formatPersonalBest(single)}`
    : `${prs.length} new V-grades today`}
>
  {#if single}
    <GradeChip grade={single.grade} size="sm" />
    <span class="today-pr-callout-detail">
      <span class="today-pr-callout-name">{single.exercise_name}</span>
      <span class="today-pr-callout-divider" aria-hidden="true">·</span>
      <span class="today-pr-callout-value tnum">{formatPersonalBest(single)}</span>
    </span>
  {:else}
    <span class="today-pr-callout-chips" aria-hidden="true">
      {#each visibleChips as pr (pr.exercise_id)}
        <GradeChip grade={pr.grade} size="sm" />
      {/each}
      {#if overflow > 0}
        <span class="today-pr-callout-overflow">+{overflow}</span>
      {/if}
    </span>
    <span class="today-pr-callout-label">{prs.length} new V-grades</span>
  {/if}
  <Icon name="chevron-right" size={16} class="today-pr-callout-chevron" />
</a>

<style>
  .today-pr-callout {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 48px;
    padding: 0 14px;
    background: color-mix(in srgb, var(--color-brand) 8%, var(--color-surface-1));
    border: 1px solid color-mix(in srgb, var(--color-brand) 30%, var(--color-line));
    border-radius: var(--radius-md);
    color: var(--color-fg);
    text-decoration: none;
  }
  .today-pr-callout-detail {
    flex: 1;
    display: flex;
    align-items: baseline;
    gap: 6px;
    min-width: 0;
    overflow: hidden;
  }
  .today-pr-callout-name {
    font-size: 0.9375rem;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }
  .today-pr-callout-divider {
    color: var(--color-fg-faint);
    font-size: 0.875rem;
    flex-shrink: 0;
  }
  .today-pr-callout-value {
    flex-shrink: 0;
    font-size: 0.8125rem;
    color: var(--color-fg-muted);
  }
  .today-pr-callout-chips {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }
  .today-pr-callout-overflow {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 30px;
    height: 22px;
    padding: 0 6px;
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-weight: 700;
    font-size: 0.6875rem;
    letter-spacing: 0.04em;
    color: var(--color-fg-muted);
    background: var(--color-surface-2);
    border-radius: var(--radius-md);
  }
  .today-pr-callout-label {
    flex: 1;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-fg);
    text-align: right;
  }
  :global(.today-pr-callout-chevron) {
    color: var(--color-fg-faint);
    flex-shrink: 0;
  }
</style>
