-- RLS Setup for trainer_exercises table
-- This script sets up Row Level Security to ensure trainers can only access their own exercises

-- Enable RLS on the trainer_exercises table
ALTER TABLE trainer_exercises ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for clean setup)
DROP POLICY IF EXISTS "Trainers can view their own exercises" ON trainer_exercises;
DROP POLICY IF EXISTS "Trainers can insert their own exercises" ON trainer_exercises;
DROP POLICY IF EXISTS "Trainers can update their own exercises" ON trainer_exercises;
DROP POLICY IF EXISTS "Trainers can delete their own exercises" ON trainer_exercises;

-- Policy 1: Trainers can view their own exercises
CREATE POLICY "Trainers can view their own exercises" ON trainer_exercises
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer t
            WHERE t.id = trainer_exercises.trainer_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Policy 2: Trainers can insert exercises for themselves
CREATE POLICY "Trainers can insert their own exercises" ON trainer_exercises
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer t
            WHERE t.id = trainer_exercises.trainer_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Policy 3: Trainers can update their own exercises
CREATE POLICY "Trainers can update their own exercises" ON trainer_exercises
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer t
            WHERE t.id = trainer_exercises.trainer_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Policy 4: Trainers can delete their own exercises
CREATE POLICY "Trainers can delete their own exercises" ON trainer_exercises
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer t
            WHERE t.id = trainer_exercises.trainer_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Alternative: Single comprehensive policy for all operations
-- Uncomment the following if you prefer a single policy approach
/*
DROP POLICY IF EXISTS "Trainers can manage their own exercises" ON trainer_exercises;

CREATE POLICY "Trainers can manage their own exercises" ON trainer_exercises
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trainer t
            WHERE t.id = trainer_exercises.trainer_id
            AND t.trainer_email = auth.uid()::text
        )
    );
*/

-- Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'trainer_exercises';

-- Verify policies are created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'trainer_exercises'
ORDER BY policyname;

-- Test query to verify RLS is working (run as a trainer)
-- This should only return exercises for the authenticated trainer
-- SELECT * FROM trainer_exercises;

-- Additional security considerations:

-- 1. Ensure trainer_id cannot be modified by users
-- The trainer_id should be set by the application, not by user input
-- Consider using a trigger or application-level validation

-- 2. Add audit logging (optional)
-- Create a trigger to log all changes to trainer_exercises
/*
CREATE TABLE trainer_exercises_audit (
    id SERIAL PRIMARY KEY,
    exercise_id INTEGER,
    trainer_id UUID,
    action TEXT, -- 'INSERT', 'UPDATE', 'DELETE'
    old_data JSONB,
    new_data JSONB,
    changed_by TEXT, -- auth.uid()
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION log_trainer_exercise_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO trainer_exercises_audit (exercise_id, trainer_id, action, new_data, changed_by)
        VALUES (NEW.id, NEW.trainer_id, 'INSERT', to_jsonb(NEW), auth.uid()::text);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO trainer_exercises_audit (exercise_id, trainer_id, action, old_data, new_data, changed_by)
        VALUES (NEW.id, NEW.trainer_id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid()::text);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO trainer_exercises_audit (exercise_id, trainer_id, action, old_data, changed_by)
        VALUES (OLD.id, OLD.trainer_id, 'DELETE', to_jsonb(OLD), auth.uid()::text);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trainer_exercises_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON trainer_exercises
    FOR EACH ROW EXECUTE FUNCTION log_trainer_exercise_changes();
*/

-- 3. Add constraint to prevent empty exercise names
ALTER TABLE trainer_exercises 
ADD CONSTRAINT check_exercise_name_not_empty 
CHECK (trim(exercise_name) != '');

-- 4. Add constraint for valid experience levels
ALTER TABLE trainer_exercises 
ADD CONSTRAINT check_valid_experience_level 
CHECK (expereince_level IN ('Beginner', 'Intermediate', 'Expert') OR expereince_level IS NULL);

-- 5. Add constraint for valid categories
ALTER TABLE trainer_exercises 
ADD CONSTRAINT check_valid_category 
CHECK (category IN (
    'Core', 'Full Body', 'Upper Body', 'Lower Body', 'Cardio', 
    'Strength', 'Flexibility', 'Balance', 'Yoga', 'Pilates', 
    'HIIT', 'Stretching'
) OR category IS NULL);

-- 6. Add function to automatically set trainer_id based on authenticated user
CREATE OR REPLACE FUNCTION set_trainer_id_from_auth()
RETURNS TRIGGER AS $$
BEGIN
    -- Set trainer_id based on authenticated user
    NEW.trainer_id = (
        SELECT id FROM trainer 
        WHERE trainer_email = auth.uid()::text
    );
    
    -- Set updated_at timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set trainer_id
CREATE TRIGGER set_trainer_id_trigger
    BEFORE INSERT ON trainer_exercises
    FOR EACH ROW EXECUTE FUNCTION set_trainer_id_from_auth();

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trainer_exercises_updated_at
    BEFORE UPDATE ON trainer_exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Final verification queries
SELECT 'RLS Setup Complete' as status;

-- Check if RLS is enabled
SELECT 
    'RLS Status' as check_type,
    CASE 
        WHEN rowsecurity THEN 'ENABLED' 
        ELSE 'DISABLED' 
    END as status
FROM pg_tables 
WHERE tablename = 'trainer_exercises';

-- Check policy count
SELECT 
    'Policy Count' as check_type,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'trainer_exercises';

-- Check constraints
SELECT 
    'Constraints' as check_type,
    COUNT(*) as constraint_count
FROM information_schema.table_constraints 
WHERE table_name = 'trainer_exercises';

-- Check triggers
SELECT 
    'Triggers' as check_type,
    COUNT(*) as trigger_count
FROM information_schema.triggers 
WHERE event_object_table = 'trainer_exercises';
