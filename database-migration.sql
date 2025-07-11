-- Database Migration for Google OAuth Support
-- Run this script in your Supabase SQL editor

-- Add Google OAuth fields to trainer table
ALTER TABLE trainer 
ADD COLUMN IF NOT EXISTS google_id VARCHAR,
ADD COLUMN IF NOT EXISTS full_name VARCHAR,
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_trainer_google_id ON trainer(google_id);
CREATE INDEX IF NOT EXISTS idx_trainer_email ON trainer(trainer_email);

-- Add comments for documentation
COMMENT ON COLUMN trainer.google_id IS 'Google OAuth user ID';
COMMENT ON COLUMN trainer.full_name IS 'User full name from Google OAuth';
COMMENT ON COLUMN trainer.avatar_url IS 'User avatar URL from Google OAuth';

-- Update existing records if needed (optional)
-- UPDATE trainer 
-- SET full_name = trainer_name 
-- WHERE full_name IS NULL AND trainer_name IS NOT NULL;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'trainer' 
AND column_name IN ('google_id', 'full_name', 'avatar_url')
ORDER BY column_name;

-- Migration for Client-Specific Trainer Notes
-- Add ai_summary column to trainer_client_web table for storing AI analysis

ALTER TABLE trainer_client_web 
ADD COLUMN IF NOT EXISTS ai_summary JSONB;

-- Create index for ai_summary column for better query performance
CREATE INDEX IF NOT EXISTS idx_trainer_client_web_ai_summary ON trainer_client_web USING GIN (ai_summary);

-- Add comment for documentation
COMMENT ON COLUMN trainer_client_web.ai_summary IS 'AI analysis and insights for client-specific trainer notes';

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'trainer_client_web' 
AND column_name IN ('trainer_notes', 'ai_summary')
ORDER BY column_name; 