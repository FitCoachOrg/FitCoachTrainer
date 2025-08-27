-- Fix Exercise Insert Issues
-- This script addresses the 400 and 404 errors

-- 1. First, let's check the trainer_exercises table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'trainer_exercises'
ORDER BY ordinal_position;

-- 2. Check if the function exists
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'insert_trainer_exercise';

-- 3. Create the missing function (if it doesn't exist)
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

-- 4. Grant execute permission
GRANT EXECUTE ON FUNCTION insert_trainer_exercise TO authenticated;

-- 5. Verify the function was created
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'insert_trainer_exercise';

-- 6. Test the function (optional - uncomment to test)
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

-- 7. Check RLS policies
SELECT 
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'trainer_exercises';

-- 8. If RLS policies are missing, create them
DO $$
BEGIN
    -- Check if policies exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'trainer_exercises' 
        AND policyname = 'Trainers can manage their own exercises'
    ) THEN
        -- Create comprehensive policy
        EXECUTE 'CREATE POLICY "Trainers can manage their own exercises" ON trainer_exercises
            FOR ALL USING (
                trainer_id IN (
                    SELECT id FROM trainer 
                    WHERE trainer_email = auth.uid()::text
                )
            )';
        
        RAISE NOTICE 'Created RLS policy for trainer_exercises';
    ELSE
        RAISE NOTICE 'RLS policy already exists';
    END IF;
END $$;

-- 9. Verify RLS is enabled
SELECT 
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN 'RLS ENABLED' 
        ELSE 'RLS DISABLED' 
    END as rls_status
FROM pg_tables 
WHERE tablename = 'trainer_exercises';
