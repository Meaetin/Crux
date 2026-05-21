<script lang="ts">
  import type { StreakStatus } from "$lib/db/streaks";
  import { DAILY_GOAL } from "$lib/db/streaks";
  import { TIERS } from "$lib/utils/tiers";
  import TierBadge from "./TierBadge.svelte";
  import StreakRing from "./StreakRing.svelte";
  import PrimaryButton from "./PrimaryButton.svelte";
  import Icon from "./Icon.svelte";

  let {
    streak,
    onUseFreeze,
  }: { streak: StreakStatus; onUseFreeze?: () => void } = $props();

  const isEmpty = $derived(
    streak.currentStreak === 0 && streak.todayProgress === 0,
  );
  const nextTier = $derived(TIERS[streak.tier.tier.index + 1] ?? null);
  const percent = $derived(Math.round(streak.tier.progressFraction * 100));

  const goalDots = $derived(
    Array.from({ length: DAILY_GOAL }, (_, i) => i < streak.todayProgress),
  );

  const headline = $derived.by(() => {
    if (streak.goalRemaining === DAILY_GOAL)
      return "Log 3 workouts to count today";
    return `${streak.goalRemaining} more to go`;
  });

  const ctaLabel = $derived(isEmpty ? "First send" : "Send");

  const ringAriaLabel = $derived(
    nextTier
      ? `${streak.tier.tier.name} progress ${percent}% to ${nextTier.name}`
      : `${streak.tier.tier.name} top tier reached`,
  );

  const subline = $derived.by(() => {
    if (isEmpty) return "Log 3 workouts to begin";
    if (!nextTier) return "Top tier reached";
    const days = streak.tier.daysToNext ?? 0;
    return `${days} day${days === 1 ? "" : "s"} to ${nextTier.name}`;
  });

  const canUseFreeze = $derived(
    streak.freezesAvailable > 0 &&
      !streak.freezeAppliedToday &&
      !streak.goalMet &&
      streak.currentStreak > 0,
  );
</script>

<section class="streak-hero" aria-label="Daily streak">
  <div class="streak-hero-badge-row">
    <TierBadge tier={streak.tier.tier} size="md" />
  </div>

  <StreakRing
    progress={streak.tier.progressFraction}
    ariaLabel={ringAriaLabel}
    bottomText={subline}
  >
    <span class="streak-hero-number tnum">{streak.currentStreak}</span>
    <span class="streak-hero-label"
      >{isEmpty ? "Start" : streak.currentStreak === 1 ? "Day" : "Days"}</span
    >
  </StreakRing>

  {#if !streak.goalMet}
    <div class="streak-hero-today">
      <span
        class="streak-hero-today-dots"
        aria-label="Today {streak.todayProgress} of {DAILY_GOAL}"
      >
        {#each goalDots as filled, i (i)}
          <span
            class="streak-hero-today-dot"
            class:streak-hero-today-dot-filled={filled}
          ></span>
        {/each}
      </span>
      <span class="streak-hero-today-headline">{headline}</span>
    </div>
  {:else}
    <div class="streak-hero-goal-pill">
      <span class="streak-hero-goal-check" aria-hidden="true">✓</span>
      Goal hit today
    </div>
  {/if}

  <div class="streak-hero-status tnum">
    {#if !streak.goalMet}
      <span class="streak-hero-time-left">
        {streak.hoursLeftToday}h {streak.minutesLeftToday}m left
      </span>
      <span class="streak-hero-divider-dot" aria-hidden="true">·</span>
    {/if}
    <span
      class="streak-hero-freeze"
      class:streak-hero-freeze-active={streak.freezesAvailable > 0 &&
        !streak.freezeAppliedToday}
    >
      <Icon
        name="shield"
        size={12}
        strokeWidth={2}
        class="streak-hero-freeze-icon"
      />
      {#if streak.freezeAppliedToday}
        Freeze used today
      {:else}
        {streak.freezesAvailable} freeze{streak.freezesAvailable === 1
          ? ""
          : "s"}
      {/if}
    </span>
    {#if streak.longestStreak > streak.currentStreak}
      <span class="streak-hero-divider-dot" aria-hidden="true">·</span>
      <span class="streak-hero-best">Best {streak.longestStreak}</span>
    {/if}
  </div>

  {#if !streak.goalMet}
    <a href="/workouts/new" class="streak-hero-cta-link" aria-label={ctaLabel}>
      <PrimaryButton type="button">{ctaLabel}</PrimaryButton>
    </a>
  {/if}

  {#if canUseFreeze}
    <button
      type="button"
      class="streak-hero-freeze-button press-feedback"
      onclick={() => onUseFreeze?.()}
    >
      <Icon
        name="shield"
        size={16}
        strokeWidth={2}
        class="streak-hero-freeze-button-icon"
      />
      <span class="streak-hero-freeze-button-label"
        >Use freeze to save today</span
      >
    </button>
  {/if}
</section>

<style>
  .streak-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    gap: 12px;
    padding: 8px 0 0;
  }

  .streak-hero-badge-row {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
  }

  .streak-hero-number {
    font-family: var(--font-display);
    font-size: 4rem;
    font-weight: 700;
    line-height: 1;
    color: var(--color-streak);
    letter-spacing: -0.02em;
    text-shadow: 0 0 24px
      color-mix(in srgb, var(--color-streak) 35%, transparent);
  }
  .streak-hero-label {
    margin-top: 4px;
    font-family: var(--font-display);
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--color-fg-muted);
  }

  .streak-hero-today {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 20px;
  }
  .streak-hero-today-dots {
    display: inline-flex;
    gap: 8px;
  }
  .streak-hero-today-dot {
    width: 14px;
    height: 14px;
    border-radius: 9999px;
    background: var(--color-surface-3);
    border: 1px solid var(--color-line-strong);
    transition:
      background-color 140ms ease-out,
      border-color 140ms ease-out,
      box-shadow 140ms ease-out;
  }
  .streak-hero-today-dot-filled {
    background: var(--color-brand);
    border-color: var(--color-brand);
    box-shadow: 0 0 8px color-mix(in srgb, var(--color-brand) 55%, transparent);
  }
  .streak-hero-today-headline {
    font-family: var(--font-display);
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-fg);
  }

  .streak-hero-goal-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    background: color-mix(in srgb, var(--color-brand) 16%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-brand) 40%, transparent);
    color: var(--color-brand);
    border-radius: 9999px;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.8125rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .streak-hero-goal-check {
    font-size: 0.875rem;
    font-weight: 700;
  }

  .streak-hero-status {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    color: var(--color-fg-muted);
    text-align: center;
  }
  .streak-hero-time-left {
    color: var(--color-fg);
    font-weight: 500;
  }
  .streak-hero-divider-dot {
    color: var(--color-fg-faint);
  }
  .streak-hero-freeze {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .streak-hero-freeze :global(.streak-hero-freeze-icon) {
    opacity: 0.8;
  }
  .streak-hero-freeze-active {
    color: var(--color-frozen);
  }
  .streak-hero-best {
    color: var(--color-fg-muted);
  }

  .streak-hero-cta-link {
    width: 100%;
    margin-top: auto;
    padding-top: 8px;
    display: block;
    text-decoration: none;
  }

  .streak-hero-freeze-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    min-height: 40px;
    padding: 0 14px;
    background: transparent;
    border: 1px solid
      color-mix(in srgb, var(--color-frozen) 35%, var(--color-line));
    color: var(--color-frozen);
    border-radius: var(--radius-md);
    font-family: inherit;
    font-size: 0.875rem;
    font-weight: 600;
  }
  .streak-hero-freeze-button:hover {
    background: color-mix(in srgb, var(--color-frozen) 8%, transparent);
  }
  .streak-hero-freeze-button-label {
    letter-spacing: 0.01em;
  }
</style>
