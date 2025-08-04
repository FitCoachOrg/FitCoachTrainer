-- Simple Fix for Client Access Issues
-- This script only creates trainer-client relationships without modifying table structure

-- 1. Create trainer-client relationships for existing clients
-- Assign all existing clients to the first trainer in the system

DO $$
DECLARE
    client_record RECORD;
    trainer_record RECORD;
    client_count INTEGER := 0;
BEGIN
    -- Get the first trainer (you can modify this to assign specific clients to specific trainers)
    SELECT id, trainer_name INTO trainer_record FROM trainer LIMIT 1;
    
    IF trainer_record.id IS NOT NULL THEN
        RAISE NOTICE 'Creating client relationships for trainer: % (%)', trainer_record.trainer_name, trainer_record.id;
        
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

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trainer_client_web_trainer_id ON trainer_client_web(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_client_web_client_id ON trainer_client_web(client_id);
CREATE INDEX IF NOT EXISTS idx_trainer_client_web_status ON trainer_client_web(status);

-- 3. Verify the relationships were created
SELECT 
    'trainer_client_web' as table_name,
    COUNT(*) as record_count
FROM trainer_client_web
UNION ALL
SELECT 
    'client' as table_name,
    COUNT(*) as record_count
FROM client;

-- 4. Show the created relationships
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