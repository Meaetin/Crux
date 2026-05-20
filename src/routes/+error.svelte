<script lang="ts">
  import { page } from '$app/state';
  import { goto, invalidateAll } from '$app/navigation';

  const status = $derived(page.status);
  const message = $derived(page.error?.message ?? 'Something went wrong.');

  const heading = $derived(
    status === 404 ? 'Not found' : status >= 500 ? 'Server error' : 'Error'
  );

  async function retry() {
    await invalidateAll();
  }

  function home() {
    void goto('/');
  }
</script>

<svelte:head>
  <title>{status} — Crux</title>
</svelte:head>

<main class="error-shell">
  <div class="error-card">
    <p class="error-status tnum" aria-hidden="true">{status}</p>
    <h1 class="error-heading">{heading}</h1>
    <p class="error-message">{message}</p>

    <div class="error-actions">
      <button class="error-action-primary press-feedback" type="button" onclick={home}>
        Go home
      </button>
      <button class="error-action-secondary press-feedback" type="button" onclick={retry}>
        Try again
      </button>
    </div>
  </div>
</main>

<style>
  .error-shell {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100dvh;
    padding: 24px 20px calc(24px + env(safe-area-inset-bottom, 0px));
    background: var(--color-bg);
  }

  .error-card {
    width: 100%;
    max-width: 380px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8px;
    padding: 32px 24px;
    background: var(--color-surface-1);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-xl);
  }

  .error-status {
    font-size: 2.75rem;
    font-weight: 700;
    line-height: 1;
    color: var(--color-brand);
    letter-spacing: -0.02em;
  }

  .error-heading {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-fg);
    margin-top: 8px;
  }

  .error-message {
    font-size: 0.9375rem;
    color: var(--color-fg-muted);
    line-height: 1.4;
    word-break: break-word;
  }

  .error-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    margin-top: 20px;
  }

  .error-action-primary,
  .error-action-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
    padding: 0 18px;
    border-radius: var(--radius-md);
    font-size: 1rem;
    font-weight: 600;
    font-family: inherit;
  }

  .error-action-primary {
    background: var(--color-brand);
    color: var(--color-on-primary);
  }

  .error-action-secondary {
    background: transparent;
    color: var(--color-fg);
    border: 1px solid var(--color-line-strong);
  }
</style>
