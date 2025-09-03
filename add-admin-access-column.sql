-- Add admin_access column to trainer table
-- This script adds admin access control to the trainer table

-- Step 1: Add admin_access column to trainer table
ALTER TABLE trainer 
ADD COLUMN IF NOT EXISTS admin_access BOOLEAN DEFAULT false;

-- Step 2: Create index for better performance on admin access queries
CREATE INDEX IF NOT EXISTS idx_trainer_admin_access ON trainer(admin_access);

-- Step 3: Add comment for documentation
COMMENT ON COLUMN trainer.admin_access IS 'Whether trainer has administrative access to admin page, branding, notes, and programs';

-- Step 4: Set admin access for specific trainer (vmalik9@gmail.com)
UPDATE trainer 
SET admin_access = true 
WHERE trainer_email = 'vmalik9@gmail.com';

-- Step 5: Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'trainer' 
AND column_name = 'admin_access';

-- Step 6: Show current admin status for all trainers
SELECT 
  trainer_email,
  trainer_name,
  admin_access,
  CASE 
    WHEN admin_access THEN '✅ Admin Access' 
    ELSE '❌ No Admin Access' 
  END as access_status
FROM trainer 
ORDER BY admin_access DESC, trainer_name;
