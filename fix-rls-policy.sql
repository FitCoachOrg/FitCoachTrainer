-- Fix RLS Policy - Use correct authentication approach

-- 1. Drop the existing policy
DROP POLICY IF EXISTS "Trainers can manage their own exercises" ON trainer_exercises;

-- 2. Create the correct RLS policy using auth.email()
CREATE POLICY "Trainers can manage their own exercises" ON trainer_exercises
    FOR ALL USING (
        trainer_id IN (
            SELECT id FROM trainer 
            WHERE trainer_email = auth.email()
        )
    );

-- 3. Test the policy by checking current user
SELECT 
    'Current user info:' as info,
    auth.uid() as user_id,
    auth.email() as user_email;

-- 4. Test if the policy works by checking what exercises the current user can see
SELECT 
    'Exercises accessible to current user:' as info,
    COUNT(*) as exercise_count
FROM trainer_exercises
WHERE trainer_id IN (
    SELECT id FROM trainer 
    WHERE trainer_email = auth.email()
);

-- 5. Show the updated policy
SELECT 
    'Updated policy:' as info,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'trainer_exercises';

SELECT 'RLS policy fixed!' as status;
