-- Comprehensive RLS Implementation for FitCoachTrainer
-- This script implements relationship-based access control for all tables

-- Phase 1: Enable RLS on all tables
ALTER TABLE trainer ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_client_web ENABLE ROW LEVEL SECURITY;
ALTER TABLE client ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_engagement_score ENABLE ROW LEVEL SECURITY;

-- Phase 2: Create comprehensive RLS policies

-- 1. TRAINER TABLE POLICIES
DROP POLICY IF EXISTS "Trainers can view own profile" ON trainer;
CREATE POLICY "Trainers can view own profile" ON trainer
    FOR SELECT USING (trainer_email = auth.uid()::text);

DROP POLICY IF EXISTS "Trainers can update own profile" ON trainer;
CREATE POLICY "Trainers can update own profile" ON trainer
    FOR UPDATE USING (trainer_email = auth.uid()::text);

-- 2. TRAINER_CLIENT_WEB TABLE POLICIES
DROP POLICY IF EXISTS "Trainers can view their client relationships" ON trainer_client_web;
CREATE POLICY "Trainers can view their client relationships" ON trainer_client_web
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer t
            WHERE t.id = trainer_client_web.trainer_id
            AND t.trainer_email = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Trainers can create their client relationships" ON trainer_client_web;
CREATE POLICY "Trainers can create their client relationships" ON trainer_client_web
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

-- 3. CLIENT TABLE POLICIES
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

DROP POLICY IF EXISTS "Trainers can create clients" ON client;
CREATE POLICY "Trainers can create clients" ON client
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

-- 4. ACTIVITY_INFO TABLE POLICIES
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

DROP POLICY IF EXISTS "Trainers can create their clients activity" ON activity_info;
CREATE POLICY "Trainers can create their clients activity" ON activity_info
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

-- 5. MEAL_INFO TABLE POLICIES
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

DROP POLICY IF EXISTS "Trainers can create their clients meals" ON meal_info;
CREATE POLICY "Trainers can create their clients meals" ON meal_info
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

-- 6. CLIENT_ENGAGEMENT_SCORE TABLE POLICIES
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

DROP POLICY IF EXISTS "Trainers can create their clients engagement" ON client_engagement_score;
CREATE POLICY "Trainers can create their clients engagement" ON client_engagement_score
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

-- Phase 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trainer_client_web_trainer_id ON trainer_client_web(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_client_web_client_id ON trainer_client_web(client_id);
CREATE INDEX IF NOT EXISTS idx_trainer_client_web_status ON trainer_client_web(status);

-- Phase 4: Verify policies were created
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
WHERE tablename IN ('trainer', 'trainer_client_web', 'client', 'activity_info', 'meal_info', 'client_engagement_score')
ORDER BY tablename, policyname; 