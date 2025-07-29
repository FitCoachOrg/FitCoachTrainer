// Simple browser test - no imports needed
// Copy and paste this into your browser console

console.log('Testing Supabase Function...')

// Test function
async function testFunction() {
  try {
    // Get session
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
    console.log('User email:', session.user.email)
    
    // Test the function
    const response = await fetch('https://zyozeuihjptarceuipwu.supabase.co/functions/v1/send_client_invitation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        clientEmail: 'test@example.com',
        clientName: 'Test Client',
        trainerName: 'Test Trainer',
        trainerId: 'test-uuid'
      })
    })
    
    console.log('Response Status:', response.status)
    console.log('Response Status Text:', response.statusText)
    
    const responseText = await response.text()
    console.log('Response Body:', responseText)
    
    // Try to parse JSON
    try {
      const responseJson = JSON.parse(responseText)
      console.log('Parsed Response:', responseJson)
    } catch (e) {
      console.log('Response is not valid JSON')
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Run the test
testFunction() 