<script lang="ts">
  import Icon from './Icon.svelte';
  import type { Snippet } from 'svelte';

  let {
    open = $bindable(false),
    title,
    onClose,
    children,
    footer
  }: {
    open?: boolean;
    title: string;
    onClose?: () => void;
    children: Snippet;
    footer?: Snippet;
  } = $props();

  let dialog: HTMLDialogElement | undefined = $state();

  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  });

  function handleClose() {
    open = false;
    onClose?.();
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === dialog) handleClose();
  }
</script>

<dialog
  bind:this={dialog}
  class="sheet"
  onclose={handleClose}
  onclick={handleBackdropClick}
  aria-label={title}
>
  <div class="sheet-panel" role="document">
    <div class="sheet-handle" aria-hidden="true"></div>

    <header class="sheet-header">
      <h2 class="sheet-title">{title}</h2>
      <button
        type="button"
        class="sheet-close-button press-feedback"
        onclick={handleClose}
        aria-label="Close"
      >
        <Icon name="close" size={20} />
      </button>
    </header>

    <div class="sheet-content">
      {@render children()}
    </div>

    {#if footer}
      <div class="sheet-footer">
        {@render footer()}
      </div>
    {/if}
  </div>
</dialog>

<style>
  .sheet {
    background: transparent;
    border: none;
    padding: 0;
    margin: 0;
    width: 100%;
    max-width: 100%;
    max-height: 100dvh;
    height: 100dvh;
    color: var(--color-fg);
  }
  .sheet::backdrop {
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
  }

  .sheet-panel {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--color-surface-2);
    border-top-left-radius: var(--radius-xl);
    border-top-right-radius: var(--radius-xl);
    max-height: 92dvh;
    display: flex;
    flex-direction: column;
    animation: sheet-rise 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .sheet-handle {
    width: 36px;
    height: 4px;
    background: var(--color-line-strong);
    border-radius: 999px;
    margin: 10px auto 4px;
  }

  .sheet-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px 12px;
  }

  .sheet-title {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 1.25rem;
    letter-spacing: 0.01em;
  }

  .sheet-close-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    background: var(--color-surface-3);
    color: var(--color-fg-muted);
  }

  .sheet-content {
    overflow-y: auto;
    padding: 4px 16px 16px;
    flex: 1;
  }

  .sheet-footer {
    padding: 12px 16px;
    padding-bottom: max(12px, env(safe-area-inset-bottom));
    background: var(--color-surface-2);
    border-top: 1px solid var(--color-line);
  }

  @keyframes sheet-rise {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .sheet-panel {
      animation: none;
    }
  }
</style>
