-- Fix Client Access Issues
-- This script addresses the main issues preventing client access

-- 1. Create trainer-client relationships for existing clients
-- First, let's see what clients exist and create relationships for them

-- Get all existing clients
DO $$
DECLARE
    client_record RECORD;
    trainer_record RECORD;
    client_count INTEGER := 0;
BEGIN
    -- Get the first trainer (you can modify this to assign specific clients to specific trainers)
    SELECT id INTO trainer_record FROM trainer LIMIT 1;
    
    IF trainer_record.id IS NOT NULL THEN
        -- Create relationships for all existing clients
        FOR client_record IN SELECT client_id, cl_name FROM client
        LOOP
            -- Check if relationship already exists
            IF NOT EXISTS (
                SELECT 1 FROM trainer_client_web 
                WHERE trainer_id = trainer_record.id 
                AND client_id = client_record.client_id
            ) THEN
                INSERT INTO trainer_client_web (trainer_id, client_id, status, created_at)
                VALUES (trainer_record.id, client_record.client_id, 'active', NOW());
                client_count := client_count + 1;
                RAISE NOTICE 'Created relationship: Trainer % -> Client % (%)', 
                    trainer_record.id, client_record.client_id, client_record.cl_name;
            END IF;
        END LOOP;
        
        RAISE NOTICE 'Created % client relationships for trainer %', client_count, trainer_record.id;
    ELSE
        RAISE NOTICE 'No trainers found in the system';
    END IF;
END $$;

-- 2. Add missing columns to activity_info table if they don't exist
DO $$
BEGIN
    -- Add last_weight_time column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_info' AND column_name = 'last_weight_time'
    ) THEN
        ALTER TABLE activity_info ADD COLUMN last_weight_time TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_weight_time column to activity_info';
    END IF;
    
    -- Add last_excercise_input column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_info' AND column_name = 'last_excercise_input'
    ) THEN
        ALTER TABLE activity_info ADD COLUMN last_excercise_input TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_excercise_input column to activity_info';
    END IF;
    
    -- Add last_sleep_info column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_info' AND column_name = 'last_sleep_info'
    ) THEN
        ALTER TABLE activity_info ADD COLUMN last_sleep_info TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_sleep_info column to activity_info';
    END IF;
END $$;

-- 3. Update activity_info with sample data for the new columns
-- This will populate the new columns with data from existing records
UPDATE activity_info 
SET 
    last_weight_time = CASE 
        WHEN activity = 'weight' THEN created_at 
        ELSE NULL 
    END,
    last_excercise_input = CASE 
        WHEN activity IN ('exercise', 'workout', 'cardio') THEN created_at 
        ELSE NULL 
    END,
    last_sleep_info = CASE 
        WHEN activity = 'sleep' THEN created_at 
        ELSE NULL 
    END
WHERE created_at IS NOT NULL;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity_info_client_id ON activity_info(client_id);
CREATE INDEX IF NOT EXISTS idx_activity_info_activity ON activity_info(activity);
CREATE INDEX IF NOT EXISTS idx_activity_info_created_at ON activity_info(created_at);
CREATE INDEX IF NOT EXISTS idx_trainer_client_web_trainer_id ON trainer_client_web(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_client_web_client_id ON trainer_client_web(client_id);

-- 5. Verify the fixes
SELECT 
    'trainer_client_web' as table_name,
    COUNT(*) as record_count
FROM trainer_client_web
UNION ALL
SELECT 
    'client' as table_name,
    COUNT(*) as record_count
FROM client
UNION ALL
SELECT 
    'activity_info' as table_name,
    COUNT(*) as record_count
FROM activity_info;

-- 6. Show sample relationships
SELECT 
    t.trainer_name,
    c.cl_name,
    tcw.status,
    tcw.created_at
FROM trainer_client_web tcw
JOIN trainer t ON tcw.trainer_id = t.id
JOIN client c ON tcw.client_id = c.client_id
LIMIT 10; 