export interface Tier {
  index: number;
  name: string;
  min: number;
  next: number | null;
}

export const TIERS: Tier[] = [
  { index: 0, name: 'Spark', min: 0, next: 3 },
  { index: 1, name: 'Ember', min: 3, next: 7 },
  { index: 2, name: 'Flame', min: 7, next: 14 },
  { index: 3, name: 'Blaze', min: 14, next: 30 },
  { index: 4, name: 'Inferno', min: 30, next: 60 },
  { index: 5, name: 'Wildfire', min: 60, next: 100 },
  { index: 6, name: 'Phoenix', min: 100, next: 365 },
  { index: 7, name: 'Eternal', min: 365, next: null }
];

export interface TierProgress {
  tier: Tier;
  currentStreak: number;
  nextThreshold: number | null;
  daysIntoTier: number;
  daysToNext: number | null;
  progressFraction: number;
}

export function getTier(streakDays: number): TierProgress {
  const safe = Math.max(0, Math.floor(streakDays));
  const tier = [...TIERS].reverse().find((t) => safe >= t.min) ?? TIERS[0];
  const daysIntoTier = safe - tier.min;
  const daysToNext = tier.next === null ? null : tier.next - safe;
  const span = tier.next === null ? 1 : tier.next - tier.min;
  const progressFraction = tier.next === null ? 1 : Math.min(1, daysIntoTier / span);
  return {
    tier,
    currentStreak: safe,
    nextThreshold: tier.next,
    daysIntoTier,
    daysToNext,
    progressFraction
  };
}
