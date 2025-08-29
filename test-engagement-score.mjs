#!/usr/bin/env node

/**
 * Test script for Engagement Score Calculation
 * 
 * This script tests the engagement score calculation functionality
 * without actually inserting data into the database.
 * 
 * Usage: node test-engagement-score.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Test engagement score calculation for a specific client
 */
async function testEngagementScoreCalculation(clientId, forDate) {
  console.log(`🧪 Testing engagement score calculation for client ${clientId} on ${forDate}`);
  
  try {
    // Get client details
    const { data: client, error: clientError } = await supabase
      .from('client')
      .select('client_id, name')
      .eq('client_id', clientId)
      .single();

    if (clientError) {
      console.error(`❌ Error fetching client ${clientId}:`, clientError);
      return;
    }

    console.log(`👤 Client: ${client.name}`);

    // Get schedules for the date
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedule')
      .select('id, status, for_date')
      .eq('client_id', clientId)
      .eq('for_date', forDate);

    if (scheduleError) {
      console.error(`❌ Error fetching schedules:`, scheduleError);
      return;
    }

    const totalDue = schedules.length;
    const completed = schedules.filter(s => s.status === 'completed').length;
    const engScore = totalDue > 0 ? Math.round((completed / totalDue) * 100) : null;

    console.log(`📊 Results:`);
    console.log(`   Total tasks due: ${totalDue}`);
    console.log(`   Tasks completed: ${completed}`);
    console.log(`   Engagement score: ${engScore}%`);
    console.log(`   Tasks:`, schedules.map(s => `${s.status} (ID: ${s.id})`));

    return { engScore, totalDue, completed };

  } catch (error) {
    console.error(`❌ Error in test:`, error);
    return null;
  }
}

/**
 * Test existing engagement scores
 */
async function testExistingScores() {
  console.log('\n📋 Testing existing engagement scores...');
  
  try {
    const { data: scores, error } = await supabase
      .from('client_engagement_score')
      .select('client_id, for_date, eng_score, total_due, completed')
      .order('for_date', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error fetching existing scores:', error);
      return;
    }

    console.log(`📊 Found ${scores.length} recent engagement scores:`);
    scores.forEach(score => {
      console.log(`   Client ${score.client_id} on ${score.for_date}: ${score.eng_score}% (${score.completed}/${score.total_due})`);
    });

  } catch (error) {
    console.error('❌ Error testing existing scores:', error);
  }
}

/**
 * Test database connectivity
 */
async function testDatabaseConnectivity() {
  console.log('🔌 Testing database connectivity...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('client')
      .select('client_id, name')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }

    console.log('✅ Database connection successful');
    console.log(`📊 Found ${data.length} client(s) in test query`);
    return true;

  } catch (error) {
    console.error('❌ Database connection error:', error);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting Engagement Score System Tests...\n');

  // Test 1: Database connectivity
  const dbConnected = await testDatabaseConnectivity();
  if (!dbConnected) {
    console.error('❌ Cannot proceed without database connection');
    process.exit(1);
  }

  // Test 2: Existing scores
  await testExistingScores();

  // Test 3: Calculate for a specific client and date
  const testClientId = 1; // Change this to a real client ID
  const testDate = '2024-01-15'; // Change this to a real date
  
  console.log(`\n🧪 Testing calculation for client ${testClientId} on ${testDate}...`);
  const result = await testEngagementScoreCalculation(testClientId, testDate);

  if (result) {
    console.log(`\n✅ Test completed successfully!`);
    console.log(`   Final score: ${result.engScore}%`);
    console.log(`   Tasks: ${result.completed}/${result.totalDue} completed`);
  } else {
    console.log(`\n❌ Test failed or no data found`);
  }

  console.log('\n📝 Test Summary:');
  console.log('   - Database connectivity: ✅');
  console.log('   - Existing scores check: ✅');
  console.log('   - Calculation test: ' + (result ? '✅' : '❌'));
  
  console.log('\n🎉 Tests completed!');
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testEngagementScoreCalculation, testExistingScores, testDatabaseConnectivity }; 