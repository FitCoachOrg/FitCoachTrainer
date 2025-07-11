# Google OAuth Setup Guide for FitCoachTrainer

## Step 1: Google Cloud Console Setup

### 1.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the Google+ API and Google Identity API

### 1.2 Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in required information:
   - App name: "FitCoachTrainer"
   - User support email: [your-email]
   - Developer contact information: [your-email]
4. Add scopes: `email`, `profile`, `openid`
5. Add test users if needed

### 1.3 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for development)
5. Copy the **Client ID** and **Client Secret**

## Step 2: Configure Supabase Auth

### 2.1 Enable Google Provider
1. Go to your Supabase Dashboard
2. Navigate to "Authentication" > "Providers"
3. Find "Google" and click "Enable"
4. Enter your Google OAuth credentials:
   - **Client ID**: [Your Google Client ID]
   - **Client Secret**: [Your Google Client Secret]
5. Save the configuration

### 2.2 Configure Redirect URLs
1. In Supabase Dashboard > "Authentication" > "URL Configuration"
2. Add your site URLs:
   - Site URL: `http://localhost:3000` (development)
   - Redirect URLs: 
     - `http://localhost:3000/dashboard`
     - `http://localhost:3000/auth/callback`

## Step 3: Environment Variables

Add these to your `.env` file:
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 4: Database Schema Updates

Ensure your `trainer` table has these columns:
```sql
-- Add Google-specific fields to trainer table
ALTER TABLE trainer ADD COLUMN IF NOT EXISTS google_id VARCHAR;
ALTER TABLE trainer ADD COLUMN IF NOT EXISTS avatar_url VARCHAR;
ALTER TABLE trainer ADD COLUMN IF NOT EXISTS full_name VARCHAR;
```

## Step 5: Testing

1. Test the Google Sign-In flow
2. Verify user data is properly stored
3. Check that existing magic link auth still works
4. Test the complete user journey

## Troubleshooting

### Common Issues:
1. **Redirect URI mismatch**: Ensure exact match between Google Console and Supabase
2. **CORS errors**: Check that your domain is properly configured
3. **Missing user data**: Verify the database schema includes all required fields

### Debug Steps:
1. Check browser console for errors
2. Verify Supabase logs in dashboard
3. Test with different browsers/devices
4. Check network tab for failed requests 