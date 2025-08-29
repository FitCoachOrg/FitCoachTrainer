# Deploy Your Supabase Edge Function

## 📁 File Structure

Your Edge Function is located at:
```
supabase/functions/calculate_engagement_score_improved/
├── index.ts          # ✅ Main function code (already created)
└── deno.json         # ✅ Deno configuration (just created)
```

## 🚀 Deployment Steps

### Step 1: Install Supabase CLI (if not already installed)
```bash
# Check if you have Supabase CLI
supabase --version

# If not installed, install it
npm install -g supabase
```

### Step 2: Login to Supabase
```bash
supabase login
```

### Step 3: Link Your Project
```bash
# Replace YOUR_PROJECT_ID with your actual Supabase project ID
supabase link --project-ref YOUR_PROJECT_ID
```

### Step 4: Deploy the Function
```bash
# Deploy the improved function
supabase functions deploy calculate_engagement_score_improved
```

## ✅ Verification

After deployment, you should see:
```
Deployed function calculate_engagement_score_improved to https://your-project-id.supabase.co/functions/v1/calculate_engagement_score_improved
```

## 🧪 Test the Function

```bash
# Test with curl (replace with your actual values)
curl -X POST https://your-project-id.supabase.co/functions/v1/calculate_engagement_score_improved \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

## 📊 Expected Response

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

In your Supabase Dashboard:
1. Go to **Settings** → **Edge Functions**
2. Add these environment variables:
   - `SUPABASE_URL`: Your project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

## ⏰ Set Up Cron Job

After deployment, set up the cron job in your Supabase Dashboard:

1. Go to **Database** → **Cron Jobs**
2. Click **"Create a new cron job"**
3. Use this configuration:

```sql
SELECT cron.schedule(
  'daily-engagement-score-calculation',
  '0 1 * * *',  -- Daily at 1:00 AM UTC
  'SELECT net.http_post(
    url := ''https://your-project-id.supabase.co/functions/v1/calculate_engagement_score_improved'',
    headers := ''{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}''
  );'
);
```

## 🎉 Success!

Once deployed and tested, your Edge Function will:
- ✅ Calculate engagement scores daily
- ✅ Store results in your existing `client_engagement_score` table
- ✅ Work with your existing frontend
- ✅ Provide detailed logging and monitoring

**The file `supabase/functions/calculate_engagement_score_improved/index.ts` is exactly what you need!** 