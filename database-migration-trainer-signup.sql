-- Database Migration for Enhanced Trainer Signup
-- Run this script in your Supabase SQL editor

-- Add new fields to trainer table for comprehensive signup
ALTER TABLE trainer 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS business_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS website VARCHAR(255),
ADD COLUMN IF NOT EXISTS experience_years INTEGER,
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS certifications JSONB,
ADD COLUMN IF NOT EXISTS certification_files TEXT[],
ADD COLUMN IF NOT EXISTS specialties TEXT[],
ADD COLUMN IF NOT EXISTS client_populations TEXT[],
ADD COLUMN IF NOT EXISTS service_offerings TEXT[],
ADD COLUMN IF NOT EXISTS session_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS package_rates_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS online_training_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS availability_days INTEGER[],
ADD COLUMN IF NOT EXISTS preferred_hours VARCHAR(50),
ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS privacy_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trainer_email ON trainer(trainer_email);
CREATE INDEX IF NOT EXISTS idx_trainer_active ON trainer(is_active);
CREATE INDEX IF NOT EXISTS idx_trainer_specialties ON trainer USING GIN(specialties);

-- Add comments for documentation
COMMENT ON COLUMN trainer.phone IS 'Trainer phone number';
COMMENT ON COLUMN trainer.date_of_birth IS 'Trainer date of birth';
COMMENT ON COLUMN trainer.business_name IS 'Trainer business name (optional)';
COMMENT ON COLUMN trainer.website IS 'Trainer website URL (optional)';
COMMENT ON COLUMN trainer.experience_years IS 'Years of training experience';
COMMENT ON COLUMN trainer.profile_picture_url IS 'URL to trainer profile picture';
COMMENT ON COLUMN trainer.certifications IS 'JSON array of certifications';
COMMENT ON COLUMN trainer.certification_files IS 'Array of certification file URLs';
COMMENT ON COLUMN trainer.specialties IS 'Array of training specialties';
COMMENT ON COLUMN trainer.client_populations IS 'Array of client population preferences';
COMMENT ON COLUMN trainer.service_offerings IS 'Array of service offerings';
COMMENT ON COLUMN trainer.session_rate IS 'Hourly session rate';
COMMENT ON COLUMN trainer.package_rates_available IS 'Whether trainer offers package rates';
COMMENT ON COLUMN trainer.online_training_rate IS 'Online training session rate';
COMMENT ON COLUMN trainer.availability_days IS 'Array of available days (1-7, Monday-Sunday)';
COMMENT ON COLUMN trainer.preferred_hours IS 'Preferred working hours';
COMMENT ON COLUMN trainer.profile_completion_percentage IS 'Profile completion percentage (0-100)';
COMMENT ON COLUMN trainer.is_active IS 'Whether trainer account is active';
COMMENT ON COLUMN trainer.terms_accepted IS 'Whether trainer accepted terms of service';
COMMENT ON COLUMN trainer.privacy_accepted IS 'Whether trainer accepted privacy policy';

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'trainer' 
AND column_name IN (
  'phone', 'date_of_birth', 'business_name', 'website', 'experience_years', 'profile_picture_url',
  'certifications', 'certification_files', 'specialties', 'client_populations',
  'service_offerings', 'session_rate', 'package_rates_available', 'online_training_rate',
  'availability_days', 'preferred_hours', 'profile_completion_percentage',
  'is_active', 'terms_accepted', 'privacy_accepted', 'updated_at'
)
ORDER BY column_name; 