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

// Copy the exact logic from the component
const isApproved = (val) => val === true || val === 1 || val === 'true';

const getApprovalStatusFromPreview = (rows, startDate) => {
  if (!rows || rows.length === 0) return 'pending';
  
  // Calculate expected total days for the week (7 days)
  const expectedTotalDays = 7;
  
  // Get unique days from the rows (since there are multiple meal entries per day)
  const uniqueDays = Array.from(new Set(rows.map(row => row.for_date)));
  const actualTotalDays = uniqueDays.length;
  
  // Debug logging
  console.log('🔍 DEBUG: Status calculation details:');
  console.log('Expected total days:', expectedTotalDays);
  console.log('Actual unique days in preview:', actualTotalDays);
  console.log('Unique days:', uniqueDays);
  console.log('Total rows (meal entries):', rows.length);
  console.log('is_approved types:', rows.map(r => typeof r.is_approved), 'values:', rows.map(r => r.is_approved));
  
  // If we have fewer days than expected, it's partial regardless of approval status
  if (actualTotalDays < expectedTotalDays) {
    console.log('❌ Missing days detected. Actual:', actualTotalDays, 'Expected:', expectedTotalDays);
    console.log('Missing days count:', expectedTotalDays - actualTotalDays);
    
    // Check if all existing days are approved
    const approvedDays = uniqueDays.filter(day => {
      const dayRows = rows.filter(row => row.for_date === day);
      const allApproved = dayRows.every(row => isApproved(row.is_approved));
      console.log(`Day ${day}: ${dayRows.length} entries, all approved: ${allApproved}`);
      return allApproved;
    });
    
    console.log('Approved days:', approvedDays);
    console.log('Approved days count:', approvedDays.length);
    
    if (approvedDays.length > 0) {
      console.log('✅ Result: partial_approved (some days missing but existing ones approved)');
      return 'partial_approved';
    } else {
      console.log('❌ Result: not_approved (some days missing and none approved)');
      return 'not_approved';
    }
  }
  
  // If we have all expected days, check if all days are approved
  const allDaysApproved = uniqueDays.every(day => {
    const dayRows = rows.filter(row => row.for_date === day);
    const allApproved = dayRows.every(row => isApproved(row.is_approved));
    console.log(`Day ${day}: ${dayRows.length} entries, all approved: ${allApproved}`);
    return allApproved;
  });
  
  console.log('All days approved:', allDaysApproved);
  
  if (allDaysApproved && actualTotalDays === expectedTotalDays) {
    console.log('✅ Result: approved (all 7 days exist and all approved)');
    return 'approved';
  } else if (actualTotalDays === expectedTotalDays) {
    console.log('⚠️ Result: partial_approved (all 7 days exist but some not approved)');
    return 'partial_approved';
  } else {
    console.log('❌ Result: not_approved (all 7 days exist but none approved)');
    return 'not_approved';
  }
};

async function debugCurrentStatus() {
  console.log('🔍 Debugging Current Status Issue')
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

    // 2. Check current week data
    console.log('\n2️⃣ Checking current week data...')
    
    const currentDate = new Date()
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1) // Monday
    
    const startDateString = format(startOfWeek, 'yyyy-MM-dd');
    const endDateString = format(addDays(startOfWeek, 6), 'yyyy-MM-dd');
    
    console.log(`📅 Checking week: ${startDateString} to ${endDateString}`)
    
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
      console.log(`📊 Preview data found: ${previewData?.length || 0} meal entries`)
      if (previewData && previewData.length > 0) {
        console.log('\n📋 Raw data:')
        previewData.forEach((row, index) => {
          console.log(`${index + 1}. Date: ${row.for_date}, Approved: ${row.is_approved}, Type: ${typeof row.is_approved}`)
        })
        
        console.log('\n🔍 Running status calculation...')
        const result = getApprovalStatusFromPreview(previewData, startOfWeek)
        console.log(`\n🎯 Final Result: ${result}`)
      } else {
        console.log('❌ No preview data found for current week')
      }
    }

    // 3. Check if there are any approved plans in any week
    console.log('\n3️⃣ Checking for any approved plans in any week...')
    
    const { data: allApprovedData, error: approvedError } = await supabase
      .from('schedule_preview')
      .select('id, is_approved, for_date, client_id, type')
      .eq('client_id', clientId)
      .eq('type', 'meal')
      .eq('is_approved', true)
      .order('for_date', { ascending: false })
      .limit(20);

    if (approvedError) {
      console.error('❌ Approved data check error:', approvedError)
    } else {
      console.log(`📊 Total approved entries found: ${allApprovedData?.length || 0}`)
      if (allApprovedData && allApprovedData.length > 0) {
        console.log('Recent approved dates:', allApprovedData.map(r => r.for_date))
        console.log('Recent approval statuses:', allApprovedData.map(r => r.is_approved))
      }
    }

    console.log('\n✅ Debug completed!')

  } catch (error) {
    console.error('❌ Error debugging current status:', error)
  }
}

debugCurrentStatus() 