<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    type = 'button',
    onclick,
    disabled = false,
    loading = false,
    danger = false,
    form,
    children
  }: {
    type?: 'button' | 'submit';
    onclick?: () => void;
    disabled?: boolean;
    loading?: boolean;
    danger?: boolean;
    form?: string;
    children: Snippet;
  } = $props();
</script>

<button
  {type}
  {form}
  class="primary-button press-feedback"
  class:primary-button-danger={danger}
  disabled={disabled || loading}
  {onclick}
>
  {#if loading}
    <span class="primary-button-spinner" aria-hidden="true"></span>
  {/if}
  <span class="primary-button-label">{@render children()}</span>
</button>

<style>
  .primary-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    min-height: 48px;
    padding: 0 18px;
    background: var(--color-brand);
    color: var(--color-on-primary);
    border-radius: var(--radius-md);
    font-size: 1rem;
    font-weight: 600;
    font-family: inherit;
  }
  .primary-button:disabled {
    opacity: 0.45;
  }
  .primary-button-danger {
    background: color-mix(in srgb, var(--color-danger) 14%, var(--color-surface-1));
    color: var(--color-danger);
    border: 1px solid color-mix(in srgb, var(--color-danger) 40%, transparent);
  }
  .primary-button-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 999px;
    animation: spin 700ms linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .primary-button-spinner {
      animation: none;
      opacity: 0.6;
    }
  }
</style>
