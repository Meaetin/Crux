# Fitness Tracker — Design System (MASTER)

Single source of truth for the gamified dark mobile-first PWA. Page-specific overrides live in `design-system/pages/*.md`.

## Vibe

Strava + Apple Fitness, with a quiet Duolingo undertone. Confident athletic typography, deep neutral surfaces, color reserved for meaning (streak, XP, success, danger). Motion is purposeful — it confirms progress, never decorates.

**Avoid:** loot-box RNG, anxiety patterns (broken-streak shame), neon glow, skeuomorphic medals, emoji as structural icons.

## Tokens

All tokens live in `src/app.css` as `@theme` CSS variables. Tailwind v4 maps them to utilities automatically: `--color-streak` → `bg-streak text-streak border-streak`.

### Surfaces (dark only — no light mode)

| Token | Hex | Use |
|---|---|---|
| `--color-bg` | `#0a0a0a` | App background |
| `--color-surface-1` | `#131313` | Cards, list rows |
| `--color-surface-2` | `#1c1c1c` | Raised cards, sheets, modals |
| `--color-surface-3` | `#262626` | Hover/active raised states |
| `--color-line` | `#2a2a2a` | Default border |
| `--color-line-strong` | `#404040` | Emphasized border |

### Foreground

| Token | Hex | Contrast on bg | Use |
|---|---|---|---|
| `--color-fg` | `#f5f5f5` | 17.4:1 | Primary text |
| `--color-fg-muted` | `#a3a3a3` | 7.6:1 | Secondary text |
| `--color-fg-faint` | `#525252` | 2.7:1 | Tertiary (large text only) |

### Brand & semantic

| Token | Hex | Use |
|---|---|---|
| `--color-brand` | `#10b981` | Primary CTA, completion |
| `--color-brand-strong` | `#059669` | Pressed primary |
| `--color-xp` | `#6366f1` | XP bars, level progress |
| `--color-streak` | `#f59e0b` | Streak flame, daily badge |
| `--color-streak-hot` | `#f97316` | Streak ≥30 days |
| `--color-success` | `#22c55e` | Toasts, PR celebration |
| `--color-danger` | `#ef4444` | Destructive actions only |

### Exercise category accents

| Token | Hex | Category |
|---|---|---|
| `--color-strength` | `#f59e0b` | strength |
| `--color-cardio` | `#ef4444` | cardio |
| `--color-flexibility` | `#6366f1` | flexibility |
| `--color-sports` | `#22c55e` | sports |
| `--color-custom` | `#a3a3a3` | custom |

### Typography

- **Display:** `Barlow Condensed` (500/600/700) — numbers, headings, level/streak counters
- **Body:** `Barlow` (400/500/600/700) — UI text, labels, paragraphs
- **Base:** 16px, line-height 1.5
- **Numerics:** apply `font-variant-numeric: tabular-nums` to any displayed count (streak days, set counts, weight, time) to prevent layout jitter on tick-up.

### Radius

Crisp/architectural feel — never overly rounded. Confirmed user preference 2026-05-20.

| Token | Use |
|---|---|
| `--radius-md` 4px | Buttons, inputs |
| `--radius-lg` 6px | Cards, list rows |
| `--radius-xl` 10px | Bottom sheets, modals |

**Pill / circle exceptions** (kept circular because shape itself carries meaning, not corner-style): category color dots, sheet drag handle, spinner, empty-state icon badge. **All buttons and chips — including FAB and category chips — use `--radius-md` (4px)** to keep the architectural feel consistent. Confirmed 2026-05-20.

### Motion

- Tap feedback: `transform: scale(0.96)`, 100ms ease-out
- Reveal: 200ms ease-out
- Sheet enter: 240ms cubic-bezier(0.2, 0.8, 0.2, 1)
- Sheet exit: 160ms ease-in
- Progress ring: 600ms ease-out
- Streak count tick-up: 300ms
- **Always respect `prefers-reduced-motion: reduce`** — collapse to 0ms or simple fade.

## Component patterns

### Bottom Nav (existing)
- Fixed bottom, 5 tabs max, icon + label, safe-area inset, active tab in `--color-brand`.

### List row (`ExerciseListItem`)
- Min height 64px (well above 44pt tap target).
- Left: 32px category dot in category color.
- Center: name (Barlow Condensed 600 18px) + category chip.
- Right: chevron `›` in `--color-fg-faint`, or PR/streak badge if applicable.
- Background `--color-surface-1`, pressed → `--color-surface-3`.

### Category chip (`CategoryChip`)
- Pill, padding 6px 10px, font 12px medium uppercase.
- Background: category color at ~12% alpha. Text: category color at full.
- Optional 6px colored dot before label.

### Bottom Sheet (`Sheet`)
- Slides up from bottom, rounded-top `--radius-xl`, `--color-surface-2`.
- Backdrop: black 60% with `backdrop-blur-sm`.
- Drag handle (32×4px pill) at top center.
- Title bar with close button on the right.
- Sticky CTA bar at bottom with safe-area inset.
- Built on `<dialog>` for free focus trap + ESC. Custom CSS animates from bottom.

### Floating Action Button (`Fab`)
- 56×56px, `--color-brand`, white icon, `--color-on-primary` text.
- Position: bottom-right, 16px from screen edge, **above** bottom nav (bottom: 88px).
- Subtle shadow: `0 8px 24px rgba(16, 185, 129, 0.25)`.
- Press: scale 0.94, 100ms.

### Empty state
- Centered icon (64px, `--color-fg-faint` stroke), title (display font, 22px), body (`--color-fg-muted` 14px), primary action button below.

### Primary button
- Height 48px, `--radius-md`, `--color-brand` bg, `--color-on-primary` text, font-weight 600.
- Disabled: opacity 0.4, no scale on press.
- Loading: keep label, append spinner; disable.

## Gamification hooks (woven, not bolted on)

| Hook | Where it appears | Trigger |
|---|---|---|
| Streak flame | Dashboard header pill + top-right of nav | Daily activity log |
| XP + level | Settings header (ring around email avatar), dashboard small chip | Per-workout XP grant |
| Achievement badge | Dashboard "Recent unlocks" carousel; profile gallery | Lazy unlock on threshold |
| Daily quest card | Dashboard top card, dismissable once complete | Reset at local midnight |
| PR badge on exercise | Trailing on exercise list row | Workout set exceeds prior max |
| Streak badge on exercise | Trailing on exercise list row | ≥3 sessions in a row |

XP table (provisional, tune later):
- Log a workout: +10 XP
- 7-day streak: +50 XP
- New PR: +25 XP
- Level curve: `xp_needed = 100 * level^1.4`

## Dos & Don'ts

**Do**
- Use color for *meaning*, never decoration.
- Tabular figures on any displayed number.
- One primary CTA per screen, bottom-anchored when frequent.
- Animate state changes (entry, level up, streak tick), not idle decoration.
- Respect prefers-reduced-motion — degrade to fade or instant.
- Use SVG icons (inline or Lucide), stroke 2, 24×24 default.
- Test at 320px width (smallest realistic phone).

**Don't**
- No emoji as structural UI (settings ⚙️ chip = no).
- No autoplay sound or haptics by default.
- No layout shift when XP/level increments (use tabular numerics + fixed-width containers).
- No infinite scroll on lists < 1000 items (paginate or just render all).
- No "you lost your streak" red shame screen — soft re-engagement instead.
- No mixing filled and outline icons at the same hierarchy.
- No glow pulses on idle elements (only on celebration moments).

## Page-specific overrides

See `design-system/pages/<page>.md`. When working on a page, check that file first; its rules override Master.
