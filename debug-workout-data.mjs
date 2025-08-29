/**
 * Debug Script for Workout Data
 * 
 * This script helps debug why workout data might not be showing for all days
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugWorkoutData() {
  console.log('🔍 Debugging Workout Data...\n')
  
  const testClientId = 34; // Using the client ID from your query
  const startDate = '2025-07-27';
  const endDate = '2025-08-04';
  
  try {
    // 1. Fetch raw workout data
    console.log('📊 Fetching raw workout data...');
    const { data: workoutData, error: workoutError } = await supabase
      .from('workout_info')
      .select('*')
      .eq('client_id', testClientId)
      .gte('created_at', startDate)
      .lt('created_at', endDate)
      .order('created_at', { ascending: true });
    
    if (workoutError) {
      console.error('❌ Workout data error:', workoutError);
      return;
    }
    
    console.log(`✅ Found ${workoutData?.length || 0} workout records`);
    
    if (workoutData && workoutData.length > 0) {
      console.log('\n📅 Raw workout data:');
      workoutData.forEach((record, index) => {
        const date = new Date(record.created_at);
        console.log(`  ${index + 1}. ${date.toISOString().split('T')[0]} - ${record.duration} minutes`);
      });
    }
    
    // 2. Test the manual query logic
    console.log('\n🧮 Testing manual query logic...');
    const dailyTotals = {};
    
    if (workoutData) {
      workoutData.forEach(record => {
        const date = new Date(record.created_at);
        const dateKey = date.toISOString().split('T')[0];
        const displayDate = date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
        
        if (record.duration && !isNaN(Number(record.duration))) {
          if (!dailyTotals[displayDate]) {
            dailyTotals[displayDate] = 0;
          }
          dailyTotals[displayDate] += Number(record.duration);
        }
      });
    }
    
    console.log('\n📊 Daily totals (sum of all workouts per day):');
    Object.entries(dailyTotals).forEach(([date, total]) => {
      console.log(`  ${date}: ${total} minutes`);
    });
    
    // 3. Generate complete timeline for 7D
    console.log('\n📅 Complete timeline for 7D:');
    const today = new Date();
    const timeline = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const displayDate = date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
      timeline.push({
        date: displayDate,
        fullDate: dateStr,
        qty: dailyTotals[displayDate] || null
      });
    }
    
    timeline.forEach(item => {
      console.log(`  ${item.date}: ${item.qty || 'null'} minutes`);
    });
    
    // 4. Check if data is being filtered out
    console.log('\n🔍 Checking data filtering...');
    console.log(`Start date: ${startDate}`);
    console.log(`End date: ${endDate}`);
    console.log(`Client ID: ${testClientId}`);
    
    if (workoutData && workoutData.length > 0) {
      const firstRecord = workoutData[0];
      const lastRecord = workoutData[workoutData.length - 1];
      console.log(`First record date: ${firstRecord.created_at}`);
      console.log(`Last record date: ${lastRecord.created_at}`);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugWorkoutData() 