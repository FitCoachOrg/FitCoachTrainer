import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Create Supabase client with anon key (for authenticated user testing)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testFunctionWithAuth() {
  try {
    console.log('🧪 Testing function with authentication...');
    
    // First, let's sign in as a user (you'll need to provide credentials)
    console.log('📝 Attempting to sign in...');
    
    // Try to get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return;
    }
    
    if (!session) {
      console.log('⚠️ No active session found. You need to be logged in to test the function.');
      console.log('💡 Please log in to your application first, then run this test.');
      return;
    }
    
    console.log('✅ User authenticated:', session.user.email);
    
    // Test the function
    console.log('📝 Testing insert_trainer_exercise function...');
    const { data: testData, error: testError } = await supabase.rpc('insert_trainer_exercise', {
      p_exercise_name: 'Test Exercise via Auth',
      p_expereince_level: 'Beginner',
      p_category: 'Strength'
    });
    
    if (testError) {
      console.error('❌ Function test failed:', testError);
    } else {
      console.log('✅ Function test successful!');
      console.log('📊 Returned exercise ID:', testData);
      
      // Clean up test data
      console.log('🧹 Cleaning up test data...');
      const { error: cleanupError } = await supabase
        .from('trainer_exercises')
        .delete()
        .eq('exercise_name', 'Test Exercise via Auth');
      
      if (cleanupError) {
        console.warn('⚠️ Could not clean up test data:', cleanupError);
      } else {
        console.log('✅ Test data cleaned up');
      }
    }
    
    // Test direct insert as well
    console.log('📝 Testing direct insert...');
    const { data: trainerData, error: trainerError } = await supabase
      .from('trainer')
      .select('id')
      .eq('trainer_email', session.user.email)
      .single();
    
    if (trainerError) {
      console.error('❌ Could not get trainer data:', trainerError);
    } else {
      console.log('✅ Got trainer ID:', trainerData.id);
      
      const { data: insertData, error: insertError } = await supabase
        .from('trainer_exercises')
        .insert([{
          trainer_id: trainerData.id,
          exercise_name: 'Test Direct Insert',
          expereince_level: 'Beginner',
          category: 'Strength'
        }])
        .select();
      
      if (insertError) {
        console.error('❌ Direct insert failed:', insertError);
      } else {
        console.log('✅ Direct insert successful:', insertData);
        
        // Clean up
        const { error: cleanupError2 } = await supabase
          .from('trainer_exercises')
          .delete()
          .eq('exercise_name', 'Test Direct Insert');
        
        if (!cleanupError2) {
          console.log('✅ Direct insert test data cleaned up');
        }
      }
    }
    
    console.log('🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Error testing function:', error);
  }
}

// Run the test
testFunctionWithAuth();
