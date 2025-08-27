-- AI Insights Views and Indexes
-- Purpose: Provide small, stable, LLM-friendly views for concise AI Summary.
-- Tables referenced: schedule, workout_info, activity_info, meal_info, client_engagement_score

-- =============================
-- Helpful indexes (idempotent)
-- =============================
CREATE INDEX IF NOT EXISTS idx_schedule_client_date_status ON schedule(client_id, for_date, status);
CREATE INDEX IF NOT EXISTS idx_workout_info_client_date ON workout_info(client_id, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_info_client_date ON activity_info(client_id, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_info_activity ON activity_info(activity);
CREATE INDEX IF NOT EXISTS idx_meal_info_client_date ON meal_info(client_id, created_at);
CREATE INDEX IF NOT EXISTS idx_client_engagement_score_client_date ON client_engagement_score(client_id, for_date);

-- =====================================
-- View: adherence_14d
-- client_id, adherence_pct (0-100), completed_count, total_count, window_start, window_end
-- =====================================
CREATE OR REPLACE VIEW adherence_14d AS
WITH time_window AS (
  SELECT CURRENT_DATE - INTERVAL '14 days' AS window_start, CURRENT_DATE + INTERVAL '1 day' AS window_end
)
SELECT
  s.client_id,
  CASE WHEN COUNT(*) = 0 THEN NULL
       ELSE ROUND(100.0 * SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) / COUNT(*), 1)
  END AS adherence_pct,
  SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
  COUNT(*) AS total_count,
  (SELECT window_start FROM time_window) AS window_start,
  (SELECT window_end FROM time_window)   AS window_end
FROM schedule s
JOIN time_window w ON TRUE
WHERE s.for_date >= w.window_start::date AND s.for_date < w.window_end::date
GROUP BY s.client_id;

-- =====================================
-- View: momentum_3w
-- client_id, sessions_delta, volume_delta, avg_sessions, avg_volume, start_week, end_week
-- sessions = COUNT rows in workout_info; volume = SUM(sets*reps)
-- =====================================
CREATE OR REPLACE VIEW momentum_3w AS
WITH weeks AS (
  SELECT
    client_id,
    date_trunc('week', created_at) AS wk,
    COUNT(*) AS sessions,
    SUM(COALESCE(sets, 0) * COALESCE(reps, 0)) AS volume
  FROM workout_info
  GROUP BY 1, 2
), last3 AS (
  SELECT * FROM (
    SELECT w.*, ROW_NUMBER() OVER (PARTITION BY client_id ORDER BY wk DESC) AS rn
    FROM weeks w
  ) t
  WHERE rn <= 3
), agg AS (
  SELECT
    client_id,
    MIN(wk) AS start_week,
    MAX(wk) AS end_week,
    AVG(sessions)::numeric(10,2) AS avg_sessions,
    AVG(volume)::numeric(10,2) AS avg_volume,
    SUM(CASE WHEN wk = (SELECT MIN(wk) FROM last3 l2 WHERE l2.client_id = l1.client_id) THEN sessions ELSE 0 END) AS sessions_first,
    SUM(CASE WHEN wk = (SELECT MAX(wk) FROM last3 l2 WHERE l2.client_id = l1.client_id) THEN sessions ELSE 0 END) AS sessions_last,
    SUM(CASE WHEN wk = (SELECT MIN(wk) FROM last3 l2 WHERE l2.client_id = l1.client_id) THEN volume ELSE 0 END)   AS volume_first,
    SUM(CASE WHEN wk = (SELECT MAX(wk) FROM last3 l2 WHERE l2.client_id = l1.client_id) THEN volume ELSE 0 END)   AS volume_last
  FROM last3 l1
  GROUP BY client_id
)
SELECT
  client_id,
  (sessions_last - sessions_first) AS sessions_delta,
  (volume_last - volume_first)     AS volume_delta,
  avg_sessions,
  avg_volume,
  start_week,
  end_week
FROM agg;

-- =====================================
-- View: readiness_7d (proxy)
-- client_id, sleep_quality_avg, sleep_duration_avg, energy_avg, window_start, window_end
-- Pulls numeric qty from activity_info where activity matches relevant labels.
-- =====================================
CREATE OR REPLACE VIEW readiness_7d AS
WITH time_window AS (
  SELECT CURRENT_DATE - INTERVAL '7 days' AS window_start, CURRENT_DATE + INTERVAL '1 day' AS window_end
), base AS (
  SELECT
    ai.client_id,
    LOWER(TRIM(ai.activity)) AS activity_norm,
    ai.qty::numeric AS qty,
    ai.created_at
  FROM activity_info ai
)
SELECT
  b.client_id,
  AVG(CASE WHEN activity_norm = 'sleep quality'  THEN qty END) AS sleep_quality_avg,
  AVG(CASE WHEN activity_norm = 'sleep duration' THEN qty END) AS sleep_duration_avg,
  AVG(CASE WHEN activity_norm = 'energy level'   THEN qty END) AS energy_avg,
  (SELECT window_start FROM time_window) AS window_start,
  (SELECT window_end FROM time_window)   AS window_end
FROM base b
JOIN time_window w ON TRUE
WHERE b.created_at >= w.window_start AND b.created_at < w.window_end
GROUP BY b.client_id;

-- =====================================
-- View: nutrition_7d
-- client_id, kcal_avg, protein_avg, carbs_avg, fat_avg, window_start, window_end
-- Computes daily sums then averages over the 7-day window
-- =====================================
CREATE OR REPLACE VIEW nutrition_7d AS
WITH time_window AS (
  SELECT CURRENT_DATE - INTERVAL '7 days' AS window_start, CURRENT_DATE + INTERVAL '1 day' AS window_end
), daily AS (
  SELECT
    client_id,
    DATE(created_at) AS day,
    SUM(COALESCE(calories, 0)::numeric) AS kcal_day,
    SUM(COALESCE(protein,  0)::numeric) AS protein_day,
    SUM(COALESCE(carbs,    0)::numeric) AS carbs_day,
    SUM(COALESCE(fat,      0)::numeric) AS fat_day
  FROM meal_info m
  JOIN time_window w ON TRUE
  WHERE m.created_at >= w.window_start AND m.created_at < w.window_end
  GROUP BY client_id, DATE(created_at)
)
SELECT
  client_id,
  AVG(kcal_day)::numeric(10,1)    AS kcal_avg,
  AVG(protein_day)::numeric(10,1) AS protein_avg,
  AVG(carbs_day)::numeric(10,1)   AS carbs_avg,
  AVG(fat_day)::numeric(10,1)     AS fat_avg,
  (SELECT window_start FROM time_window) AS window_start,
  (SELECT window_end FROM time_window)   AS window_end
FROM daily
GROUP BY client_id;

-- =====================================
-- View: engagement_14d
-- client_id, eng_score_avg, latest_score, window_start, window_end
-- =====================================
CREATE OR REPLACE VIEW engagement_14d AS
WITH time_window AS (
  SELECT CURRENT_DATE - INTERVAL '14 days' AS window_start, CURRENT_DATE + INTERVAL '1 day' AS window_end
), base AS (
  SELECT * FROM client_engagement_score
)
SELECT
  b.client_id,
  AVG(b.eng_score)::numeric(10,1) AS eng_score_avg,
  (SELECT ces.eng_score FROM client_engagement_score ces
   WHERE ces.client_id = b.client_id
   ORDER BY ces.for_date DESC, ces.id DESC
   LIMIT 1) AS latest_score,
  (SELECT window_start FROM time_window) AS window_start,
  (SELECT window_end FROM time_window)   AS window_end
FROM base b
JOIN time_window w ON TRUE
WHERE b.for_date >= w.window_start::date AND b.for_date < w.window_end::date
GROUP BY b.client_id;

-- End of file


