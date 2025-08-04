-- Fix RLS Policies for Client-Related Tables
-- This script creates proper RLS policies for client tables to allow trainers to access their clients' data

-- Enable RLS on client-related tables
ALTER TABLE client ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_engagement_score ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_client_web ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Trainers can view their clients" ON client;
DROP POLICY IF EXISTS "Trainers can manage their clients" ON client;
DROP POLICY IF EXISTS "Trainers can view client activity" ON activity_info;
DROP POLICY IF EXISTS "Trainers can manage client activity" ON activity_info;
DROP POLICY IF EXISTS "Trainers can view client meals" ON meal_info;
DROP POLICY IF EXISTS "Trainers can manage client meals" ON meal_info;
DROP POLICY IF EXISTS "Trainers can view client engagement" ON client_engagement_score;
DROP POLICY IF EXISTS "Trainers can manage client engagement" ON client_engagement_score;
DROP POLICY IF EXISTS "Trainers can view client relationships" ON trainer_client_web;
DROP POLICY IF EXISTS "Trainers can manage client relationships" ON trainer_client_web;

-- RLS Policies for client table
-- Trainers can view clients that are assigned to them through trainer_client_web
CREATE POLICY "Trainers can view their clients" ON client
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = client.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Trainers can insert clients (they will be automatically linked through trainer_client_web)
CREATE POLICY "Trainers can insert clients" ON client
    FOR INSERT WITH CHECK (true);

-- Trainers can update their clients
CREATE POLICY "Trainers can update their clients" ON client
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = client.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Trainers can delete their clients
CREATE POLICY "Trainers can delete their clients" ON client
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = client.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- RLS Policies for activity_info table
-- Trainers can view activity info for their clients
CREATE POLICY "Trainers can view client activity" ON activity_info
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = activity_info.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Trainers can insert activity info for their clients
CREATE POLICY "Trainers can insert client activity" ON activity_info
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = activity_info.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Trainers can update activity info for their clients
CREATE POLICY "Trainers can update client activity" ON activity_info
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = activity_info.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Trainers can delete activity info for their clients
CREATE POLICY "Trainers can delete client activity" ON activity_info
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = activity_info.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- RLS Policies for meal_info table
-- Trainers can view meal info for their clients
CREATE POLICY "Trainers can view client meals" ON meal_info
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = meal_info.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Trainers can insert meal info for their clients
CREATE POLICY "Trainers can insert client meals" ON meal_info
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = meal_info.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Trainers can update meal info for their clients
CREATE POLICY "Trainers can update client meals" ON meal_info
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = meal_info.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Trainers can delete meal info for their clients
CREATE POLICY "Trainers can delete client meals" ON meal_info
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = meal_info.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- RLS Policies for client_engagement_score table
-- Trainers can view engagement scores for their clients
CREATE POLICY "Trainers can view client engagement" ON client_engagement_score
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = client_engagement_score.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Trainers can insert engagement scores for their clients
CREATE POLICY "Trainers can insert client engagement" ON client_engagement_score
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = client_engagement_score.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Trainers can update engagement scores for their clients
CREATE POLICY "Trainers can update client engagement" ON client_engagement_score
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = client_engagement_score.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Trainers can delete engagement scores for their clients
CREATE POLICY "Trainers can delete client engagement" ON client_engagement_score
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer_client_web tcw
            JOIN trainer t ON tcw.trainer_id = t.id
            WHERE tcw.client_id = client_engagement_score.client_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- RLS Policies for trainer_client_web table
-- Trainers can view their own client relationships
CREATE POLICY "Trainers can view client relationships" ON trainer_client_web
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trainer t
            WHERE t.id = trainer_client_web.trainer_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Trainers can insert their own client relationships
CREATE POLICY "Trainers can insert client relationships" ON trainer_client_web
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trainer t
            WHERE t.id = trainer_client_web.trainer_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Trainers can update their own client relationships
CREATE POLICY "Trainers can update client relationships" ON trainer_client_web
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trainer t
            WHERE t.id = trainer_client_web.trainer_id
            AND t.trainer_email = auth.uid()::text
        )
    );

-- Trainers can delete their own client relationships
CREATE POLICY "Trainers can delete client relationships" ON trainer_client_web
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trainer t
            WHERE t.id = trainer_client_web.trainer_id
            AND t.trainer_email = auth.uid()::text
        )
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
WHERE tablename IN ('client', 'activity_info', 'meal_info', 'client_engagement_score', 'trainer_client_web')
ORDER BY tablename, policyname; 