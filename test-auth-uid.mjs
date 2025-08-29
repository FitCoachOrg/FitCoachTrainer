import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthUID() {
  console.log('🔍 Testing auth.uid() for current user...\n');

  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error getting session:', sessionError);
      return;
    }

    if (!session) {
      console.log('❌ No active session found');
      return;
    }

    console.log('📊 Session details:');
    console.log('  User ID:', session.user.id);
    console.log('  User Email:', session.user.email);
    console.log('  Access Token:', session.access_token ? 'Present' : 'Missing');
    console.log('  Token Type:', session.token_type);

    // Test what auth.uid() would return
    console.log('\n🔍 Testing auth.uid() equivalent...');
    
    // Try to access trainer data with current user
    const { data: trainer, error: trainerError } = await supabase
      .from('trainer')
      .select('*')
      .eq('trainer_email', session.user.email);
    
    if (trainerError) {
      console.log('❌ Error accessing trainer data:', trainerError.message);
    } else {
      console.log('✅ Can access trainer data:', trainer);
    }

    // Test if we can access relationships
    if (trainer && trainer.length > 0) {
      const trainerId = trainer[0].id;
      console.log(`\n🔍 Testing relationships for trainer ID: ${trainerId}`);
      
      const { data: relationships, error: relError } = await supabase
        .from('trainer_client_web')
        .select('*')
        .eq('trainer_id', trainerId);
      
      if (relError) {
        console.log('❌ Error accessing relationships:', relError.message);
      } else {
        console.log('✅ Can access relationships:', relationships?.length || 0, 'relationships');
      }
    }

    console.log('\n💡 The issue might be that RLS policies are using auth.uid() but the user ID from Google OAuth might be different from the trainer_email.');
    console.log('🔄 Try refreshing your browser and see if the client data appears now.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testAuthUID(); 