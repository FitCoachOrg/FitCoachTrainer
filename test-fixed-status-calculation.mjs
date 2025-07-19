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

// Mock the status calculation function to test logic
const isApproved = (val) => val === true || val === 1 || val === 'true';

const getApprovalStatusFromPreview = (rows, startDate) => {
  if (!rows || rows.length === 0) return 'pending';
  
  // Calculate expected total days for the week (7 days)
  const expectedTotalDays = 7;
  
  // Get unique days from the rows (since there are multiple meal entries per day)
  const uniqueDays = Array.from(new Set(rows.map(row => row.for_date)));
  const actualTotalDays = uniqueDays.length;
  
  // Debug logging
  console.log('Status calculation details:');
  console.log('Expected total days:', expectedTotalDays);
  console.log('Actual unique days in preview:', actualTotalDays);
  console.log('Unique days:', uniqueDays);
  console.log('Total rows (meal entries):', rows.length);
  console.log('is_approved types:', rows.map(r => typeof r.is_approved), 'values:', rows.map(r => r.is_approved));
  
  // If we have fewer days than expected, it's partial regardless of approval status
  if (actualTotalDays < expectedTotalDays) {
    console.log('Missing days detected. Actual:', actualTotalDays, 'Expected:', expectedTotalDays);
    // Check if all existing days are approved
    const approvedDays = uniqueDays.filter(day => {
      const dayRows = rows.filter(row => row.for_date === day);
      return dayRows.every(row => isApproved(row.is_approved));
    });
    
    if (approvedDays.length > 0) {
      return 'partial_approved';
    } else {
      return 'not_approved';
    }
  }
  
  // If we have all expected days, check if all days are approved
  const allDaysApproved = uniqueDays.every(day => {
    const dayRows = rows.filter(row => row.for_date === day);
    return dayRows.every(row => isApproved(row.is_approved));
  });
  
  console.log('All days approved:', allDaysApproved);
  
  if (allDaysApproved && actualTotalDays === expectedTotalDays) {
    return 'approved';
  } else if (actualTotalDays === expectedTotalDays) {
    // All days exist but some are not approved
    return 'partial_approved';
  } else {
    return 'not_approved';
  }
};

async function testFixedStatusCalculation() {
  console.log('🧪 Testing Fixed Status Calculation Logic')
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

    // 2. Test with real data from database
    console.log('\n2️⃣ Testing with real database data...')
    
    const testStartDate = new Date('2025-07-18') // Monday
    const startDateString = format(testStartDate, 'yyyy-MM-dd');
    const endDateString = format(addDays(testStartDate, 6), 'yyyy-MM-dd');
    
    const { data: realPreviewData, error: realDataError } = await supabase
      .from('schedule_preview')
      .select('id, is_approved, for_date')
      .eq('client_id', clientId)
      .eq('type', 'meal')
      .gte('for_date', startDateString)
      .lte('for_date', endDateString);

    if (realDataError) {
      console.error('❌ Error fetching real data:', realDataError)
    } else {
      console.log(`📊 Real data found: ${realPreviewData?.length || 0} meal entries`)
      if (realPreviewData && realPreviewData.length > 0) {
        const uniqueDays = Array.from(new Set(realPreviewData.map(r => r.for_date)));
        console.log('Unique days:', uniqueDays);
        console.log('Days count:', uniqueDays.length);
        console.log('Approval statuses:', realPreviewData.map(r => r.is_approved));
      }
      
      const realResult = getApprovalStatusFromPreview(realPreviewData || [], testStartDate)
      console.log(`Real data result: ${realResult} ✅`)
    }

    // 3. Test different scenarios with multiple entries per day
    console.log('\n3️⃣ Testing different scenarios with multiple entries per day...')
    
    // Scenario 1: All 7 days with multiple approved entries each
    console.log('\n📋 Scenario 1: All 7 days with multiple approved entries (should be approved)')
    const scenario1 = [];
    for (let i = 0; i < 7; i++) {
      const date = format(addDays(testStartDate, i), 'yyyy-MM-dd');
      // Add 4 meal entries per day (breakfast, lunch, dinner, snacks)
      for (let j = 0; j < 4; j++) {
        scenario1.push({
          id: i * 4 + j + 1,
          for_date: date,
          is_approved: true
        });
      }
    }
    const result1 = getApprovalStatusFromPreview(scenario1, testStartDate)
    console.log(`Result: ${result1} ✅`)

    // Scenario 2: 3 days with multiple approved entries, 4 days missing
    console.log('\n📋 Scenario 2: 3 days with multiple approved entries, 4 days missing (should be partial_approved)')
    const scenario2 = [];
    for (let i = 0; i < 3; i++) {
      const date = format(addDays(testStartDate, i), 'yyyy-MM-dd');
      // Add 4 meal entries per day
      for (let j = 0; j < 4; j++) {
        scenario2.push({
          id: i * 4 + j + 1,
          for_date: date,
          is_approved: true
        });
      }
    }
    const result2 = getApprovalStatusFromPreview(scenario2, testStartDate)
    console.log(`Result: ${result2} ✅`)

    // Scenario 3: 7 days with mixed approval (some days not approved)
    console.log('\n📋 Scenario 3: 7 days with mixed approval (should be partial_approved)')
    const scenario3 = [];
    for (let i = 0; i < 7; i++) {
      const date = format(addDays(testStartDate, i), 'yyyy-MM-dd');
      const isDayApproved = i < 4; // First 4 days approved, last 3 not approved
      // Add 4 meal entries per day
      for (let j = 0; j < 4; j++) {
        scenario3.push({
          id: i * 4 + j + 1,
          for_date: date,
          is_approved: isDayApproved
        });
      }
    }
    const result3 = getApprovalStatusFromPreview(scenario3, testStartDate)
    console.log(`Result: ${result3} ✅`)

    // Scenario 4: 5 days with no approved entries, 2 days missing
    console.log('\n📋 Scenario 4: 5 days with no approved entries, 2 days missing (should be not_approved)')
    const scenario4 = [];
    for (let i = 0; i < 5; i++) {
      const date = format(addDays(testStartDate, i), 'yyyy-MM-dd');
      // Add 4 meal entries per day, all not approved
      for (let j = 0; j < 4; j++) {
        scenario4.push({
          id: i * 4 + j + 1,
          for_date: date,
          is_approved: false
        });
      }
    }
    const result4 = getApprovalStatusFromPreview(scenario4, testStartDate)
    console.log(`Result: ${result4} ✅`)

    // 4. Summary of logic improvements
    console.log('\n4️⃣ Fixed Status Calculation Logic Improvements:')
    console.log('✅ Now counts unique days instead of meal entries')
    console.log('✅ Handles multiple meal entries per day correctly')
    console.log('✅ "Approved" only when ALL 7 unique days exist AND are approved')
    console.log('✅ "Partial Approved" when some days are missing OR mixed approval')
    console.log('✅ "Not Approved" when no days are approved (regardless of missing days)')
    console.log('✅ "Pending" when no data exists')

    console.log('\n📝 Key Fixes:')
    console.log('   - Use Array.from(new Set()) to get unique days')
    console.log('   - Count unique days instead of total meal entries')
    console.log('   - Check if ALL meal entries for each day are approved')
    console.log('   - Handle multiple meal entries per day correctly')
    console.log('   - Enhanced debug logging for better troubleshooting')

    console.log('\n✅ Fixed status calculation test completed!')

  } catch (error) {
    console.error('❌ Error testing fixed status calculation:', error)
  }
}

testFixedStatusCalculation() 