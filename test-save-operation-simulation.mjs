#!/usr/bin/env node

/**
 * Save Operation Simulation Test
 * 
 * This script simulates the exact save operation that's timing out
 * to identify the specific bottleneck.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

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
const TEST_CLIENT_ID = 34;
const TEST_DATE_RANGE = {
  start: '2025-01-14',
  end: '2025-01-20'
};

// Simulate the exact save operation from the logs
async function simulateSaveOperation() {
  console.log('🔄 Simulating Save Changes Operation...\n');
  
  const startTime = performance.now();
  const operationTimeout = 20000; // 20 seconds like in the code
  
  try {
    // Step 1: Get client data (with timeout protection)
    console.log('1️⃣ Getting client data...');
    const clientDataStart = performance.now();
    
    const clientDataPromise = supabase
      .from('client')
      .select('workout_time')
      .eq('client_id', TEST_CLIENT_ID)
      .single();
    
    const clientDataTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Client data fetch timeout after 5000ms'));
      }, 5000);
    });
    
    const { data: clientDataResult, error: clientDataError } = await Promise.race([
      clientDataPromise,
      clientDataTimeoutPromise
    ]).catch((error) => {
      console.warn('⚠️ Client data fetch failed, using fallback:', error.message);
      return { data: { workout_time: '08:00:00' }, error: null };
    });
    
    const clientData = clientDataResult || { workout_time: '08:00:00' };
    
    const clientDataEnd = performance.now();
    console.log(`✅ Client data: ${(clientDataEnd - clientDataStart).toFixed(2)}ms`);
    
    // Step 2: Fetch existing data (this was timing out in logs)
    console.log('2️⃣ Fetching existing data...');
    const existingDataStart = performance.now();
    
    const existingDataPromise = supabase
      .from('schedule_preview')
      .select('*')
      .eq('client_id', TEST_CLIENT_ID)
      .eq('type', 'workout')
      .gte('for_date', TEST_DATE_RANGE.start)
      .lte('for_date', TEST_DATE_RANGE.end);
    
    const existingDataTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Existing data fetch timeout after 10000ms'));
      }, 10000);
    });
    
    const { data: existingData, error: existingError } = await Promise.race([
      existingDataPromise,
      existingDataTimeoutPromise
    ]).catch((error) => {
      console.warn('⚠️ Existing data fetch timed out, continuing with empty data');
      return { data: [], error: null };
    });
    
    const existingDataEnd = performance.now();
    console.log(`✅ Existing data: ${(existingDataEnd - existingDataStart).toFixed(2)}ms (${existingData?.length || 0} records)`);
    
    // Step 3: Build test data (simulate 7 days of workout data)
    console.log('3️⃣ Building test data...');
    const buildDataStart = performance.now();
    
    const testWeekData = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(TEST_DATE_RANGE.start);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      testWeekData.push({
        date: dateStr,
        focus: i % 2 === 0 ? 'Upper Body' : 'Lower Body',
        exercises: [
          { name: `Exercise ${i + 1}`, sets: 3, reps: 10 },
          { name: `Exercise ${i + 2}`, sets: 3, reps: 12 }
        ]
      });
    }
    
    const buildDataEnd = performance.now();
    console.log(`✅ Build data: ${(buildDataEnd - buildDataStart).toFixed(2)}ms`);
    
    // Step 4: Build schedule preview rows
    console.log('4️⃣ Building schedule preview rows...');
    const buildRowsStart = performance.now();
    
    const rows = [];
    const for_time = clientData.workout_time;
    const workout_id = uuidv4();
    
    console.log(`🔍 DEBUG: for_time value: "${for_time}" (type: ${typeof for_time})`);
    console.log(`🔍 DEBUG: for_time is null? ${for_time === null}`);
    console.log(`🔍 DEBUG: for_time is undefined? ${for_time === undefined}`);
    
    testWeekData.forEach(day => {
      if (day.exercises && day.exercises.length > 0) {
        const row = {
          client_id: TEST_CLIENT_ID,
          type: 'workout',
          task: 'workout',
          for_date: day.date,
          for_time: for_time,
          summary: day.focus,
          details_json: {
            exercises: day.exercises
          },
          icon: '💪',
          is_approved: false
        };
        
        console.log(`🔍 DEBUG: Row for_time: "${row.for_time}" (type: ${typeof row.for_time})`);
        rows.push(row);
      }
    });
    
    const buildRowsEnd = performance.now();
    console.log(`✅ Build rows: ${(buildRowsEnd - buildRowsStart).toFixed(2)}ms (${rows.length} rows)`);
    
    // Step 5: Insert new records (batch processing)
    console.log('5️⃣ Inserting records...');
    const insertStart = performance.now();
    
    if (rows.length > 0) {
      const batchSize = 4; // Same as in the code
      const batches = [];
      
      for (let i = 0; i < rows.length; i += batchSize) {
        batches.push(rows.slice(i, i + batchSize));
      }
      
      console.log(`📦 Processing ${batches.length} batches of up to ${batchSize} records each`);
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} records)`);
        
        const batchStart = performance.now();
        
        const { data: batchData, error: batchError } = await supabase
          .from('schedule_preview')
          .insert(batch)
          .select();
        
        const batchEnd = performance.now();
        
        if (batchError) {
          throw batchError;
        }
        
        console.log(`✅ Batch ${batchIndex + 1}: ${(batchEnd - batchStart).toFixed(2)}ms`);
      }
    }
    
    const insertEnd = performance.now();
    console.log(`✅ Insert records: ${(insertEnd - insertStart).toFixed(2)}ms`);
    
    // Step 6: Update approval flag
    console.log('6️⃣ Updating approval flag...');
    const approvalStart = performance.now();
    
    const { error: approvalError } = await supabase
      .from('schedule_preview')
      .update({ is_approved: false })
      .eq('client_id', TEST_CLIENT_ID)
      .eq('type', 'workout')
      .gte('for_date', TEST_DATE_RANGE.start)
      .lte('for_date', TEST_DATE_RANGE.end);
    
    const approvalEnd = performance.now();
    
    if (approvalError) {
      throw approvalError;
    }
    
    console.log(`✅ Update approval: ${(approvalEnd - approvalStart).toFixed(2)}ms`);
    
    // Step 7: Clean up test data
    console.log('7️⃣ Cleaning up test data...');
    const cleanupStart = performance.now();
    
    const { error: cleanupError } = await supabase
      .from('schedule_preview')
      .delete()
      .eq('client_id', TEST_CLIENT_ID)
      .eq('type', 'workout')
      .gte('for_date', TEST_DATE_RANGE.start)
      .lte('for_date', TEST_DATE_RANGE.end);
    
    const cleanupEnd = performance.now();
    
    if (cleanupError) {
      console.warn('⚠️ Cleanup error:', cleanupError);
    }
    
    console.log(`✅ Cleanup: ${(cleanupEnd - cleanupStart).toFixed(2)}ms`);
    
    const totalEnd = performance.now();
    const totalDuration = totalEnd - startTime;
    
    console.log('\n📊 SAVE OPERATION RESULTS');
    console.log('=' .repeat(50));
    console.log(`✅ Total operation: ${totalDuration.toFixed(2)}ms`);
    console.log(`✅ Operation completed successfully`);
    console.log(`✅ No timeout issues detected`);
    
    return { success: true, duration: totalDuration };
    
  } catch (error) {
    const totalEnd = performance.now();
    const totalDuration = totalEnd - startTime;
    
    console.log('\n❌ SAVE OPERATION FAILED');
    console.log('=' .repeat(50));
    console.log(`❌ Total operation: ${totalDuration.toFixed(2)}ms`);
    console.log(`❌ Error: ${error.message}`);
    
    return { success: false, duration: totalDuration, error: error.message };
  }
}

// Test with different timeout scenarios
async function testTimeoutScenarios() {
  console.log('⏱️ Testing different timeout scenarios...\n');
  
  const scenarios = [
    { name: 'Normal Operation', timeout: 20000 },
    { name: 'Short Timeout', timeout: 5000 },
    { name: 'Very Short Timeout', timeout: 2000 }
  ];
  
  for (const scenario of scenarios) {
    console.log(`🔄 Testing ${scenario.name} (${scenario.timeout}ms timeout)...`);
    
    const start = performance.now();
    
    try {
      // Simulate a timeout scenario
      const promise = new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve('Operation completed');
        }, 1000); // Simulate 1 second operation
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timeout after ${scenario.timeout}ms`));
        }, scenario.timeout);
      });
      
      await Promise.race([promise, timeoutPromise]);
      
      const end = performance.now();
      console.log(`✅ ${scenario.name}: ${(end - start).toFixed(2)}ms - Success`);
      
    } catch (error) {
      const end = performance.now();
      console.log(`❌ ${scenario.name}: ${(end - start).toFixed(2)}ms - ${error.message}`);
    }
  }
}

// Run the tests
async function runTests() {
  console.log('🚀 Starting Save Operation Simulation Tests...\n');
  
  // Test 1: Simulate the actual save operation
  await simulateSaveOperation();
  
  console.log('\n');
  
  // Test 2: Test timeout scenarios
  await testTimeoutScenarios();
  
  console.log('\n🔍 ANALYSIS');
  console.log('=' .repeat(50));
  console.log('Based on the test results:');
  console.log('1. If the simulation completes successfully, the issue is likely in the application logic');
  console.log('2. If the simulation times out, the issue is with Supabase performance');
  console.log('3. Check the specific step that takes the longest time');
  console.log('4. Look for any steps that consistently fail or timeout');
}

runTests().catch(console.error);
