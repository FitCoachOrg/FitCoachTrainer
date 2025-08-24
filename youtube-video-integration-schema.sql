-- YouTube Video Integration Database Schema
-- Run this file in your Supabase SQL Editor

-- =====================================================
-- 1. ENHANCE EXERCISES_ASSETS TABLE
-- =====================================================

-- Add all required columns for YouTube video metadata
ALTER TABLE IF EXISTS exercises_assets 
ADD COLUMN IF NOT EXISTS video_id VARCHAR(20),
ADD COLUMN IF NOT EXISTS embed_url TEXT,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS channel_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS channel_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS duration_sec INTEGER,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS view_count BIGINT,
ADD COLUMN IF NOT EXISTS like_count INTEGER,
ADD COLUMN IF NOT EXISTS comment_count INTEGER,
ADD COLUMN IF NOT EXISTS view_velocity_30d DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS score DECIMAL(3,3),
ADD COLUMN IF NOT EXISTS reason TEXT,
ADD COLUMN IF NOT EXISTS is_curated_channel BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS cache_stale BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS search_query TEXT,
ADD COLUMN IF NOT EXISTS normalized_exercise_name VARCHAR(255);

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for exercise name lookups
CREATE INDEX IF NOT EXISTS idx_exercises_assets_exercise_name 
ON exercises_assets(exercise_name);

-- Index for normalized exercise name lookups
CREATE INDEX IF NOT EXISTS idx_exercises_assets_normalized_name 
ON exercises_assets(normalized_exercise_name);

-- Index for video caching
CREATE INDEX IF NOT EXISTS idx_exercises_assets_cache_stale 
ON exercises_assets(cache_stale) WHERE cache_stale = false;

-- Index for score-based queries
CREATE INDEX IF NOT EXISTS idx_exercises_assets_score 
ON exercises_assets(score DESC);

-- Index for channel-based queries
CREATE INDEX IF NOT EXISTS idx_exercises_assets_channel 
ON exercises_assets(channel_id);

-- =====================================================
-- 3. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to normalize exercise names
CREATE OR REPLACE FUNCTION normalize_exercise_name(exercise_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(trim(regexp_replace(regexp_replace(exercise_name, '[^a-zA-Z0-9\s\-]', '', 'g'), '\s+', ' ', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update normalized exercise names
CREATE OR REPLACE FUNCTION update_normalized_exercise_names()
RETURNS void AS $$
BEGIN
  UPDATE exercises_assets 
  SET normalized_exercise_name = normalize_exercise_name(exercise_name)
  WHERE normalized_exercise_name IS NULL OR normalized_exercise_name != normalize_exercise_name(exercise_name);
END;
$$ LANGUAGE plpgsql;

-- Function to mark stale videos (older than 30 days)
CREATE OR REPLACE FUNCTION mark_stale_videos()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE exercises_assets 
  SET cache_stale = true
  WHERE last_updated < NOW() - INTERVAL '30 days'
    AND cache_stale = false;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. CREATE TRIGGERS
-- =====================================================

-- Trigger to automatically update normalized exercise name
CREATE OR REPLACE FUNCTION trigger_update_normalized_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.normalized_exercise_name = normalize_exercise_name(NEW.exercise_name);
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_normalized_exercise_name_trigger ON exercises_assets;
CREATE TRIGGER update_normalized_exercise_name_trigger
  BEFORE INSERT OR UPDATE ON exercises_assets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_normalized_name();

-- =====================================================
-- 5. CREATE VIEWS FOR EASY QUERYING
-- =====================================================

-- View for active (non-stale) videos
CREATE OR REPLACE VIEW active_exercise_videos AS
SELECT 
  id,
  exercise_name,
  normalized_exercise_name,
  video_id,
  embed_url,
  title,
  channel_id,
  channel_title,
  duration_sec,
  published_at,
  view_count,
  like_count,
  comment_count,
  view_velocity_30d,
  score,
  reason,
  is_curated_channel,
  last_updated
FROM exercises_assets
WHERE cache_stale = false 
  AND video_id IS NOT NULL
  AND embed_url IS NOT NULL;

-- View for high-quality videos (score > 0.7)
CREATE OR REPLACE VIEW high_quality_exercise_videos AS
SELECT *
FROM active_exercise_videos
WHERE score > 0.7
ORDER BY score DESC;

-- View for curated channel videos
CREATE OR REPLACE VIEW curated_exercise_videos AS
SELECT *
FROM active_exercise_videos
WHERE is_curated_channel = true
ORDER BY score DESC;

-- =====================================================
-- 6. CREATE CONSTRAINTS
-- =====================================================

-- Add constraints for data integrity (drop first if they exist)
ALTER TABLE exercises_assets 
DROP CONSTRAINT IF EXISTS check_duration_positive,
DROP CONSTRAINT IF EXISTS check_score_range,
DROP CONSTRAINT IF EXISTS check_view_count_positive;

ALTER TABLE exercises_assets 
ADD CONSTRAINT check_duration_positive 
CHECK (duration_sec IS NULL OR duration_sec > 0),
ADD CONSTRAINT check_score_range 
CHECK (score IS NULL OR (score >= 0 AND score <= 1)),
ADD CONSTRAINT check_view_count_positive 
CHECK (view_count IS NULL OR view_count >= 0);

-- =====================================================
-- 7. INITIALIZE EXISTING DATA
-- =====================================================

-- Update existing records with normalized names
SELECT update_normalized_exercise_names();

-- Convert existing video_link entries to new format
UPDATE exercises_assets 
SET 
  video_id = CASE 
    WHEN video_link LIKE '%youtube.com/watch?v=%' THEN 
      substring(video_link from 'v=([^&]+)')
    WHEN video_link LIKE '%youtu.be/%' THEN 
      substring(video_link from 'youtu\.be/([^?]+)')
    ELSE NULL
  END,
  embed_url = CASE 
    WHEN video_link LIKE '%youtube.com/watch?v=%' THEN 
      replace(video_link, 'watch?v=', 'embed/')
    WHEN video_link LIKE '%youtu.be/%' THEN 
      replace(video_link, 'youtu.be/', 'youtube.com/embed/')
    ELSE NULL
  END,
  title = 'Legacy Exercise Video',
  channel_title = 'Fitness Channel',
  duration_sec = 30,
  score = 0.6,
  reason = 'Migrated from legacy video_link',
  cache_stale = false,
  last_updated = NOW()
WHERE video_link IS NOT NULL 
  AND video_id IS NULL;

-- =====================================================
-- 8. CREATE STATISTICS FUNCTIONS
-- =====================================================

-- Function to get video statistics
CREATE OR REPLACE FUNCTION get_video_statistics()
RETURNS TABLE(
  total_videos INTEGER,
  cached_videos INTEGER,
  stale_videos INTEGER,
  avg_score DECIMAL(3,3),
  curated_videos INTEGER,
  recent_videos INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_videos,
    COUNT(*) FILTER (WHERE cache_stale = false)::INTEGER as cached_videos,
    COUNT(*) FILTER (WHERE cache_stale = true)::INTEGER as stale_videos,
    AVG(score)::DECIMAL(3,3) as avg_score,
    COUNT(*) FILTER (WHERE is_curated_channel = true)::INTEGER as curated_videos,
    COUNT(*) FILTER (WHERE last_updated > NOW() - INTERVAL '7 days')::INTEGER as recent_videos
  FROM exercises_assets
  WHERE video_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. GRANT PERMISSIONS (if needed)
-- =====================================================

-- Grant permissions to authenticated users for reading
GRANT SELECT ON exercises_assets TO authenticated;
GRANT SELECT ON active_exercise_videos TO authenticated;
GRANT SELECT ON high_quality_exercise_videos TO authenticated;
GRANT SELECT ON curated_exercise_videos TO authenticated;

-- Grant permissions for inserting/updating (for the app)
GRANT INSERT, UPDATE ON exercises_assets TO authenticated;

-- =====================================================
-- 10. VERIFICATION QUERIES
-- =====================================================

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'exercises_assets'
ORDER BY ordinal_position;

-- Check if indexes were created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'exercises_assets';

-- Check if functions were created
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%exercise%' OR routine_name LIKE '%video%';

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- This will show a completion message
DO $$
BEGIN
  RAISE NOTICE 'YouTube Video Integration Schema Setup Complete!';
  RAISE NOTICE 'The exercises_assets table has been enhanced with all required columns.';
  RAISE NOTICE 'Indexes, functions, triggers, and views have been created.';
  RAISE NOTICE 'Your application should now be able to cache and retrieve YouTube videos.';
END $$;
