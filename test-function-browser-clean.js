// Browser-based test for Supabase Function
// Run this in your browser console after logging into your application

console.log('Testing Supabase Function from Browser...')

// Get the current session token
async function testSupabaseFunction() {
  try {
    // Get the current session from Supabase
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Session error:', error)
      return
    }
    
    if (!session) {
      console.error('No active session. Please log in first.')
      return
    }
    
    console.log('Session found')
    console.log('User:', session.user.email)
    console.log('Token available:', !!session.access_token)
    
    // Test the function
    const testPayload = {
      clientEmail: 'test@example.com',
      clientName: 'Test Client',
      trainerName: 'Test Trainer',
      trainerId: 'test-uuid',
      customMessage: 'This is a test invitation from browser'
    }
    
    console.log('Testing with payload:', testPayload)
    
    const response = await fetch('https://zyozeuihjptarceuipwu.supabase.co/functions/v1/send_client_invitation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(testPayload)
    })
    
    console.log('Response Status:', response.status)
    console.log('Response Status Text:', response.statusText)
    
    const responseText = await response.text()
    console.log('Response Body:', responseText)
    
    // Try to parse JSON
    try {
      const responseJson = JSON.parse(responseText)
      console.log('Parsed Response:', responseJson)
      
      if (responseJson.error) {
        console.error('Function Error:', responseJson.error)
        console.error('Debug Info:', responseJson.debug_info || 'No debug info')
      } else {
        console.log('Function executed successfully')
      }
    } catch (e) {
      console.log('Response is not valid JSON')
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Run the test
testSupabaseFunction()

// Alternative: Test with minimal payload to check environment variables
async function testMinimalPayload() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.error('No session available')
      return
    }
    
    console.log('Testing with minimal payload...')
    
    const response = await fetch('https://zyozeuihjptarceuipwu.supabase.co/functions/v1/send_client_invitation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        clientEmail: 'minimal-test@example.com'
      })
    })
    
    const responseText = await response.text()
    console.log('Minimal Test Response:', responseText)
    
  } catch (error) {
    console.error('Minimal test failed:', error)
  }
}

// Uncomment to run minimal test
// testMinimalPayload() 