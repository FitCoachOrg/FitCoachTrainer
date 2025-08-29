-- Check and Fix trainer_exercises Table
-- This script will diagnose and fix the insertion issues

-- 1. Check if the table exists and its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'trainer_exercises'
ORDER BY ordinal_position;

-- 2. If table doesn't exist, create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'trainer_exercises'
    ) THEN
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
        
        RAISE NOTICE 'Created trainer_exercises table';
    ELSE
        RAISE NOTICE 'trainer_exercises table already exists';
    END IF;
END $$;

-- 3. Create the insert function
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

-- 5. Enable RLS
ALTER TABLE trainer_exercises ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
DROP POLICY IF EXISTS "Trainers can manage their own exercises" ON trainer_exercises;

CREATE POLICY "Trainers can manage their own exercises" ON trainer_exercises
    FOR ALL USING (
        trainer_id IN (
            SELECT id FROM trainer 
            WHERE trainer_email = auth.uid()::text
        )
    );

-- 7. Verify everything is set up correctly
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

-- 8. Test the function (optional)
-- Uncomment the following lines to test:
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
