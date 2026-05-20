<script lang="ts">
  import type { DayState } from '$lib/db/streaks';
  import { shortDate, weekdayLetter } from '$lib/utils/dates';

  let { days }: { days: DayState[] } = $props();
</script>

<section class="streak-calendar" aria-label="14 day history">
  <header class="streak-calendar-header">
    <span class="streak-calendar-title">Last 14 days · tick list</span>
  </header>
  <ol class="streak-calendar-row" role="list">
    {#each days as day (day.date)}
      <li
        class="streak-calendar-cell"
        class:streak-calendar-cell-kept={day.kind === 'kept'}
        class:streak-calendar-cell-frozen={day.kind === 'frozen'}
        class:streak-calendar-cell-missed={day.kind === 'missed'}
        class:streak-calendar-cell-today-done={day.kind === 'today-done'}
        class:streak-calendar-cell-today-pending={day.kind === 'today-pending'}
        title="{shortDate(day.date)} · {day.count} workout{day.count === 1 ? '' : 's'}"
      >
        <span class="streak-calendar-cell-letter">{weekdayLetter(day.date)}</span>
        <svg
          class="streak-calendar-cell-mark"
          viewBox="0 0 12 12"
          aria-hidden="true"
        >
          {#if day.kind === 'kept' || day.kind === 'today-done'}
            <path d="M2 2 L10 10 M10 2 L2 10" />
          {:else if day.kind === 'frozen'}
            <path d="M2 6 L10 6" />
          {:else}
            <circle cx="6" cy="6" r="1.5" />
          {/if}
        </svg>
      </li>
    {/each}
  </ol>
  <footer class="streak-calendar-legend">
    <span class="streak-calendar-legend-item">
      <svg class="streak-calendar-legend-mark" viewBox="0 0 12 12" aria-hidden="true">
        <path d="M2 2 L10 10 M10 2 L2 10" style="stroke: var(--color-brand)" />
      </svg>
      Sent
    </span>
    <span class="streak-calendar-legend-item">
      <svg class="streak-calendar-legend-mark" viewBox="0 0 12 12" aria-hidden="true">
        <path d="M2 6 L10 6" style="stroke: var(--color-frozen)" />
      </svg>
      Frozen
    </span>
    <span class="streak-calendar-legend-item">
      <svg class="streak-calendar-legend-mark" viewBox="0 0 12 12" aria-hidden="true">
        <circle cx="6" cy="6" r="1.5" style="fill: var(--color-line-strong); stroke: none" />
      </svg>
      Missed
    </span>
  </footer>
</section>

<style>
  .streak-calendar {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px;
    background: var(--color-surface-1);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-lg);
  }
  .streak-calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .streak-calendar-title {
    font-family: var(--font-display);
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-fg-muted);
  }

  .streak-calendar-row {
    display: grid;
    grid-template-columns: repeat(14, 1fr);
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .streak-calendar-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 4px 0;
    border-radius: var(--radius-md);
  }
  .streak-calendar-cell-letter {
    font-family: var(--font-display);
    font-size: 0.625rem;
    font-weight: 700;
    color: var(--color-fg-faint);
    text-transform: uppercase;
    line-height: 1;
  }

  .streak-calendar-cell-mark {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: var(--color-line-strong);
    stroke-width: 2;
    stroke-linecap: square;
    transition:
      stroke 180ms ease-out,
      filter 180ms ease-out;
  }
  .streak-calendar-cell-mark circle {
    stroke: none;
    fill: var(--color-line-strong);
  }

  .streak-calendar-cell-kept .streak-calendar-cell-mark {
    stroke: var(--color-brand);
  }
  .streak-calendar-cell-frozen .streak-calendar-cell-mark {
    stroke: var(--color-frozen);
  }
  .streak-calendar-cell-missed .streak-calendar-cell-mark circle {
    fill: var(--color-line-strong);
    opacity: 0.5;
  }
  .streak-calendar-cell-today-done .streak-calendar-cell-mark {
    stroke: var(--color-brand);
    filter: drop-shadow(0 0 4px color-mix(in srgb, var(--color-brand) 50%, transparent));
  }
  .streak-calendar-cell-today-pending .streak-calendar-cell-mark circle {
    fill: none;
    stroke: var(--color-brand);
    stroke-width: 1.5;
    r: 3;
    animation: streak-calendar-pulse 1.6s ease-in-out infinite;
  }
  .streak-calendar-cell-today-done .streak-calendar-cell-letter,
  .streak-calendar-cell-today-pending .streak-calendar-cell-letter {
    color: var(--color-fg);
  }

  @keyframes streak-calendar-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.45; }
  }

  .streak-calendar-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    padding-top: 2px;
  }
  .streak-calendar-legend-item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 0.6875rem;
    color: var(--color-fg-muted);
  }
  .streak-calendar-legend-mark {
    width: 10px;
    height: 10px;
    fill: none;
    stroke-width: 2;
    stroke-linecap: square;
  }
</style>
