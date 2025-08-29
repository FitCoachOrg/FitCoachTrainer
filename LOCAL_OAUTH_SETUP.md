# Local OAuth Development Setup

## 🚀 **Quick Fix for OAuth Redirects**

The issue is that Google OAuth is redirecting to production instead of localhost. Here's how to fix it:

### **1. Environment Configuration**

Create a `.env.local` file in the `client/` directory:

```bash
# client/.env.local
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
VITE_IS_DEVELOPMENT=true
```

### **2. Google OAuth Configuration**

You need to add localhost URLs to your Google OAuth configuration:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services → Credentials**
3. Find your OAuth 2.0 Client ID
4. Add these **Authorized redirect URIs**:
   ```
   http://localhost:5173/auth/callback
   http://127.0.0.1:5173/auth/callback
   http://localhost:3000/auth/callback
   http://127.0.0.1:3000/auth/callback
   ```

### **3. Supabase Local Configuration**

Update your local Supabase configuration:

```bash
# In your project root, create supabase/config.toml
[api]
enabled = true
port = 54321
schemas = ["public", "storage", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[auth]
enabled = true
port = 54322
site_url = "http://localhost:5173"
additional_redirect_urls = ["http://localhost:3000", "http://127.0.0.1:5173"]
jwt_expiry = 3600
refresh_token_rotation_enabled = true
security_update_password_require_reauthentication = true

[db]
port = 54322
shadow_port = 54320
major_version = 15

[realtime]
enabled = true
port = 54323

[storage]
enabled = true
port = 54324
file_size_limit = "50MiB"

[edge_runtime]
enabled = true
port = 54325
```

### **4. Start Local Development**

```bash
# Terminal 1: Start Supabase locally
supabase start

# Terminal 2: Start the frontend (on a different port)
cd client
npm run dev -- --port 5173
```

### **5. Test OAuth Flow**

1. Go to `http://localhost:5173`
2. Click "Continue with Google"
3. Should redirect to Google OAuth
4. After authentication, should redirect back to `http://localhost:5173/dashboard`

## 🔧 **Alternative: Use Production OAuth with Local Frontend**

If you want to use production OAuth but local frontend:

### **1. Update Environment Variables**

```bash
# client/.env.local
VITE_SUPABASE_URL=https://zyozeuihjptarceuipwu.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_IS_DEVELOPMENT=true
```

### **2. Add Localhost to Production OAuth**

Add these to your production Google OAuth redirect URIs:
```
http://localhost:5173/auth/callback
http://127.0.0.1:5173/auth/callback
```

### **3. Update Supabase Auth Settings**

In your Supabase dashboard:
1. Go to **Authentication → URL Configuration**
2. Add to **Redirect URLs**:
   ```
   http://localhost:5173/dashboard
   http://127.0.0.1:5173/dashboard
   ```

## 🐛 **Debugging OAuth Issues**

### **Check Redirect URLs**
```javascript
// In browser console
console.log('Current origin:', window.location.origin);
console.log('OAuth redirect URL:', getOAuthRedirectUrl());
```

### **Common Issues**

1. **"Invalid redirect_uri" error**:
   - Check Google OAuth configuration
   - Verify redirect URIs match exactly

2. **"Redirect URI mismatch"**:
   - Add localhost URLs to Google OAuth
   - Check Supabase auth settings

3. **"Origin not allowed"**:
   - Add localhost to Supabase auth settings
   - Check CORS configuration

### **Test OAuth Flow**

```javascript
// Test OAuth redirect in browser console
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'http://localhost:5173/dashboard',
  },
});
console.log('OAuth result:', { data, error });
```

## 🎯 **Quick Test**

1. **Fix the .env file** (remove the dash from VITE_OPENROUTER_API_KEY)
2. **Start local development**: `npm run dev`
3. **Test OAuth**: Go to `http://localhost:5173` and try Google sign-in
4. **Check Branding page**: After login, go to Dashboard → Branding

The OAuth should now redirect to localhost instead of production! 🎉 