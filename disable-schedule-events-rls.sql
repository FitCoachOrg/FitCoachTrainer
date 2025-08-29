-- Disable RLS on schedule_events table
-- This will allow event creation without RLS restrictions

-- Disable RLS on schedule_events table
ALTER TABLE schedule_events DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'schedule_events';

-- Test insert (optional - can be run separately)
-- INSERT INTO schedule_events (
--   title,
--   description,
--   event_type,
--   start_time,
--   end_time,
--   duration_minutes,
--   trainer_id,
--   trainer_email,
--   client_name,
--   client_email,
--   status,
--   color
-- ) VALUES (
--   'Test Event',
--   'Test event after RLS disable',
--   'consultation',
--   NOW() + INTERVAL '1 day',
--   NOW() + INTERVAL '1 day' + INTERVAL '1 hour',
--   60,
--   'ce63741b-1039-4b9c-9bf7-5a55ff0ebeba',
--   'vmalik9@gmail.com',
--   'Test Client',
--   'test@example.com',
--   'scheduled',
--   '#3B82F6'
-- );
