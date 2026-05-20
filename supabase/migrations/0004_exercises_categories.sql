-- Exercises: multi-category model + drop archive
-- - Replace single `category text` with `categories text[]`
-- - Drop `archived` (delete is now a real delete)
-- - Backfill existing rows so any non-empty category becomes a one-element array

alter table public.exercises
  add column if not exists categories text[];

update public.exercises
set categories = case
  when category is null or btrim(category) = '' then '{}'::text[]
  else array[category]
end
where categories is null;

alter table public.exercises
  alter column categories set default '{}'::text[];

alter table public.exercises
  alter column categories set not null;

alter table public.exercises drop column if exists category;
alter table public.exercises drop column if exists archived;

create index if not exists exercises_categories_gin_idx
  on public.exercises using gin (categories);
