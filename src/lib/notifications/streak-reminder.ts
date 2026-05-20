import { todayLocal } from '$lib/utils/dates';
import { computeStreak, DAILY_GOAL } from '$lib/db/streaks';
import { getSettings } from '$lib/db/settings';
import { session } from '$lib/state/session.svelte';
import { notificationPermission, supportsNotifications, supportsTriggers } from './capabilities';

const REMINDER_TAG_PREFIX = 'streak-reminder-';

declare global {
  interface NotificationOptions {
    showTrigger?: unknown;
  }
  interface Window {
    TimestampTrigger?: new (timestamp: number) => unknown;
  }
}

function reminderTimestamp(today: string, hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(today + 'T00:00:00');
  d.setHours(h ?? 20, m ?? 0, 0, 0);
  return d.getTime();
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return (await navigator.serviceWorker.ready) ?? null;
  } catch {
    return null;
  }
}

export async function cancelStreakReminder(today = todayLocal()): Promise<void> {
  const reg = await getRegistration();
  if (!reg) return;
  const tag = REMINDER_TAG_PREFIX + today;
  const pending = await reg.getNotifications({ tag, includeTriggered: true } as never);
  for (const n of pending) n.close();
}

export async function scheduleStreakReminder(): Promise<'scheduled' | 'cancelled' | 'skipped'> {
  if (!supportsNotifications()) return 'skipped';
  if (notificationPermission() !== 'granted') return 'skipped';

  const userId = session.current?.user.id;
  if (!userId) return 'skipped';

  const settings = await getSettings();
  if (!settings.notify_streak_enabled) {
    await cancelStreakReminder();
    return 'cancelled';
  }

  const status = await computeStreak(userId);
  const today = status.today;
  await cancelStreakReminder(today);

  if (status.goalMet) return 'cancelled';

  if (!supportsTriggers() || typeof window.TimestampTrigger !== 'function') {
    return 'skipped';
  }

  const reg = await getRegistration();
  if (!reg) return 'skipped';

  const fireAt = reminderTimestamp(today, settings.notify_streak_time);
  if (fireAt <= Date.now()) return 'skipped';

  const remaining = status.goalRemaining;
  const body =
    remaining === DAILY_GOAL
      ? `Log ${DAILY_GOAL} workouts today to keep your ${status.currentStreak}-day streak alive.`
      : `${remaining} more workout${remaining === 1 ? '' : 's'} to keep your ${status.currentStreak}-day streak.`;

  try {
    await reg.showNotification('Streak at risk', {
      body,
      tag: REMINDER_TAG_PREFIX + today,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      showTrigger: new window.TimestampTrigger(fireAt)
    });
    return 'scheduled';
  } catch {
    return 'skipped';
  }
}
