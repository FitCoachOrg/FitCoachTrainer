# YouTube API Setup Guide

## 🎯 **Current Status**

✅ **YouTube Video Integration**: Fully implemented and working  
✅ **Multi-Key System**: Automatic failover between API keys  
✅ **Environment Variables**: Added to `.env` file  
❌ **API Keys**: Need to be configured  

## 🔑 **How to Get a YouTube API Key**

### Step 1: Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Create a new project or select an existing one

### Step 2: Enable YouTube Data API v3
1. Go to "APIs & Services" > "Library"
2. Search for "YouTube Data API v3"
3. Click on it and press "Enable"

### Step 3: Create API Key
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key

### Step 4: Configure Multiple API Keys (Recommended)
1. Open your `.env` file
2. Replace the placeholders with your actual API keys:
   ```
   VITE_YOUTUBE_API_KEY=AIzaSyC...your_actual_key_here
   VITE_YOUTUBE_API_KEY2=AIzaSyC...your_actual_key2_here
   VITE_YOUTUBE_API_KEY3=AIzaSyC...your_actual_key3_here
   VITE_YOUTUBE_API_KEY4=AIzaSyC...your_actual_key4_here
   ```
   
   **Note**: You can start with just one key, but multiple keys provide automatic failover when quotas are exceeded.

## 🧪 **Testing the Integration**

### Test 1: Multi-Key API Test
```bash
# Test all configured API keys with automatic failover
node test-youtube-api.mjs
```

### Test 2: Application Test
1. **Restart the development server** (to load the new environment variable):
   ```bash
   npm run dev
   ```

2. **Navigate to the application**: http://localhost:8080

3. **Test workout plan generation**:
   - Go to a client's workout plan
   - Generate a new AI workout plan
   - Watch for video enhancement in the console logs

## 📊 **Expected Behavior**

### With API Keys:
- ✅ Videos will be automatically fetched for each exercise
- ✅ Console will show: "✅ Video enhancement completed successfully!"
- ✅ Video statistics will be displayed
- ✅ Videos will appear in the workout plan table
- ✅ **Automatic failover**: If one key hits quota, system switches to next key
- ✅ **Key rotation**: Console shows which key is being used

### Without API Keys (Current State):
- ❌ Console shows: "❌ Error picking exercise short: Error: No YouTube API keys configured"
- ⚠️ Workout plan generation continues without videos
- ⚠️ No video links in the workout plan

## 🔧 **Troubleshooting**

### Issue: "No YouTube API keys configured"
**Solution**: Make sure you've added at least one API key to `.env` and restarted the server

### Issue: "Quota exceeded"
**Solution**: The system will automatically switch to the next available API key. If all keys are exhausted, check your usage in Google Cloud Console

### Issue: "No videos found"
**Solution**: The algorithm is very selective. Try generating a workout plan with common exercises like "pushup", "squat", "plank"

## 🎬 **How the Video Integration Works**

1. **Exercise Name**: When an exercise is generated, the system normalizes the name
2. **Search Query**: Creates a search like "pushup how to form tutorial"
3. **Video Selection**: Uses sophisticated algorithm to find the best 15-60 second video
4. **Caching**: Stores results in database for future use
5. **Display**: Shows video thumbnails with play buttons in the workout plan

## 📈 **Video Selection Criteria**

The system looks for videos that are:
- ✅ 15-60 seconds long
- ✅ Demonstrate correct form
- ✅ From trusted fitness channels
- ✅ Have good engagement metrics
- ✅ Contain "how to" or "form" in title
- ✅ Exclude negative keywords (compilation, fails, etc.)

## 🚀 **Ready to Test!**

Once you add your YouTube API keys to the `.env` file and restart the server, the video integration with automatic failover will be fully functional!

## 🔄 **Multi-Key System Benefits**

- **Automatic Failover**: When one key hits quota, system automatically switches to next key
- **High Availability**: Multiple keys ensure continuous service
- **Load Distribution**: Spreads API usage across multiple keys
- **Graceful Degradation**: If all keys are exhausted, system continues without videos
- **Real-time Monitoring**: Console shows which key is being used and when rotation occurs
