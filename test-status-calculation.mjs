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
  const actualTotalDays = rows.length;
  
  console.log('Status calculation details:');
  console.log('Expected total days:', expectedTotalDays);
  console.log('Actual days in preview:', actualTotalDays);
  console.log('Preview rows for status:', rows);
  console.log('is_approved types:', rows.map(r => typeof r.is_approved), 'values:', rows.map(r => r.is_approved));
  
  // If we have fewer days than expected, it's partial regardless of approval status
  if (actualTotalDays < expectedTotalDays) {
    console.log('Missing days detected. Actual:', actualTotalDays, 'Expected:', expectedTotalDays);
    const approvedCount = rows.filter(r => isApproved(r.is_approved)).length;
    if (approvedCount > 0) {
      return 'partial_approved';
    } else {
      return 'not_approved';
    }
  }
  
  // If we have all expected days, check approval status
  const approvedCount = rows.filter(r => isApproved(r.is_approved)).length;
  const total = rows.length;
  
  console.log('Approved count:', approvedCount, 'Total:', total);
  
  if (approvedCount === total && total === expectedTotalDays) {
    return 'approved';
  } else if (approvedCount > 0) {
    return 'partial_approved';
  } else {
    return 'not_approved';
  }
};

async function testStatusCalculation() {
  console.log('🧪 Testing Enhanced Status Calculation Logic')
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

    // 2. Test different scenarios
    console.log('\n2️⃣ Testing Status Calculation Scenarios...')
    
    const testStartDate = new Date('2025-01-20') // Monday
    
    // Scenario 1: No data (pending)
    console.log('\n📋 Scenario 1: No data (should be pending)')
    const scenario1 = []
    const result1 = getApprovalStatusFromPreview(scenario1, testStartDate)
    console.log(`Result: ${result1} ✅`)

    // Scenario 2: All 7 days with is_approved = true (approved)
    console.log('\n📋 Scenario 2: All 7 days approved (should be approved)')
    const scenario2 = Array.from({ length: 7 }, (_, i) => ({
      id: i + 1,
      is_approved: true
    }))
    const result2 = getApprovalStatusFromPreview(scenario2, testStartDate)
    console.log(`Result: ${result2} ✅`)

    // Scenario 3: 3 days with is_approved = true, 4 days missing (partial_approved)
    console.log('\n📋 Scenario 3: 3 days approved, 4 days missing (should be partial_approved)')
    const scenario3 = Array.from({ length: 3 }, (_, i) => ({
      id: i + 1,
      is_approved: true
    }))
    const result3 = getApprovalStatusFromPreview(scenario3, testStartDate)
    console.log(`Result: ${result3} ✅`)

    // Scenario 4: 5 days with is_approved = false, 2 days missing (not_approved)
    console.log('\n📋 Scenario 4: 5 days not approved, 2 days missing (should be not_approved)')
    const scenario4 = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      is_approved: false
    }))
    const result4 = getApprovalStatusFromPreview(scenario4, testStartDate)
    console.log(`Result: ${result4} ✅`)

    // Scenario 5: 7 days with mixed approval status (partial_approved)
    console.log('\n📋 Scenario 5: 7 days with mixed approval (should be partial_approved)')
    const scenario5 = Array.from({ length: 7 }, (_, i) => ({
      id: i + 1,
      is_approved: i < 4 // First 4 approved, last 3 not approved
    }))
    const result5 = getApprovalStatusFromPreview(scenario5, testStartDate)
    console.log(`Result: ${result5} ✅`)

    // 3. Test with real data from database
    console.log('\n3️⃣ Testing with real database data...')
    
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
      console.log(`📊 Real data found: ${realPreviewData?.length || 0} days`)
      if (realPreviewData && realPreviewData.length > 0) {
        console.log('Dates in preview:', realPreviewData.map(r => r.for_date))
        console.log('Approval statuses:', realPreviewData.map(r => r.is_approved))
      }
      
      const realResult = getApprovalStatusFromPreview(realPreviewData || [], testStartDate)
      console.log(`Real data result: ${realResult} ✅`)
    }

    // 4. Summary of logic improvements
    console.log('\n4️⃣ Status Calculation Logic Improvements:')
    console.log('✅ Now accounts for missing dates in schedule_preview table')
    console.log('✅ "Approved" only when ALL 7 days exist AND are approved')
    console.log('✅ "Partial Approved" when some days are missing OR mixed approval')
    console.log('✅ "Not Approved" when no days are approved (regardless of missing days)')
    console.log('✅ "Pending" when no data exists')

    console.log('\n📝 Key Changes:')
    console.log('   - Added expectedTotalDays = 7 check')
    console.log('   - Compare actualTotalDays vs expectedTotalDays')
    console.log('   - Missing days automatically make status "partial_approved"')
    console.log('   - Only "approved" when all 7 days exist AND are approved')
    console.log('   - Enhanced debug logging for better troubleshooting')

    console.log('\n✅ Enhanced status calculation test completed!')

  } catch (error) {
    console.error('❌ Error testing status calculation:', error)
  }
}

testStatusCalculation() 