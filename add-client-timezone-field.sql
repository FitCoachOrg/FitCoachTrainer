-- Add timezone field to client table
-- This script adds a timezone column to store each client's timezone preference

-- Add timezone column to client table
ALTER TABLE client ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';

-- Add comment for documentation
COMMENT ON COLUMN client.timezone IS 'Client timezone for proper time conversion (IANA timezone identifier)';

-- Update existing clients to have a default timezone
-- You can customize this based on your client base
UPDATE client SET timezone = 'UTC' WHERE timezone IS NULL;

-- Create index for better performance when querying by timezone
CREATE INDEX IF NOT EXISTS idx_client_timezone ON client(timezone);

-- Verify the change
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'client' 
AND column_name = 'timezone'
ORDER BY ordinal_position;

-- Show sample clients with their timezone
SELECT client_id, cl_name, timezone FROM client LIMIT 5;
