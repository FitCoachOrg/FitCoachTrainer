#!/usr/bin/env node

/**
 * Debug Script for Engagement Score Calculation (Fixed)
 * This script will work with your actual table structure
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Debugging Engagement Score Calculation (Fixed)...\n');

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

    // 1. Test database connection and check table structure
    console.log('1️⃣ Testing database connection and table structure...');
    
    // First, let's see what columns exist in the client table
    const { data: clientColumns, error: columnError } = await supabase
      .from('client')
      .select('*')
      .limit(1);

    if (columnError) {
      console.error('❌ Error accessing client table:', columnError);
      return;
    }
    
    console.log('✅ Database connection successful');
    console.log('📋 Client table columns:', Object.keys(clientColumns[0] || {}));

    // 2. Check if clients exist (using available columns)
    console.log('\n2️⃣ Checking for clients...');
    const { data: clients, error: clientError } = await supabase
      .from('client')
      .select('*')
      .limit(10);

    if (clientError) {
      console.error('❌ Error fetching clients:', clientError);
      return;
    }

    console.log(`✅ Found ${clients.length} clients:`);
    clients.forEach((client, index) => {
      console.log(`   ${index + 1}. Client ID: ${client.client_id || client.id || 'N/A'}`);
      // Show available fields
      Object.keys(client).forEach(key => {
        if (key !== 'client_id' && key !== 'id') {
          console.log(`      ${key}: ${client[key]}`);
        }
      });
    });

    if (clients.length === 0) {
      console.error('❌ No clients found! This is why no scores are being calculated.');
      return;
    }

    // 3. Check schedule data
    console.log('\n3️⃣ Checking schedule data...');
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedule')
      .select('*')
      .limit(10);

    if (scheduleError) {
      console.error('❌ Error fetching schedules:', scheduleError);
      return;
    }

    console.log(`✅ Found ${schedules.length} schedule entries:`);
    schedules.forEach((schedule, index) => {
      console.log(`   ${index + 1}. Schedule ID: ${schedule.id}`);
      Object.keys(schedule).forEach(key => {
        if (key !== 'id') {
          console.log(`      ${key}: ${schedule[key]}`);
        }
      });
    });

    if (schedules.length === 0) {
      console.error('❌ No schedule data found! This is why no scores are being calculated.');
      return;
    }

    // 4. Check existing engagement scores
    console.log('\n4️⃣ Checking existing engagement scores...');
    const { data: existingScores, error: scoreError } = await supabase
      .from('client_engagement_score')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (scoreError) {
      console.error('❌ Error fetching engagement scores:', scoreError);
      return;
    }

    console.log(`✅ Found ${existingScores.length} existing engagement scores:`);
    existingScores.forEach((score, index) => {
      console.log(`   ${index + 1}. Score ID: ${score.id}`);
      Object.keys(score).forEach(key => {
        if (key !== 'id') {
          console.log(`      ${key}: ${score[key]}`);
        }
      });
    });

    // 5. Test calculation for a specific client and date
    console.log('\n5️⃣ Testing calculation for a specific client...');
    const testClient = clients[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const testDate = yesterday.toISOString().slice(0, 10);

    const clientId = testClient.client_id || testClient.id;
    console.log(`Testing calculation for client ${clientId} on ${testDate}...`);

    // Check if score already exists
    const { data: existing, error: existingError } = await supabase
      .from('client_engagement_score')
      .select('id')
      .eq('client_id', clientId)
      .eq('for_date', testDate)
      .maybeSingle();

    if (existingError) {
      console.error('❌ Error checking existing score:', existingError);
      return;
    }

    if (existing) {
      console.log(`⏭️  Score already exists for client ${clientId} on ${testDate}`);
    } else {
      console.log(`📝 No existing score found for client ${clientId} on ${testDate}`);
    }

    // Get schedules for this client and date
    const { data: clientSchedules, error: clientScheduleError } = await supabase
      .from('schedule')
      .select('*')
      .eq('client_id', clientId)
      .eq('for_date', testDate);

    if (clientScheduleError) {
      console.error('❌ Error fetching client schedules:', clientScheduleError);
      return;
    }

    console.log(`📋 Found ${clientSchedules.length} schedules for client ${clientId} on ${testDate}:`);
    clientSchedules.forEach((schedule, index) => {
      console.log(`   ${index + 1}. Schedule ID: ${schedule.id}`);
      Object.keys(schedule).forEach(key => {
        if (key !== 'id') {
          console.log(`      ${key}: ${schedule[key]}`);
        }
      });
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
          client_id: clientId,
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
    console.log(`   - Total clients: ${clients.length}`);
    console.log(`   - Schedule entries: ${schedules.length}`);
    console.log(`   - Existing scores: ${existingScores.length}`);
    console.log(`   - Test client ID: ${clientId}`);
    console.log(`   - Test date: ${testDate}`);
    console.log(`   - Test result: ${engScore}% (${completed}/${totalDue})`);

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug
debugEngagementCalculation().catch(console.error); 