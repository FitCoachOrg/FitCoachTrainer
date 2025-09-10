#!/usr/bin/env node

/**
 * Supabase Performance Test Script
 * 
 * This script tests various Supabase operations to identify bottlenecks
 * and timeout issues in the save operations.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test configuration
const TEST_CLIENT_ID = 34; // Use the client ID from your logs
const TEST_DATE_RANGE = {
  start: '2025-01-14',
  end: '2025-01-20'
};

// Performance test results
const results = {
  connection: null,
  clientFetch: null,
  schedulePreviewSelect: null,
  schedulePreviewInsert: null,
  schedulePreviewUpdate: null,
  schedulePreviewDelete: null,
  scheduleSelect: null,
  batchOperations: null
};

async function testConnection() {
  console.log('🔌 Testing Supabase connection...');
  const start = performance.now();
  
  try {
    const { data, error } = await supabase
      .from('client')
      .select('client_id')
      .limit(1);
    
    const end = performance.now();
    const duration = end - start;
    
    if (error) {
      throw error;
    }
    
    results.connection = {
      success: true,
      duration: duration,
      message: `Connection successful in ${duration.toFixed(2)}ms`
    };
    
    console.log(`✅ Connection test: ${duration.toFixed(2)}ms`);
    return true;
  } catch (error) {
    const end = performance.now();
    const duration = end - start;
    
    results.connection = {
      success: false,
      duration: duration,
      error: error.message,
      message: `Connection failed: ${error.message}`
    };
    
    console.log(`❌ Connection test failed: ${error.message}`);
    return false;
  }
}

async function testClientFetch() {
  console.log('👤 Testing client data fetch...');
  const start = performance.now();
  
  try {
    const { data, error } = await supabase
      .from('client')
      .select('client_id, workout_time')
      .eq('client_id', TEST_CLIENT_ID)
      .single();
    
    const end = performance.now();
    const duration = end - start;
    
    if (error) {
      throw error;
    }
    
    results.clientFetch = {
      success: true,
      duration: duration,
      data: data,
      message: `Client fetch successful in ${duration.toFixed(2)}ms`
    };
    
    console.log(`✅ Client fetch: ${duration.toFixed(2)}ms`);
    return data;
  } catch (error) {
    const end = performance.now();
    const duration = end - start;
    
    results.clientFetch = {
      success: false,
      duration: duration,
      error: error.message,
      message: `Client fetch failed: ${error.message}`
    };
    
    console.log(`❌ Client fetch failed: ${error.message}`);
    return null;
  }
}

async function testSchedulePreviewSelect() {
  console.log('📋 Testing schedule_preview SELECT...');
  const start = performance.now();
  
  try {
    const { data, error } = await supabase
      .from('schedule_preview')
      .select('*')
      .eq('client_id', TEST_CLIENT_ID)
      .eq('type', 'workout')
      .gte('for_date', TEST_DATE_RANGE.start)
      .lte('for_date', TEST_DATE_RANGE.end);
    
    const end = performance.now();
    const duration = end - start;
    
    if (error) {
      throw error;
    }
    
    results.schedulePreviewSelect = {
      success: true,
      duration: duration,
      recordCount: data?.length || 0,
      message: `Schedule preview select successful in ${duration.toFixed(2)}ms (${data?.length || 0} records)`
    };
    
    console.log(`✅ Schedule preview select: ${duration.toFixed(2)}ms (${data?.length || 0} records)`);
    return data;
  } catch (error) {
    const end = performance.now();
    const duration = end - start;
    
    results.schedulePreviewSelect = {
      success: false,
      duration: duration,
      error: error.message,
      message: `Schedule preview select failed: ${error.message}`
    };
    
    console.log(`❌ Schedule preview select failed: ${error.message}`);
    return null;
  }
}

async function testSchedulePreviewInsert() {
  console.log('➕ Testing schedule_preview INSERT...');
  const start = performance.now();
  
  try {
    const testRecord = {
      client_id: TEST_CLIENT_ID,
      type: 'workout',
      task: 'Test Workout',
      for_date: TEST_DATE_RANGE.start,
      for_time: '08:00:00',
      summary: 'Performance Test Workout',
      details_json: {
        exercises: [
          { name: 'Test Exercise', sets: 3, reps: 10 }
        ]
      },
      icon: '💪',
      is_approved: false
    };
    
    const { data, error } = await supabase
      .from('schedule_preview')
      .insert([testRecord])
      .select();
    
    const end = performance.now();
    const duration = end - start;
    
    if (error) {
      throw error;
    }
    
    results.schedulePreviewInsert = {
      success: true,
      duration: duration,
      insertedId: data?.[0]?.id,
      message: `Schedule preview insert successful in ${duration.toFixed(2)}ms`
    };
    
    console.log(`✅ Schedule preview insert: ${duration.toFixed(2)}ms`);
    return data?.[0]?.id;
  } catch (error) {
    const end = performance.now();
    const duration = end - start;
    
    results.schedulePreviewInsert = {
      success: false,
      duration: duration,
      error: error.message,
      message: `Schedule preview insert failed: ${error.message}`
    };
    
    console.log(`❌ Schedule preview insert failed: ${error.message}`);
    return null;
  }
}

async function testSchedulePreviewUpdate(recordId) {
  if (!recordId) {
    console.log('⏭️ Skipping update test - no record ID');
    return;
  }
  
  console.log('✏️ Testing schedule_preview UPDATE...');
  const start = performance.now();
  
  try {
    const { data, error } = await supabase
      .from('schedule_preview')
      .update({ summary: 'Updated Performance Test Workout' })
      .eq('id', recordId)
      .select();
    
    const end = performance.now();
    const duration = end - start;
    
    if (error) {
      throw error;
    }
    
    results.schedulePreviewUpdate = {
      success: true,
      duration: duration,
      message: `Schedule preview update successful in ${duration.toFixed(2)}ms`
    };
    
    console.log(`✅ Schedule preview update: ${duration.toFixed(2)}ms`);
  } catch (error) {
    const end = performance.now();
    const duration = end - start;
    
    results.schedulePreviewUpdate = {
      success: false,
      duration: duration,
      error: error.message,
      message: `Schedule preview update failed: ${error.message}`
    };
    
    console.log(`❌ Schedule preview update failed: ${error.message}`);
  }
}

async function testSchedulePreviewDelete(recordId) {
  if (!recordId) {
    console.log('⏭️ Skipping delete test - no record ID');
    return;
  }
  
  console.log('🗑️ Testing schedule_preview DELETE...');
  const start = performance.now();
  
  try {
    const { data, error } = await supabase
      .from('schedule_preview')
      .delete()
      .eq('id', recordId);
    
    const end = performance.now();
    const duration = end - start;
    
    if (error) {
      throw error;
    }
    
    results.schedulePreviewDelete = {
      success: true,
      duration: duration,
      message: `Schedule preview delete successful in ${duration.toFixed(2)}ms`
    };
    
    console.log(`✅ Schedule preview delete: ${duration.toFixed(2)}ms`);
  } catch (error) {
    const end = performance.now();
    const duration = end - start;
    
    results.schedulePreviewDelete = {
      success: false,
      duration: duration,
      error: error.message,
      message: `Schedule preview delete failed: ${error.message}`
    };
    
    console.log(`❌ Schedule preview delete failed: ${error.message}`);
  }
}

async function testScheduleSelect() {
  console.log('📅 Testing schedule SELECT...');
  const start = performance.now();
  
  try {
    const { data, error } = await supabase
      .from('schedule')
      .select('*')
      .eq('client_id', TEST_CLIENT_ID)
      .eq('type', 'workout')
      .gte('for_date', TEST_DATE_RANGE.start)
      .lte('for_date', TEST_DATE_RANGE.end);
    
    const end = performance.now();
    const duration = end - start;
    
    if (error) {
      throw error;
    }
    
    results.scheduleSelect = {
      success: true,
      duration: duration,
      recordCount: data?.length || 0,
      message: `Schedule select successful in ${duration.toFixed(2)}ms (${data?.length || 0} records)`
    };
    
    console.log(`✅ Schedule select: ${duration.toFixed(2)}ms (${data?.length || 0} records)`);
    return data;
  } catch (error) {
    const end = performance.now();
    const duration = end - start;
    
    results.scheduleSelect = {
      success: false,
      duration: duration,
      error: error.message,
      message: `Schedule select failed: ${error.message}`
    };
    
    console.log(`❌ Schedule select failed: ${error.message}`);
    return null;
  }
}

async function testBatchOperations() {
  console.log('📦 Testing batch operations...');
  const start = performance.now();
  
  try {
    // Test batch insert
    const batchRecords = [];
    for (let i = 0; i < 5; i++) {
      batchRecords.push({
        client_id: TEST_CLIENT_ID,
        type: 'workout',
        task: `Batch Test Workout ${i + 1}`,
        for_date: TEST_DATE_RANGE.start,
        for_time: '08:00:00',
        summary: `Batch Performance Test ${i + 1}`,
        details_json: {
          exercises: [
            { name: `Batch Exercise ${i + 1}`, sets: 3, reps: 10 }
          ]
        },
        icon: '💪',
        is_approved: false
      });
    }
    
    const { data, error } = await supabase
      .from('schedule_preview')
      .insert(batchRecords)
      .select();
    
    const end = performance.now();
    const duration = end - start;
    
    if (error) {
      throw error;
    }
    
    results.batchOperations = {
      success: true,
      duration: duration,
      recordCount: data?.length || 0,
      message: `Batch operations successful in ${duration.toFixed(2)}ms (${data?.length || 0} records)`
    };
    
    console.log(`✅ Batch operations: ${duration.toFixed(2)}ms (${data?.length || 0} records)`);
    
    // Clean up batch records
    if (data && data.length > 0) {
      const ids = data.map(record => record.id);
      await supabase
        .from('schedule_preview')
        .delete()
        .in('id', ids);
      console.log('🧹 Cleaned up batch test records');
    }
    
    return data;
  } catch (error) {
    const end = performance.now();
    const duration = end - start;
    
    results.batchOperations = {
      success: false,
      duration: duration,
      error: error.message,
      message: `Batch operations failed: ${error.message}`
    };
    
    console.log(`❌ Batch operations failed: ${error.message}`);
    return null;
  }
}

async function runPerformanceTests() {
  console.log('🚀 Starting Supabase Performance Tests...\n');
  
  // Test 1: Connection
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.log('❌ Connection failed, aborting tests');
    return;
  }
  
  console.log('');
  
  // Test 2: Client fetch
  const clientData = await testClientFetch();
  console.log('');
  
  // Test 3: Schedule preview select
  const previewData = await testSchedulePreviewSelect();
  console.log('');
  
  // Test 4: Schedule preview insert
  const insertedId = await testSchedulePreviewInsert();
  console.log('');
  
  // Test 5: Schedule preview update
  await testSchedulePreviewUpdate(insertedId);
  console.log('');
  
  // Test 6: Schedule preview delete
  await testSchedulePreviewDelete(insertedId);
  console.log('');
  
  // Test 7: Schedule select
  await testScheduleSelect();
  console.log('');
  
  // Test 8: Batch operations
  await testBatchOperations();
  console.log('');
  
  // Generate performance report
  generatePerformanceReport();
}

function generatePerformanceReport() {
  console.log('📊 PERFORMANCE TEST RESULTS');
  console.log('=' .repeat(50));
  
  const tests = [
    { name: 'Connection', result: results.connection },
    { name: 'Client Fetch', result: results.clientFetch },
    { name: 'Schedule Preview Select', result: results.schedulePreviewSelect },
    { name: 'Schedule Preview Insert', result: results.schedulePreviewInsert },
    { name: 'Schedule Preview Update', result: results.schedulePreviewUpdate },
    { name: 'Schedule Preview Delete', result: results.schedulePreviewDelete },
    { name: 'Schedule Select', result: results.scheduleSelect },
    { name: 'Batch Operations', result: results.batchOperations }
  ];
  
  tests.forEach(test => {
    if (test.result) {
      const status = test.result.success ? '✅' : '❌';
      const duration = test.result.duration ? `${test.result.duration.toFixed(2)}ms` : 'N/A';
      console.log(`${status} ${test.name}: ${duration}`);
      if (!test.result.success && test.result.error) {
        console.log(`   Error: ${test.result.error}`);
      }
    }
  });
  
  console.log('\n🔍 BOTTLENECK ANALYSIS');
  console.log('=' .repeat(50));
  
  // Find slowest operations
  const successfulTests = tests.filter(test => test.result?.success);
  if (successfulTests.length > 0) {
    successfulTests.sort((a, b) => b.result.duration - a.result.duration);
    
    console.log('Slowest operations:');
    successfulTests.slice(0, 3).forEach((test, index) => {
      console.log(`${index + 1}. ${test.name}: ${test.result.duration.toFixed(2)}ms`);
    });
  }
  
  // Check for timeout issues
  const timeoutTests = tests.filter(test => 
    test.result?.error && test.result.error.includes('timeout')
  );
  
  if (timeoutTests.length > 0) {
    console.log('\n⚠️ TIMEOUT ISSUES DETECTED:');
    timeoutTests.forEach(test => {
      console.log(`- ${test.name}: ${test.result.error}`);
    });
  }
  
  // Performance recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('=' .repeat(50));
  
  const slowTests = successfulTests.filter(test => test.result.duration > 1000);
  if (slowTests.length > 0) {
    console.log('🐌 Slow operations (>1s):');
    slowTests.forEach(test => {
      console.log(`- ${test.name}: ${test.result.duration.toFixed(2)}ms`);
    });
    console.log('Consider optimizing these operations or increasing timeout values.');
  }
  
  const failedTests = tests.filter(test => test.result && !test.result.success);
  if (failedTests.length > 0) {
    console.log('❌ Failed operations:');
    failedTests.forEach(test => {
      console.log(`- ${test.name}: ${test.result.error}`);
    });
    console.log('These operations need immediate attention.');
  }
  
  if (successfulTests.length === tests.length) {
    console.log('✅ All tests passed! No immediate performance issues detected.');
  }
}

// Run the tests
runPerformanceTests().catch(console.error);
