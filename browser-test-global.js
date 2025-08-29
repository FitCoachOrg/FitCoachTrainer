// Browser test that checks for Supabase client
console.log('Testing Supabase Function...')

// Check if supabase is available globally
if (typeof supabase === 'undefined') {
  console.log('Supabase not found globally. Checking for alternatives...')
  
  // Try to find Supabase client in window object
  const possibleSupabase = window.supabase || window.Supabase || window.supabaseClient
  
  if (possibleSupabase) {
    console.log('Found Supabase client:', possibleSupabase)
    window.supabase = possibleSupabase
  } else {
    console.error('Supabase client not found. Please make sure you are logged into the application.')
    console.log('Available global objects:', Object.keys(window).filter(key => key.toLowerCase().includes('supabase')))
    return
  }
}

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