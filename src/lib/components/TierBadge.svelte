<script lang="ts">
  import type { Tier } from '$lib/utils/tiers';

  let {
    tier,
    size = 'md'
  }: {
    tier: Tier;
    size?: 'sm' | 'md';
  } = $props();

  const TIER_COLORS: Record<string, string> = {
    Spark: '#737373',
    Ember: '#f59e0b',
    Flame: '#f97316',
    Blaze: '#ef4444',
    Inferno: '#dc2626',
    Wildfire: '#a855f7',
    Phoenix: '#ec4899',
    Eternal: '#22d3ee'
  };

  const color = $derived(TIER_COLORS[tier.name] ?? 'var(--color-streak)');
</script>

<span
  class="tier-badge"
  class:tier-badge-sm={size === 'sm'}
  class:tier-badge-md={size === 'md'}
  style="background-color: color-mix(in srgb, {color} 14%, transparent); color: {color}; border-color: color-mix(in srgb, {color} 32%, transparent);"
>
  <span class="tier-badge-dot" style="background-color: {color};"></span>
  <span class="tier-badge-label">{tier.name}</span>
</span>

<style>
  .tier-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    font-family: var(--font-display);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .tier-badge-sm {
    font-size: 0.6875rem;
    padding: 0.1875rem 0.5rem;
  }
  .tier-badge-md {
    font-size: 0.8125rem;
    padding: 0.3125rem 0.625rem;
  }
  .tier-badge-dot {
    width: 0.4375rem;
    height: 0.4375rem;
    border-radius: 9999px;
    box-shadow: 0 0 6px currentColor;
  }
</style>
