<script lang="ts">
  let {
    open = $bindable(false),
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    danger = false,
    onConfirm
  }: {
    open?: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    onConfirm: () => void;
  } = $props();

  let dialog: HTMLDialogElement | undefined = $state();

  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  });

  function close() {
    open = false;
  }
  function handleConfirm() {
    onConfirm();
    open = false;
  }
  function handleBackdropClick(e: MouseEvent) {
    if (e.target === dialog) close();
  }
</script>

<dialog
  bind:this={dialog}
  class="confirm-modal"
  onclose={close}
  onclick={handleBackdropClick}
  aria-labelledby="confirm-modal-title"
>
  <div class="confirm-modal-panel" role="document">
    <h2 id="confirm-modal-title" class="confirm-modal-title">{title}</h2>
    <p class="confirm-modal-message">{message}</p>
    <div class="confirm-modal-actions">
      <button
        type="button"
        class="confirm-modal-cancel-button press-feedback"
        onclick={close}
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        class="confirm-modal-action-button press-feedback"
        class:confirm-modal-action-button-danger={danger}
        onclick={handleConfirm}
      >
        {confirmLabel}
      </button>
    </div>
  </div>
</dialog>

<style>
  .confirm-modal {
    background: transparent;
    border: none;
    padding: 0;
    margin: 0;
    inset: 0;
    width: 100vw;
    height: 100dvh;
    max-width: none;
    max-height: none;
    color: var(--color-fg);
  }
  .confirm-modal::backdrop {
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
  }

  .confirm-modal-panel {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: calc(100% - 32px);
    max-width: 360px;
    background: var(--color-surface-2);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-lg);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    animation: confirm-modal-rise 200ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  @keyframes confirm-modal-rise {
    from {
      transform: translate(-50%, -44%);
      opacity: 0;
    }
    to {
      transform: translate(-50%, -50%);
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .confirm-modal-panel {
      animation: none;
    }
  }

  .confirm-modal-title {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.25rem;
    color: var(--color-fg);
  }
  .confirm-modal-message {
    font-size: 0.9375rem;
    color: var(--color-fg-muted);
    line-height: 1.45;
  }

  .confirm-modal-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
  .confirm-modal-cancel-button,
  .confirm-modal-action-button {
    flex: 1;
    min-height: 44px;
    padding: 0 14px;
    border-radius: var(--radius-md);
    font-family: inherit;
    font-weight: 600;
    font-size: 0.9375rem;
  }
  .confirm-modal-cancel-button {
    background: var(--color-surface-3);
    color: var(--color-fg);
  }
  .confirm-modal-action-button {
    background: var(--color-brand);
    color: var(--color-on-primary);
  }
  .confirm-modal-action-button-danger {
    background: color-mix(in srgb, var(--color-danger) 16%, transparent);
    color: var(--color-danger);
    border: 1px solid color-mix(in srgb, var(--color-danger) 40%, transparent);
  }
</style>
