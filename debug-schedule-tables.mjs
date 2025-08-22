// Debug script to check schedule table structure
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkScheduleTables() {
  console.log('🔍 Checking Schedule Table Structure for Client 34\n');
  
  try {
    // Check schedule_preview table structure
    console.log('1️⃣ Checking schedule_preview table structure...');
    const { data: previewSample, error: previewError } = await supabase
      .from('schedule_preview')
      .select('*')
      .eq('client_id', 34)
      .limit(1);
    
    if (previewError) {
      console.error('❌ Error accessing schedule_preview:', previewError);
    } else {
      console.log('✅ schedule_preview table accessible');
      if (previewSample && previewSample.length > 0) {
        console.log('📋 schedule_preview columns:', Object.keys(previewSample[0]));
        console.log('📋 Sample record:', JSON.stringify(previewSample[0], null, 2));
      }
    }
    
    // Check schedule table structure
    console.log('\n2️⃣ Checking schedule table structure...');
    const { data: scheduleSample, error: scheduleError } = await supabase
      .from('schedule')
      .select('*')
      .eq('client_id', 34)
      .limit(1);
    
    if (scheduleError) {
      console.error('❌ Error accessing schedule:', scheduleError);
    } else {
      console.log('✅ schedule table accessible');
      if (scheduleSample && scheduleSample.length > 0) {
        console.log('📋 schedule columns:', Object.keys(scheduleSample[0]));
        console.log('📋 Sample record:', JSON.stringify(scheduleSample[0], null, 2));
      }
    }
    
    // Check all schedule_preview records for client 34
    console.log('\n3️⃣ Checking all schedule_preview records for client 34...');
    const { data: allPreview, error: allPreviewError } = await supabase
      .from('schedule_preview')
      .select('*')
      .eq('client_id', 34)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (allPreviewError) {
      console.error('❌ Error fetching all preview records:', allPreviewError);
    } else {
      console.log(`📊 Found ${allPreview?.length || 0} schedule_preview records for client 34`);
      if (allPreview && allPreview.length > 0) {
        console.log('📋 Most recent schedule_preview record:');
        console.log(JSON.stringify(allPreview[0], null, 2));
      }
    }
    
    // Check all schedule records for client 34
    console.log('\n4️⃣ Checking all schedule records for client 34...');
    const { data: allSchedule, error: allScheduleError } = await supabase
      .from('schedule')
      .select('*')
      .eq('client_id', 34)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (allScheduleError) {
      console.error('❌ Error fetching all schedule records:', allScheduleError);
    } else {
      console.log(`📊 Found ${allSchedule?.length || 0} schedule records for client 34`);
      if (allSchedule && allSchedule.length > 0) {
        console.log('📋 Most recent schedule record:');
        console.log(JSON.stringify(allSchedule[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkScheduleTables().then(() => {
  console.log('\n🏁 Check completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Check failed:', error);
  process.exit(1);
});
