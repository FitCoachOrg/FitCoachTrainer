// Get JWT token from browser storage
console.log('Looking for JWT token...')

// Check localStorage
const localToken = localStorage.getItem('sb-zyozeuihjptarceuipwu-auth-token')
if (localToken) {
  console.log('Found token in localStorage:', localToken.substring(0, 50) + '...')
}

// Check sessionStorage
const sessionToken = sessionStorage.getItem('sb-zyozeuihjptarceuipwu-auth-token')
if (sessionToken) {
  console.log('Found token in sessionStorage:', sessionToken.substring(0, 50) + '...')
}

// Check all localStorage keys
console.log('All localStorage keys:', Object.keys(localStorage))

// Check all sessionStorage keys
console.log('All sessionStorage keys:', Object.keys(sessionStorage))

// Look for any key containing 'token' or 'auth'
const allKeys = [...Object.keys(localStorage), ...Object.keys(sessionStorage)]
const tokenKeys = allKeys.filter(key => key.toLowerCase().includes('token') || key.toLowerCase().includes('auth'))
console.log('Keys containing token or auth:', tokenKeys) 