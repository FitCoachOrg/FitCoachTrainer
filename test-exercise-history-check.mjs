import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkClient34History() {
  console.log('🔍 Checking exercise history for client 34...\n');
  
  // Check schedule table (approved plans)
  const { data: scheduleData, error: scheduleError } = await supabase
    .from('schedule')
    .select('details_json, for_date')
    .eq('client_id', 34)
    .eq('type', 'workout')
    .order('for_date', { ascending: false });
  
  if (scheduleError) {
    console.error('❌ Error fetching schedule data:', scheduleError);
  } else {
    console.log(`📊 Schedule table (approved plans): ${scheduleData?.length || 0} entries`);
    if (scheduleData && scheduleData.length > 0) {
      console.log('📅 Recent dates:', scheduleData.slice(0, 5).map(row => row.for_date));
      
      // Count exercises
      let exerciseCount = 0;
      const exercises = [];
      scheduleData.forEach(row => {
        const rowExercises = row.details_json?.exercises || [];
        exerciseCount += rowExercises.length;
        rowExercises.forEach(ex => {
          exercises.push({
            name: ex.exercise_name,
            date: row.for_date
          });
        });
      });
      console.log(`💪 Total exercises in schedule: ${exerciseCount}`);
      console.log('🏋️ Recent exercises:', exercises.slice(0, 10).map(ex => `${ex.name} (${ex.date})`));
    }
  }
  
  // Check schedule_preview table (pending plans)
  const { data: previewData, error: previewError } = await supabase
    .from('schedule_preview')
    .select('details_json, for_date, is_approved')
    .eq('client_id', 34)
    .eq('type', 'workout')
    .order('for_date', { ascending: false });
  
  if (previewError) {
    console.error('❌ Error fetching preview data:', previewError);
  } else {
    console.log(`\n📊 Schedule_preview table (pending plans): ${previewData?.length || 0} entries`);
    if (previewData && previewData.length > 0) {
      console.log('📅 Recent dates:', previewData.slice(0, 5).map(row => row.for_date));
      console.log('✅ Approval status:', previewData.map(row => row.is_approved));
      
      // Count exercises
      let exerciseCount = 0;
      const exercises = [];
      previewData.forEach(row => {
        const rowExercises = row.details_json?.exercises || [];
        exerciseCount += rowExercises.length;
        rowExercises.forEach(ex => {
          exercises.push({
            name: ex.exercise_name,
            date: row.for_date,
            approved: row.is_approved
          });
        });
      });
      console.log(`💪 Total exercises in preview: ${exerciseCount}`);
      console.log('🏋️ Recent exercises:', exercises.slice(0, 10).map(ex => `${ex.name} (${ex.date}, approved: ${ex.approved})`));
    }
  }
  
  // Check if there are any approved plans that should be in schedule
  if (previewData && previewData.length > 0) {
    const approvedPlans = previewData.filter(row => row.is_approved);
    if (approvedPlans.length > 0) {
      console.log(`\n⚠️ Found ${approvedPlans.length} approved plans in schedule_preview that should be in schedule table`);
      console.log('📅 Approved plan dates:', approvedPlans.map(row => row.for_date));
    }
  }
}

checkClient34History().catch(console.error);
