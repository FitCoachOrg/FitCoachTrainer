-- Cascade Delete from Trainer Table to Supabase Auth
-- This trigger automatically deletes the Auth user when a trainer record is deleted

-- First, create a function to handle the cascade delete
CREATE OR REPLACE FUNCTION cascade_delete_trainer_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete the corresponding Auth user
  -- Note: This requires admin privileges or a service role
  DELETE FROM auth.users 
  WHERE email = OLD.trainer_email;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER trigger_cascade_delete_trainer_to_auth
  AFTER DELETE ON trainer
  FOR EACH ROW
  EXECUTE FUNCTION cascade_delete_trainer_to_auth();

-- Verify the trigger was created
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_cascade_delete_trainer_to_auth'; 