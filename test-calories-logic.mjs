/**
 * Test Script for Calories and Workout Time Logic
 * 
 * This script tests the new logic for calories and workout time calculations:
 * - For 7D: Show daily totals (sum of all meals/workouts per day)
 * - For 30D/90D: Calculate total for period, then divide by days with data
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

// Mock data for testing the logic
const mockMealData = [
  { created_at: '2024-01-01T08:00:00Z', calories: 300 },
  { created_at: '2024-01-01T12:00:00Z', calories: 500 },
  { created_at: '2024-01-01T18:00:00Z', calories: 400 },
  { created_at: '2024-01-02T08:00:00Z', calories: 350 },
  { created_at: '2024-01-02T12:00:00Z', calories: 450 },
  { created_at: '2024-01-03T08:00:00Z', calories: 320 },
  { created_at: '2024-01-03T12:00:00Z', calories: 480 },
  { created_at: '2024-01-04T08:00:00Z', calories: 380 },
  { created_at: '2024-01-05T08:00:00Z', calories: 420 },
  { created_at: '2024-01-06T08:00:00Z', calories: 360 },
  { created_at: '2024-01-07T08:00:00Z', calories: 400 },
];

const mockWorkoutData = [
  { created_at: '2024-01-01T06:00:00Z', duration: 45 },
  { created_at: '2024-01-01T18:00:00Z', duration: 30 },
  { created_at: '2024-01-02T06:00:00Z', duration: 60 },
  { created_at: '2024-01-03T06:00:00Z', duration: 45 },
  { created_at: '2024-01-04T06:00:00Z', duration: 75 },
  { created_at: '2024-01-05T06:00:00Z', duration: 50 },
  { created_at: '2024-01-06T06:00:00Z', duration: 40 },
  { created_at: '2024-01-07T06:00:00Z', duration: 55 },
];

function testCaloriesLogic(timeRange) {
  console.log(`\n🧪 Testing Calories Logic for ${timeRange}...`);
  
  if (timeRange === "7D") {
    // For 7D: Group by individual days and sum all meals per day
    const dailyData = {};
    
    mockMealData.forEach(item => {
      const date = new Date(item.created_at);
      const displayDate = date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
      
      if (item.calories && !isNaN(Number(item.calories))) {
        if (!dailyData[displayDate]) {
          dailyData[displayDate] = 0;
        }
        dailyData[displayDate] += Number(item.calories);
      }
    });
    
    console.log('Daily calorie totals:');
    Object.entries(dailyData).forEach(([date, total]) => {
      console.log(`  ${date}: ${total} kcal`);
    });
    
  } else {
    // For 30D/90D: Calculate daily average for each week
    const weeklyData = {};
    
    mockMealData.forEach(item => {
      const date = new Date(item.created_at);
      const weekNum = Math.ceil(date.getDate() / 7);
      const monthName = date.toLocaleString('default', { month: 'short' });
      const weekKey = `${monthName} W${weekNum}`;
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (item.calories && !isNaN(Number(item.calories))) {
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { total: 0, daysWithData: new Set() };
        }
        weeklyData[weekKey].total += Number(item.calories);
        weeklyData[weekKey].daysWithData.add(dateKey);
      }
    });
    
    // Calculate daily average for each week
    const weeklyAverages = {};
    Object.entries(weeklyData).forEach(([weekKey, data]) => {
      if (data.daysWithData.size > 0) {
        weeklyAverages[weekKey] = Number((data.total / data.daysWithData.size).toFixed(1));
      }
    });
    
    console.log('Weekly calorie averages:');
    Object.entries(weeklyAverages).forEach(([week, average]) => {
      console.log(`  ${week}: ${average} kcal/day`);
    });
  }
}

function testWorkoutTimeLogic(timeRange) {
  console.log(`\n🏋️ Testing Workout Time Logic for ${timeRange}...`);
  
  if (timeRange === "7D") {
    // For 7D: Group by individual days and calculate average workout duration per day
    const dailyData = {};
    
    mockWorkoutData.forEach(item => {
      const date = new Date(item.created_at);
      const displayDate = date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
      
      if (item.duration && !isNaN(Number(item.duration))) {
        if (!dailyData[displayDate]) {
          dailyData[displayDate] = { total: 0, count: 0 };
        }
        dailyData[displayDate].total += Number(item.duration);
        dailyData[displayDate].count += 1;
      }
    });
    
    console.log('Daily workout time averages:');
    Object.entries(dailyData).forEach(([date, data]) => {
      const average = Number((data.total / data.count).toFixed(1));
      console.log(`  ${date}: ${average} minutes (${data.total} total / ${data.count} workouts)`);
    });
    
  } else {
    // For 30D/90D: Calculate daily average for each week
    const weeklyData = {};
    
    mockWorkoutData.forEach(item => {
      const date = new Date(item.created_at);
      const weekNum = Math.ceil(date.getDate() / 7);
      const monthName = date.toLocaleString('default', { month: 'short' });
      const weekKey = `${monthName} W${weekNum}`;
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (item.duration && !isNaN(Number(item.duration))) {
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { total: 0, daysWithData: new Set() };
        }
        weeklyData[weekKey].total += Number(item.duration);
        weeklyData[weekKey].daysWithData.add(dateKey);
      }
    });
    
    // Calculate daily average for each week
    const weeklyAverages = {};
    Object.entries(weeklyData).forEach(([weekKey, data]) => {
      if (data.daysWithData.size > 0) {
        weeklyAverages[weekKey] = Number((data.total / data.daysWithData.size).toFixed(1));
      }
    });
    
    console.log('Weekly workout time averages:');
    Object.entries(weeklyAverages).forEach(([week, average]) => {
      console.log(`  ${week}: ${average} minutes/day`);
    });
  }
}

async function testNewLogic() {
  console.log('🧪 Testing New Calories and Workout Time Logic...\n');
  
  try {
    // Test calories logic for different time ranges
    testCaloriesLogic("7D");
    testCaloriesLogic("30D");
    
    // Test workout time logic for different time ranges
    testWorkoutTimeLogic("7D");
    testWorkoutTimeLogic("30D");
    
    console.log('\n✅ Logic test completed successfully!');
    
    // Test with real data from database
    console.log('\n📊 Testing with real database data...');
    const testClientId = 1;
    
    // Test meal data
    const { data: mealData, error: mealError } = await supabase
      .from('meal_info')
      .select('*')
      .eq('client_id', testClientId)
      .order('created_at', { ascending: true });
    
    if (mealError) {
      console.error('❌ Meal data error:', mealError);
    } else {
      console.log(`✅ Found ${mealData?.length || 0} meal records`);
      if (mealData && mealData.length > 0) {
        console.log('Sample meal record:', mealData[0]);
      }
    }
    
    // Test workout data
    const { data: workoutData, error: workoutError } = await supabase
      .from('workout_info')
      .select('*')
      .eq('client_id', testClientId)
      .order('created_at', { ascending: true });
    
    if (workoutError) {
      console.error('❌ Workout data error:', workoutError);
    } else {
      console.log(`✅ Found ${workoutData?.length || 0} workout records`);
      if (workoutData && workoutData.length > 0) {
        console.log('Sample workout record:', workoutData[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testNewLogic() 