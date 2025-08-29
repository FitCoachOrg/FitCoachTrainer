#!/usr/bin/env node

/**
 * Step 3: Test Database Connection
 * 
 * This script tests the connection to your Supabase database
 * and verifies that the client_engagement_score table exists.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔌 Testing Supabase Database Connection...\n');

// Check environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? '✅ Set' : '❌ Missing');
  console.error('\n📝 Please complete Step 2: Set Up Environment Variables');
  process.exit(1);
}

console.log('✅ Environment variables are set');

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testConnection() {
  try {
    console.log('🔗 Testing connection to Supabase...');
    
    // Test basic connection by fetching a single client
    const { data: clients, error: clientError } = await supabase
      .from('client')
      .select('client_id, name')
      .limit(1);

    if (clientError) {
      console.error('❌ Connection failed:', clientError.message);
      return false;
    }

    console.log('✅ Successfully connected to Supabase');
    console.log(`📊 Found ${clients.length} client(s) in test query`);
    
    if (clients.length > 0) {
      console.log(`👤 Sample client: ${clients[0].name} (ID: ${clients[0].client_id})`);
    }

    return true;

  } catch (error) {
    console.error('❌ Connection error:', error.message);
    return false;
  }
}

async function testEngagementTable() {
  try {
    console.log('\n📋 Testing client_engagement_score table...');
    
    // Check if the table exists by trying to query it
    const { data: scores, error } = await supabase
      .from('client_engagement_score')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Table test failed:', error.message);
      console.error('📝 Please complete Step 1: Create the Database Table');
      return false;
    }

    console.log('✅ client_engagement_score table exists and is accessible');
    console.log(`📊 Found ${scores.length} existing engagement score(s)`);
    
    return true;

  } catch (error) {
    console.error('❌ Table test error:', error.message);
    return false;
  }
}

async function testScheduleTable() {
  try {
    console.log('\n📅 Testing schedule table...');
    
    // Check if the schedule table exists and has data
    const { data: schedules, error } = await supabase
      .from('schedule')
      .select('id, client_id, status, for_date')
      .limit(5);

    if (error) {
      console.error('❌ Schedule table test failed:', error.message);
      return false;
    }

    console.log('✅ schedule table exists and is accessible');
    console.log(`📊 Found ${schedules.length} schedule entries in test query`);
    
    if (schedules.length > 0) {
      console.log('📋 Sample schedule entries:');
      schedules.forEach((schedule, index) => {
        console.log(`   ${index + 1}. Client ${schedule.client_id}: ${schedule.status} on ${schedule.for_date}`);
      });
    }

    return true;

  } catch (error) {
    console.error('❌ Schedule table test error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting database connection tests...\n');

  const connectionTest = await testConnection();
  if (!connectionTest) {
    console.error('\n❌ Connection test failed. Please check your environment variables.');
    process.exit(1);
  }

  const tableTest = await testEngagementTable();
  if (!tableTest) {
    console.error('\n❌ Table test failed. Please complete Step 1 first.');
    process.exit(1);
  }

  const scheduleTest = await testScheduleTable();
  if (!scheduleTest) {
    console.error('\n❌ Schedule table test failed.');
    process.exit(1);
  }

  console.log('\n🎉 All tests passed!');
  console.log('✅ Database connection: Working');
  console.log('✅ client_engagement_score table: Ready');
  console.log('✅ schedule table: Accessible');
  console.log('\n📝 You can now proceed to Step 4: Test Engagement Score Calculation');
}

// Run the tests
runTests().catch(console.error); 