-- Complete Cleanup and Recreate - Remove ALL functions first

-- 1. Drop the table (this will also drop all functions, triggers, policies)
DROP TABLE IF EXISTS trainer_exercises CASCADE;

-- 2. Manually drop ALL functions with this name (explicit signatures)
DROP FUNCTION IF EXISTS insert_trainer_exercise();
DROP FUNCTION IF EXISTS insert_trainer_exercise(TEXT);
DROP FUNCTION IF EXISTS insert_trainer_exercise(TEXT, TEXT);
DROP FUNCTION IF EXISTS insert_trainer_exercise(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS insert_trainer_exercise(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS insert_trainer_exercise(TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS insert_trainer_exercise(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS insert_trainer_exercise(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS insert_trainer_exercise(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

-- 3. Verify no functions exist
SELECT 'Checking for existing functions:' as status;
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'insert_trainer_exercise'
AND n.nspname = 'public';

-- 4. Create the table with correct structure
CREATE TABLE trainer_exercises (
    id SERIAL PRIMARY KEY,
    trainer_id UUID NOT NULL REFERENCES trainer(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    expereince_level TEXT NOT NULL,
    target_muscle TEXT,
    primary_muscle TEXT,
    category TEXT NOT NULL,
    video_link TEXT,
    equipment TEXT DEFAULT 'Bodyweight',
    video_explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable RLS
ALTER TABLE trainer_exercises ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policy
CREATE POLICY "Trainers can manage their own exercises" ON trainer_exercises
    FOR ALL USING (
        trainer_id IN (
            SELECT id FROM trainer 
            WHERE trainer_email = auth.uid()::text
        )
    );

-- 7. Create the insert function (SINGLE function with explicit types)
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

-- 8. Grant execute permission
GRANT EXECUTE ON FUNCTION insert_trainer_exercise(TEXT, TEXT, TEXT) TO authenticated;

-- 9. Create updated_at trigger
CREATE TRIGGER update_trainer_exercises_updated_at
    BEFORE UPDATE ON trainer_exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Verify the function was created correctly
SELECT 'Function created:' as status;
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'insert_trainer_exercise'
AND n.nspname = 'public';

-- 11. Test the function with explicit type casting
SELECT 'Testing function:' as status;
SELECT insert_trainer_exercise(
    'Test Exercise'::TEXT,
    'Beginner'::TEXT,
    'Strength'::TEXT
);

-- 12. Clean up test data
DELETE FROM trainer_exercises WHERE exercise_name = 'Test Exercise';

-- 13. Final verification
SELECT 'Final verification:' as status;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'trainer_exercises'
ORDER BY ordinal_position;

SELECT 'Setup Complete!' as status;
