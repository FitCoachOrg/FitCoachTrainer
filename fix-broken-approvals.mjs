import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixBrokenApprovals() {
  console.log('🔧 Fixing broken approval data for client 34...\n');
  
  // Find all approved plans in schedule_preview that should be in schedule
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
    console.log('✅ No broken approvals found');
    return;
  }
  
  console.log(`📊 Found ${approvedPreviewData.length} approved plans in schedule_preview that need to be moved to schedule`);
  
  // Group by week to process them properly
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
  
  let successCount = 0;
  let errorCount = 0;
  
  // Process each week
  for (const [weekStart, weekRows] of Object.entries(weeklyGroups)) {
    console.log(`\n🔄 Processing week starting ${weekStart} (${weekRows.length} entries)`);
    
    try {
      // Calculate week end date
      const weekStartDate = new Date(weekStart);
      const weekEndDate = new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);
      const weekEndStr = weekEndDate.toISOString().split('T')[0];
      
      // Delete any existing rows in schedule for this week
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
      
      // Prepare rows for insertion (remove id, created_at, is_approved fields)
      const rowsToInsert = weekRows.map(({ id, created_at, is_approved, ...rest }) => rest);
      
      // Insert into schedule
      const { error: insertError } = await supabase
        .from('schedule')
        .insert(rowsToInsert);
      
      if (insertError) {
        console.error(`❌ Error inserting into schedule for week ${weekStart}:`, insertError);
        errorCount++;
        continue;
      }
      
      console.log(`✅ Successfully moved ${weekRows.length} entries for week ${weekStart}`);
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
    console.log(`\n🎉 Fixed ${successCount} weeks of broken approval data!`);
    console.log('The week-to-week variety should now work correctly.');
  }
}

fixBrokenApprovals().catch(console.error);
