# Fix Docker Issue and Deploy Edge Function

## 🐳 Docker Issue

The error indicates that Docker Desktop isn't running. Here's how to fix it:

### Option 1: Start Docker Desktop

1. **Open Docker Desktop** on your Mac
2. **Wait for it to fully start** (you'll see the whale icon in your menu bar)
3. **Try deploying again:**
   ```bash
   supabase functions deploy calculate_engagement_score_improved
   ```

### Option 2: Deploy via Supabase Dashboard (Recommended)

If you prefer not to use Docker, you can deploy directly through the Supabase Dashboard:

1. **Go to your Supabase Dashboard**
2. **Navigate to Edge Functions**
3. **Click "Create a new function"**
4. **Name it:** `calculate_engagement_score_improved`
5. **Copy and paste the code** from `supabase/functions/calculate_engagement_score_improved/index.ts`

## 📋 Code to Copy

Here's the complete code to paste into the Supabase Dashboard:

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// Environment variables for Supabase service role key and URL
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function handler(req: any, res: any) {
  const startTime = Date.now();
  console.log('🚀 Starting daily engagement score calculation...');

  try {
    // Calculate the previous day in UTC
    const now = new Date();
    const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
    const forDate = yesterday.toISOString().slice(0, 10); // YYYY-MM-DD

    console.log(`📅 Calculating engagement scores for date: ${forDate}`);

    // 1. Get all active clients
    const { data: clients, error: clientError } = await supabase
      .from("client")
      .select("client_id, name")
      .eq("is_active", true);

    if (clientError) {
      console.error('❌ Error fetching clients:', clientError);
      return res.status(500).json({ 
        error: "Failed to fetch clients", 
        details: clientError,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`👥 Found ${clients.length} active clients`);

    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // 2. Process each client
    for (const client of clients) {
      const clientId = client.client_id;
      const clientName = client.name;

      try {
        // Check if score already exists for this client and date
        const { data: existing, error: existingError } = await supabase
          .from("client_engagement_score")
          .select("id")
          .eq("client_id", clientId)
          .eq("for_date", forDate)
          .maybeSingle();

        if (existingError) {
          console.error(`❌ Error checking existing score for client ${clientName}:`, existingError);
          errorCount++;
          continue;
        }

        if (existing) {
          console.log(`⏭️  Score already exists for ${clientName} on ${forDate}, skipping`);
          skippedCount++;
          continue;
        }

        // 3. Get all schedules due for this client on that day (UTC)
        // Note: Using 'for_date' instead of 'due_date' to match your schema
        const { data: schedules, error: scheduleError } = await supabase
          .from("schedule")
          .select("id, status, for_date")
          .eq("client_id", clientId)
          .eq("for_date", forDate);

        if (scheduleError) {
          console.error(`❌ Error fetching schedules for client ${clientName}:`, scheduleError);
          errorCount++;
          continue;
        }

        const totalDue = schedules.length;
        const completed = schedules.filter((s: any) => s.status === "completed").length;
        const engScore = totalDue > 0 ? Math.round((completed / totalDue) * 100) : null;

        // 4. Insert the score with all required fields
        if (totalDue > 0 || engScore !== null) {
          const { error: insertError } = await supabase
            .from("client_engagement_score")
            .insert({
              for_date: forDate,
              eng_score: engScore,
              client_id: clientId,
              total_due: totalDue,
              completed: completed
            });

          if (insertError) {
            console.error(`❌ Error inserting engagement score for ${clientName}:`, insertError);
            errorCount++;
          } else {
            console.log(`✅ ${clientName}: ${engScore}% (${completed}/${totalDue} tasks completed)`);
            processedCount++;
          }
        } else {
          console.log(`📝 ${clientName}: No tasks due on ${forDate}`);
          processedCount++;
        }

      } catch (error) {
        console.error(`❌ Error processing client ${clientName}:`, error);
        errorCount++;
      }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

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

    console.log('\n📊 Daily Engagement Score Calculation Summary:');
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`✅ Processed: ${processedCount} clients`);
    console.log(`⏭️  Skipped: ${skippedCount} clients (already calculated)`);
    console.log(`❌ Errors: ${errorCount} clients`);
    console.log(`📅 Date processed: ${forDate}`);

    return res.status(200).json(summary);

  } catch (error) {
    console.error('❌ Fatal error in daily engagement score calculation:', error);
    return res.status(500).json({ 
      error: "Fatal error in engagement score calculation",
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
```

## 🔧 Set Environment Variables

After creating the function, set the environment variables:

1. **In the Edge Function settings**, add:
   - `SUPABASE_URL`: Your project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

## 🧪 Test the Function

After deployment, test it:

```bash
curl -X POST https://your-project-id.supabase.co/functions/v1/calculate_engagement_score_improved \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

## ⏰ Set Up Cron Job

Once deployed, set up the cron job in your Supabase Dashboard:

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

This approach bypasses the Docker requirement and lets you deploy directly through the Supabase Dashboard. 