// Script to check which client is currently being viewed
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

async function checkAllClients() {
  console.log('Checking data for all clients...\n');
  
  const clientIds = [48, 42, 41, 54, 36, 55, 46, 34, 40];
  
  for (const clientId of clientIds) {
    const { data, error } = await supabase
      .from('external_device_connect')
      .select('*')
      .eq('client_id', clientId)
      .limit(3);
    
    if (error) {
      console.log(`Client ${clientId}: Error - ${error.message}`);
    } else {
      console.log(`Client ${clientId}: ${data.length} records`);
      if (data.length > 0) {
        console.log(`  Sample data:`, {
          steps: data[0].steps,
          heart_rate: data[0].heart_rate,
          calories_spent: data[0].calories_spent,
          exercise_time: data[0].exercise_time,
          for_date: data[0].for_date
        });
      }
    }
    console.log('');
  }
}

checkAllClients()
  .catch(console.error)
  .finally(() => {
    console.log('Script completed');
    process.exit(0);
  });
