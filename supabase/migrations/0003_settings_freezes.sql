-- user_settings: add fields that exist in the Dexie schema but are missing here.
-- Without these columns sync of user_settings would error with "column does not exist".

alter table public.user_settings
  add column if not exists freezes_available integer not null default 1;

alter table public.user_settings
  add column if not exists last_freeze_award_streak integer not null default 0;
