import { db, type StreakFreeze, type UserSettings } from './schema';
import { session } from '$lib/state/session.svelte';
import { todayLocal } from '$lib/utils/dates';
import { defaultsFor } from './settings';

export type UseFreezeResult =
  | { ok: true }
  | { ok: false; reason: 'no-freezes' | 'already-frozen' | 'not-signed-in' };

export async function useFreezeToday(): Promise<UseFreezeResult> {
  const userId = session.current?.user.id;
  if (!userId) return { ok: false, reason: 'not-signed-in' };

  const today = todayLocal();
  const now = new Date().toISOString();
  const queuedAt = Date.now();

  return await db.transaction(
    'rw',
    db.user_settings,
    db.streak_freezes,
    db.outbox,
    async (): Promise<UseFreezeResult> => {
      const existing = await db.streak_freezes
        .where('[user_id+applied_date]')
        .equals([userId, today])
        .count();
      if (existing > 0) return { ok: false, reason: 'already-frozen' };

      const settings = (await db.user_settings.get(userId)) ?? defaultsFor(userId);
      if (settings.freezes_available <= 0) return { ok: false, reason: 'no-freezes' };

      const freeze: StreakFreeze = {
        id: crypto.randomUUID(),
        user_id: userId,
        applied_date: today,
        created_at: now,
        updated_at: now
      };
      const nextSettings: UserSettings = {
        ...settings,
        freezes_available: settings.freezes_available - 1,
        user_id: userId,
        updated_at: now
      };

      await db.streak_freezes.add(freeze);
      await db.user_settings.put(nextSettings);
      await db.outbox.bulkAdd([
        {
          table: 'streak_freezes',
          op: 'upsert',
          row_id: freeze.id,
          payload: freeze,
          queued_at: queuedAt,
          attempts: 0,
          last_error: null
        },
        {
          table: 'user_settings',
          op: 'upsert',
          row_id: userId,
          payload: nextSettings,
          queued_at: queuedAt,
          attempts: 0,
          last_error: null
        }
      ]);

      return { ok: true };
    }
  );
}
