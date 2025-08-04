-- Fix Circular Reference in RLS Policies
-- This script fixes the infinite recursion issue in trainer_client_web policies
-- Run this in your Supabase SQL Editor

-- Step 1: Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Trainers can view their client relationships" ON trainer_client_web;
DROP POLICY IF EXISTS "Trainers can insert their client relationships" ON trainer_client_web;
DROP POLICY IF EXISTS "Trainers can update their client relationships" ON trainer_client_web;
DROP POLICY IF EXISTS "Trainers can delete their client relationships" ON trainer_client_web;

DROP POLICY IF EXISTS "Trainers can view own profile" ON trainer;
DROP POLICY IF EXISTS "Trainers can update own profile" ON trainer;
DROP POLICY IF EXISTS "Trainers can insert own profile" ON trainer;

-- Step 2: Create trainer policies first (no circular reference)
CREATE POLICY "Trainers can view own profile" ON trainer
    FOR SELECT USING (trainer_email = auth.jwt() ->> 'email');

CREATE POLICY "Trainers can update own profile" ON trainer
    FOR UPDATE USING (trainer_email = auth.jwt() ->> 'email');

CREATE POLICY "Trainers can insert own profile" ON trainer
    FOR INSERT WITH CHECK (trainer_email = auth.jwt() ->> 'email');

-- Step 3: Create trainer_client_web policies with direct email check
-- This avoids the circular reference by checking the trainer email directly
CREATE POLICY "Trainers can view their client relationships" ON trainer_client_web
    FOR SELECT USING (
        trainer_id IN (
            SELECT id FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Trainers can insert their client relationships" ON trainer_client_web
    FOR INSERT WITH CHECK (
        trainer_id IN (
            SELECT id FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Trainers can update their client relationships" ON trainer_client_web
    FOR UPDATE USING (
        trainer_id IN (
            SELECT id FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Trainers can delete their client relationships" ON trainer_client_web
    FOR DELETE USING (
        trainer_id IN (
            SELECT id FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

-- Step 4: Create policies for all client-related tables
-- These use the trainer_client_web relationship but avoid circular reference

-- Client table policies
DROP POLICY IF EXISTS "Trainers can view their clients" ON client;
CREATE POLICY "Trainers can view their clients" ON client
    FOR SELECT USING (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can insert their clients" ON client;
CREATE POLICY "Trainers can insert their clients" ON client
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer t
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can update their clients" ON client;
CREATE POLICY "Trainers can update their clients" ON client
    FOR UPDATE USING (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can delete their clients" ON client;
CREATE POLICY "Trainers can delete their clients" ON client
    FOR DELETE USING (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

-- Activity_info table policies
DROP POLICY IF EXISTS "Trainers can view their clients activity" ON activity_info;
CREATE POLICY "Trainers can view their clients activity" ON activity_info
    FOR SELECT USING (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can insert their clients activity" ON activity_info;
CREATE POLICY "Trainers can insert their clients activity" ON activity_info
    FOR INSERT WITH CHECK (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can update their clients activity" ON activity_info;
CREATE POLICY "Trainers can update their clients activity" ON activity_info
    FOR UPDATE USING (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can delete their clients activity" ON activity_info;
CREATE POLICY "Trainers can delete their clients activity" ON activity_info
    FOR DELETE USING (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

-- Meal_info table policies
DROP POLICY IF EXISTS "Trainers can view their clients meals" ON meal_info;
CREATE POLICY "Trainers can view their clients meals" ON meal_info
    FOR SELECT USING (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can insert their clients meals" ON meal_info;
CREATE POLICY "Trainers can insert their clients meals" ON meal_info
    FOR INSERT WITH CHECK (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can update their clients meals" ON meal_info;
CREATE POLICY "Trainers can update their clients meals" ON meal_info
    FOR UPDATE USING (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can delete their clients meals" ON meal_info;
CREATE POLICY "Trainers can delete their clients meals" ON meal_info
    FOR DELETE USING (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

-- Client_engagement_score table policies
DROP POLICY IF EXISTS "Trainers can view their clients engagement" ON client_engagement_score;
CREATE POLICY "Trainers can view their clients engagement" ON client_engagement_score
    FOR SELECT USING (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can insert their clients engagement" ON client_engagement_score;
CREATE POLICY "Trainers can insert their clients engagement" ON client_engagement_score
    FOR INSERT WITH CHECK (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can update their clients engagement" ON client_engagement_score;
CREATE POLICY "Trainers can update their clients engagement" ON client_engagement_score
    FOR UPDATE USING (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can delete their clients engagement" ON client_engagement_score;
CREATE POLICY "Trainers can delete their clients engagement" ON client_engagement_score
    FOR DELETE USING (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

-- Schedule_preview table policies
DROP POLICY IF EXISTS "Trainers can view their clients schedule preview" ON schedule_preview;
CREATE POLICY "Trainers can view their clients schedule preview" ON schedule_preview
    FOR SELECT USING (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can insert their clients schedule preview" ON schedule_preview;
CREATE POLICY "Trainers can insert their clients schedule preview" ON schedule_preview
    FOR INSERT WITH CHECK (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can update their clients schedule preview" ON schedule_preview;
CREATE POLICY "Trainers can update their clients schedule preview" ON schedule_preview
    FOR UPDATE USING (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can delete their clients schedule preview" ON schedule_preview;
CREATE POLICY "Trainers can delete their clients schedule preview" ON schedule_preview
    FOR DELETE USING (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

-- Schedule table policies
DROP POLICY IF EXISTS "Trainers can view their clients schedule" ON schedule;
CREATE POLICY "Trainers can view their clients schedule" ON schedule
    FOR SELECT USING (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can insert their clients schedule" ON schedule;
CREATE POLICY "Trainers can insert their clients schedule" ON schedule
    FOR INSERT WITH CHECK (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can update their clients schedule" ON schedule;
CREATE POLICY "Trainers can update their clients schedule" ON schedule
    FOR UPDATE USING (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can delete their clients schedule" ON schedule;
CREATE POLICY "Trainers can delete their clients schedule" ON schedule
    FOR DELETE USING (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

-- Grocery_list table policies
DROP POLICY IF EXISTS "Trainers can view their clients grocery lists" ON grocery_list;
CREATE POLICY "Trainers can view their clients grocery lists" ON grocery_list
    FOR SELECT USING (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can insert their clients grocery lists" ON grocery_list;
CREATE POLICY "Trainers can insert their clients grocery lists" ON grocery_list
    FOR INSERT WITH CHECK (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can update their clients grocery lists" ON grocery_list;
CREATE POLICY "Trainers can update their clients grocery lists" ON grocery_list
    FOR UPDATE USING (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can delete their clients grocery lists" ON grocery_list;
CREATE POLICY "Trainers can delete their clients grocery lists" ON grocery_list
    FOR DELETE USING (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

-- Workout_info table policies
DROP POLICY IF EXISTS "Trainers can view their clients workouts" ON workout_info;
CREATE POLICY "Trainers can view their clients workouts" ON workout_info
    FOR SELECT USING (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can insert their clients workouts" ON workout_info;
CREATE POLICY "Trainers can insert their clients workouts" ON workout_info
    FOR INSERT WITH CHECK (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can update their clients workouts" ON workout_info;
CREATE POLICY "Trainers can update their clients workouts" ON workout_info
    FOR UPDATE USING (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can delete their clients workouts" ON workout_info;
CREATE POLICY "Trainers can delete their clients workouts" ON workout_info
    FOR DELETE USING (
        client_id IN (
            SELECT tcw.client_id 
            FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE t.trainer_email = auth.jwt() ->> 'email'
        )
    );

-- Step 5: Show all created policies
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
WHERE schemaname = 'public'
ORDER BY tablename, policyname; 