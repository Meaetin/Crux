-- Metrics + settings schema alignment
-- - Drop height/bmi from body_metrics (height moves to user_settings, BMI derived in UI)
-- - Add notes to body_metrics
-- - Add user_settings + streak_freezes tables (present in Dexie v2 but missing here)

-- ---------------------------------------------------------------------------
-- body_metrics
-- ---------------------------------------------------------------------------
alter table public.body_metrics drop column if exists height;
alter table public.body_metrics drop column if exists bmi;
alter table public.body_metrics add column if not exists notes text;

-- ---------------------------------------------------------------------------
-- user_settings
-- ---------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notify_streak_enabled boolean not null default false,
  notify_streak_time text not null default '20:00',
  longest_streak integer not null default 0,
  height_cm numeric,
  unit_system text not null default 'metric'
    check (unit_system in ('metric', 'imperial')),
  updated_at timestamptz not null default now()
);

drop trigger if exists touch_user_settings on public.user_settings;
create trigger touch_user_settings before update on public.user_settings
  for each row execute function public.touch_updated_at();

alter table public.user_settings enable row level security;

drop policy if exists "user_settings owner all" on public.user_settings;
create policy "user_settings owner all" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- streak_freezes
-- ---------------------------------------------------------------------------
create table if not exists public.streak_freezes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  applied_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, applied_date)
);
create index if not exists streak_freezes_user_date_idx
  on public.streak_freezes(user_id, applied_date desc);

drop trigger if exists touch_streak_freezes on public.streak_freezes;
create trigger touch_streak_freezes before update on public.streak_freezes
  for each row execute function public.touch_updated_at();

alter table public.streak_freezes enable row level security;

drop policy if exists "streak_freezes owner all" on public.streak_freezes;
create policy "streak_freezes owner all" on public.streak_freezes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
