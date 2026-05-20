import { liveQuery } from 'dexie';
import { db } from './schema';
import { session } from '$lib/state/session.svelte';
import { addDays, todayLocal } from '$lib/utils/dates';
import { getTier, type TierProgress } from '$lib/utils/tiers';

export const DAILY_GOAL = 3;
const LOOKBACK_DAYS = 400;

export interface StreakStatus {
  currentStreak: number;
  longestStreak: number;
  todayProgress: number;
  goalMet: boolean;
  goalRemaining: number;
  freezesAvailable: number;
  freezeAppliedToday: boolean;
  hoursLeftToday: number;
  minutesLeftToday: number;
  today: string;
  recentDays: DayState[];
  tier: TierProgress;
}

export type DayKind = 'kept' | 'frozen' | 'missed' | 'today-pending' | 'today-done';

export interface DayState {
  date: string;
  kind: DayKind;
  count: number;
}

function countsByDate(dates: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const d of dates) map.set(d, (map.get(d) ?? 0) + 1);
  return map;
}

export async function computeStreak(userId: string, today = todayLocal()): Promise<StreakStatus> {
  const lookbackStart = addDays(today, -LOOKBACK_DAYS);

  const entries = await db.workout_entries
    .where('[user_id+workout_date]')
    .between([userId, lookbackStart], [userId, today], true, true)
    .toArray();

  const dateCounts = countsByDate(entries.map((e) => e.workout_date));
  const validDays = new Set<string>();
  for (const [d, n] of dateCounts) if (n >= DAILY_GOAL) validDays.add(d);

  const freezes = await db.streak_freezes.where('user_id').equals(userId).toArray();
  const frozenSet = new Set(freezes.map((f) => f.applied_date));

  const todayCount = dateCounts.get(today) ?? 0;
  const goalMet = todayCount >= DAILY_GOAL;
  const goalRemaining = Math.max(0, DAILY_GOAL - todayCount);

  let chain = 0;
  let cursor: string;
  if (validDays.has(today) || frozenSet.has(today)) {
    chain = 1;
    cursor = addDays(today, -1);
  } else {
    cursor = addDays(today, -1);
  }

  while (validDays.has(cursor) || frozenSet.has(cursor)) {
    chain++;
    cursor = addDays(cursor, -1);
  }

  const freezeAppliedToday = frozenSet.has(today);

  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const msLeft = midnight.getTime() - now.getTime();
  const hoursLeftToday = Math.floor(msLeft / 3_600_000);
  const minutesLeftToday = Math.floor((msLeft % 3_600_000) / 60_000);

  const recentDays: DayState[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = addDays(today, -i);
    const count = dateCounts.get(d) ?? 0;
    let kind: DayKind;
    if (d === today) {
      kind = goalMet ? 'today-done' : 'today-pending';
    } else if (validDays.has(d)) {
      kind = 'kept';
    } else if (frozenSet.has(d)) {
      kind = 'frozen';
    } else {
      kind = 'missed';
    }
    recentDays.push({ date: d, kind, count });
  }

  const settingsRow = await db.user_settings.get(userId);
  const longestStreak = Math.max(settingsRow?.longest_streak ?? 0, chain);
  const freezesAvailable = settingsRow?.freezes_available ?? 1;

  return {
    currentStreak: chain,
    longestStreak,
    todayProgress: todayCount,
    goalMet,
    goalRemaining,
    freezesAvailable,
    freezeAppliedToday,
    hoursLeftToday,
    minutesLeftToday,
    today,
    recentDays,
    tier: getTier(chain)
  };
}

export const streakLive = liveQuery(async () => {
  const userId = session.current?.user.id;
  if (!userId) return null;
  return computeStreak(userId);
});
