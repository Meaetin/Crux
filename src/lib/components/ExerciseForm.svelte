<script lang="ts">
  import { untrack } from 'svelte';
  import type { Exercise, MeasurementType } from '$lib/db/schema';
  import { CATEGORIES, CUSTOM_CATEGORY, isPredefinedCategory } from './CategoryChip.svelte';

  const MEASUREMENT_TYPES: { value: MeasurementType; label: string; hint: string }[] = [
    { value: 'reps', label: 'Reps', hint: 'e.g. push ups, squats' },
    { value: 'duration', label: 'Duration', hint: 'e.g. plank, dead hang' },
    { value: 'weight', label: 'Weight', hint: 'e.g. bench press' },
    { value: 'distance', label: 'Distance', hint: 'e.g. running, cycling' },
    { value: 'custom', label: 'Custom', hint: 'anything else' }
  ];

  let {
    initial,
    onsubmit,
    submitting = false
  }: {
    initial?: Exercise;
    onsubmit: (values: {
      name: string;
      categories: string[];
      measurement_type: MeasurementType;
    }) => void;
    submitting?: boolean;
  } = $props();

  let name = $state(untrack(() => initial?.name ?? ''));

  let selectedPredefined = $state<string[]>(
    untrack(() => {
      const incoming = initial?.categories ?? [];
      const fromInitial = incoming.filter(isPredefinedCategory);
      return fromInitial.length > 0 ? fromInitial : initial ? [] : ['strength'];
    })
  );

  let customNames = $state<string[]>(
    untrack(() => (initial?.categories ?? []).filter((c) => !isPredefinedCategory(c)))
  );

  let customDraft = $state('');

  let measurementType = $state<MeasurementType>(
    untrack(() => initial?.measurement_type ?? 'reps')
  );

  const resolvedCategories = $derived([...selectedPredefined, ...customNames]);

  const canSubmit = $derived(
    name.trim().length > 0 && resolvedCategories.length > 0 && !submitting
  );

  function togglePredefined(value: string) {
    selectedPredefined = selectedPredefined.includes(value)
      ? selectedPredefined.filter((v) => v !== value)
      : [...selectedPredefined, value];
  }

  function addCustomName() {
    const trimmed = customDraft.trim();
    if (!trimmed) return;
    const exists = customNames.some((c) => c.toLowerCase() === trimmed.toLowerCase());
    if (!exists) customNames = [...customNames, trimmed];
    customDraft = '';
  }

  function removeCustomName(value: string) {
    customNames = customNames.filter((c) => c !== value);
  }

  function handleCustomKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addCustomName();
    }
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    addCustomName();
    if (!canSubmit) return;
    onsubmit({
      name: name.trim(),
      categories: resolvedCategories,
      measurement_type: measurementType
    });
  }

  const hint = $derived(
    MEASUREMENT_TYPES.find((m) => m.value === measurementType)?.hint ?? ''
  );
</script>

<form id="exercise-form" class="exercise-form" onsubmit={handleSubmit}>
  <label class="exercise-form-field">
    <span class="exercise-form-label">Name</span>
    <input
      class="exercise-form-input"
      type="text"
      bind:value={name}
      placeholder="e.g. Push Ups"
      autocomplete="off"
      autocapitalize="words"
      required
      maxlength={80}
    />
  </label>

  <div class="exercise-form-field">
    <span class="exercise-form-label">Categories</span>
    <div class="exercise-form-chip-row" aria-label="Categories">
      {#each CATEGORIES as cat (cat.value)}
        {@const active = selectedPredefined.includes(cat.value)}
        <button
          type="button"
          class="exercise-form-chip press-feedback"
          class:exercise-form-chip-active={active}
          style="--chip-color: {cat.color};"
          aria-pressed={active}
          onclick={() => togglePredefined(cat.value)}
        >
          <span class="exercise-form-chip-dot" style="background-color: {cat.color};"></span>
          {cat.label}
        </button>
      {/each}
      {#each customNames as custom (custom)}
        <button
          type="button"
          class="exercise-form-chip exercise-form-chip-active exercise-form-chip-custom press-feedback"
          style="--chip-color: {CUSTOM_CATEGORY.color};"
          aria-pressed="true"
          aria-label="Remove {custom}"
          onclick={() => removeCustomName(custom)}
        >
          <span
            class="exercise-form-chip-dot"
            style="background-color: {CUSTOM_CATEGORY.color};"
          ></span>
          {custom}
          <span class="exercise-form-chip-remove" aria-hidden="true">×</span>
        </button>
      {/each}
    </div>
    <div class="exercise-form-custom-row">
      <input
        class="exercise-form-input exercise-form-custom-input"
        type="text"
        bind:value={customDraft}
        onkeydown={handleCustomKeydown}
        placeholder="Add custom (e.g. Mobility)"
        autocomplete="off"
        autocapitalize="words"
        maxlength={32}
        aria-label="Add a custom category"
      />
      <button
        type="button"
        class="exercise-form-custom-add press-feedback"
        onclick={addCustomName}
        disabled={!customDraft.trim()}
      >
        Add
      </button>
    </div>
  </div>

  <div class="exercise-form-field">
    <span class="exercise-form-label">Measurement</span>
    <div class="exercise-form-chip-row" role="radiogroup" aria-label="Measurement type">
      {#each MEASUREMENT_TYPES as m (m.value)}
        <button
          type="button"
          class="exercise-form-chip exercise-form-chip-neutral press-feedback"
          class:exercise-form-chip-neutral-active={measurementType === m.value}
          role="radio"
          aria-checked={measurementType === m.value}
          onclick={() => (measurementType = m.value)}
        >
          {m.label}
        </button>
      {/each}
    </div>
    <span class="exercise-form-hint">{hint}</span>
  </div>
</form>

<style>
  .exercise-form {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .exercise-form-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .exercise-form-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-fg-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .exercise-form-input {
    background: var(--color-surface-1);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-md);
    padding: 14px 14px;
    color: var(--color-fg);
    font-size: 1rem;
    font-family: inherit;
  }
  .exercise-form-input:focus {
    outline: none;
    border-color: var(--color-brand);
  }

  .exercise-form-chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .exercise-form-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    border-radius: var(--radius-md);
    background: var(--color-surface-1);
    border: 1px solid var(--color-line);
    color: var(--color-fg-muted);
    font-size: 0.875rem;
    font-weight: 500;
    min-height: 44px;
  }
  .exercise-form-chip-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
  }
  .exercise-form-chip-active {
    background: color-mix(in srgb, var(--chip-color) 14%, var(--color-surface-1));
    border-color: var(--chip-color);
    color: var(--color-fg);
  }

  .exercise-form-chip-neutral-active {
    background: var(--color-surface-3);
    border-color: var(--color-brand);
    color: var(--color-fg);
  }

  .exercise-form-hint {
    font-size: 0.75rem;
    color: var(--color-fg-faint);
  }

  .exercise-form-custom-row {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }
  .exercise-form-custom-input {
    flex: 1;
    min-width: 0;
  }
  .exercise-form-custom-add {
    min-height: 44px;
    padding: 0 16px;
    border-radius: var(--radius-md);
    background: var(--color-surface-3);
    color: var(--color-fg);
    font-family: inherit;
    font-weight: 600;
    font-size: 0.875rem;
  }
  .exercise-form-custom-add:disabled {
    opacity: 0.5;
  }
  .exercise-form-chip-custom {
    padding-right: 10px;
  }
  .exercise-form-chip-remove {
    margin-left: 2px;
    font-size: 1rem;
    line-height: 1;
    opacity: 0.8;
  }
</style>
