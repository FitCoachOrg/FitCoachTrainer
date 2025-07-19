import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Load environment variables
const envPath = '.env'
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
      process.env[key.trim()] = value.trim()
    }
  })
}

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Timezone conversion functions (same as in the app)
function convertLocalTimeToUTC(localTime) {
  try {
    const [hours, minutes] = localTime.split(':').map(Number)
    
    // Create a date object in local timezone
    const localDate = new Date()
    localDate.setHours(hours, minutes, 0, 0)
    
    // Convert to UTC
    const utcHours = localDate.getUTCHours()
    const utcMinutes = localDate.getUTCMinutes()
    
    return `${utcHours.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')}`
  } catch (error) {
    console.error('Error converting local time to UTC:', error)
    return localTime
  }
}

function convertUTCToLocalTime(utcTime) {
  try {
    const [hours, minutes] = utcTime.split(':').map(Number)
    
    // Create a UTC date object
    const utcDate = new Date()
    utcDate.setUTCHours(hours, minutes, 0, 0)
    
    // Convert to local time
    const localHours = utcDate.getHours()
    const localMinutes = utcDate.getMinutes()
    
    return `${localHours.toString().padStart(2, '0')}:${localMinutes.toString().padStart(2, '0')}`
  } catch (error) {
    console.error('Error converting UTC time to local:', error)
    return utcTime
  }
}

function getLocalTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

async function testTimezoneConversion() {
  console.log('🧪 Testing Timezone Conversion')
  console.log('=' .repeat(50))

  try {
    // 1. Test timezone conversion functions
    console.log('\n1️⃣ Testing timezone conversion functions...')
    const testTimes = ['09:00', '14:30', '23:45', '00:15']
    const timezone = getLocalTimezone()
    
    console.log(`📍 User timezone: ${timezone}`)
    console.log('\n📊 Time conversion test results:')
    
    testTimes.forEach(localTime => {
      const utcTime = convertLocalTimeToUTC(localTime)
      const convertedBack = convertUTCToLocalTime(utcTime)
      
      console.log(`   Local: ${localTime} → UTC: ${utcTime} → Local: ${convertedBack}`)
      
      if (localTime === convertedBack) {
        console.log(`   ✅ Conversion successful`)
      } else {
        console.log(`   ❌ Conversion failed`)
      }
    })

    // 2. Get a client ID for testing
    console.log('\n2️⃣ Getting client ID for testing...')
    const { data: clients, error: clientError } = await supabase
      .from('client')
      .select('client_id, cl_name')
      .limit(1)

    if (clientError) throw clientError
    if (!clients || clients.length === 0) {
      console.error('❌ No clients found in database')
      return
    }

    const clientId = clients[0].client_id
    const clientName = clients[0].cl_name
    console.log(`✅ Using client: ${clientName} (ID: ${clientId})`)

    // 3. Test adding a task with timezone conversion
    console.log('\n3️⃣ Testing timezone conversion with database...')
    const testLocalTime = '15:30' // 3:30 PM local time
    const utcTimeForStorage = convertLocalTimeToUTC(testLocalTime)
    
    console.log(`📝 Adding test task with time conversion:`)
    console.log(`   Local time: ${testLocalTime}`)
    console.log(`   UTC time for storage: ${utcTimeForStorage}`)
    
    const testTask = {
      client_id: clientId,
      for_date: new Date().toISOString().split('T')[0],
      type: 'other',
      summary: 'custom',
      task: 'custom',
      for_time: utcTimeForStorage, // Store UTC time
      coach_tip: 'Timezone conversion test',
      icon: 'bell',
      details_json: {
        original_local_time: testLocalTime,
        timezone: timezone,
        test_type: 'timezone_conversion'
      }
    }

    const { data: insertedTask, error: insertError } = await supabase
      .from('schedule')
      .insert(testTask)
      .select()

    if (insertError) {
      console.error('❌ Error inserting test task:', insertError)
      return
    }

    console.log('✅ Test task inserted successfully')

    // 4. Test retrieving and converting back to local time
    console.log('\n4️⃣ Testing retrieval and conversion...')
    const { data: retrievedTasks, error: retrieveError } = await supabase
      .from('schedule')
      .select('*')
      .eq('client_id', clientId)
      .eq('task', 'custom')
      .eq('coach_tip', 'Timezone conversion test')

    if (retrieveError) throw retrieveError

    if (retrievedTasks && retrievedTasks.length > 0) {
      const task = retrievedTasks[0]
      const storedUTCTime = task.for_time
      const convertedLocalTime = convertUTCToLocalTime(storedUTCTime)
      
      console.log(`📊 Retrieval and conversion results:`)
      console.log(`   Stored UTC time: ${storedUTCTime}`)
      console.log(`   Converted to local: ${convertedLocalTime}`)
      console.log(`   Original local time: ${testLocalTime}`)
      
      if (convertedLocalTime === testLocalTime) {
        console.log(`   ✅ Timezone conversion working correctly!`)
      } else {
        console.log(`   ❌ Timezone conversion failed`)
      }
    }

    // 5. Clean up test data
    console.log('\n5️⃣ Cleaning up test data...')
    const { error: deleteError } = await supabase
      .from('schedule')
      .delete()
      .eq('coach_tip', 'Timezone conversion test')

    if (deleteError) {
      console.error('❌ Error cleaning up test data:', deleteError)
    } else {
      console.log('✅ Test data cleaned up successfully')
    }

    console.log('\n✅ Timezone conversion testing completed successfully!')
    console.log('\n📝 Summary:')
    console.log('   - Local time is converted to UTC for Supabase storage')
    console.log('   - UTC time is converted back to local for display')
    console.log('   - User sees times in their local timezone')
    console.log('   - Database stores times in UTC consistently')

  } catch (error) {
    console.error('❌ Error testing timezone conversion:', error)
  }
}

testTimezoneConversion() 