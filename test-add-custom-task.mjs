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

async function addTestCustomTask() {
  console.log('🧪 Adding test custom task...')
  console.log('=' .repeat(50))

  try {
    // Get a client ID
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

    // Add test custom tasks for different types
    const testTasks = [
      {
        client_id: clientId,
        for_date: new Date().toISOString().split('T')[0], // Today
        type: 'hydration',
        summary: 'custom',
        task: 'custom',
        for_time: '09:00',
        coach_tip: 'Stay hydrated throughout the day!',
        icon: 'droplet',
        details_json: { amount: '8 glasses', frequency: 'daily' }
      },
      {
        client_id: clientId,
        for_date: new Date().toISOString().split('T')[0], // Today
        type: 'weight',
        summary: 'custom',
        task: 'custom',
        for_time: '07:00',
        coach_tip: 'Track your weight progress weekly',
        icon: 'weight-scale',
        details_json: { frequency: 'weekly', unit: 'kg' }
      },
      {
        client_id: clientId,
        for_date: new Date().toISOString().split('T')[0], // Today
        type: 'wakeup',
        summary: 'custom',
        task: 'custom',
        for_time: '06:30',
        coach_tip: 'Consistent sleep schedule is key to success',
        icon: 'bed',
        details_json: { target_hours: 8, quality_tracker: true }
      }
    ]

    console.log('\n📝 Adding test custom tasks...')
    
    for (const task of testTasks) {
      const { data, error } = await supabase
        .from('schedule')
        .insert(task)
        .select()

      if (error) {
        console.error(`❌ Error adding ${task.type} task:`, error)
      } else {
        console.log(`✅ Added ${task.type} task successfully`)
      }
    }

    // Verify the tasks were added
    console.log('\n🔍 Verifying added tasks...')
    const { data: addedTasks, error: verifyError } = await supabase
      .from('schedule')
      .select('*')
      .eq('client_id', clientId)
      .eq('task', 'custom')
      .eq('for_date', new Date().toISOString().split('T')[0])

    if (verifyError) throw verifyError

    console.log(`📊 Found ${addedTasks?.length || 0} custom tasks for today:`)
    if (addedTasks && addedTasks.length > 0) {
      addedTasks.forEach((task, index) => {
        console.log(`   ${index + 1}. Type: ${task.type}, Time: ${task.for_time}, Coach Tip: ${task.coach_tip}`)
      })
    }

    console.log('\n✅ Test custom tasks added successfully!')
    console.log('📝 You can now test the Programs screen to see these custom tasks displayed in card format.')

  } catch (error) {
    console.error('❌ Error adding test custom task:', error)
  }
}

addTestCustomTask() 