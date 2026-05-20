<script module lang="ts">
  export const CATEGORIES = [
    { value: 'strength', label: 'Strength', color: 'var(--color-strength)' },
    { value: 'cardio', label: 'Cardio', color: 'var(--color-cardio)' },
    { value: 'flexibility', label: 'Flexibility', color: 'var(--color-flexibility)' },
    { value: 'sports', label: 'Sports', color: 'var(--color-sports)' }
  ] as const;

  export const CUSTOM_CATEGORY = {
    value: 'custom',
    label: 'Custom',
    color: 'var(--color-custom)'
  } as const;

  export type CategoryValue = (typeof CATEGORIES)[number]['value'] | string;

  export function isPredefinedCategory(value: string): boolean {
    return CATEGORIES.some((c) => c.value === value);
  }

  export function categoryMeta(value: string) {
    const predefined = CATEGORIES.find((c) => c.value === value);
    if (predefined) return predefined;
    return { value, label: value, color: CUSTOM_CATEGORY.color };
  }
</script>

<script lang="ts">
  let {
    category,
    showDot = true,
    size = 'sm'
  }: {
    category: string;
    showDot?: boolean;
    size?: 'sm' | 'md';
  } = $props();

  const meta = $derived(categoryMeta(category));
</script>

<span
  class="category-chip inline-flex items-center gap-1.5 rounded-md font-medium uppercase tracking-wide"
  class:category-chip-sm={size === 'sm'}
  class:category-chip-md={size === 'md'}
  style="background-color: color-mix(in srgb, {meta.color} 12%, transparent); color: {meta.color};"
>
  {#if showDot}
    <span class="category-chip-dot rounded-full" style="background-color: {meta.color};"></span>
  {/if}
  <span class="category-chip-label">{meta.label}</span>
</span>

<style>
  .category-chip-sm {
    font-size: 0.6875rem;
    padding: 0.1875rem 0.5rem;
  }
  .category-chip-md {
    font-size: 0.75rem;
    padding: 0.25rem 0.625rem;
  }
  .category-chip-sm .category-chip-dot {
    width: 0.375rem;
    height: 0.375rem;
  }
  .category-chip-md .category-chip-dot {
    width: 0.5rem;
    height: 0.5rem;
  }
</style>
