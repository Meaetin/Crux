import { liveQuery } from 'dexie';
import { db, type UserSettings } from './schema';
import { session } from '$lib/state/session.svelte';

export const DEFAULT_REMINDER_TIME = '20:00';
export const MAX_FREEZES = 3;

function currentUserId(): string {
  const id = session.current?.user.id;
  if (!id) throw new Error('Not signed in');
  return id;
}

export function defaultsFor(userId: string): UserSettings {
  return {
    user_id: userId,
    notify_streak_enabled: false,
    notify_streak_time: DEFAULT_REMINDER_TIME,
    longest_streak: 0,
    freezes_available: 1,
    last_freeze_award_streak: 0,
    height_cm: null,
    unit_system: 'metric',
    updated_at: new Date().toISOString()
  };
}

export async function getSettings(): Promise<UserSettings> {
  const userId = currentUserId();
  const existing = await db.user_settings.get(userId);
  return existing ?? defaultsFor(userId);
}

export const settingsLive = liveQuery(async () => {
  const userId = session.current?.user.id;
  if (!userId) return null;
  const existing = await db.user_settings.get(userId);
  return existing ?? defaultsFor(userId);
});

export async function updateSettings(patch: Partial<Omit<UserSettings, 'user_id'>>): Promise<UserSettings> {
  const userId = currentUserId();
  const now = new Date().toISOString();

  const current = (await db.user_settings.get(userId)) ?? defaultsFor(userId);
  const next: UserSettings = {
    ...current,
    ...patch,
    user_id: userId,
    updated_at: now
  };

  await db.transaction('rw', db.user_settings, db.outbox, async () => {
    await db.user_settings.put(next);
    await db.outbox.add({
      table: 'user_settings',
      op: 'upsert',
      row_id: userId,
      payload: next,
      queued_at: Date.now(),
      attempts: 0,
      last_error: null
    });
  });

  return next;
}

export async function awardFreezesIfNeeded(currentStreak: number): Promise<void> {
  const userId = currentUserId();
  await db.transaction('rw', db.user_settings, db.outbox, async () => {
    const current = (await db.user_settings.get(userId)) ?? defaultsFor(userId);
    let { freezes_available, last_freeze_award_streak, longest_streak } = current;
    let changed = false;

    if (currentStreak > last_freeze_award_streak) {
      const award =
        Math.floor(currentStreak / 7) - Math.floor(last_freeze_award_streak / 7);
      if (award > 0) {
        freezes_available = Math.min(MAX_FREEZES, freezes_available + award);
      }
      last_freeze_award_streak = currentStreak;
      changed = true;
    } else if (currentStreak < last_freeze_award_streak) {
      last_freeze_award_streak = currentStreak;
      changed = true;
    }

    if (currentStreak > longest_streak) {
      longest_streak = currentStreak;
      changed = true;
    }

    if (!changed) return;

    const next: UserSettings = {
      ...current,
      freezes_available,
      last_freeze_award_streak,
      longest_streak,
      user_id: userId,
      updated_at: new Date().toISOString()
    };

    await db.user_settings.put(next);
    await db.outbox.add({
      table: 'user_settings',
      op: 'upsert',
      row_id: userId,
      payload: next,
      queued_at: Date.now(),
      attempts: 0,
      last_error: null
    });
  });
}
