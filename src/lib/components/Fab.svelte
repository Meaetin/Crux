<script lang="ts">
  import Icon from './Icon.svelte';
  import type { Snippet } from 'svelte';

  let {
    onclick,
    label,
    icon = 'plus',
    children
  }: {
    onclick: () => void;
    label: string;
    icon?: 'plus' | 'edit' | 'check';
    children?: Snippet;
  } = $props();
</script>

<button
  type="button"
  class="fab press-feedback"
  aria-label={label}
  {onclick}
>
  {#if children}
    {@render children()}
  {:else}
    <Icon name={icon} size={24} strokeWidth={2.5} />
  {/if}
</button>

<style>
  .fab {
    position: fixed;
    right: 16px;
    bottom: calc(72px + max(8px, env(safe-area-inset-bottom)));
    width: 56px;
    height: 56px;
    border-radius: var(--radius-md);
    background: var(--color-brand);
    color: var(--color-on-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow:
      0 10px 25px -8px color-mix(in srgb, var(--color-brand) 45%, transparent),
      0 4px 10px -4px rgba(0, 0, 0, 0.35);
    z-index: 40;
  }
  .fab:active {
    background: var(--color-brand-strong);
  }
</style>
