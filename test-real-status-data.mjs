import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import { format, addDays } from 'date-fns'

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

async function checkRealStatusData() {
  console.log('🔍 Checking Real Status Data')
  console.log('=' .repeat(50))

  try {
    // 1. Get a client ID for testing
    console.log('\n1️⃣ Getting client ID for testing...')
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

    // 2. Check different date ranges to see what data exists
    console.log('\n2️⃣ Checking different date ranges...')
    
    const testDates = [
      new Date('2025-01-20'), // Monday
      new Date('2025-01-27'), // Next Monday
      new Date('2025-02-03'), // Following Monday
      new Date() // Current date
    ]

    for (const testDate of testDates) {
      console.log(`\n📅 Checking week starting: ${format(testDate, 'yyyy-MM-dd')}`)
      
      const startDateString = format(testDate, 'yyyy-MM-dd');
      const endDateString = format(addDays(testDate, 6), 'yyyy-MM-dd');
      
      // Check schedule_preview data
      const { data: previewData, error: previewError } = await supabase
        .from('schedule_preview')
        .select('id, is_approved, for_date, client_id, type')
        .eq('client_id', clientId)
        .eq('type', 'meal')
        .gte('for_date', startDateString)
        .lte('for_date', endDateString);

      if (previewError) {
        console.error('❌ Preview check error:', previewError)
      } else {
        console.log(`📊 Preview data found: ${previewData?.length || 0} days`)
        if (previewData && previewData.length > 0) {
          console.log('Preview dates:', previewData.map(r => r.for_date))
          console.log('Preview approval statuses:', previewData.map(r => r.is_approved))
        }
      }

      // Check schedule data
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedule')
        .select('id, for_date, client_id, type')
        .eq('client_id', clientId)
        .eq('type', 'meal')
        .gte('for_date', startDateString)
        .lte('for_date', endDateString);

      if (scheduleError) {
        console.error('❌ Schedule check error:', scheduleError)
      } else {
        console.log(`📊 Schedule data found: ${scheduleData?.length || 0} days`)
        if (scheduleData && scheduleData.length > 0) {
          console.log('Schedule dates:', scheduleData.map(r => r.for_date))
        }
      }
    }

    // 3. Check if there are any approved plans at all
    console.log('\n3️⃣ Checking for any approved plans...')
    
    const { data: allApprovedData, error: approvedError } = await supabase
      .from('schedule_preview')
      .select('id, is_approved, for_date, client_id, type')
      .eq('client_id', clientId)
      .eq('type', 'meal')
      .eq('is_approved', true);

    if (approvedError) {
      console.error('❌ Approved data check error:', approvedError)
    } else {
      console.log(`📊 Total approved days found: ${allApprovedData?.length || 0}`)
      if (allApprovedData && allApprovedData.length > 0) {
        console.log('Approved dates:', allApprovedData.map(r => r.for_date))
      }
    }

    // 4. Check the most recent data
    console.log('\n4️⃣ Checking most recent data...')
    
    const { data: recentData, error: recentError } = await supabase
      .from('schedule_preview')
      .select('id, is_approved, for_date, client_id, type')
      .eq('client_id', clientId)
      .eq('type', 'meal')
      .order('for_date', { ascending: false })
      .limit(10);

    if (recentError) {
      console.error('❌ Recent data check error:', recentError)
    } else {
      console.log(`📊 Recent data found: ${recentData?.length || 0} days`)
      if (recentData && recentData.length > 0) {
        console.log('Recent dates:', recentData.map(r => r.for_date))
        console.log('Recent approval statuses:', recentData.map(r => r.is_approved))
      }
    }

    console.log('\n✅ Real data check completed!')

  } catch (error) {
    console.error('❌ Error checking real status data:', error)
  }
}

checkRealStatusData() 