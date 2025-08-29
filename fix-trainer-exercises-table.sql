-- Fix trainer_exercises Table Issues
-- Based on the error: null value in column "trainer_id" violates not-null constraint

-- 1. Check current table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'trainer_exercises'
ORDER BY ordinal_position;

-- 2. Check for triggers that might be interfering
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'trainer_exercises';

-- 3. Drop any problematic triggers
DROP TRIGGER IF EXISTS set_trainer_id_trigger ON trainer_exercises;
DROP TRIGGER IF EXISTS update_trainer_exercises_updated_at ON trainer_exercises;

-- 4. Drop any problematic functions
DROP FUNCTION IF EXISTS set_trainer_id_from_auth();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 5. Check RLS policies
SELECT 
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'trainer_exercises';

-- 6. Drop all existing policies
DROP POLICY IF EXISTS "Trainers can view their own exercises" ON trainer_exercises;
DROP POLICY IF EXISTS "Trainers can insert their own exercises" ON trainer_exercises;
DROP POLICY IF EXISTS "Trainers can update their own exercises" ON trainer_exercises;
DROP POLICY IF EXISTS "Trainers can delete their own exercises" ON trainer_exercises;
DROP POLICY IF EXISTS "Trainers can manage their own exercises" ON trainer_exercises;

-- 7. Temporarily disable RLS for testing
ALTER TABLE trainer_exercises DISABLE ROW LEVEL SECURITY;

-- 8. Test insert without RLS
-- This should work now
INSERT INTO trainer_exercises (
    trainer_id,
    exercise_name,
    expereince_level,
    category,
    equipment
) VALUES (
    'ce63741b-1039-4b9c-9bf7-5a55ff0ebeba', -- Your trainer ID
    'Test Exercise',
    'Beginner',
    'Strength',
    'Bodyweight'
);

-- 9. Clean up test data
DELETE FROM trainer_exercises WHERE exercise_name = 'Test Exercise';

-- 10. Re-enable RLS
ALTER TABLE trainer_exercises ENABLE ROW LEVEL SECURITY;

-- 11. Create proper RLS policies
CREATE POLICY "Trainers can manage their own exercises" ON trainer_exercises
    FOR ALL USING (
        trainer_id IN (
            SELECT id FROM trainer 
            WHERE trainer_email = auth.uid()::text
        )
    );

-- 12. Create the insert function
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

-- 13. Grant execute permission
GRANT EXECUTE ON FUNCTION insert_trainer_exercise TO authenticated;

-- 14. Verify everything is working
SELECT 'Table Structure:' as check_type;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'trainer_exercises'
ORDER BY ordinal_position;

SELECT 'Function Status:' as check_type;
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'insert_trainer_exercise';

SELECT 'RLS Status:' as check_type;
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN 'ENABLED' 
        ELSE 'DISABLED' 
    END as rls_status
FROM pg_tables 
WHERE tablename = 'trainer_exercises';

SELECT 'Policy Status:' as check_type;
SELECT 
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'trainer_exercises';

-- 15. Test the function (optional)
-- Uncomment to test:
/*
SELECT insert_trainer_exercise(
    'Test Exercise',
    'Beginner',
    'Arms',
    'Biceps',
    'Strength',
    'https://example.com/video',
    'Dumbbells',
    'Test exercise description'
);
*/
