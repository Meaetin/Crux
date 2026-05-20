import type { Exercise, MeasurementType, WorkoutSet } from '$lib/db/schema';
import type { WorkoutWithSets } from '$lib/db/workouts';
import { addDays, startOfWeek, todayLocal } from './dates';

export interface WeeklyCount {
  week_start: string;
  count: number;
}

const MONDAY_START = 1 as const;

export function weeklyWorkoutCounts(
  workouts: readonly WorkoutWithSets[],
  weeks: number
): WeeklyCount[] {
  const today = todayLocal();
  const currentWeekStart = startOfWeek(today, MONDAY_START);

  const buckets = new Map<string, number>();
  for (let i = weeks - 1; i >= 0; i--) {
    buckets.set(addDays(currentWeekStart, -7 * i), 0);
  }

  const earliest = addDays(currentWeekStart, -7 * (weeks - 1));
  for (const w of workouts) {
    if (w.workout_date < earliest || w.workout_date > today) continue;
    const bucket = startOfWeek(w.workout_date, MONDAY_START);
    const current = buckets.get(bucket);
    if (current !== undefined) buckets.set(bucket, current + 1);
  }

  return Array.from(buckets.entries()).map(([week_start, count]) => ({
    week_start,
    count
  }));
}

export interface PersonalBest {
  exercise_id: string;
  exercise_name: string;
  measurement_type: MeasurementType;
  value: number;
  unit: 'kg' | 'reps' | 's' | 'km';
  achieved_on: string;
  /** V-grade: number of distinct days this exercise's PR has been broken (>= 1). */
  grade: number;
}

function bestFromSet(set: WorkoutSet, measurement: MeasurementType): number | null {
  switch (measurement) {
    case 'weight':
      return set.weight;
    case 'reps':
      return set.reps;
    case 'duration':
      return set.duration_seconds;
    case 'distance':
      return set.distance;
    default:
      return null;
  }
}

function unitFor(measurement: MeasurementType): PersonalBest['unit'] | null {
  switch (measurement) {
    case 'weight':
      return 'kg';
    case 'reps':
      return 'reps';
    case 'duration':
      return 's';
    case 'distance':
      return 'km';
    default:
      return null;
  }
}

export function personalBests(
  workouts: readonly WorkoutWithSets[],
  exercises: readonly Exercise[]
): PersonalBest[] {
  const exerciseById = new Map(exercises.map((e) => [e.id, e]));

  // Group by exercise so we can walk each one's history independently.
  const workoutsByExercise = new Map<string, WorkoutWithSets[]>();
  for (const w of workouts) {
    if (!w.exercise_id) continue;
    const list = workoutsByExercise.get(w.exercise_id) ?? [];
    list.push(w);
    workoutsByExercise.set(w.exercise_id, list);
  }

  const result: PersonalBest[] = [];

  for (const [exerciseId, exerciseWorkouts] of workoutsByExercise) {
    const live = exerciseById.get(exerciseId);
    const sample = exerciseWorkouts[0];
    const name = live?.name ?? sample.exercise_name;
    const measurement = live?.measurement_type ?? sample.exercise_measurement_type;
    if (!name || !measurement) continue;
    const unit = unitFor(measurement);
    if (!unit) continue;

    // Best value per workout day — same-day improvements don't inflate the grade.
    const bestByDay = new Map<string, number>();
    for (const w of exerciseWorkouts) {
      for (const set of w.sets) {
        const v = bestFromSet(set, measurement);
        if (v == null) continue;
        const prev = bestByDay.get(w.workout_date);
        if (prev == null || v > prev) bestByDay.set(w.workout_date, v);
      }
    }
    if (bestByDay.size === 0) continue;

    // Walk days chronologically; each strict improvement is a PR break.
    const sortedDays = Array.from(bestByDay.keys()).sort();
    let runningBest = -Infinity;
    let grade = 0;
    let bestValue = 0;
    let bestDay = '';
    for (const day of sortedDays) {
      const v = bestByDay.get(day)!;
      if (v > runningBest) {
        grade++;
        runningBest = v;
        bestValue = v;
        bestDay = day;
      }
    }

    result.push({
      exercise_id: exerciseId,
      exercise_name: name,
      measurement_type: measurement,
      value: bestValue,
      unit,
      achieved_on: bestDay,
      grade
    });
  }

  return result.sort((a, b) => b.achieved_on.localeCompare(a.achieved_on));
}

export function formatPersonalBest(pb: PersonalBest): string {
  switch (pb.measurement_type) {
    case 'weight':
      return `${pb.value} kg`;
    case 'reps':
      return `${pb.value} reps`;
    case 'distance':
      return `${pb.value} km`;
    case 'duration': {
      const total = Math.round(pb.value);
      const min = Math.floor(total / 60);
      const sec = total % 60;
      return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
    }
    default:
      return String(pb.value);
  }
}
