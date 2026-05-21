<script lang="ts">
  import { goto } from '$app/navigation';
  import { slide } from 'svelte/transition';
  import { recentWorkoutsLive, deleteWorkout } from '$lib/db/workouts';
  import { exercisesLive } from '$lib/db/exercises';
  import {
    addDays,
    dayName,
    dayOfMonth,
    shortDate,
    startOfWeek,
    todayLocal,
    weekDates,
    weekRangeLabel,
    weekdayLetter
  } from '$lib/utils/dates';
  import WorkoutCard, { type WorkoutCardExercise } from '$lib/components/WorkoutCard.svelte';
  import type { WorkoutEntry } from '$lib/db/schema';
  import Calendar from '$lib/components/Calendar.svelte';
  import Fab from '$lib/components/Fab.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';

  let currentDate = $state(todayLocal());
  let weekStart = $state(startOfWeek(todayLocal()));
  let calendarOpen = $state(false);

  const today = $derived(todayLocal());
  const isToday = $derived(currentDate === today);

  const exerciseMap = $derived.by(() => {
    const map = new Map<string, (typeof $exercisesLive)[number]>();
    for (const e of $exercisesLive ?? []) map.set(e.id, e);
    return map;
  });

  function exerciseFor(workout: WorkoutEntry): WorkoutCardExercise | undefined {
    const live = exerciseMap.get(workout.exercise_id);
    if (live) {
      return {
        name: live.name,
        categories: live.categories,
        measurement_type: live.measurement_type
      };
    }
    if (workout.exercise_name && workout.exercise_measurement_type) {
      return {
        name: workout.exercise_name,
        categories: workout.exercise_categories ?? [],
        measurement_type: workout.exercise_measurement_type,
        deleted: true
      };
    }
    return undefined;
  }

  const workoutDateSet = $derived.by(() => {
    const set = new Set<string>();
    for (const w of $recentWorkoutsLive ?? []) set.add(w.workout_date);
    return set;
  });

  const dayWorkouts = $derived(
    ($recentWorkoutsLive ?? []).filter((w) => w.workout_date === currentDate)
  );

  const visibleWeek = $derived(weekDates(weekStart));
  const canGoNextWeek = $derived(addDays(weekStart, 7) <= today);

  function selectDate(iso: string) {
    if (iso > today) return;
    currentDate = iso;
    weekStart = startOfWeek(iso);
  }

  function goPrevWeek() {
    weekStart = addDays(weekStart, -7);
  }
  function goNextWeek() {
    if (canGoNextWeek) weekStart = addDays(weekStart, 7);
  }
  function jumpToToday() {
    selectDate(today);
    calendarOpen = false;
  }
  function handlePickDate(iso: string) {
    selectDate(iso);
    calendarOpen = false;
  }
</script>

<section class="workouts-shell">
  <PageHeader title="Workouts">
    {#snippet actions()}
      {#if !isToday}
        <button
          type="button"
          class="workouts-today-pill press-feedback"
          onclick={jumpToToday}
        >
          Today
        </button>
      {/if}
      <button
        type="button"
        class="workouts-calendar-toggle press-feedback"
        onclick={() => (calendarOpen = !calendarOpen)}
        aria-expanded={calendarOpen}
        aria-label="Open calendar"
      >
        <Icon name="calendar" size={20} />
      </button>
    {/snippet}

    {#snippet below()}
      <div class="workouts-week-strip">
        <button
          type="button"
          class="workouts-week-nav press-feedback"
          onclick={goPrevWeek}
          aria-label="Previous week"
        >
          <Icon name="chevron-right" size={18} class="workouts-week-nav-flip" />
        </button>

        <div class="workouts-week-days">
          <div class="workouts-week-range tnum" aria-hidden="true">
            {weekRangeLabel(weekStart)}
          </div>
          <div class="workouts-week-grid">
            {#each visibleWeek as iso (iso)}
              {@const isFuture = iso > today}
              {@const isSelected = iso === currentDate}
              {@const isCurrentToday = iso === today}
              {@const hasWorkout = workoutDateSet.has(iso)}
              <button
                type="button"
                class="workouts-week-day press-feedback"
                class:workouts-week-day-selected={isSelected}
                class:workouts-week-day-today={isCurrentToday && !isSelected}
                class:workouts-week-day-future={isFuture}
                disabled={isFuture}
                onclick={() => selectDate(iso)}
                aria-label={`${dayName(iso)}, ${shortDate(iso)}`}
                aria-pressed={isSelected}
              >
                <span class="workouts-week-day-letter">{weekdayLetter(iso)}</span>
                <span class="workouts-week-day-number tnum">{dayOfMonth(iso)}</span>
                <span
                  class="workouts-week-day-dot"
                  class:workouts-week-day-dot-visible={hasWorkout}
                  aria-hidden="true"
                ></span>
              </button>
            {/each}
          </div>
        </div>

        <button
          type="button"
          class="workouts-week-nav press-feedback"
          onclick={goNextWeek}
          disabled={!canGoNextWeek}
          aria-label="Next week"
        >
          <Icon name="chevron-right" size={18} />
        </button>
      </div>

      {#if calendarOpen}
        <div class="workouts-calendar-drawer" transition:slide={{ duration: 160 }}>
          <Calendar value={currentDate} max={today} onSelect={handlePickDate} />
        </div>
      {/if}
    {/snippet}
  </PageHeader>

  <div class="workouts-content">

    {#if !$recentWorkoutsLive}
      <div class="workouts-loading" aria-hidden="true">
        <div class="workouts-skeleton-row"></div>
        <div class="workouts-skeleton-row"></div>
      </div>
    {:else if dayWorkouts.length === 0}
      <div class="workouts-day-empty">
        <p class="workouts-day-empty-title">No workouts logged</p>
        <p class="workouts-day-empty-body">
          Tap the button below to log one for {dayName(currentDate).toLowerCase()}.
        </p>
      </div>
    {:else}
      <ul class="workouts-day-list">
        {#each dayWorkouts as workout (workout.id)}
          {@const exercise = exerciseFor(workout)}
          <li class="workouts-day-list-row">
            <WorkoutCard
              {workout}
              {exercise}
              onEdit={() => goto(`/workouts/new?edit=${workout.id}`)}
              onDelete={() => deleteWorkout(workout.id)}
            />
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</section>

<Fab onclick={() => goto(`/workouts/new?date=${currentDate}`)} label="Send" />

<style>
  .workouts-shell {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .workouts-content {
    padding: 0 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .workouts-today-pill {
    height: 32px;
    padding: 0 14px;
    border-radius: 999px;
    background: var(--color-surface-2);
    color: var(--color-fg);
    font-size: 0.8125rem;
    font-weight: 600;
    border: 1px solid var(--color-line);
  }
  .workouts-today-pill:active {
    background: var(--color-surface-3);
  }
  .workouts-calendar-toggle {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-fg-muted);
    border: 1px solid var(--color-line);
  }
  .workouts-calendar-toggle:active,
  .workouts-calendar-toggle[aria-expanded='true'] {
    background: var(--color-surface-3);
    color: var(--color-fg);
  }

  .workouts-week-strip {
    display: flex;
    align-items: stretch;
    gap: 4px;
  }
  .workouts-week-nav {
    flex: 0 0 auto;
    width: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-fg-muted);
  }
  .workouts-week-nav:active {
    color: var(--color-fg);
  }
  .workouts-week-nav:disabled {
    opacity: 0.25;
  }
  :global(.workouts-week-nav-flip) {
    transform: rotate(180deg);
  }

  .workouts-week-days {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .workouts-week-range {
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-fg-faint);
    text-align: center;
  }
  .workouts-week-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }
  .workouts-week-day {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px 0 6px;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-fg-muted);
    min-height: 56px;
    border: 1px solid transparent;
  }
  .workouts-week-day-letter {
    font-size: 0.625rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
  }
  .workouts-week-day-number {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 1rem;
    line-height: 1;
    color: var(--color-fg);
  }
  .workouts-week-day-dot {
    width: 4px;
    height: 4px;
    border-radius: 999px;
    background: transparent;
    margin-top: 2px;
  }
  .workouts-week-day-dot-visible {
    background: var(--color-brand);
  }
  .workouts-week-day-today {
    border-color: var(--color-line-strong);
  }
  .workouts-week-day-today .workouts-week-day-number {
    color: var(--color-brand);
  }
  .workouts-week-day-selected {
    background: var(--color-fg);
    border-color: var(--color-fg);
  }
  .workouts-week-day-selected .workouts-week-day-number,
  .workouts-week-day-selected .workouts-week-day-letter {
    color: var(--color-bg);
  }
  .workouts-week-day-selected .workouts-week-day-dot-visible {
    background: var(--color-bg);
  }
  .workouts-week-day-future {
    opacity: 0.3;
  }

  .workouts-day-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .workouts-day-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 6px;
    padding: 48px 16px;
    color: var(--color-fg-muted);
  }
  .workouts-day-empty-title {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 1.125rem;
    color: var(--color-fg);
  }
  .workouts-day-empty-body {
    font-size: 0.875rem;
    max-width: 32ch;
  }

  .workouts-loading {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .workouts-skeleton-row {
    height: 84px;
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
    .workouts-skeleton-row {
      animation: none;
    }
  }
</style>
