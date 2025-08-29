# Fix Cron Job and Edge Function Issues

## 🚨 Issues Identified

### Issue 1: Cron Job Configuration
Your cron job has a placeholder instead of the actual service role key:

**❌ Current (Broken):**
```sql
SELECT net.http_post(
    url := 'https://zyozeuihjptarceuipwu.supabase.co/functions/v1/calculate_engagement_score_improved',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'
  );
```

**✅ Fixed (Replace with your actual service role key):**
```sql
SELECT net.http_post(
    url := 'https://zyozeuihjptarceuipwu.supabase.co/functions/v1/calculate_engagement_score_improved',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "Content-Type": "application/json"}'
  );
```

### Issue 2: Edge Function Environment Variables
Your Edge Function needs environment variables to be set in the Supabase Dashboard.

## 🔧 Step-by-Step Fixes

### Step 1: Get Your Service Role Key
1. **Go to Supabase Dashboard** → **Settings** → **API**
2. **Copy your service_role key** (starts with `eyJ...`)
3. **Replace `YOUR_SERVICE_ROLE_KEY`** in your cron job

### Step 2: Set Edge Function Environment Variables
1. **Go to Supabase Dashboard** → **Edge Functions**
2. **Click on** `calculate_engagement_score_improved`
3. **Go to Settings**
4. **Add these environment variables:**
   - `SUPABASE_URL`: `https://zyozeuihjptarceuipwu.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

### Step 3: Test the Function Manually
```bash
# Replace YOUR_SERVICE_ROLE_KEY with your actual key
curl -X POST https://zyozeuihjptarceuipwu.supabase.co/functions/v1/calculate_engagement_score_improved \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

### Step 4: Run Debug Script
```bash
node debug-engagement-function.mjs
```

This will help identify if there are issues with:
- Database connection
- Client data
- Schedule data
- Score calculation logic

## 🧪 Debugging Steps

### 1. Check if Clients Exist
```sql
-- Run in Supabase SQL Editor
SELECT client_id, name, is_active 
FROM client 
WHERE is_active = true;
```

### 2. Check if Schedule Data Exists
```sql
-- Run in Supabase SQL Editor
SELECT client_id, status, for_date 
FROM schedule 
LIMIT 10;
```

### 3. Check Recent Engagement Scores
```sql
-- Run in Supabase SQL Editor
SELECT client_id, for_date, eng_score, total_due, completed 
FROM client_engagement_score 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🎯 Common Issues and Solutions

### Issue: No Active Clients
**Solution:** Make sure clients have `is_active = true`
```sql
UPDATE client SET is_active = true WHERE client_id = 1;
```

### Issue: No Schedule Data
**Solution:** Add some test schedule data
```sql
INSERT INTO schedule (client_id, for_date, status) 
VALUES (1, '2024-01-15', 'completed');
```

### Issue: Function Not Deployed
**Solution:** Redeploy the function
```bash
supabase functions deploy calculate_engagement_score_improved
```

### Issue: Environment Variables Not Set
**Solution:** Set them in Supabase Dashboard
- Go to Edge Functions → Your Function → Settings
- Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

## 📊 Expected Results After Fixes

After fixing the issues, you should see:

1. **Manual test returns success:**
```json
{
  "status": "Engagement scores calculated and stored for previous day.",
  "date": "2024-01-15",
  "duration": "12.34 seconds",
  "processed": 23,
  "skipped": 2,
  "errors": 0,
  "total_clients": 25
}
```

2. **Database shows new entries:**
```sql
SELECT COUNT(*) FROM client_engagement_score 
WHERE for_date = CURRENT_DATE - INTERVAL '1 day';
```

3. **Function logs show execution:**
```
🚀 Starting daily engagement score calculation...
📅 Calculating engagement scores for date: 2024-01-15
👥 Found 25 active clients
✅ John Doe: 80% (4/5 tasks completed)
```

## 🎉 Quick Test

Run this debug script to identify the exact issue:

```bash
node debug-engagement-function.mjs
```

This will tell you exactly what's missing and why the engagement table isn't getting updated. 