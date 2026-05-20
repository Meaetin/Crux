<script lang="ts">
  import { onMount } from 'svelte';

  let { onDone }: { onDone: () => void } = $props();

  let visible = $state(false);
  let stroke1Drawn = $state(false);
  let stroke2Drawn = $state(false);
  let fadingOut = $state(false);

  const TIMINGS = {
    backdropIn: 80,
    stroke1: 180,
    stroke2Start: 80 + 180 - 60,
    stroke2: 180,
    hold: 100,
    fadeOut: 140
  };

  onMount(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      visible = true;
      stroke1Drawn = true;
      stroke2Drawn = true;
      const t = setTimeout(onDone, 280);
      return () => clearTimeout(t);
    }

    const stroke2DoneAt = TIMINGS.stroke2Start + TIMINGS.stroke2;
    const fadeStartAt = stroke2DoneAt + TIMINGS.hold;
    const doneAt = fadeStartAt + TIMINGS.fadeOut;

    const ts: ReturnType<typeof setTimeout>[] = [
      setTimeout(() => (visible = true), 0),
      setTimeout(() => (stroke1Drawn = true), TIMINGS.backdropIn),
      setTimeout(() => (stroke2Drawn = true), TIMINGS.backdropIn + TIMINGS.stroke2Start),
      setTimeout(() => (fadingOut = true), TIMINGS.backdropIn + fadeStartAt),
      setTimeout(onDone, TIMINGS.backdropIn + doneAt)
    ];
    return () => ts.forEach(clearTimeout);
  });
</script>

<div
  class="send-animation"
  class:send-animation-visible={visible}
  class:send-animation-fade={fadingOut}
  role="status"
  aria-live="polite"
>
  <span class="send-animation-sr">Sent</span>
  <svg
    class="send-animation-mark"
    viewBox="0 0 200 200"
    aria-hidden="true"
  >
    <line
      x1="40" y1="40" x2="160" y2="160"
      pathLength="100"
      stroke-width="22"
      stroke="var(--color-brand)"
      stroke-linecap="square"
      class="send-animation-stroke"
      class:send-animation-stroke-drawn={stroke1Drawn}
    />
    <line
      x1="160" y1="40" x2="40" y2="160"
      pathLength="100"
      stroke-width="18"
      stroke="var(--color-brand)"
      stroke-linecap="square"
      class="send-animation-stroke send-animation-stroke-second"
      class:send-animation-stroke-drawn={stroke2Drawn}
    />
  </svg>
</div>

<style>
  .send-animation {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    background: color-mix(in srgb, var(--color-bg) 78%, transparent);
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
    opacity: 0;
    z-index: 100;
    transition:
      opacity 80ms ease-out,
      backdrop-filter 80ms ease-out;
  }
  .send-animation-visible {
    opacity: 1;
  }
  .send-animation-fade {
    opacity: 0;
    transition-duration: 140ms;
  }

  .send-animation-mark {
    width: min(42vw, 220px);
    aspect-ratio: 1;
    filter: drop-shadow(0 0 28px color-mix(in srgb, var(--color-brand) 55%, transparent));
  }
  .send-animation-stroke {
    fill: none;
    stroke-dasharray: 100;
    stroke-dashoffset: 100;
    transition: stroke-dashoffset 180ms cubic-bezier(0.65, 0, 0.35, 1);
  }
  .send-animation-stroke-drawn {
    stroke-dashoffset: 0;
  }

  .send-animation-sr {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .send-animation,
    .send-animation-stroke {
      transition: none;
    }
  }
</style>
