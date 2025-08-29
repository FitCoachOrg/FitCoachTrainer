-- Step 1: Schema Updates (if needed)
-- Run this in your Supabase SQL Editor to add missing indexes and constraints

-- Add performance indexes (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_client_engagement_score_client_date 
ON client_engagement_score(client_id, for_date);

CREATE INDEX IF NOT EXISTS idx_client_engagement_score_date 
ON client_engagement_score(for_date);

-- Add unique constraint to prevent duplicate entries per client per date
-- This is important for the automation script
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_engagement_score_unique 
ON client_engagement_score(client_id, for_date);

-- Add comments for documentation
COMMENT ON TABLE client_engagement_score IS 'Daily engagement scores for clients based on task completion';
COMMENT ON COLUMN client_engagement_score.eng_score IS 'Engagement score as percentage (0-100) or NULL if no tasks';
COMMENT ON COLUMN client_engagement_score.total_due IS 'Total number of tasks due on this date';
COMMENT ON COLUMN client_engagement_score.completed IS 'Number of completed tasks on this date';

-- Verify the updates
SELECT 
  'Indexes' as type,
  indexname as name
FROM pg_indexes 
WHERE tablename = 'client_engagement_score'
UNION ALL
SELECT 
  'Constraints' as type,
  conname as name
FROM pg_constraint 
WHERE conrelid = 'public.client_engagement_score'::regclass; 