-- Database Views for Client Insights Cards
-- These views provide the data needed for the momentum, adherence, and engagement metrics

-- =====================================
-- View: momentum_3w
-- Shows workout volume trends over the last 3 weeks
-- =====================================
CREATE OR REPLACE VIEW momentum_3w AS
WITH weekly_volumes AS (
  SELECT 
    client_id,
    DATE_TRUNC('week', created_at) as week_start,
    SUM(COALESCE(sets, 0) * COALESCE(reps, 0)) as weekly_volume
  FROM workout_info 
  WHERE created_at >= CURRENT_DATE - INTERVAL '3 weeks'
  GROUP BY client_id, DATE_TRUNC('week', created_at)
),
volume_changes AS (
  SELECT 
    w1.client_id,
    w1.week_start as current_week,
    w2.week_start as previous_week,
    w1.weekly_volume as current_volume,
    w2.weekly_volume as previous_volume,
    CASE 
      WHEN w2.weekly_volume > 0 THEN 
        ((w1.weekly_volume - w2.weekly_volume) / w2.weekly_volume) * 100
      ELSE 0 
    END as volume_delta
  FROM weekly_volumes w1
  LEFT JOIN weekly_volumes w2 ON w1.client_id = w2.client_id 
    AND w2.week_start = w1.week_start - INTERVAL '1 week'
  WHERE w1.week_start = (SELECT MAX(week_start) FROM weekly_volumes)
)
SELECT 
  vc.client_id,
  c.cl_name as client_name,
  COALESCE(vc.volume_delta, 0) as volume_delta,
  COALESCE(vc.current_volume, 0) as current_volume,
  COALESCE(vc.previous_volume, 0) as previous_volume,
  vc.current_week,
  vc.previous_week
FROM volume_changes vc
JOIN client c ON vc.client_id = c.client_id
ORDER BY vc.volume_delta DESC;

-- =====================================
-- View: adherence_14d (Updated)
-- Shows 14-day workout completion rates with client names
-- =====================================
CREATE OR REPLACE VIEW adherence_14d AS
WITH time_window AS (
  SELECT CURRENT_DATE - INTERVAL '14 days' AS window_start, CURRENT_DATE + INTERVAL '1 day' AS window_end
)
SELECT
  s.client_id,
  c.cl_name as client_name,
  CASE WHEN COUNT(*) = 0 THEN NULL
       ELSE ROUND(100.0 * SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) / COUNT(*), 1)
  END AS adherence_pct,
  SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
  COUNT(*) AS total_count,
  (SELECT window_start FROM time_window) AS window_start,
  (SELECT window_end FROM time_window)   AS window_end
FROM schedule s
JOIN client c ON s.client_id = c.client_id
JOIN time_window w ON TRUE
WHERE s.for_date >= w.window_start::date AND s.for_date < w.window_end::date
GROUP BY s.client_id, c.cl_name
ORDER BY adherence_pct DESC;

-- =====================================
-- View: engagement_14d
-- Shows 14-day average engagement scores with client names
-- =====================================
CREATE OR REPLACE VIEW engagement_14d AS
SELECT
  ces.client_id,
  c.cl_name as client_name,
  ROUND(AVG(ces.eng_score), 1) as avg_engagement,
  COUNT(*) as days_tracked,
  MIN(ces.for_date) as start_date,
  MAX(ces.for_date) as end_date
FROM client_engagement_score ces
JOIN client c ON ces.client_id = c.client_id
WHERE ces.for_date >= CURRENT_DATE - INTERVAL '14 days'
  AND ces.eng_score IS NOT NULL
GROUP BY ces.client_id, c.cl_name
ORDER BY avg_engagement DESC;

-- =====================================
-- Indexes for performance
-- =====================================
CREATE INDEX IF NOT EXISTS idx_workout_info_client_date ON workout_info(client_id, created_at);
CREATE INDEX IF NOT EXISTS idx_schedule_client_date_status ON schedule(client_id, for_date, status);
CREATE INDEX IF NOT EXISTS idx_client_engagement_score_client_date ON client_engagement_score(client_id, for_date);
CREATE INDEX IF NOT EXISTS idx_client_engagement_score_date_score ON client_engagement_score(for_date, eng_score);

-- =====================================
-- Helper function to get client name
-- =====================================
CREATE OR REPLACE FUNCTION get_client_name(client_id_param INTEGER)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT cl_name FROM client WHERE client_id = client_id_param);
END;
$$ LANGUAGE plpgsql;
