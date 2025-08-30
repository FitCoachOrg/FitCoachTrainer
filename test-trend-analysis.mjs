#!/usr/bin/env node

/**
 * Test Script: Enhanced Trend Analysis with Detailed Data Values
 * 
 * This script demonstrates the new trend analysis functionality that shows:
 * - First half and second half data values for all performance metrics
 * - "No data available" instead of 0 when data is missing
 * - Detailed trend analysis with actual values
 */

// Mock data to simulate real-world scenarios
const mockActivityData = [
  // Morning Energy data (Energy Level activity)
  { activity: 'Energy Level', qty: 4, created_at: '2025-07-01T08:00:00Z' },
  { activity: 'Energy Level', qty: 5, created_at: '2025-07-03T08:00:00Z' },
  { activity: 'Energy Level', qty: 4, created_at: '2025-07-05T08:00:00Z' },
  { activity: 'Energy Level', qty: 5, created_at: '2025-07-07T08:00:00Z' },
  { activity: 'Energy Level', qty: 4, created_at: '2025-07-09T08:00:00Z' },
  { activity: 'Energy Level', qty: 5, created_at: '2025-07-11T08:00:00Z' },
  { activity: 'Energy Level', qty: 4, created_at: '2025-07-13T08:00:00Z' },
  { activity: 'Energy Level', qty: 3, created_at: '2025-07-15T08:00:00Z' },
  { activity: 'Energy Level', qty: 2, created_at: '2025-07-17T08:00:00Z' },
  { activity: 'Energy Level', qty: 3, created_at: '2025-07-19T08:00:00Z' },
  { activity: 'Energy Level', qty: 2, created_at: '2025-07-21T08:00:00Z' },
  { activity: 'Energy Level', qty: 3, created_at: '2025-07-23T08:00:00Z' },
  { activity: 'Energy Level', qty: 2, created_at: '2025-07-25T08:00:00Z' },
  { activity: 'Energy Level', qty: 3, created_at: '2025-07-27T08:00:00Z' },
  { activity: 'Energy Level', qty: 2, created_at: '2025-07-29T08:00:00Z' },
  
  // Weight data
  { activity: 'weight', qty: 70, created_at: '2025-07-01T08:00:00Z' },
  { activity: 'weight', qty: 69.5, created_at: '2025-07-08T08:00:00Z' },
  { activity: 'weight', qty: 69, created_at: '2025-07-15T08:00:00Z' },
  { activity: 'weight', qty: 68.5, created_at: '2025-07-22T08:00:00Z' },
  { activity: 'weight', qty: 68, created_at: '2025-07-29T08:00:00Z' },
  
  // Steps data (some missing data)
  { activity: 'steps', qty: 8000, created_at: '2025-07-01T08:00:00Z' },
  { activity: 'steps', qty: 8500, created_at: '2025-07-03T08:00:00Z' },
  { activity: 'steps', qty: 9000, created_at: '2025-07-05T08:00:00Z' },
  { activity: 'steps', qty: 9500, created_at: '2025-07-07T08:00:00Z' },
  { activity: 'steps', qty: 10000, created_at: '2025-07-09T08:00:00Z' },
  { activity: 'steps', qty: 10500, created_at: '2025-07-11T08:00:00Z' },
  { activity: 'steps', qty: 11000, created_at: '2025-07-13T08:00:00Z' },
  { activity: 'steps', qty: 11500, created_at: '2025-07-15T08:00:00Z' },
  { activity: 'steps', qty: 12000, created_at: '2025-07-17T08:00:00Z' },
  { activity: 'steps', qty: 12500, created_at: '2025-07-19T08:00:00Z' },
  { activity: 'steps', qty: 13000, created_at: '2025-07-21T08:00:00Z' },
  { activity: 'steps', qty: 13500, created_at: '2025-07-23T08:00:00Z' },
  { activity: 'steps', qty: 14000, created_at: '2025-07-25T08:00:00Z' },
  { activity: 'steps', qty: 14500, created_at: '2025-07-27T08:00:00Z' },
  { activity: 'steps', qty: 15000, created_at: '2025-07-29T08:00:00Z' },
];

// Mock meal data
const mockMealData = [
  { created_at: '2025-07-01T12:00:00Z', protein: 25, carbs: 45, fat: 15 },
  { created_at: '2025-07-02T12:00:00Z', protein: 30, carbs: 40, fat: 20 },
  { created_at: '2025-07-03T12:00:00Z', protein: 28, carbs: 42, fat: 18 },
  { created_at: '2025-07-04T12:00:00Z', protein: 32, carbs: 38, fat: 22 },
  { created_at: '2025-07-05T12:00:00Z', protein: 26, carbs: 44, fat: 16 },
  { created_at: '2025-07-06T12:00:00Z', protein: 29, carbs: 41, fat: 19 },
  { created_at: '2025-07-07T12:00:00Z', protein: 31, carbs: 39, fat: 21 },
  { created_at: '2025-07-08T12:00:00Z', protein: 27, carbs: 43, fat: 17 },
  { created_at: '2025-07-09T12:00:00Z', protein: 33, carbs: 37, fat: 23 },
  { created_at: '2025-07-10T12:00:00Z', protein: 24, carbs: 46, fat: 14 },
];

// Mock workout data
const mockWorkoutData = [
  { created_at: '2025-07-01T18:00:00Z', duration: 45, calories_burned: 300 },
  { created_at: '2025-07-03T18:00:00Z', duration: 50, calories_burned: 350 },
  { created_at: '2025-07-05T18:00:00Z', duration: 55, calories_burned: 400 },
  { created_at: '2025-07-07T18:00:00Z', duration: 60, calories_burned: 450 },
  { created_at: '2025-07-09T18:00:00Z', duration: 65, calories_burned: 500 },
  { created_at: '2025-07-11T18:00:00Z', duration: 70, calories_burned: 550 },
  { created_at: '2025-07-13T18:00:00Z', duration: 75, calories_burned: 600 },
  { created_at: '2025-07-15T18:00:00Z', duration: 80, calories_burned: 650 },
  { created_at: '2025-07-17T18:00:00Z', duration: 85, calories_burned: 700 },
  { created_at: '2025-07-19T18:00:00Z', duration: 90, calories_burned: 750 },
  { created_at: '2025-07-21T18:00:00Z', duration: 95, calories_burned: 800 },
  { created_at: '2025-07-23T18:00:00Z', duration: 100, calories_burned: 850 },
  { created_at: '2025-07-25T18:00:00Z', duration: 105, calories_burned: 900 },
  { created_at: '2025-07-27T18:00:00Z', duration: 110, calories_burned: 950 },
  { created_at: '2025-07-29T18:00:00Z', duration: 115, calories_burned: 1000 },
];

// Mock engagement data
const mockEngagementData = [
  { eng_score: 75, for_date: '2025-07-01' },
  { eng_score: 78, for_date: '2025-07-08' },
  { eng_score: 82, for_date: '2025-07-15' },
  { eng_score: 85, for_date: '2025-07-22' },
  { eng_score: 88, for_date: '2025-07-29' },
];

// Simplified trend calculation function (based on the actual implementation)
function calculateTrend(data) {
  if (data.length < 2) {
    return {
      trend: 'stable',
      firstHalfData: [],
      secondHalfData: [],
      firstAvg: 0,
      secondAvg: 0,
      change: 0,
      dataAvailable: false
    };
  }
  
  const sortedData = data.sort((a, b) => new Date(a.created_at || a.for_date).getTime() - new Date(b.created_at || b.for_date).getTime());
  const firstHalf = sortedData.slice(0, Math.floor(sortedData.length / 2));
  const secondHalf = sortedData.slice(Math.floor(sortedData.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, d) => sum + (d.qty || d.eng_score || 0), 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, d) => sum + (d.qty || d.eng_score || 0), 0) / secondHalf.length;
  
  if (firstAvg === 0) {
    return {
      trend: 'stable',
      firstHalfData: firstHalf,
      secondHalfData: secondHalf,
      firstAvg: 0,
      secondAvg: secondAvg,
      change: 0,
      dataAvailable: true
    };
  }
  
  const change = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  let trend;
  if (change > 5) trend = 'up';
  else if (change < -5) trend = 'down';
  else trend = 'stable';
  
  return {
    trend,
    firstHalfData: firstHalf,
    secondHalfData: secondHalf,
    firstAvg,
    secondAvg,
    change,
    dataAvailable: true
  };
}

// Process metrics with trend analysis
function processMetrics() {
  console.log('📊 ENHANCED TREND ANALYSIS DEMONSTRATION\n');
  console.log('This shows first half and second half data values for all performance metrics\n');
  
  // Morning Energy (Energy Level)
  const energyData = mockActivityData.filter(item => item.activity === 'Energy Level');
  const energyTrend = calculateTrend(energyData);
  
  console.log('🔋 MORNING ENERGY (Energy Level):');
  if (!energyTrend.dataAvailable) {
    console.log('   Status: No data available');
  } else {
    const firstHalfValues = energyTrend.firstHalfData.map(d => d.qty).join(', ');
    const secondHalfValues = energyTrend.secondHalfData.map(d => d.qty).join(', ');
    
    console.log(`   First Half: [${firstHalfValues}] (Avg: ${energyTrend.firstAvg.toFixed(2)} stars)`);
    console.log(`   Second Half: [${secondHalfValues}] (Avg: ${energyTrend.secondAvg.toFixed(2)} stars)`);
    console.log(`   Change: ${energyTrend.change.toFixed(1)}%`);
    console.log(`   Trend: ${energyTrend.trend.toUpperCase()}`);
    console.log(`   Interpretation: Morning energy is ${energyTrend.trend === 'down' ? 'DECLINING' : energyTrend.trend === 'up' ? 'IMPROVING' : 'STABLE'}`);
  }
  console.log('');
  
  // Weight
  const weightData = mockActivityData.filter(item => item.activity === 'weight');
  const weightTrend = calculateTrend(weightData);
  
  console.log('⚖️ WEIGHT:');
  if (!weightTrend.dataAvailable) {
    console.log('   Status: No data available');
  } else {
    const firstHalfValues = weightTrend.firstHalfData.map(d => d.qty).join(', ');
    const secondHalfValues = weightTrend.secondHalfData.map(d => d.qty).join(', ');
    
    console.log(`   First Half: [${firstHalfValues}] (Avg: ${weightTrend.firstAvg.toFixed(2)} kg)`);
    console.log(`   Second Half: [${secondHalfValues}] (Avg: ${weightTrend.secondAvg.toFixed(2)} kg)`);
    console.log(`   Change: ${weightTrend.change.toFixed(1)}%`);
    console.log(`   Trend: ${weightTrend.trend.toUpperCase()}`);
    console.log(`   Interpretation: Weight is ${weightTrend.trend === 'down' ? 'DECREASING' : weightTrend.trend === 'up' ? 'INCREASING' : 'STABLE'}`);
  }
  console.log('');
  
  // Steps
  const stepsData = mockActivityData.filter(item => item.activity === 'steps');
  const stepsTrend = calculateTrend(stepsData);
  
  console.log('👟 STEPS:');
  if (!stepsTrend.dataAvailable) {
    console.log('   Status: No data available');
  } else {
    const firstHalfValues = stepsTrend.firstHalfData.map(d => d.qty).join(', ');
    const secondHalfValues = stepsTrend.secondHalfData.map(d => d.qty).join(', ');
    
    console.log(`   First Half: [${firstHalfValues}] (Avg: ${stepsTrend.firstAvg.toFixed(0)} steps)`);
    console.log(`   Second Half: [${secondHalfValues}] (Avg: ${stepsTrend.secondAvg.toFixed(0)} steps)`);
    console.log(`   Change: ${stepsTrend.change.toFixed(1)}%`);
    console.log(`   Trend: ${stepsTrend.trend.toUpperCase()}`);
    console.log(`   Interpretation: Daily steps are ${stepsTrend.trend === 'up' ? 'INCREASING' : stepsTrend.trend === 'down' ? 'DECREASING' : 'STABLE'}`);
  }
  console.log('');
  
  // Protein Intake (from meal data)
  const proteinData = mockMealData.map(item => ({ ...item, qty: item.protein }));
  const proteinTrend = calculateTrend(proteinData);
  
  console.log('🥩 PROTEIN INTAKE:');
  if (!proteinTrend.dataAvailable) {
    console.log('   Status: No data available');
  } else {
    const firstHalfValues = proteinTrend.firstHalfData.map(d => d.qty).join(', ');
    const secondHalfValues = proteinTrend.secondHalfData.map(d => d.qty).join(', ');
    
    console.log(`   First Half: [${firstHalfValues}] (Avg: ${proteinTrend.firstAvg.toFixed(1)}g)`);
    console.log(`   Second Half: [${secondHalfValues}] (Avg: ${proteinTrend.secondAvg.toFixed(1)}g)`);
    console.log(`   Change: ${proteinTrend.change.toFixed(1)}%`);
    console.log(`   Trend: ${proteinTrend.trend.toUpperCase()}`);
    console.log(`   Interpretation: Protein intake is ${proteinTrend.trend === 'up' ? 'INCREASING' : proteinTrend.trend === 'down' ? 'DECREASING' : 'STABLE'}`);
  }
  console.log('');
  
  // Workout Duration
  const durationData = mockWorkoutData.map(item => ({ ...item, qty: item.duration }));
  const durationTrend = calculateTrend(durationData);
  
  console.log('💪 WORKOUT DURATION:');
  if (!durationTrend.dataAvailable) {
    console.log('   Status: No data available');
  } else {
    const firstHalfValues = durationTrend.firstHalfData.map(d => d.qty).join(', ');
    const secondHalfValues = durationTrend.secondHalfData.map(d => d.qty).join(', ');
    
    console.log(`   First Half: [${firstHalfValues}] (Avg: ${durationTrend.firstAvg.toFixed(0)} min)`);
    console.log(`   Second Half: [${secondHalfValues}] (Avg: ${durationTrend.secondAvg.toFixed(0)} min)`);
    console.log(`   Change: ${durationTrend.change.toFixed(1)}%`);
    console.log(`   Trend: ${durationTrend.trend.toUpperCase()}`);
    console.log(`   Interpretation: Workout duration is ${durationTrend.trend === 'up' ? 'INCREASING' : durationTrend.trend === 'down' ? 'DECREASING' : 'STABLE'}`);
  }
  console.log('');
  
  // Engagement Score
  const engagementTrend = calculateTrend(mockEngagementData);
  
  console.log('📈 ENGAGEMENT SCORE:');
  if (!engagementTrend.dataAvailable) {
    console.log('   Status: No data available');
  } else {
    const firstHalfValues = engagementTrend.firstHalfData.map(d => d.eng_score).join(', ');
    const secondHalfValues = engagementTrend.secondHalfData.map(d => d.eng_score).join(', ');
    
    console.log(`   First Half: [${firstHalfValues}] (Avg: ${engagementTrend.firstAvg.toFixed(1)} points)`);
    console.log(`   Second Half: [${secondHalfValues}] (Avg: ${engagementTrend.secondAvg.toFixed(1)} points)`);
    console.log(`   Change: ${engagementTrend.change.toFixed(1)}%`);
    console.log(`   Trend: ${engagementTrend.trend.toUpperCase()}`);
    console.log(`   Interpretation: Engagement is ${engagementTrend.trend === 'up' ? 'IMPROVING' : engagementTrend.trend === 'down' ? 'DECLINING' : 'STABLE'}`);
  }
  console.log('');
  
  // Example with no data
  console.log('❌ METRIC WITH NO DATA (Sleep Quality):');
  console.log('   Status: No data available');
  console.log('   Note: Shows "No data available" instead of 0');
  console.log('');
  
  console.log('🎯 SUMMARY:');
  console.log('✅ Enhanced trend analysis now shows:');
  console.log('   - First half and second half actual data values');
  console.log('   - Average values for each half');
  console.log('   - Percentage change calculation');
  console.log('   - Clear trend classification (UP/DOWN/STABLE)');
  console.log('   - "No data available" for missing data');
  console.log('   - Detailed interpretation for each metric');
}

// Run the demonstration
processMetrics();

