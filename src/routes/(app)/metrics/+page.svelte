<script lang="ts">
  import { bodyMetricsLive, createBodyMetric, deleteBodyMetric, updateBodyMetric } from '$lib/db/metrics';
  import { settingsLive, updateSettings } from '$lib/db/settings';
  import { recentWorkoutsLive } from '$lib/db/workouts';
  import { exercisesLive } from '$lib/db/exercises';
  import { weeklyWorkoutCounts, personalBests, formatPersonalBest } from '$lib/utils/analytics';
  import { bmiCategory, computeBmi, formatWeight } from '$lib/utils/units';
  import type { BodyMetric, UnitSystem } from '$lib/db/schema';
  import { shortDate } from '$lib/utils/dates';

  import Sheet from '$lib/components/Sheet.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton.svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
  import GradeChip from '$lib/components/GradeChip.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import HeightPrompt from '$lib/components/HeightPrompt.svelte';
  import MetricEntryForm from '$lib/components/MetricEntryForm.svelte';
  import WeightCalendar from '$lib/components/WeightCalendar.svelte';
  import WeightTrendChart from '$lib/components/charts/WeightTrendChart.svelte';
  import WeeklyFrequencyChart from '$lib/components/charts/WeeklyFrequencyChart.svelte';

  const FREQUENCY_WEEKS = 12;

  const settings = $derived($settingsLive);
  const metrics = $derived(($bodyMetricsLive ?? []) as BodyMetric[]);
  const workouts = $derived($recentWorkoutsLive ?? []);
  const exercises = $derived($exercisesLive ?? []);

  const unitSystem = $derived<UnitSystem>(settings?.unit_system ?? 'metric');
  const heightCm = $derived(settings?.height_cm ?? null);

  const latest = $derived(metrics[0] ?? null);
  const currentBmi = $derived(computeBmi(latest?.weight ?? null, heightCm));

  const weeklyCounts = $derived(weeklyWorkoutCounts(workouts, FREQUENCY_WEEKS));
  const prs = $derived(personalBests(workouts, exercises));

  let sheetOpen = $state(false);
  let editingMetric = $state<BodyMetric | null>(null);
  let presetDate = $state<string | null>(null);
  let saving = $state(false);

  let deleteCandidate = $state<BodyMetric | null>(null);
  let confirmOpen = $state(false);

  function openForDate(iso: string, metric: BodyMetric | null) {
    editingMetric = metric;
    presetDate = metric ? null : iso;
    sheetOpen = true;
  }

  function askDeleteCurrent() {
    if (!editingMetric) return;
    deleteCandidate = editingMetric;
    sheetOpen = false;
    confirmOpen = true;
  }

  async function handleSubmit(values: {
    weight: number | null;
    recorded_at: string;
    notes: string | null;
  }) {
    saving = true;
    try {
      if (editingMetric) {
        await updateBodyMetric(editingMetric.id, values);
      } else {
        await createBodyMetric(values);
      }
      sheetOpen = false;
      editingMetric = null;
    } finally {
      saving = false;
    }
  }

  async function toggleUnits() {
    if (!settings) return;
    await updateSettings({
      unit_system: settings.unit_system === 'metric' ? 'imperial' : 'metric'
    });
  }

  async function confirmDelete() {
    if (!deleteCandidate) return;
    await deleteBodyMetric(deleteCandidate.id);
    deleteCandidate = null;
  }
</script>

<section class="metrics-shell">
  <PageHeader title="Metrics">
    {#snippet actions()}
      <button type="button" class="metrics-unit-toggle press-feedback" onclick={toggleUnits}>
        {unitSystem === 'metric' ? 'kg / cm' : 'lb / ft'}
      </button>
    {/snippet}
  </PageHeader>

  <div class="metrics-content">
  <!-- Body weight -->
  <section class="metrics-section">
    <div class="metrics-section-header">
      <h2 class="metrics-section-title">Body weight</h2>
      {#if latest}
        <span class="metrics-section-meta">Last: {shortDate(latest.recorded_at.slice(0, 10))}</span>
      {/if}
    </div>

    <div class="metrics-summary">
      <div class="metrics-summary-tile">
        <span class="metrics-summary-label">Current</span>
        <span class="metrics-summary-value tnum">
          {latest ? formatWeight(latest.weight, unitSystem) : '—'}
        </span>
      </div>
      <div class="metrics-summary-tile">
        <span class="metrics-summary-label">BMI</span>
        {#if heightCm && currentBmi != null}
          <span class="metrics-summary-value tnum">{currentBmi.toFixed(1)}</span>
          <span class="metrics-summary-sub">{bmiCategory(currentBmi)}</span>
        {:else}
          <span class="metrics-summary-value metrics-summary-muted">—</span>
        {/if}
      </div>
    </div>

    {#if heightCm == null}
      <HeightPrompt {unitSystem} />
    {/if}

    <WeightTrendChart entries={metrics} {unitSystem} />

    <WeightCalendar {metrics} {unitSystem} onSelect={openForDate} />
  </section>

  <!-- Workout frequency -->
  <section class="metrics-section">
    <div class="metrics-section-header">
      <h2 class="metrics-section-title">Workout frequency</h2>
      <span class="metrics-section-meta">Last {FREQUENCY_WEEKS} weeks</span>
    </div>
    <WeeklyFrequencyChart counts={weeklyCounts} />
  </section>

  <!-- Personal bests -->
  <section id="personal-bests" class="metrics-section metrics-section-anchor">
    <div class="metrics-section-header">
      <h2 class="metrics-section-title">Personal bests</h2>
    </div>
    {#if prs.length === 0}
      <div class="metrics-empty">
        <p class="metrics-empty-body">Log a workout to start tracking PRs.</p>
      </div>
    {:else}
      <ul class="metrics-pr-list">
        {#each prs as pr (pr.exercise_id)}
          <li class="metrics-pr-row">
            <GradeChip grade={pr.grade} />
            <div class="metrics-pr-row-primary">
              <span class="metrics-pr-row-exercise">{pr.exercise_name}</span>
              <span class="metrics-pr-row-value tnum">{formatPersonalBest(pr)}</span>
            </div>
            <span class="metrics-pr-row-date">{shortDate(pr.achieved_on)}</span>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
  </div>
</section>

<Sheet
  bind:open={sheetOpen}
  title={editingMetric ? 'Edit weight entry' : 'Log weight'}
  onClose={() => {
    editingMetric = null;
    presetDate = null;
  }}
>
  {#snippet children()}
    {#key editingMetric?.id ?? presetDate ?? 'new'}
      <MetricEntryForm
        initial={editingMetric ?? undefined}
        defaultDate={presetDate ?? undefined}
        {unitSystem}
        onsubmit={handleSubmit}
        submitting={saving}
      />
    {/key}
  {/snippet}
  {#snippet footer()}
    <div class="metrics-sheet-footer">
      <PrimaryButton type="submit" form="metric-entry-form" loading={saving}>
        {#snippet children()}
          {editingMetric ? 'Save changes' : 'Save entry'}
        {/snippet}
      </PrimaryButton>
      {#if editingMetric}
        <button
          type="button"
          class="metrics-sheet-delete press-feedback"
          onclick={askDeleteCurrent}
        >
          Delete entry
        </button>
      {/if}
    </div>
  {/snippet}
</Sheet>

<ConfirmModal
  bind:open={confirmOpen}
  title="Delete entry?"
  message="This removes the weight entry permanently."
  confirmLabel="Delete"
  danger
  onConfirm={confirmDelete}
/>

<style>
  .metrics-shell {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  .metrics-content {
    padding: 0 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  .metrics-unit-toggle {
    height: 32px;
    padding: 0 12px;
    border-radius: 999px;
    background: var(--color-surface-2);
    color: var(--color-fg);
    border: 1px solid var(--color-line);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-feature-settings: 'tnum';
  }

  .metrics-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .metrics-section-anchor {
    scroll-margin-top: 16px;
  }
  .metrics-section-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }
  .metrics-section-title {
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-fg);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .metrics-section-meta {
    font-size: 0.6875rem;
    color: var(--color-fg-faint);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .metrics-summary {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .metrics-summary-tile {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 14px;
    background: var(--color-surface-1);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-lg);
  }
  .metrics-summary-label {
    font-size: 0.6875rem;
    color: var(--color-fg-faint);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
  }
  .metrics-summary-value {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.5rem;
    color: var(--color-fg);
    line-height: 1.1;
  }
  .metrics-summary-muted {
    color: var(--color-fg-muted);
  }
  .metrics-summary-sub {
    font-size: 0.75rem;
    color: var(--color-fg-muted);
  }

  .metrics-sheet-footer {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .metrics-sheet-delete {
    width: 100%;
    min-height: 44px;
    padding: 0 18px;
    background: transparent;
    color: var(--color-danger);
    border: none;
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-weight: 600;
    font-family: inherit;
    letter-spacing: 0.02em;
  }
  .metrics-sheet-delete:active {
    background: color-mix(in srgb, var(--color-danger) 12%, transparent);
  }

  .metrics-pr-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .metrics-pr-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: var(--color-surface-1);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-md);
  }
  .metrics-pr-row-primary {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .metrics-pr-row-exercise {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-fg);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .metrics-pr-row-value {
    font-size: 0.8125rem;
    color: var(--color-fg-muted);
  }
  .metrics-pr-row-date {
    flex: 0 0 auto;
    font-size: 0.75rem;
    color: var(--color-fg-faint);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .metrics-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 4px;
    padding: 24px 16px;
    background: var(--color-surface-1);
    border: 1px dashed var(--color-line);
    border-radius: var(--radius-lg);
    color: var(--color-fg-muted);
  }
  .metrics-empty-body {
    font-size: 0.875rem;
  }
</style>
