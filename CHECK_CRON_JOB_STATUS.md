# 🔍 How to Check if Cron Job is Set Up Correctly

## 📋 **Method 1: Check Supabase Dashboard (Recommended)**

### **Step 1: Access Cron Jobs**
1. **Go to Supabase Dashboard:** https://supabase.com/dashboard
2. **Select your project:** `zyozeuihjptarceuipwu`
3. **Click "Database"** in the left sidebar
4. **Click "Cron Jobs"** tab

### **Step 2: Verify Cron Job Configuration**
Look for a cron job with these details:
- **Name:** Should be something like "engagement_score_calculation"
- **Schedule:** Should be `0 */8 * * *` (every 8 hours)
- **SQL Command:** Should look like:
```sql
SELECT net.http_post(
    url := 'https://zyozeuihjptarceuipwu.supabase.co/functions/v1/calculate_engagement_score_improved',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'
);
```

### **Step 3: Check Execution History**
- Look for **"Last Run"** timestamp
- Check **"Next Run"** time
- Look for **execution logs** or status

## 📊 **Method 2: Check Database for Recent Activity**

### **Step 1: Check Recent Engagement Scores**
Run this SQL query in the Supabase SQL Editor:

```sql
SELECT 
    created_at,
    client_id,
    for_date,
    eng_score,
    total_due,
    completed
FROM client_engagement_score 
ORDER BY created_at DESC 
LIMIT 10;
```

**Expected Result:** You should see scores created every 8 hours if the cron job is working.

### **Step 2: Check for Regular Patterns**
Look for:
- **Scores created at regular intervals** (every 8 hours)
- **Multiple clients processed** at the same time
- **Consistent timestamps** (e.g., 00:00, 08:00, 16:00 UTC)

## 🧪 **Method 3: Manual Testing**

### **Step 1: Test Edge Function Directly**
```bash
curl -X POST "https://zyozeuihjptarceuipwu.supabase.co/functions/v1/calculate_engagement_score_improved" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5b3pldWloanB0YXJjZXVpcHd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjU5MDM4MiwiZXhwIjoyMDYyMTY2MzgyfQ.V_NAQUDtm3C9yRLCalSG-My7HDG-Mx57gcvNI9mpRTU" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Result:** Should return a JSON response with processing summary.

### **Step 2: Check Database Before and After**
1. **Note the current count** of engagement scores
2. **Run the test** above
3. **Check if new scores** were added

## 📈 **Method 4: Monitor Real-time Activity**

### **Step 1: Set Up Monitoring**
Create a simple monitoring script:

```sql
-- Check recent cron job activity
SELECT 
    created_at,
    COUNT(*) as new_scores,
    COUNT(DISTINCT client_id) as clients_processed
FROM client_engagement_score 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY created_at DESC;
```

### **Step 2: Check for Expected Schedule**
The cron job should run at:
- **00:00 UTC** (midnight)
- **08:00 UTC** (8 AM)
- **16:00 UTC** (4 PM)

## 🔧 **Method 5: Verify Cron Job SQL**

### **Step 1: Check Current Cron Job**
In Supabase Dashboard → Database → Cron Jobs, verify the SQL is:

```sql
SELECT net.http_post(
    url := 'https://zyozeuihjptarceuipwu.supabase.co/functions/v1/calculate_engagement_score_improved',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5b3pldWloanB0YXJjZXVpcHd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjU5MDM4MiwiZXhwIjoyMDYyMTY2MzgyfQ.V_NAQUDtm3C9yRLCalSG-My7HDG-Mx57gcvNI9mpRTU", "Content-Type": "application/json"}'
);
```

### **Step 2: Verify Schedule**
- **Cron Expression:** `0 */8 * * *`
- **Description:** "Every 8 hours at minute 0"

## 🚨 **Common Issues to Check:**

### **Issue 1: Cron Job Not Created**
**Symptoms:** No cron job visible in dashboard
**Solution:** Create the cron job manually

### **Issue 2: Wrong URL**
**Symptoms:** Edge Function not found errors
**Solution:** Verify the URL is correct

### **Issue 3: Wrong Authorization**
**Symptoms:** 401/403 errors
**Solution:** Update the service role key

### **Issue 4: Edge Function Failing**
**Symptoms:** 500 errors from Edge Function
**Solution:** Check Edge Function logs and fix the code

### **Issue 5: Wrong Schedule**
**Symptoms:** No regular activity
**Solution:** Verify cron expression is `0 */8 * * *`

## 📊 **Expected Behavior:**

### **When Working Correctly:**
1. ✅ **Cron job runs every 8 hours**
2. ✅ **Edge Function executes successfully**
3. ✅ **New engagement scores are created**
4. ✅ **Multiple clients processed per run**
5. ✅ **Regular timestamps** (00:00, 08:00, 16:00 UTC)

### **Sample Success Pattern:**
```
2025-08-03 00:00:00 - 8 clients processed
2025-08-03 08:00:00 - 8 clients processed  
2025-08-03 16:00:00 - 8 clients processed
2025-08-04 00:00:00 - 8 clients processed
```

## 🔍 **Quick Verification Steps:**

1. **Check Supabase Dashboard** → Database → Cron Jobs
2. **Run manual test** with curl command
3. **Check database** for recent engagement scores
4. **Monitor for 24 hours** to see regular activity

**If you see regular engagement scores being created every 8 hours, your cron job is working correctly!** 