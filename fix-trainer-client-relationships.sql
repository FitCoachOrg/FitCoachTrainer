-- Fix Trainer-Client Relationships and RLS Policies
-- This script will create the missing relationships and ensure proper RLS access

-- Step 1: Enable RLS on trainer_client_web table
ALTER TABLE trainer_client_web ENABLE ROW LEVEL SECURITY;

-- Step 2: Create RLS policies for trainer_client_web table
DROP POLICY IF EXISTS "Trainers can view their client relationships" ON trainer_client_web;
CREATE POLICY "Trainers can view their client relationships" ON trainer_client_web
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer t
            WHERE t.id = trainer_client_web.trainer_id
            AND t.trainer_email = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Trainers can insert their client relationships" ON trainer_client_web;
CREATE POLICY "Trainers can insert their client relationships" ON trainer_client_web
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer t
            WHERE t.id = trainer_client_web.trainer_id
            AND t.trainer_email = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Trainers can update their client relationships" ON trainer_client_web;
CREATE POLICY "Trainers can update their client relationships" ON trainer_client_web
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer t
            WHERE t.id = trainer_client_web.trainer_id
            AND t.trainer_email = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Trainers can delete their client relationships" ON trainer_client_web;
CREATE POLICY "Trainers can delete their client relationships" ON trainer_client_web
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer t
            WHERE t.id = trainer_client_web.trainer_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Step 3: Create trainer-client relationships for existing clients
DO $$
DECLARE
    client_record RECORD;
    trainer_record RECORD;
    client_count INTEGER := 0;
    relationship_count INTEGER := 0;
BEGIN
    -- Get the first trainer
    SELECT id, trainer_name INTO trainer_record FROM trainer LIMIT 1;
    
    IF trainer_record.id IS NOT NULL THEN
        RAISE NOTICE 'Creating client relationships for trainer: % (%)', trainer_record.trainer_name, trainer_record.id;
        
        -- Count existing relationships
        SELECT COUNT(*) INTO relationship_count FROM trainer_client_web WHERE trainer_id = trainer_record.id;
        RAISE NOTICE 'Existing relationships for trainer %: %', trainer_record.trainer_name, relationship_count;
        
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
                    trainer_record.trainer_name, client_record.client_id, client_record.cl_name;
            ELSE
                RAISE NOTICE 'Relationship already exists: Trainer % -> Client % (%)', 
                    trainer_record.trainer_name, client_record.client_id, client_record.cl_name;
            END IF;
        END LOOP;
        
        RAISE NOTICE 'Created % new client relationships for trainer %', client_count, trainer_record.trainer_name;
    ELSE
        RAISE NOTICE 'No trainers found in the system';
    END IF;
END $$;

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trainer_client_web_trainer_id ON trainer_client_web(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_client_web_client_id ON trainer_client_web(client_id);
CREATE INDEX IF NOT EXISTS idx_trainer_client_web_status ON trainer_client_web(status);

-- Step 5: Verify the relationships were created
SELECT 
    'Verification Results' as info,
    COUNT(*) as total_relationships,
    COUNT(DISTINCT trainer_id) as unique_trainers,
    COUNT(DISTINCT client_id) as unique_clients
FROM trainer_client_web;

-- Step 6: Show sample relationships
SELECT 
    t.trainer_name,
    c.cl_name,
    tcw.status,
    tcw.created_at
FROM trainer_client_web tcw
JOIN trainer t ON tcw.trainer_id = t.id
JOIN client c ON tcw.client_id = c.client_id
ORDER BY tcw.created_at DESC
LIMIT 10; 