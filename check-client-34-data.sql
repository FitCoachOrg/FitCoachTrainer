-- Check data for client_id = 34
-- Run this in your Supabase SQL Editor

-- 1. Basic client info
SELECT client_id, cl_name, cl_primary_goal, training_days_per_week, created_at
FROM client
WHERE client_id = 34;

-- 2. Trainer notes (last 30 days)
SELECT
  trainer_notes,
  created_at,
  updated_at
FROM trainer_client_web
WHERE client_id = 34;

-- 3. Schedule data (last 30 days)
SELECT
  id,
  for_date,
  type,
  status,
  summary,
  created_at
FROM schedule
WHERE client_id = 34
  AND for_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY for_date DESC;

-- 4. Workout data (last 30 days)
SELECT
  id,
  created_at,
  sets,
  reps,
  duration,
  intensity
FROM workout_info
WHERE client_id = 34
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY created_at DESC;

-- 5. Activity data (last 30 days)
SELECT
  id,
  activity,
  qty,
  unit,
  created_at
FROM activity_info
WHERE client_id = 34
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY created_at DESC;

-- 6. Meal data (last 30 days)
SELECT
  id,
  calories,
  protein,
  carbs,
  fat,
  created_at
FROM meal_info
WHERE client_id = 34
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY created_at DESC;

-- 7. Engagement data (last 30 days)
SELECT
  id,
  for_date,
  eng_score,
  total_due,
  completed,
  created_at
FROM client_engagement_score
WHERE client_id = 34
  AND for_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY for_date DESC;

-- 8. Check if AI insights views exist
SELECT
  schemaname,
  tablename
FROM pg_tables
WHERE tablename IN ('adherence_14d', 'momentum_3w', 'readiness_7d', 'nutrition_7d', 'engagement_14d')
  AND schemaname = 'public';

-- 9. If views exist, test them with client 34
-- SELECT * FROM adherence_14d WHERE client_id = 34;
-- SELECT * FROM momentum_3w WHERE client_id = 34;
-- SELECT * FROM readiness_7d WHERE client_id = 34;
-- SELECT * FROM nutrition_7d WHERE client_id = 34;
-- SELECT * FROM engagement_14d WHERE client_id = 34;
