import Dexie, { type Table } from 'dexie';

export type MeasurementType = 'reps' | 'duration' | 'weight' | 'distance' | 'custom';

export interface Exercise {
  id: string;
  user_id: string;
  name: string;
  categories: string[];
  measurement_type: MeasurementType;
  created_at: string;
  updated_at: string;
}

export interface WorkoutEntry {
  id: string;
  user_id: string;
  exercise_id: string;
  exercise_name: string | null;
  exercise_categories: string[] | null;
  exercise_measurement_type: MeasurementType | null;
  workout_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSet {
  id: string;
  workout_entry_id: string;
  position: number;
  reps: number | null;
  weight: number | null;
  duration_seconds: number | null;
  distance: number | null;
  calories: number | null;
  rest_seconds: number | null;
}

export interface BodyMetric {
  id: string;
  user_id: string;
  weight: number | null;
  notes: string | null;
  recorded_at: string;
  updated_at: string;
}

export type UnitSystem = 'metric' | 'imperial';

export interface StreakFreeze {
  id: string;
  user_id: string;
  applied_date: string;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  user_id: string;
  notify_streak_enabled: boolean;
  notify_streak_time: string;
  longest_streak: number;
  freezes_available: number;
  last_freeze_award_streak: number;
  height_cm: number | null;
  unit_system: UnitSystem;
  updated_at: string;
}

export type OutboxTable =
  | 'exercises'
  | 'workout_entries'
  | 'workout_sets'
  | 'body_metrics'
  | 'streak_freezes'
  | 'user_settings';
export type OutboxOp = 'upsert' | 'delete';

export interface OutboxItem {
  id?: number;
  table: OutboxTable;
  op: OutboxOp;
  row_id: string;
  payload: unknown;
  queued_at: number;
  attempts: number;
  last_error: string | null;
}

class FitnessDB extends Dexie {
  exercises!: Table<Exercise, string>;
  workout_entries!: Table<WorkoutEntry, string>;
  workout_sets!: Table<WorkoutSet, string>;
  body_metrics!: Table<BodyMetric, string>;
  streak_freezes!: Table<StreakFreeze, string>;
  user_settings!: Table<UserSettings, string>;
  outbox!: Table<OutboxItem, number>;

  constructor() {
    super('fitness-tracker');

    this.version(1).stores({
      exercises: 'id, user_id, category, updated_at',
      workout_entries: 'id, user_id, exercise_id, workout_date, [user_id+workout_date]',
      workout_sets: 'id, workout_entry_id, [workout_entry_id+position]',
      body_metrics: 'id, user_id, recorded_at',
      outbox: '++id, queued_at, [table+row_id]'
    });

    this.version(2).stores({
      streak_freezes: 'id, user_id, applied_date, [user_id+applied_date]',
      user_settings: 'user_id'
    });

    this.version(3)
      .stores({})
      .upgrade(async (tx) => {
        await tx
          .table('body_metrics')
          .toCollection()
          .modify((row: Record<string, unknown>) => {
            delete row.height;
            delete row.bmi;
            if (typeof row.notes === 'undefined') row.notes = null;
          });
        await tx
          .table('user_settings')
          .toCollection()
          .modify((row: Record<string, unknown>) => {
            if (typeof row.height_cm === 'undefined') row.height_cm = null;
            if (typeof row.unit_system === 'undefined') row.unit_system = 'metric';
          });
      });

    this.version(4)
      .stores({})
      .upgrade(async (tx) => {
        await tx
          .table('user_settings')
          .toCollection()
          .modify((row: Record<string, unknown>) => {
            if (typeof row.freezes_available === 'undefined') row.freezes_available = 1;
            if (typeof row.last_freeze_award_streak === 'undefined') row.last_freeze_award_streak = 0;
          });
      });

    this.version(5)
      .stores({
        exercises: 'id, user_id, *categories, updated_at'
      })
      .upgrade(async (tx) => {
        await tx
          .table('exercises')
          .toCollection()
          .modify((row: Record<string, unknown>) => {
            delete row.archived;
            if (!Array.isArray(row.categories)) {
              const single = typeof row.category === 'string' ? row.category.trim() : '';
              row.categories = single ? [single] : [];
            }
            delete row.category;
          });
      });

    this.version(6)
      .stores({})
      .upgrade(async (tx) => {
        await tx
          .table('workout_entries')
          .toCollection()
          .modify((row: Record<string, unknown>) => {
            if (typeof row.exercise_name === 'undefined') row.exercise_name = null;
            if (typeof row.exercise_categories === 'undefined') row.exercise_categories = null;
            if (typeof row.exercise_measurement_type === 'undefined')
              row.exercise_measurement_type = null;
          });
      });
  }
}

export const db = new FitnessDB();
