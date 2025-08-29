import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test client data (similar to what would be in the client table)
const testClientData = {
  client_id: 34, // Use an existing client ID
  cl_primary_goal: "Build muscle",
  training_experience: "Beginner (less than 6 months)",
  training_days_per_week: 3,
  training_time_per_session: "45",
  training_location: "Gym",
  available_equipment: ["Dumbbells", "Barbell"],
  focus_areas: ["Upper body"],
  injuries_limitations: []
};

async function testSearchBasedWorkoutPlan() {
  console.log('🧪 Testing Search-Based Workout Plan Generation');
  console.log('📊 Test Client Data:', testClientData);
  
  try {
    // First, let's check if the exercises_raw table exists and has data
    console.log('\n🔍 Checking exercises_raw table...');
    const { data: exercises, error: exercisesError } = await supabase
      .from('exercises_raw')
      .select('*')
      .limit(5);
    
    if (exercisesError) {
      console.error('❌ Error fetching exercises:', exercisesError);
      return;
    }
    
    console.log('✅ Exercises table accessible');
    console.log(`📋 Found ${exercises.length} sample exercises`);
    console.log('📋 Sample exercise:', exercises[0]);
    
    // Now let's test the search-based workout plan generation
    console.log('\n🔍 Testing search-based workout plan generation...');
    
    // Import the search-based workout plan functions
    const { generateSearchBasedWorkoutPlanForReview } = await import('./client/src/lib/search-based-workout-plan.ts');
    
    const result = await generateSearchBasedWorkoutPlanForReview(
      testClientData.client_id,
      8, // weeks
      testClientData.training_days_per_week,
      new Date() // plan start date
    );
    
    if (result.success) {
      console.log('✅ Search-based workout plan generated successfully!');
      console.log('📊 Result structure:', Object.keys(result));
      console.log('📊 Workout plan days:', result.workoutPlan?.days?.length || 0);
      console.log('📊 Total exercises:', result.workoutPlan?.workout_plan?.length || 0);
      
      if (result.workoutPlan?.days && result.workoutPlan.days.length > 0) {
        console.log('\n📋 First day sample:');
        console.log('  Focus:', result.workoutPlan.days[0].focus);
        console.log('  Date:', result.workoutPlan.days[0].date);
        console.log('  Exercises:', result.workoutPlan.days[0].exercises.length);
        
        if (result.workoutPlan.days[0].exercises.length > 0) {
          console.log('  First exercise:', {
            exercise_name: result.workoutPlan.days[0].exercises[0].exercise_name,
            category: result.workoutPlan.days[0].exercises[0].category,
            body_part: result.workoutPlan.days[0].exercises[0].body_part,
            sets: result.workoutPlan.days[0].exercises[0].sets,
            reps: result.workoutPlan.days[0].exercises[0].reps,
            weights: result.workoutPlan.days[0].exercises[0].weights
          });
        }
      }
      
      console.log('\n📊 Client info:', result.clientInfo);
      
    } else {
      console.error('❌ Search-based workout plan generation failed:');
      console.error('  Message:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testSearchBasedWorkoutPlan().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

