-- Revert the workout_entries FK relaxation from 0005.
-- New model: exercise_id is a stable grouping key (a tombstone after deletion).
-- - Drop the ON DELETE SET NULL FK entirely
-- - Restore exercise_id NOT NULL
-- The snapshot columns and BEFORE DELETE trigger from 0005 stay in place; they
-- carry display data when the referenced exercise no longer exists.
--
-- If you have already deleted exercises between applying 0005 and this, the
-- NOT NULL step below will fail because those workouts' exercise_id was set to
-- null. Resolve manually before re-running (either delete the orphaned rows or
-- backfill them — see the comment block at the bottom of this file).

alter table public.workout_entries
  drop constraint if exists workout_entries_exercise_id_fkey;

alter table public.workout_entries
  alter column exercise_id set not null;

-- If the NOT NULL step fails with "column ... contains null values", you have
-- workouts whose exercise was deleted under the old (set-null) behavior.
-- Inspect them first:
--
--   select id, exercise_name, workout_date
--   from public.workout_entries
--   where exercise_id is null;
--
-- Then either:
--   delete from public.workout_entries where exercise_id is null;
-- or backfill a synthetic id per distinct exercise_name to preserve grouping:
--   update public.workout_entries we
--   set exercise_id = sub.synth_id
--   from (
--     select exercise_name, gen_random_uuid() as synth_id
--     from public.workout_entries
--     where exercise_id is null
--     group by exercise_name
--   ) sub
--   where we.exercise_id is null and we.exercise_name = sub.exercise_name;
-- ...then re-run the ALTER above.
