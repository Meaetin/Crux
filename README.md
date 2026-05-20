# Crux

Mobile-first fitness tracker PWA — workouts, body metrics, streaks. Local-first via Dexie/IndexedDB, synced to Supabase, installable on Android.

## Tech stack

- **SvelteKit** + Svelte 5 runes, **TypeScript**, **Vite**
- **Tailwind CSS v4** (design tokens in `src/app.css`)
- **Dexie** (IndexedDB) — source of truth for the UI
- **Supabase** — Postgres + auth + RLS
- **@vite-pwa/sveltekit** — service worker, manifest, installable PWA
- **Layer Cake** + d3 — charts
- **`@sveltejs/adapter-vercel`** — deploy target

## Project layout

```
src/
  routes/
    (auth)/login/        # email/password sign-in
    (app)/               # dashboard, workouts, exercises, metrics, settings
    +error.svelte        # top-level error UI
  lib/
    components/          # shared UI
    state/               # runes-based stores (session, streak)
    db/                  # Dexie schema + queries
    supabase/            # client
    sync/                # outbox + reconciliation engine
    utils/               # dates, units, tiers, analytics
supabase/migrations/     # SQL — apply in order to your Supabase project
static/icons/            # PWA icons (maskable + any)
```

## Local setup

Requires Node 22+.

```bash
npm install
cp .env.example .env
# fill in PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

### Supabase setup

1. Create a Supabase project.
2. Apply migrations in order via the SQL editor or `supabase db push`:
   - `0001_init.sql` — base tables (`exercises`, `workout_entries`, `workout_sets`, `body_metrics`) + RLS
   - `0002_metrics.sql` — drops `height`/`bmi` from `body_metrics`, adds `user_settings` + `streak_freezes`
   - `0003_settings_freezes.sql` — adds `freezes_available`, `last_freeze_award_streak` to `user_settings`
   - `0004_exercises_categories.sql` — moves `category` → `categories text[]`, drops `archived`
   - `0005_workout_exercise_snapshot.sql` — adds identity snapshot columns to `workout_entries`
   - `0006_workout_exercise_keep_id.sql` — re-tightens `exercise_id NOT NULL` (read header comments — manual data step needed if you have orphaned rows from `0005`)
3. Under **Authentication → URL Configuration**, set the Site URL to your production origin and add any preview origins to Redirect URLs.

Every table has RLS enabled with `auth.uid() = user_id` policies — there is no service role usage in the client.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build locally |
| `npm run check` | `svelte-check` + TypeScript |
| `npm run icons` | Regenerate PNG icons from `static/icons/icon.svg` |

## Deploy (Vercel)

1. Import the repo into Vercel.
2. Set environment variables on the project: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`.
3. The framework preset is detected as SvelteKit; the adapter is pinned to Node 22.x in `svelte.config.js`.
4. Ensure all Supabase migrations are applied before traffic hits the new deploy — the sync engine surfaces missing-column errors clearly, but they will block writes.

## Offline + sync model

- All UI reads from Dexie via `liveQuery` — never directly from Supabase.
- Writes go to Dexie first, then an outbox row is queued.
- The sync engine drains the outbox on: app start, network `online`, and tab `visibilitychange` (visible).
- After the outbox is fully drained, a snapshot pull replaces the local mirror per table.
- Conflict policy: last-write-wins via `updated_at` (acceptable for 1–3 users).

## Notes

- `ssr = false` and `prerender = false` are set in `src/routes/+layout.ts`. This is a pure client app — auth state and Dexie are browser-only. The harmless `prerendered/**/*.{html,json}` warning during PWA build comes from this.
- Theme follows `prefers-color-scheme`; `<html class="dark">` is the default. Both modes share the same token names (see `src/app.css`).
