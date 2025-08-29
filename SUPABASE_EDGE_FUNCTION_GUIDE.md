# Supabase Edge Function + Cron Job Strategy

## 🎯 Strategy Overview

Using a **Supabase Edge Function** with a **cron job** is an excellent approach because:

✅ **Serverless**: No server management required  
✅ **Scalable**: Automatically scales with your needs  
✅ **Reliable**: Supabase handles infrastructure  
✅ **Cost-effective**: Pay only for execution time  
✅ **Integrated**: Direct access to your database  
✅ **Secure**: Built-in authentication and authorization  

## 📁 Edge Function Structure

```
supabase/functions/calculate_engagement_score_improved/
├── index.ts          # Main function code
└── deno.json         # Deno configuration (if needed)
```

## 🚀 Deployment Steps

### Step 1: Deploy the Edge Function

```bash
# Navigate to your project root
cd /Users/vikas/Documents/FitCoachTrainer

# Deploy the function to Supabase
supabase functions deploy calculate_engagement_score_improved
```

### Step 2: Set Environment Variables

In your Supabase Dashboard:

1. Go to **Settings** → **API**
2. Copy your **Project URL** and **service_role** key
3. Go to **Settings** → **Edge Functions**
4. Add these environment variables:
   - `SUPABASE_URL`: Your project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

### Step 3: Test the Function

```bash
# Test the function manually
curl -X POST https://your-project-id.supabase.co/functions/v1/calculate_engagement_score_improved \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

## ⏰ Cron Job Setup

### Option A: Supabase Cron Jobs (Recommended)

Supabase now supports native cron jobs! Here's how to set it up:

1. **Go to your Supabase Dashboard**
2. **Navigate to Database** → **Cron Jobs**
3. **Click "Create a new cron job"**
4. **Configure the job:**

```sql
-- Cron job configuration
SELECT cron.schedule(
  'daily-engagement-score-calculation',
  '0 1 * * *',  -- Daily at 1:00 AM UTC
  'SELECT net.http_post(
    url := ''https://your-project-id.supabase.co/functions/v1/calculate_engagement_score_improved'',
    headers := ''{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}''
  );'
);
```

### Option B: External Cron Service

If you prefer external cron services:

#### Using GitHub Actions (Free)

Create `.github/workflows/engagement-score.yml`:

```yaml
name: Daily Engagement Score Calculation

on:
  schedule:
    - cron: '0 1 * * *'  # Daily at 1:00 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  calculate-engagement-scores:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Supabase Edge Function
        run: |
          curl -X POST https://your-project-id.supabase.co/functions/v1/calculate_engagement_score_improved \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json"
```

#### Using Vercel Cron Jobs

Create `api/cron/engagement-score.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(
      'https://your-project-id.supabase.co/functions/v1/calculate_engagement_score_improved',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to trigger function' });
  }
}
```

Then add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/engagement-score",
      "schedule": "0 1 * * *"
    }
  ]
}
```

## 🔧 Function Improvements

The improved Edge Function includes:

### 1. Better Error Handling
```typescript
try {
  // Function logic
} catch (error) {
  console.error('❌ Fatal error:', error);
  return res.status(500).json({ 
    error: "Fatal error in engagement score calculation",
    details: error.message,
    timestamp: new Date().toISOString()
  });
}
```

### 2. Comprehensive Logging
```typescript
console.log('🚀 Starting daily engagement score calculation...');
console.log(`📅 Calculating engagement scores for date: ${forDate}`);
console.log(`👥 Found ${clients.length} active clients`);
```

### 3. Detailed Summary
```typescript
const summary = {
  status: "Engagement scores calculated and stored for previous day.",
  date: forDate,
  duration: `${duration} seconds`,
  processed: processedCount,
  skipped: skippedCount,
  errors: errorCount,
  total_clients: clients.length,
  timestamp: new Date().toISOString()
};
```

### 4. Schema Compatibility
- Uses `for_date` instead of `due_date` to match your schema
- Includes `total_due` and `completed` fields
- Handles your existing table structure

## 📊 Monitoring and Logs

### View Function Logs

1. **Supabase Dashboard** → **Edge Functions** → **Logs**
2. **Check execution times and errors**
3. **Monitor performance metrics**

### Test Function Manually

```bash
# Test with curl
curl -X POST https://your-project-id.supabase.co/functions/v1/calculate_engagement_score_improved \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"

# Expected response:
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

## 🎯 Advantages of This Strategy

### vs. Local Cron Job
- ✅ **No server management**
- ✅ **Automatic scaling**
- ✅ **Built-in monitoring**
- ✅ **No downtime concerns**

### vs. External Services
- ✅ **Direct database access**
- ✅ **Lower latency**
- ✅ **Better security**
- ✅ **Simpler deployment**

## 🔧 Troubleshooting

### Common Issues

1. **Function not deploying**
   ```bash
   # Check Supabase CLI
   supabase --version
   
   # Login to Supabase
   supabase login
   
   # Link project
   supabase link --project-ref your-project-id
   ```

2. **Environment variables not set**
   - Go to Supabase Dashboard → Settings → Edge Functions
   - Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

3. **Cron job not triggering**
   - Check Supabase Dashboard → Database → Cron Jobs
   - Verify the schedule syntax
   - Test manually first

4. **Database permission errors**
   - Ensure service role key has proper permissions
   - Check RLS policies on tables

## 📈 Performance Considerations

### Optimization Tips
- **Batch processing**: Process clients in batches for large datasets
- **Index optimization**: Ensure proper database indexes
- **Error handling**: Graceful failure for individual clients
- **Logging**: Comprehensive logging for debugging

### Scaling
- **Automatic**: Supabase handles scaling automatically
- **Limits**: Check Supabase Edge Function limits
- **Monitoring**: Watch execution times and memory usage

## 🎉 Success Indicators

You'll know it's working when:

1. ✅ **Function deploys successfully**
2. ✅ **Manual test returns success response**
3. ✅ **Cron job triggers daily**
4. ✅ **Database shows new engagement scores**
5. ✅ **Logs show successful executions**
6. ✅ **Frontend displays updated scores**

---

**This strategy is highly recommended** because it leverages Supabase's serverless infrastructure while providing reliable, scalable daily engagement score calculation for your FitCoach Trainer application. 