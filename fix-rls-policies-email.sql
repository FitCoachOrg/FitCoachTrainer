-- Fix RLS Policies to use email instead of auth.uid()
-- Run this in your Supabase SQL Editor

-- Step 1: Enable RLS on tables
ALTER TABLE trainer ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_client_web ENABLE ROW LEVEL SECURITY;
ALTER TABLE client ENABLE ROW LEVEL SECURITY;

-- Step 2: Create trainer table policies using email
DROP POLICY IF EXISTS "Trainers can view own profile" ON trainer;
CREATE POLICY "Trainers can view own profile" ON trainer
    FOR SELECT USING (trainer_email = auth.jwt() ->> 'email');

DROP POLICY IF EXISTS "Trainers can update own profile" ON trainer;
CREATE POLICY "Trainers can update own profile" ON trainer
    FOR UPDATE USING (trainer_email = auth.jwt() ->> 'email');

-- Step 3: Create trainer_client_web table policies
DROP POLICY IF EXISTS "Trainers can view their client relationships" ON trainer_client_web;
CREATE POLICY "Trainers can view their client relationships" ON trainer_client_web
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer t
            WHERE t.id = trainer_client_web.trainer_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can insert their client relationships" ON trainer_client_web;
CREATE POLICY "Trainers can insert their client relationships" ON trainer_client_web
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer t
            WHERE t.id = trainer_client_web.trainer_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can update their client relationships" ON trainer_client_web;
CREATE POLICY "Trainers can update their client relationships" ON trainer_client_web
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer t
            WHERE t.id = trainer_client_web.trainer_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

-- Step 4: Create client table policies
DROP POLICY IF EXISTS "Trainers can view their clients" ON client;
CREATE POLICY "Trainers can view their clients" ON client
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = client.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

-- Step 5: Create policies for other client-related tables
ALTER TABLE activity_info ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Trainers can view their clients activity" ON activity_info;
CREATE POLICY "Trainers can view their clients activity" ON activity_info
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = activity_info.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

ALTER TABLE meal_info ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Trainers can view their clients meals" ON meal_info;
CREATE POLICY "Trainers can view their clients meals" ON meal_info
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = meal_info.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

ALTER TABLE client_engagement_score ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Trainers can view their clients engagement" ON client_engagement_score;
CREATE POLICY "Trainers can view their clients engagement" ON client_engagement_score
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = client_engagement_score.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

-- Verify the policies were created
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