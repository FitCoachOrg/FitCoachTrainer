// Debug script to check bedtime tasks in the database
import { createClient } from '@supabase/supabase-js'

// You'll need to add your Supabase credentials here
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugBedtimeTasks() {
  console.log("🔍 Debugging Bedtime Tasks...")
  console.log("=" * 50)

  try {
    // Check all schedule entries
    const { data: allEntries, error: allError } = await supabase
      .from('schedule')
      .select('*')
      .limit(10)

    if (allError) {
      console.error("Error fetching all entries:", allError)
      return
    }

    console.log("📊 All Schedule Entries:")
    console.log("-" * 30)
    allEntries?.forEach((entry, index) => {
      console.log(`${index + 1}. ID: ${entry.id}`)
      console.log(`   Type: ${entry.type}`)
      console.log(`   Task: ${entry.task}`)
      console.log(`   Summary: ${entry.summary}`)
      console.log(`   Date: ${entry.for_date}`)
      console.log(`   Time: ${entry.for_time}`)
      console.log(`   Client ID: ${entry.client_id}`)
      console.log("")
    })

    // Check specifically for bedtime entries
    const { data: bedtimeEntries, error: bedtimeError } = await supabase
      .from('schedule')
      .select('*')
      .eq('type', 'bedtime')

    if (bedtimeError) {
      console.error("Error fetching bedtime entries:", bedtimeError)
      return
    }

    console.log("🌙 Bedtime Entries:")
    console.log("-" * 20)
    if (bedtimeEntries && bedtimeEntries.length > 0) {
      bedtimeEntries.forEach((entry, index) => {
        console.log(`${index + 1}. ID: ${entry.id}`)
        console.log(`   Type: ${entry.type}`)
        console.log(`   Task: ${entry.task}`)
        console.log(`   Summary: ${entry.summary}`)
        console.log(`   Date: ${entry.for_date}`)
        console.log(`   Time: ${entry.for_time}`)
        console.log(`   Client ID: ${entry.client_id}`)
        console.log(`   Details: ${JSON.stringify(entry.details_json)}`)
        console.log("")
      })
    } else {
      console.log("❌ No bedtime entries found in database")
    }

    // Check for custom tasks
    const { data: customTasks, error: customError } = await supabase
      .from('schedule')
      .select('*')
      .eq('task', 'custom')

    if (customError) {
      console.error("Error fetching custom tasks:", customError)
      return
    }

    console.log("🔧 Custom Tasks:")
    console.log("-" * 15)
    if (customTasks && customTasks.length > 0) {
      customTasks.forEach((entry, index) => {
        console.log(`${index + 1}. ID: ${entry.id}`)
        console.log(`   Type: ${entry.type}`)
        console.log(`   Task: ${entry.task}`)
        console.log(`   Summary: ${entry.summary}`)
        console.log(`   Date: ${entry.for_date}`)
        console.log(`   Time: ${entry.for_time}`)
        console.log(`   Client ID: ${entry.client_id}`)
        console.log("")
      })
    } else {
      console.log("❌ No custom tasks found in database")
    }

  } catch (error) {
    console.error("❌ Debug error:", error)
  }
}

// Run the debug function
debugBedtimeTasks() 