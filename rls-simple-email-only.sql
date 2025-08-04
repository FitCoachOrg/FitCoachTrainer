-- RLS Implementation - Simple Email-Based Approach
-- This script uses ONLY email checks and completely avoids trainer_client_web table
-- Run this in your Supabase SQL Editor

-- Step 1: Disable RLS on all tables first to start clean
ALTER TABLE trainer DISABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_client_web DISABLE ROW LEVEL SECURITY;
ALTER TABLE client DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_info DISABLE ROW LEVEL SECURITY;
ALTER TABLE meal_info DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_engagement_score DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_preview DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedule DISABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_list DISABLE ROW LEVEL SECURITY;
ALTER TABLE workout_info DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "Trainers can view their client relationships" ON trainer_client_web;
DROP POLICY IF EXISTS "Trainers can insert their client relationships" ON trainer_client_web;
DROP POLICY IF EXISTS "Trainers can update their client relationships" ON trainer_client_web;
DROP POLICY IF EXISTS "Trainers can delete their client relationships" ON trainer_client_web;

DROP POLICY IF EXISTS "Trainers can view own profile" ON trainer;
DROP POLICY IF EXISTS "Trainers can update own profile" ON trainer;
DROP POLICY IF EXISTS "Trainers can insert own profile" ON trainer;

DROP POLICY IF EXISTS "Trainers can view their clients" ON client;
DROP POLICY IF EXISTS "Trainers can insert their clients" ON client;
DROP POLICY IF EXISTS "Trainers can update their clients" ON client;
DROP POLICY IF EXISTS "Trainers can delete their clients" ON client;

DROP POLICY IF EXISTS "Trainers can view their clients activity" ON activity_info;
DROP POLICY IF EXISTS "Trainers can insert their clients activity" ON activity_info;
DROP POLICY IF EXISTS "Trainers can update their clients activity" ON activity_info;
DROP POLICY IF EXISTS "Trainers can delete their clients activity" ON activity_info;

DROP POLICY IF EXISTS "Trainers can view their clients meals" ON meal_info;
DROP POLICY IF EXISTS "Trainers can insert their clients meals" ON meal_info;
DROP POLICY IF EXISTS "Trainers can update their clients meals" ON meal_info;
DROP POLICY IF EXISTS "Trainers can delete their clients meals" ON meal_info;

DROP POLICY IF EXISTS "Trainers can view their clients engagement" ON client_engagement_score;
DROP POLICY IF EXISTS "Trainers can insert their clients engagement" ON client_engagement_score;
DROP POLICY IF EXISTS "Trainers can update their clients engagement" ON client_engagement_score;
DROP POLICY IF EXISTS "Trainers can delete their clients engagement" ON client_engagement_score;

DROP POLICY IF EXISTS "Trainers can view their clients schedule preview" ON schedule_preview;
DROP POLICY IF EXISTS "Trainers can insert their clients schedule preview" ON schedule_preview;
DROP POLICY IF EXISTS "Trainers can update their clients schedule preview" ON schedule_preview;
DROP POLICY IF EXISTS "Trainers can delete their clients schedule preview" ON schedule_preview;

DROP POLICY IF EXISTS "Trainers can view their clients schedule" ON schedule;
DROP POLICY IF EXISTS "Trainers can insert their clients schedule" ON schedule;
DROP POLICY IF EXISTS "Trainers can update their clients schedule" ON schedule;
DROP POLICY IF EXISTS "Trainers can delete their clients schedule" ON schedule;

DROP POLICY IF EXISTS "Trainers can view their clients grocery lists" ON grocery_list;
DROP POLICY IF EXISTS "Trainers can insert their clients grocery lists" ON grocery_list;
DROP POLICY IF EXISTS "Trainers can update their clients grocery lists" ON grocery_list;
DROP POLICY IF EXISTS "Trainers can delete their clients grocery lists" ON grocery_list;

DROP POLICY IF EXISTS "Trainers can view their clients workouts" ON workout_info;
DROP POLICY IF EXISTS "Trainers can insert their clients workouts" ON workout_info;
DROP POLICY IF EXISTS "Trainers can update their clients workouts" ON workout_info;
DROP POLICY IF EXISTS "Trainers can delete their clients workouts" ON workout_info;

-- Step 3: Enable RLS on essential tables only (EXCEPT trainer_client_web)
ALTER TABLE trainer ENABLE ROW LEVEL SECURITY;
-- NOTE: trainer_client_web RLS is DISABLED to avoid circular references
ALTER TABLE client ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_engagement_score ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_preview ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_info ENABLE ROW LEVEL SECURITY;

-- Step 4: Create trainer policies (simple email check)
CREATE POLICY "Trainers can view own profile" ON trainer
    FOR SELECT USING (trainer_email = auth.jwt() ->> 'email');

CREATE POLICY "Trainers can update own profile" ON trainer
    FOR UPDATE USING (trainer_email = auth.jwt() ->> 'email');

CREATE POLICY "Trainers can insert own profile" ON trainer
    FOR INSERT WITH CHECK (trainer_email = auth.jwt() ->> 'email');

-- Step 5: Create client policies (simple email check)
-- Use only email-based checks, no reference to trainer_client_web
CREATE POLICY "Trainers can view their clients" ON client
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Trainers can insert their clients" ON client
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Trainers can update their clients" ON client
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Trainers can delete their clients" ON client
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

-- Step 6: Create activity_info policies (simple email check)
CREATE POLICY "Trainers can view their clients activity" ON activity_info
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Trainers can insert their clients activity" ON activity_info
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Trainers can update their clients activity" ON activity_info
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Trainers can delete their clients activity" ON activity_info
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

-- Step 7: Create meal_info policies (simple email check)
CREATE POLICY "Trainers can view their clients meals" ON meal_info
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Trainers can insert their clients meals" ON meal_info
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Trainers can update their clients meals" ON meal_info
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Trainers can delete their clients meals" ON meal_info
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

-- Step 8: Create client_engagement_score policies (simple email check)
CREATE POLICY "Trainers can view their clients engagement" ON client_engagement_score
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Trainers can insert their clients engagement" ON client_engagement_score
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Trainers can update their clients engagement" ON client_engagement_score
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Trainers can delete their clients engagement" ON client_engagement_score
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

-- Step 9: Create schedule_preview policies (simple email check)
CREATE POLICY "Trainers can view their clients schedule preview" ON schedule_preview
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Trainers can insert their clients schedule preview" ON schedule_preview
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Trainers can update their clients schedule preview" ON schedule_preview
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Trainers can delete their clients schedule preview" ON schedule_preview
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

-- Step 10: Create schedule policies (simple email check)
CREATE POLICY "Trainers can view their clients schedule" ON schedule
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Trainers can insert their clients schedule" ON schedule
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Trainers can update their clients schedule" ON schedule
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Trainers can delete their clients schedule" ON schedule
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

-- Step 11: Create grocery_list policies (simple email check)
CREATE POLICY "Trainers can view their clients grocery lists" ON grocery_list
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Trainers can insert their clients grocery lists" ON grocery_list
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Trainers can update their clients grocery lists" ON grocery_list
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Trainers can delete their clients grocery lists" ON grocery_list
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

-- Step 12: Create workout_info policies (simple email check)
CREATE POLICY "Trainers can view their clients workouts" ON workout_info
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Trainers can insert their clients workouts" ON workout_info
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Trainers can update their clients workouts" ON workout_info
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Trainers can delete their clients workouts" ON workout_info
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer_email = auth.jwt() ->> 'email'
        )
    );

-- Step 13: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_trainer_email ON trainer(trainer_email);
CREATE INDEX IF NOT EXISTS idx_client_client_id ON client(client_id);
CREATE INDEX IF NOT EXISTS idx_activity_info_client_id ON activity_info(client_id);
CREATE INDEX IF NOT EXISTS idx_meal_info_client_id ON meal_info(client_id);
CREATE INDEX IF NOT EXISTS idx_client_engagement_score_client_id ON client_engagement_score(client_id);
CREATE INDEX IF NOT EXISTS idx_schedule_preview_client_id ON schedule_preview(client_id);
CREATE INDEX IF NOT EXISTS idx_schedule_client_id ON schedule(client_id);
CREATE INDEX IF NOT EXISTS idx_grocery_list_client_id ON grocery_list(client_id);
CREATE INDEX IF NOT EXISTS idx_workout_info_client_id ON workout_info(client_id);

-- Step 14: Show the created policies
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