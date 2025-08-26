-- Create RLS Policies for schedule_events table
-- These policies allow trainers to manage their own events securely

-- Enable RLS on schedule_events (if not already enabled)
ALTER TABLE schedule_events ENABLE ROW LEVEL SECURITY;

-- Policy 1: Trainers can INSERT (create) events where trainer_email matches their email
CREATE POLICY "trainers_can_create_events" ON schedule_events
FOR INSERT WITH CHECK (
  trainer_email = auth.jwt() ->> 'email'
);

-- Policy 2: Trainers can SELECT (read) events where trainer_email matches their email
CREATE POLICY "trainers_can_read_own_events" ON schedule_events
FOR SELECT USING (
  trainer_email = auth.jwt() ->> 'email'
);

-- Policy 3: Trainers can UPDATE events where trainer_email matches their email
CREATE POLICY "trainers_can_update_own_events" ON schedule_events
FOR UPDATE USING (
  trainer_email = auth.jwt() ->> 'email'
) WITH CHECK (
  trainer_email = auth.jwt() ->> 'email'
);

-- Policy 4: Trainers can DELETE events where trainer_email matches their email
CREATE POLICY "trainers_can_delete_own_events" ON schedule_events
FOR DELETE USING (
  trainer_email = auth.jwt() ->> 'email'
);

-- Verify policies were created
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
WHERE tablename = 'schedule_events'
ORDER BY policyname;
