-- FitCoach Client Database Migration for Trainer-Side Onboarding
-- This script adds all required columns for the onboarding system

-- Add timezone columns for proper timezone handling
ALTER TABLE client ADD COLUMN IF NOT EXISTS timezone_name TEXT;
ALTER TABLE client ADD COLUMN IF NOT EXISTS timezone_offset INTEGER;

-- Add personal information columns
ALTER TABLE client ADD COLUMN IF NOT EXISTS cl_age INTEGER;
ALTER TABLE client ADD COLUMN IF NOT EXISTS cl_height NUMERIC;
ALTER TABLE client ADD COLUMN IF NOT EXISTS cl_weight NUMERIC;
ALTER TABLE client ADD COLUMN IF NOT EXISTS cl_sex TEXT;
ALTER TABLE client ADD COLUMN IF NOT EXISTS cl_activity_level TEXT;

-- Add body measurement columns
ALTER TABLE client ADD COLUMN IF NOT EXISTS hip NUMERIC;
ALTER TABLE client ADD COLUMN IF NOT EXISTS waist NUMERIC;
ALTER TABLE client ADD COLUMN IF NOT EXISTS thigh NUMERIC;
ALTER TABLE client ADD COLUMN IF NOT EXISTS bicep NUMERIC;

-- Add fitness goals columns
ALTER TABLE client ADD COLUMN IF NOT EXISTS cl_primary_goal TEXT;
ALTER TABLE client ADD COLUMN IF NOT EXISTS specific_outcome TEXT;
ALTER TABLE client ADD COLUMN IF NOT EXISTS goal_timeline TEXT;
ALTER TABLE client ADD COLUMN IF NOT EXISTS obstacles TEXT;
ALTER TABLE client ADD COLUMN IF NOT EXISTS confidence_level INTEGER;

-- Add training preferences columns
ALTER TABLE client ADD COLUMN IF NOT EXISTS training_experience TEXT;
ALTER TABLE client ADD COLUMN IF NOT EXISTS previous_training TEXT;
ALTER TABLE client ADD COLUMN IF NOT EXISTS training_days_per_week INTEGER;
ALTER TABLE client ADD COLUMN IF NOT EXISTS training_time_per_session TEXT;
ALTER TABLE client ADD COLUMN IF NOT EXISTS training_location TEXT;
ALTER TABLE client ADD COLUMN IF NOT EXISTS available_equipment TEXT[];
ALTER TABLE client ADD COLUMN IF NOT EXISTS injuries_limitations TEXT;
ALTER TABLE client ADD COLUMN IF NOT EXISTS focus_areas TEXT[];

-- Add nutrition columns
ALTER TABLE client ADD COLUMN IF NOT EXISTS eating_habits TEXT;
ALTER TABLE client ADD COLUMN IF NOT EXISTS diet_preferences TEXT[];
ALTER TABLE client ADD COLUMN IF NOT EXISTS food_allergies TEXT;
ALTER TABLE client ADD COLUMN IF NOT EXISTS preferred_meals_per_day INTEGER;

-- Add general health columns
ALTER TABLE client ADD COLUMN IF NOT EXISTS cl_gastric_issues TEXT;
ALTER TABLE client ADD COLUMN IF NOT EXISTS cl_supplements TEXT;
ALTER TABLE client ADD COLUMN IF NOT EXISTS cl_alcohol TEXT;
ALTER TABLE client ADD COLUMN IF NOT EXISTS sleep_hours INTEGER;
ALTER TABLE client ADD COLUMN IF NOT EXISTS cl_stress TEXT;

-- Add time preference columns (these will store UTC times)
ALTER TABLE client ADD COLUMN IF NOT EXISTS wake_time TEXT;
ALTER TABLE client ADD COLUMN IF NOT EXISTS bed_time TEXT;
ALTER TABLE client ADD COLUMN IF NOT EXISTS bf_time TEXT;
ALTER TABLE client ADD COLUMN IF NOT EXISTS lunch_time TEXT;
ALTER TABLE client ADD COLUMN IF NOT EXISTS dinner_time TEXT;
ALTER TABLE client ADD COLUMN IF NOT EXISTS snack_time TEXT;
ALTER TABLE client ADD COLUMN IF NOT EXISTS workout_time TEXT;
ALTER TABLE client ADD COLUMN IF NOT EXISTS workout_days TEXT[];

-- Add motivation and goals columns
ALTER TABLE client ADD COLUMN IF NOT EXISTS motivation_style TEXT;

-- Add onboarding tracking columns
ALTER TABLE client ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE client ADD COLUMN IF NOT EXISTS onboarding_progress JSONB;

-- Add comments to document the timezone columns
COMMENT ON COLUMN client.timezone_name IS 'User''s timezone name (e.g., America/New_York)';
COMMENT ON COLUMN client.timezone_offset IS 'User''s timezone offset in minutes from UTC (positive for timezones west of UTC)';
COMMENT ON COLUMN client.wake_time IS 'Wake up time stored in UTC format (HH:MM:SS)';
COMMENT ON COLUMN client.bed_time IS 'Bed time stored in UTC format (HH:MM:SS)';
COMMENT ON COLUMN client.bf_time IS 'Breakfast time stored in UTC format (HH:MM:SS)';
COMMENT ON COLUMN client.lunch_time IS 'Lunch time stored in UTC format (HH:MM:SS)';
COMMENT ON COLUMN client.dinner_time IS 'Dinner time stored in UTC format (HH:MM:SS)';
COMMENT ON COLUMN client.snack_time IS 'Snack time stored in UTC format (HH:MM:SS)';
COMMENT ON COLUMN client.workout_time IS 'Preferred workout time stored in UTC format (HH:MM:SS)';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_onboarding_completed ON client(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_client_timezone ON client(timezone_name);

-- Create client_target table if it doesn't exist
CREATE TABLE IF NOT EXISTS client_target (
  id SERIAL PRIMARY KEY,
  client_id TEXT NOT NULL,
  goal TEXT NOT NULL,
  target NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for client_target table
CREATE INDEX IF NOT EXISTS idx_client_target_client_id ON client_target(client_id);
CREATE INDEX IF NOT EXISTS idx_client_target_goal ON client_target(goal);
CREATE INDEX IF NOT EXISTS idx_client_target_client_goal ON client_target(client_id, goal);

-- Add unique constraint to prevent duplicate goals for the same client
ALTER TABLE client_target ADD CONSTRAINT IF NOT EXISTS unique_client_goal UNIQUE (client_id, goal);

-- Enable RLS on client_target table
ALTER TABLE client_target ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage their own targets
CREATE POLICY "Users can manage their own targets" ON client_target
  FOR ALL USING (client_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Allow service role to manage all targets (for backend operations)
CREATE POLICY "Service role can manage all targets" ON client_target
  FOR ALL USING (auth.role() = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_client_target_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_client_target_updated_at
  BEFORE UPDATE ON client_target
  FOR EACH ROW
  EXECUTE FUNCTION update_client_target_updated_at();

-- Verify the migration
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'client' 
  AND column_name IN (
    'timezone_name', 
    'timezone_offset', 
    'wake_time', 
    'bf_time', 
    'lunch_time', 
    'dinner_time', 
    'snack_time', 
    'workout_time',
    'onboarding_completed',
    'onboarding_progress'
  )
ORDER BY column_name;
