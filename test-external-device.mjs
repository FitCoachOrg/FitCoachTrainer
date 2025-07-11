// Test script to insert data into external_device_connect table
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

// Get Supabase URL and anon key from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// First, get a valid client ID
async function getValidClientId() {
  // First, let's check the table structure
  const { data: tableInfo, error: tableError } = await supabase
    .from('client')
    .select('*')
    .limit(1);
  
  if (tableError) {
    console.error('Error fetching client table info:', tableError);
    
    // Try to list all tables
    const { data: tables } = await supabase
      .rpc('list_tables');
    
    console.log('Available tables:', tables);
    return null;
  }
  
  console.log('Client table structure:', tableInfo);
  
  if (!tableInfo || tableInfo.length === 0) {
    console.error('No clients found in the database');
    return null;
  }
  
  // Use the primary key from the first record
  const firstClient = tableInfo[0];
  const clientId = firstClient.id || firstClient.client_id;
  
  if (!clientId) {
    console.error('Could not determine client ID field');
    console.log('Available fields:', Object.keys(firstClient));
    return null;
  }
  
  return clientId;
}

// Function to insert test data
async function insertTestData() {
  const clientId = await getValidClientId();
  
  if (!clientId) {
    console.error('Could not get a valid client ID. Aborting.');
    return;
  }
  
  console.log(`Using client ID: ${clientId}`);
  
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
  
  console.log('Inserting test data:', testData);
  
  const { data, error } = await supabase
    .from('external_device_connect')
    .insert(testData)
    .select();
  
  if (error) {
    console.error('Error inserting test data:', error);
    return;
  }
  
  console.log('Successfully inserted test data:', data);
}

// Run the function
insertTestData()
  .catch(console.error)
  .finally(() => {
    console.log('Script completed');
    process.exit(0);
  });
