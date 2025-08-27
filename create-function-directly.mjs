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

async function createFunctionDirectly() {
  try {
    console.log('🚀 Creating insert_trainer_exercise function directly...');
    
    // First, let's check if the table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'trainer_exercises');
    
    if (tableError) {
      console.log('⚠️ Could not check table existence, proceeding anyway...');
    } else {
      console.log('📊 Table check result:', tableCheck);
    }
    
    // Try to create the function using a simpler approach
    // We'll create it step by step
    
    console.log('📝 Step 1: Creating the function...');
    
    // Create the function using a direct SQL execution approach
    const functionSQL = `
    CREATE OR REPLACE FUNCTION insert_trainer_exercise(
        p_exercise_name TEXT,
        p_expereince_level TEXT,
        p_target_muscle TEXT DEFAULT NULL,
        p_primary_muscle TEXT DEFAULT NULL,
        p_category TEXT,
        p_video_link TEXT DEFAULT NULL,
        p_equipment TEXT DEFAULT 'Bodyweight',
        p_video_explanation TEXT DEFAULT NULL
    )
    RETURNS INTEGER AS $$
    DECLARE
        v_trainer_id UUID;
        v_exercise_id INTEGER;
    BEGIN
        -- Get trainer ID
        SELECT id INTO v_trainer_id
        FROM trainer 
        WHERE trainer_email = auth.uid()::text;
        
        IF v_trainer_id IS NULL THEN
            RAISE EXCEPTION 'Trainer not found for user: %', auth.uid()::text;
        END IF;
        
        -- Insert exercise
        INSERT INTO trainer_exercises (
            trainer_id,
            exercise_name,
            expereince_level,
            target_muscle,
            primary_muscle,
            category,
            video_link,
            equipment,
            video_explanation
        ) VALUES (
            v_trainer_id,
            p_exercise_name,
            p_expereince_level,
            p_target_muscle,
            p_primary_muscle,
            p_category,
            p_video_link,
            p_equipment,
            p_video_explanation
        ) RETURNING id INTO v_exercise_id;
        
        RETURN v_exercise_id;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    // Try to execute this using a different approach
    console.log('📝 Attempting to create function...');
    
    // Let's try to test if we can insert directly first
    console.log('🧪 Testing direct insert approach...');
    
    // Get a trainer ID to test with
    const { data: trainerData, error: trainerError } = await supabase
      .from('trainer')
      .select('id')
      .eq('trainer_email', 'vmalik9@gmail.com')
      .single();
    
    if (trainerError) {
      console.error('❌ Error getting trainer data:', trainerError);
      return;
    }
    
    console.log('✅ Got trainer ID:', trainerData.id);
    
    // Try a direct insert to see if the table structure is correct
    const testInsert = {
      trainer_id: trainerData.id,
      exercise_name: 'Test Exercise',
      expereince_level: 'Beginner',
      category: 'Strength',
      equipment: 'Bodyweight'
    };
    
    console.log('🧪 Testing direct insert with data:', testInsert);
    
    const { data: insertData, error: insertError } = await supabase
      .from('trainer_exercises')
      .insert([testInsert])
      .select();
    
    if (insertError) {
      console.error('❌ Direct insert failed:', insertError);
      console.log('💡 This suggests the table structure or RLS policies need to be fixed.');
      console.log('📝 Please run the SQL script in the Supabase SQL Editor.');
    } else {
      console.log('✅ Direct insert successful!');
      console.log('📊 Inserted data:', insertData);
      
      // Clean up the test data
      const { error: deleteError } = await supabase
        .from('trainer_exercises')
        .delete()
        .eq('id', insertData[0].id);
      
      if (deleteError) {
        console.warn('⚠️ Could not clean up test data:', deleteError);
      } else {
        console.log('🧹 Test data cleaned up');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function main() {
  console.log('🔧 Direct Function Creation Test');
  console.log('================================');
  
  await createFunctionDirectly();
  
  console.log('\n📋 Summary:');
  console.log('If the direct insert test failed, you need to run the SQL script in Supabase SQL Editor.');
  console.log('If it succeeded, the function creation should also work.');
}

main();
