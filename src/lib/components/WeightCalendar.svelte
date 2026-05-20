<script lang="ts">
  import Icon from './Icon.svelte';
  import { todayLocal } from '$lib/utils/dates';
  import { kgToLb, formatWeight } from '$lib/utils/units';
  import type { BodyMetric, UnitSystem } from '$lib/db/schema';

  let {
    metrics,
    unitSystem,
    onSelect
  }: {
    metrics: BodyMetric[];
    unitSystem: UnitSystem;
    onSelect: (iso: string, metric: BodyMetric | null) => void;
  } = $props();

  const today = todayLocal();
  let viewMonth = $state(today.slice(0, 7));

  type Cell = { iso: string; day: number; thisMonth: boolean };

  function pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  function buildGrid(ym: string): Cell[] {
    const [year, month] = ym.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDow = firstDay.getDay();
    const cells: Cell[] = [];

    for (let i = 0; i < startDow; i++) {
      cells.push({ iso: '', day: 0, thisMonth: false });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      cells.push({
        iso: `${year}-${pad(month)}-${pad(d)}`,
        day: d,
        thisMonth: true
      });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ iso: '', day: 0, thisMonth: false });
    }
    return cells;
  }

  function changeMonth(delta: number) {
    const [y, m] = viewMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    viewMonth = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  }

  const metricsByDate = $derived.by(() => {
    const map = new Map<string, BodyMetric>();
    for (const m of metrics) {
      const key = m.recorded_at.slice(0, 10);
      const existing = map.get(key);
      if (!existing || m.recorded_at > existing.recorded_at) {
        map.set(key, m);
      }
    }
    return map;
  });

  const grid = $derived(buildGrid(viewMonth));

  const monthLabel = $derived.by(() => {
    const [y, m] = viewMonth.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric'
    });
  });

  function nextMonthDisabled(): boolean {
    const [y, m] = viewMonth.split('-').map(Number);
    const nextStart = m === 12 ? `${y + 1}-01-01` : `${y}-${pad(m + 1)}-01`;
    return nextStart > today;
  }

  function isFuture(iso: string): boolean {
    return iso > today;
  }

  function formatWeightShort(kg: number | null): string {
    if (kg == null) return '';
    const value = unitSystem === 'metric' ? kg : kgToLb(kg);
    return value.toFixed(1);
  }

  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  function handlePick(iso: string) {
    if (!iso || isFuture(iso)) return;
    const m = metricsByDate.get(iso) ?? null;
    onSelect(iso, m);
  }
</script>

<div class="weight-calendar">
  <header class="weight-calendar-header">
    <button
      type="button"
      class="weight-calendar-nav press-feedback"
      onclick={() => changeMonth(-1)}
      aria-label="Previous month"
    >
      <Icon name="chevron-right" size={18} class="weight-calendar-nav-flip" />
    </button>
    <div class="weight-calendar-month-label">{monthLabel}</div>
    <button
      type="button"
      class="weight-calendar-nav press-feedback"
      onclick={() => changeMonth(1)}
      disabled={nextMonthDisabled()}
      aria-label="Next month"
    >
      <Icon name="chevron-right" size={18} />
    </button>
  </header>

  <div class="weight-calendar-weekdays" aria-hidden="true">
    {#each weekdays as wd, i (i)}
      <span class="weight-calendar-weekday">{wd}</span>
    {/each}
  </div>

  <div class="weight-calendar-grid">
    {#each grid as cell, i (i)}
      {#if cell.thisMonth}
        {@const entry = metricsByDate.get(cell.iso) ?? null}
        <button
          type="button"
          class="weight-calendar-cell tnum"
          class:weight-calendar-cell-today={cell.iso === today}
          class:weight-calendar-cell-has-entry={!!entry}
          disabled={isFuture(cell.iso)}
          onclick={() => handlePick(cell.iso)}
          aria-label={entry
            ? `${cell.iso}: ${formatWeight(entry.weight, unitSystem)}`
            : cell.iso}
        >
          <span class="weight-calendar-cell-day">{cell.day}</span>
          {#if entry}
            <span class="weight-calendar-cell-weight">{formatWeightShort(entry.weight)}</span>
          {:else}
            <span class="weight-calendar-cell-weight weight-calendar-cell-weight-empty" aria-hidden="true"></span>
          {/if}
        </button>
      {:else}
        <span class="weight-calendar-cell-empty" aria-hidden="true"></span>
      {/if}
    {/each}
  </div>
</div>

<style>
  .weight-calendar {
    background: var(--color-surface-1);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-lg);
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .weight-calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 0 2px 2px;
  }
  .weight-calendar-nav {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-fg-muted);
  }
  .weight-calendar-nav:active {
    background: var(--color-surface-3);
    color: var(--color-fg);
  }
  .weight-calendar-nav:disabled {
    opacity: 0.3;
  }
  :global(.weight-calendar-nav-flip) {
    transform: rotate(180deg);
  }
  .weight-calendar-month-label {
    flex: 1;
    text-align: center;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-fg);
  }

  .weight-calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    padding: 0 2px;
  }
  .weight-calendar-weekday {
    text-align: center;
    font-size: 0.625rem;
    font-weight: 700;
    color: var(--color-fg-faint);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 4px 0;
  }

  .weight-calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }

  .weight-calendar-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-height: 52px;
    padding: 6px 2px;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-fg);
    border: 1px solid transparent;
    font-family: inherit;
    transition: background-color 80ms ease-out, color 80ms ease-out;
  }
  .weight-calendar-cell:active {
    background: var(--color-surface-3);
  }
  .weight-calendar-cell:disabled {
    opacity: 0.3;
  }
  .weight-calendar-cell-day {
    font-family: var(--font-display);
    font-weight: 500;
    font-size: 0.9375rem;
    line-height: 1;
    color: var(--color-fg-muted);
  }
  .weight-calendar-cell-weight {
    font-size: 0.6875rem;
    font-weight: 600;
    line-height: 1;
    color: var(--color-brand);
    min-height: 0.6875rem;
  }
  .weight-calendar-cell-weight-empty {
    color: transparent;
  }

  .weight-calendar-cell-today {
    border-color: var(--color-line-strong);
  }
  .weight-calendar-cell-today .weight-calendar-cell-day {
    color: var(--color-fg);
    font-weight: 700;
  }

  .weight-calendar-cell-has-entry {
    background: color-mix(in srgb, var(--color-brand) 10%, transparent);
  }
  .weight-calendar-cell-has-entry .weight-calendar-cell-day {
    color: var(--color-fg);
    font-weight: 600;
  }
  .weight-calendar-cell-has-entry.weight-calendar-cell-today {
    background: color-mix(in srgb, var(--color-brand) 18%, transparent);
    border-color: var(--color-brand);
  }

  .weight-calendar-cell-empty {
    min-height: 52px;
  }
</style>
