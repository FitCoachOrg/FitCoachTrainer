-- Debug RLS Issues for trainer_exercises table
-- This script will help identify and fix the 403 error

-- 1. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN 'RLS ENABLED' 
        ELSE 'RLS DISABLED' 
    END as rls_status
FROM pg_tables 
WHERE tablename = 'trainer_exercises';

-- 2. Check existing policies
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
WHERE tablename = 'trainer_exercises'
ORDER BY policyname;

-- 3. Check if the trainer table has the correct structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'trainer' 
AND column_name IN ('id', 'trainer_email')
ORDER BY column_name;

-- 4. Test the current user context
SELECT 
    current_user as current_user,
    session_user as session_user,
    auth.uid() as auth_uid,
    auth.role() as auth_role;

-- 5. Check if the trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'trainer_exercises'
AND trigger_name = 'set_trainer_id_trigger';

-- 6. Fix: Drop and recreate policies with proper syntax
-- First, disable RLS temporarily for testing
ALTER TABLE trainer_exercises DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE trainer_exercises ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Trainers can view their own exercises" ON trainer_exercises;
DROP POLICY IF EXISTS "Trainers can insert their own exercises" ON trainer_exercises;
DROP POLICY IF EXISTS "Trainers can update their own exercises" ON trainer_exercises;
DROP POLICY IF EXISTS "Trainers can delete their own exercises" ON trainer_exercises;
DROP POLICY IF EXISTS "Trainers can manage their own exercises" ON trainer_exercises;

-- Create a single comprehensive policy for all operations
CREATE POLICY "Trainers can manage their own exercises" ON trainer_exercises
    FOR ALL USING (
        trainer_id IN (
            SELECT id FROM trainer 
            WHERE trainer_email = auth.uid()::text
        )
    );

-- Alternative: Create separate policies if the above doesn't work
/*
-- Policy for SELECT
CREATE POLICY "Trainers can view their own exercises" ON trainer_exercises
    FOR SELECT USING (
        trainer_id IN (
            SELECT id FROM trainer 
            WHERE trainer_email = auth.uid()::text
        )
    );

-- Policy for INSERT
CREATE POLICY "Trainers can insert their own exercises" ON trainer_exercises
    FOR INSERT WITH CHECK (
        trainer_id IN (
            SELECT id FROM trainer 
            WHERE trainer_email = auth.uid()::text
        )
    );

-- Policy for UPDATE
CREATE POLICY "Trainers can update their own exercises" ON trainer_exercises
    FOR UPDATE USING (
        trainer_id IN (
            SELECT id FROM trainer 
            WHERE trainer_email = auth.uid()::text
        )
    );

-- Policy for DELETE
CREATE POLICY "Trainers can delete their own exercises" ON trainer_exercises
    FOR DELETE USING (
        trainer_id IN (
            SELECT id FROM trainer 
            WHERE trainer_email = auth.uid()::text
        )
    );
*/

-- 7. Fix the trigger to handle NULL trainer_id
DROP TRIGGER IF EXISTS set_trainer_id_trigger ON trainer_exercises;

CREATE OR REPLACE FUNCTION set_trainer_id_from_auth()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set trainer_id if it's not already set
    IF NEW.trainer_id IS NULL THEN
        NEW.trainer_id = (
            SELECT id FROM trainer 
            WHERE trainer_email = auth.uid()::text
        );
    END IF;
    
    -- Set updated_at timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER set_trainer_id_trigger
    BEFORE INSERT ON trainer_exercises
    FOR EACH ROW EXECUTE FUNCTION set_trainer_id_from_auth();

-- 8. Verify the setup
SELECT 'RLS Setup Verification' as check_type;

-- Check RLS status
SELECT 
    'RLS Status' as check_type,
    CASE 
        WHEN rowsecurity THEN 'ENABLED' 
        ELSE 'DISABLED' 
    END as status
FROM pg_tables 
WHERE tablename = 'trainer_exercises';

-- Check policy count
SELECT 
    'Policy Count' as check_type,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'trainer_exercises';

-- Check trigger
SELECT 
    'Trigger Status' as check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status
FROM information_schema.triggers 
WHERE event_object_table = 'trainer_exercises'
AND trigger_name = 'set_trainer_id_trigger';

-- 9. Test insert (run this as a trainer)
-- This should work now:
/*
INSERT INTO trainer_exercises (
    exercise_name, 
    expereince_level, 
    category, 
    equipment
) VALUES (
    'Test Exercise', 
    'Beginner', 
    'Strength', 
    'Bodyweight'
);
*/

-- 10. If still having issues, try this alternative approach:
-- Create a function to handle inserts with proper error handling
CREATE OR REPLACE FUNCTION insert_trainer_exercise(
    p_exercise_name TEXT,
    p_expereince_level TEXT,
    p_target_muscle TEXT DEFAULT NULL,
    p_primary_muscle TEXT DEFAULT NULL,
    p_category TEXT,
    p_video_link TEXT DEFAULT NULL,
    p_equipment TEXT DEFAULT 'Bodyweight',
    p_video_explanation TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_trainer_id UUID;
    v_exercise_id INTEGER;
BEGIN
    -- Get trainer ID
    SELECT id INTO v_trainer_id
    FROM trainer 
    WHERE trainer_email = auth.uid()::text;
    
    IF v_trainer_id IS NULL THEN
        RAISE EXCEPTION 'Trainer not found for user: %', auth.uid()::text;
    END IF;
    
    -- Insert exercise
    INSERT INTO trainer_exercises (
        trainer_id,
        exercise_name,
        expereince_level,
        target_muscle,
        primary_muscle,
        category,
        video_link,
        equipment,
        video_explanation
    ) VALUES (
        v_trainer_id,
        p_exercise_name,
        p_expereince_level,
        p_target_muscle,
        p_primary_muscle,
        p_category,
        p_video_link,
        p_equipment,
        p_video_explanation
    ) RETURNING id INTO v_exercise_id;
    
    RETURN v_exercise_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION insert_trainer_exercise TO authenticated;
