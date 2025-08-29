/**
 * Test Script for New KPIs
 * 
 * This script tests the new KPIs that were added to the metrics system:
 * - BMI from activity_info where activity = 'BMI'
 * - Stress from activity_info where activity = 'stress'
 * - Engagement Level from client_engagement_score table (eng_score field)
 * - Calories from meal_info table (calories field)
 * - Workout Time from workout_info table (duration field)
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

async function testNewKPIs() {
  console.log('🧪 Testing New KPIs Implementation...\n')
  
  // Test client ID (you can change this to test with a specific client)
  const testClientId = 1
  
  try {
    // 1. Test BMI data from activity_info
    console.log('📊 Testing BMI data...')
    const { data: bmiData, error: bmiError } = await supabase
      .from('activity_info')
      .select('*')
      .eq('client_id', testClientId)
      .eq('activity', 'BMI')
      .order('created_at', { ascending: true })
    
    if (bmiError) {
      console.error('❌ BMI data error:', bmiError)
    } else {
      console.log(`✅ BMI data: ${bmiData?.length || 0} records`)
      if (bmiData && bmiData.length > 0) {
        console.log('Sample BMI record:', bmiData[0])
      }
    }
    
    // 2. Test Stress data from activity_info
    console.log('\n📊 Testing Stress data...')
    const { data: stressData, error: stressError } = await supabase
      .from('activity_info')
      .select('*')
      .eq('client_id', testClientId)
      .eq('activity', 'stress')
      .order('created_at', { ascending: true })
    
    if (stressError) {
      console.error('❌ Stress data error:', stressError)
    } else {
      console.log(`✅ Stress data: ${stressData?.length || 0} records`)
      if (stressData && stressData.length > 0) {
        console.log('Sample Stress record:', stressData[0])
      }
    }
    
    // 3. Test Engagement data from client_engagement_score
    console.log('\n📊 Testing Engagement data...')
    const { data: engagementData, error: engagementError } = await supabase
      .from('client_engagement_score')
      .select('*')
      .eq('client_id', testClientId)
      .order('for_date', { ascending: true })
    
    if (engagementError) {
      console.error('❌ Engagement data error:', engagementError)
    } else {
      console.log(`✅ Engagement data: ${engagementData?.length || 0} records`)
      if (engagementData && engagementData.length > 0) {
        console.log('Sample Engagement record:', engagementData[0])
      }
    }
    
    // 4. Test Calories data from meal_info
    console.log('\n📊 Testing Calories data...')
    const { data: caloriesData, error: caloriesError } = await supabase
      .from('meal_info')
      .select('*')
      .eq('client_id', testClientId)
      .order('created_at', { ascending: true })
    
    if (caloriesError) {
      console.error('❌ Calories data error:', caloriesError)
    } else {
      console.log(`✅ Calories data: ${caloriesData?.length || 0} records`)
      if (caloriesData && caloriesData.length > 0) {
        console.log('Sample Calories record:', caloriesData[0])
      }
    }
    
    // 5. Test Workout Time data from workout_info
    console.log('\n📊 Testing Workout Time data...')
    const { data: workoutData, error: workoutError } = await supabase
      .from('workout_info')
      .select('*')
      .eq('client_id', testClientId)
      .order('created_at', { ascending: true })
    
    if (workoutError) {
      console.error('❌ Workout Time data error:', workoutError)
    } else {
      console.log(`✅ Workout Time data: ${workoutData?.length || 0} records`)
      if (workoutData && workoutData.length > 0) {
        console.log('Sample Workout Time record:', workoutData[0])
      }
    }
    
    // 6. Test METRIC_LIBRARY configuration
    console.log('\n📊 Testing METRIC_LIBRARY configuration...')
    const { METRIC_LIBRARY } = await import('./client/src/lib/metrics-library.ts')
    
    const newMetrics = METRIC_LIBRARY.filter(metric => 
      ['bmi', 'stress', 'engagementLevel', 'calories', 'workoutTime'].includes(metric.key)
    )
    
    console.log(`✅ Found ${newMetrics.length} new metrics in METRIC_LIBRARY:`)
    newMetrics.forEach(metric => {
      console.log(`  - ${metric.label} (${metric.key}): ${metric.dataSource} -> ${metric.columnName || metric.activityName}`)
    })
    
    console.log('\n🎉 New KPIs test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testNewKPIs() 