<script lang="ts">
  import { supabase } from '$lib/supabase/client';
  import PrimaryButton from '$lib/components/PrimaryButton.svelte';

  let email = $state('');
  let submitting = $state(false);
  let error = $state<string | null>(null);
  let sent = $state(false);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (submitting) return;

    submitting = true;
    error = null;

    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/reset-password` }
    );

    submitting = false;

    if (authError) {
      error = authError.message;
      return;
    }

    sent = true;
  }
</script>

<svelte:head>
  <title>Forgot password · Crux</title>
</svelte:head>

<form class="auth-form" onsubmit={submit} novalidate>
  <div class="auth-form-heading">
    <h1 class="auth-form-title">Forgot password?</h1>
    <p class="auth-form-subtitle">
      Enter your email and we'll send you a link to reset it.
    </p>
  </div>

  {#if sent}
    <div class="auth-info" role="status">
      If an account exists for <strong>{email}</strong>, a reset link is on its
      way. Check your inbox and spam folder.
    </div>
  {:else}
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

    {#if error}
      <p class="auth-error" role="alert">{error}</p>
    {/if}

    <PrimaryButton
      type="submit"
      loading={submitting}
      disabled={submitting || email.trim().length === 0}
    >
      {submitting ? 'Sending…' : 'Send reset link'}
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
    line-height: 1.5;
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
