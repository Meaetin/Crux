import { liveQuery } from 'dexie';
import { db, type WorkoutEntry, type WorkoutSet } from './schema';
import { session } from '$lib/state/session.svelte';

export type WorkoutSetDraft = Partial<Omit<WorkoutSet, 'id' | 'workout_entry_id' | 'position'>>;

export interface WorkoutWithSets extends WorkoutEntry {
  sets: WorkoutSet[];
}

function currentUserId(): string {
  const id = session.current?.user.id;
  if (!id) throw new Error('Not signed in');
  return id;
}

export const recentWorkoutsLive = liveQuery(async () => {
  const userId = session.current?.user.id;
  if (!userId) return [] as WorkoutWithSets[];

  const entries = await db.workout_entries.where('user_id').equals(userId).toArray();
  entries.sort((a, b) => {
    if (b.workout_date !== a.workout_date) return b.workout_date.localeCompare(a.workout_date);
    return b.created_at.localeCompare(a.created_at);
  });

  const entryIds = entries.map((e) => e.id);
  const sets = entryIds.length
    ? await db.workout_sets.where('workout_entry_id').anyOf(entryIds).toArray()
    : [];

  const setsByEntry = new Map<string, WorkoutSet[]>();
  for (const s of sets) {
    const arr = setsByEntry.get(s.workout_entry_id) ?? [];
    arr.push(s);
    setsByEntry.set(s.workout_entry_id, arr);
  }

  return entries.map<WorkoutWithSets>((e) => ({
    ...e,
    sets: (setsByEntry.get(e.id) ?? []).sort((a, b) => a.position - b.position)
  }));
});

export async function createWorkout(input: {
  exercise_id: string;
  workout_date: string;
  notes: string | null;
  sets: WorkoutSetDraft[];
}): Promise<WorkoutEntry> {
  const userId = currentUserId();
  const now = new Date().toISOString();

  const entry: WorkoutEntry = {
    id: crypto.randomUUID(),
    user_id: userId,
    exercise_id: input.exercise_id,
    exercise_name: null,
    exercise_categories: null,
    exercise_measurement_type: null,
    workout_date: input.workout_date,
    notes: input.notes?.trim() || null,
    created_at: now,
    updated_at: now
  };

  const sets: WorkoutSet[] = input.sets.map((s, i) => ({
    id: crypto.randomUUID(),
    workout_entry_id: entry.id,
    position: i,
    reps: s.reps ?? null,
    weight: s.weight ?? null,
    duration_seconds: s.duration_seconds ?? null,
    distance: s.distance ?? null,
    calories: s.calories ?? null,
    rest_seconds: s.rest_seconds ?? null
  }));

  await db.transaction(
    'rw',
    db.workout_entries,
    db.workout_sets,
    db.outbox,
    async () => {
      await db.workout_entries.add(entry);
      if (sets.length) await db.workout_sets.bulkAdd(sets);

      const queuedAt = Date.now();
      await db.outbox.add({
        table: 'workout_entries',
        op: 'upsert',
        row_id: entry.id,
        payload: entry,
        queued_at: queuedAt,
        attempts: 0,
        last_error: null
      });
      for (const s of sets) {
        await db.outbox.add({
          table: 'workout_sets',
          op: 'upsert',
          row_id: s.id,
          payload: s,
          queued_at: queuedAt,
          attempts: 0,
          last_error: null
        });
      }
    }
  );

  return entry;
}

export async function getWorkoutWithSets(id: string): Promise<WorkoutWithSets | null> {
  const entry = await db.workout_entries.get(id);
  if (!entry) return null;
  const sets = await db.workout_sets.where('workout_entry_id').equals(id).sortBy('position');
  return { ...entry, sets };
}

export async function updateWorkout(
  id: string,
  patch: {
    exercise_id: string;
    workout_date: string;
    notes: string | null;
    sets: WorkoutSetDraft[];
  }
): Promise<WorkoutEntry> {
  const existing = await db.workout_entries.get(id);
  if (!existing) throw new Error('Workout not found');

  const now = new Date().toISOString();
  const updated: WorkoutEntry = {
    ...existing,
    exercise_id: patch.exercise_id,
    workout_date: patch.workout_date,
    notes: patch.notes?.trim() || null,
    updated_at: now
  };

  const newSets: WorkoutSet[] = patch.sets.map((s, i) => ({
    id: crypto.randomUUID(),
    workout_entry_id: id,
    position: i,
    reps: s.reps ?? null,
    weight: s.weight ?? null,
    duration_seconds: s.duration_seconds ?? null,
    distance: s.distance ?? null,
    calories: s.calories ?? null,
    rest_seconds: s.rest_seconds ?? null
  }));

  await db.transaction(
    'rw',
    db.workout_entries,
    db.workout_sets,
    db.outbox,
    async () => {
      const oldSets = await db.workout_sets.where('workout_entry_id').equals(id).toArray();
      await db.workout_sets.where('workout_entry_id').equals(id).delete();

      await db.workout_entries.put(updated);
      if (newSets.length) await db.workout_sets.bulkAdd(newSets);

      const queuedAt = Date.now();
      await db.outbox.add({
        table: 'workout_entries',
        op: 'upsert',
        row_id: id,
        payload: updated,
        queued_at: queuedAt,
        attempts: 0,
        last_error: null
      });
      for (const s of oldSets) {
        await db.outbox.add({
          table: 'workout_sets',
          op: 'delete',
          row_id: s.id,
          payload: { id: s.id },
          queued_at: queuedAt,
          attempts: 0,
          last_error: null
        });
      }
      for (const s of newSets) {
        await db.outbox.add({
          table: 'workout_sets',
          op: 'upsert',
          row_id: s.id,
          payload: s,
          queued_at: queuedAt,
          attempts: 0,
          last_error: null
        });
      }
    }
  );

  return updated;
}

export async function deleteWorkout(id: string): Promise<void> {
  await db.transaction(
    'rw',
    db.workout_entries,
    db.workout_sets,
    db.outbox,
    async () => {
      await db.workout_entries.delete(id);
      await db.workout_sets.where('workout_entry_id').equals(id).delete();
      await db.outbox.add({
        table: 'workout_entries',
        op: 'delete',
        row_id: id,
        payload: { id },
        queued_at: Date.now(),
        attempts: 0,
        last_error: null
      });
    }
  );
}
