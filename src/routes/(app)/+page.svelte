<script lang="ts">
  import { streakState } from '$lib/state/streak.svelte';
  import StreakWidget from '$lib/components/StreakWidget.svelte';
  import StreakCalendar from '$lib/components/StreakCalendar.svelte';
  import TodayPRCallout from '$lib/components/TodayPRCallout.svelte';
  import { recentWorkoutsLive } from '$lib/db/workouts';
  import { exercisesLive } from '$lib/db/exercises';
  import { personalBests } from '$lib/utils/analytics';
  import { todayLocal } from '$lib/utils/dates';
  import { useFreezeToday } from '$lib/db/freezes';

  async function handleUseFreeze() {
    const result = await useFreezeToday();
    if (!result.ok) {
      console.warn('useFreezeToday failed:', result.reason);
    }
  }

  const today = $derived(todayLocal());
  const todayPRs = $derived(
    personalBests($recentWorkoutsLive ?? [], $exercisesLive ?? []).filter(
      (pr) => pr.achieved_on === today
    )
  );
  const showPRCallout = $derived(
    streakState.current?.goalMet === true && todayPRs.length > 0
  );
</script>

<section class="dashboard-shell">
  {#if streakState.current}
    <StreakCalendar days={streakState.current.recentDays} />
    <StreakWidget streak={streakState.current} onUseFreeze={handleUseFreeze} />
    {#if showPRCallout}
      <TodayPRCallout prs={todayPRs} />
    {/if}
  {:else if streakState.ready}
    <div class="dashboard-streak-loading" aria-hidden="true"></div>
  {:else}
    <div class="dashboard-streak-loading" aria-hidden="true"></div>
  {/if}
</section>

<style>
  .dashboard-shell {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 14px 16px 8px;
    min-height: 100%;
    background: radial-gradient(
      ellipse 90% 55% at 50% 62%,
      color-mix(in srgb, var(--color-brand-deep) 55%, transparent) 0%,
      transparent 72%
    );
  }

  .dashboard-streak-loading {
    height: 420px;
    border-radius: var(--radius-lg);
    background: var(--color-surface-1);
    border: 1px solid var(--color-line);
  }
</style>
