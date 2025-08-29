// Test script to verify OAuth redirect URLs
// Run this in browser console at http://localhost:5173

console.log('=== OAuth Redirect Test ===');

// Test the redirect URL function
function testOAuthRedirect() {
  const isDevelopment = import.meta.env.DEV;
  console.log('Development mode:', isDevelopment);
  
  if (isDevelopment) {
    const localRedirect = 'http://localhost:5173/dashboard';
    console.log('✅ Local redirect URL:', localRedirect);
    return localRedirect;
  } else {
    const prodRedirect = `${window.location.origin}/dashboard`;
    console.log('✅ Production redirect URL:', prodRedirect);
    return prodRedirect;
  }
}

// Test current environment
console.log('Current origin:', window.location.origin);
console.log('Current URL:', window.location.href);
console.log('Environment:', import.meta.env.MODE);

// Test OAuth redirect
const redirectUrl = testOAuthRedirect();
console.log('Final redirect URL:', redirectUrl);

// Test if we can access the supabase client
if (typeof window.supabase !== 'undefined') {
  console.log('✅ Supabase client available');
} else {
  console.log('❌ Supabase client not available');
}

console.log('=== Test Complete ==='); 