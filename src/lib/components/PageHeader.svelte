<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title,
    subtitle,
    actions,
    below
  }: {
    title: string;
    subtitle?: string;
    actions?: Snippet;
    below?: Snippet;
  } = $props();
</script>

<header class="page-header">
  <div class="page-header-row">
    <h1 class="page-header-title">{title}</h1>
    {#if actions}
      <div class="page-header-actions">
        {@render actions()}
      </div>
    {/if}
  </div>
  {#if subtitle}
    <p class="page-header-subtitle tnum">{subtitle}</p>
  {/if}
  {#if below}
    <div class="page-header-below">
      {@render below()}
    </div>
  {/if}
</header>

<style>
  .page-header {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 28px 16px 0;
  }
  .page-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 40px;
  }
  .page-header-title {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.5rem;
    line-height: 1;
    color: var(--color-fg);
    text-transform: uppercase;
    letter-spacing: 0.02em;
    min-width: 0;
  }
  .page-header-subtitle {
    /* Sits below the title row so a subtitle never shifts the title's
       baseline relative to other tabs. */
    margin-top: -10px;
    font-size: 0.75rem;
    color: var(--color-fg-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .page-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .page-header-below {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
</style>
