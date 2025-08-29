import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabase() {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test basic connection
    console.log('📡 Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('exercises_raw')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection test failed:', testError);
      return;
    }
    
    console.log('✅ Basic connection successful');
    
    // Get total count
    console.log('📊 Getting total exercise count...');
    const { count, error: countError } = await supabase
      .from('exercises_raw')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Count query failed:', countError);
      return;
    }
    
    console.log(`✅ Total exercises in database: ${count}`);
    
    // Get sample exercises
    console.log('📋 Getting sample exercises...');
    const { data: exercises, error: exercisesError } = await supabase
      .from('exercises_raw')
      .select('*')
      .limit(5);
    
    if (exercisesError) {
      console.error('❌ Sample query failed:', exercisesError);
      return;
    }
    
    console.log(`✅ Found ${exercises.length} sample exercises`);
    
    if (exercises.length > 0) {
      console.log('📋 Sample exercise:', {
        id: exercises[0].id,
        exercise_name: exercises[0].exercise_name,
        category: exercises[0].category,
        primary_muscle: exercises[0].primary_muscle,
        equipment: exercises[0].equipment
      });
    }
    
    // Test filtering by equipment
    console.log('🔍 Testing equipment filter...');
    const { data: dumbbellExercises, error: filterError } = await supabase
      .from('exercises_raw')
      .select('*')
      .ilike('equipment', '%dumbbell%')
      .limit(3);
    
    if (filterError) {
      console.error('❌ Filter query failed:', filterError);
      return;
    }
    
    console.log(`✅ Found ${dumbbellExercises.length} dumbbell exercises`);
    
    if (dumbbellExercises.length > 0) {
      console.log('📋 Sample dumbbell exercise:', {
        exercise_name: dumbbellExercises[0].exercise_name,
        equipment: dumbbellExercises[0].equipment
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDatabase().then(() => {
  console.log('\n🏁 Database test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

