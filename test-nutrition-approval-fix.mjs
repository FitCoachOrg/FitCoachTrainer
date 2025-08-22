// Test script to verify nutrition plan approval status fix
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testApprovalStatusUpdate() {
  console.log('🧪 Testing Nutrition Plan Approval Status Update...\n');
  
  try {
    // Get a test client
    const { data: clients, error: clientError } = await supabase
      .from('client')
      .select('client_id')
      .limit(1);
    
    if (clientError || !clients || clients.length === 0) {
      console.error('❌ No clients found for testing');
      return;
    }
    
    const clientId = clients[0].client_id;
    console.log(`📋 Using client ID: ${clientId}`);
    
    // Test date range (current week)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    
    const startDateString = startDate.toISOString().split('T')[0];
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    const endDateString = endDate.toISOString().split('T')[0];
    
    console.log(`📅 Testing date range: ${startDateString} to ${endDateString}\n`);
    
    // Step 1: Check current approval status
    console.log('1️⃣ Checking current approval status...');
    const { data: previewData, error: previewError } = await supabase
      .from('schedule_preview')
      .select('id, is_approved, for_date')
      .eq('client_id', clientId)
      .eq('type', 'meal')
      .gte('for_date', startDateString)
      .lte('for_date', endDateString);
    
    if (previewError) {
      console.error('❌ Error fetching preview data:', previewError);
      return;
    }
    
    console.log(`📊 Found ${previewData?.length || 0} preview entries`);
    if (previewData && previewData.length > 0) {
      const approvedCount = previewData.filter(row => row.is_approved).length;
      console.log(`✅ ${approvedCount}/${previewData.length} entries are approved`);
    }
    
    // Step 2: Check schedule data
    console.log('\n2️⃣ Checking schedule data...');
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('schedule')
      .select('id, for_date')
      .eq('client_id', clientId)
      .eq('type', 'meal')
      .gte('for_date', startDateString)
      .lte('for_date', endDateString);
    
    if (scheduleError) {
      console.error('❌ Error fetching schedule data:', scheduleError);
      return;
    }
    
    console.log(`📊 Found ${scheduleData?.length || 0} schedule entries`);
    
    // Step 3: Simulate approval process
    if (previewData && previewData.length > 0) {
      console.log('\n3️⃣ Simulating approval process...');
      
      // Delete existing schedule data
      const { error: deleteError } = await supabase
        .from('schedule')
        .delete()
        .eq('client_id', clientId)
        .eq('type', 'meal')
        .gte('for_date', startDateString)
        .lte('for_date', endDateString);
      
      if (deleteError) {
        console.error('❌ Error deleting schedule data:', deleteError);
        return;
      }
      
      // Copy preview data to schedule
      const scheduleRows = previewData.map(({ is_approved, ...rest }) => rest);
      const { error: insertError } = await supabase
        .from('schedule')
        .insert(scheduleRows);
      
      if (insertError) {
        console.error('❌ Error inserting schedule data:', insertError);
        return;
      }
      
      // Update is_approved to true in preview
      const { error: updateError } = await supabase
        .from('schedule_preview')
        .update({ is_approved: true })
        .eq('client_id', clientId)
        .eq('type', 'meal')
        .gte('for_date', startDateString)
        .lte('for_date', endDateString);
      
      if (updateError) {
        console.error('❌ Error updating approval status:', updateError);
        return;
      }
      
      console.log('✅ Approval process completed');
      
      // Step 4: Verify the changes
      console.log('\n4️⃣ Verifying changes...');
      
      const { data: newPreviewData, error: newPreviewError } = await supabase
        .from('schedule_preview')
        .select('id, is_approved, for_date')
        .eq('client_id', clientId)
        .eq('type', 'meal')
        .gte('for_date', startDateString)
        .lte('for_date', endDateString);
      
      if (newPreviewError) {
        console.error('❌ Error fetching updated preview data:', newPreviewError);
        return;
      }
      
      const { data: newScheduleData, error: newScheduleError } = await supabase
        .from('schedule')
        .select('id, for_date')
        .eq('client_id', clientId)
        .eq('type', 'meal')
        .gte('for_date', startDateString)
        .lte('for_date', endDateString);
      
      if (newScheduleError) {
        console.error('❌ Error fetching updated schedule data:', newScheduleError);
        return;
      }
      
      console.log(`📊 Updated preview entries: ${newPreviewData?.length || 0}`);
      console.log(`📊 Updated schedule entries: ${newScheduleData?.length || 0}`);
      
      if (newPreviewData && newPreviewData.length > 0) {
        const approvedCount = newPreviewData.filter(row => row.is_approved).length;
        console.log(`✅ ${approvedCount}/${newPreviewData.length} preview entries are now approved`);
        
        if (approvedCount === newPreviewData.length) {
          console.log('🎉 SUCCESS: All preview entries are approved!');
        } else {
          console.log('⚠️  WARNING: Not all preview entries are approved');
        }
      }
      
      if (newScheduleData && newScheduleData.length > 0) {
        console.log('🎉 SUCCESS: Schedule data has been populated!');
      } else {
        console.log('⚠️  WARNING: No schedule data found after approval');
      }
    } else {
      console.log('ℹ️  No preview data found to approve');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testApprovalStatusUpdate().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
