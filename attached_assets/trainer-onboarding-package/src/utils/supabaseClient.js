// supabaseClient.js
// Supabase client configuration for trainer-side onboarding

import { createClient } from '@supabase/supabase-js';

// Environment variables - update these with your Supabase credentials
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'your-supabase-url';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database operations for onboarding

/**
 * Get client onboarding data
 * @param {string} clientId - The client ID
 * @returns {Promise<Object>} Client data
 */
export const getClientOnboardingData = async (clientId) => {
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
export const updateClientOnboardingData = async (clientId, data) => {
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
export const completeClientOnboarding = async (clientId, data) => {
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
export const saveClientTarget = async (clientId, goal, target) => {
  try {
    // Use upsert to handle both insert and update
    const { error } = await supabase
      .from('client_target')
      .upsert({
        client_id: clientId,
        goal: goal,
        target: target
      }, {
        onConflict: 'client_id,goal'
      });

    if (error) {
      console.error('Error saving client target:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Failed to save client target:', error);
    throw error;
  }
};

/**
 * Get client target
 * @param {string} clientId - The client ID
 * @param {string} goal - The goal type
 * @returns {Promise<Object>} Target data
 */
export const getClientTarget = async (clientId, goal) => {
  try {
    const { data, error } = await supabase
      .from('client_target')
      .select('*')
      .eq('client_id', clientId)
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
export const checkClientExists = async (clientId) => {
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
export const createClientRecord = async (clientId, initialData = {}) => {
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
