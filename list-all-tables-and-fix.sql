-- List All Tables and Create Comprehensive RLS Fix
-- This script will show all tables and create RLS policies for them
-- Run this in your Supabase SQL Editor

-- Step 1: Show all tables in the database
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename NOT LIKE 'pg_%'
AND tablename NOT LIKE 'information_schema%'
ORDER BY tablename;

-- Step 2: Enable RLS on all tables
ALTER TABLE trainer ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_client_web ENABLE ROW LEVEL SECURITY;
ALTER TABLE client ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_engagement_score ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_preview ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_info ENABLE ROW LEVEL SECURITY;

-- Step 3: Create trainer table policies (special case - uses email)
DROP POLICY IF EXISTS "Trainers can view own profile" ON trainer;
CREATE POLICY "Trainers can view own profile" ON trainer
    FOR SELECT USING (trainer_email = auth.jwt() ->> 'email');

DROP POLICY IF EXISTS "Trainers can update own profile" ON trainer;
CREATE POLICY "Trainers can update own profile" ON trainer
    FOR UPDATE USING (trainer_email = auth.jwt() ->> 'email');

DROP POLICY IF EXISTS "Trainers can insert own profile" ON trainer;
CREATE POLICY "Trainers can insert own profile" ON trainer
    FOR INSERT WITH CHECK (trainer_email = auth.jwt() ->> 'email');

-- Step 4: Create trainer_client_web table policies (special case - uses trainer_id)
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

DROP POLICY IF EXISTS "Trainers can delete their client relationships" ON trainer_client_web;
CREATE POLICY "Trainers can delete their client relationships" ON trainer_client_web
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer t
            WHERE t.id = trainer_client_web.trainer_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

-- Step 5: Create policies for all client-related tables
-- This will create policies for any table that has a client_id column

-- Client table policies
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
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = client.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can delete their clients" ON client;
CREATE POLICY "Trainers can delete their clients" ON client
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = client.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

-- Activity_info table policies
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

DROP POLICY IF EXISTS "Trainers can insert their clients activity" ON activity_info;
CREATE POLICY "Trainers can insert their clients activity" ON activity_info
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = activity_info.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can update their clients activity" ON activity_info;
CREATE POLICY "Trainers can update their clients activity" ON activity_info
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = activity_info.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can delete their clients activity" ON activity_info;
CREATE POLICY "Trainers can delete their clients activity" ON activity_info
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = activity_info.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

-- Meal_info table policies
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

DROP POLICY IF EXISTS "Trainers can insert their clients meals" ON meal_info;
CREATE POLICY "Trainers can insert their clients meals" ON meal_info
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = meal_info.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can update their clients meals" ON meal_info;
CREATE POLICY "Trainers can update their clients meals" ON meal_info
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = meal_info.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can delete their clients meals" ON meal_info;
CREATE POLICY "Trainers can delete their clients meals" ON meal_info
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = meal_info.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

-- Client_engagement_score table policies
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

DROP POLICY IF EXISTS "Trainers can insert their clients engagement" ON client_engagement_score;
CREATE POLICY "Trainers can insert their clients engagement" ON client_engagement_score
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = client_engagement_score.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can update their clients engagement" ON client_engagement_score;
CREATE POLICY "Trainers can update their clients engagement" ON client_engagement_score
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = client_engagement_score.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can delete their clients engagement" ON client_engagement_score;
CREATE POLICY "Trainers can delete their clients engagement" ON client_engagement_score
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = client_engagement_score.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

-- Schedule_preview table policies
DROP POLICY IF EXISTS "Trainers can view their clients schedule preview" ON schedule_preview;
CREATE POLICY "Trainers can view their clients schedule preview" ON schedule_preview
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = schedule_preview.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can insert their clients schedule preview" ON schedule_preview;
CREATE POLICY "Trainers can insert their clients schedule preview" ON schedule_preview
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = schedule_preview.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can update their clients schedule preview" ON schedule_preview;
CREATE POLICY "Trainers can update their clients schedule preview" ON schedule_preview
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = schedule_preview.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can delete their clients schedule preview" ON schedule_preview;
CREATE POLICY "Trainers can delete their clients schedule preview" ON schedule_preview
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = schedule_preview.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

-- Schedule table policies
DROP POLICY IF EXISTS "Trainers can view their clients schedule" ON schedule;
CREATE POLICY "Trainers can view their clients schedule" ON schedule
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = schedule.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can insert their clients schedule" ON schedule;
CREATE POLICY "Trainers can insert their clients schedule" ON schedule
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = schedule.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can update their clients schedule" ON schedule;
CREATE POLICY "Trainers can update their clients schedule" ON schedule
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = schedule.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can delete their clients schedule" ON schedule;
CREATE POLICY "Trainers can delete their clients schedule" ON schedule
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = schedule.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

-- Grocery_list table policies
DROP POLICY IF EXISTS "Trainers can view their clients grocery lists" ON grocery_list;
CREATE POLICY "Trainers can view their clients grocery lists" ON grocery_list
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = grocery_list.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can insert their clients grocery lists" ON grocery_list;
CREATE POLICY "Trainers can insert their clients grocery lists" ON grocery_list
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = grocery_list.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can update their clients grocery lists" ON grocery_list;
CREATE POLICY "Trainers can update their clients grocery lists" ON grocery_list
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = grocery_list.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can delete their clients grocery lists" ON grocery_list;
CREATE POLICY "Trainers can delete their clients grocery lists" ON grocery_list
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = grocery_list.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

-- Workout_info table policies
DROP POLICY IF EXISTS "Trainers can view their clients workouts" ON workout_info;
CREATE POLICY "Trainers can view their clients workouts" ON workout_info
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = workout_info.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can insert their clients workouts" ON workout_info;
CREATE POLICY "Trainers can insert their clients workouts" ON workout_info
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = workout_info.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can update their clients workouts" ON workout_info;
CREATE POLICY "Trainers can update their clients workouts" ON workout_info
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = workout_info.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Trainers can delete their clients workouts" ON workout_info;
CREATE POLICY "Trainers can delete their clients workouts" ON workout_info
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = workout_info.client_id
            AND t.trainer_email = auth.jwt() ->> 'email'
        )
    );

-- Step 6: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_trainer_client_web_client_id ON trainer_client_web(client_id);
CREATE INDEX IF NOT EXISTS idx_trainer_client_web_status ON trainer_client_web(status);
CREATE INDEX IF NOT EXISTS idx_trainer_email ON trainer(trainer_email);
CREATE INDEX IF NOT EXISTS idx_client_client_id ON client(client_id);
CREATE INDEX IF NOT EXISTS idx_activity_info_client_id ON activity_info(client_id);
CREATE INDEX IF NOT EXISTS idx_meal_info_client_id ON meal_info(client_id);
CREATE INDEX IF NOT EXISTS idx_client_engagement_score_client_id ON client_engagement_score(client_id);
CREATE INDEX IF NOT EXISTS idx_schedule_preview_client_id ON schedule_preview(client_id);
CREATE INDEX IF NOT EXISTS idx_schedule_client_id ON schedule(client_id);
CREATE INDEX IF NOT EXISTS idx_grocery_list_client_id ON grocery_list(client_id);
CREATE INDEX IF NOT EXISTS idx_workout_info_client_id ON workout_info(client_id);

-- Step 7: Show final status
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