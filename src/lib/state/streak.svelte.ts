import { streakLive, type StreakStatus } from '$lib/db/streaks';
import { awardFreezesIfNeeded } from '$lib/db/settings';
import { scheduleStreakReminder } from '$lib/notifications/streak-reminder';

export const streakState = $state<{ current: StreakStatus | null; ready: boolean }>({
  current: null,
  ready: false
});

let unsubscribe: (() => void) | null = null;

export function initStreakSubscription(): void {
  if (unsubscribe) return;
  const sub = streakLive.subscribe({
    next: (value) => {
      streakState.current = value ?? null;
      streakState.ready = true;
      if (value) {
        awardFreezesIfNeeded(value.currentStreak).catch(() => {});
        scheduleStreakReminder().catch(() => {});
      }
    },
    error: () => {
      streakState.ready = true;
    }
  });
  unsubscribe = () => sub.unsubscribe();
}

export function stopStreakSubscription(): void {
  unsubscribe?.();
  unsubscribe = null;
}
