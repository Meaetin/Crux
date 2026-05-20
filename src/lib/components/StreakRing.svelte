<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    progress,
    bottomText,
    size = 240,
    stroke = 14,
    arcAngle = 240,
    ariaLabel,
    gradientId = 'streak-ring-gradient',
    children
  }: {
    progress: number;
    bottomText?: string;
    size?: number;
    stroke?: number;
    arcAngle?: number;
    ariaLabel?: string;
    gradientId?: string;
    children: Snippet;
  } = $props();

  const TEXT_GAP = 16;
  const TEXT_HEIGHT = 18;

  const clamped = $derived(Math.max(0, Math.min(1, progress)));
  const radius = $derived((size - stroke) / 2);
  const center = $derived(size / 2);

  const halfGapRad = $derived(((360 - arcAngle) / 2) * (Math.PI / 180));
  const endpointDx = $derived(radius * Math.sin(halfGapRad));
  const endpointDy = $derived(radius * Math.cos(halfGapRad));

  const leftX = $derived(center - endpointDx);
  const rightX = $derived(center + endpointDx);
  const endpointY = $derived(center + endpointDy);

  const arcLength = $derived((arcAngle / 360) * 2 * Math.PI * radius);
  const dashOffset = $derived(arcLength * (1 - clamped));

  const largeArcFlag = $derived(arcAngle > 180 ? 1 : 0);
  const arcPath = $derived(
    `M ${leftX} ${endpointY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${rightX} ${endpointY}`
  );

  const textY = $derived(endpointY + stroke / 2 + TEXT_GAP);
  const viewBoxHeight = $derived(textY + TEXT_HEIGHT + 2);
</script>

<div class="streak-ring" role="img" aria-label={ariaLabel ?? `Tier progress ${Math.round(clamped * 100)}%`}>
  <svg
    class="streak-ring-svg"
    viewBox="0 0 {size} {viewBoxHeight}"
    preserveAspectRatio="xMidYMid meet"
    aria-hidden="true"
    style="aspect-ratio: {size} / {viewBoxHeight};"
  >
    <defs>
      <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="var(--color-streak)" />
        <stop offset="100%" stop-color="var(--color-streak-hot)" />
      </linearGradient>
    </defs>

    <path
      class="streak-ring-track"
      d={arcPath}
      fill="none"
      stroke-width={stroke}
      stroke-linecap="round"
    />
    <path
      class="streak-ring-indicator"
      d={arcPath}
      fill="none"
      stroke="url(#{gradientId})"
      stroke-width={stroke}
      stroke-linecap="round"
      stroke-dasharray={arcLength}
      stroke-dashoffset={dashOffset}
    />

    {#if bottomText}
      <text
        class="streak-ring-bottom-text"
        x={center}
        y={textY}
        text-anchor="middle"
        dominant-baseline="hanging"
      >
        {bottomText}
      </text>
    {/if}
  </svg>

  <div class="streak-ring-center" style="top: {(center / viewBoxHeight) * 100}%;">
    {@render children()}
  </div>
</div>

<style>
  .streak-ring {
    position: relative;
    width: min(72vw, 240px);
    margin-inline: auto;
  }
  .streak-ring-svg {
    width: 100%;
    height: auto;
    display: block;
    overflow: visible;
  }
  .streak-ring-track {
    stroke: var(--color-surface-3);
    opacity: 0.65;
  }
  .streak-ring-indicator {
    transition: stroke-dashoffset 500ms cubic-bezier(0.22, 1, 0.36, 1);
    filter: drop-shadow(0 0 6px color-mix(in srgb, var(--color-streak) 40%, transparent));
  }
  .streak-ring-bottom-text {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.8125rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    fill: var(--color-fg-muted);
  }
  .streak-ring-center {
    position: absolute;
    left: 0;
    right: 0;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    pointer-events: none;
    text-align: center;
  }
  @media (prefers-reduced-motion: reduce) {
    .streak-ring-indicator {
      transition: none;
    }
  }
</style>
