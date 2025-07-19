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
  console.log('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
  console.log('You can get these from your Supabase project settings')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCustomTasks() {
  try {
    console.log('🔍 Checking for custom tasks in database...')
    console.log('Environment variables:')
    console.log('  VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Not set')
    console.log('  VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Not set')
    
    // Check if schedule table exists and has data
    console.log('\n📊 Checking schedule table...')
    
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('schedule')
      .select('*')
      .limit(5)

    if (scheduleError) {
      console.error('❌ Error accessing schedule table:', scheduleError)
      return
    }

    console.log(`✅ Schedule table accessible. Found ${scheduleData.length} total entries`)
    
    if (scheduleData.length > 0) {
      console.log('\n📋 Sample schedule entries:')
      scheduleData.forEach((entry, index) => {
        console.log(`  ${index + 1}. ${entry.for_date} at ${entry.for_time}: ${entry.task} (${entry.type})`)
      })
    }

    // Check specifically for custom tasks
    console.log('\n🎯 Checking for custom tasks...')
    
    const { data: customTasks, error: customError } = await supabase
      .from('schedule')
      .select('*')
      .eq('type', 'custom')
      .order('for_date', { ascending: true })

    if (customError) {
      console.error('❌ Error querying custom tasks:', customError)
      return
    }

    console.log(`✅ Found ${customTasks.length} custom tasks`)

    if (customTasks.length > 0) {
      console.log('\n📋 Custom task details:')
      customTasks.forEach((task, index) => {
        console.log(`\n  Task ${index + 1}:`)
        console.log(`    Date: ${task.for_date}`)
        console.log(`    Time: ${task.for_time}`)
        console.log(`    Task: ${task.task}`)
        console.log(`    Summary: ${task.summary}`)
        console.log(`    Coach Tip: ${task.coach_tip}`)
        console.log(`    Icon: ${task.icon}`)
        console.log(`    Client ID: ${task.client_id}`)
        if (task.details_json) {
          console.log(`    Details: ${JSON.stringify(task.details_json, null, 2)}`)
        }
      })
    } else {
      console.log('❌ No custom tasks found in database')
      console.log('\n💡 This could mean:')
      console.log('  1. No custom tasks have been created yet')
      console.log('  2. Custom tasks are being saved with a different type')
      console.log('  3. There might be an issue with the save process')
    }

    // Check for recent entries (last 7 days)
    console.log('\n📅 Checking for recent entries (last 7 days)...')
    
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

    const { data: recentTasks, error: recentError } = await supabase
      .from('schedule')
      .select('*')
      .gte('for_date', sevenDaysAgoStr)
      .order('for_date', { ascending: true })

    if (recentError) {
      console.error('❌ Error querying recent tasks:', recentError)
      return
    }

    console.log(`✅ Found ${recentTasks.length} tasks scheduled for the last 7 days`)

    if (recentTasks.length > 0) {
      console.log('\n📋 Recent tasks:')
      recentTasks.forEach((task, index) => {
        console.log(`  ${index + 1}. ${task.for_date} at ${task.for_time}: ${task.task} (${task.type})`)
      })
    }

    // Check table structure
    console.log('\n🏗️ Checking table structure...')
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('schedule')
      .select('*')
      .limit(1)

    if (tableError) {
      console.error('❌ Error checking table structure:', tableError)
      return
    }

    if (tableInfo && tableInfo.length > 0) {
      const sampleEntry = tableInfo[0]
      console.log('✅ Table structure looks good')
      console.log('Available fields:', Object.keys(sampleEntry))
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the check
checkCustomTasks() 