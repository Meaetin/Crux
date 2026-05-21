<script lang="ts">
  import { signOut, session } from '$lib/state/session.svelte';
  import { goto } from '$app/navigation';
  import { settingsLive, updateSettings, DEFAULT_REMINDER_TIME } from '$lib/db/settings';
  import {
    notificationPermission,
    requestNotificationPermission,
    supportsNotifications,
    supportsTriggers
  } from '$lib/notifications/capabilities';
  import {
    scheduleStreakReminder,
    cancelStreakReminder
  } from '$lib/notifications/streak-reminder';
  import { syncState } from '$lib/sync/engine.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';

  let signingOut = $state(false);
  let permissionState = $state(notificationPermission());
  let savingToggle = $state(false);

  const notificationsSupported = supportsNotifications();
  const triggersSupported = supportsTriggers();

  const enabled = $derived($settingsLive?.notify_streak_enabled ?? false);
  const reminderTime = $derived($settingsLive?.notify_streak_time ?? DEFAULT_REMINDER_TIME);

  async function handleSignOut() {
    signingOut = true;
    await signOut();
    signingOut = false;
    await goto('/login');
  }

  async function toggleStreakReminder() {
    if (savingToggle) return;
    savingToggle = true;
    try {
      if (!enabled) {
        const perm = await requestNotificationPermission();
        permissionState = perm;
        if (perm !== 'granted') {
          savingToggle = false;
          return;
        }
        await updateSettings({ notify_streak_enabled: true });
        await scheduleStreakReminder();
      } else {
        await updateSettings({ notify_streak_enabled: false });
        await cancelStreakReminder();
      }
    } finally {
      savingToggle = false;
    }
  }

  async function handleTimeChange(e: Event) {
    const value = (e.currentTarget as HTMLInputElement).value;
    if (!/^\d{2}:\d{2}$/.test(value)) return;
    await updateSettings({ notify_streak_time: value });
    if (enabled) await scheduleStreakReminder();
  }

  const supportHint = $derived.by(() => {
    if (!notificationsSupported) return 'Notifications are not supported on this device.';
    if (!triggersSupported)
      return 'Scheduled reminders need Chrome or Edge on Android. iOS Safari is not supported yet.';
    if (permissionState === 'denied')
      return 'Notifications were blocked. Enable them in your browser settings.';
    return null;
  });

  function formatRelative(ts: number | null): string {
    if (!ts) return 'never';
    const diff = Date.now() - ts;
    if (diff < 10_000) return 'just now';
    if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return new Date(ts).toLocaleDateString();
  }

  const syncLabel = $derived.by(() => {
    if (syncState.phase === 'pushing') return 'Uploading changes…';
    if (syncState.phase === 'pulling') return 'Pulling latest…';
    if (syncState.phase === 'error') return syncState.lastError ?? 'Sync error';
    if (syncState.pendingCount > 0) return `${syncState.pendingCount} change(s) pending`;
    return `Synced ${formatRelative(syncState.lastSyncedAt)}`;
  });
</script>

<section class="settings-shell">
  <PageHeader title="Settings" />

  <div class="settings-content">
  <div class="settings-section">
    <h2 class="settings-section-title">Streak reminders</h2>
    <div class="settings-card">
      <label class="settings-toggle-row">
        <span class="settings-toggle-label">
          <span class="settings-toggle-title">Daily reminder</span>
          <span class="settings-toggle-desc">
            Ping me if I haven't hit today's goal
          </span>
        </span>
        <input
          type="checkbox"
          class="settings-toggle-input"
          checked={enabled}
          disabled={!notificationsSupported || savingToggle}
          onchange={toggleStreakReminder}
        />
      </label>

      <label class="settings-time-row" class:settings-time-row-disabled={!enabled}>
        <span class="settings-time-label">Remind me at</span>
        <input
          type="time"
          class="settings-time-input tnum"
          value={reminderTime}
          disabled={!enabled}
          onchange={handleTimeChange}
        />
      </label>

      {#if supportHint}
        <p class="settings-support-hint">{supportHint}</p>
      {/if}
    </div>
  </div>

  <div class="settings-section">
    <h2 class="settings-section-title">Account</h2>
    <div class="settings-card">
      <p class="settings-account-email">{session.current?.user.email}</p>
    </div>
    <button
      class="settings-sign-out-button"
      onclick={handleSignOut}
      disabled={signingOut}
    >
      {signingOut ? 'Signing out…' : 'Sign out'}
    </button>
  </div>

  <div class="settings-section">
    <h2 class="settings-section-title">Sync</h2>
    <div
      class="settings-sync-row"
      class:settings-sync-row-error={syncState.phase === 'error'}
    >
      <span class="settings-sync-dot" data-phase={syncState.phase}></span>
      <span class="settings-sync-label">{syncLabel}</span>
    </div>
  </div>
  </div>
</section>

<style>
  .settings-shell {
    display: flex;
    flex-direction: column;
    gap: 22px;
  }
  .settings-content {
    padding: 0 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 22px;
  }

  .settings-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .settings-section-title {
    font-family: var(--font-display);
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-fg-muted);
  }

  .settings-card {
    display: flex;
    flex-direction: column;
    padding: 12px 14px;
    background: var(--color-surface-1);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-lg);
  }

  .settings-toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 0;
    min-height: 48px;
  }
  .settings-toggle-label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }
  .settings-toggle-title {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 0.9375rem;
    color: var(--color-fg);
  }
  .settings-toggle-desc {
    font-size: 0.75rem;
    color: var(--color-fg-muted);
  }
  .settings-toggle-input {
    appearance: none;
    width: 44px;
    height: 26px;
    background: var(--color-surface-3);
    border: 1px solid var(--color-line-strong);
    border-radius: 9999px;
    position: relative;
    cursor: pointer;
    transition: background-color 140ms ease-out, border-color 140ms ease-out;
    flex-shrink: 0;
  }
  .settings-toggle-input::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: var(--color-fg);
    border-radius: 9999px;
    transition: transform 140ms ease-out, background-color 140ms ease-out;
  }
  .settings-toggle-input:checked {
    background: var(--color-brand);
    border-color: var(--color-brand);
  }
  .settings-toggle-input:checked::before {
    transform: translateX(18px);
    background: var(--color-on-primary);
  }
  .settings-toggle-input:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .settings-time-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 0 4px;
    border-top: 1px solid var(--color-line);
    margin-top: 4px;
  }
  .settings-time-row-disabled {
    opacity: 0.5;
  }
  .settings-time-label {
    font-size: 0.875rem;
    color: var(--color-fg);
  }
  .settings-time-input {
    background: var(--color-surface-2);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-md);
    padding: 8px 10px;
    color: var(--color-fg);
    font-size: 0.9375rem;
    font-family: inherit;
    color-scheme: dark;
  }
  .settings-time-input:disabled {
    cursor: not-allowed;
  }

  .settings-support-hint {
    margin-top: 8px;
    font-size: 0.75rem;
    color: var(--color-fg-muted);
    line-height: 1.45;
  }

  .settings-account-email {
    font-size: 0.875rem;
    color: var(--color-fg);
  }

  .settings-sign-out-button {
    margin-top: 8px;
    background: color-mix(in srgb, var(--color-danger) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-danger) 40%, transparent);
    color: var(--color-danger);
    border-radius: var(--radius-md);
    padding: 12px;
    font-family: var(--font-display);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: 0.875rem;
    transition: transform 100ms ease-out;
  }
  .settings-sign-out-button:active {
    transform: scale(0.97);
  }
  .settings-sign-out-button:disabled {
    opacity: 0.5;
  }

  .settings-sync-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    background: var(--color-surface-1);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-lg);
    min-width: 0;
  }
  .settings-sync-row-error {
    border-color: color-mix(in srgb, var(--color-danger) 40%, transparent);
  }
  .settings-sync-dot {
    width: 8px;
    height: 8px;
    border-radius: 9999px;
    flex-shrink: 0;
    background: var(--color-fg-muted);
  }
  .settings-sync-dot[data-phase='pushing'],
  .settings-sync-dot[data-phase='pulling'] {
    background: var(--color-brand);
    animation: settings-sync-pulse 1.2s ease-in-out infinite;
  }
  .settings-sync-dot[data-phase='error'] {
    background: var(--color-danger);
  }
  .settings-sync-dot[data-phase='idle'] {
    background: color-mix(in srgb, var(--color-brand) 60%, transparent);
  }
  .settings-sync-label {
    font-size: 0.875rem;
    color: var(--color-fg);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  @keyframes settings-sync-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
</style>
