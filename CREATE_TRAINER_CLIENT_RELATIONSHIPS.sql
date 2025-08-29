-- Create Trainer-Client Relationships for All Existing Data
-- This script creates relationships between all existing trainers and clients

-- Step 1: Create relationships for all trainers and clients
DO $$
DECLARE
    trainer_record RECORD;
    client_record RECORD;
    relationship_count INTEGER := 0;
    total_relationships INTEGER := 0;
BEGIN
    -- Loop through all trainers
    FOR trainer_record IN SELECT id, trainer_name, trainer_email FROM trainer
    LOOP
        RAISE NOTICE 'Processing trainer: % (%)', trainer_record.trainer_name, trainer_record.id;
        relationship_count := 0;
        
        -- Create relationships for all clients for this trainer
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
                relationship_count := relationship_count + 1;
                total_relationships := total_relationships + 1;
                RAISE NOTICE '  Created: Trainer % -> Client % (%)', 
                    trainer_record.trainer_name, client_record.client_id, client_record.cl_name;
            ELSE
                RAISE NOTICE '  Exists: Trainer % -> Client % (%)', 
                    trainer_record.trainer_name, client_record.client_id, client_record.cl_name;
            END IF;
        END LOOP;
        
        RAISE NOTICE '  Created % relationships for trainer %', relationship_count, trainer_record.trainer_name;
    END LOOP;
    
    RAISE NOTICE 'Total relationships created: %', total_relationships;
END $$;

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trainer_client_web_trainer_id ON trainer_client_web(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_client_web_client_id ON trainer_client_web(client_id);
CREATE INDEX IF NOT EXISTS idx_trainer_client_web_status ON trainer_client_web(status);

-- Step 3: Verify the relationships were created
SELECT 
    'Verification Results' as info,
    COUNT(*) as total_relationships,
    COUNT(DISTINCT trainer_id) as unique_trainers,
    COUNT(DISTINCT client_id) as unique_clients
FROM trainer_client_web;

-- Step 4: Show sample relationships for each trainer
SELECT 
    t.trainer_name,
    COUNT(tcw.client_id) as client_count,
    STRING_AGG(c.cl_name, ', ' ORDER BY c.cl_name) as clients
FROM trainer_client_web tcw
JOIN trainer t ON tcw.trainer_id = t.id
JOIN client c ON tcw.client_id = c.client_id
GROUP BY t.id, t.trainer_name
ORDER BY t.trainer_name;

-- Step 5: Show detailed relationships
SELECT 
    t.trainer_name,
    c.cl_name,
    tcw.status,
    tcw.created_at
FROM trainer_client_web tcw
JOIN trainer t ON tcw.trainer_id = t.id
JOIN client c ON tcw.client_id = c.client_id
ORDER BY t.trainer_name, c.cl_name
LIMIT 20; 