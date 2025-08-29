-- Final Clean Recreate - Drop everything and start fresh

-- 1. Drop the table (this will also drop all functions, triggers, policies)
DROP TABLE IF EXISTS trainer_exercises CASCADE;

-- 2. Create the table with correct structure
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

-- 3. Enable RLS
ALTER TABLE trainer_exercises ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policy
CREATE POLICY "Trainers can manage their own exercises" ON trainer_exercises
    FOR ALL USING (
        trainer_id IN (
            SELECT id FROM trainer 
            WHERE trainer_email = auth.uid()::text
        )
    );

-- 5. Create the insert function (FIXED: uses auth.email() and simple parameters)
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

-- 6. Grant execute permission
GRANT EXECUTE ON FUNCTION insert_trainer_exercise(TEXT, TEXT, TEXT) TO authenticated;

-- 7. Create updated_at trigger
CREATE TRIGGER update_trainer_exercises_updated_at
    BEFORE UPDATE ON trainer_exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Test the function
SELECT insert_trainer_exercise(
    'Test Exercise',
    'Beginner',
    'Strength'
);

-- 9. Clean up test data
DELETE FROM trainer_exercises WHERE exercise_name = 'Test Exercise';

-- 10. Verify everything is working
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

SELECT 'Trigger Status:' as check_type;
SELECT 
    trigger_name,
    event_manipulation
FROM information_schema.triggers 
WHERE event_object_table = 'trainer_exercises';

SELECT 'Setup Complete!' as status;
