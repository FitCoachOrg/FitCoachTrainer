// supabaseClient.ts
// Supabase client configuration for trainer-side onboarding

import { supabase } from '../lib/supabase';

// Database operations for onboarding

/**
 * Get client onboarding data
 * @param {string} clientId - The client ID
 * @returns {Promise<Object>} Client data
 */
export const getClientOnboardingData = async (clientId: string) => {
  try {
    const { data, error } = await supabase
      .from('client')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (error) {
      console.error('Error fetching client data:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to get client onboarding data:', error);
    throw error;
  }
};

/**
 * Update client onboarding data
 * @param {string} clientId - The client ID
 * @param {Object} data - The data to update
 * @returns {Promise<boolean>} Success status
 */
export const updateClientOnboardingData = async (clientId: string, data: any) => {
  try {
    const { error } = await supabase
      .from('client')
      .update(data)
      .eq('client_id', clientId);

    if (error) {
      console.error('Error updating client data:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Failed to update client onboarding data:', error);
    throw error;
  }
};

/**
 * Complete client onboarding
 * @param {string} clientId - The client ID
 * @param {Object} data - The final onboarding data
 * @returns {Promise<boolean>} Success status
 */
export const completeClientOnboarding = async (clientId: string, data: any) => {
  try {
    const finalData = {
      ...data,
      onboarding_completed: true
    };

    const { error } = await supabase
      .from('client')
      .update(finalData)
      .eq('client_id', clientId);

    if (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Failed to complete onboarding:', error);
    throw error;
  }
};

/**
 * Save client target (BMR, calories, macros, etc.)
 * @param {string} clientId - The client ID
 * @param {string} goal - The goal type (bmr, calories, protein, etc.)
 * @param {number} target - The target value
 * @returns {Promise<boolean>} Success status
 */
export const saveClientTarget = async (clientId: string, goal: string, target: number) => {
  try {
    // Convert clientId to number since the table expects bigint
    const clientIdNum = parseInt(clientId);
    if (isNaN(clientIdNum)) {
      console.error('Invalid client ID:', clientId);
      return false;
    }

    // Check if target already exists for this client and goal
    const { data: existingTarget, error: checkError } = await supabase
      .from('client_target')
      .select('id')
      .eq('client_id', clientIdNum)
      .eq('goal', goal)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing target:', checkError);
      throw checkError;
    }

    if (existingTarget) {
      // Update existing target
      const { error: updateError } = await supabase
        .from('client_target')
        .update({ target: target })
        .eq('client_id', clientIdNum)
        .eq('goal', goal);

      if (updateError) {
        console.error('Error updating client target:', updateError);
        throw updateError;
      }
    } else {
      // Insert new target
      const { error: insertError } = await supabase
        .from('client_target')
        .insert({
          client_id: clientIdNum,
          goal: goal,
          target: target
        });

      if (insertError) {
        console.error('Error inserting client target:', insertError);
        throw insertError;
      }
    }

    return true;
  } catch (error) {
    console.error('Failed to save client target:', error);
    // Don't throw error to prevent onboarding failure
    console.warn('Target save failed, but continuing with onboarding...');
    return false;
  }
};

/**
 * Get client target
 * @param {string} clientId - The client ID
 * @param {string} goal - The goal type
 * @returns {Promise<Object>} Target data
 */
export const getClientTarget = async (clientId: string, goal: string) => {
  try {
    // Convert clientId to number since the table expects bigint
    const clientIdNum = parseInt(clientId);
    if (isNaN(clientIdNum)) {
      console.error('Invalid client ID:', clientId);
      return null;
    }

    const { data, error } = await supabase
      .from('client_target')
      .select('*')
      .eq('client_id', clientIdNum)
      .eq('goal', goal)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching client target:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to get client target:', error);
    throw error;
  }
};

/**
 * Check if client exists
 * @param {string} clientId - The client ID
 * @returns {Promise<boolean>} Exists status
 */
export const checkClientExists = async (clientId: string) => {
  try {
    const { data, error } = await supabase
      .from('client')
      .select('client_id')
      .eq('client_id', clientId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking client existence:', error);
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Failed to check client existence:', error);
    return false;
  }
};

/**
 * Create new client record
 * @param {string} clientId - The client ID
 * @param {Object} initialData - Initial client data
 * @returns {Promise<boolean>} Success status
 */
export const createClientRecord = async (clientId: string, initialData: any = {}) => {
  try {
    const { error } = await supabase
      .from('client')
      .insert({
        client_id: clientId,
        ...initialData
      });

    if (error) {
      console.error('Error creating client record:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Failed to create client record:', error);
    throw error;
  }
};

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection status
 */
export const testDatabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('client')
      .select('client_id')
      .limit(1);

    if (error) {
      console.error('Database connection test failed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};

// Export default client for direct use
export default supabase;
