-- Debug script to check AI Insights views
-- Run this in your Supabase SQL Editor

-- 1. Check if views exist
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename IN ('adherence_14d', 'momentum_3w', 'readiness_7d', 'nutrition_7d', 'engagement_14d')
  AND schemaname = 'public';

-- 2. Check view definitions (if they exist)
SELECT
  table_name,
  view_definition
FROM information_schema.views
WHERE table_name IN ('adherence_14d', 'momentum_3w', 'readiness_7d', 'nutrition_7d', 'engagement_14d')
  AND table_schema = 'public';

-- 3. Test with sample client_id (replace 123 with your actual client_id)
-- First, check what client_ids exist
SELECT client_id, cl_name FROM client LIMIT 5;

-- Then test the views (replace 123 with actual client_id)
-- SELECT * FROM adherence_14d WHERE client_id = 123;
-- SELECT * FROM momentum_3w WHERE client_id = 123;
-- SELECT * FROM readiness_7d WHERE client_id = 123;
-- SELECT * FROM nutrition_7d WHERE client_id = 123;
-- SELECT * FROM engagement_14d WHERE client_id = 123;

-- 4. Check underlying tables exist
SELECT
  table_name
FROM information_schema.tables
WHERE table_name IN ('schedule', 'workout_info', 'activity_info', 'meal_info', 'client_engagement_score')
  AND table_schema = 'public';
