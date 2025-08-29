# Test Your Cron Job Setup

## 🧪 Multiple Testing Methods

Here are several ways to verify your cron job is working correctly:

## Method 1: Check Cron Job Status in Supabase Dashboard

### Step 1: View Cron Jobs
1. **Go to your Supabase Dashboard**
2. **Navigate to Database** → **Cron Jobs**
3. **Look for your cron job** `daily-engagement-score-calculation`
4. **Check the status** - it should show as "Active"

### Step 2: Check Execution History
1. **Click on your cron job**
2. **View the "Execution History" tab**
3. **Look for recent executions**
4. **Check for any error messages**

## Method 2: Test Function Manually

### Step 1: Get Your Service Role Key
```bash
# Go to Supabase Dashboard → Settings → API
# Copy your service_role key (starts with eyJ...)
```

### Step 2: Test with curl
```bash
curl -X POST https://zyozeuihjptarceuipwu.supabase.co/functions/v1/calculate_engagement_score_improved \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

### Step 3: Check Response
**Expected Success Response:**
```json
{
  "status": "Engagement scores calculated and stored for previous day.",
  "date": "2024-01-15",
  "duration": "12.34 seconds",
  "processed": 23,
  "skipped": 2,
  "errors": 0,
  "total_clients": 25,
  "timestamp": "2024-01-16T01:00:00.000Z"
}
```

**If you get an error, check:**
- Service role key is correct
- Function is deployed
- Environment variables are set

## Method 3: Check Database for New Entries

### Step 1: Check Recent Engagement Scores
```sql
-- Run this in Supabase SQL Editor
SELECT 
  client_id,
  for_date,
  eng_score,
  total_due,
  completed,
  created_at
FROM client_engagement_score 
ORDER BY created_at DESC 
LIMIT 10;
```

### Step 2: Check for Today's Entries
```sql
-- Check if scores were calculated for today
SELECT COUNT(*) as today_count
FROM client_engagement_score 
WHERE for_date = CURRENT_DATE - INTERVAL '1 day';
```

## Method 4: Monitor Function Logs

### Step 1: View Function Logs
1. **Go to Edge Functions** in Supabase Dashboard
2. **Click on** `calculate_engagement_score_improved`
3. **Check the logs** for recent executions

### Step 2: Look for These Log Messages
```
🚀 Starting daily engagement score calculation...
📅 Calculating engagement scores for date: 2024-01-15
👥 Found 25 active clients
✅ John Doe: 80% (4/5 tasks completed)
📊 Daily Engagement Score Calculation Summary:
⏱️  Duration: 12.34 seconds
✅ Processed: 23 clients
⏭️  Skipped: 2 clients (already calculated)
❌ Errors: 0 clients
```

## Method 5: Test Cron Job Trigger Manually

### Step 1: Temporarily Change Schedule
1. **Go to Database** → **Cron Jobs**
2. **Edit your cron job**
3. **Change schedule to run in 2 minutes:**
   ```sql
   -- Example: Run at current time + 2 minutes
   SELECT cron.schedule(
     'daily-engagement-score-calculation',
     '*/2 * * * *',  -- Every 2 minutes (for testing)
     'SELECT net.http_post(
       url := ''https://zyozeuihjptarceuipwu.supabase.co/functions/v1/calculate_engagement_score_improved'',
       headers := ''{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}''
     );'
   );
   ```

### Step 2: Monitor Execution
1. **Wait 2-3 minutes**
2. **Check execution history**
3. **View function logs**
4. **Check database for new entries**

### Step 3: Reset to Daily Schedule
```sql
-- Change back to daily at 1:00 AM
SELECT cron.schedule(
  'daily-engagement-score-calculation',
  '0 1 * * *',  -- Daily at 1:00 AM UTC
  'SELECT net.http_post(
    url := ''https://zyozeuihjptarceuipwu.supabase.co/functions/v1/calculate_engagement_score_improved'',
    headers := ''{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}''
  );'
);
```

## Method 6: Check Frontend Integration

### Step 1: Start Your App
```bash
cd client
npm run dev
```

### Step 2: Check Client Dashboard
1. **Open your app in browser**
2. **Go to Clients page**
3. **Look for engagement scores**
4. **Check if scores are displaying**

## 🔍 Troubleshooting Common Issues

### Issue 1: Cron Job Not Executing
**Check:**
- ✅ Cron job is "Active" in dashboard
- ✅ Schedule syntax is correct (`0 1 * * *`)
- ✅ URL is correct
- ✅ Service role key is valid

### Issue 2: Function Returning Errors
**Check:**
- ✅ Environment variables are set
- ✅ Database permissions are correct
- ✅ Function is deployed successfully

### Issue 3: No Data Being Inserted
**Check:**
- ✅ Clients exist in database
- ✅ Clients have `is_active = true`
- ✅ Schedule table has data
- ✅ `for_date` field matches your data

### Issue 4: Frontend Not Showing Scores
**Check:**
- ✅ Database has engagement score entries
- ✅ Frontend is fetching latest data
- ✅ Client-side function is working

## 📊 Success Checklist

Your cron job is working correctly when:

- ✅ **Cron job shows as "Active"** in Supabase Dashboard
- ✅ **Manual function test returns success**
- ✅ **Database shows new engagement score entries**
- ✅ **Function logs show successful executions**
- ✅ **Frontend displays engagement scores**
- ✅ **No error messages in logs**

## 🎯 Quick Test Commands

```bash
# Test function manually
curl -X POST https://zyozeuihjptarceuipwu.supabase.co/functions/v1/calculate_engagement_score_improved \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"

# Check database entries
# Run in Supabase SQL Editor:
SELECT COUNT(*) FROM client_engagement_score WHERE for_date = CURRENT_DATE - INTERVAL '1 day';
```

## 🎉 Expected Results

If everything is working correctly, you should see:

1. **Function returns success response** with statistics
2. **Database has new entries** in `client_engagement_score` table
3. **Function logs show** detailed execution information
4. **Cron job execution history** shows successful runs
5. **Frontend displays** engagement scores for clients

**This comprehensive testing approach will help you verify that your daily engagement score calculation system is working perfectly!** 