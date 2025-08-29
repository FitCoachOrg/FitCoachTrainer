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

async function checkClientTable() {
  console.log('🔍 Checking client table structure...')
  console.log('=' .repeat(50))

  try {
    // Get all data from client table
    const { data: clients, error } = await supabase
      .from('client')
      .select('*')
      .limit(5)

    if (error) {
      console.error('❌ Error querying client table:', error)
      return
    }

    console.log(`📊 Found ${clients?.length || 0} clients:`)
    
    if (clients && clients.length > 0) {
      console.log('\n📋 Sample client data:')
      const sampleClient = clients[0]
      Object.keys(sampleClient).forEach(key => {
        console.log(`   - ${key}: ${sampleClient[key]}`)
      })
      
      console.log('\n📋 All clients:')
      clients.forEach((client, index) => {
        console.log(`   ${index + 1}. ID: ${client.id || 'N/A'}, Name: ${client.name || 'N/A'}, Email: ${client.email || 'N/A'}`)
      })
    } else {
      console.log('❌ No clients found in database')
    }

  } catch (error) {
    console.error('❌ Error checking client table:', error)
  }
}

checkClientTable() 