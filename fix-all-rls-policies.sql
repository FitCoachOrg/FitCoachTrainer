-- Comprehensive RLS Policy Fix for All Client-Related Tables
-- This script ensures trainers can access their clients' data through proper RLS policies

-- Step 1: Enable RLS on all client-related tables
ALTER TABLE client ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_engagement_score ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_client_web ENABLE ROW LEVEL SECURITY;

-- Step 2: Create RLS policies for client table
DROP POLICY IF EXISTS "Trainers can view their clients" ON client;
CREATE POLICY "Trainers can view their clients" ON client
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = client.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Trainers can insert their clients" ON client;
CREATE POLICY "Trainers can insert their clients" ON client
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer t
            WHERE t.trainer_email = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Trainers can update their clients" ON client;
CREATE POLICY "Trainers can update their clients" ON client
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = client.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Trainers can delete their clients" ON client;
CREATE POLICY "Trainers can delete their clients" ON client
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = client.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Step 3: Create RLS policies for activity_info table
DROP POLICY IF EXISTS "Trainers can view their clients activity" ON activity_info;
CREATE POLICY "Trainers can view their clients activity" ON activity_info
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = activity_info.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Trainers can insert their clients activity" ON activity_info;
CREATE POLICY "Trainers can insert their clients activity" ON activity_info
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = activity_info.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Trainers can update their clients activity" ON activity_info;
CREATE POLICY "Trainers can update their clients activity" ON activity_info
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = activity_info.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Trainers can delete their clients activity" ON activity_info;
CREATE POLICY "Trainers can delete their clients activity" ON activity_info
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = activity_info.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Step 4: Create RLS policies for meal_info table
DROP POLICY IF EXISTS "Trainers can view their clients meals" ON meal_info;
CREATE POLICY "Trainers can view their clients meals" ON meal_info
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = meal_info.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Trainers can insert their clients meals" ON meal_info;
CREATE POLICY "Trainers can insert their clients meals" ON meal_info
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = meal_info.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Trainers can update their clients meals" ON meal_info;
CREATE POLICY "Trainers can update their clients meals" ON meal_info
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = meal_info.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Trainers can delete their clients meals" ON meal_info;
CREATE POLICY "Trainers can delete their clients meals" ON meal_info
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = meal_info.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Step 5: Create RLS policies for client_engagement_score table
DROP POLICY IF EXISTS "Trainers can view their clients engagement" ON client_engagement_score;
CREATE POLICY "Trainers can view their clients engagement" ON client_engagement_score
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = client_engagement_score.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Trainers can insert their clients engagement" ON client_engagement_score;
CREATE POLICY "Trainers can insert their clients engagement" ON client_engagement_score
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = client_engagement_score.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Trainers can update their clients engagement" ON client_engagement_score;
CREATE POLICY "Trainers can update their clients engagement" ON client_engagement_score
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = client_engagement_score.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Trainers can delete their clients engagement" ON client_engagement_score;
CREATE POLICY "Trainers can delete their clients engagement" ON client_engagement_score
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = client_engagement_score.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Step 6: Create RLS policies for trainer_client_web table
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

-- Step 7: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trainer_client_web_trainer_id ON trainer_client_web(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_client_web_client_id ON trainer_client_web(client_id);
CREATE INDEX IF NOT EXISTS idx_trainer_client_web_status ON trainer_client_web(status);

-- Step 8: Verify all policies are created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('client', 'activity_info', 'meal_info', 'client_engagement_score', 'trainer_client_web')
ORDER BY tablename, policyname; 