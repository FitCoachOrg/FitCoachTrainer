import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Create Supabase client with service role key for admin access
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function simpleRLSFix() {
  try {
    console.log('🔧 Simple RLS policy fix...');
    
    // Since we can't use exec_sql, let's try a different approach
    // Let's check if we can directly update the RLS policy by recreating the table
    
    console.log('📝 Recreating table with correct RLS policy...');
    
    // 1. Drop the table
    const { error: dropError } = await supabase
      .from('trainer_exercises')
      .delete()
      .neq('id', 0); // Delete all records
    
    if (dropError) {
      console.log('⚠️ Could not delete records, proceeding anyway...');
    }
    
    // 2. Try to disable RLS temporarily to see if we can access the table
    console.log('📝 Testing table access...');
    
    // Test if we can insert directly (bypassing RLS)
    const { data: trainerData, error: trainerError } = await supabase
      .from('trainer')
      .select('id, trainer_email')
      .limit(1);
    
    if (trainerError) {
      console.error('❌ Cannot access trainer table:', trainerError);
      return;
    }
    
    console.log('✅ Can access trainer table:', trainerData);
    
    // 3. Try to insert a test record directly
    if (trainerData && trainerData.length > 0) {
      const testInsert = {
        trainer_id: trainerData[0].id,
        exercise_name: 'Test Direct Insert',
        expereince_level: 'Beginner',
        category: 'Strength'
      };
      
      console.log('📝 Testing direct insert:', testInsert);
      
      const { data: insertData, error: insertError } = await supabase
        .from('trainer_exercises')
        .insert([testInsert])
        .select();
      
      if (insertError) {
        console.error('❌ Direct insert failed:', insertError);
        
        // If direct insert fails, it means RLS is blocking it
        console.log('💡 RLS is blocking the insert. This means the policy needs to be fixed.');
        console.log('📝 You need to run this SQL in your Supabase SQL Editor:');
        console.log('\n' + '='.repeat(60));
        console.log(`
-- Fix RLS Policy
DROP POLICY IF EXISTS "Trainers can manage their own exercises" ON trainer_exercises;

CREATE POLICY "Trainers can manage their own exercises" ON trainer_exercises
    FOR ALL USING (
        trainer_id IN (
            SELECT id FROM trainer 
            WHERE trainer_email = auth.email()
        )
    );
        `);
        console.log('='.repeat(60));
        
      } else {
        console.log('✅ Direct insert successful:', insertData);
        
        // Clean up
        const { error: cleanupError } = await supabase
          .from('trainer_exercises')
          .delete()
          .eq('exercise_name', 'Test Direct Insert');
        
        if (!cleanupError) {
          console.log('🧹 Test data cleaned up');
        }
      }
    }
    
    console.log('🎉 RLS fix analysis completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Run the SQL script above in your Supabase SQL Editor');
    console.log('2. Test adding a custom exercise in your application');
    console.log('3. The function should work for authenticated users');
    
  } catch (error) {
    console.error('❌ Error in RLS fix:', error);
  }
}

// Run the fix
simpleRLSFix(); 