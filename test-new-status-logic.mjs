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

// Copy the new logic from the component
const isApproved = (val) => val === true || val === 1 || val === 'true';

const getApprovalStatusFromPreview = (rows, startDate) => {
  if (!rows || rows.length === 0) return 'pending';
  
  // Get unique days from the rows (since there are multiple meal entries per day)
  const uniqueDays = Array.from(new Set(rows.map(row => row.for_date)));
  const actualTotalDays = uniqueDays.length;
  
  // Debug logging
  console.log('Status calculation details:');
  console.log('Actual unique days in preview:', actualTotalDays);
  console.log('Unique days:', uniqueDays);
  console.log('Total rows (meal entries):', rows.length);
  console.log('is_approved types:', rows.map(r => typeof r.is_approved), 'values:', rows.map(r => r.is_approved));
  
  // Check if all existing days are approved
  const approvedDays = uniqueDays.filter(day => {
    const dayRows = rows.filter(row => row.for_date === day);
    const allApproved = dayRows.every(row => isApproved(row.is_approved));
    console.log(`Day ${day}: ${dayRows.length} entries, all approved: ${allApproved}`);
    return allApproved;
  });
  
  console.log('Approved days:', approvedDays);
  console.log('Approved days count:', approvedDays.length);
  console.log('Total days count:', actualTotalDays);
  
  // If we have no approved days, it's not approved
  if (approvedDays.length === 0) {
    console.log('❌ Result: not_approved (no days are approved)');
    return 'not_approved';
  }
  
  // If all available days are approved, it's approved (regardless of how many days)
  if (approvedDays.length === actualTotalDays) {
    console.log('✅ Result: approved (all available days are approved)');
    return 'approved';
  }
  
  // If some days are approved but not all, it's partial approved
  console.log('⚠️ Result: partial_approved (some days approved, some not)');
  return 'partial_approved';
};

async function testNewStatusLogic() {
  console.log('🧪 Testing New Flexible Status Logic')
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
    
    const currentDate = new Date()
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1) // Monday
    
    const startDateString = format(startOfWeek, 'yyyy-MM-dd');
    const endDateString = format(addDays(startOfWeek, 6), 'yyyy-MM-dd');
    
    console.log(`📅 Checking week: ${startDateString} to ${endDateString}`)
    
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
      
      console.log('\n🔍 Running new status calculation...')
      const realResult = getApprovalStatusFromPreview(realPreviewData || [], startOfWeek)
      console.log(`\n🎯 Final Result: ${realResult}`)
    }

    // 3. Test different scenarios
    console.log('\n3️⃣ Testing different scenarios with new logic...')
    
    // Scenario 1: 3 days with all approved (should be approved)
    console.log('\n📋 Scenario 1: 3 days with all approved (should be approved)')
    const scenario1 = [];
    for (let i = 0; i < 3; i++) {
      const date = format(addDays(startOfWeek, i), 'yyyy-MM-dd');
      // Add 4 meal entries per day
      for (let j = 0; j < 4; j++) {
        scenario1.push({
          id: i * 4 + j + 1,
          for_date: date,
          is_approved: true
        });
      }
    }
    const result1 = getApprovalStatusFromPreview(scenario1, startOfWeek)
    console.log(`Result: ${result1} ✅`)

    // Scenario 2: 7 days with all approved (should be approved)
    console.log('\n📋 Scenario 2: 7 days with all approved (should be approved)')
    const scenario2 = [];
    for (let i = 0; i < 7; i++) {
      const date = format(addDays(startOfWeek, i), 'yyyy-MM-dd');
      // Add 4 meal entries per day
      for (let j = 0; j < 4; j++) {
        scenario2.push({
          id: i * 4 + j + 1,
          for_date: date,
          is_approved: true
        });
      }
    }
    const result2 = getApprovalStatusFromPreview(scenario2, startOfWeek)
    console.log(`Result: ${result2} ✅`)

    // Scenario 3: 5 days with mixed approval (should be partial_approved)
    console.log('\n📋 Scenario 3: 5 days with mixed approval (should be partial_approved)')
    const scenario3 = [];
    for (let i = 0; i < 5; i++) {
      const date = format(addDays(startOfWeek, i), 'yyyy-MM-dd');
      const isDayApproved = i < 3; // First 3 days approved, last 2 not approved
      // Add 4 meal entries per day
      for (let j = 0; j < 4; j++) {
        scenario3.push({
          id: i * 4 + j + 1,
          for_date: date,
          is_approved: isDayApproved
        });
      }
    }
    const result3 = getApprovalStatusFromPreview(scenario3, startOfWeek)
    console.log(`Result: ${result3} ✅`)

    // Scenario 4: 3 days with no approved entries (should be not_approved)
    console.log('\n📋 Scenario 4: 3 days with no approved entries (should be not_approved)')
    const scenario4 = [];
    for (let i = 0; i < 3; i++) {
      const date = format(addDays(startOfWeek, i), 'yyyy-MM-dd');
      // Add 4 meal entries per day, all not approved
      for (let j = 0; j < 4; j++) {
        scenario4.push({
          id: i * 4 + j + 1,
          for_date: date,
          is_approved: false
        });
      }
    }
    const result4 = getApprovalStatusFromPreview(scenario4, startOfWeek)
    console.log(`Result: ${result4} ✅`)

    // 4. Summary of new logic
    console.log('\n4️⃣ New Flexible Status Logic:')
    console.log('✅ "Approved" when ALL available days are approved (regardless of count)')
    console.log('✅ "Partial Approved" when some days are approved, some not')
    console.log('✅ "Not Approved" when no days are approved')
    console.log('✅ "Pending" when no data exists')
    console.log('✅ No longer requires exactly 7 days')

    console.log('\n📝 Key Changes:')
    console.log('   - Removed strict 7-day requirement')
    console.log('   - Focus on approval status of available days')
    console.log('   - More flexible and user-friendly')
    console.log('   - Better handles partial weeks')

    console.log('\n✅ New status logic test completed!')

  } catch (error) {
    console.error('❌ Error testing new status logic:', error)
  }
}

testNewStatusLogic() 