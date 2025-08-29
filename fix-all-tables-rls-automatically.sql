-- Comprehensive RLS Policy Fix for ALL Tables
-- This script automatically detects and fixes RLS policies for all tables
-- Run this in your Supabase SQL Editor

-- Step 1: Create a function to automatically enable RLS on all tables
CREATE OR REPLACE FUNCTION enable_rls_on_all_tables()
RETURNS void AS $$
DECLARE
    table_record RECORD;
BEGIN
    -- Enable RLS on all tables that don't already have it enabled
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'information_schema%'
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_record.tablename);
            RAISE NOTICE 'Enabled RLS on table: %', table_record.tablename;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not enable RLS on table %: %', table_record.tablename, SQLERRM;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create a function to generate RLS policies for all tables
CREATE OR REPLACE FUNCTION create_rls_policies_for_all_tables()
RETURNS void AS $$
DECLARE
    table_record RECORD;
    policy_name TEXT;
BEGIN
    -- Create RLS policies for all tables
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'information_schema%'
        AND tablename NOT IN ('schema_migrations', 'ar_internal_metadata') -- Exclude Rails tables if any
    LOOP
        -- Drop existing policies for this table
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS "Trainers can view their clients data" ON %I', table_record.tablename);
            EXECUTE format('DROP POLICY IF EXISTS "Trainers can insert their clients data" ON %I', table_record.tablename);
            EXECUTE format('DROP POLICY IF EXISTS "Trainers can update their clients data" ON %I', table_record.tablename);
            EXECUTE format('DROP POLICY IF EXISTS "Trainers can delete their clients data" ON %I', table_record.tablename);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop existing policies for table %: %', table_record.tablename, SQLERRM;
        END;

        -- Create SELECT policy
        BEGIN
            EXECUTE format('
                CREATE POLICY "Trainers can view their clients data" ON %I
                FOR SELECT USING (
                    EXISTS (
                        SELECT 1 FROM trainer_client_web tcw
                        JOIN trainer t ON tcw.trainer_id = t.id
                        WHERE tcw.client_id = %I.client_id
                        AND t.trainer_email = auth.jwt() ->> ''email''
                    )
                )', table_record.tablename, table_record.tablename);
            RAISE NOTICE 'Created SELECT policy for table: %', table_record.tablename;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not create SELECT policy for table %: %', table_record.tablename, SQLERRM;
        END;

        -- Create INSERT policy
        BEGIN
            EXECUTE format('
                CREATE POLICY "Trainers can insert their clients data" ON %I
                FOR INSERT WITH CHECK (
                    EXISTS (
                        SELECT 1 FROM trainer_client_web tcw
                        JOIN trainer t ON tcw.trainer_id = t.id
                        WHERE tcw.client_id = %I.client_id
                        AND t.trainer_email = auth.jwt() ->> ''email''
                    )
                )', table_record.tablename, table_record.tablename);
            RAISE NOTICE 'Created INSERT policy for table: %', table_record.tablename;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not create INSERT policy for table %: %', table_record.tablename, SQLERRM;
        END;

        -- Create UPDATE policy
        BEGIN
            EXECUTE format('
                CREATE POLICY "Trainers can update their clients data" ON %I
                FOR UPDATE USING (
                    EXISTS (
                        SELECT 1 FROM trainer_client_web tcw
                        JOIN trainer t ON tcw.trainer_id = t.id
                        WHERE tcw.client_id = %I.client_id
                        AND t.trainer_email = auth.jwt() ->> ''email''
                    )
                )', table_record.tablename, table_record.tablename);
            RAISE NOTICE 'Created UPDATE policy for table: %', table_record.tablename;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not create UPDATE policy for table %: %', table_record.tablename, SQLERRM;
        END;

        -- Create DELETE policy
        BEGIN
            EXECUTE format('
                CREATE POLICY "Trainers can delete their clients data" ON %I
                FOR DELETE USING (
                    EXISTS (
                        SELECT 1 FROM trainer_client_web tcw
                        JOIN trainer t ON tcw.trainer_id = t.id
                        WHERE tcw.client_id = %I.client_id
                        AND t.trainer_email = auth.jwt() ->> ''email''
                    )
                )', table_record.tablename, table_record.tablename);
            RAISE NOTICE 'Created DELETE policy for table: %', table_record.tablename;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not create DELETE policy for table %: %', table_record.tablename, SQLERRM;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create special policies for tables that don't have client_id
CREATE OR REPLACE FUNCTION create_special_rls_policies()
RETURNS void AS $$
BEGIN
    -- Special policy for trainer table (uses trainer_email instead of client_id)
    DROP POLICY IF EXISTS "Trainers can view own profile" ON trainer;
    CREATE POLICY "Trainers can view own profile" ON trainer
        FOR SELECT USING (trainer_email = auth.jwt() ->> 'email');

    DROP POLICY IF EXISTS "Trainers can update own profile" ON trainer;
    CREATE POLICY "Trainers can update own profile" ON trainer
        FOR UPDATE USING (trainer_email = auth.jwt() ->> 'email');

    DROP POLICY IF EXISTS "Trainers can insert own profile" ON trainer;
    CREATE POLICY "Trainers can insert own profile" ON trainer
        FOR INSERT WITH CHECK (trainer_email = auth.jwt() ->> 'email');

    -- Special policy for trainer_client_web table (uses trainer_id)
    DROP POLICY IF EXISTS "Trainers can view their client relationships" ON trainer_client_web;
    CREATE POLICY "Trainers can view their client relationships" ON trainer_client_web
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM trainer t
                WHERE t.id = trainer_client_web.trainer_id
                AND t.trainer_email = auth.jwt() ->> 'email'
            )
        );

    DROP POLICY IF EXISTS "Trainers can insert their client relationships" ON trainer_client_web;
    CREATE POLICY "Trainers can insert their client relationships" ON trainer_client_web
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM trainer t
                WHERE t.id = trainer_client_web.trainer_id
                AND t.trainer_email = auth.jwt() ->> 'email'
            )
        );

    DROP POLICY IF EXISTS "Trainers can update their client relationships" ON trainer_client_web;
    CREATE POLICY "Trainers can update their client relationships" ON trainer_client_web
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM trainer t
                WHERE t.id = trainer_client_web.trainer_id
                AND t.trainer_email = auth.jwt() ->> 'email'
            )
        );

    DROP POLICY IF EXISTS "Trainers can delete their client relationships" ON trainer_client_web;
    CREATE POLICY "Trainers can delete their client relationships" ON trainer_client_web
        FOR DELETE USING (
            EXISTS (
                SELECT 1 FROM trainer t
                WHERE t.id = trainer_client_web.trainer_id
                AND t.trainer_email = auth.jwt() ->> 'email'
            )
        );

    RAISE NOTICE 'Created special policies for trainer and trainer_client_web tables';
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create indexes for better performance
CREATE OR REPLACE FUNCTION create_performance_indexes()
RETURNS void AS $$
BEGIN
    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_trainer_client_web_client_id ON trainer_client_web(client_id);
    CREATE INDEX IF NOT EXISTS idx_trainer_client_web_status ON trainer_client_web(status);
    CREATE INDEX IF NOT EXISTS idx_trainer_email ON trainer(trainer_email);
    
    -- Create indexes on client_id for all tables that have it
    CREATE INDEX IF NOT EXISTS idx_client_client_id ON client(client_id);
    CREATE INDEX IF NOT EXISTS idx_activity_info_client_id ON activity_info(client_id);
    CREATE INDEX IF NOT EXISTS idx_meal_info_client_id ON meal_info(client_id);
    CREATE INDEX IF NOT EXISTS idx_client_engagement_score_client_id ON client_engagement_score(client_id);
    CREATE INDEX IF NOT EXISTS idx_schedule_preview_client_id ON schedule_preview(client_id);
    CREATE INDEX IF NOT EXISTS idx_schedule_client_id ON schedule(client_id);
    CREATE INDEX IF NOT EXISTS idx_grocery_list_client_id ON grocery_list(client_id);
    CREATE INDEX IF NOT EXISTS idx_workout_info_client_id ON workout_info(client_id);
    
    RAISE NOTICE 'Created performance indexes';
END;
$$ LANGUAGE plpgsql;

-- Step 5: Execute all the functions
SELECT enable_rls_on_all_tables();
SELECT create_rls_policies_for_all_tables();
SELECT create_special_rls_policies();
SELECT create_performance_indexes();

-- Step 6: Show all tables and their RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename NOT LIKE 'pg_%'
AND tablename NOT LIKE 'information_schema%'
ORDER BY tablename;

-- Step 7: Show all created policies
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
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Step 8: Clean up functions (optional)
-- DROP FUNCTION IF EXISTS enable_rls_on_all_tables();
-- DROP FUNCTION IF EXISTS create_rls_policies_for_all_tables();
-- DROP FUNCTION IF EXISTS create_special_rls_policies();
-- DROP FUNCTION IF EXISTS create_performance_indexes(); 