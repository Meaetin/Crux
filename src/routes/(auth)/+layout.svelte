<script lang="ts">
  let { children } = $props();
</script>

<main class="auth-shell">
  <div class="auth-card-container">
    <header class="auth-brand-header">
      <span class="auth-brand-mark">Crux</span>
    </header>
    {@render children()}
  </div>
</main>

<style>
  .auth-shell {
    min-height: 100dvh;
    padding: 32px 20px calc(32px + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: var(--color-bg);
  }
  .auth-card-container {
    width: 100%;
    max-width: 24rem;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .auth-brand-header {
    display: flex;
    justify-content: center;
    padding-bottom: 4px;
  }
  .auth-brand-mark {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-brand);
  }
</style>
