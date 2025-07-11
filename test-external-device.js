// Test script to insert data into external_device_connect table
const { createClient } = require('@supabase/supabase-js');

// Replace with your Supabase URL and anon key
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to insert test data
async function insertTestData() {
  const clientId = 1; // Replace with your actual client ID
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
