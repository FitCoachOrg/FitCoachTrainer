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

async function testUIConsistency() {
  console.log('🧪 Testing UI Consistency - schedule_preview as Primary Source\n');

  const clientId = 34;
  const testDate = new Date('2025-08-31');
  const startDate = testDate.toISOString().split('T')[0];
  const endDate = new Date(testDate.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  try {
    console.log('1️⃣ Testing useClientSchedule Hook Logic');
    console.log('Client ID:', clientId);
    console.log('Date range:', startDate, 'to', endDate);
    
    // Simulate the useClientSchedule hook logic
    console.log('\n📋 Step 1: Fetch from schedule_preview (primary source)');
    let { data: previewData, error: previewError } = await supabase
      .from('schedule_preview')
      .select('*')
      .eq('client_id', clientId)
      .gte('for_date', startDate)
      .lte('for_date', endDate)
      .order('for_date', { ascending: true });
    
    if (previewError) {
      console.error('❌ Error fetching from schedule_preview:', previewError);
    } else {
      console.log('✅ Preview data:', previewData?.length || 0, 'entries');
      if (previewData && previewData.length > 0) {
        console.log('   Preview dates:', previewData.map(row => row.for_date));
      }
    }
    
    let isFromPreview = true;
    let finalData = previewData || [];
    
    if (!previewData || previewData.length === 0) {
      console.log('\n📋 Step 2: No preview data, falling back to schedule table');
      let { data: scheduleData, error: scheduleError } = await supabase
        .from('schedule')
        .select('*')
        .eq('client_id', clientId)
        .gte('for_date', startDate)
        .lte('for_date', endDate)
        .order('for_date', { ascending: true });
      
      if (scheduleError) {
        console.error('❌ Error fetching from schedule:', scheduleError);
      } else {
        console.log('✅ Schedule data:', scheduleData?.length || 0, 'entries');
        if (scheduleData && scheduleData.length > 0) {
          console.log('   Schedule dates:', scheduleData.map(row => row.for_date));
        }
      }
      
      if (scheduleData && scheduleData.length > 0) {
        finalData = scheduleData;
        isFromPreview = false;
      }
    }
    
    console.log('\n📊 Final Result:');
    console.log('   Data source:', isFromPreview ? 'schedule_preview' : 'schedule');
    console.log('   Total entries:', finalData.length);
    console.log('   Is draft plan:', isFromPreview);
    
    console.log('\n2️⃣ Testing WorkoutPlanSection fetchPlan Logic');
    
    // Simulate the fetchPlan logic
    console.log('\n📋 Step 1: ALWAYS fetch from schedule_preview first');
    let { data: planPreviewData, error: planPreviewError } = await supabase
      .from('schedule_preview')
      .select('*')
      .eq('client_id', clientId)
      .eq('type', 'workout')
      .gte('for_date', startDate)
      .lte('for_date', endDate)
      .order('for_date', { ascending: true });
    
    if (planPreviewError) {
      console.error('❌ Error fetching plan from schedule_preview:', planPreviewError);
    } else {
      console.log('✅ Plan preview data:', planPreviewData?.length || 0, 'entries');
    }
    
    let planData = planPreviewData || [];
    let planIsFromPreview = true;
    
    if (planData.length === 0) {
      console.log('\n📋 Step 2: No preview data, checking schedule table as fallback');
      let { data: planScheduleData, error: planScheduleError } = await supabase
        .from('schedule')
        .select('*')
        .eq('client_id', clientId)
        .eq('type', 'workout')
        .gte('for_date', startDate)
        .lte('for_date', endDate)
        .order('for_date', { ascending: true });
      
      if (planScheduleError) {
        console.error('❌ Error fetching plan from schedule:', planScheduleError);
      } else {
        console.log('✅ Plan schedule data:', planScheduleData?.length || 0, 'entries');
      }
      
      if (planScheduleData && planScheduleData.length > 0) {
        planData = planScheduleData;
        planIsFromPreview = false;
      }
    }
    
    console.log('\n📊 Plan Fetch Result:');
    console.log('   Data source:', planIsFromPreview ? 'schedule_preview' : 'schedule');
    console.log('   Total entries:', planData.length);
    console.log('   Is draft plan:', planIsFromPreview);
    
    console.log('\n3️⃣ Consistency Check');
    
    // Check if the data sources are consistent
    const bothFromPreview = isFromPreview && planIsFromPreview;
    const bothFromSchedule = !isFromPreview && !planIsFromPreview;
    const mixedSources = (isFromPreview && !planIsFromPreview) || (!isFromPreview && planIsFromPreview);
    
    console.log('   Both hooks use preview:', bothFromPreview);
    console.log('   Both hooks use schedule:', bothFromSchedule);
    console.log('   Mixed sources (inconsistent):', mixedSources);
    
    if (mixedSources) {
      console.log('⚠️  WARNING: Inconsistent data sources detected!');
      console.log('   This could cause UI confusion for users.');
    } else {
      console.log('✅ SUCCESS: Consistent data sources across all hooks');
    }
    
    console.log('\n✅ UI Consistency Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testUIConsistency();
