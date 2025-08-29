-- Disable All RLS Policies
-- This script completely disables RLS on all tables to undo the policies
-- Run this in your Supabase SQL Editor

-- Step 1: Drop all existing policies
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

-- Step 2: Disable RLS on all tables
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

-- Step 3: Show the status of all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename NOT LIKE 'pg_%'
AND tablename NOT LIKE 'information_schema%'
ORDER BY tablename;

-- Step 4: Show that no policies remain
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