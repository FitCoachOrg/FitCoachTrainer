// Script to check if data exists in external_device_connect table
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
  console.log('Checking external_device_connect table...');
  
  const { data, error } = await supabase
    .from('external_device_connect')
    .select('*')
    .eq('client_id', 48);
  
  if (error) {
    console.error('Error fetching data:', error);
    return;
  }
  
  console.log(`Found ${data.length} records for client 48:`);
  data.forEach((record, index) => {
    console.log(`Record ${index + 1}:`, {
      id: record.id,
      client_id: record.client_id,
      steps: record.steps,
      heart_rate: record.heart_rate,
      calories_spent: record.calories_spent,
      exercise_time: record.exercise_time,
      for_date: record.for_date
    });
  });
}

checkData()
  .catch(console.error)
  .finally(() => {
    console.log('Script completed');
    process.exit(0);
  });
