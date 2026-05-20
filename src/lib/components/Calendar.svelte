<script lang="ts">
  import { untrack } from 'svelte';
  import Icon from './Icon.svelte';
  import { todayLocal } from '$lib/utils/dates';

  let {
    value,
    max,
    onSelect
  }: {
    value: string;
    max?: string;
    onSelect: (iso: string) => void;
  } = $props();

  let viewMonth = $state(untrack(() => value.slice(0, 7)));

  $effect(() => {
    viewMonth = value.slice(0, 7);
  });

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

  const grid = $derived(buildGrid(viewMonth));

  const monthLabel = $derived.by(() => {
    const [y, m] = viewMonth.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric'
    });
  });

  const today = todayLocal();

  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  function isDisabled(iso: string): boolean {
    return !!max && iso > max;
  }

  function nextMonthDisabled(): boolean {
    if (!max) return false;
    const [y, m] = viewMonth.split('-').map(Number);
    const nextMonthStart = `${y}-${pad(m + 1)}-01`;
    const adj =
      m === 12 ? `${y + 1}-01-01` : nextMonthStart;
    return adj > max;
  }

  function handlePick(iso: string) {
    if (!iso || isDisabled(iso)) return;
    onSelect(iso);
  }
</script>

<div class="calendar">
  <header class="calendar-header">
    <button
      type="button"
      class="calendar-nav press-feedback"
      onclick={() => changeMonth(-1)}
      aria-label="Previous month"
    >
      <Icon name="chevron-right" size={18} class="calendar-nav-flip" />
    </button>
    <div class="calendar-month-label">{monthLabel}</div>
    <button
      type="button"
      class="calendar-nav press-feedback"
      onclick={() => changeMonth(1)}
      disabled={nextMonthDisabled()}
      aria-label="Next month"
    >
      <Icon name="chevron-right" size={18} />
    </button>
  </header>

  <div class="calendar-weekdays" aria-hidden="true">
    {#each weekdays as wd, i (i)}
      <span class="calendar-weekday">{wd}</span>
    {/each}
  </div>

  <div class="calendar-grid">
    {#each grid as cell, i (i)}
      {#if cell.thisMonth}
        <button
          type="button"
          class="calendar-cell tnum"
          class:calendar-cell-today={cell.iso === today}
          class:calendar-cell-selected={cell.iso === value}
          disabled={isDisabled(cell.iso)}
          onclick={() => handlePick(cell.iso)}
          aria-label={cell.iso}
          aria-current={cell.iso === today ? 'date' : undefined}
        >
          {cell.day}
        </button>
      {:else}
        <span class="calendar-cell-empty" aria-hidden="true"></span>
      {/if}
    {/each}
  </div>
</div>

<style>
  .calendar {
    background: var(--color-surface-2);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-lg);
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 0 2px 2px;
  }
  .calendar-nav {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-fg-muted);
  }
  .calendar-nav:active {
    background: var(--color-surface-3);
    color: var(--color-fg);
  }
  .calendar-nav:disabled {
    opacity: 0.3;
  }
  :global(.calendar-nav-flip) {
    transform: rotate(180deg);
  }
  .calendar-month-label {
    flex: 1;
    text-align: center;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-fg);
  }

  .calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    padding: 0 2px;
  }
  .calendar-weekday {
    text-align: center;
    font-size: 0.625rem;
    font-weight: 700;
    color: var(--color-fg-faint);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 4px 0;
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }

  .calendar-cell {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-fg);
    font-family: var(--font-display);
    font-weight: 500;
    font-size: 0.9375rem;
    border: 1px solid transparent;
    transition: background-color 80ms ease-out, color 80ms ease-out;
  }
  .calendar-cell:active {
    background: var(--color-surface-3);
  }
  .calendar-cell-today {
    border-color: var(--color-line-strong);
    color: var(--color-fg);
  }
  .calendar-cell-selected {
    background: var(--color-brand);
    color: var(--color-on-primary);
    border-color: var(--color-brand);
    font-weight: 700;
  }
  .calendar-cell-selected:active {
    background: var(--color-brand-strong);
  }
  .calendar-cell:disabled {
    opacity: 0.25;
  }

  .calendar-cell-empty {
    aspect-ratio: 1;
  }
</style>
