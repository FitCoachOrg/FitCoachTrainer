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

/**
 * Convert time from client's timezone to UTC for storage
 * This is the main function to use when saving reminder times
 * @param time - Time string in format "HH:mm" (in client's timezone)
 * @param clientTimezone - Client's timezone (IANA identifier)
 * @returns UTC time string in format "HH:mm"
 */
function convertClientTimeToUTC(time, clientTimezone) {
  try {
    const [hours, minutes] = time.split(':').map(Number)
    
    // Common timezone offsets (in hours) - positive means ahead of UTC
    const timezoneOffsets = {
      // North America
      'America/New_York': -5, // EST (UTC-5)
      'America/Chicago': -6,  // CST (UTC-6)
      'America/Denver': -7,   // MST (UTC-7)
      'America/Los_Angeles': -8, // PST (UTC-8)
      'America/Anchorage': -9, // AKST (UTC-9)
      'Pacific/Honolulu': -10, // HST (UTC-10)
      'America/Toronto': -5,  // EST (UTC-5)
      'America/Vancouver': -8, // PST (UTC-8)
      'America/Mexico_City': -6, // CST (UTC-6)
      
      // Europe
      'Europe/London': 0,     // GMT (UTC+0)
      'Europe/Paris': 1,      // CET (UTC+1)
      'Europe/Berlin': 1,     // CET (UTC+1)
      'Europe/Rome': 1,       // CET (UTC+1)
      'Europe/Madrid': 1,     // CET (UTC+1)
      'Europe/Amsterdam': 1,  // CET (UTC+1)
      'Europe/Stockholm': 1,  // CET (UTC+1)
      'Europe/Vienna': 1,     // CET (UTC+1)
      'Europe/Zurich': 1,     // CET (UTC+1)
      'Europe/Helsinki': 2,   // EET (UTC+2)
      'Europe/Athens': 2,     // EET (UTC+2)
      'Europe/Bucharest': 2,  // EET (UTC+2)
      'Europe/Moscow': 3,     // MSK (UTC+3)
      
      // Asia
      'Asia/Tokyo': 9,        // JST (UTC+9)
      'Asia/Shanghai': 8,     // CST (UTC+8)
      'Asia/Seoul': 9,        // KST (UTC+9)
      'Asia/Singapore': 8,    // SGT (UTC+8)
      'Asia/Bangkok': 7,      // ICT (UTC+7)
      'Asia/Kolkata': 5.5,    // IST (UTC+5:30)
      'Asia/Dubai': 4,        // GST (UTC+4)
      'Asia/Jakarta': 7,      // WIB (UTC+7)
      'Asia/Manila': 8,       // PHT (UTC+8)
      'Asia/Ho_Chi_Minh': 7,  // ICT (UTC+7)
      'Asia/Hong_Kong': 8,    // HKT (UTC+8)
      'Asia/Taipei': 8,       // CST (UTC+8)
      
      // Australia & Oceania
      'Australia/Sydney': 10, // AEST (UTC+10)
      'Australia/Melbourne': 10, // AEST (UTC+10)
      'Australia/Brisbane': 10, // AEST (UTC+10)
      'Australia/Perth': 8,   // AWST (UTC+8)
      'Australia/Adelaide': 9.5, // ACST (UTC+9:30)
      'Pacific/Auckland': 12, // NZST (UTC+12)
      'Pacific/Fiji': 12,     // FJT (UTC+12)
      
      // South America
      'America/Sao_Paulo': -3, // BRT (UTC-3)
      'America/Argentina/Buenos_Aires': -3, // ART (UTC-3)
      'America/Santiago': -3, // CLT (UTC-3)
      'America/Lima': -5,     // PET (UTC-5)
      'America/Bogota': -5,   // COT (UTC-5)
      
      // Africa
      'Africa/Cairo': 2,      // EET (UTC+2)
      'Africa/Johannesburg': 2, // SAST (UTC+2)
      'Africa/Lagos': 1,      // WAT (UTC+1)
      'Africa/Casablanca': 0, // WET (UTC+0)
      'Africa/Nairobi': 3,    // EAT (UTC+3)
      
      // UTC and GMT
      'UTC': 0,
      'GMT': 0
    }
    
    const offset = timezoneOffsets[clientTimezone] || 0
    
    // Convert client time to UTC
    let utcHours = hours - Math.floor(offset)
    let utcMinutes = minutes
    
    // Handle fractional hours (like IST which is UTC+5:30)
    if (offset % 1 !== 0) {
      const fractionalPart = offset % 1
      utcMinutes -= Math.round(fractionalPart * 60)
      
      // Adjust hours if minutes go negative
      if (utcMinutes < 0) {
        utcMinutes += 60
        utcHours -= 1
      }
    }
    
    // Handle negative hours (previous day)
    if (utcHours < 0) {
      utcHours += 24
    }
    
    // Handle hours >= 24 (next day)
    if (utcHours >= 24) {
      utcHours -= 24
    }
    
    return `${Math.floor(utcHours).toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')}`
  } catch (error) {
    console.error('Error converting client time to UTC:', error)
    return time // Fallback to original time
  }
}

/**
 * Convert UTC time to client's timezone for display
 * @param utcTime - Time string in format "HH:mm" (UTC)
 * @param clientTimezone - Client's timezone (IANA identifier)
 * @returns Time string in client's timezone format "HH:mm"
 */
function convertUTCToClientTime(utcTime, clientTimezone) {
  try {
    const [hours, minutes] = utcTime.split(':').map(Number)
    
    // Common timezone offsets (in hours) - positive means ahead of UTC
    const timezoneOffsets = {
      // North America
      'America/New_York': -5, // EST (UTC-5)
      'America/Chicago': -6,  // CST (UTC-6)
      'America/Denver': -7,   // MST (UTC-7)
      'America/Los_Angeles': -8, // PST (UTC-8)
      'America/Anchorage': -9, // AKST (UTC-9)
      'Pacific/Honolulu': -10, // HST (UTC-10)
      'America/Toronto': -5,  // EST (UTC-5)
      'America/Vancouver': -8, // PST (UTC-8)
      'America/Mexico_City': -6, // CST (UTC-6)
      
      // Europe
      'Europe/London': 0,     // GMT (UTC+0)
      'Europe/Paris': 1,      // CET (UTC+1)
      'Europe/Berlin': 1,     // CET (UTC+1)
      'Europe/Rome': 1,       // CET (UTC+1)
      'Europe/Madrid': 1,     // CET (UTC+1)
      'Europe/Amsterdam': 1,  // CET (UTC+1)
      'Europe/Stockholm': 1,  // CET (UTC+1)
      'Europe/Vienna': 1,     // CET (UTC+1)
      'Europe/Zurich': 1,     // CET (UTC+1)
      'Europe/Helsinki': 2,   // EET (UTC+2)
      'Europe/Athens': 2,     // EET (UTC+2)
      'Europe/Bucharest': 2,  // EET (UTC+2)
      'Europe/Moscow': 3,     // MSK (UTC+3)
      
      // Asia
      'Asia/Tokyo': 9,        // JST (UTC+9)
      'Asia/Shanghai': 8,     // CST (UTC+8)
      'Asia/Seoul': 9,        // KST (UTC+9)
      'Asia/Singapore': 8,    // SGT (UTC+8)
      'Asia/Bangkok': 7,      // ICT (UTC+7)
      'Asia/Kolkata': 5.5,    // IST (UTC+5:30)
      'Asia/Dubai': 4,        // GST (UTC+4)
      'Asia/Jakarta': 7,      // WIB (UTC+7)
      'Asia/Manila': 8,       // PHT (UTC+8)
      'Asia/Ho_Chi_Minh': 7,  // ICT (UTC+7)
      'Asia/Hong_Kong': 8,    // HKT (UTC+8)
      'Asia/Taipei': 8,       // CST (UTC+8)
      
      // Australia & Oceania
      'Australia/Sydney': 10, // AEST (UTC+10)
      'Australia/Melbourne': 10, // AEST (UTC+10)
      'Australia/Brisbane': 10, // AEST (UTC+10)
      'Australia/Perth': 8,   // AWST (UTC+8)
      'Australia/Adelaide': 9.5, // ACST (UTC+9:30)
      'Pacific/Auckland': 12, // NZST (UTC+12)
      'Pacific/Fiji': 12,     // FJT (UTC+12)
      
      // South America
      'America/Sao_Paulo': -3, // BRT (UTC-3)
      'America/Argentina/Buenos_Aires': -3, // ART (UTC-3)
      'America/Santiago': -3, // CLT (UTC-3)
      'America/Lima': -5,     // PET (UTC-5)
      'America/Bogota': -5,   // COT (UTC-5)
      
      // Africa
      'Africa/Cairo': 2,      // EET (UTC+2)
      'Africa/Johannesburg': 2, // SAST (UTC+2)
      'Africa/Lagos': 1,      // WAT (UTC+1)
      'Africa/Casablanca': 0, // WET (UTC+0)
      'Africa/Nairobi': 3,    // EAT (UTC+3)
      
      // UTC and GMT
      'UTC': 0,
      'GMT': 0
    }
    
    const offset = timezoneOffsets[clientTimezone] || 0
    
    // Convert UTC time to client timezone
    let clientHours = hours + Math.floor(offset)
    let clientMinutes = minutes
    
    // Handle fractional hours (like IST which is UTC+5:30)
    if (offset % 1 !== 0) {
      const fractionalPart = offset % 1
      clientMinutes += Math.round(fractionalPart * 60)
      
      // Adjust hours if minutes go over 60
      if (clientMinutes >= 60) {
        clientMinutes -= 60
        clientHours += 1
      }
    }
    
    // Handle negative hours (previous day)
    if (clientHours < 0) {
      clientHours += 24
    }
    
    // Handle hours >= 24 (next day)
    if (clientHours >= 24) {
      clientHours -= 24
    }
    
    return `${Math.floor(clientHours).toString().padStart(2, '0')}:${clientMinutes.toString().padStart(2, '0')}`
  } catch (error) {
    console.error('Error converting UTC to client time:', error)
    return utcTime // Fallback to original time
  }
}

async function testClientTimezoneConversion() {
  console.log('🧪 Testing Client Timezone Conversion')
  console.log('=' .repeat(50))

  try {
    // Test the specific example: IST 8:00 AM should convert to UTC 2:30 AM
    console.log('\n1️⃣ Testing IST to UTC conversion (Example from requirement)...')
    
    const istTime = '08:00' // 8:00 AM IST
    const istTimezone = 'Asia/Kolkata' // IST timezone
    
    const utcTime = convertClientTimeToUTC(istTime, istTimezone)
    const convertedBack = convertUTCToClientTime(utcTime, istTimezone)
    
    console.log(`   IST Time: ${istTime} (8:00 AM IST)`)
    console.log(`   UTC Time: ${utcTime} (should be 2:30 AM UTC)`)
    console.log(`   Converted Back: ${convertedBack} (should be 8:00 AM IST)`)
    
    if (utcTime === '02:30' && convertedBack === '08:00') {
      console.log('   ✅ IST to UTC conversion working correctly!')
    } else {
      console.log('   ❌ IST to UTC conversion failed')
    }

    // Test other common timezones
    console.log('\n2️⃣ Testing other common timezones...')
    
    const testCases = [
      { timezone: 'America/New_York', time: '09:00', expectedUTC: '14:00' }, // EST (UTC-5)
      { timezone: 'Europe/London', time: '14:00', expectedUTC: '14:00' }, // GMT (UTC+0)
      { timezone: 'Asia/Tokyo', time: '20:00', expectedUTC: '11:00' }, // JST (UTC+9)
      { timezone: 'Australia/Sydney', time: '18:00', expectedUTC: '08:00' }, // AEST (UTC+10)
    ]
    
    testCases.forEach(({ timezone, time, expectedUTC }) => {
      const utcResult = convertClientTimeToUTC(time, timezone)
      const convertedBack = convertUTCToClientTime(utcResult, timezone)
      
      console.log(`   ${timezone}: ${time} → UTC: ${utcResult} → ${timezone}: ${convertedBack}`)
      
      if (convertedBack === time) {
        console.log('   ✅ Conversion successful')
      } else {
        console.log('   ❌ Conversion failed')
      }
    })

    // Test with actual client data
    console.log('\n3️⃣ Testing with actual client data...')
    
    const { data: clients, error: clientError } = await supabase
      .from('client')
      .select('client_id, cl_name, timezone')
      .limit(3)

    if (clientError) {
      console.error('❌ Error fetching clients:', clientError)
      return
    }

    if (!clients || clients.length === 0) {
      console.log('❌ No clients found in database')
      return
    }

    console.log(`📊 Found ${clients.length} clients:`)
    
    clients.forEach((client, index) => {
      console.log(`\n   Client ${index + 1}: ${client.cl_name}`)
      console.log(`   Timezone: ${client.timezone || 'Not set'}`)
      
      if (client.timezone) {
        const testTime = '10:00'
        const utcTime = convertClientTimeToUTC(testTime, client.timezone)
        const convertedBack = convertUTCToClientTime(utcTime, client.timezone)
        
        console.log(`   Test: ${testTime} → UTC: ${utcTime} → ${client.timezone}: ${convertedBack}`)
        
        if (convertedBack === testTime) {
          console.log('   ✅ Conversion successful')
        } else {
          console.log('   ❌ Conversion failed')
        }
      } else {
        console.log('   ⚠️  No timezone set - using UTC')
      }
    })

    // Test edge cases
    console.log('\n4️⃣ Testing edge cases...')
    
    const edgeCases = [
      { time: '00:00', timezone: 'Asia/Kolkata' }, // Midnight IST
      { time: '23:59', timezone: 'America/Los_Angeles' }, // Late night PST
      { time: '12:00', timezone: 'UTC' }, // Noon UTC
    ]
    
    edgeCases.forEach(({ time, timezone }) => {
      const utcTime = convertClientTimeToUTC(time, timezone)
      const convertedBack = convertUTCToClientTime(utcTime, timezone)
      
      console.log(`   ${timezone} ${time} → UTC: ${utcTime} → ${timezone}: ${convertedBack}`)
      
      if (convertedBack === time) {
        console.log('   ✅ Edge case successful')
      } else {
        console.log('   ❌ Edge case failed')
      }
    })

    console.log('\n✅ Client timezone conversion testing completed!')

  } catch (error) {
    console.error('❌ Error during testing:', error)
  }
}

testClientTimezoneConversion()
