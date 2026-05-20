# Mobile Fitness Tracker PWA Spec

## Project Overview

Build a mobile-first fitness tracking PWA focused on:

* logging workouts/exercises
* tracking body metrics
* monitoring streaks and progress
* offline-first usability
* installable PWA experience

Primary users: 1 to 3 users.

Platform target:

* mobile devices first
* Android priority
* installable PWA
* long-term PWA — no native build planned

---

# Tech Stack

## Frontend

* **SvelteKit** (Svelte 5 with runes)
* **TypeScript**
* **Vite** (bundler — comes with SvelteKit)

State management:

* Svelte 5 runes (`$state`, `$derived`, `$effect`)
* Module-scoped reactive state in `src/lib/state` for cross-component sharing

Routing:

* SvelteKit file-based router (`src/routes`)

Styling:

* **Tailwind CSS**
* Mobile-first utility classes
* Readable component class names on container elements (e.g., `workout-card`, `metric-row`, `exercise-list-item`)

Charts:

* **Layer Cake** (Svelte-native) or **Chart.js** (via svelte wrapper)
* Decision deferred to implementation — pick based on bundle size after first chart spike

Local persistence:

* **Dexie.js** (IndexedDB)
* Reactive queries via `dexie-svelte` or `liveQuery`

PWA:

* **@vite-pwa/sveltekit** (Workbox-based service worker)
* Manifest, offline shell, install prompt

Networking:

* **@supabase/supabase-js** v2

---

## Backend / Database

Use:

* Supabase

Features required:

* PostgreSQL database
* authentication
* row-level security
* realtime sync support
* cloud persistence

---

# Core Product Requirements

## 1. Authentication

Support:

* email/password login
* persistent sessions (Supabase stores session in localStorage by default)
* logout

Requirements:

* app auto-logs-in if session exists
* minimal auth UI
* only authenticated users can access data
* auth guard on protected routes via SvelteKit `+layout.ts` load functions

---

# 2. Exercise Management

Users must be able to:

* create custom exercises
* edit exercises
* archive/delete exercises
* categorize exercises

Exercise fields:

* id
* name
* category
* measurement_type

measurement_type enum:

* reps
* duration
* weight
* distance
* custom

Examples:

* Push Ups → reps
* Dead Hang → duration
* Running → distance
* Bench Press → weight

Suggested categories:

* strength
* cardio
* flexibility
* sports
* custom

---

# 3. Workout Logging

Users can create workout entries.

Workout entry fields:

* id
* exercise_id
* date
* notes
* created_at

Each workout entry can contain multiple sets.

Workout set fields:

* reps
* weight
* duration_seconds
* distance
* calories
* rest_seconds

Requirements:

* quick add workflow
* duplicate previous workout
* edit/delete logs
* view workout history per exercise

---

# 4. Body Metrics Tracking

Track:

* body weight
* height
* BMI
* notes

Requirements:

* BMI auto-calculation
* historical graph view
* metric and imperial support
* allow multiple entries over time

BMI formula:

```text
BMI = weight_kg / (height_m ^ 2)
```

---

# 5. Streak System

Track:

* daily activity streak
* longest streak
* current streak

Definition:
A streak increments if user logs:

* at least one workout OR
* one body metric entry

Requirements:

* streak badge/homepage widget
* streak recovery logic optional
* local calculation acceptable (computed from Dexie data)

---

# 6. Dashboard/Home Screen

Show:

* today's streak
* recent workouts
* body weight trend
* quick-add workout button
* progress summary
* last workout
* weekly activity count

Charts:

* workout frequency
* body weight trend
* activity consistency

---

# 7. Offline-First Support

Requirements:

* app must function offline
* logs saved locally immediately (write to Dexie first, always)
* sync to Supabase when online

Implementation:

* Dexie as source of truth for the UI
* outbox table in Dexie for pending mutations
* sync worker drains outbox to Supabase on reconnect
* Supabase realtime subscriptions hydrate Dexie when online

Conflict strategy:

* latest update wins (per-row `updated_at` comparison)
* acceptable for 1–3 users; revisit if multi-device editing becomes common

---

# 8. PWA Support

App must:

* be installable
* support home-screen installation
* support splash screen
* support app icon (maskable)
* support offline caching of app shell + API responses

PWA behavior:

* `display: standalone` in manifest
* responsive mobile layout
* service worker precaches app shell
* runtime caching for Supabase reads with stale-while-revalidate

---

# UI/UX Requirements

Style:

* minimal
* modern
* fast
* mobile-first

Requirements:

* dark mode (Tailwind `dark:` variant + `prefers-color-scheme` with manual override)
* responsive layout
* bottom navigation bar
* large tap targets (min 44px)
* smooth CSS transitions
* one-handed usability

Pages (SvelteKit routes):

* `/login`
* `/` (Dashboard)
* `/workouts`
* `/exercises`
* `/metrics`
* `/settings`

---

# Database Schema

## users

Managed by Supabase auth.

---

## exercises

Fields:

* id
* user_id
* name
* category
* measurement_type
* created_at
* updated_at

---

## workout_entries

Fields:

* id
* user_id
* exercise_id
* workout_date
* notes
* created_at
* updated_at

---

## workout_sets

Fields:

* id
* workout_entry_id
* reps
* weight
* duration_seconds
* distance
* calories
* rest_seconds

---

## body_metrics

Fields:

* id
* user_id
* weight
* height
* bmi
* recorded_at
* updated_at

---

# Security

Requirements:

* enable Supabase Row Level Security on every table
* users can only access their own data (RLS policy: `auth.uid() = user_id`)
* validate all inputs client-side and rely on Postgres constraints server-side
* no public access to workout data
* Supabase anon key is safe to ship in client; RLS is the real boundary

---

# Non-Functional Requirements

## Performance

* first contentful paint under 2 seconds on 4G
* time-to-interactive under 3 seconds
* smooth 60fps scrolling on mid-range Android
* responsive interactions (<100ms tap feedback)

## Scalability

Current target:

* 1 to 3 users

Architecture should still support:

* thousands of workout entries per user
* indexed Dexie queries for fast history lookups

---

# Nice-to-Have Features (Optional)

## Notifications

* workout reminders (Web Push API + service worker)
* streak reminders

## Templates

* reusable workout templates

## Analytics

* personal records
* volume tracking
* trend analysis

## Export

* CSV export
* JSON backup

---

# Recommended Folder Structure

```text
/src
  /routes
    /(auth)
      /login/+page.svelte
    /(app)
      /+layout.svelte         # bottom nav, auth guard
      /+page.svelte           # dashboard
      /workouts/+page.svelte
      /exercises/+page.svelte
      /metrics/+page.svelte
      /settings/+page.svelte
  /lib
    /components               # shared UI
    /state                    # runes-based stores
    /db                       # Dexie schema + queries
    /supabase                 # client + sync engine
    /sync                     # outbox, conflict resolution
    /utils
  app.html
  app.css                     # Tailwind entrypoint
/static
  manifest.webmanifest
  icons/
svelte.config.js
vite.config.ts
tailwind.config.ts
```

---

# Recommended Architecture

* feature-first organization inside `/src/routes` and `/src/lib`
* repository pattern: components never touch Supabase or Dexie directly — they call `/lib/db` functions
* clean separation:

  * UI (Svelte components)
  * state (runes in `/lib/state`)
  * data layer (`/lib/db` Dexie queries + `/lib/supabase` client)
  * sync (`/lib/sync` outbox + reconciliation)

Data flow:

```
UI → /lib/db (Dexie) → reactive query updates UI
                ↓
           /lib/sync outbox → Supabase
                ↑
       Supabase realtime → /lib/db
```

---

# MVP Priority Order

## Phase 1

* SvelteKit + Tailwind + PWA scaffolding
* Supabase auth
* exercise CRUD (local-first via Dexie)
* workout logging
* dashboard skeleton

## Phase 2

* Supabase sync (outbox + realtime)
* charts
* streaks
* body metrics

## Phase 3

* push notifications
* templates
* analytics
* export/import

---

# Deliverables

The coding agent should produce:

* SvelteKit + TypeScript application
* Supabase schema SQL (with RLS policies)
* `.env.example` for `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`
* setup instructions (`README.md`)
* responsive mobile UI
* offline support via Dexie + service worker
* production-ready project structure

---

# Deployment Targets

## Web/PWA

Deploy to:

* **Vercel** (preferred — first-class SvelteKit adapter)
* Netlify (alternative)

Use `@sveltejs/adapter-vercel` or `@sveltejs/adapter-netlify`.

## Backend

* Supabase (managed)

---

# Additional Notes

Prioritize:

* simplicity
* maintainability
* clean mobile UX
* fast logging workflow

Avoid:

* unnecessary microservices
* overly complex backend logic
* premature optimization
* heavy client-side state libraries — runes are enough

The application should feel:

* lightweight
* fast
* personal
* frictionless for daily use
