-- Simple RLS Policies for Client-Related Tables
-- This script creates basic RLS policies that allow trainers to access client data

-- Enable RLS on client-related tables (only if they exist)
DO $$
BEGIN
    -- Enable RLS on client table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client') THEN
        ALTER TABLE client ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Enable RLS on activity_info table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_info') THEN
        ALTER TABLE activity_info ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Enable RLS on meal_info table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meal_info') THEN
        ALTER TABLE meal_info ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Enable RLS on client_engagement_score table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_engagement_score') THEN
        ALTER TABLE client_engagement_score ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Enable RLS on trainer_client_web table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trainer_client_web') THEN
        ALTER TABLE trainer_client_web ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Trainers can access client data" ON client;
DROP POLICY IF EXISTS "Trainers can access activity data" ON activity_info;
DROP POLICY IF EXISTS "Trainers can access meal data" ON meal_info;
DROP POLICY IF EXISTS "Trainers can access engagement data" ON client_engagement_score;
DROP POLICY IF EXISTS "Trainers can access client relationships" ON trainer_client_web;

-- Simple RLS Policies - Allow trainers to access all data (for now)
-- This is a temporary solution until we can properly map trainer-client relationships

-- Client table - allow all operations for authenticated users
CREATE POLICY "Trainers can access client data" ON client
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Activity_info table - allow all operations for authenticated users
CREATE POLICY "Trainers can access activity data" ON activity_info
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Meal_info table - allow all operations for authenticated users
CREATE POLICY "Trainers can access meal data" ON meal_info
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Client_engagement_score table - allow all operations for authenticated users
CREATE POLICY "Trainers can access engagement data" ON client_engagement_score
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Trainer_client_web table - allow all operations for authenticated users
CREATE POLICY "Trainers can access client relationships" ON trainer_client_web
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Alternative: If you want to restrict to only trainers, use this instead:
/*
-- Client table - allow all operations for trainers only
CREATE POLICY "Trainers can access client data" ON client
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer.trainer_email = auth.uid()::text
        )
    );

-- Activity_info table - allow all operations for trainers only
CREATE POLICY "Trainers can access activity data" ON activity_info
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer.trainer_email = auth.uid()::text
        )
    );

-- Meal_info table - allow all operations for trainers only
CREATE POLICY "Trainers can access meal data" ON meal_info
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer.trainer_email = auth.uid()::text
        )
    );

-- Client_engagement_score table - allow all operations for trainers only
CREATE POLICY "Trainers can access engagement data" ON client_engagement_score
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer.trainer_email = auth.uid()::text
        )
    );

-- Trainer_client_web table - allow all operations for trainers only
CREATE POLICY "Trainers can access client relationships" ON trainer_client_web
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trainer 
            WHERE trainer.trainer_email = auth.uid()::text
        )
    );
*/

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
WHERE tablename IN ('client', 'activity_info', 'meal_info', 'client_engagement_score', 'trainer_client_web')
ORDER BY tablename, policyname; 