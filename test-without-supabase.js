// Test without requiring Supabase client
console.log('Testing Supabase Function without Supabase client...')

// Method 1: Test with a dummy token (will show 401 if function exists)
async function testWithDummyToken() {
  try {
    console.log('Testing with dummy token...')
    
    const response = await fetch('https://zyozeuihjptarceuipwu.supabase.co/functions/v1/send_client_invitation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dummy_token'
      },
      body: JSON.stringify({
        clientEmail: 'test@example.com'
      })
    })
    
    console.log('Response Status:', response.status)
    console.log('Response Status Text:', response.statusText)
    
    const responseText = await response.text()
    console.log('Response Body:', responseText)
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Method 2: Test without auth header (will show 401 if function exists)
async function testWithoutAuth() {
  try {
    console.log('Testing without auth header...')
    
    const response = await fetch('https://zyozeuihjptarceuipwu.supabase.co/functions/v1/send_client_invitation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clientEmail: 'test@example.com'
      })
    })
    
    console.log('Response Status:', response.status)
    console.log('Response Status Text:', response.statusText)
    
    const responseText = await response.text()
    console.log('Response Body:', responseText)
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Method 3: Test if function exists at all
async function testFunctionExists() {
  try {
    console.log('Testing if function endpoint exists...')
    
    const response = await fetch('https://zyozeuihjptarceuipwu.supabase.co/functions/v1/send_client_invitation', {
      method: 'OPTIONS'
    })
    
    console.log('OPTIONS Response Status:', response.status)
    console.log('OPTIONS Response Status Text:', response.statusText)
    
  } catch (error) {
    console.error('Function endpoint test failed:', error)
  }
}

// Run all tests
console.log('Running all tests...')
testFunctionExists()
testWithoutAuth()
testWithDummyToken() 