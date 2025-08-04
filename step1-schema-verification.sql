-- Step 1: Verify Existing Schema
-- Run this in your Supabase SQL Editor to check the current table structure

-- Check the current table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'client_engagement_score' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check existing indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'client_engagement_score';

-- Check existing constraints
SELECT 
  conname,
  contype,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.client_engagement_score'::regclass;

-- Check if we have any data
SELECT COUNT(*) as total_records FROM client_engagement_score;

-- Check recent entries
SELECT 
  client_id,
  for_date,
  eng_score,
  total_due,
  completed,
  created_at
FROM client_engagement_score 
ORDER BY for_date DESC, created_at DESC 
LIMIT 10; 