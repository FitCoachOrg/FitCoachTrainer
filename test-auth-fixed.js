// Fixed authentication test
console.log('Function exists! Testing authentication...')

// Test 1: Without auth header (should return 401)
fetch('https://zyozeuihjptarceuipwu.supabase.co/functions/v1/send_client_invitation', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    clientEmail: 'test@example.com'
  })
}).then(response => response.text()).then(text => {
  console.log('No auth test - Status:', response.status)
  console.log('No auth test - Response:', text)
}).catch(e => console.error('Error:', e))

// Test 2: With dummy token (should return 401)
fetch('https://zyozeuihjptarceuipwu.supabase.co/functions/v1/send_client_invitation', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer dummy_token'
  },
  body: JSON.stringify({
    clientEmail: 'test@example.com'
  })
}).then(response => response.text()).then(text => {
  console.log('Dummy token test - Status:', response.status)
  console.log('Dummy token test - Response:', text)
}).catch(e => console.error('Error:', e)) 