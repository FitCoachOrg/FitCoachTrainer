// Test RLS Policies - Verify that RLS policies work correctly
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testRLSPolicies() {
  console.log('🧪 Testing RLS Policies...\n')
  
  try {
    // Test 1: Try to create an event with correct trainer_email
    console.log('🔍 Test 1: Creating event with correct trainer_email...')
    const testEvent = {
      title: 'Test Event with RLS',
      description: 'Test event to verify RLS policies work',
      event_type: 'consultation',
      start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      end_time: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
      duration_minutes: 60,
      trainer_id: 'ce63741b-1039-4b9c-9bf7-5a55ff0ebeba',
      trainer_email: 'vmalik9@gmail.com', // This should match the authenticated user
      client_name: 'Test Client',
      client_email: 'test@example.com',
      status: 'scheduled',
      color: '#3B82F6'
    }

    const { data: insertData, error: insertError } = await supabase
      .from('schedule_events')
      .insert([testEvent])
      .select()

    console.log('📊 Insert result:', insertData)
    console.log('📊 Insert error:', insertError)

    if (insertData && insertData.length > 0) {
      console.log('✅ Event created successfully!')
      
      const createdEventId = insertData[0].id
      
      // Test 2: Try to read the created event
      console.log('\n🔍 Test 2: Reading created event...')
      const { data: readData, error: readError } = await supabase
        .from('schedule_events')
        .select('*')
        .eq('id', createdEventId)
        .single()

      console.log('📊 Read result:', readData)
      console.log('📊 Read error:', readError)

      // Test 3: Try to update the event
      console.log('\n🔍 Test 3: Updating event...')
      const { data: updateData, error: updateError } = await supabase
        .from('schedule_events')
        .update({ title: 'Updated Test Event' })
        .eq('id', createdEventId)
        .select()

      console.log('📊 Update result:', updateData)
      console.log('📊 Update error:', updateError)

      // Test 4: Try to delete the event
      console.log('\n🔍 Test 4: Deleting event...')
      const { data: deleteData, error: deleteError } = await supabase
        .from('schedule_events')
        .delete()
        .eq('id', createdEventId)
        .select()

      console.log('📊 Delete result:', deleteData)
      console.log('📊 Delete error:', deleteError)

    } else {
      console.log('❌ Event creation failed, cannot test other operations')
    }

    // Test 5: Try to create an event with wrong trainer_email (should fail)
    console.log('\n🔍 Test 5: Creating event with wrong trainer_email (should fail)...')
    const wrongEvent = {
      title: 'Wrong Trainer Event',
      description: 'This should fail due to RLS',
      event_type: 'consultation',
      start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
      duration_minutes: 60,
      trainer_id: 'ce63741b-1039-4b9c-9bf7-5a55ff0ebeba',
      trainer_email: 'wrong@email.com', // This should not match the authenticated user
      client_name: 'Test Client',
      client_email: 'test@example.com',
      status: 'scheduled',
      color: '#3B82F6'
    }

    const { data: wrongInsertData, error: wrongInsertError } = await supabase
      .from('schedule_events')
      .insert([wrongEvent])
      .select()

    console.log('📊 Wrong insert result:', wrongInsertData)
    console.log('📊 Wrong insert error:', wrongInsertError)

    if (wrongInsertError) {
      console.log('✅ RLS correctly blocked event with wrong trainer_email')
    } else {
      console.log('❌ RLS failed to block event with wrong trainer_email')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testRLSPolicies()
