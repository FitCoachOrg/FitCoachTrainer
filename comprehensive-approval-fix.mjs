import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function comprehensiveApprovalFix() {
  console.log('🔧 Comprehensive Approval Fix for Client 34...\n');
  
  // Step 1: Find all approved plans in schedule_preview
  const { data: approvedPreviewData, error: fetchError } = await supabase
    .from('schedule_preview')
    .select('*')
    .eq('client_id', 34)
    .eq('type', 'workout')
    .eq('is_approved', true)
    .order('for_date', { ascending: true });
  
  if (fetchError) {
    console.error('❌ Error fetching approved preview data:', fetchError);
    return;
  }
  
  if (!approvedPreviewData || approvedPreviewData.length === 0) {
    console.log('✅ No approved plans found in schedule_preview');
    return;
  }
  
  console.log(`📊 Found ${approvedPreviewData.length} approved plans in schedule_preview`);
  
  // Step 2: Group by week
  const weeklyGroups = {};
  approvedPreviewData.forEach(row => {
    const weekStart = new Date(row.for_date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyGroups[weekKey]) {
      weeklyGroups[weekKey] = [];
    }
    weeklyGroups[weekKey].push(row);
  });
  
  console.log(`📅 Grouped into ${Object.keys(weeklyGroups).length} weeks`);
  
  // Step 3: Process each week
  let successCount = 0;
  let errorCount = 0;
  
  for (const [weekStart, weekRows] of Object.entries(weeklyGroups)) {
    console.log(`\n🔄 Processing week starting ${weekStart} (${weekRows.length} entries)`);
    
    try {
      // Calculate week end date
      const weekStartDate = new Date(weekStart);
      const weekEndDate = new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);
      const weekEndStr = weekEndDate.toISOString().split('T')[0];
      
      // Step 3a: Delete any existing rows in schedule for this week
      const { error: deleteError } = await supabase
        .from('schedule')
        .delete()
        .eq('client_id', 34)
        .eq('type', 'workout')
        .gte('for_date', weekStart)
        .lte('for_date', weekEndStr);
      
      if (deleteError) {
        console.error(`❌ Error deleting existing schedule rows for week ${weekStart}:`, deleteError);
        errorCount++;
        continue;
      }
      
      // Step 3b: Prepare rows for insertion (remove id, created_at, is_approved fields)
      const rowsToInsert = weekRows.map(({ id, created_at, is_approved, ...rest }) => rest);
      
      // Step 3c: Insert into schedule
      const { error: insertError } = await supabase
        .from('schedule')
        .insert(rowsToInsert);
      
      if (insertError) {
        console.error(`❌ Error inserting into schedule for week ${weekStart}:`, insertError);
        errorCount++;
        continue;
      }
      
      // Step 3d: Delete the approved rows from schedule_preview (since they're now in schedule)
      const { error: deletePreviewError } = await supabase
        .from('schedule_preview')
        .delete()
        .eq('client_id', 34)
        .eq('type', 'workout')
        .eq('is_approved', true)
        .gte('for_date', weekStart)
        .lte('for_date', weekEndStr);
      
      if (deletePreviewError) {
        console.error(`❌ Error deleting from schedule_preview for week ${weekStart}:`, deletePreviewError);
        // Don't count this as a failure since the data is already in schedule
      }
      
      console.log(`✅ Successfully processed week ${weekStart}: moved ${weekRows.length} entries to schedule`);
      successCount++;
      
    } catch (error) {
      console.error(`❌ Unexpected error processing week ${weekStart}:`, error);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`✅ Successfully processed: ${successCount} weeks`);
  console.log(`❌ Errors: ${errorCount} weeks`);
  
  if (successCount > 0) {
    console.log(`\n🎉 Fixed ${successCount} weeks of approval data!`);
    console.log('The week-to-week variety should now work correctly.');
  }
  
  // Step 4: Verify the fix
  console.log('\n🔍 Verifying the fix...');
  
  const { data: remainingApprovedData, error: verifyError } = await supabase
    .from('schedule_preview')
    .select('*')
    .eq('client_id', 34)
    .eq('type', 'workout')
    .eq('is_approved', true);
  
  if (verifyError) {
    console.error('❌ Error verifying fix:', verifyError);
  } else {
    console.log(`📊 Remaining approved plans in schedule_preview: ${remainingApprovedData?.length || 0}`);
    if (remainingApprovedData && remainingApprovedData.length === 0) {
      console.log('✅ All approved plans have been properly moved to schedule table!');
    } else {
      console.log('⚠️ Some approved plans still remain in schedule_preview');
    }
  }
}

comprehensiveApprovalFix().catch(console.error);
