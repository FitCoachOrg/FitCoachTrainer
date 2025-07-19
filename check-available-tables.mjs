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

async function checkAvailableTables() {
  console.log('🔍 Checking available tables in database...')
  console.log('=' .repeat(50))

  try {
    // Try to query information_schema to see available tables
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')

    if (error) {
      console.error('❌ Error querying information_schema:', error)
      
      // Try a different approach - test common table names
      const commonTables = ['clients', 'client', 'users', 'schedule', 'client_data']
      
      for (const tableName of commonTables) {
        try {
          const { data, error: testError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1)
          
          if (!testError) {
            console.log(`✅ Table '${tableName}' exists`)
          } else {
            console.log(`❌ Table '${tableName}' does not exist`)
          }
        } catch (e) {
          console.log(`❌ Table '${tableName}' does not exist`)
        }
      }
    } else {
      console.log('📋 Available tables:')
      tables?.forEach(table => {
        console.log(`   - ${table.table_name}`)
      })
    }

  } catch (error) {
    console.error('❌ Error checking tables:', error)
  }
}

checkAvailableTables() 