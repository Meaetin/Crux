-- Workout entries: keep an identity snapshot of the exercise so deleting an
-- exercise preserves usable workout history.
-- - Add nullable snapshot columns (only populated when the exercise is deleted)
-- - Make exercise_id nullable and switch FK to ON DELETE SET NULL
-- - Trigger snapshots name/categories/measurement_type before the FK nulls the id

alter table public.workout_entries
  add column if not exists exercise_name text,
  add column if not exists exercise_categories text[],
  add column if not exists exercise_measurement_type text;

alter table public.workout_entries
  alter column exercise_id drop not null;

alter table public.workout_entries
  drop constraint if exists workout_entries_exercise_id_fkey;

alter table public.workout_entries
  add constraint workout_entries_exercise_id_fkey
  foreign key (exercise_id) references public.exercises(id) on delete set null;

create or replace function public.snapshot_workout_entries_before_exercise_delete()
returns trigger language plpgsql as $$
begin
  update public.workout_entries
  set
    exercise_name = old.name,
    exercise_categories = old.categories,
    exercise_measurement_type = old.measurement_type
  where exercise_id = old.id
    and exercise_name is null;
  return old;
end;
$$;

drop trigger if exists snapshot_workout_entries on public.exercises;
create trigger snapshot_workout_entries
  before delete on public.exercises
  for each row execute function public.snapshot_workout_entries_before_exercise_delete();
