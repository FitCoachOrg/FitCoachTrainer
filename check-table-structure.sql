-- Check the actual structure of your client table
-- Run this in your Supabase SQL Editor

-- Check client table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'client' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any clients
SELECT COUNT(*) as total_clients FROM client;

-- Check a few sample clients
SELECT * FROM client LIMIT 5;

-- Check schedule table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'schedule' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any schedules
SELECT COUNT(*) as total_schedules FROM schedule;

-- Check a few sample schedules
SELECT * FROM schedule LIMIT 5; 