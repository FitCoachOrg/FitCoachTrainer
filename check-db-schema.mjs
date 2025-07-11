import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabaseSchema() {
  try {
    console.log('Checking database schema...')
    
    // Try to query schedule_events table
    const { data, error } = await supabase
      .from('schedule_events')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('❌ schedule_events table does not exist or is not accessible')
      console.log('Error:', error)
      
      // Try to create the table with a simple schema
      console.log('\nAttempting to create schedule_events table...')
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS schedule_events (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          event_type VARCHAR(50) NOT NULL,
          start_time TIMESTAMP WITH TIME ZONE NOT NULL,
          end_time TIMESTAMP WITH TIME ZONE NOT NULL,
          duration_minutes INTEGER NOT NULL,
          location VARCHAR(255),
          is_virtual BOOLEAN DEFAULT false,
          meeting_url VARCHAR(500),
          meeting_platform VARCHAR(50),
          trainer_id UUID NOT NULL,
          trainer_email VARCHAR(255) NOT NULL,
          client_id BIGINT,
          client_name VARCHAR(255),
          client_email VARCHAR(255),
          status VARCHAR(50) DEFAULT 'scheduled',
          priority VARCHAR(20) DEFAULT 'medium',
          is_recurring BOOLEAN DEFAULT false,
          recurring_pattern VARCHAR(50),
          recurring_end_date DATE,
          parent_event_id INTEGER,
          color VARCHAR(7) DEFAULT '#3B82F6',
          custom_color VARCHAR(7),
          reminder_minutes INTEGER DEFAULT 15,
          send_reminder BOOLEAN DEFAULT true,
          reminder_sent BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_by UUID,
          updated_by UUID
        );
      `
      
      // Note: This would need to be run in Supabase SQL editor
      console.log('Please run this SQL in your Supabase SQL editor:')
      console.log(createTableSQL)
      
      return
    }
    
    console.log('✅ schedule_events table exists and is accessible')
    console.log('Sample data structure:', Object.keys(data[0] || {}))
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkDatabaseSchema() 