// Script to add data for all clients in external_device_connect table
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

// First, get all client IDs
async function getAllClientIds() {
  const { data, error } = await supabase
    .from('client')
    .select('client_id');
  
  if (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
  
  return data.map(client => client.client_id);
}

// Function to insert test data for a specific client
async function insertTestDataForClient(clientId) {
  const today = new Date();
  const testData = [];
  
  // Generate 10 days of data
  for (let i = 0; i < 10; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const formattedDate = date.toISOString().split('T')[0];
    
    testData.push({
      client_id: clientId,
      calories_spent: Math.floor(200 + Math.random() * 600),
      steps: Math.floor(5000 + Math.random() * 7000),
      heart_rate: Math.floor(60 + Math.random() * 30),
      for_date: formattedDate,
      exercise_time: Math.floor(15 + Math.random() * 60),
      other_data: {}
    });
  }
  
  const { data, error } = await supabase
    .from('external_device_connect')
    .insert(testData)
    .select();
  
  if (error) {
    console.error(`Error inserting data for client ${clientId}:`, error);
    return false;
  }
  
  console.log(`Successfully inserted ${data.length} records for client ${clientId}`);
  return true;
}

// Main function
async function addDataForAllClients() {
  const clientIds = await getAllClientIds();
  console.log(`Found ${clientIds.length} clients:`, clientIds);
  
  for (const clientId of clientIds) {
    console.log(`Processing client ${clientId}...`);
    await insertTestDataForClient(clientId);
  }
  
  console.log('Completed adding data for all clients');
}

// Run the function
addDataForAllClients()
  .catch(console.error)
  .finally(() => {
    console.log('Script completed');
    process.exit(0);
  });
