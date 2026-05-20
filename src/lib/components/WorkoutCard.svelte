<script lang="ts">
  import { slide } from 'svelte/transition';
  import type { WorkoutSet, MeasurementType } from '$lib/db/schema';
  import type { WorkoutWithSets } from '$lib/db/workouts';
  import CategoryChip from './CategoryChip.svelte';
  import ConfirmModal from './ConfirmModal.svelte';
  import Icon from './Icon.svelte';

  export type WorkoutCardExercise = {
    name: string;
    categories: string[];
    measurement_type: MeasurementType;
    deleted?: boolean;
  };

  let {
    workout,
    exercise,
    onEdit,
    onDelete
  }: {
    workout: WorkoutWithSets;
    exercise: WorkoutCardExercise | undefined;
    onEdit: () => void;
    onDelete: () => void;
  } = $props();

  let expanded = $state(false);
  let confirmOpen = $state(false);

  function stripZeros(n: number): string {
    return parseFloat(n.toFixed(2)).toString();
  }

  function formatDuration(s: number): string {
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return rem ? `${m}m ${rem}s` : `${m}m`;
  }

  function hasAny(sets: WorkoutSet[], field: keyof WorkoutSet): boolean {
    return sets.some((s) => s[field] != null);
  }
  function sum(sets: WorkoutSet[], field: 'reps' | 'duration_seconds' | 'distance'): number {
    return sets.reduce((acc, s) => acc + (s[field] ?? 0), 0);
  }
  function maxOf(sets: WorkoutSet[], field: 'weight'): number {
    const vals = sets.map((s) => s[field]).filter((v): v is number => v != null);
    return vals.length ? Math.max(...vals) : 0;
  }

  function formatTotal(sets: WorkoutSet[], type: MeasurementType): string {
    if (sets.length === 0) return '—';
    switch (type) {
      case 'reps':
        return hasAny(sets, 'reps') ? `${sum(sets, 'reps')} reps` : '—';
      case 'weight':
        return hasAny(sets, 'weight') ? `${stripZeros(maxOf(sets, 'weight'))}kg` : '—';
      case 'duration':
        return hasAny(sets, 'duration_seconds')
          ? formatDuration(sum(sets, 'duration_seconds'))
          : '—';
      case 'distance':
        return hasAny(sets, 'distance') ? `${stripZeros(sum(sets, 'distance'))}km` : '—';
      case 'custom':
        if (hasAny(sets, 'reps')) return `${sum(sets, 'reps')} reps`;
        if (hasAny(sets, 'duration_seconds')) return formatDuration(sum(sets, 'duration_seconds'));
        if (hasAny(sets, 'weight')) return `${stripZeros(maxOf(sets, 'weight'))}kg`;
        if (hasAny(sets, 'distance')) return `${stripZeros(sum(sets, 'distance'))}km`;
        return '—';
    }
  }

  function formatRepsLabel(n: number): string {
    return n === 1 ? '1 rep' : `${n} reps`;
  }

  function formatSetLine(set: WorkoutSet): string {
    const parts: string[] = [];
    if (set.weight != null) parts.push(`${stripZeros(set.weight)}kg`);
    if (set.reps != null) parts.push(formatRepsLabel(set.reps));
    if (set.duration_seconds != null) parts.push(formatDuration(set.duration_seconds));
    if (set.distance != null) parts.push(`${stripZeros(set.distance)}km`);
    return parts.length ? parts.join(' · ') : '—';
  }

  const total = $derived(
    exercise ? formatTotal(workout.sets, exercise.measurement_type) : '—'
  );
  const hasNote = $derived(!!workout.notes && workout.notes.trim().length > 0);
</script>

<article class="workout-card" class:workout-card-expanded={expanded}>
  <button
    type="button"
    class="workout-card-toggle"
    onclick={() => (expanded = !expanded)}
    aria-expanded={expanded}
  >
    <div class="workout-card-titles">
      <h3 class="workout-card-name">{exercise?.name ?? 'Unknown exercise'}</h3>
      <div class="workout-card-tags">
        {#if exercise}
          {#each exercise.categories as cat (cat)}
            <CategoryChip category={cat} showDot={false} />
          {/each}
        {/if}
        {#if exercise?.deleted}
          <span class="workout-card-deleted-chip" aria-label="Deleted exercise">
            Deleted
          </span>
        {/if}
        {#if hasNote}
          <span class="workout-card-note-chip" aria-label="Has note">
            <Icon name="note" size={11} strokeWidth={2} />
            Note
          </span>
        {/if}
      </div>
    </div>
    <div class="workout-card-total tnum" aria-label="Total">
      {total}
    </div>
  </button>

  {#if expanded}
    <div class="workout-card-drawer" transition:slide={{ duration: 160 }}>
      {#if workout.sets.length > 0}
        <ul class="workout-card-sets-list">
          {#each workout.sets as set, i (set.id)}
            <li class="workout-card-set-row">
              <span class="workout-card-set-number tnum">SET {i + 1}</span>
              <span class="workout-card-set-values tnum">{formatSetLine(set)}</span>
            </li>
          {/each}
        </ul>
      {/if}

      {#if hasNote}
        <p class="workout-card-note-text">{workout.notes}</p>
      {/if}

      <div class="workout-card-actions">
        <button
          type="button"
          class="workout-card-action workout-card-action-edit press-feedback"
          onclick={onEdit}
        >
          <Icon name="edit" size={14} />
          Edit
        </button>
        <button
          type="button"
          class="workout-card-action workout-card-action-delete press-feedback"
          onclick={() => (confirmOpen = true)}
        >
          <Icon name="trash" size={14} />
          Delete
        </button>
      </div>
    </div>
  {/if}
</article>

<ConfirmModal
  bind:open={confirmOpen}
  title="Delete workout?"
  message="This will permanently remove this {exercise?.name ?? 'workout'} entry."
  confirmLabel="Delete"
  danger
  onConfirm={onDelete}
/>

<style>
  .workout-card {
    display: flex;
    flex-direction: column;
    background: var(--color-surface-1);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  .workout-card-expanded {
    border-color: var(--color-line-strong);
  }

  .workout-card-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    padding: 14px;
    background: transparent;
    color: inherit;
    text-align: left;
  }
  .workout-card-toggle:active {
    background: var(--color-surface-3);
  }

  .workout-card-titles {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: flex-start;
    min-width: 0;
    flex: 1;
  }
  .workout-card-name {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 1.125rem;
    color: var(--color-fg);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }
  .workout-card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }

  .workout-card-note-chip,
  .workout-card-deleted-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0.1875rem 0.5rem;
    border-radius: var(--radius-md);
    font-size: 0.6875rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: color-mix(in srgb, var(--color-fg-muted) 12%, transparent);
    color: var(--color-fg-muted);
  }
  .workout-card-deleted-chip {
    background: color-mix(in srgb, var(--color-danger) 12%, transparent);
    color: var(--color-danger);
  }

  .workout-card-total {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.25rem;
    color: var(--color-brand);
    flex-shrink: 0;
    letter-spacing: 0.01em;
  }

  .workout-card-drawer {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px 14px;
    border-top: 1px solid var(--color-line);
    background: var(--color-surface-2);
  }

  .workout-card-sets-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .workout-card-set-row {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }
  .workout-card-set-number {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.6875rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-fg-faint);
    min-width: 48px;
    flex-shrink: 0;
  }
  .workout-card-set-values {
    font-size: 0.875rem;
    color: var(--color-fg);
  }

  .workout-card-note-text {
    font-size: 0.8125rem;
    font-style: italic;
    color: var(--color-fg-muted);
    line-height: 1.45;
    white-space: pre-wrap;
  }

  .workout-card-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 10px;
    border-top: 1px solid var(--color-line);
  }
  .workout-card-action {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 36px;
    padding: 0 12px;
    border-radius: var(--radius-md);
    font-size: 0.8125rem;
    font-weight: 600;
    font-family: inherit;
  }
  .workout-card-action-edit {
    background: var(--color-surface-3);
    color: var(--color-fg);
    border: 1px solid var(--color-line);
  }
  .workout-card-action-edit:active {
    background: var(--color-surface-1);
  }
  .workout-card-action-delete {
    background: color-mix(in srgb, var(--color-danger) 12%, transparent);
    color: var(--color-danger);
    border: 1px solid color-mix(in srgb, var(--color-danger) 32%, transparent);
  }
  .workout-card-action-delete:active {
    background: color-mix(in srgb, var(--color-danger) 22%, transparent);
  }
</style>
