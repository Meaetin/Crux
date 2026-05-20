import { liveQuery } from 'dexie';
import { db, type BodyMetric } from './schema';
import { session } from '$lib/state/session.svelte';

function currentUserId(): string {
  const id = session.current?.user.id;
  if (!id) throw new Error('Not signed in');
  return id;
}

export const bodyMetricsLive = liveQuery(async () => {
  const userId = session.current?.user.id;
  if (!userId) return [] as BodyMetric[];

  const rows = await db.body_metrics.where('user_id').equals(userId).toArray();
  rows.sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));
  return rows;
});

export async function createBodyMetric(input: {
  weight: number | null;
  recorded_at: string;
  notes: string | null;
}): Promise<BodyMetric> {
  const userId = currentUserId();
  const now = new Date().toISOString();

  const row: BodyMetric = {
    id: crypto.randomUUID(),
    user_id: userId,
    weight: input.weight,
    notes: input.notes?.trim() || null,
    recorded_at: input.recorded_at,
    updated_at: now
  };

  await db.transaction('rw', db.body_metrics, db.outbox, async () => {
    await db.body_metrics.add(row);
    await db.outbox.add({
      table: 'body_metrics',
      op: 'upsert',
      row_id: row.id,
      payload: row,
      queued_at: Date.now(),
      attempts: 0,
      last_error: null
    });
  });

  return row;
}

export async function updateBodyMetric(
  id: string,
  patch: Partial<Omit<BodyMetric, 'id' | 'user_id'>>
): Promise<BodyMetric> {
  const existing = await db.body_metrics.get(id);
  if (!existing) throw new Error('Metric not found');

  const next: BodyMetric = {
    ...existing,
    ...patch,
    notes: patch.notes !== undefined ? patch.notes?.trim() || null : existing.notes,
    updated_at: new Date().toISOString()
  };

  await db.transaction('rw', db.body_metrics, db.outbox, async () => {
    await db.body_metrics.put(next);
    await db.outbox.add({
      table: 'body_metrics',
      op: 'upsert',
      row_id: next.id,
      payload: next,
      queued_at: Date.now(),
      attempts: 0,
      last_error: null
    });
  });

  return next;
}

export async function deleteBodyMetric(id: string): Promise<void> {
  await db.transaction('rw', db.body_metrics, db.outbox, async () => {
    await db.body_metrics.delete(id);
    await db.outbox.add({
      table: 'body_metrics',
      op: 'delete',
      row_id: id,
      payload: { id },
      queued_at: Date.now(),
      attempts: 0,
      last_error: null
    });
  });
}
