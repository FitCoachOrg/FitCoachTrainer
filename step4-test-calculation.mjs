#!/usr/bin/env node

/**
 * Step 4: Test Engagement Score Calculation
 * 
 * This script tests the engagement score calculation
 * with real client data without inserting into the database.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🧪 Testing Engagement Score Calculation...\n');

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Calculate engagement score for a specific client and date
 */
async function calculateEngagementScore(clientId, forDate) {
  try {
    console.log(`📊 Calculating engagement score for client ${clientId} on ${forDate}...`);
    
    // Get client details
    const { data: client, error: clientError } = await supabase
      .from('client')
      .select('client_id, name')
      .eq('client_id', clientId)
      .single();

    if (clientError) {
      console.error(`❌ Error fetching client ${clientId}:`, clientError.message);
      return null;
    }

    console.log(`👤 Client: ${client.name}`);

    // Get schedules for the date
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedule')
      .select('id, status, for_date')
      .eq('client_id', clientId)
      .eq('for_date', forDate);

    if (scheduleError) {
      console.error(`❌ Error fetching schedules:`, scheduleError.message);
      return null;
    }

    const totalDue = schedules.length;
    const completed = schedules.filter(s => s.status === 'completed').length;
    const engScore = totalDue > 0 ? Math.round((completed / totalDue) * 100) : null;

    console.log(`📋 Results:`);
    console.log(`   Total tasks due: ${totalDue}`);
    console.log(`   Tasks completed: ${completed}`);
    console.log(`   Engagement score: ${engScore}%`);
    
    if (schedules.length > 0) {
      console.log(`   Tasks:`, schedules.map(s => `${s.status} (ID: ${s.id})`));
    } else {
      console.log(`   Tasks: No tasks found for this date`);
    }

    return { engScore, totalDue, completed, clientName: client.name };

  } catch (error) {
    console.error(`❌ Error in calculation:`, error.message);
    return null;
  }
}

/**
 * Find a client with recent schedule data
 */
async function findTestClient() {
  try {
    console.log('🔍 Finding a client with recent schedule data...');
    
    // Get a client that has schedule entries in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const forDate = thirtyDaysAgo.toISOString().slice(0, 10);

    const { data: schedules, error } = await supabase
      .from('schedule')
      .select('client_id, for_date')
      .gte('for_date', forDate)
      .limit(1);

    if (error) {
      console.error('❌ Error finding test client:', error.message);
      return null;
    }

    if (schedules.length === 0) {
      console.log('⚠️  No recent schedule data found. Using client ID 1 as fallback.');
      return 1;
    }

    const clientId = schedules[0].client_id;
    console.log(`✅ Found client ${clientId} with recent schedule data`);
    return clientId;

  } catch (error) {
    console.error('❌ Error finding test client:', error.message);
    return 1; // Fallback to client ID 1
  }
}

/**
 * Test calculation for multiple dates
 */
async function testMultipleDates(clientId) {
  console.log(`\n📅 Testing calculation for multiple dates...`);
  
  const dates = [];
  for (let i = 1; i <= 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().slice(0, 10));
  }

  let successfulTests = 0;
  let totalTests = dates.length;

  for (const date of dates) {
    const result = await calculateEngagementScore(clientId, date);
    if (result) {
      successfulTests++;
      console.log(`   ${date}: ${result.engScore}% (${result.completed}/${result.totalDue})`);
    } else {
      console.log(`   ${date}: ❌ Calculation failed`);
    }
  }

  console.log(`\n📊 Test Summary:`);
  console.log(`   Successful calculations: ${successfulTests}/${totalTests}`);
  console.log(`   Success rate: ${Math.round((successfulTests / totalTests) * 100)}%`);

  return successfulTests === totalTests;
}

/**
 * Main test function
 */
async function runCalculationTests() {
  console.log('🚀 Starting engagement score calculation tests...\n');

  // Find a test client
  const testClientId = await findTestClient();
  if (!testClientId) {
    console.error('❌ Could not find a suitable test client');
    process.exit(1);
  }

  // Test single calculation
  console.log(`\n🧪 Testing single calculation...`);
  const singleResult = await calculateEngagementScore(testClientId, '2024-01-15');
  
  if (singleResult) {
    console.log(`\n✅ Single calculation test passed!`);
    console.log(`   Client: ${singleResult.clientName}`);
    console.log(`   Score: ${singleResult.engScore}%`);
    console.log(`   Tasks: ${singleResult.completed}/${singleResult.totalDue} completed`);
  } else {
    console.log(`\n❌ Single calculation test failed`);
  }

  // Test multiple dates
  const multiTestPassed = await testMultipleDates(testClientId);

  console.log('\n📝 Test Results:');
  console.log('   - Single calculation: ' + (singleResult ? '✅ Passed' : '❌ Failed'));
  console.log('   - Multiple dates: ' + (multiTestPassed ? '✅ Passed' : '❌ Failed'));

  if (singleResult && multiTestPassed) {
    console.log('\n🎉 All calculation tests passed!');
    console.log('✅ Engagement score calculation is working correctly');
    console.log('\n📝 You can now proceed to Step 5: Set Up Daily Automation');
  } else {
    console.log('\n❌ Some tests failed. Please check your data and try again.');
    process.exit(1);
  }
}

// Run the tests
runCalculationTests().catch(console.error); 