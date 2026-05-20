<script lang="ts">
  import type { UnitSystem } from '$lib/db/schema';
  import { feetInchesToCm } from '$lib/utils/units';
  import { updateSettings } from '$lib/db/settings';

  let {
    unitSystem,
    onSaved
  }: {
    unitSystem: UnitSystem;
    onSaved?: () => void;
  } = $props();

  let cmInput = $state('');
  let ftInput = $state('');
  let inInput = $state('');
  let saving = $state(false);
  let error = $state<string | null>(null);

  const canSave = $derived.by(() => {
    if (saving) return false;
    if (unitSystem === 'metric') return parseFloat(cmInput) > 0;
    return parseFloat(ftInput) >= 0 && parseFloat(inInput) >= 0 && (parseFloat(ftInput) + parseFloat(inInput)) > 0;
  });

  async function save() {
    if (!canSave) return;
    saving = true;
    error = null;
    try {
      const cm =
        unitSystem === 'metric'
          ? parseFloat(cmInput)
          : feetInchesToCm(parseFloat(ftInput) || 0, parseFloat(inInput) || 0);
      if (!Number.isFinite(cm) || cm <= 0) {
        error = 'Enter a valid height';
        return;
      }
      await updateSettings({ height_cm: cm });
      onSaved?.();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Could not save';
    } finally {
      saving = false;
    }
  }
</script>

<div class="height-prompt">
  <p class="height-prompt-message">Set your height once to see BMI on each entry.</p>
  <div class="height-prompt-row">
    {#if unitSystem === 'metric'}
      <label class="height-prompt-field">
        <span class="height-prompt-label">Height (cm)</span>
        <input
          class="height-prompt-input tnum"
          type="text"
          inputmode="numeric"
          bind:value={cmInput}
          placeholder="175"
        />
      </label>
    {:else}
      <label class="height-prompt-field">
        <span class="height-prompt-label">Feet</span>
        <input
          class="height-prompt-input tnum"
          type="text"
          inputmode="numeric"
          bind:value={ftInput}
          placeholder="5"
        />
      </label>
      <label class="height-prompt-field">
        <span class="height-prompt-label">Inches</span>
        <input
          class="height-prompt-input tnum"
          type="text"
          inputmode="numeric"
          bind:value={inInput}
          placeholder="9"
        />
      </label>
    {/if}
    <button
      type="button"
      class="height-prompt-save press-feedback"
      onclick={save}
      disabled={!canSave}
    >
      {saving ? 'Saving…' : 'Save'}
    </button>
  </div>
  {#if error}
    <p class="height-prompt-error">{error}</p>
  {/if}
</div>

<style>
  .height-prompt {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px;
    background: var(--color-surface-1);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-lg);
  }
  .height-prompt-message {
    font-size: 0.875rem;
    color: var(--color-fg-muted);
    margin: 0;
  }
  .height-prompt-row {
    display: flex;
    gap: 8px;
    align-items: flex-end;
  }
  .height-prompt-field {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .height-prompt-label {
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--color-fg-faint);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .height-prompt-input {
    background: var(--color-surface-2);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-md);
    padding: 12px;
    color: var(--color-fg);
    font-size: 1rem;
    font-family: inherit;
    min-height: 44px;
  }
  .height-prompt-input:focus {
    outline: none;
    border-color: var(--color-brand);
  }
  .height-prompt-save {
    flex: 0 0 auto;
    min-height: 44px;
    padding: 0 16px;
    border-radius: var(--radius-md);
    background: var(--color-brand);
    color: var(--color-on-primary);
    font-weight: 600;
    font-size: 0.875rem;
  }
  .height-prompt-save:disabled {
    opacity: 0.4;
  }
  .height-prompt-error {
    color: var(--color-danger);
    font-size: 0.8125rem;
    margin: 0;
  }
</style>
