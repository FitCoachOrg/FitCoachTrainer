-- Step 1: Create the client_engagement_score table
-- Run this in your Supabase SQL Editor

-- Create the table for storing daily engagement scores
CREATE TABLE IF NOT EXISTS client_engagement_score (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES client(client_id),
  for_date DATE NOT NULL,
  eng_score INTEGER, -- Percentage (0-100) or NULL if no tasks
  total_due INTEGER NOT NULL DEFAULT 0, -- Total number of tasks due
  completed INTEGER NOT NULL DEFAULT 0, -- Number of completed tasks
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_engagement_score_client_date 
ON client_engagement_score(client_id, for_date);

CREATE INDEX IF NOT EXISTS idx_client_engagement_score_date 
ON client_engagement_score(for_date);

-- Create unique constraint to prevent duplicate entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_engagement_score_unique 
ON client_engagement_score(client_id, for_date);

-- Add comments for documentation
COMMENT ON TABLE client_engagement_score IS 'Daily engagement scores for clients based on task completion';
COMMENT ON COLUMN client_engagement_score.eng_score IS 'Engagement score as percentage (0-100) or NULL if no tasks';
COMMENT ON COLUMN client_engagement_score.total_due IS 'Total number of tasks due on this date';
COMMENT ON COLUMN client_engagement_score.completed IS 'Number of completed tasks on this date';

-- Verify the table was created
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'client_engagement_score' 
ORDER BY ordinal_position; 