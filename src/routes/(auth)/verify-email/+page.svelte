<script lang="ts">
  import { page } from '$app/state';
  import { supabase } from '$lib/supabase/client';
  import PrimaryButton from '$lib/components/PrimaryButton.svelte';

  const email = $derived(page.url.searchParams.get('email') ?? '');

  let resending = $state(false);
  let resent = $state(false);
  let error = $state<string | null>(null);
  let cooldownUntil = $state(0);

  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(id);
  });
  const cooldownLeft = $derived(Math.max(0, Math.ceil((cooldownUntil - now) / 1000)));

  async function resend() {
    if (!email || resending || cooldownLeft > 0) return;
    resending = true;
    error = null;
    resent = false;

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/login`
      }
    });

    resending = false;

    if (resendError) {
      error = resendError.message;
      return;
    }

    resent = true;
    cooldownUntil = Date.now() + 60_000;
  }
</script>

<svelte:head>
  <title>Check your email · Crux</title>
</svelte:head>

<section class="auth-form">
  <div class="auth-form-heading">
    <span class="verify-icon" aria-hidden="true">✉</span>
    <h1 class="auth-form-title">Check your email</h1>
    <p class="auth-form-subtitle">
      We sent a confirmation link to
      {#if email}
        <strong class="verify-email-strong">{email}</strong>.
      {:else}
        your inbox.
      {/if}
      Open it on this phone — the link will sign you in.
    </p>
  </div>

  <ul class="verify-hints">
    <li class="verify-hint-item">Tap the link from your phone's email app.</li>
    <li class="verify-hint-item">Check your spam folder if it doesn't arrive.</li>
    <li class="verify-hint-item">The link expires after 24 hours.</li>
  </ul>

  {#if error}
    <p class="auth-error" role="alert">{error}</p>
  {/if}
  {#if resent}
    <p class="auth-info" role="status">A new confirmation email is on the way.</p>
  {/if}

  {#if email}
    <PrimaryButton
      onclick={resend}
      loading={resending}
      disabled={resending || cooldownLeft > 0}
    >
      {#if cooldownLeft > 0}
        Resend in {cooldownLeft}s
      {:else if resending}
        Sending…
      {:else}
        Resend email
      {/if}
    </PrimaryButton>
  {/if}

  <p class="auth-switch-row">
    <a class="auth-link auth-link-strong" href="/login">Back to sign in</a>
  </p>
</section>

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
    align-items: center;
    text-align: center;
    gap: 8px;
  }
  .verify-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 9999px;
    background: color-mix(in srgb, var(--color-brand) 12%, transparent);
    color: var(--color-brand);
    font-size: 1.75rem;
    margin-bottom: 4px;
  }
  .auth-form-title {
    font-family: var(--font-display);
    font-size: 1.375rem;
    font-weight: 700;
    color: var(--color-fg);
  }
  .auth-form-subtitle {
    font-size: 0.9375rem;
    color: var(--color-fg-muted);
    line-height: 1.5;
  }
  .verify-email-strong {
    color: var(--color-fg);
    font-weight: 600;
    word-break: break-all;
  }

  .verify-hints {
    list-style: none;
    padding: 12px 14px;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: var(--color-surface-2);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-md);
  }
  .verify-hint-item {
    font-size: 0.8125rem;
    color: var(--color-fg-muted);
    line-height: 1.4;
    position: relative;
    padding-left: 14px;
  }
  .verify-hint-item::before {
    content: '·';
    position: absolute;
    left: 4px;
    top: -2px;
    font-size: 1.25rem;
    color: var(--color-fg-faint);
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
    padding: 10px 12px;
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
