-- Fix Authentication Issue in insert_trainer_exercise Function
-- The issue: auth.uid() returns UUID, not email

-- 1. Check current user authentication
SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_user_email,
    auth.role() as current_user_role;

-- 2. Drop the existing function
DROP FUNCTION IF EXISTS insert_trainer_exercise(TEXT, TEXT, TEXT);

-- 3. Create the fixed function using auth.email() instead of auth.uid()
CREATE OR REPLACE FUNCTION insert_trainer_exercise(
    p_exercise_name TEXT,
    p_expereince_level TEXT,
    p_category TEXT
)
RETURNS INTEGER AS $$
DECLARE
    v_trainer_id UUID;
    v_exercise_id INTEGER;
    v_user_email TEXT;
BEGIN
    -- Get current user email
    v_user_email := auth.email();
    
    IF v_user_email IS NULL THEN
        RAISE EXCEPTION 'User not authenticated or email not available';
    END IF;
    
    -- Get trainer ID using email
    SELECT id INTO v_trainer_id
    FROM trainer 
    WHERE trainer_email = v_user_email;
    
    IF v_trainer_id IS NULL THEN
        RAISE EXCEPTION 'Trainer not found for user email: %', v_user_email;
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

-- 4. Grant execute permission
GRANT EXECUTE ON FUNCTION insert_trainer_exercise(TEXT, TEXT, TEXT) TO authenticated;

-- 5. Test the fixed function
SELECT insert_trainer_exercise(
    'Test Exercise',
    'Beginner',
    'Strength'
);

-- 6. Clean up test data
DELETE FROM trainer_exercises WHERE exercise_name = 'Test Exercise';

-- 7. Verify the function signature
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'insert_trainer_exercise'
AND n.nspname = 'public';
