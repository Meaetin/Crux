import { liveQuery } from 'dexie';
import { db, type Exercise, type MeasurementType } from './schema';
import { session } from '$lib/state/session.svelte';

function currentUserId(): string {
  const id = session.current?.user.id;
  if (!id) throw new Error('Not signed in');
  return id;
}

export const exercisesLive = liveQuery(async () => {
  const userId = session.current?.user.id;
  if (!userId) return [] as Exercise[];
  const rows = await db.exercises.where('user_id').equals(userId).toArray();
  return rows.sort((a, b) => a.name.localeCompare(b.name));
});

export async function createExercise(input: {
  name: string;
  categories: string[];
  measurement_type: MeasurementType;
}): Promise<Exercise> {
  const userId = currentUserId();
  const now = new Date().toISOString();
  const exercise: Exercise = {
    id: crypto.randomUUID(),
    user_id: userId,
    name: input.name.trim(),
    categories: input.categories,
    measurement_type: input.measurement_type,
    created_at: now,
    updated_at: now
  };

  await db.transaction('rw', db.exercises, db.outbox, async () => {
    await db.exercises.add(exercise);
    await db.outbox.add({
      table: 'exercises',
      op: 'upsert',
      row_id: exercise.id,
      payload: exercise,
      queued_at: Date.now(),
      attempts: 0,
      last_error: null
    });
  });

  return exercise;
}

export async function updateExercise(
  id: string,
  patch: Partial<Pick<Exercise, 'name' | 'categories' | 'measurement_type'>>
): Promise<Exercise> {
  const existing = await db.exercises.get(id);
  if (!existing) throw new Error('Exercise not found');

  const updated: Exercise = {
    ...existing,
    ...patch,
    name: patch.name?.trim() ?? existing.name,
    updated_at: new Date().toISOString()
  };

  await db.transaction('rw', db.exercises, db.outbox, async () => {
    await db.exercises.put(updated);
    await db.outbox.add({
      table: 'exercises',
      op: 'upsert',
      row_id: updated.id,
      payload: updated,
      queued_at: Date.now(),
      attempts: 0,
      last_error: null
    });
  });

  return updated;
}

export async function deleteExercise(id: string): Promise<void> {
  const existing = await db.exercises.get(id);
  if (!existing) return;

  await db.transaction(
    'rw',
    db.exercises,
    db.workout_entries,
    db.outbox,
    async () => {
      const relatedWorkouts = await db.workout_entries
        .where('exercise_id')
        .equals(id)
        .toArray();

      const queuedAt = Date.now();

      for (const entry of relatedWorkouts) {
        const snapshotted = {
          ...entry,
          exercise_name: entry.exercise_name ?? existing.name,
          exercise_categories: entry.exercise_categories ?? existing.categories,
          exercise_measurement_type:
            entry.exercise_measurement_type ?? existing.measurement_type,
          updated_at: new Date().toISOString()
        };
        await db.workout_entries.put(snapshotted);
        await db.outbox.add({
          table: 'workout_entries',
          op: 'upsert',
          row_id: snapshotted.id,
          payload: snapshotted,
          queued_at: queuedAt,
          attempts: 0,
          last_error: null
        });
      }

      await db.exercises.delete(id);
      await db.outbox.add({
        table: 'exercises',
        op: 'delete',
        row_id: id,
        payload: { id },
        queued_at: queuedAt,
        attempts: 0,
        last_error: null
      });
    }
  );
}
