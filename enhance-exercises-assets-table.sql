-- Enhance exercises_assets table for comprehensive YouTube video metadata
-- This follows the "Best Exercise Short Picker" specification

-- First, let's check the current structure and enhance it
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

-- Add indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_exercises_assets_exercise_name ON exercises_assets(exercise_name);
CREATE INDEX IF NOT EXISTS idx_exercises_assets_normalized_name ON exercises_assets(normalized_exercise_name);
CREATE INDEX IF NOT EXISTS idx_exercises_assets_video_id ON exercises_assets(video_id);
CREATE INDEX IF NOT EXISTS idx_exercises_assets_score ON exercises_assets(score DESC);
CREATE INDEX IF NOT EXISTS idx_exercises_assets_last_updated ON exercises_assets(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_exercises_assets_cache_stale ON exercises_assets(cache_stale) WHERE cache_stale = true;

-- Add constraints for data integrity
ALTER TABLE exercises_assets 
ADD CONSTRAINT IF NOT EXISTS check_duration_sec CHECK (duration_sec >= 15 AND duration_sec <= 60),
ADD CONSTRAINT IF NOT EXISTS check_score CHECK (score >= 0 AND score <= 1),
ADD CONSTRAINT IF NOT EXISTS check_view_count CHECK (view_count >= 0),
ADD CONSTRAINT IF NOT EXISTS check_like_count CHECK (like_count >= 0),
ADD CONSTRAINT IF NOT EXISTS check_comment_count CHECK (comment_count >= 0);

-- Create a function to normalize exercise names (matches the strategy specification)
CREATE OR REPLACE FUNCTION normalize_exercise_name(exercise_name TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Convert to lowercase, trim, collapse spaces, strip punctuation except spaces and hyphens
    RETURN lower(trim(regexp_replace(regexp_replace(exercise_name, '[^a-zA-Z0-9\s\-]', '', 'g'), '\s+', ' ', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a function to update the last_updated timestamp
CREATE OR REPLACE FUNCTION update_exercises_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_updated
DROP TRIGGER IF EXISTS trigger_update_exercises_assets_updated_at ON exercises_assets;
CREATE TRIGGER trigger_update_exercises_assets_updated_at
    BEFORE UPDATE ON exercises_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_exercises_assets_updated_at();

-- Create a function to mark videos as stale after 30 days
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

-- Create a view for easy access to high-quality videos
CREATE OR REPLACE VIEW high_quality_exercise_videos AS
SELECT 
    exercise_name,
    normalized_exercise_name,
    video_id,
    embed_url,
    title,
    channel_title,
    duration_sec,
    view_count,
    score,
    reason,
    is_curated_channel,
    last_updated,
    cache_stale
FROM exercises_assets 
WHERE video_id IS NOT NULL 
AND score >= 0.5  -- Only videos with decent scores
AND cache_stale = false
ORDER BY score DESC, view_count DESC;

-- Add comments for documentation
COMMENT ON TABLE exercises_assets IS 'Stores YouTube video assets for exercises with comprehensive metadata and scoring';
COMMENT ON COLUMN exercises_assets.video_id IS 'YouTube video ID (11 characters)';
COMMENT ON COLUMN exercises_assets.embed_url IS 'YouTube embed URL for the video';
COMMENT ON COLUMN exercises_assets.score IS 'Quality score (0-1) based on channel trust, title intent, recency, engagement, and view velocity';
COMMENT ON COLUMN exercises_assets.reason IS 'Explanation of why this video was selected';
COMMENT ON COLUMN exercises_assets.cache_stale IS 'Indicates if video should be refreshed (older than 30 days)';
COMMENT ON COLUMN exercises_assets.normalized_exercise_name IS 'Normalized exercise name for consistent lookups';
