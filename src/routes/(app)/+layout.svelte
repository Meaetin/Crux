<script lang="ts">
  import BottomNav from '$lib/components/BottomNav.svelte';
  import { page } from '$app/state';
  import { initStreakSubscription, stopStreakSubscription } from '$lib/state/streak.svelte';
  import { onMount } from 'svelte';

  let { children } = $props();

  const FOCUS_ROUTES = ['/workouts/new'];
  const showNav = $derived(!FOCUS_ROUTES.some((r) => page.url.pathname.startsWith(r)));

  onMount(() => {
    initStreakSubscription();
    return () => stopStreakSubscription();
  });
</script>

<div class="app-shell flex flex-col min-h-dvh">
  <main class="app-shell-content flex-1" class:app-shell-content-with-nav={showNav}>
    {@render children()}
  </main>
  {#if showNav}
    <BottomNav />
  {/if}
</div>

<style>
  .app-shell-content-with-nav {
    padding-bottom: calc(56px + env(safe-area-inset-bottom, 8px));
  }
</style>
