import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testClient40Targets() {
  console.log('🧪 === TESTING CLIENT 40 TARGETS VS ACTUALS ===\n');
  
  const clientId = 40;
  
  try {
    // Fetch client data
    const { data: client, error } = await supabase
      .from('client')
      .select('*')
      .eq('client_id', clientId)
      .single();
    
    if (error || !client) {
      console.error('❌ Failed to fetch client:', error);
      return;
    }
    
    console.log('📊 CLIENT 40 DATA:');
    console.log(`   🆔 Client ID: ${client.client_id}`);
    console.log(`   🎯 Primary Goal: ${client.cl_primary_goal}`);
    console.log(`   ⏰ Training Time: ${client.training_time_per_session}`);
    console.log(`   📅 Workout Days: ${client.workout_days}`);
    console.log(`   🏋️‍♀️ Training Days Per Week: ${client.training_days_per_week}`);
    console.log(`   🛠️ Available Equipment: ${JSON.stringify(client.available_equipment)}`);
    console.log(`   🎯 Focus Areas: ${JSON.stringify(client.focus_areas)}`);
    console.log('');
    
    // Parse expected targets
    const workoutDays = client.workout_days?.split(',').map(day => day.trim().toLowerCase()) || [];
    const timeMatch = client.training_time_per_session?.match(/(\d+)_minutes/);
    const sessionMinutes = timeMatch ? parseInt(timeMatch[1]) : 45;
    
    console.log('🎯 EXPECTED TARGETS FOR CLIENT 40:');
    console.log(`   📅 Workout Days: ${workoutDays.length} days (${workoutDays.join(', ')})`);
    console.log(`   ⏰ Session Time: ${sessionMinutes} minutes`);
    console.log(`   🏋️‍♀️ Days Per Week: ${client.training_days_per_week}`);
    console.log(`   📊 Expected Total Exercises: ${workoutDays.length * 4} (assuming 4 exercises per day)`);
    console.log(`   ⏰ Expected Total Time: ${workoutDays.length * sessionMinutes} minutes`);
    console.log('');
    
    // Check data consistency
    if (workoutDays.length === client.training_days_per_week) {
      console.log('✅ DATA CONSISTENCY: workout_days matches training_days_per_week');
    } else {
      console.log('⚠️  DATA INCONSISTENCY: workout_days does not match training_days_per_week');
    }
    console.log('');
    
    // Check if there are any existing workout plans for this client
    const { data: existingPlans } = await supabase
      .from('schedule_preview')
      .select('details_json, for_date')
      .eq('client_id', clientId)
      .eq('type', 'workout')
      .order('for_date', { ascending: false })
      .limit(5);
    
    if (existingPlans && existingPlans.length > 0) {
      console.log('📋 EXISTING WORKOUT PLANS:');
      existingPlans.forEach((plan, index) => {
        const exercises = plan.details_json?.exercises || plan.details_json?.main_workout || [];
        console.log(`   Plan ${index + 1} (${plan.for_date}): ${exercises.length} exercises`);
      });
      console.log('');
    } else {
      console.log('📋 No existing workout plans found for client 40');
      console.log('');
    }
    
    console.log('🎯 NEXT STEPS:');
    console.log('1. Generate a workout plan for client 40 in the browser');
    console.log('2. Check the console for detailed target vs actual logging');
    console.log('3. Look for the following sections:');
    console.log('   - 🎯 === TARGET TRACKING START ===');
    console.log('   - 🎯 === TIME TARGET BREAKDOWN ===');
    console.log('   - 🎯 === PLAN GENERATION TARGETS ===');
    console.log('   - 🎯 === DAY CREATION PROCESS ===');
    console.log('   - 🎯 === FINAL RESULTS TRACKING ===');
    console.log('   - 🎯 === FINAL PLAN SUMMARY ===');
    console.log('');
    console.log('📊 EXPECTED RESULTS FOR CLIENT 40:');
    console.log(`   📅 Should generate: ${workoutDays.length} workout days`);
    console.log(`   ⏰ Each session should be: ~${sessionMinutes} minutes`);
    console.log(`   🏋️‍♀️ Total exercises should be: ${workoutDays.length * 4}`);
    console.log(`   📈 Total time should be: ~${workoutDays.length * sessionMinutes} minutes`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testClient40Targets().catch(console.error);
