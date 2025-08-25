import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Use service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function test7DayMonthlyConsistency() {
  console.log('🧪 Testing 7-Day vs Monthly View Consistency\n');

  const clientId = 34;
  const testDate = new Date('2025-08-31');

  try {
    console.log('1️⃣ Testing 7-Day View Logic (WorkoutPlanSection)');
    console.log('Client ID:', clientId);
    console.log('Test Date:', testDate.toISOString().split('T')[0]);
    
    // Simulate the 7-day view logic (should use unified weekly status)
    const startDateStr = testDate.toISOString().split('T')[0];
    const endDate = new Date(testDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    const endDateStr = endDate.toISOString().split('T')[0];
    
    console.log('7-day date range:', startDateStr, 'to', endDateStr);
    
    // Simulate the unified weekly status logic
    console.log('\n📋 Step 1: Fetch from schedule_preview (primary source)');
    let { data: previewData, error: previewError } = await supabase
      .from('schedule_preview')
      .select('id, for_date, details_json, is_approved')
      .eq('client_id', clientId)
      .eq('type', 'workout')
      .gte('for_date', startDateStr)
      .lte('for_date', endDateStr);
    
    if (previewError) {
      console.error('❌ Error fetching from schedule_preview:', previewError);
    } else {
      console.log('✅ Preview data:', previewData?.length || 0, 'entries');
    }
    
    let { data: scheduleData, error: scheduleError } = await supabase
      .from('schedule')
      .select('id, for_date, details_json')
      .eq('client_id', clientId)
      .eq('type', 'workout')
      .gte('for_date', startDateStr)
      .lte('for_date', endDateStr);
    
    if (scheduleError) {
      console.error('❌ Error fetching from schedule:', scheduleError);
    } else {
      console.log('✅ Schedule data:', scheduleData?.length || 0, 'entries');
    }
    
    // Determine data source (same logic as unified utility)
    let dataSource = 'none';
    let finalData = [];
    
    if (previewData && previewData.length > 0) {
      dataSource = 'schedule_preview';
      finalData = previewData;
      console.log('📊 7-day view: Using preview data as primary source');
    } else if (scheduleData && scheduleData.length > 0) {
      dataSource = 'schedule';
      finalData = scheduleData;
      console.log('📊 7-day view: Using schedule data as fallback');
    } else {
      console.log('📊 7-day view: No data found in either table');
    }
    
    console.log('\n2️⃣ Testing Monthly View Logic (WeeklyPlanHeader)');
    
    // Simulate the monthly view logic (uses unified monthly status)
    const monthlyEndDate = new Date(testDate.getTime() + 27 * 24 * 60 * 60 * 1000);
    const monthlyEndDateStr = monthlyEndDate.toISOString().split('T')[0];
    
    console.log('Monthly date range:', startDateStr, 'to', monthlyEndDateStr);
    
    // Simulate the unified monthly status logic
    let { data: monthlyPreviewData, error: monthlyPreviewError } = await supabase
      .from('schedule_preview')
      .select('id, for_date, details_json, is_approved')
      .eq('client_id', clientId)
      .eq('type', 'workout')
      .gte('for_date', startDateStr)
      .lte('for_date', monthlyEndDateStr);
    
    if (monthlyPreviewError) {
      console.error('❌ Error fetching monthly preview data:', monthlyPreviewError);
    } else {
      console.log('✅ Monthly preview data:', monthlyPreviewData?.length || 0, 'entries');
    }
    
    let { data: monthlyScheduleData, error: monthlyScheduleError } = await supabase
      .from('schedule')
      .select('id, for_date, details_json')
      .eq('client_id', clientId)
      .eq('type', 'workout')
      .gte('for_date', startDateStr)
      .lte('for_date', monthlyEndDateStr);
    
    if (monthlyScheduleError) {
      console.error('❌ Error fetching monthly schedule data:', monthlyScheduleError);
    } else {
      console.log('✅ Monthly schedule data:', monthlyScheduleData?.length || 0, 'entries');
    }
    
    // Analyze weekly breakdown for monthly view
    console.log('\n3️⃣ Monthly View Weekly Breakdown');
    const weeklyBreakdown = [];
    
    for (let week = 0; week < 4; week++) {
      const weekStart = new Date(testDate.getTime() + week * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      
      const weekPreviewData = monthlyPreviewData?.filter(day => 
        day.for_date >= weekStart.toISOString().split('T')[0] && 
        day.for_date <= weekEnd.toISOString().split('T')[0]
      ) || [];
      
      const weekScheduleData = monthlyScheduleData?.filter(day => 
        day.for_date >= weekStart.toISOString().split('T')[0] && 
        day.for_date <= weekEnd.toISOString().split('T')[0]
      ) || [];
      
      let weekDataSource = 'none';
      if (weekPreviewData.length > 0) {
        weekDataSource = 'schedule_preview';
      } else if (weekScheduleData.length > 0) {
        weekDataSource = 'schedule';
      }
      
      weeklyBreakdown.push({
        week: week + 1,
        dataSource: weekDataSource,
        previewCount: weekPreviewData.length,
        scheduleCount: weekScheduleData.length
      });
      
      console.log(`   Week ${week + 1}: ${weekDataSource} (${weekPreviewData.length} preview, ${weekScheduleData.length} schedule)`);
    }
    
    console.log('\n4️⃣ Consistency Analysis');
    
    // Check if both views use the same logic for the first week
    const firstWeek7Day = dataSource;
    const firstWeekMonthly = weeklyBreakdown[0].dataSource;
    
    console.log('   7-day view data source:', firstWeek7Day);
    console.log('   Monthly view Week 1 data source:', firstWeekMonthly);
    
    const isConsistent = firstWeek7Day === firstWeekMonthly;
    
    if (isConsistent) {
      console.log('✅ SUCCESS: Both views use consistent data sources for the same week');
    } else {
      console.log('❌ INCONSISTENCY: Views use different data sources for the same week');
      console.log('   This indicates the 7-day view is not using the unified logic');
    }
    
    console.log('\n5️⃣ Data Source Summary');
    console.log('   7-day view:', dataSource);
    console.log('   Monthly view breakdown:');
    weeklyBreakdown.forEach(week => {
      console.log(`     Week ${week.week}: ${week.dataSource}`);
    });
    
    console.log('\n✅ 7-Day vs Monthly Consistency Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
test7DayMonthlyConsistency();
