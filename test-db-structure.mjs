import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDatabaseStructure() {
  console.log('🔍 Checking database structure...');
  
  try {
    // Check exercises_raw table
    const { data: exercises, error: exercisesError } = await supabase
      .from('exercises_raw')
      .select('*')
      .limit(1);
    
    if (exercisesError) {
      console.error('❌ Error fetching exercises:', exercisesError);
      return;
    }
    
    console.log('✅ exercises_raw table structure:', Object.keys(exercises?.[0] || {}));
    console.log('📹 Has video_link field:', !!exercises?.[0]?.video_link);
    
    // Check if exercises_assets table exists
    const { data: assets, error: assetsError } = await supabase
      .from('exercises_assets')
      .select('*')
      .limit(1);
    
    if (assetsError) {
      console.log('ℹ️ exercises_assets table does not exist yet');
    } else {
      console.log('✅ exercises_assets table exists with structure:', Object.keys(assets?.[0] || {}));
    }
    
    // Check for any other video-related tables
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_names');
    
    if (!tablesError && tables) {
      console.log('📋 All tables:', tables);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDatabaseStructure();
