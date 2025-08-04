import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

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

async function verifyScheduleTable() {
  console.log('🔍 Verifying schedule table...\n');

  try {
    // Check if schedule table exists
    console.log('1️⃣ Checking schedule table structure...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('schedule')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error accessing schedule table:', tableError.message);
      
      if (tableError.message.includes('does not exist')) {
        console.log('💡 The schedule table does not exist. You may need to create it.');
        return;
      }
    } else {
      console.log('✅ schedule table exists and is accessible');
    }

    // Check existing data
    console.log('\n2️⃣ Checking existing schedule data...');
    const { data: existingData, error: dataError } = await supabase
      .from('schedule')
      .select('*')
      .limit(5);
    
    if (dataError) {
      console.error('❌ Error fetching schedule data:', dataError.message);
    } else {
      console.log(`📊 Found ${existingData?.length || 0} existing records`);
      if (existingData && existingData.length > 0) {
        console.log('📋 Sample record structure:');
        console.log(JSON.stringify(existingData[0], null, 2));
      }
    }

    // Check if trainer can access their clients' schedule data
    console.log('\n3️⃣ Testing trainer access to schedule...');
    
    // Get trainer record
    const { data: trainer, error: trainerError } = await supabase
      .from('trainer')
      .select('id')
      .eq('trainer_email', 'vmalik9@gmail.com')
      .single();
    
    if (trainerError) {
      console.error('❌ Error fetching trainer:', trainerError.message);
      return;
    }

    // Get trainer's client relationships
    const { data: relationships, error: relError } = await supabase
      .from('trainer_client_web')
      .select('client_id')
      .eq('trainer_id', trainer.id);
    
    if (relError) {
      console.error('❌ Error fetching relationships:', relError.message);
      return;
    }

    let clientIds = [];
    if (relationships && relationships.length > 0) {
      clientIds = relationships.map(r => r.client_id).filter(id => id !== null);
      console.log(`📊 Trainer has ${clientIds.length} valid client relationships`);
      
      if (clientIds.length > 0) {
        // Try to access schedule for these clients
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('schedule')
          .select('*')
          .in('client_id', clientIds)
          .limit(5);
        
        if (scheduleError) {
          console.error('❌ Error accessing schedule for clients:', scheduleError.message);
        } else {
          console.log(`📊 Found ${scheduleData?.length || 0} schedule records for trainer's clients`);
          if (scheduleData && scheduleData.length > 0) {
            console.log('📋 Sample schedule record:');
            console.log(JSON.stringify(scheduleData[0], null, 2));
          }
        }
      }
    } else {
      console.log('⚠️  No valid client relationships found for trainer');
    }

    // Test inserting a sample record
    console.log('\n4️⃣ Testing insert capability...');
    if (clientIds.length > 0) {
      const testRecord = {
        client_id: clientIds[0], // Use first client ID
        task: 'Test Task',
        summary: 'Test Summary',
        type: 'test',
        for_date: new Date().toISOString().split('T')[0],
        for_time: '12:00:00',
        icon: '🧪',
        unit: null,
        target: null,
        url: null,
        coach_tip: 'Test tip',
        color: null,
        status: 'pending',
        workout_id: null,
        details_json: { test: true }
      };

      const { data: insertData, error: insertError } = await supabase
        .from('schedule')
        .insert([testRecord])
        .select();

      if (insertError) {
        console.error('❌ Error inserting test record:', insertError.message);
      } else {
        console.log('✅ Successfully inserted test record');
        
        // Clean up - delete the test record
        if (insertData && insertData.length > 0) {
          const { error: deleteError } = await supabase
            .from('schedule')
            .delete()
            .eq('id', insertData[0].id);
          
          if (deleteError) {
            console.log('⚠️  Could not clean up test record:', deleteError.message);
          } else {
            console.log('✅ Cleaned up test record');
          }
        }
      }
    } else {
      console.log('⚠️  No valid client IDs available for testing insert');
    }

    console.log('\n💡 If you see errors, the RLS policies need to be fixed.');
    console.log('🔄 Run the updated comprehensive SQL script to fix all RLS policies including schedule table.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

verifyScheduleTable(); 