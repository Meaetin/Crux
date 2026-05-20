<script lang="ts">
  import { page } from '$app/state';
  import Icon from './Icon.svelte';

  const tabs = [
    { href: '/', label: 'Home', icon: 'crux' as const },
    { href: '/workouts', label: 'Workouts', icon: 'dumbbell' as const },
    { href: '/exercises', label: 'Exercises', icon: 'list' as const },
    { href: '/metrics', label: 'Metrics', icon: 'chart' as const },
    { href: '/settings', label: 'Settings', icon: 'settings' as const }
  ];

  function isActive(href: string, pathname: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  const activeIndex = $derived(tabs.findIndex((t) => isActive(t.href, page.url.pathname)));
  const indicatorVisible = $derived(activeIndex >= 0);
</script>

<nav class="bottom-nav" aria-label="Primary">
  <span
    class="bottom-nav-indicator"
    class:bottom-nav-indicator-visible={indicatorVisible}
    aria-hidden="true"
    style="--active-index: {Math.max(activeIndex, 0)}; --tab-count: {tabs.length};"
  ></span>
  {#each tabs as tab (tab.href)}
    {@const active = isActive(tab.href, page.url.pathname)}
    <a
      href={tab.href}
      class="bottom-nav-tab"
      class:bottom-nav-tab-active={active}
      aria-current={active ? 'page' : undefined}
    >
      <span class="bottom-nav-tab-icon" class:bottom-nav-tab-icon-active={active}>
        <Icon name={tab.icon} size={22} strokeWidth={active ? 2.25 : 1.75} />
      </span>
      <span class="bottom-nav-tab-label">{tab.label}</span>
    </a>
  {/each}
</nav>

<style>
  .bottom-nav {
    position: fixed;
    inset: auto 0 0 0;
    display: flex;
    justify-content: space-around;
    align-items: stretch;
    background: color-mix(in srgb, var(--color-surface-2) 92%, transparent);
    backdrop-filter: blur(12px);
    border-top: 1px solid var(--color-line);
    padding-top: 6px;
    padding-bottom: max(6px, env(safe-area-inset-bottom));
    z-index: 30;
  }
  .bottom-nav-indicator {
    position: absolute;
    top: -1px;
    left: 0;
    width: calc(100% / var(--tab-count));
    height: 2.5px;
    pointer-events: none;
    display: flex;
    justify-content: center;
    opacity: 0;
    transform: translateX(calc(var(--active-index) * 100%));
    transition:
      transform 280ms cubic-bezier(0.4, 0, 0.2, 1),
      opacity 180ms ease-out;
  }
  .bottom-nav-indicator-visible {
    opacity: 1;
  }
  .bottom-nav-indicator::after {
    content: '';
    width: 28px;
    height: 100%;
    background: var(--color-brand);
    border-radius: 0 0 999px 999px;
    box-shadow: 0 0 8px color-mix(in srgb, var(--color-brand) 60%, transparent);
  }
  .bottom-nav-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 4px 0;
    color: var(--color-fg-muted);
    font-size: 0.6875rem;
    font-weight: 500;
    min-height: 48px;
    transition: color 200ms ease-out;
  }
  .bottom-nav-tab-active {
    color: var(--color-brand);
  }
  .bottom-nav-tab-icon {
    display: inline-flex;
    transition: transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .bottom-nav-tab-icon-active {
    transform: translateY(-1px) scale(1.08);
  }
  .bottom-nav-tab:active .bottom-nav-tab-icon {
    transform: scale(0.92);
    transition-duration: 80ms;
  }
  .bottom-nav-tab-label {
    letter-spacing: 0.02em;
  }

  @media (prefers-reduced-motion: reduce) {
    .bottom-nav-indicator,
    .bottom-nav-tab,
    .bottom-nav-tab-icon {
      transition: none;
    }
  }
</style>
