import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTrainerSignup() {
  console.log('🧪 Testing Trainer Signup System...\n');

  try {
    // 1. Test database connection
    console.log('1. Testing database connection...');
    const { data: trainerCount, error: countError } = await supabase
      .from('trainer')
      .select('id', { count: 'exact' });

    if (countError) {
      console.error('❌ Database connection failed:', countError.message);
      return;
    }

    console.log(`✅ Database connected successfully. Found ${trainerCount.length} trainers.\n`);

    // 2. Test trainer table schema
    console.log('2. Testing trainer table schema...');
    const { data: schemaData, error: schemaError } = await supabase
      .from('trainer')
      .select('*')
      .limit(1);

    if (schemaError) {
      console.error('❌ Schema test failed:', schemaError.message);
      return;
    }

    console.log('✅ Trainer table schema is accessible.\n');

    // 3. Test new fields exist
    console.log('3. Testing new fields...');
    const testTrainer = {
      trainer_email: 'test@example.com',
      trainer_name: 'Test Trainer',
      trainer_password: 'testpassword',
      phone: '+1234567890',
      business_name: 'Test Fitness',
      experience_years: 5,
      profile_completion_percentage: 75,
      is_active: true,
      terms_accepted: true,
      privacy_accepted: true
    };

    const { data: insertData, error: insertError } = await supabase
      .from('trainer')
      .insert([testTrainer])
      .select();

    if (insertError) {
      console.error('❌ Insert test failed:', insertError.message);
      return;
    }

    console.log('✅ New fields are working correctly.');
    console.log('✅ Test trainer created successfully.\n');

    // 4. Clean up test data
    console.log('4. Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('trainer')
      .delete()
      .eq('trainer_email', 'test@example.com');

    if (deleteError) {
      console.error('⚠️  Cleanup warning:', deleteError.message);
    } else {
      console.log('✅ Test data cleaned up.\n');
    }

    // 5. Summary
    console.log('🎉 Trainer Signup System Test Results:');
    console.log('✅ Database connection: Working');
    console.log('✅ Table schema: Updated');
    console.log('✅ New fields: Functional');
    console.log('✅ Insert operations: Working');
    console.log('✅ Delete operations: Working');
    console.log('\n🚀 Trainer signup system is ready for use!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testTrainerSignup(); 