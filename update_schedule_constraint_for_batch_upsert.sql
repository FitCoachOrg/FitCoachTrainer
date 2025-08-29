-- Update schedule constraint to support batch upsert for meals
-- This allows multiple meals per day while maintaining data integrity

BEGIN;

-- 1) Drop the current constraint that prevents multiple meals per day
ALTER TABLE schedule DROP CONSTRAINT IF EXISTS schedule_unique_client_date_type;

-- 2) Add new constraint that includes task field to allow multiple meals per day
-- This enables batch upsert with onConflict: 'client_id,for_date,type,task'
ALTER TABLE schedule 
ADD CONSTRAINT schedule_unique_client_date_type_task
UNIQUE (client_id, for_date, type, task);

COMMIT;

-- This constraint allows:
-- - Multiple meals per day: (client_id=34, for_date='2025-09-01', type='meal', task='Breakfast')
-- - Multiple meals per day: (client_id=34, for_date='2025-09-01', type='meal', task='Lunch')
-- - Multiple meals per day: (client_id=34, for_date='2025-09-01', type='meal', task='Dinner')
-- - Multiple meals per day: (client_id=34, for_date='2025-09-01', type='meal', task='Snacks')
-- - But prevents duplicates: (client_id=34, for_date='2025-09-01', type='meal', task='Breakfast') - duplicate

-- Verification query (run this to check the constraint works):
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
