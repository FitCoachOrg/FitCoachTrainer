import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTargetVsActualLogging() {
  console.log('🧪 === TESTING TARGET VS ACTUAL LOGGING ===\n');
  
  // Test with client 34 (known to have issues)
  const clientId = 34;
  
  try {
    // Fetch client data to see what we're working with
    const { data: client, error } = await supabase
      .from('client')
      .select('*')
      .eq('client_id', clientId)
      .single();
    
    if (error || !client) {
      console.error('❌ Failed to fetch client:', error);
      return;
    }
    
    console.log('📊 CLIENT DATA ANALYSIS:');
    console.log(`   🆔 Client ID: ${client.client_id}`);
    console.log(`   🎯 Primary Goal: ${client.cl_primary_goal}`);
    console.log(`   ⏰ Training Time: ${client.training_time_per_session}`);
    console.log(`   📅 Workout Days: ${client.workout_days}`);
    console.log(`   🏋️‍♀️ Training Days Per Week: ${client.training_days_per_week}`);
    console.log(`   🛠️ Available Equipment: ${JSON.stringify(client.available_equipment)}`);
    console.log(`   🎯 Focus Areas: ${JSON.stringify(client.focus_areas)}`);
    console.log(`   🚨 Injuries: ${JSON.stringify(client.injuries_limitations)}`);
    console.log('');
    
    // Parse the workout days to see what we expect
    const workoutDays = client.workout_days?.split(',').map(day => day.trim().toLowerCase()) || [];
    const timeMatch = client.training_time_per_session?.match(/(\d+)_minutes/);
    const sessionMinutes = timeMatch ? parseInt(timeMatch[1]) : 45;
    
    console.log('🎯 EXPECTED TARGETS:');
    console.log(`   📅 Workout Days: ${workoutDays.length} days (${workoutDays.join(', ')})`);
    console.log(`   ⏰ Session Time: ${sessionMinutes} minutes`);
    console.log(`   🏋️‍♀️ Days Per Week: ${client.training_days_per_week} (from database)`);
    console.log('');
    
    // Check if there's a mismatch
    if (workoutDays.length !== client.training_days_per_week) {
      console.log('⚠️  POTENTIAL ISSUE: Mismatch between workout_days and training_days_per_week');
      console.log(`   workout_days count: ${workoutDays.length}`);
      console.log(`   training_days_per_week: ${client.training_days_per_week}`);
      console.log('');
    }
    
    // Test with different clients to see patterns
    console.log('🔍 TESTING MULTIPLE CLIENTS FOR PATTERNS:');
    
    const testClients = [34, 36, 38, 40];
    
    for (const testClientId of testClients) {
      const { data: testClient } = await supabase
        .from('client')
        .select('workout_days, training_time_per_session, training_days_per_week')
        .eq('client_id', testClientId)
        .single();
      
      if (testClient) {
        const testWorkoutDays = testClient.workout_days?.split(',').map(day => day.trim().toLowerCase()) || [];
        const testTimeMatch = testClient.training_time_per_session?.match(/(\d+)_minutes/);
        const testSessionMinutes = testTimeMatch ? parseInt(testTimeMatch[1]) : 45;
        
        console.log(`   Client ${testClientId}:`);
        console.log(`     Workout Days: ${testWorkoutDays.length} (${testWorkoutDays.join(', ')})`);
        console.log(`     Session Time: ${testSessionMinutes} minutes`);
        console.log(`     Days Per Week: ${testClient.training_days_per_week}`);
        
        if (testWorkoutDays.length !== testClient.training_days_per_week) {
          console.log(`     ⚠️  MISMATCH: ${testWorkoutDays.length} vs ${testClient.training_days_per_week}`);
        }
      }
    }
    
    console.log('\n✅ Test completed. Check the browser console for detailed logging when generating workout plans.');
    console.log('📝 The enhanced logging will show:');
    console.log('   🎯 Target tracking at each stage');
    console.log('   ⏰ Time calculations for each exercise');
    console.log('   📊 Final comparison between targets and actuals');
    console.log('   ⚠️  Discrepancies and potential issues');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testTargetVsActualLogging().catch(console.error);
