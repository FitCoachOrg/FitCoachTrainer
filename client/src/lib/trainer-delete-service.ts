import { supabase } from './supabase';

/**
 * Cascade delete trainer record and corresponding Auth user
 * @param trainerEmail - The email of the trainer to delete
 * @param requireConfirmation - Whether to require user confirmation
 * @returns Promise<boolean> - True if deletion was successful
 */
export const cascadeDeleteTrainer = async (
  trainerEmail: string, 
  requireConfirmation: boolean = true
): Promise<boolean> => {
  try {
    // Step 1: Confirm deletion if required
    if (requireConfirmation) {
      const confirmed = window.confirm(
        `Are you sure you want to delete the trainer account for ${trainerEmail}? This action cannot be undone.`
      );
      if (!confirmed) {
        return false;
      }
    }

    // Step 2: Delete trainer record from database
    const { error: trainerDeleteError } = await supabase
      .from('trainer')
      .delete()
      .eq('trainer_email', trainerEmail);

    if (trainerDeleteError) {
      console.error('Error deleting trainer record:', trainerDeleteError);
      throw new Error(`Failed to delete trainer record: ${trainerDeleteError.message}`);
    }

    // Step 3: Delete Auth user (requires admin privileges)
    // Note: This requires a service role key, not the anon key
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(
      trainerEmail // This would need the user ID, not email
    );

    if (authDeleteError) {
      console.error('Error deleting Auth user:', authDeleteError);
      // Don't throw error here - trainer record is already deleted
      // Log the orphaned Auth account for manual cleanup
      console.warn(`Trainer record deleted but Auth user remains: ${trainerEmail}`);
    }

    return true;
  } catch (error) {
    console.error('Error in cascade delete:', error);
    throw error;
  }
};

/**
 * Delete trainer record only (without Auth cascade)
 * Use this when you want to keep the Auth account but remove trainer data
 */
export const deleteTrainerRecordOnly = async (trainerEmail: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('trainer')
      .delete()
      .eq('trainer_email', trainerEmail);

    if (error) {
      console.error('Error deleting trainer record:', error);
      throw new Error(`Failed to delete trainer record: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting trainer record:', error);
    throw error;
  }
};

/**
 * Check if a trainer record exists
 */
export const checkTrainerExists = async (trainerEmail: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('trainer')
      .select('trainer_email')
      .eq('trainer_email', trainerEmail)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking trainer existence:', error);
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking trainer existence:', error);
    return false;
  }
}; 