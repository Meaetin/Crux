<script lang="ts">
  import type { MeasurementType, WorkoutSet } from '$lib/db/schema';
  import Icon from './Icon.svelte';

  type SetField = 'reps' | 'weight' | 'duration_seconds' | 'distance';
  type SetDraft = Partial<Omit<WorkoutSet, 'id' | 'workout_entry_id' | 'position'>>;

  let {
    set,
    index,
    measurementType,
    onRemove,
    removable
  }: {
    set: SetDraft;
    index: number;
    measurementType: MeasurementType;
    onRemove: () => void;
    removable: boolean;
  } = $props();

  const fields = $derived(fieldsFor(measurementType));

  function fieldsFor(t: MeasurementType): SetField[] {
    switch (t) {
      case 'reps':
        return ['reps'];
      case 'weight':
        return ['weight', 'reps'];
      case 'duration':
        return ['duration_seconds'];
      case 'distance':
        return ['distance', 'duration_seconds'];
      case 'custom':
        return ['reps', 'weight', 'duration_seconds'];
    }
  }

  const labels: Record<SetField, { label: string; unit: string; step: string }> = {
    reps: { label: 'Reps', unit: '', step: '1' },
    weight: { label: 'Weight', unit: 'kg', step: '0.5' },
    duration_seconds: { label: 'Duration', unit: 'mm:ss', step: '1' },
    distance: { label: 'Distance', unit: 'km', step: '0.01' }
  };

  function handleInput(field: SetField, raw: string) {
    if (raw === '') {
      set[field] = null;
      return;
    }
    const n = Number(raw);
    set[field] = Number.isFinite(n) ? n : null;
  }

  function minutesOf(total: number | null | undefined): string {
    if (total == null) return '';
    return String(Math.floor(total / 60));
  }
  function secondsOf(total: number | null | undefined): string {
    if (total == null) return '';
    return String(total % 60);
  }

  function handleDurationInput(which: 'min' | 'sec', raw: string) {
    const cur = set.duration_seconds ?? 0;
    let m = Math.floor(cur / 60);
    let s = cur % 60;

    const parsed = raw === '' ? 0 : Math.max(0, Number(raw));
    if (!Number.isFinite(parsed)) return;

    if (which === 'min') m = parsed;
    else s = parsed;

    const total = m * 60 + s;
    set.duration_seconds = total === 0 && raw === '' && (which === 'min' ? s === 0 : m === 0)
      ? null
      : total;
  }
</script>

<div class="set-input-row">
  <div class="set-input-position tnum">{index + 1}</div>

  <div class="set-input-fields">
    {#each fields as field (field)}
      {#if field === 'duration_seconds'}
        <div class="set-input-field">
          <span class="set-input-label">
            {labels[field].label}
            <span class="set-input-unit">{labels[field].unit}</span>
          </span>
          <div class="set-input-duration-controls">
            <input
              class="set-input-input set-input-duration-half tnum"
              type="number"
              inputmode="numeric"
              min="0"
              placeholder="00"
              aria-label="Minutes"
              value={minutesOf(set.duration_seconds)}
              oninput={(e) => handleDurationInput('min', e.currentTarget.value)}
            />
            <span class="set-input-duration-sep" aria-hidden="true">:</span>
            <input
              class="set-input-input set-input-duration-half tnum"
              type="number"
              inputmode="numeric"
              min="0"
              max="59"
              placeholder="00"
              aria-label="Seconds"
              value={secondsOf(set.duration_seconds)}
              oninput={(e) => handleDurationInput('sec', e.currentTarget.value)}
            />
          </div>
        </div>
      {:else}
        <label class="set-input-field">
          <span class="set-input-label">
            {labels[field].label}
            {#if labels[field].unit}<span class="set-input-unit">{labels[field].unit}</span>{/if}
          </span>
          <input
            class="set-input-input tnum"
            type="number"
            inputmode="decimal"
            min="0"
            step={labels[field].step}
            value={set[field] ?? ''}
            oninput={(e) => handleInput(field, e.currentTarget.value)}
          />
        </label>
      {/if}
    {/each}
  </div>

  {#if removable}
    <button
      type="button"
      class="set-input-remove press-feedback"
      onclick={onRemove}
      aria-label="Remove set"
    >
      <Icon name="trash" size={18} />
    </button>
  {/if}
</div>

<style>
  .set-input-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    background: var(--color-surface-1);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-lg);
  }

  .set-input-position {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.125rem;
    width: 28px;
    color: var(--color-fg-faint);
    text-align: center;
    flex-shrink: 0;
  }

  .set-input-fields {
    flex: 1;
    display: flex;
    gap: 10px;
    min-width: 0;
  }

  .set-input-field {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .set-input-label {
    font-size: 0.625rem;
    font-weight: 600;
    color: var(--color-fg-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    display: flex;
    align-items: baseline;
    gap: 4px;
  }
  .set-input-unit {
    color: var(--color-fg-faint);
    font-weight: 500;
  }

  .set-input-input {
    background: var(--color-bg);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-md);
    padding: 10px 10px;
    color: var(--color-fg);
    font-size: 1rem;
    font-family: inherit;
    width: 100%;
    min-width: 0;
    -moz-appearance: textfield;
    appearance: textfield;
  }
  .set-input-input::-webkit-outer-spin-button,
  .set-input-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .set-input-input:focus {
    outline: none;
    border-color: var(--color-brand);
  }

  .set-input-duration-controls {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .set-input-duration-half {
    flex: 1;
    text-align: center;
    padding-left: 4px;
    padding-right: 4px;
  }
  .set-input-duration-sep {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.25rem;
    color: var(--color-fg-faint);
    line-height: 1;
  }

  .set-input-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-fg-faint);
    flex-shrink: 0;
  }
  .set-input-remove:active {
    background: var(--color-surface-3);
    color: var(--color-danger);
  }
</style>
