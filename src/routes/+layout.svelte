<script lang="ts">
  import '../app.css';
  import { onNavigate } from '$app/navigation';

  let { children } = $props();

  onNavigate((navigation) => {
    if (typeof document === 'undefined' || !document.startViewTransition) return;
    if (navigation.to?.url.pathname === navigation.from?.url.pathname) return;

    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });
</script>

{@render children()}

<style>
  :global(::view-transition-old(root)),
  :global(::view-transition-new(root)) {
    animation-duration: 180ms;
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }

  @media (prefers-reduced-motion: reduce) {
    :global(::view-transition-old(root)),
    :global(::view-transition-new(root)) {
      animation: none;
    }
  }
</style>
