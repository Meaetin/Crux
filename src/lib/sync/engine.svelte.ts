import { liveQuery, type Subscription } from 'dexie';
import { supabase } from '$lib/supabase/client';
import { session } from '$lib/state/session.svelte';
import {
  db,
  type BodyMetric,
  type Exercise,
  type OutboxItem,
  type StreakFreeze,
  type UserSettings,
  type WorkoutEntry,
  type WorkoutSet
} from '$lib/db/schema';
import { defaultsFor } from '$lib/db/settings';

type SyncPhase = 'idle' | 'pushing' | 'pulling' | 'error';

export const syncState = $state<{
  phase: SyncPhase;
  lastSyncedAt: number | null;
  pendingCount: number;
  lastError: string | null;
}>({
  phase: 'idle',
  lastSyncedAt: null,
  pendingCount: 0,
  lastError: null
});

const MAX_ATTEMPTS = 5;
const OUTBOX_BATCH = 50;

let outboxSub: Subscription | null = null;
let onlineHandler: (() => void) | null = null;
let visibilityHandler: (() => void) | null = null;
let running = false;
let queued = false;

function setPhase(phase: SyncPhase, error: string | null = null) {
  syncState.phase = phase;
  syncState.lastError = error;
}

async function pushOnce(): Promise<{
  drained: number;
  remaining: number;
  failed: boolean;
  stuckError: string | null;
}> {
  let drained = 0;
  let failed = false;
  let stuckError: string | null = null;
  let cursor = 0;

  for (;;) {
    const batch = await db.outbox
      .where('id')
      .above(cursor)
      .limit(OUTBOX_BATCH)
      .toArray();
    if (batch.length === 0) break;

    for (const item of batch) {
      cursor = item.id!;
      if (item.attempts >= MAX_ATTEMPTS) {
        if (!stuckError && item.last_error) stuckError = item.last_error;
        continue;
      }
      try {
        await pushItem(item);
        await db.outbox.delete(item.id!);
        drained++;
      } catch (err) {
        failed = true;
        const message = err instanceof Error ? err.message : String(err);
        await db.outbox.update(item.id!, {
          attempts: item.attempts + 1,
          last_error: message
        });
        // Stop draining on first failure so a transient error doesn't burn retries
        // on every queued row.
        return { drained, remaining: await db.outbox.count(), failed, stuckError: message };
      }
    }

    if (batch.length < OUTBOX_BATCH) break;
  }

  return { drained, remaining: await db.outbox.count(), failed, stuckError };
}

async function pushItem(item: OutboxItem): Promise<void> {
  if (item.op === 'upsert') {
    const { error } = await supabase.from(item.table).upsert(item.payload as object);
    if (error) throw error;
    return;
  }

  // delete
  const id = (item.payload as { id?: string }).id;
  if (!id) throw new Error(`outbox delete missing id for ${item.table}`);

  // user_settings uses user_id as the PK
  const pkColumn = item.table === 'user_settings' ? 'user_id' : 'id';
  const { error } = await supabase.from(item.table).delete().eq(pkColumn, id);
  if (error) throw error;
}

async function pullSnapshot(): Promise<void> {
  const userId = session.current?.user.id;
  if (!userId) return;

  // Each pipeline owns its own per-table transaction so the table whose fetch
  // returns first commits first and unblocks any liveQuery on it, instead of
  // waiting on the slowest table to write.
  await Promise.all([
    pullExercises(userId),
    pullWorkoutsAndSets(userId),
    pullBodyMetrics(userId),
    pullStreakFreezes(userId),
    pullUserSettings(userId)
  ]);
}

async function pullExercises(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  const rows = (data as Exercise[]) ?? [];

  await db.transaction('rw', db.exercises, async () => {
    await db.exercises.where('user_id').equals(userId).delete();
    if (rows.length) await db.exercises.bulkPut(rows);
  });
}

async function pullWorkoutsAndSets(userId: string): Promise<void> {
  const { data: entriesData, error: entriesError } = await supabase
    .from('workout_entries')
    .select('*')
    .eq('user_id', userId);
  if (entriesError) throw entriesError;
  const entries = (entriesData as WorkoutEntry[]) ?? [];

  let sets: WorkoutSet[] = [];
  if (entries.length) {
    const entryIds = entries.map((e) => e.id);
    const CHUNK = 500;
    for (let i = 0; i < entryIds.length; i += CHUNK) {
      const slice = entryIds.slice(i, i + CHUNK);
      const { data, error } = await supabase
        .from('workout_sets')
        .select('*')
        .in('workout_entry_id', slice);
      if (error) throw error;
      sets = sets.concat((data as WorkoutSet[]) ?? []);
    }
  }

  // Entries + sets share a single transaction so PR/analytics never observes
  // entries without their sets (or vice versa).
  await db.transaction('rw', db.workout_entries, db.workout_sets, async () => {
    const oldEntryIds = await db.workout_entries
      .where('user_id')
      .equals(userId)
      .primaryKeys();
    await db.workout_entries.where('user_id').equals(userId).delete();
    if (oldEntryIds.length) {
      await db.workout_sets.where('workout_entry_id').anyOf(oldEntryIds).delete();
    }
    if (entries.length) await db.workout_entries.bulkPut(entries);
    if (sets.length) await db.workout_sets.bulkPut(sets);
  });
}

async function pullBodyMetrics(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('body_metrics')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  const rows = (data as BodyMetric[]) ?? [];

  await db.transaction('rw', db.body_metrics, async () => {
    await db.body_metrics.where('user_id').equals(userId).delete();
    if (rows.length) await db.body_metrics.bulkPut(rows);
  });
}

async function pullStreakFreezes(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('streak_freezes')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  const rows = (data as StreakFreeze[]) ?? [];

  await db.transaction('rw', db.streak_freezes, async () => {
    await db.streak_freezes.where('user_id').equals(userId).delete();
    if (rows.length) await db.streak_freezes.bulkPut(rows);
  });
}

async function pullUserSettings(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  const settings = (data as UserSettings | null) ?? defaultsFor(userId);

  await db.transaction('rw', db.user_settings, async () => {
    await db.user_settings.put(settings);
  });
}

async function runCycle(): Promise<void> {
  if (running) {
    queued = true;
    return;
  }
  if (!session.current || !navigator.onLine) return;

  running = true;
  try {
    setPhase('pushing');
    const push = await pushOnce();

    // Only pull when the outbox is fully drained — otherwise a snapshot replace
    // would clobber writes still waiting to be pushed.
    if (!push.failed && push.remaining === 0) {
      setPhase('pulling');
      await pullSnapshot();
      syncState.lastSyncedAt = Date.now();
      setPhase('idle');
    } else if (push.failed) {
      setPhase('error', push.stuckError ?? 'Push failed — will retry');
    } else if (push.stuckError) {
      // Items hit MAX_ATTEMPTS and were skipped — surface the real reason so
      // it's actionable (e.g. "column freezes_available does not exist").
      setPhase('error', push.stuckError);
    } else {
      setPhase('idle');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    setPhase('error', message);
  } finally {
    running = false;
    if (queued) {
      queued = false;
      // Re-run on next tick so we don't deepen the stack.
      queueMicrotask(() => {
        void runCycle();
      });
    }
  }
}

export function kickSync(): void {
  void runCycle();
}

export function startSync(): void {
  if (outboxSub) return;

  // Reset retry counters on startup. If the failure was transient (or you
  // fixed the underlying cause — applied a migration, restored network) a
  // refresh should give every queued row another chance.
  void db.outbox
    .filter((item) => item.attempts > 0)
    .modify({ attempts: 0, last_error: null })
    .catch(() => {});

  // Drain whenever the outbox grows.
  outboxSub = liveQuery(() => db.outbox.count()).subscribe({
    next: (count) => {
      syncState.pendingCount = count;
      if (count > 0) kickSync();
    }
  });

  onlineHandler = () => kickSync();
  visibilityHandler = () => {
    if (document.visibilityState === 'visible') kickSync();
  };
  window.addEventListener('online', onlineHandler);
  document.addEventListener('visibilitychange', visibilityHandler);

  // Initial cycle: push anything pending, then pull a snapshot.
  kickSync();
}

export function stopSync(): void {
  outboxSub?.unsubscribe();
  outboxSub = null;
  if (onlineHandler) window.removeEventListener('online', onlineHandler);
  if (visibilityHandler) document.removeEventListener('visibilitychange', visibilityHandler);
  onlineHandler = null;
  visibilityHandler = null;
  running = false;
  queued = false;
  setPhase('idle');
  syncState.lastSyncedAt = null;
  syncState.pendingCount = 0;
}

export async function clearLocalUserData(): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.exercises,
      db.workout_entries,
      db.workout_sets,
      db.body_metrics,
      db.streak_freezes,
      db.user_settings,
      db.outbox
    ],
    async () => {
      await Promise.all([
        db.exercises.clear(),
        db.workout_entries.clear(),
        db.workout_sets.clear(),
        db.body_metrics.clear(),
        db.streak_freezes.clear(),
        db.user_settings.clear(),
        db.outbox.clear()
      ]);
    }
  );
}
