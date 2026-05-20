<script lang="ts">
  import type { Exercise } from '$lib/db/schema';
  import CategoryChip, { categoryMeta } from './CategoryChip.svelte';
  import Icon from './Icon.svelte';

  let {
    exercise,
    onclick
  }: {
    exercise: Exercise;
    onclick: () => void;
  } = $props();

  const measurementLabel: Record<string, string> = {
    reps: 'Reps',
    duration: 'Duration',
    weight: 'Weight',
    distance: 'Distance',
    custom: 'Custom'
  };

  const primaryColor = $derived(
    exercise.categories.length > 0
      ? categoryMeta(exercise.categories[0]).color
      : 'var(--color-fg-faint)'
  );
</script>

<button
  type="button"
  class="exercise-list-item press-feedback"
  {onclick}
>
  <span class="exercise-list-item-dot" style="background-color: {primaryColor};" aria-hidden="true"
  ></span>

  <div class="exercise-list-item-body">
    <div class="exercise-list-item-name">{exercise.name}</div>
    <div class="exercise-list-item-meta">
      <div class="exercise-list-item-categories">
        {#each exercise.categories as cat (cat)}
          <CategoryChip category={cat} showDot={false} />
        {/each}
      </div>
      <span class="exercise-list-item-measurement">{measurementLabel[exercise.measurement_type]}</span>
    </div>
  </div>

  <Icon
    name="chevron-right"
    size={20}
    class="exercise-list-item-chevron"
  />
</button>

<style>
  .exercise-list-item {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    min-height: 72px;
    padding: 12px 14px;
    background: var(--color-surface-1);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-lg);
    text-align: left;
    color: inherit;
  }
  .exercise-list-item:active {
    background: var(--color-surface-3);
  }

  .exercise-list-item-dot {
    width: 12px;
    height: 12px;
    border-radius: 999px;
    flex-shrink: 0;
    box-shadow: 0 0 0 4px color-mix(in srgb, currentColor 0%, transparent);
  }

  .exercise-list-item-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .exercise-list-item-name {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 1.0625rem;
    letter-spacing: 0.005em;
    color: var(--color-fg);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .exercise-list-item-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .exercise-list-item-categories {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .exercise-list-item-measurement {
    font-size: 0.75rem;
    color: var(--color-fg-muted);
  }

  :global(.exercise-list-item-chevron) {
    color: var(--color-fg-faint);
    flex-shrink: 0;
  }
</style>
