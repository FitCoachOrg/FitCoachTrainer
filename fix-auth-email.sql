-- Fix Authentication Issue - Use auth.uid() to get email from auth.users

-- 1. Drop the existing function
DROP FUNCTION IF EXISTS insert_trainer_exercise(TEXT, TEXT, TEXT);

-- 2. Create the fixed function using auth.uid() to get email
CREATE FUNCTION insert_trainer_exercise(
    p_exercise_name TEXT,
    p_expereince_level TEXT,
    p_category TEXT
)
RETURNS INTEGER AS $$
DECLARE
    v_trainer_id UUID;
    v_exercise_id INTEGER;
    v_user_email TEXT;
    v_user_id UUID;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Get user email from auth.users table
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = v_user_id;
    
    IF v_user_email IS NULL THEN
        RAISE EXCEPTION 'User email not found for user ID: %', v_user_id;
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

-- 3. Grant execute permission
GRANT EXECUTE ON FUNCTION insert_trainer_exercise(TEXT, TEXT, TEXT) TO authenticated;

-- 4. Test the function
SELECT 'Testing function:' as status;
SELECT insert_trainer_exercise(
    'Test Exercise'::TEXT,
    'Beginner'::TEXT,
    'Strength'::TEXT
);

-- 5. Clean up test data
DELETE FROM trainer_exercises WHERE exercise_name = 'Test Exercise';

-- 6. Verify the function
SELECT 'Function verification:' as status;
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'insert_trainer_exercise'
AND n.nspname = 'public';

SELECT 'Authentication fix complete!' as status;
