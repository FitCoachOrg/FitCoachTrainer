-- Fix schedule unique constraint to allow multiple meals per day
-- This constraint was added on August 27, 2025 and is preventing multiple meals per day

BEGIN;

-- 1) Drop the current constraint that prevents multiple meals per day
ALTER TABLE schedule DROP CONSTRAINT IF EXISTS schedule_unique_client_date_type;

-- 2) Add a general constraint for all non-meal types (workout, etc.)
-- This includes custom events (hydration, progresspicture, weight, etc.)
-- Each type can have one entry per day
ALTER TABLE schedule 
ADD CONSTRAINT schedule_unique_client_date_type_non_meal
UNIQUE (client_id, for_date, type) 
WHERE type != 'meal';

-- 3) Add a specific constraint for meals that includes task field
-- This allows multiple meals per day with different tasks
ALTER TABLE schedule 
ADD CONSTRAINT schedule_unique_client_date_type_task_meal
UNIQUE (client_id, for_date, type, task) 
WHERE type = 'meal';

-- 4) Verify the constraints work correctly
-- Non-meal types: Only one per (client_id, for_date, type)
-- Includes custom events: one hydration, one progresspicture, one weight, etc. per day
-- Meal types: Multiple allowed per (client_id, for_date, type) as long as tasks differ

COMMIT;

-- Verification queries (run these to check the constraints work)

-- 1) Check that multiple meals per day are allowed
-- SELECT 
--   client_id, 
--   for_date, 
--   type, 
--   task,
--   COUNT(*) as count
-- FROM schedule 
-- WHERE type = 'meal' 
-- GROUP BY client_id, for_date, type, task 
-- HAVING COUNT(*) > 1;

-- 2) Check that non-meal types still have the original constraint
-- SELECT 
--   client_id, 
--   for_date, 
--   type,
--   COUNT(*) as count
-- FROM schedule 
-- WHERE type != 'meal' 
-- GROUP BY client_id, for_date, type 
-- HAVING COUNT(*) > 1;

-- 3) Show all constraints on the schedule table
-- SELECT 
--   conname as constraint_name,
--   pg_get_constraintdef(oid) as constraint_definition
-- FROM pg_constraint 
-- WHERE conrelid = 'schedule'::regclass;
