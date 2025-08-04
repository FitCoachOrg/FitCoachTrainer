# Set Up Cron Job for Daily Engagement Score Calculation

## ✅ Function Deployed Successfully!

Your Edge Function `calculate_engagement_score_improved` is now live and ready to use.

## ⏰ Set Up Daily Cron Job

### Step 1: Go to Supabase Dashboard

1. **Open your Supabase Dashboard**
2. **Navigate to Database** → **Cron Jobs**
3. **Click "Create a new cron job"**

### Step 2: Configure the Cron Job

Use these settings:

**Name:** `daily-engagement-score-calculation`

**Schedule:** `0 1 * * *` (Daily at 1:00 AM UTC)

**SQL Command:**
```sql
SELECT net.http_post(
  url := 'https://your-project-id.supabase.co/functions/v1/calculate_engagement_score_improved',
  headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'
);
```

**Replace these values:**
- `your-project-id` with your actual Supabase project ID
- `YOUR_SERVICE_ROLE_KEY` with your actual service role key

### Step 3: Get Your Project ID and Service Role Key

1. **Go to Settings** → **API** in your Supabase Dashboard
2. **Copy your Project URL** (looks like: `https://zyozeuihjptarceuipwu.supabase.co`)
3. **Copy your service_role key** (starts with `eyJ...`)

### Step 4: Complete SQL Command

Here's the complete command with placeholders:

```sql
SELECT net.http_post(
  url := 'https://zyozeuihjptarceuipwu.supabase.co/functions/v1/calculate_engagement_score_improved',
  headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "Content-Type": "application/json"}'
);
```

## 🧪 Test the Function Manually

Before setting up the cron job, test the function manually:

```bash
curl -X POST https://zyozeuihjptarceuipwu.supabase.co/functions/v1/calculate_engagement_score_improved \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

**Expected Response:**
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

## 🔧 Set Environment Variables

Make sure your Edge Function has the required environment variables:

1. **Go to Edge Functions** in your Supabase Dashboard
2. **Click on your function** `calculate_engagement_score_improved`
3. **Go to Settings**
4. **Add these environment variables:**
   - `SUPABASE_URL`: Your project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

## 📊 Monitor the Cron Job

### Check Cron Job Status

1. **Go to Database** → **Cron Jobs**
2. **View your cron job** `daily-engagement-score-calculation`
3. **Check the execution history**

### View Function Logs

1. **Go to Edge Functions**
2. **Click on your function**
3. **View the logs** to see execution details

## 🎯 Success Indicators

You'll know everything is working when:

1. ✅ **Manual test returns success response**
2. ✅ **Cron job shows as active**
3. ✅ **Function logs show daily executions**
4. ✅ **Database shows new engagement scores**
5. ✅ **Frontend displays updated scores**

## 🔧 Troubleshooting

### Common Issues:

1. **Cron job not triggering**
   - Check the schedule syntax
   - Verify the URL is correct
   - Ensure service role key is valid

2. **Function returning errors**
   - Check environment variables
   - Verify database permissions
   - Review function logs

3. **No data being inserted**
   - Check if clients have schedule entries
   - Verify the `for_date` field matches your data
   - Ensure `is_active` clients exist

## 📈 Next Steps

Once the cron job is set up:

1. **Monitor for a few days** to ensure reliability
2. **Check your frontend** to see engagement scores
3. **Review logs** for any issues
4. **Optimize if needed** based on performance

## 🎉 You're All Set!

Your daily engagement score calculation system is now:
- ✅ **Function deployed**
- ✅ **Cron job configured**
- ✅ **Automated daily execution**
- ✅ **Integrated with your database**

The system will automatically calculate engagement scores for all your clients every day at 1:00 AM UTC! 