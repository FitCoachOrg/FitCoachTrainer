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

async function testUnifiedWorkflow() {
  console.log('🧪 Testing Unified Workflow Implementation\n');

  const clientId = 34;
  const testDate = new Date('2025-08-31');

  try {
    console.log('1️⃣ Testing Weekly Status Logic');
    console.log('Client ID:', clientId);
    console.log('Test Date:', testDate.toISOString().split('T')[0]);
    
    // Test weekly status
    const weeklyStartDate = new Date(testDate);
    const weeklyEndDate = new Date(testDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    
    console.log('Weekly date range:', weeklyStartDate.toISOString().split('T')[0], 'to', weeklyEndDate.toISOString().split('T')[0]);
    
    // Get data from both tables
    const { data: previewData, error: previewError } = await supabase
      .from('schedule_preview')
      .select('id, for_date, details_json, is_approved')
      .eq('client_id', clientId)
      .eq('type', 'workout')
      .gte('for_date', weeklyStartDate.toISOString().split('T')[0])
      .lte('for_date', weeklyEndDate.toISOString().split('T')[0]);
    
    if (previewError) {
      console.error('❌ Error fetching preview data:', previewError);
    } else {
      console.log('✅ Preview data:', previewData?.length || 0, 'entries');
      if (previewData && previewData.length > 0) {
        console.log('   Preview dates:', previewData.map(row => row.for_date));
      }
    }
    
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('schedule')
      .select('id, for_date, details_json')
      .eq('client_id', clientId)
      .eq('type', 'workout')
      .gte('for_date', weeklyStartDate.toISOString().split('T')[0])
      .lte('for_date', weeklyEndDate.toISOString().split('T')[0]);
    
    if (scheduleError) {
      console.error('❌ Error fetching schedule data:', scheduleError);
    } else {
      console.log('✅ Schedule data:', scheduleData?.length || 0, 'entries');
      if (scheduleData && scheduleData.length > 0) {
        console.log('   Schedule dates:', scheduleData.map(row => row.for_date));
      }
    }
    
    // Determine status manually
    let status = 'no_plan';
    let source = 'database';
    
    if (!previewData || previewData.length === 0) {
      if (scheduleData && scheduleData.length > 0) {
        status = 'approved';
        source = 'database';
        console.log('📊 Status: Approved (only schedule data exists)');
      } else {
        status = 'no_plan';
        source = 'database';
        console.log('📊 Status: No Plan (no data in either table)');
      }
    } else {
      if (!scheduleData || scheduleData.length === 0) {
        status = 'draft';
        source = 'generated';
        console.log('📊 Status: Draft (only preview data exists)');
      } else {
        // Check if data matches
        const dataMatches = compareData(previewData, scheduleData);
        if (dataMatches) {
          status = 'approved';
          source = 'database';
          console.log('📊 Status: Approved (data matches between tables)');
        } else {
          status = 'draft';
          source = 'generated';
          console.log('📊 Status: Draft (data differs between tables)');
        }
      }
    }
    
    console.log('\n2️⃣ Testing Monthly Status Logic');
    
    // Test monthly status (28 days)
    const monthlyEndDate = new Date(testDate.getTime() + 27 * 24 * 60 * 60 * 1000);
    
    console.log('Monthly date range:', testDate.toISOString().split('T')[0], 'to', monthlyEndDate.toISOString().split('T')[0]);
    
    // Get monthly data
    const { data: monthlyPreviewData, error: monthlyPreviewError } = await supabase
      .from('schedule_preview')
      .select('id, for_date, details_json, is_approved')
      .eq('client_id', clientId)
      .eq('type', 'workout')
      .gte('for_date', testDate.toISOString().split('T')[0])
      .lte('for_date', monthlyEndDate.toISOString().split('T')[0]);
    
    if (monthlyPreviewError) {
      console.error('❌ Error fetching monthly preview data:', monthlyPreviewError);
    } else {
      console.log('✅ Monthly preview data:', monthlyPreviewData?.length || 0, 'entries');
    }
    
    const { data: monthlyScheduleData, error: monthlyScheduleError } = await supabase
      .from('schedule')
      .select('id, for_date, details_json')
      .eq('client_id', clientId)
      .eq('type', 'workout')
      .gte('for_date', testDate.toISOString().split('T')[0])
      .lte('for_date', monthlyEndDate.toISOString().split('T')[0]);
    
    if (monthlyScheduleError) {
      console.error('❌ Error fetching monthly schedule data:', monthlyScheduleError);
    } else {
      console.log('✅ Monthly schedule data:', monthlyScheduleData?.length || 0, 'entries');
    }
    
    // Analyze weekly breakdown
    console.log('\n3️⃣ Weekly Breakdown Analysis');
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
      
      let weekStatus = 'no_plan';
      if (weekPreviewData.length > 0 || weekScheduleData.length > 0) {
        if (weekPreviewData.length > 0 && weekScheduleData.length > 0) {
          weekStatus = compareData(weekPreviewData, weekScheduleData) ? 'approved' : 'draft';
        } else if (weekPreviewData.length > 0) {
          weekStatus = 'draft';
        } else {
          weekStatus = 'approved';
        }
      }
      
      weeklyBreakdown.push({
        week: week + 1,
        status: weekStatus,
        startDate: weekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0],
        previewCount: weekPreviewData.length,
        scheduleCount: weekScheduleData.length
      });
      
      console.log(`   Week ${week + 1}: ${weekStatus} (${weekPreviewData.length} preview, ${weekScheduleData.length} schedule)`);
    }
    
    // Determine overall monthly status
    const approvedWeeks = weeklyBreakdown.filter(w => w.status === 'approved').length;
    const draftWeeks = weeklyBreakdown.filter(w => w.status === 'draft').length;
    const noPlanWeeks = weeklyBreakdown.filter(w => w.status === 'no_plan').length;
    
    let overallStatus = 'no_plan';
    if (approvedWeeks === 4) {
      overallStatus = 'approved';
    } else if (draftWeeks > 0) {
      overallStatus = 'draft';
    } else if (noPlanWeeks === 4) {
      overallStatus = 'no_plan';
    } else {
      overallStatus = 'partial_approved';
    }
    
    console.log(`\n📊 Overall Monthly Status: ${overallStatus}`);
    console.log(`   Approved weeks: ${approvedWeeks}/4`);
    console.log(`   Draft weeks: ${draftWeeks}/4`);
    console.log(`   No plan weeks: ${noPlanWeeks}/4`);
    
    console.log('\n✅ Unified Workflow Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Helper function to compare data between tables
function compareData(previewData, scheduleData) {
  if (previewData.length !== scheduleData.length) {
    return false;
  }
  
  // Sort both arrays by date for comparison
  const sortedPreview = previewData.sort((a, b) => a.for_date.localeCompare(b.for_date));
  const sortedSchedule = scheduleData.sort((a, b) => a.for_date.localeCompare(b.for_date));
  
  for (let i = 0; i < sortedPreview.length; i++) {
    const preview = sortedPreview[i];
    const schedule = sortedSchedule[i];
    
    if (preview.for_date !== schedule.for_date) {
      return false;
    }
    
    // Compare details_json (the actual workout data)
    const previewJson = JSON.stringify(preview.details_json);
    const scheduleJson = JSON.stringify(schedule.details_json);
    
    if (previewJson !== scheduleJson) {
      return false;
    }
  }
  
  return true;
}

// Run the test
testUnifiedWorkflow();

