<script lang="ts">
  let {
    grade,
    size = 'md'
  }: {
    grade: number;
    size?: 'sm' | 'md';
  } = $props();
</script>

<span
  class="grade-chip grade-chip-{size}"
  aria-label="Grade V{grade}"
>
  V{grade}
</span>

<style>
  .grade-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1.5px solid var(--color-brand);
    border-radius: var(--radius-md);
    color: var(--color-brand);
    background: color-mix(in srgb, var(--color-brand) 6%, transparent);
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-weight: 700;
    letter-spacing: 0.04em;
    font-variant-numeric: tabular-nums;
    flex: 0 0 auto;
    line-height: 1;
  }
  .grade-chip-md {
    min-width: 42px;
    height: 32px;
    padding: 0 8px;
    font-size: 0.9375rem;
  }
  .grade-chip-sm {
    min-width: 30px;
    height: 22px;
    padding: 0 6px;
    font-size: 0.6875rem;
  }
</style>
