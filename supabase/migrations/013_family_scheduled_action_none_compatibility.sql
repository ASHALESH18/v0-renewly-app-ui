-- S4C: Fix scheduled_action null/not-null DB mismatch
-- The family_groups.scheduled_action column requires a non-null value.
-- Valid no-op value is 'none' for cleared scheduled actions.

-- Update any existing null values to 'none'
update public.family_groups
set scheduled_action = 'none'
where scheduled_action is null;

-- Set default for future inserts
alter table public.family_groups
  alter column scheduled_action set default 'none';

-- No data is dropped. No constraints are changed.
-- Only null values are converted to 'none' and default is set for future safety.
