// Test with real JWT token - FIXED VERSION
console.log('Testing with real JWT token...')

const authData = localStorage.getItem('sb-zyozeuihjptarceuipwu-auth-token')
const tokenData = JSON.parse(authData)
const accessToken = tokenData.access_token

console.log('Token found:', accessToken.substring(0, 50) + '...')

fetch('https://zyozeuihjptarceuipwu.supabase.co/functions/v1/send_client_invitation', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    clientEmail: 'test@example.com',
    clientName: 'Test Client',
    trainerName: 'Test Trainer',
    trainerId: 'test-uuid',
    customMessage: 'This is a test invitation'
  })
}).then(response => {
  console.log('Real token test - Status:', response.status)
  return response.text()
}).then(text => {
  console.log('Real token test - Response:', text)
  
  try {
    const responseJson = JSON.parse(text)
    console.log('Parsed Response:', responseJson)
    
    if (responseJson.error) {
      console.error('Function Error:', responseJson.error)
      if (responseJson.debug_info) {
        console.error('Debug Info:', responseJson.debug_info)
      }
    } else {
      console.log('Function executed successfully!')
    }
  } catch (e) {
    console.log('Response is not valid JSON')
  }
}).catch(e => console.error('Error:', e)) 