<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase/client';
  import PrimaryButton from '$lib/components/PrimaryButton.svelte';
  import { checkPassword, passwordIsStrong } from '$lib/auth/password';

  let password = $state('');
  let confirmPassword = $state('');
  let showPassword = $state(false);
  let submitting = $state(false);
  let recoveryReady = $state(false);
  let error = $state<string | null>(null);
  let success = $state(false);

  const checks = $derived(checkPassword(password));
  const passwordsMatch = $derived(
    confirmPassword.length > 0 && password === confirmPassword
  );
  const confirmMismatch = $derived(
    confirmPassword.length > 0 && password !== confirmPassword
  );
  const canSubmit = $derived(
    recoveryReady &&
      passwordIsStrong(password) &&
      passwordsMatch &&
      !submitting
  );

  onMount(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        recoveryReady = true;
        error = null;
      }
    });

    // If the user opened this page from an active recovery session (already
    // processed earlier in the load lifecycle), allow them to proceed too.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) recoveryReady = true;
    });

    return () => sub.subscription.unsubscribe();
  });

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    submitting = true;
    error = null;

    const { error: updateError } = await supabase.auth.updateUser({ password });

    submitting = false;

    if (updateError) {
      error = updateError.message;
      return;
    }

    success = true;
    await supabase.auth.signOut();
    setTimeout(() => goto('/login'), 1200);
  }
</script>

<svelte:head>
  <title>Reset password · Crux</title>
</svelte:head>

<form class="auth-form" onsubmit={submit} novalidate>
  <div class="auth-form-heading">
    <h1 class="auth-form-title">Set a new password</h1>
    <p class="auth-form-subtitle">
      Choose a password you haven't used before.
    </p>
  </div>

  {#if success}
    <div class="auth-info" role="status">
      Password updated. Redirecting you to sign in…
    </div>
  {:else}
    {#if !recoveryReady}
      <p class="auth-form-subtitle">
        Verifying your reset link…
      </p>
    {/if}

    <label class="auth-field">
      <span class="auth-field-label">New password</span>
      <div class="auth-password-wrap">
        <input
          class="auth-field-input auth-password-input"
          type={showPassword ? 'text' : 'password'}
          autocomplete="new-password"
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

    <ul class="auth-password-checklist" aria-label="Password requirements">
      {#each checks as check (check.id)}
        <li
          class="auth-password-check-item"
          class:auth-password-check-item-passed={check.passed}
        >
          <span class="auth-password-check-mark" aria-hidden="true">
            {check.passed ? '✓' : '○'}
          </span>
          <span class="auth-password-check-label">{check.label}</span>
        </li>
      {/each}
    </ul>

    <label class="auth-field">
      <span class="auth-field-label">Confirm new password</span>
      <input
        class="auth-field-input"
        class:auth-field-input-error={confirmMismatch}
        type={showPassword ? 'text' : 'password'}
        autocomplete="new-password"
        required
        bind:value={confirmPassword}
      />
      {#if confirmMismatch}
        <span class="auth-field-help auth-field-help-error">
          Passwords don't match.
        </span>
      {:else if passwordsMatch}
        <span class="auth-field-help auth-field-help-success">
          Passwords match.
        </span>
      {/if}
    </label>

    {#if error}
      <p class="auth-error" role="alert">{error}</p>
    {/if}

    <PrimaryButton type="submit" loading={submitting} disabled={!canSubmit}>
      {submitting ? 'Updating…' : 'Update password'}
    </PrimaryButton>
  {/if}

  <p class="auth-switch-row">
    <a class="auth-link auth-link-strong" href="/login">Back to sign in</a>
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
  }
  .auth-form-title {
    font-family: var(--font-display);
    font-size: 1.375rem;
    font-weight: 700;
    color: var(--color-fg);
  }
  .auth-form-subtitle {
    font-size: 0.875rem;
    color: var(--color-fg-muted);
    line-height: 1.45;
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
  .auth-field-input:focus {
    border-color: var(--color-brand);
  }
  .auth-field-input-error {
    border-color: color-mix(in srgb, var(--color-danger) 60%, var(--color-line));
  }
  .auth-field-help {
    font-size: 0.75rem;
    color: var(--color-fg-muted);
  }
  .auth-field-help-error {
    color: var(--color-danger);
  }
  .auth-field-help-success {
    color: var(--color-success);
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

  .auth-password-checklist {
    list-style: none;
    padding: 8px 12px;
    margin: -4px 0 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: var(--color-surface-2);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-md);
  }
  .auth-password-check-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8125rem;
    color: var(--color-fg-muted);
  }
  .auth-password-check-item-passed {
    color: var(--color-success);
  }
  .auth-password-check-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    font-size: 0.875rem;
    font-weight: 700;
    line-height: 1;
  }

  .auth-error {
    background: color-mix(in srgb, var(--color-danger) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-danger) 40%, transparent);
    color: var(--color-danger);
    padding: 10px 12px;
    border-radius: var(--radius-md);
    font-size: 0.875rem;
  }
  .auth-info {
    background: color-mix(in srgb, var(--color-success) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-success) 40%, transparent);
    color: var(--color-success);
    padding: 12px 14px;
    border-radius: var(--radius-md);
    font-size: 0.875rem;
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
  .auth-switch-row {
    text-align: center;
    margin-top: 4px;
  }
</style>
