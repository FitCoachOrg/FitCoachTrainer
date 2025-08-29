-- Fix for existing todos table constraint issue
-- Run this if you already created the todos table with the problematic constraint

-- Drop the problematic constraint if it exists
ALTER TABLE todos DROP CONSTRAINT IF EXISTS todos_due_date_future;

-- Verify the constraint is removed
-- You can check this by trying to insert a todo with a past due date
-- The insert should now work without the constraint violation error

-- Optional: Add a more reasonable constraint if needed
-- This would only prevent due dates that are unreasonably far in the past (e.g., more than 10 years ago)
-- ALTER TABLE todos ADD CONSTRAINT todos_due_date_reasonable 
--     CHECK (due_date IS NULL OR due_date >= NOW() - INTERVAL '10 years');
