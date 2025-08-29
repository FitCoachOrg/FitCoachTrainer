#!/usr/bin/env node

/**
 * Debug Script for Engagement Score Calculation
 * This script will help identify why the engagement table isn't getting updated
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Debugging Engagement Score Calculation...\n');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing environment variables:');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function debugEngagementCalculation() {
  try {
    console.log('🚀 Starting debug process...\n');

    // 1. Test database connection
    console.log('1️⃣ Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('client')
      .select('client_id, name')
      .limit(1);

    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return;
    }
    console.log('✅ Database connection successful\n');

    // 2. Check if clients exist
    console.log('2️⃣ Checking for active clients...');
    const { data: clients, error: clientError } = await supabase
      .from('client')
      .select('client_id, name, is_active')
      .eq('is_active', true);

    if (clientError) {
      console.error('❌ Error fetching clients:', clientError);
      return;
    }

    console.log(`✅ Found ${clients.length} active clients:`);
    clients.forEach(client => {
      console.log(`   - ${client.name} (ID: ${client.client_id})`);
    });

    if (clients.length === 0) {
      console.error('❌ No active clients found! This is why no scores are being calculated.');
      return;
    }

    // 3. Check schedule data
    console.log('\n3️⃣ Checking schedule data...');
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedule')
      .select('id, client_id, status, for_date')
      .limit(10);

    if (scheduleError) {
      console.error('❌ Error fetching schedules:', scheduleError);
      return;
    }

    console.log(`✅ Found ${schedules.length} schedule entries:`);
    schedules.forEach(schedule => {
      console.log(`   - Client ${schedule.client_id}: ${schedule.status} on ${schedule.for_date}`);
    });

    if (schedules.length === 0) {
      console.error('❌ No schedule data found! This is why no scores are being calculated.');
      return;
    }

    // 4. Check existing engagement scores
    console.log('\n4️⃣ Checking existing engagement scores...');
    const { data: existingScores, error: scoreError } = await supabase
      .from('client_engagement_score')
      .select('client_id, for_date, eng_score')
      .order('created_at', { ascending: false })
      .limit(5);

    if (scoreError) {
      console.error('❌ Error fetching engagement scores:', scoreError);
      return;
    }

    console.log(`✅ Found ${existingScores.length} existing engagement scores:`);
    existingScores.forEach(score => {
      console.log(`   - Client ${score.client_id}: ${score.eng_score}% on ${score.for_date}`);
    });

    // 5. Test calculation for a specific client and date
    console.log('\n5️⃣ Testing calculation for a specific client...');
    const testClient = clients[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const testDate = yesterday.toISOString().slice(0, 10);

    console.log(`Testing calculation for ${testClient.name} on ${testDate}...`);

    // Check if score already exists
    const { data: existing, error: existingError } = await supabase
      .from('client_engagement_score')
      .select('id')
      .eq('client_id', testClient.client_id)
      .eq('for_date', testDate)
      .maybeSingle();

    if (existingError) {
      console.error('❌ Error checking existing score:', existingError);
      return;
    }

    if (existing) {
      console.log(`⏭️  Score already exists for ${testClient.name} on ${testDate}`);
    } else {
      console.log(`📝 No existing score found for ${testClient.name} on ${testDate}`);
    }

    // Get schedules for this client and date
    const { data: clientSchedules, error: clientScheduleError } = await supabase
      .from('schedule')
      .select('id, status, for_date')
      .eq('client_id', testClient.client_id)
      .eq('for_date', testDate);

    if (clientScheduleError) {
      console.error('❌ Error fetching client schedules:', clientScheduleError);
      return;
    }

    console.log(`📋 Found ${clientSchedules.length} schedules for ${testClient.name} on ${testDate}:`);
    clientSchedules.forEach(schedule => {
      console.log(`   - ${schedule.status} (ID: ${schedule.id})`);
    });

    const totalDue = clientSchedules.length;
    const completed = clientSchedules.filter(s => s.status === 'completed').length;
    const engScore = totalDue > 0 ? Math.round((completed / totalDue) * 100) : null;

    console.log(`📊 Calculation result: ${engScore}% (${completed}/${totalDue} tasks completed)`);

    // 6. Test insertion
    if (totalDue > 0 || engScore !== null) {
      console.log('\n6️⃣ Testing score insertion...');
      
      const { error: insertError } = await supabase
        .from('client_engagement_score')
        .insert({
          for_date: testDate,
          eng_score: engScore,
          client_id: testClient.client_id,
          total_due: totalDue,
          completed: completed
        });

      if (insertError) {
        console.error('❌ Error inserting score:', insertError);
      } else {
        console.log('✅ Score inserted successfully!');
      }
    }

    // 7. Summary
    console.log('\n📊 Debug Summary:');
    console.log(`   - Active clients: ${clients.length}`);
    console.log(`   - Schedule entries: ${schedules.length}`);
    console.log(`   - Existing scores: ${existingScores.length}`);
    console.log(`   - Test client: ${testClient.name}`);
    console.log(`   - Test date: ${testDate}`);
    console.log(`   - Test result: ${engScore}% (${completed}/${totalDue})`);

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug
debugEngagementCalculation().catch(console.error); 