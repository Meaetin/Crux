-- Fitness Tracker initial schema
-- Run in Supabase SQL editor, or via `supabase db push` if using the CLI.

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- exercises
-- ---------------------------------------------------------------------------
create table if not exists public.exercises (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  measurement_type text not null check (
    measurement_type in ('reps', 'duration', 'weight', 'distance', 'custom')
  ),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists exercises_user_id_idx on public.exercises(user_id);

-- ---------------------------------------------------------------------------
-- workout_entries
-- ---------------------------------------------------------------------------
create table if not exists public.workout_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  workout_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists workout_entries_user_date_idx
  on public.workout_entries(user_id, workout_date desc);
create index if not exists workout_entries_exercise_idx
  on public.workout_entries(exercise_id);

-- ---------------------------------------------------------------------------
-- workout_sets
-- ---------------------------------------------------------------------------
create table if not exists public.workout_sets (
  id uuid primary key default uuid_generate_v4(),
  workout_entry_id uuid not null references public.workout_entries(id) on delete cascade,
  position smallint not null default 0,
  reps integer,
  weight numeric,
  duration_seconds integer,
  distance numeric,
  calories integer,
  rest_seconds integer
);
create index if not exists workout_sets_entry_idx
  on public.workout_sets(workout_entry_id);

-- ---------------------------------------------------------------------------
-- body_metrics
-- ---------------------------------------------------------------------------
create table if not exists public.body_metrics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight numeric,
  height numeric,
  bmi numeric,
  recorded_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists body_metrics_user_recorded_idx
  on public.body_metrics(user_id, recorded_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_exercises on public.exercises;
create trigger touch_exercises before update on public.exercises
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_workout_entries on public.workout_entries;
create trigger touch_workout_entries before update on public.workout_entries
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_body_metrics on public.body_metrics;
create trigger touch_body_metrics before update on public.body_metrics
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.exercises enable row level security;
alter table public.workout_entries enable row level security;
alter table public.workout_sets enable row level security;
alter table public.body_metrics enable row level security;

drop policy if exists "exercises owner all" on public.exercises;
create policy "exercises owner all" on public.exercises
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "workout_entries owner all" on public.workout_entries;
create policy "workout_entries owner all" on public.workout_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "workout_sets owner all" on public.workout_sets;
create policy "workout_sets owner all" on public.workout_sets
  for all using (
    exists (
      select 1 from public.workout_entries we
      where we.id = workout_sets.workout_entry_id
        and we.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.workout_entries we
      where we.id = workout_sets.workout_entry_id
        and we.user_id = auth.uid()
    )
  );

drop policy if exists "body_metrics owner all" on public.body_metrics;
create policy "body_metrics owner all" on public.body_metrics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
