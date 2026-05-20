<script lang="ts">
  import { exercisesLive, createExercise, updateExercise, deleteExercise } from '$lib/db/exercises';
  import type { Exercise, MeasurementType } from '$lib/db/schema';
  import ExerciseListItem from '$lib/components/ExerciseListItem.svelte';
  import ExerciseForm from '$lib/components/ExerciseForm.svelte';
  import Sheet from '$lib/components/Sheet.svelte';
  import Fab from '$lib/components/Fab.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton.svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
  import Icon from '$lib/components/Icon.svelte';

  let sheetOpen = $state(false);
  let editing = $state<Exercise | null>(null);
  let submitting = $state(false);
  let confirmDeleteOpen = $state(false);

  function openCreate() {
    editing = null;
    sheetOpen = true;
  }

  function openEdit(exercise: Exercise) {
    editing = exercise;
    sheetOpen = true;
  }

  async function handleSubmit(values: {
    name: string;
    categories: string[];
    measurement_type: MeasurementType;
  }) {
    submitting = true;
    try {
      if (editing) {
        await updateExercise(editing.id, values);
      } else {
        await createExercise(values);
      }
      sheetOpen = false;
      editing = null;
    } finally {
      submitting = false;
    }
  }

  async function handleDelete() {
    if (!editing) return;
    submitting = true;
    try {
      await deleteExercise(editing.id);
      sheetOpen = false;
      editing = null;
    } finally {
      submitting = false;
    }
  }
</script>

<section class="exercises-shell">
  <header class="exercises-header">
    <div class="exercises-header-titles">
      <h1 class="exercises-title">Exercises</h1>
      <p class="exercises-subtitle tnum">
        {$exercisesLive?.length ?? 0} in library
      </p>
    </div>
  </header>

  {#if !$exercisesLive}
    <div class="exercises-loading" aria-hidden="true">
      <div class="exercises-skeleton-row"></div>
      <div class="exercises-skeleton-row"></div>
      <div class="exercises-skeleton-row"></div>
    </div>
  {:else if $exercisesLive.length === 0}
    <div class="exercises-empty-state">
      <div class="exercises-empty-icon-container" aria-hidden="true">
        <Icon name="dumbbell" size={36} strokeWidth={1.5} />
      </div>
      <h2 class="exercises-empty-title">Build your library</h2>
      <p class="exercises-empty-body">
        Add the exercises you do. They'll show up in workout logging and history.
      </p>
      <div class="exercises-empty-action">
        <PrimaryButton onclick={openCreate}>Add your first exercise</PrimaryButton>
      </div>
    </div>
  {:else}
    <ul class="exercises-list">
      {#each $exercisesLive as exercise (exercise.id)}
        <li class="exercises-list-row">
          <ExerciseListItem {exercise} onclick={() => openEdit(exercise)} />
        </li>
      {/each}
    </ul>
  {/if}
</section>

<Fab onclick={openCreate} label="Add exercise" />

<Sheet
  bind:open={sheetOpen}
  title={editing ? 'Edit exercise' : 'New exercise'}
  onClose={() => (editing = null)}
>
  {#key editing?.id ?? 'new'}
    <ExerciseForm initial={editing ?? undefined} onsubmit={handleSubmit} {submitting} />
  {/key}

  {#snippet footer()}
    <div class="exercises-sheet-actions">
      {#if editing}
        <PrimaryButton danger onclick={() => (confirmDeleteOpen = true)} disabled={submitting}>
          Delete
        </PrimaryButton>
      {/if}
      <PrimaryButton type="submit" form="exercise-form" loading={submitting}>
        {editing ? 'Save changes' : 'Add exercise'}
      </PrimaryButton>
    </div>
  {/snippet}
</Sheet>

<ConfirmModal
  bind:open={confirmDeleteOpen}
  title="Delete exercise?"
  message="This will permanently remove {editing?.name ?? 'this exercise'} from your library."
  confirmLabel="Delete"
  danger
  onConfirm={handleDelete}
/>

<style>
  .exercises-shell {
    padding: 20px 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .exercises-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
  }
  .exercises-header-titles {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .exercises-title {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 2rem;
    line-height: 1;
    letter-spacing: 0.005em;
  }
  .exercises-subtitle {
    font-size: 0.8125rem;
    color: var(--color-fg-muted);
  }

  .exercises-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .exercises-list-row {
    margin: 0;
  }

  .exercises-loading {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .exercises-skeleton-row {
    height: 72px;
    border-radius: var(--radius-lg);
    background: linear-gradient(
      90deg,
      var(--color-surface-1) 0%,
      var(--color-surface-3) 50%,
      var(--color-surface-1) 100%
    );
    background-size: 200% 100%;
    animation: skeleton-shimmer 1400ms ease-in-out infinite;
  }
  @keyframes skeleton-shimmer {
    0% {
      background-position: 100% 0;
    }
    100% {
      background-position: -100% 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .exercises-skeleton-row {
      animation: none;
    }
  }

  .exercises-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;
    padding: 56px 12px 24px;
  }
  .exercises-empty-icon-container {
    width: 72px;
    height: 72px;
    border-radius: 999px;
    background: var(--color-surface-2);
    border: 1px solid var(--color-line);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-fg-muted);
    margin-bottom: 4px;
  }
  .exercises-empty-title {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 1.5rem;
  }
  .exercises-empty-body {
    color: var(--color-fg-muted);
    font-size: 0.9375rem;
    max-width: 28ch;
  }
  .exercises-empty-action {
    margin-top: 12px;
    width: 100%;
    max-width: 260px;
  }

  .exercises-sheet-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
</style>
