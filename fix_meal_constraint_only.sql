-- Fix meal constraint to allow multiple meals per day
-- This only affects meals (type = 'meal') while keeping other constraints intact

BEGIN;

-- 1) Drop the current constraint that prevents multiple meals per day
ALTER TABLE schedule DROP CONSTRAINT IF EXISTS schedule_unique_client_date_type;

-- 2) Re-add the original constraint for all non-meal types
-- This includes custom events (hydration, progresspicture, weight, etc.)
-- Each type can have one entry per day
ALTER TABLE schedule 
ADD CONSTRAINT schedule_unique_client_date_type_non_meal
UNIQUE (client_id, for_date, type) 
WHERE type != 'meal';

-- 3) Add a specific constraint for meals that includes task field
-- This allows multiple meals per day with different tasks
ALTER TABLE schedule 
ADD CONSTRAINT schedule_unique_meal_client_date_task
UNIQUE (client_id, for_date, task) 
WHERE type = 'meal';

COMMIT;

-- This approach:
-- - Keeps the original constraint for all non-meal types (one per day per type)
-- - Includes custom events: one hydration, one progresspicture, one weight, etc. per day
-- - Allows multiple meals per day as long as tasks are different (Breakfast, Lunch, Dinner, Snacks)
-- - Prevents duplicate meals (same client, date, task) for meals
