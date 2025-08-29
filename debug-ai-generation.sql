-- Debug AI Generation for Client 34
-- Run this in Supabase SQL Editor

-- 1. Check if client exists
SELECT client_id, cl_name FROM client WHERE client_id = 34;

-- 2. Check trainer notes (critical for AI analysis)
SELECT
  trainer_notes,
  LENGTH(trainer_notes) as notes_length,
  created_at
FROM trainer_client_web
WHERE client_id = 34;

-- 3. Check if AI insights views exist
SELECT
  schemaname,
  tablename
FROM pg_tables
WHERE tablename IN ('adherence_14d', 'momentum_3w', 'readiness_7d', 'nutrition_7d', 'engagement_14d')
ORDER BY tablename;

-- 4. If views exist, test them (uncomment and run)
-- SELECT * FROM adherence_14d WHERE client_id = 34;
-- SELECT * FROM momentum_3w WHERE client_id = 34;
-- SELECT * FROM readiness_7d WHERE client_id = 34;
-- SELECT * FROM nutrition_7d WHERE client_id = 34;
-- SELECT * FROM engagement_14d WHERE client_id = 34;

-- 5. Check recent schedule data (for adherence)
SELECT
  COUNT(*) as total_scheduled,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
  ROUND(
    CASE WHEN COUNT(*) > 0
         THEN 100.0 * SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*)
         ELSE 0
    END, 1
  ) as adherence_pct
FROM schedule
WHERE client_id = 34
  AND for_date >= CURRENT_DATE - INTERVAL '14 days';

-- 6. Check recent workout data (for momentum)
SELECT
  COUNT(*) as recent_sessions,
  AVG(sets) as avg_sets,
  AVG(reps) as avg_reps,
  AVG(duration) as avg_duration,
  MIN(created_at) as earliest,
  MAX(created_at) as latest
FROM workout_info
WHERE client_id = 34
  AND created_at >= CURRENT_DATE - INTERVAL '30 days';

-- 7. Check recent activity data (for readiness)
SELECT
  activity,
  COUNT(*) as entries,
  AVG(qty) as avg_qty,
  MIN(created_at) as earliest,
  MAX(created_at) as latest
FROM activity_info
WHERE client_id = 34
  AND created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY activity;

-- 8. Check if AI analysis was ever saved
SELECT
  ai_summary,
  LENGTH(ai_summary::text) as ai_summary_length,
  created_at
FROM trainer_client_web
WHERE client_id = 34
  AND ai_summary IS NOT NULL;

-- 9. Check OpenRouter API key is set (in your app, not database)
-- This is in your .env file: VITE_OPENROUTER_API_KEY
