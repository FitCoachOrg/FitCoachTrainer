# Google Sign-In Implementation Guide

## 🚀 Overview

This guide provides step-by-step instructions to implement Google Sign-In for your FitCoachTrainer application using Supabase Auth.

## 📋 Prerequisites

- ✅ Supabase project configured
- ✅ React application with authentication
- ✅ Google Cloud Console access

## 🔧 Implementation Steps

### Step 1: Google Cloud Console Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project or select existing
   - Enable Google+ API and Google Identity API

2. **Configure OAuth Consent Screen**
   - Navigate to "APIs & Services" > "OAuth consent screen"
   - Choose "External" user type
   - Fill required information:
     - App name: "FitCoachTrainer"
     - User support email: [your-email]
     - Developer contact: [your-email]
   - Add scopes: `email`, `profile`, `openid`

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (development)
   - Copy **Client ID** and **Client Secret**

### Step 2: Supabase Configuration

1. **Enable Google Provider**
   - Go to Supabase Dashboard > "Authentication" > "Providers"
   - Find "Google" and click "Enable"
   - Enter your Google OAuth credentials:
     - Client ID: [Your Google Client ID]
     - Client Secret: [Your Google Client Secret]
   - Save configuration

2. **Configure Redirect URLs**
   - In Supabase Dashboard > "Authentication" > "URL Configuration"
   - Add site URLs:
     - Site URL: `http://localhost:3000` (development)
     - Redirect URLs: 
       - `http://localhost:3000/dashboard`
       - `http://localhost:3000/auth/callback`

### Step 3: Database Migration

Run the SQL migration script in your Supabase SQL editor:

```sql
-- Add Google OAuth fields to trainer table
ALTER TABLE trainer 
ADD COLUMN IF NOT EXISTS google_id VARCHAR,
ADD COLUMN IF NOT EXISTS full_name VARCHAR,
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trainer_google_id ON trainer(google_id);
CREATE INDEX IF NOT EXISTS idx_trainer_email ON trainer(trainer_email);
```

### Step 4: Environment Variables

Add to your `.env` file:
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🎯 Features Implemented

### ✅ Google Sign-In Component
- **File**: `client/src/components/auth/GoogleSignIn.tsx`
- **Features**:
  - Google OAuth integration with Supabase
  - Loading states and error handling
  - Customizable styling
  - Toast notifications

### ✅ Auth Callback Handler
- **File**: `client/src/components/auth/AuthCallback.tsx`
- **Features**:
  - Handles OAuth redirects
  - Creates/updates trainer records
  - Error handling and user feedback
  - Automatic redirect to dashboard

### ✅ Enhanced Auth Hook
- **File**: `client/src/hooks/use-auth.ts`
- **Features**:
  - Comprehensive user and trainer data
  - Google OAuth metadata support
  - Automatic trainer record creation
  - Sign-out functionality

### ✅ Updated Login Page
- **File**: `client/src/pages/login.tsx`
- **Features**:
  - Google Sign-In button
  - Visual divider between auth methods
  - Maintains existing magic link functionality

## 🔄 User Flow

1. **User clicks "Continue with Google"**
2. **Redirected to Google OAuth**
3. **User authorizes application**
4. **Redirected back to `/auth/callback`**
5. **AuthCallback component processes the session**
6. **Creates/updates trainer record**
7. **Redirects to dashboard**

## 🛠️ Testing

### Test Cases:
1. **New User Sign-In**
   - Sign in with Google account not in database
   - Verify trainer record is created
   - Check all fields are populated

2. **Existing User Sign-In**
   - Sign in with existing trainer account
   - Verify no duplicate records
   - Check Google metadata is updated

3. **Error Handling**
   - Test with invalid credentials
   - Verify error messages display
   - Check fallback to login page

4. **Magic Link Compatibility**
   - Ensure existing magic link still works
   - Test both auth methods coexist

## 🐛 Troubleshooting

### Common Issues:

1. **"Redirect URI mismatch"**
   - Ensure exact match between Google Console and Supabase
   - Check for trailing slashes

2. **"CORS errors"**
   - Verify domain is configured in Google Console
   - Check Supabase URL configuration

3. **"User not found in trainer table"**
   - Run database migration
   - Check AuthCallback component logs

4. **"Authentication failed"**
   - Verify Google OAuth credentials
   - Check Supabase provider configuration

### Debug Steps:
1. Check browser console for errors
2. Verify Supabase logs in dashboard
3. Test with different browsers
4. Check network tab for failed requests

## 📱 Mobile Support

The implementation works on mobile devices:
- Google Sign-In opens in browser
- Responsive design for all screen sizes
- Touch-friendly button interactions

## 🔒 Security Considerations

1. **OAuth Scopes**: Only request necessary scopes
2. **HTTPS**: Use HTTPS in production
3. **Token Storage**: Supabase handles token security
4. **User Data**: Validate and sanitize user metadata

## 🚀 Production Deployment

1. **Update Redirect URIs** for production domain
2. **Configure HTTPS** for all URLs
3. **Test thoroughly** with real Google accounts
4. **Monitor logs** for any issues

## 📈 Next Steps

Potential enhancements:
- Add other OAuth providers (GitHub, Microsoft)
- Implement user profile management
- Add account linking functionality
- Create admin user management

---

## ✅ Implementation Complete!

Your FitCoachTrainer app now supports Google Sign-In alongside the existing magic link authentication. Users can choose their preferred sign-in method while maintaining a seamless experience. 