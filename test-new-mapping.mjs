import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load environment variables from .env file
const envContent = readFileSync('.env', 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

// Set environment variables
Object.entries(envVars).forEach(([key, value]) => {
  process.env[key] = value
})

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Test the new mapping functions
function getTaskSummary(taskType) {
  switch (taskType) {
    case "water": return "custom"
    case "sleep": return "custom"
    case "weight": return "custom"
    case "progress": return "custom"
    case "other": return "custom"
    default: return "custom"
  }
}

function getTaskType(taskType) {
  switch (taskType) {
    case "water": return "hydration"
    case "sleep": return "wakeup"
    case "weight": return "weight"
    case "progress": return "progresspicture"
    case "other": return "other"
    default: return "other"
  }
}

function getTaskIconName(taskType) {
  switch (taskType) {
    case "water": return "droplet"
    case "sleep": return "bed"
    case "weight": return "weight-scale"
    case "progress": return "camera"
    case "other": return "bell"
    default: return "bell"
  }
}

async function testNewMapping() {
  console.log('🧪 Testing new task/type mapping...')
  
  // Test step calculation with coach message
  console.log('\n📊 Testing step calculation:')
  console.log('Daily frequency: 5 steps (Task, Frequency, Time, Coach Message, Program Name)')
  console.log('Weekly/Monthly/Quarterly: 6 steps (Task, Frequency, Day/Date, Time, Coach Message, Program Name)')
  
  const testCases = [
    { taskType: "water", expectedTask: "custom", expectedType: "hydration", expectedIcon: "droplet" },
    { taskType: "sleep", expectedTask: "custom", expectedType: "wakeup", expectedIcon: "bed" },
    { taskType: "weight", expectedTask: "custom", expectedType: "weight", expectedIcon: "weight-scale" },
    { taskType: "progress", expectedTask: "custom", expectedType: "progresspicture", expectedIcon: "camera" },
    { taskType: "other", expectedTask: "custom", expectedType: "other", expectedIcon: "bell" }
  ]

  console.log('\n📋 Mapping Test Results:')
  testCases.forEach(testCase => {
    const actualTask = getTaskSummary(testCase.taskType)
    const actualType = getTaskType(testCase.taskType)
    const actualIcon = getTaskIconName(testCase.taskType)
    
    console.log(`\n  ${testCase.taskType}:`)
    console.log(`    Task: ${actualTask} (expected: ${testCase.expectedTask})`)
    console.log(`    Type: ${actualType} (expected: ${testCase.expectedType})`)
    console.log(`    Icon: ${actualIcon} (expected: ${testCase.expectedIcon})`)
    
    const taskMatch = actualTask === testCase.expectedTask ? '✅' : '❌'
    const typeMatch = actualType === testCase.expectedType ? '✅' : '❌'
    const iconMatch = actualIcon === testCase.expectedIcon ? '✅' : '❌'
    
    console.log(`    Task match: ${taskMatch}`)
    console.log(`    Type match: ${typeMatch}`)
    console.log(`    Icon match: ${iconMatch}`)
  })

  // Test creating a sample entry
  console.log('\n🎯 Testing sample database entry creation...')
  
  const sampleEntry = {
    client_id: 1,
    task: getTaskSummary("water"),
    summary: "Test Water Intake",
    type: getTaskType("water"),
    for_date: "2025-01-20",
    for_time: "09:00:00",
    icon: "droplet",
    coach_tip: "Water Intake",
    details_json: {
      task_type: "water",
      frequency: "daily",
      program_name: "Test Water Intake",
      custom_details: null
    }
  }

  console.log('\n📝 Sample Entry Structure:')
  console.log(JSON.stringify(sampleEntry, null, 2))

  // Check if we can find any existing entries with the new mapping
  console.log('\n🔍 Checking for existing entries with new mapping...')
  
  const { data: customEntries, error } = await supabase
    .from('schedule')
    .select('*')
    .eq('task', 'custom')
    .limit(5)

  if (error) {
    console.error('❌ Error querying custom entries:', error)
    return
  }

  console.log(`✅ Found ${customEntries.length} entries with task = "custom"`)
  
  if (customEntries.length > 0) {
    console.log('\n📋 Sample entries with new mapping:')
    customEntries.forEach((entry, index) => {
      console.log(`\n  Entry ${index + 1}:`)
      console.log(`    Task: ${entry.task}`)
      console.log(`    Type: ${entry.type}`)
      console.log(`    Summary: ${entry.summary}`)
      console.log(`    Date: ${entry.for_date}`)
      console.log(`    Time: ${entry.for_time}`)
    })
  } else {
    console.log('ℹ️  No entries found with task = "custom" yet')
    console.log('   This is expected if no new custom tasks have been created with the updated mapping')
  }

  // Test creating a sample entry with the new mapping
  console.log('\n🧪 Testing database insertion with new mapping...')
  
  // First, get an existing client ID
  const { data: clients, error: clientError } = await supabase
    .from('client')
    .select('client_id')
    .limit(1)

  if (clientError) {
    console.error('❌ Error getting client ID:', clientError)
    return
  }

  if (!clients || clients.length === 0) {
    console.log('❌ No clients found in database')
    return
  }

  const existingClientId = clients[0].client_id
  console.log(`📋 Using existing client ID: ${existingClientId}`)
  
  const testEntry = {
    client_id: existingClientId,
    task: "custom",
    summary: "Test Water Intake Program",
    type: "hydration",
    for_date: "2025-01-20",
    for_time: "09:00:00",
    icon: "droplet",
    coach_tip: "Water Intake",
    details_json: {
      task_type: "water",
      frequency: "daily",
      program_name: "Test Water Intake Program",
      custom_details: null
    }
  }

  try {
    const { data: insertedData, error: insertError } = await supabase
      .from('schedule')
      .insert(testEntry)
      .select()

    if (insertError) {
      console.error('❌ Error inserting test entry:', insertError)
    } else {
      console.log('✅ Successfully inserted test entry with new mapping!')
      console.log('📝 Inserted entry:')
      console.log(JSON.stringify(insertedData[0], null, 2))
      
      // Clean up - delete the test entry
      const { error: deleteError } = await supabase
        .from('schedule')
        .delete()
        .eq('id', insertedData[0].id)
      
      if (deleteError) {
        console.log('⚠️  Could not clean up test entry:', deleteError)
      } else {
        console.log('🧹 Test entry cleaned up successfully')
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error during test:', error)
  }
}

testNewMapping() 