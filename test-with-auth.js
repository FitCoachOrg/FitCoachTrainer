// Test the function with authentication
console.log('Function exists! Now testing with auth...')

// Test 1: Without auth header (should return 401)
fetch('https://zyozeuihjptarceuipwu.supabase.co/functions/v1/send_client_invitation', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    clientEmail: 'test@example.com'
  })
}).then(r => r.text()).then(t => {
  console.log('No auth test - Status:', r.status)
  console.log('No auth test - Response:', t)
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
}).then(r => r.text()).then(t => {
  console.log('Dummy token test - Status:', r.status)
  console.log('Dummy token test - Response:', t)
}).catch(e => console.error('Error:', e))

// Test 3: With minimal payload
fetch('https://zyozeuihjptarceuipwu.supabase.co/functions/v1/send_client_invitation', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer dummy_token'
  },
  body: JSON.stringify({
    clientEmail: 'test@example.com'
  })
}).then(r => r.text()).then(t => {
  console.log('Minimal payload test - Status:', r.status)
  console.log('Minimal payload test - Response:', t)
}).catch(e => console.error('Error:', e)) 