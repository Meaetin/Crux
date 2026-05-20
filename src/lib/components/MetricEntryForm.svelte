<script lang="ts">
  import { untrack } from 'svelte';
  import type { BodyMetric, UnitSystem } from '$lib/db/schema';
  import { kgToLb, lbToKg, weightLabelFor } from '$lib/utils/units';
  import { todayLocal } from '$lib/utils/dates';

  let {
    initial,
    defaultDate,
    unitSystem,
    onsubmit,
    submitting = false
  }: {
    initial?: BodyMetric;
    defaultDate?: string;
    unitSystem: UnitSystem;
    onsubmit: (values: {
      weight: number | null;
      recorded_at: string;
      notes: string | null;
    }) => void;
    submitting?: boolean;
  } = $props();

  function initialWeightInput(): string {
    const kg = initial?.weight;
    if (kg == null) return '';
    const displayed = unitSystem === 'metric' ? kg : kgToLb(kg);
    return displayed.toFixed(1);
  }

  let weightInput = $state(untrack(initialWeightInput));
  let recordedAt = $state(
    untrack(() => initial?.recorded_at?.slice(0, 10) ?? defaultDate ?? todayLocal())
  );
  let notes = $state(untrack(() => initial?.notes ?? ''));

  const canSubmit = $derived(weightInput.trim().length > 0 && !submitting);

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const parsed = parseFloat(weightInput);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    const kg = unitSystem === 'metric' ? parsed : lbToKg(parsed);
    onsubmit({
      weight: Number(kg.toFixed(3)),
      recorded_at: recordedAt,
      notes: notes.trim() || null
    });
  }
</script>

<form id="metric-entry-form" class="metric-entry-form" onsubmit={handleSubmit}>
  <label class="metric-entry-form-field">
    <span class="metric-entry-form-label">Weight ({weightLabelFor(unitSystem)})</span>
    <input
      class="metric-entry-form-input tnum"
      type="text"
      inputmode="decimal"
      bind:value={weightInput}
      placeholder={unitSystem === 'metric' ? '72.5' : '160.0'}
      autocomplete="off"
      required
    />
  </label>

  <label class="metric-entry-form-field">
    <span class="metric-entry-form-label">Date</span>
    <input
      class="metric-entry-form-input"
      type="date"
      bind:value={recordedAt}
      max={todayLocal()}
      required
    />
  </label>

  <label class="metric-entry-form-field">
    <span class="metric-entry-form-label">Notes</span>
    <textarea
      class="metric-entry-form-textarea"
      bind:value={notes}
      placeholder="Anything worth remembering"
      rows="3"
      maxlength={500}
    ></textarea>
  </label>
</form>

<style>
  .metric-entry-form {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .metric-entry-form-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .metric-entry-form-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-fg-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .metric-entry-form-input,
  .metric-entry-form-textarea {
    background: var(--color-surface-1);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-md);
    padding: 14px;
    color: var(--color-fg);
    font-size: 1rem;
    font-family: inherit;
    min-height: 48px;
  }
  .metric-entry-form-textarea {
    resize: vertical;
    min-height: 88px;
  }
  .metric-entry-form-input:focus,
  .metric-entry-form-textarea:focus {
    outline: none;
    border-color: var(--color-brand);
  }
</style>
