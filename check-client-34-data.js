import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkClientData() {
  try {
    console.log('Checking workout data for client ID 34...\n');

    // Check recent workout data for client 34
    const { data: workoutData, error: workoutError } = await supabase
      .from('schedule_preview')
      .select('*')
      .eq('client_id', 34)
      .eq('type', 'workout')
      .order('for_date', { ascending: true });

    if (workoutError) {
      console.error('Error fetching workout data:', workoutError);
      return;
    }

    console.log(`Found ${workoutData.length} workout entries for client 34:`);

    workoutData.forEach(entry => {
      const date = entry.for_date;
      const hasDetails = entry.details_json ? 'Yes' : 'No';
      const hasProgression = entry.details_json && entry.details_json.progression ? 'Yes' : 'No';

      console.log(`- ${date}: Details: ${hasDetails}, Progression: ${hasProgression}`);

      if (entry.details_json && entry.details_json.progression) {
        console.log(`  Progression data: ${JSON.stringify(entry.details_json.progression, null, 2)}`);
      }
    });

    // Also check the schedule table
    console.log('\nChecking schedule table for client 34...');
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('schedule')
      .select('*')
      .eq('client_id', 34)
      .eq('type', 'workout')
      .order('for_date', { ascending: true });

    if (scheduleError) {
      console.error('Error fetching schedule data:', scheduleError);
      return;
    }

    console.log(`Found ${scheduleData.length} schedule entries for client 34:`);

    scheduleData.forEach(entry => {
      console.log(`- ${entry.for_date}: ${entry.summary || 'No summary'}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

checkClientData();
