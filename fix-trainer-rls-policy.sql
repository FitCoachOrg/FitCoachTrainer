-- Fix for Trainer RLS Policy (406 Error)
-- This fixes the issue where trainers can't access their own profile data

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Trainers can view own profile" ON trainer;

-- Create a more permissive policy that allows trainers to view their own profile
CREATE POLICY "Trainers can view own profile" ON trainer
    FOR SELECT USING (
        trainer_email = auth.uid()::text OR
        trainer_email = current_setting('request.jwt.claims', true)::json->>'email'
    );

-- Alternative: If the above doesn't work, use this simpler policy
-- DROP POLICY IF EXISTS "Trainers can view own profile" ON trainer;
-- CREATE POLICY "Trainers can view own profile" ON trainer
--     FOR SELECT USING (auth.uid() IS NOT NULL);

-- Also fix the update policy
DROP POLICY IF EXISTS "Trainers can update own profile" ON trainer;
CREATE POLICY "Trainers can update own profile" ON trainer
    FOR UPDATE USING (
        trainer_email = auth.uid()::text OR
        trainer_email = current_setting('request.jwt.claims', true)::json->>'email'
    );

-- Verify the policies were created
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
WHERE tablename = 'trainer'
ORDER BY policyname; 