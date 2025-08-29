-- Drop and Recreate trainer_exercises Table (Fixed)
-- Clean approach: Drop everything and start fresh

-- 1. Drop the existing table (this will also drop all triggers, policies, etc.)
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

-- 5. Create the insert function (FIXED: parameters in correct order)
CREATE OR REPLACE FUNCTION insert_trainer_exercise(
    p_exercise_name TEXT,
    p_expereince_level TEXT,
    p_category TEXT,
    p_target_muscle TEXT DEFAULT NULL,
    p_primary_muscle TEXT DEFAULT NULL,
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

-- 6. Grant execute permission
GRANT EXECUTE ON FUNCTION insert_trainer_exercise TO authenticated;

-- 7. Create updated_at trigger
CREATE TRIGGER update_trainer_exercises_updated_at
    BEFORE UPDATE ON trainer_exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Verify the setup
SELECT 'Table created successfully!' as status;

-- 9. Test the function (optional - uncomment to test)
/*
SELECT insert_trainer_exercise(
    'Test Exercise',
    'Beginner',
    'Strength',
    'Arms',
    'Biceps',
    'https://example.com/video',
    'Dumbbells',
    'Test exercise description'
);
*/
