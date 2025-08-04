import { supabase } from './supabase';

interface CreateTrainerAccountData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  businessName?: string;
  website?: string;
  experienceYears?: number;
  profilePicture?: File | null;
}

interface CreateTrainerAccountResult {
  success: boolean;
  authUserId?: string;
  trainerId?: string;
  error?: string;
  rollbackPerformed?: boolean;
}

/**
 * Upload profile picture to Supabase Storage
 */
const uploadProfilePicture = async (file: File, trainerId: string): Promise<string | null> => {
  try {
    console.log('📸 Uploading profile picture...');
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${trainerId}.${fileExt}`;
    const filePath = `trainer-profiles/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('trainer-bucket')
      .upload(filePath, file, { 
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('❌ Profile picture upload failed:', uploadError);
      return null;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('trainer-bucket')
      .getPublicUrl(filePath);

    const profilePictureUrl = publicUrlData?.publicUrl;
    console.log('✅ Profile picture uploaded:', profilePictureUrl);
    
    return profilePictureUrl;
  } catch (error) {
    console.error('❌ Error uploading profile picture:', error);
    return null;
  }
};

/**
 * Create trainer account with proper transaction handling
 * If either Auth or trainer record creation fails, both are rolled back
 */
export const createTrainerAccount = async (
  data: CreateTrainerAccountData
): Promise<CreateTrainerAccountResult> => {
  let authUserId: string | undefined;
  let trainerId: string | undefined;
  let rollbackPerformed = false;

  try {
    console.log('🚀 Starting trainer account creation...');

    // Step 1: Create Supabase Auth account
    console.log('📝 Creating Supabase Auth account...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: `${data.firstName} ${data.lastName}`,
          user_type: 'trainer'
        }
      }
    });

    if (authError) {
      console.error('❌ Auth account creation failed:', authError);
      return {
        success: false,
        error: `Auth account creation failed: ${authError.message}`
      };
    }

    if (!authData.user) {
      console.error('❌ No user returned from Auth signup');
      return {
        success: false,
        error: 'No user returned from Auth signup'
      };
    }

    authUserId = authData.user.id;
    console.log('✅ Auth account created successfully:', authUserId);

    // Step 2: Upload profile picture if provided
    let profilePictureUrl: string | null = null;
    if (data.profilePicture) {
      profilePictureUrl = await uploadProfilePicture(data.profilePicture, authUserId);
      if (!profilePictureUrl) {
        console.warn('⚠️  Profile picture upload failed, continuing without it');
      }
    }

    // Step 3: Create trainer record in database
    console.log('📝 Creating trainer record...');
    const trainerRecord = {
      trainer_email: data.email,
      trainer_name: `${data.firstName} ${data.lastName}`,
      trainer_password: null, // Explicitly null since we use Supabase Auth
      phone: data.phone || null,
      date_of_birth: data.dateOfBirth || null,
      business_name: data.businessName || null,
      website: data.website || null,
      experience_years: data.experienceYears || null,
      profile_picture_url: profilePictureUrl, // Add profile picture URL
      is_active: true,
      terms_accepted: false,
      privacy_accepted: false,
      profile_completion_percentage: 20, // Basic info completed
      updated_at: new Date().toISOString()
    };

    const { data: trainerData, error: trainerError } = await supabase
      .from('trainer')
      .insert([trainerRecord])
      .select()
      .single();

    if (trainerError) {
      console.error('❌ Trainer record creation failed:', trainerError);
      
      // Rollback: Delete the Auth account we just created
      console.log('🔄 Rolling back Auth account creation...');
      try {
        const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(authUserId);
        if (deleteAuthError) {
          console.error('⚠️  Failed to rollback Auth account:', deleteAuthError);
        } else {
          console.log('✅ Auth account rollback successful');
          rollbackPerformed = true;
        }
      } catch (rollbackError) {
        console.error('⚠️  Rollback failed:', rollbackError);
      }

      return {
        success: false,
        error: `Trainer record creation failed: ${trainerError.message}`,
        rollbackPerformed
      };
    }

    trainerId = trainerData.id;
    console.log('✅ Trainer record created successfully:', trainerId);

    // Step 4: Verify both records exist
    console.log('🔍 Verifying account creation...');
    const { data: verifyAuth } = await supabase.auth.getUser();
    const { data: verifyTrainer } = await supabase
      .from('trainer')
      .select('id')
      .eq('trainer_email', data.email)
      .single();

    if (!verifyAuth.user || !verifyTrainer) {
      console.error('❌ Verification failed - records may be inconsistent');
      return {
        success: false,
        error: 'Account verification failed - records may be inconsistent',
        rollbackPerformed
      };
    }

    console.log('✅ Account creation completed successfully!');
    return {
      success: true,
      authUserId,
      trainerId
    };

  } catch (error) {
    console.error('❌ Unexpected error during account creation:', error);
    
    // Attempt rollback if we have an authUserId
    if (authUserId) {
      console.log('🔄 Attempting rollback due to unexpected error...');
      try {
        const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(authUserId);
        if (!deleteAuthError) {
          rollbackPerformed = true;
          console.log('✅ Rollback successful');
        }
      } catch (rollbackError) {
        console.error('⚠️  Rollback failed:', rollbackError);
      }
    }

    return {
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      rollbackPerformed
    };
  }
};

/**
 * Upload profile picture for existing trainer
 */
export const uploadTrainerProfilePicture = async (file: File, trainerEmail: string): Promise<string | null> => {
  try {
    console.log('📸 Uploading profile picture for existing trainer...');
    
    // Get trainer ID first
    const { data: trainer, error: trainerError } = await supabase
      .from('trainer')
      .select('id')
      .eq('trainer_email', trainerEmail)
      .single();

    if (trainerError || !trainer) {
      console.error('❌ Trainer not found:', trainerError);
      return null;
    }

    const profilePictureUrl = await uploadProfilePicture(file, trainer.id);
    
    if (profilePictureUrl) {
      // Update trainer record with new profile picture URL
      const { error: updateError } = await supabase
        .from('trainer')
        .update({ profile_picture_url: profilePictureUrl })
        .eq('trainer_email', trainerEmail);

      if (updateError) {
        console.error('❌ Failed to update trainer record:', updateError);
        return null;
      }

      console.log('✅ Profile picture updated successfully');
      return profilePictureUrl;
    }

    return null;
  } catch (error) {
    console.error('❌ Error uploading profile picture:', error);
    return null;
  }
};

/**
 * Clean up orphaned accounts (for admin use)
 */
export const cleanupOrphanedAccounts = async (): Promise<{
  orphanedAuthAccounts: number;
  orphanedTrainerRecords: number;
  cleanedUp: number;
}> => {
  try {
    console.log('🧹 Starting orphaned account cleanup...');

    // Get all Auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      throw new Error(`Failed to list Auth users: ${authError.message}`);
    }

    // Get all trainer records
    const { data: trainerRecords, error: trainerError } = await supabase
      .from('trainer')
      .select('trainer_email');
    
    if (trainerError) {
      throw new Error(`Failed to list trainer records: ${trainerError.message}`);
    }

    const trainerEmails = new Set(trainerRecords?.map(t => t.trainer_email) || []);
    const authEmails = new Set(authUsers.users.map(u => u.email));

    let orphanedAuthAccounts = 0;
    let orphanedTrainerRecords = 0;
    let cleanedUp = 0;

    // Find orphaned Auth accounts (Auth exists but no trainer record)
    for (const user of authUsers.users) {
      if (!trainerEmails.has(user.email)) {
        console.log(`🗑️  Deleting orphaned Auth account: ${user.email}`);
        try {
          const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
          if (!deleteError) {
            orphanedAuthAccounts++;
            cleanedUp++;
          }
        } catch (error) {
          console.error(`Failed to delete orphaned Auth account ${user.email}:`, error);
        }
      }
    }

    // Find orphaned trainer records (trainer record exists but no Auth account)
    for (const trainer of trainerRecords || []) {
      if (!authEmails.has(trainer.trainer_email)) {
        console.log(`🗑️  Deleting orphaned trainer record: ${trainer.trainer_email}`);
        try {
          const { error: deleteError } = await supabase
            .from('trainer')
            .delete()
            .eq('trainer_email', trainer.trainer_email);
          
          if (!deleteError) {
            orphanedTrainerRecords++;
            cleanedUp++;
          }
        } catch (error) {
          console.error(`Failed to delete orphaned trainer record ${trainer.trainer_email}:`, error);
        }
      }
    }

    console.log(`✅ Cleanup completed: ${cleanedUp} accounts cleaned up`);
    return {
      orphanedAuthAccounts,
      orphanedTrainerRecords,
      cleanedUp
    };

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
};

/**
 * Check if an account is complete (both Auth and trainer record exist)
 */
export const checkAccountCompleteness = async (email: string): Promise<{
  hasAuthAccount: boolean;
  hasTrainerRecord: boolean;
  isComplete: boolean;
}> => {
  try {
    // Check Auth account
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const hasAuthAccount = authUsers.users.some(u => u.email === email);

    // Check trainer record
    const { data: trainerRecord } = await supabase
      .from('trainer')
      .select('id')
      .eq('trainer_email', email)
      .single();

    const hasTrainerRecord = !!trainerRecord;
    const isComplete = hasAuthAccount && hasTrainerRecord;

    return {
      hasAuthAccount,
      hasTrainerRecord,
      isComplete
    };
  } catch (error) {
    console.error('Error checking account completeness:', error);
    return {
      hasAuthAccount: false,
      hasTrainerRecord: false,
      isComplete: false
    };
  }
}; 