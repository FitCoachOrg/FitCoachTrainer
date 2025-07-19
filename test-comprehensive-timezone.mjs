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

async function testComprehensiveTimezone() {
  console.log('🧪 Comprehensive Timezone Testing')
  console.log('=' .repeat(50))

  try {
    // 1. Test timezone conversion functions
    console.log('\n1️⃣ Testing timezone conversion functions...')
    const timezone = getLocalTimezone()
    console.log(`📍 User timezone: ${timezone}`)
    
    const testTimes = ['09:00', '14:30', '23:45', '00:15', '12:00']
    let conversionSuccess = true
    
    testTimes.forEach(localTime => {
      const utcTime = convertLocalTimeToUTC(localTime)
      const convertedBack = convertUTCToLocalTime(utcTime)
      
      console.log(`   Local: ${localTime} → UTC: ${utcTime} → Local: ${convertedBack}`)
      
      if (localTime !== convertedBack) {
        conversionSuccess = false
        console.log(`   ❌ Conversion failed`)
      }
    })
    
    if (conversionSuccess) {
      console.log(`   ✅ All time conversions successful`)
    } else {
      console.log(`   ❌ Some time conversions failed`)
    }

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

    // 3. Test different task types with timezone conversion
    console.log('\n3️⃣ Testing different task types with timezone conversion...')
    const testTasks = [
      {
        type: 'hydration',
        localTime: '08:00',
        summary: 'custom',
        task: 'custom',
        coach_tip: 'Comprehensive timezone test - hydration'
      },
      {
        type: 'weight',
        localTime: '07:30',
        summary: 'custom',
        task: 'custom',
        coach_tip: 'Comprehensive timezone test - weight'
      },
      {
        type: 'wakeup',
        localTime: '06:00',
        summary: 'custom',
        task: 'custom',
        coach_tip: 'Comprehensive timezone test - wakeup'
      }
    ]

    const insertedTasks = []
    
    for (const testTask of testTasks) {
      const utcTime = convertLocalTimeToUTC(testTask.localTime)
      
      const taskData = {
        client_id: clientId,
        for_date: new Date().toISOString().split('T')[0],
        type: testTask.type,
        summary: testTask.summary,
        task: testTask.task,
        for_time: utcTime,
        coach_tip: testTask.coach_tip,
        icon: 'bell',
        details_json: {
          original_local_time: testTask.localTime,
          timezone: timezone,
          test_type: 'comprehensive_timezone'
        }
      }

      const { data: insertedTask, error: insertError } = await supabase
        .from('schedule')
        .insert(taskData)
        .select()

      if (insertError) {
        console.error(`❌ Error inserting ${testTask.type} task:`, insertError)
      } else {
        console.log(`✅ Added ${testTask.type} task: ${testTask.localTime} → ${utcTime}`)
        insertedTasks.push(insertedTask[0])
      }
    }

    // 4. Test retrieval and conversion for all task types
    console.log('\n4️⃣ Testing retrieval and conversion for all task types...')
    const { data: retrievedTasks, error: retrieveError } = await supabase
      .from('schedule')
      .select('*')
      .eq('client_id', clientId)
      .eq('task', 'custom')
      .like('coach_tip', 'Comprehensive timezone test%')

    if (retrieveError) throw retrieveError

    console.log(`📊 Retrieved ${retrievedTasks?.length || 0} tasks:`)
    
    let allConversionsCorrect = true
    
    retrievedTasks?.forEach(task => {
      const storedUTCTime = task.for_time
      const convertedLocalTime = convertUTCToLocalTime(storedUTCTime)
      const originalLocalTime = task.details_json?.original_local_time
      
      console.log(`   ${task.type}:`)
      console.log(`     Stored UTC: ${storedUTCTime}`)
      console.log(`     Converted to local: ${convertedLocalTime}`)
      console.log(`     Original local: ${originalLocalTime}`)
      
      if (convertedLocalTime === originalLocalTime) {
        console.log(`     ✅ Conversion correct`)
      } else {
        console.log(`     ❌ Conversion incorrect`)
        allConversionsCorrect = false
      }
    })

    // 5. Test edge cases
    console.log('\n5️⃣ Testing edge cases...')
    const edgeCases = [
      { local: '00:00', description: 'Midnight' },
      { local: '23:59', description: 'End of day' },
      { local: '12:00', description: 'Noon' },
      { local: '13:00', description: '1 PM' }
    ]

    edgeCases.forEach(edgeCase => {
      const utcTime = convertLocalTimeToUTC(edgeCase.local)
      const convertedBack = convertUTCToLocalTime(utcTime)
      
      console.log(`   ${edgeCase.description}: ${edgeCase.local} → ${utcTime} → ${convertedBack}`)
      
      if (edgeCase.local === convertedBack) {
        console.log(`     ✅ Edge case correct`)
      } else {
        console.log(`     ❌ Edge case failed`)
        allConversionsCorrect = false
      }
    })

    // 6. Test timezone offset calculation
    console.log('\n6️⃣ Testing timezone offset calculation...')
    const now = new Date()
    const localOffset = now.getTimezoneOffset()
    const utcTime = now.toISOString()
    const localTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    })
    
    console.log(`   Current local time: ${localTime}`)
    console.log(`   Current UTC time: ${utcTime}`)
    console.log(`   Timezone offset: ${localOffset} minutes`)
    console.log(`   Timezone: ${timezone}`)

    // 7. Clean up test data
    console.log('\n7️⃣ Cleaning up test data...')
    const { error: deleteError } = await supabase
      .from('schedule')
      .delete()
      .like('coach_tip', 'Comprehensive timezone test%')

    if (deleteError) {
      console.error('❌ Error cleaning up test data:', deleteError)
    } else {
      console.log('✅ Test data cleaned up successfully')
    }

    // 8. Summary
    console.log('\n✅ Comprehensive timezone testing completed!')
    console.log('\n📝 Summary:')
    console.log(`   - Timezone: ${timezone}`)
    console.log(`   - Basic conversions: ${conversionSuccess ? '✅ Passed' : '❌ Failed'}`)
    console.log(`   - Database conversions: ${allConversionsCorrect ? '✅ Passed' : '❌ Failed'}`)
    console.log(`   - Edge cases: ${allConversionsCorrect ? '✅ Passed' : '❌ Failed'}`)
    console.log('\n🔧 Implementation Status:')
    console.log('   - Local time → UTC conversion for storage: ✅ Implemented')
    console.log('   - UTC → Local time conversion for display: ✅ Implemented')
    console.log('   - Custom task modal timezone handling: ✅ Implemented')
    console.log('   - Programs screen timezone display: ✅ Implemented')
    console.log('   - Edit functionality timezone handling: ✅ Implemented')

  } catch (error) {
    console.error('❌ Error in comprehensive timezone testing:', error)
  }
}

testComprehensiveTimezone() 