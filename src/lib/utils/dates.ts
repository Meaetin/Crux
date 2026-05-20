function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function fromLocalDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayLocal(): string {
  return fromLocalDate(new Date());
}

export function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return fromLocalDate(d);
}

export function dayName(iso: string): string {
  const today = todayLocal();
  if (iso === today) return 'Today';
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (iso === fromLocalDate(y)) return 'Yesterday';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'long' });
}

export function shortDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function startOfWeek(iso: string, weekStartsOn: 0 | 1 = 0): string {
  const d = new Date(iso + 'T00:00:00');
  const diff = (d.getDay() - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  return fromLocalDate(d);
}

export function weekDates(weekStartIso: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStartIso, i));
}

export function weekdayLetter(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'narrow' });
}

export function dayOfMonth(iso: string): number {
  return new Date(iso + 'T00:00:00').getDate();
}

export function weekRangeLabel(weekStartIso: string): string {
  const start = new Date(weekStartIso + 'T00:00:00');
  const end = new Date(addDays(weekStartIso, 6) + 'T00:00:00');
  const sameMonth = start.getMonth() === end.getMonth();
  const startStr = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const endStr = sameMonth
    ? String(end.getDate())
    : end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${startStr} – ${endStr}`;
}
