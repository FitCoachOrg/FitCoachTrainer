-- Debug Function Parameters and Fix 403/400 Errors

-- 1. Check the current function signature
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'insert_trainer_exercise'
AND n.nspname = 'public';

-- 2. Check if the function exists and its permissions
SELECT 
    routine_name,
    routine_type,
    data_type,
    security_type
FROM information_schema.routines 
WHERE routine_name = 'insert_trainer_exercise';

-- 3. Check RLS policies
SELECT 
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'trainer_exercises';

-- 4. Test the function with minimal parameters
-- This will help us see what's wrong
SELECT insert_trainer_exercise(
    'Test Exercise',
    'Beginner',
    'Strength'
);

-- 5. If the above fails, let's recreate the function with simpler parameters
DROP FUNCTION IF EXISTS insert_trainer_exercise(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION insert_trainer_exercise(
    p_exercise_name TEXT,
    p_expereince_level TEXT,
    p_category TEXT
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
    
    -- Insert exercise with minimal data
    INSERT INTO trainer_exercises (
        trainer_id,
        exercise_name,
        expereince_level,
        category
    ) VALUES (
        v_trainer_id,
        p_exercise_name,
        p_expereince_level,
        p_category
    ) RETURNING id INTO v_exercise_id;
    
    RETURN v_exercise_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant execute permission
GRANT EXECUTE ON FUNCTION insert_trainer_exercise(TEXT, TEXT, TEXT) TO authenticated;

-- 7. Test the simplified function
SELECT insert_trainer_exercise(
    'Test Exercise',
    'Beginner',
    'Strength'
);

-- 8. Clean up test data
DELETE FROM trainer_exercises WHERE exercise_name = 'Test Exercise';
