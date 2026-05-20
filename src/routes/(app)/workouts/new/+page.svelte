<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { slide } from 'svelte/transition';
  import { exercisesLive } from '$lib/db/exercises';
  import {
    createWorkout,
    updateWorkout,
    getWorkoutWithSets,
    type WorkoutSetDraft
  } from '$lib/db/workouts';
  import { dayName, shortDate, todayLocal } from '$lib/utils/dates';
  import CategoryChip from '$lib/components/CategoryChip.svelte';
  import SetInput from '$lib/components/SetInput.svelte';
  import Calendar from '$lib/components/Calendar.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import SendAnimation from '$lib/components/SendAnimation.svelte';
  import type { Exercise } from '$lib/db/schema';

  function initialDate(): string {
    const param = page.url.searchParams.get('date');
    if (param && /^\d{4}-\d{2}-\d{2}$/.test(param) && param <= todayLocal()) return param;
    return todayLocal();
  }

  const editingId = page.url.searchParams.get('edit');
  const isEditMode = !!editingId;

  let selectedExerciseId = $state<string | null>(null);
  let workoutDate = $state(initialDate());
  let calendarOpen = $state(false);
  let sets = $state<WorkoutSetDraft[]>([{}]);
  let notes = $state('');
  let saving = $state(false);
  let celebrating = $state(false);
  let hydrating = $state(isEditMode);

  $effect(() => {
    if (!editingId || !hydrating) return;
    (async () => {
      const w = await getWorkoutWithSets(editingId);
      if (!w) {
        await goto('/workouts');
        return;
      }
      selectedExerciseId = w.exercise_id;
      workoutDate = w.workout_date;
      notes = w.notes ?? '';
      sets = w.sets.length
        ? w.sets.map((s) => ({
            reps: s.reps,
            weight: s.weight,
            duration_seconds: s.duration_seconds,
            distance: s.distance,
            calories: s.calories,
            rest_seconds: s.rest_seconds
          }))
        : [{}];
      hydrating = false;
    })();
  });

  const selected = $derived<Exercise | null>(
    ($exercisesLive ?? []).find((e) => e.id === selectedExerciseId) ?? null
  );

  const canSave = $derived(
    selectedExerciseId !== null && sets.length > 0 && !saving
  );

  function pickExercise(id: string) {
    selectedExerciseId = id;
    sets = [{}];
  }

  function changeExercise() {
    selectedExerciseId = null;
  }

  function addSet() {
    const last = sets[sets.length - 1] ?? {};
    sets.push({
      reps: last.reps ?? null,
      weight: last.weight ?? null,
      duration_seconds: last.duration_seconds ?? null,
      distance: last.distance ?? null
    });
  }

  function removeSet(index: number) {
    sets.splice(index, 1);
    if (sets.length === 0) sets.push({});
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!selectedExerciseId || !canSave) return;
    saving = true;
    try {
      const payload = {
        exercise_id: selectedExerciseId,
        workout_date: workoutDate,
        notes: notes.trim() || null,
        sets
      };
      if (editingId) {
        await updateWorkout(editingId, payload);
        await goto('/workouts');
      } else {
        await createWorkout(payload);
        celebrating = true;
      }
    } catch {
      saving = false;
    }
  }
</script>

<section class="new-workout-shell">
  <header class="new-workout-header">
    <a href="/workouts" class="new-workout-back-link press-feedback" aria-label="Back to workouts">
      <Icon name="close" size={22} />
    </a>
    <h1 class="new-workout-title">{isEditMode ? 'Edit send' : 'New send'}</h1>
    <span class="new-workout-header-spacer" aria-hidden="true"></span>
  </header>

  {#if hydrating}
    <div class="new-workout-hydrating" aria-hidden="true">
      <div class="new-workout-hydrating-row"></div>
      <div class="new-workout-hydrating-row"></div>
      <div class="new-workout-hydrating-row"></div>
    </div>
  {:else}
  <form id="new-workout-form" class="new-workout-form" onsubmit={handleSubmit}>
    <div class="new-workout-field new-workout-date-field">
      <span class="new-workout-label">Date</span>
      <button
        type="button"
        class="new-workout-date-trigger press-feedback"
        onclick={() => (calendarOpen = !calendarOpen)}
        aria-expanded={calendarOpen}
      >
        <Icon name="calendar" size={18} class="new-workout-date-trigger-icon" />
        <span class="new-workout-date-trigger-label">
          <span class="new-workout-date-trigger-day">{dayName(workoutDate)}</span>
          <span class="new-workout-date-trigger-date tnum">{shortDate(workoutDate)}</span>
        </span>
        <Icon name="chevron-down" size={16} class="new-workout-date-trigger-chevron" />
      </button>
      {#if calendarOpen}
        <div class="new-workout-calendar-drawer" transition:slide={{ duration: 160 }}>
          <Calendar
            value={workoutDate}
            max={todayLocal()}
            onSelect={(iso) => {
              workoutDate = iso;
              calendarOpen = false;
            }}
          />
        </div>
      {/if}
    </div>

    {#if !selected}
      <div class="new-workout-field">
        <span class="new-workout-label">Pick exercise</span>
        {#if !$exercisesLive}
          <p class="new-workout-helper">Loading…</p>
        {:else if $exercisesLive.length === 0}
          <div class="new-workout-empty-exercises">
            <p>No exercises in your library yet.</p>
            <a class="new-workout-link" href="/exercises">Add one first →</a>
          </div>
        {:else}
          <ul class="new-workout-exercise-list">
            {#each $exercisesLive as ex (ex.id)}
              <li>
                <button
                  type="button"
                  class="new-workout-exercise-row press-feedback"
                  onclick={() => pickExercise(ex.id)}
                >
                  <span class="new-workout-exercise-name">{ex.name}</span>
                  <div class="new-workout-exercise-tags">
                    {#each ex.categories as cat (cat)}
                      <CategoryChip category={cat} showDot={false} />
                    {/each}
                  </div>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {:else}
      <div class="new-workout-field">
        <span class="new-workout-label">Exercise</span>
        <button
          type="button"
          class="new-workout-selected-exercise press-feedback"
          onclick={changeExercise}
        >
          <span class="new-workout-selected-name">{selected.name}</span>
          <div class="new-workout-exercise-tags">
            {#each selected.categories as cat (cat)}
              <CategoryChip category={cat} showDot={false} />
            {/each}
          </div>
          <span class="new-workout-selected-change">Change</span>
        </button>
      </div>

      <div class="new-workout-field">
        <span class="new-workout-label">Sets</span>
        <div class="new-workout-sets">
          {#each sets as set, i (i)}
            <SetInput
              set={sets[i]}
              index={i}
              measurementType={selected.measurement_type}
              removable={sets.length > 1}
              onRemove={() => removeSet(i)}
            />
          {/each}
        </div>
        <button type="button" class="new-workout-add-set press-feedback" onclick={addSet}>
          <Icon name="plus" size={16} strokeWidth={2.25} />
          Add set
        </button>
      </div>

      <label class="new-workout-field">
        <span class="new-workout-label">Notes (optional)</span>
        <textarea
          class="new-workout-notes-input"
          bind:value={notes}
          rows="2"
          placeholder="How did it feel?"
          maxlength={300}
        ></textarea>
      </label>
    {/if}
  </form>
  {/if}

  {#if selected && !hydrating}
    <div class="new-workout-footer">
      <PrimaryButton
        type="submit"
        form="new-workout-form"
        loading={saving}
        disabled={!canSave}
      >
        {isEditMode ? 'Save' : 'Send it'}
      </PrimaryButton>
    </div>
  {/if}
</section>

{#if celebrating}
  <SendAnimation onDone={() => goto('/workouts')} />
{/if}

<style>
  .new-workout-shell {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    padding-bottom: 96px;
  }

  .new-workout-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 12px 4px;
    gap: 8px;
  }
  .new-workout-back-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    color: var(--color-fg-muted);
  }
  .new-workout-back-link:active {
    background: var(--color-surface-3);
  }
  .new-workout-title {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.25rem;
  }
  .new-workout-header-spacer {
    width: 40px;
  }

  .new-workout-form {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 12px 16px 0;
  }

  .new-workout-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .new-workout-label {
    font-size: 0.6875rem;
    font-weight: 700;
    color: var(--color-fg-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .new-workout-helper {
    font-size: 0.875rem;
    color: var(--color-fg-faint);
  }

  .new-workout-date-trigger {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 12px 14px;
    background: var(--color-surface-1);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-md);
    color: var(--color-fg);
    text-align: left;
  }
  .new-workout-date-trigger:active {
    background: var(--color-surface-3);
  }
  :global(.new-workout-date-trigger-icon) {
    color: var(--color-fg-muted);
    flex-shrink: 0;
  }
  .new-workout-date-trigger-label {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }
  .new-workout-date-trigger-day {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 0.9375rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .new-workout-date-trigger-date {
    font-size: 0.75rem;
    color: var(--color-fg-muted);
  }
  :global(.new-workout-date-trigger-chevron) {
    color: var(--color-fg-faint);
    flex-shrink: 0;
  }

  .new-workout-calendar-drawer {
    margin-top: 8px;
  }

  .new-workout-empty-exercises {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 14px;
    background: var(--color-surface-1);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-lg);
    color: var(--color-fg-muted);
    font-size: 0.875rem;
  }
  .new-workout-link {
    color: var(--color-brand);
    font-weight: 600;
  }

  .new-workout-exercise-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .new-workout-exercise-row {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-height: 56px;
    padding: 10px 14px;
    background: var(--color-surface-1);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-lg);
    text-align: left;
    color: var(--color-fg);
  }
  .new-workout-exercise-row:active {
    background: var(--color-surface-3);
  }
  .new-workout-exercise-name {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 1rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }
  .new-workout-exercise-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: flex-end;
  }

  .new-workout-selected-exercise {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    background: var(--color-surface-2);
    border: 1px solid var(--color-line-strong);
    border-radius: var(--radius-lg);
    color: var(--color-fg);
    text-align: left;
  }
  .new-workout-selected-name {
    flex: 1;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 1.0625rem;
  }
  .new-workout-selected-change {
    font-size: 0.75rem;
    color: var(--color-brand);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .new-workout-sets {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .new-workout-add-set {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 44px;
    background: transparent;
    border: 1px dashed var(--color-line-strong);
    border-radius: var(--radius-md);
    color: var(--color-fg-muted);
    font-size: 0.875rem;
    font-weight: 600;
  }
  .new-workout-add-set:active {
    background: var(--color-surface-1);
    color: var(--color-fg);
  }

  .new-workout-notes-input {
    background: var(--color-surface-1);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-md);
    padding: 12px 14px;
    color: var(--color-fg);
    font-size: 1rem;
    font-family: inherit;
    resize: vertical;
  }

  .new-workout-hydrating {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px;
  }
  .new-workout-hydrating-row {
    height: 56px;
    border-radius: var(--radius-md);
    background: linear-gradient(
      90deg,
      var(--color-surface-1) 0%,
      var(--color-surface-3) 50%,
      var(--color-surface-1) 100%
    );
    background-size: 200% 100%;
    animation: new-workout-shimmer 1400ms ease-in-out infinite;
  }
  @keyframes new-workout-shimmer {
    0% {
      background-position: 100% 0;
    }
    100% {
      background-position: -100% 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .new-workout-hydrating-row {
      animation: none;
    }
  }

  .new-workout-footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 12px 16px;
    padding-bottom: max(12px, env(safe-area-inset-bottom));
    background: color-mix(in srgb, var(--color-bg) 92%, transparent);
    backdrop-filter: blur(12px);
    border-top: 1px solid var(--color-line);
    z-index: 20;
  }
</style>
