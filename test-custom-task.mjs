import { createClient } from '@supabase/supabase-js'
import { format, addDays, addWeeks, addMonths } from 'date-fns'

// Test configuration - use same env var names as client
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  console.log('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
  console.log('You can get these from your Supabase project settings')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Test data for custom task
const testTaskData = {
  taskType: "water",
  frequency: "daily",
  time: "09:00",
  programName: "Test Water Intake Program"
}

// Helper function to generate dates for the next 3 months
const generateDates = (frequency, dayOfWeek, dayOfMonth) => {
  const dates = []
  const startDate = new Date()
  const endDate = new Date()
  endDate.setMonth(endDate.getMonth() + 3) // 3 months from now

  let currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    let shouldAdd = false

    switch (frequency) {
      case "daily":
        shouldAdd = true
        break
      case "weekly":
        if (dayOfWeek !== undefined && currentDate.getDay() === dayOfWeek) {
          shouldAdd = true
        }
        break
      case "monthly":
        if (dayOfMonth !== undefined && currentDate.getDate() === dayOfMonth) {
          shouldAdd = true
        }
        break
      case "quarterly":
        if (dayOfMonth !== undefined && currentDate.getDate() === dayOfMonth) {
          const month = currentDate.getMonth()
          if (month === 0 || month === 3 || month === 6 || month === 9) { // Jan, Apr, Jul, Oct
            shouldAdd = true
          }
        }
        break
    }

    if (shouldAdd) {
      dates.push(new Date(currentDate))
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return dates
}

// Helper function to get task summary
const getTaskSummary = (taskType, otherDetails) => {
  switch (taskType) {
    case "water": return "Hydration"
    case "sleep": return "Wake Up"
    case "weight": return "Weight"
    case "progress": return "Progress Picture"
    case "other": return otherDetails || "Custom Event"
    default: return "Task"
  }
}

// Helper function to get task icon name
const getTaskIconName = (taskType) => {
  switch (taskType) {
    case "water": return "droplet"
    case "sleep": return "bed"
    case "weight": return "weight"
    case "progress": return "camera"
    case "other": return "bell"
    default: return "bell"
  }
}

async function testCustomTaskCreation() {
  try {
    console.log('Testing custom task creation...')
    console.log('Environment variables:')
    console.log('  VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Not set')
    console.log('  VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Not set')
    
    // Generate dates for the next 3 months
    const dates = generateDates(
      testTaskData.frequency, 
      testTaskData.dayOfWeek, 
      testTaskData.dayOfMonth
    )

    console.log(`Generated ${dates.length} dates for ${testTaskData.frequency} frequency`)

    if (dates.length === 0) {
      console.error('No dates generated')
      return
    }

    // Prepare schedule entries
    const scheduleEntries = dates.map(date => ({
      client_id: 1, // Test client ID
      task: getTaskSummary(testTaskData.taskType, testTaskData.otherDetails),
      summary: testTaskData.programName,
      type: "custom",
      for_date: format(date, 'yyyy-MM-dd'),
      for_time: testTaskData.time,
      icon: getTaskIconName(testTaskData.taskType),
      coach_tip: testTaskData.otherDetails || "Water Intake",
      details_json: {
        task_type: testTaskData.taskType,
        frequency: testTaskData.frequency,
        program_name: testTaskData.programName,
        custom_details: testTaskData.otherDetails
      }
    }))

    console.log('Sample schedule entry:', scheduleEntries[0])
    console.log(`Prepared ${scheduleEntries.length} entries to insert`)

    // Insert into database
    const { data, error } = await supabase
      .from('schedule')
      .insert(scheduleEntries)
      .select()

    if (error) {
      console.error('Error inserting schedule entries:', error)
      throw error
    }

    console.log('✅ Successfully inserted custom task entries')
    console.log(`Inserted ${data.length} entries`)
    
    // Verify the entries were created
    const { data: verifyData, error: verifyError } = await supabase
      .from('schedule')
      .select('*')
      .eq('type', 'custom')
      .eq('summary', testTaskData.programName)
      .order('for_date', { ascending: true })

    if (verifyError) {
      console.error('Error verifying entries:', verifyError)
    } else {
      console.log(`✅ Verified ${verifyData.length} entries in database`)
      console.log('Sample entries:')
      verifyData.slice(0, 3).forEach(entry => {
        console.log(`  - ${entry.for_date} at ${entry.for_time}: ${entry.task}`)
      })
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testCustomTaskCreation() 