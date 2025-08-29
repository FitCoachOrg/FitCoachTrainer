-- Cleanup and Fix Function - Remove all duplicates and create single function

-- 1. Drop ALL existing functions with this name (regardless of signature)
DROP FUNCTION IF EXISTS insert_trainer_exercise(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS insert_trainer_exercise(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS insert_trainer_exercise(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS insert_trainer_exercise(TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS insert_trainer_exercise(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS insert_trainer_exercise(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS insert_trainer_exercise(TEXT, TEXT);
DROP FUNCTION IF EXISTS insert_trainer_exercise(TEXT);

-- 2. Check if any functions still exist
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'insert_trainer_exercise'
AND n.nspname = 'public';

-- 3. Create a single, clean function with explicit parameter types
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

-- 5. Verify the function was created correctly
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'insert_trainer_exercise'
AND n.nspname = 'public';

-- 6. Test the function with explicit type casting
SELECT insert_trainer_exercise(
    'Test Exercise'::TEXT,
    'Beginner'::TEXT,
    'Strength'::TEXT
);

-- 7. Clean up test data
DELETE FROM trainer_exercises WHERE exercise_name = 'Test Exercise';

-- 8. Show final function status
SELECT 'Function created successfully!' as status;
