/**
 * Debug Script for Date/Timezone Issues
 * 
 * This script helps debug timezone issues in date handling
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

async function debugDateIssue() {
  console.log('🔍 Debugging Date/Timezone Issues...\n')
  
  const testClientId = 34;
  
  try {
    // Fetch workout data
    const { data: workoutData, error: workoutError } = await supabase
      .from('workout_info')
      .select('*')
      .eq('client_id', testClientId)
      .order('created_at', { ascending: true })
      .limit(10);
    
    if (workoutError) {
      console.error('❌ Workout data error:', workoutError);
      return;
    }
    
    console.log(`✅ Found ${workoutData?.length || 0} workout records`);
    
    if (workoutData && workoutData.length > 0) {
      console.log('\n📅 Detailed date analysis:');
      workoutData.forEach((record, index) => {
        const created_at = record.created_at;
        const date = new Date(created_at);
        const isoString = date.toISOString();
        const localString = date.toString();
        const displayDate = date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
        const utcDate = date.toISOString().split('T')[0];
        
        console.log(`\n  Record ${index + 1}:`);
        console.log(`    Raw created_at: ${created_at}`);
        console.log(`    Date object: ${date}`);
        console.log(`    ISO string: ${isoString}`);
        console.log(`    Local string: ${localString}`);
        console.log(`    Display date: ${displayDate}`);
        console.log(`    UTC date: ${utcDate}`);
        console.log(`    Duration: ${record.duration} minutes`);
      });
    }
    
    // Test the exact logic from MetricsSection
    console.log('\n🧮 Testing MetricsSection logic:');
    const dailyData = {};
    
    if (workoutData) {
      workoutData.forEach((record, index) => {
        const date = new Date(record.created_at);
        const displayDate = date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
        
        console.log(`\n  Processing record ${index + 1}:`);
        console.log(`    Original date: ${record.created_at}`);
        console.log(`    Parsed date: ${date}`);
        console.log(`    Display date: ${displayDate}`);
        
        if (record.duration && !isNaN(Number(record.duration))) {
          if (!dailyData[displayDate]) {
            dailyData[displayDate] = 0;
          }
          dailyData[displayDate] += Number(record.duration);
          console.log(`    Added ${record.duration} to ${displayDate}, total now: ${dailyData[displayDate]}`);
        }
      });
    }
    
    console.log('\n📊 Final daily totals:');
    Object.entries(dailyData).forEach(([date, total]) => {
      console.log(`  ${date}: ${total} minutes`);
    });
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugDateIssue() 