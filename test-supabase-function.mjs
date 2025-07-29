#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// Configuration - Update these with your actual values
const SUPABASE_URL = 'https://zyozeuihjptarceuipwu.supabase.co' // Your project URL
const SUPABASE_ANON_KEY = 'your_supabase_anon_key_here' // Get this from your Supabase dashboard

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testSupabaseFunction() {
  console.log('🔍 Testing Supabase Function...')
  console.log('📡 Supabase URL:', SUPABASE_URL)
  
  try {
    // Step 1: Get current session
    console.log('\n1️⃣ Getting current session...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError)
      return
    }
    
    if (!session) {
      console.log('⚠️  No active session found. Please log in first.')
      console.log('💡 You can log in through your application, then run this test.')
      return
    }
    
    console.log('✅ Session found')
    console.log('👤 User email:', session.user.email)
    console.log('🔑 Token available:', !!session.access_token)
    
    // Step 2: Test the function
    console.log('\n2️⃣ Testing send_client_invitation function...')
    
    const testPayload = {
      clientEmail: 'test@example.com',
      clientName: 'Test Client',
      trainerName: 'Test Trainer',
      trainerId: 'test-uuid',
      customMessage: 'This is a test invitation'
    }
    
    console.log('📤 Sending payload:', JSON.stringify(testPayload, null, 2))
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send_client_invitation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(testPayload)
    })
    
    console.log('\n📡 Response Details:')
    console.log('Status:', response.status)
    console.log('Status Text:', response.statusText)
    console.log('Headers:', Object.fromEntries(response.headers.entries()))
    
    const responseText = await response.text()
    console.log('\n📄 Response Body:')
    console.log(responseText)
    
    // Try to parse as JSON if possible
    try {
      const responseJson = JSON.parse(responseText)
      console.log('\n📋 Parsed Response:')
      console.log(JSON.stringify(responseJson, null, 2))
    } catch (e) {
      console.log('⚠️  Response is not valid JSON')
    }
    
    // Step 3: Check environment variables
    console.log('\n3️⃣ Checking environment variables...')
    console.log('💡 This will help identify if Mailgun config is missing')
    
    const envTestResponse = await fetch(`${SUPABASE_URL}/functions/v1/send_client_invitation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        clientEmail: 'env-test@example.com'
      })
    })
    
    const envTestText = await envTestResponse.text()
    console.log('Environment Test Response:', envTestText)
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testSupabaseFunction() 