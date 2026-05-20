<script lang="ts">
  import { supabase, setRememberMe, getRememberMe } from '$lib/supabase/client';
  import { goto } from '$app/navigation';
  import PrimaryButton from '$lib/components/PrimaryButton.svelte';

  let email = $state('');
  let password = $state('');
  let remember = $state(getRememberMe());
  let showPassword = $state(false);
  let submitting = $state(false);
  let error = $state<string | null>(null);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (submitting) return;
    submitting = true;
    error = null;

    setRememberMe(remember);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    submitting = false;

    if (authError) {
      error = authError.message;
      return;
    }

    await goto('/');
  }
</script>

<svelte:head>
  <title>Sign in · Crux</title>
</svelte:head>

<form class="auth-form" onsubmit={submit} novalidate>
  <div class="auth-form-heading">
    <h1 class="auth-form-title">Welcome back</h1>
    <p class="auth-form-subtitle">Sign in to keep your streak going.</p>
  </div>

  <label class="auth-field">
    <span class="auth-field-label">Email</span>
    <input
      class="auth-field-input"
      type="email"
      inputmode="email"
      autocapitalize="off"
      autocorrect="off"
      autocomplete="email"
      required
      bind:value={email}
    />
  </label>

  <label class="auth-field">
    <span class="auth-field-label">Password</span>
    <div class="auth-password-wrap">
      <input
        class="auth-field-input auth-password-input"
        type={showPassword ? 'text' : 'password'}
        autocomplete="current-password"
        minlength={6}
        required
        bind:value={password}
      />
      <button
        type="button"
        class="auth-password-toggle"
        onclick={() => (showPassword = !showPassword)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? 'Hide' : 'Show'}
      </button>
    </div>
  </label>

  <div class="auth-options-row">
    <label class="auth-remember-row">
      <input
        type="checkbox"
        class="auth-remember-checkbox"
        bind:checked={remember}
      />
      <span class="auth-remember-label">Remember me</span>
    </label>
    <a class="auth-link" href="/forgot-password">Forgot password?</a>
  </div>

  {#if error}
    <p class="auth-error" role="alert">{error}</p>
  {/if}

  <PrimaryButton type="submit" loading={submitting} disabled={submitting}>
    {submitting ? 'Signing in…' : 'Sign in'}
  </PrimaryButton>

  <p class="auth-switch-row">
    Don't have an account?
    <a class="auth-link auth-link-strong" href="/register">Create one</a>
  </p>
</form>

<style>
  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 18px;
    background: var(--color-surface-1);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-lg);
    padding: 24px 20px;
  }
  .auth-form-heading {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 4px;
  }
  .auth-form-title {
    font-family: var(--font-display);
    font-size: 1.375rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    color: var(--color-fg);
  }
  .auth-form-subtitle {
    font-size: 0.875rem;
    color: var(--color-fg-muted);
  }

  .auth-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .auth-field-label {
    font-family: var(--font-display);
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-fg-muted);
  }
  .auth-field-input {
    width: 100%;
    background: var(--color-surface-2);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-md);
    padding: 12px 14px;
    font-size: 1rem;
    font-family: inherit;
    color: var(--color-fg);
    min-height: 48px;
  }
  .auth-field-input::placeholder {
    color: var(--color-fg-faint);
  }
  .auth-field-input:focus {
    border-color: var(--color-brand);
  }

  .auth-password-wrap {
    position: relative;
  }
  .auth-password-input {
    padding-right: 64px;
  }
  .auth-password-toggle {
    position: absolute;
    top: 50%;
    right: 8px;
    transform: translateY(-50%);
    background: transparent;
    border: 0;
    color: var(--color-fg-muted);
    font-size: 0.8125rem;
    font-weight: 600;
    padding: 8px 10px;
    border-radius: var(--radius-md);
    min-height: 36px;
  }
  .auth-password-toggle:active {
    color: var(--color-fg);
  }

  .auth-options-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .auth-remember-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 32px;
  }
  .auth-remember-checkbox {
    appearance: none;
    width: 18px;
    height: 18px;
    border: 1px solid var(--color-line-strong);
    border-radius: 4px;
    background: var(--color-surface-2);
    cursor: pointer;
    position: relative;
    flex-shrink: 0;
  }
  .auth-remember-checkbox:checked {
    background: var(--color-brand);
    border-color: var(--color-brand);
  }
  .auth-remember-checkbox:checked::after {
    content: '';
    position: absolute;
    top: 1px;
    left: 5px;
    width: 5px;
    height: 10px;
    border-right: 2px solid var(--color-on-primary);
    border-bottom: 2px solid var(--color-on-primary);
    transform: rotate(45deg);
  }
  .auth-remember-label {
    font-size: 0.875rem;
    color: var(--color-fg);
  }

  .auth-link {
    font-size: 0.875rem;
    color: var(--color-fg-muted);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .auth-link-strong {
    color: var(--color-brand);
    font-weight: 600;
  }

  .auth-error {
    background: color-mix(in srgb, var(--color-danger) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-danger) 40%, transparent);
    color: var(--color-danger);
    padding: 10px 12px;
    border-radius: var(--radius-md);
    font-size: 0.875rem;
  }

  .auth-switch-row {
    text-align: center;
    font-size: 0.875rem;
    color: var(--color-fg-muted);
    margin-top: 4px;
  }
</style>
