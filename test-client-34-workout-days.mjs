import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testClient34WorkoutDays() {
  console.log('🔍 Testing workout_days for client_id = 34');
  
  try {
    // Fetch client data
    const { data: client, error } = await supabase
      .from('client')
      .select('client_id, workout_days, training_days_per_week')
      .eq('client_id', 34)
      .single();

    if (error) {
      console.error('❌ Error fetching client:', error);
      return;
    }

    console.log('\n📊 Client Data:');
    console.log('client_id:', client.client_id);
    console.log('workout_days:', client.workout_days);
    console.log('workout_days type:', typeof client.workout_days);
    console.log('training_days_per_week:', client.training_days_per_week);

    // Test different parsing approaches
    console.log('\n🔧 Testing Parsing Logic:');
    
    // Test 1: Direct access
    console.log('\n1️⃣ Direct access:');
    console.log('client.workout_days =', client.workout_days);
    
    // Test 2: Array check
    console.log('\n2️⃣ Array check:');
    console.log('Array.isArray(client.workout_days) =', Array.isArray(client.workout_days));
    
    // Test 3: String check
    console.log('\n3️⃣ String check:');
    console.log('typeof client.workout_days === "string" =', typeof client.workout_days === 'string');
    
    // Test 4: PostgreSQL array format check
    if (typeof client.workout_days === 'string') {
      console.log('\n4️⃣ PostgreSQL array format check:');
      console.log('Includes { and }:', client.workout_days.includes('{') && client.workout_days.includes('}'));
      
      if (client.workout_days.includes('{') && client.workout_days.includes('}')) {
        const match = client.workout_days.match(/\{([^}]+)\}/);
        console.log('Regex match:', match);
        if (match) {
          const days = match[1].split(',').map(day => day.trim().toLowerCase());
          console.log('Extracted days:', days);
        }
      }
    }
    
    // Test 5: JSON parse attempt
    if (typeof client.workout_days === 'string') {
      console.log('\n5️⃣ JSON parse attempt:');
      try {
        const parsed = JSON.parse(client.workout_days);
        console.log('JSON.parse result:', parsed);
        console.log('Is array after JSON.parse:', Array.isArray(parsed));
      } catch (e) {
        console.log('JSON.parse failed:', e.message);
      }
    }
    
    // Test 6: Comma split attempt
    if (typeof client.workout_days === 'string') {
      console.log('\n6️⃣ Comma split attempt:');
      const splitResult = client.workout_days.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      console.log('Comma split result:', splitResult);
    }

    // Test the actual parsing function
    console.log('\n🔧 Testing Actual Parsing Function:');
    
    function parseWorkoutDaysForImport(workoutDays) {
      console.log('🔍 [parseWorkoutDaysForImport] Input:', workoutDays);
      console.log('🔍 [parseWorkoutDaysForImport] Type:', typeof workoutDays);
      
      if (!workoutDays) {
        console.log('🔍 [parseWorkoutDaysForImport] No workout days, returning empty array');
        return [];
      }
      
      if (Array.isArray(workoutDays)) {
        console.log('🔍 [parseWorkoutDaysForImport] Processing as array');
        const result = workoutDays.map(day => day?.toLowerCase?.() || '').filter(Boolean);
        console.log('🔍 [parseWorkoutDaysForImport] Array result:', result);
        return result;
      }
      
      if (typeof workoutDays === 'string') {
        console.log('🔍 [parseWorkoutDaysForImport] Processing as string:', workoutDays);
        
        // Handle PostgreSQL array format: {mon,wed,fri}
        if (workoutDays.includes('{') && workoutDays.includes('}')) {
          console.log('🔍 [parseWorkoutDaysForImport] Detected PostgreSQL array format');
          const match = workoutDays.match(/\{([^}]+)\}/);
          if (match) {
            const days = match[1].split(',').map(day => day.trim().toLowerCase());
            const dayMapping = {
              'mon': 'monday', 'tue': 'tuesday', 'wed': 'wednesday',
              'thu': 'thursday', 'fri': 'friday', 'sat': 'saturday', 'sun': 'sunday'
            };
            const result = days.map(day => dayMapping[day] || day).filter(Boolean);
            console.log('🔍 [parseWorkoutDaysForImport] PostgreSQL array result:', result);
            return result;
          }
        }
        
        // Handle JSON array format
        try {
          const parsed = JSON.parse(workoutDays);
          if (Array.isArray(parsed)) {
            const result = parsed.map(day => day?.toLowerCase?.() || '').filter(Boolean);
            console.log('🔍 [parseWorkoutDaysForImport] JSON array result:', result);
            return result;
          }
        } catch {
          // fallback: split by comma if not valid JSON array
          const result = workoutDays.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
          console.log('🔍 [parseWorkoutDaysForImport] Comma split result:', result);
          return result;
        }
      }
      
      console.log('🔍 [parseWorkoutDaysForImport] No matching format, returning empty array');
      return [];
    }
    
    const parsedResult = parseWorkoutDaysForImport(client.workout_days);
    console.log('\n✅ Final parsed result:', parsedResult);
    console.log('✅ Final display string:', parsedResult.join(', ') || 'None specified');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testClient34WorkoutDays();
