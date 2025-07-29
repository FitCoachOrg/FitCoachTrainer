import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to get the correct redirect URL for OAuth
export function getOAuthRedirectUrl() {
  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV;
  
  if (isDevelopment) {
    // For local development, use localhost
    return 'http://localhost:5173/dashboard';
  } else {
    // For production, use the current origin
    return `${window.location.origin}/dashboard`;
  }
}

export async function testConnection() {
  try {
    const { data, error } = await supabase.from('client').select('id').limit(1);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
} 