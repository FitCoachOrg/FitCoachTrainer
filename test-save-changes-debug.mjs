#!/usr/bin/env node

/**
 * Test Script: Save Changes Debug
 * 
 * This script tests the actual database operations to identify why
 * the schedule_preview table is not updating despite UI showing success.
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

async function testSaveChangesDebug() {
  console.log('🔍 Testing Save Changes Debug...\n');

  try {
    // Test 1: Check current schedule_preview data
    console.log('1️⃣ Checking current schedule_preview data...');
    const { data: currentData, error: currentError } = await supabase
      .from('schedule_preview')
      .select('*')
      .eq('client_id', 34)
      .eq('type', 'workout')
      .order('for_date', { ascending: true });

    if (currentError) {
      console.error('❌ Error fetching current data:', currentError);
      return;
    }

    console.log(`📊 Found ${currentData?.length || 0} existing records`);
    if (currentData && currentData.length > 0) {
      console.log('📋 Sample record:', {
        id: currentData[0].id,
        client_id: currentData[0].client_id,
        for_date: currentData[0].for_date,
        type: currentData[0].type,
        task: currentData[0].task,
        summary: currentData[0].summary,
        is_approved: currentData[0].is_approved
      });
    }

    // Test 2: Test insert operation
    console.log('\n2️⃣ Testing insert operation...');
    const testRecord = {
      client_id: 34,
      type: 'workout',
      task: 'workout',
      summary: 'Test Workout - Debug Save',
      for_date: '2025-01-15',
      for_time: '08:00:00',
      icon: 'dumbell',
      details_json: {
        focus: 'Test Focus',
        exercises: [{
          exercise: 'Test Exercise',
          category: 'Test Category',
          body_part: 'Test Body Part',
          sets: '3',
          reps: '10',
          rest: '60',
          weight: 'Test Weight',
          duration: '15',
          equipment: 'Test Equipment',
          coach_tip: 'Test Tip',
          video_link: '',
          tempo: '',
          order: 1
        }]
      },
      is_approved: false
    };

    const { data: insertData, error: insertError } = await supabase
      .from('schedule_preview')
      .insert(testRecord)
      .select('id');

    if (insertError) {
      console.error('❌ Insert error:', insertError);
      console.error('Insert error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
    } else {
      console.log('✅ Insert successful:', insertData);
    }

    // Test 3: Test update operation
    console.log('\n3️⃣ Testing update operation...');
    if (insertData && insertData.length > 0) {
      const recordId = insertData[0].id;
      const { data: updateData, error: updateError } = await supabase
        .from('schedule_preview')
        .update({ summary: 'Test Workout - Updated' })
        .eq('id', recordId)
        .select('id, summary');

      if (updateError) {
        console.error('❌ Update error:', updateError);
      } else {
        console.log('✅ Update successful:', updateData);
      }

      // Test 4: Test delete operation (cleanup)
      console.log('\n4️⃣ Testing delete operation (cleanup)...');
      const { error: deleteError } = await supabase
        .from('schedule_preview')
        .delete()
        .eq('id', recordId);

      if (deleteError) {
        console.error('❌ Delete error:', deleteError);
      } else {
        console.log('✅ Delete successful (cleanup completed)');
      }
    }

    // Test 5: Test batch operations
    console.log('\n5️⃣ Testing batch operations...');
    const batchRecords = [
      {
        client_id: 34,
        type: 'workout',
        task: 'workout',
        summary: 'Batch Test 1',
        for_date: '2025-01-16',
        for_time: '08:00:00',
        icon: 'dumbell',
        details_json: { focus: 'Batch Test 1' },
        is_approved: false
      },
      {
        client_id: 34,
        type: 'workout',
        task: 'workout',
        summary: 'Batch Test 2',
        for_date: '2025-01-17',
        for_time: '08:00:00',
        icon: 'dumbell',
        details_json: { focus: 'Batch Test 2' },
        is_approved: false
      }
    ];

    const { data: batchData, error: batchError } = await supabase
      .from('schedule_preview')
      .insert(batchRecords)
      .select('id');

    if (batchError) {
      console.error('❌ Batch insert error:', batchError);
    } else {
      console.log('✅ Batch insert successful:', batchData);

      // Cleanup batch records
      if (batchData && batchData.length > 0) {
        const ids = batchData.map(record => record.id);
        const { error: batchDeleteError } = await supabase
          .from('schedule_preview')
          .delete()
          .in('id', ids);

        if (batchDeleteError) {
          console.error('❌ Batch delete error:', batchDeleteError);
        } else {
          console.log('✅ Batch delete successful (cleanup completed)');
        }
      }
    }

    // Test 6: Check RLS policies
    console.log('\n6️⃣ Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'schedule_preview' });

    if (policiesError) {
      console.log('⚠️ Could not check RLS policies (function may not exist)');
    } else {
      console.log('📋 RLS Policies:', policies);
    }

    console.log('\n✅ Save Changes Debug Test Completed');

  } catch (error) {
    console.error('❌ Test failed with exception:', error);
  }
}

// Run the test
testSaveChangesDebug().catch(console.error);
