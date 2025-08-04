# 🔧 Fix Edge Function Deployment and Environment Variables

## 🚨 **Current Issues:**

1. **Edge Function has wrong schema** (fixed in code)
2. **Missing environment variables** in Supabase Dashboard
3. **Docker not running** for CLI deployment

## 📋 **Step-by-Step Fix:**

### **Step 1: Deploy via Supabase Dashboard**

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project: `zyozeuihjptarceuipwu`

2. **Navigate to Edge Functions:**
   - Click on "Edge Functions" in the left sidebar
   - Find `calculate_engagement_score_improved`

3. **Update the Function:**
   - Click on the function name
   - Click "Edit" or "Update"
   - Replace the code with the fixed version below

### **Step 2: Fixed Edge Function Code**

Copy and paste this code into your Edge Function:

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

    // 1. Get all clients (your table doesn't have is_active field)
    const { data: clients, error: clientError } = await supabase
      .from("client")
      .select("client_id, cl_name")
      .limit(100); // Limit to avoid processing too many clients

    if (clientError) {
      console.error('❌ Error fetching clients:', clientError);
      return res.status(500).json({ 
        error: "Failed to fetch clients", 
        details: clientError,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`👥 Found ${clients.length} clients`);

    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // 2. Process each client
    for (const client of clients) {
      const clientId = client.client_id;
      const clientName = client.cl_name || `Client ${clientId}`;

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

### **Step 3: Set Environment Variables**

1. **In the same Edge Function page:**
   - Look for "Environment Variables" section
   - Add these two variables:

   **Variable 1:**
   - **Name:** `SUPABASE_URL`
   - **Value:** `https://zyozeuihjptarceuipwu.supabase.co`

   **Variable 2:**
   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5b3pldWloanB0YXJjZXVpcHd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjU5MDM4MiwiZXhwIjoyMDYyMTY2MzgyfQ.V_NAQUDtm3C9yRLCalSG-My7HDG-Mx57gcvNI9mpRTU`

2. **Save the function**

### **Step 4: Test the Fixed Function**

After updating, test it with this curl command:

```bash
curl -X POST "https://zyozeuihjptarceuipwu.supabase.co/functions/v1/calculate_engagement_score_improved" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5b3pldWloanB0YXJjZXVpcHd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjU5MDM4MiwiZXhwIjoyMDYyMTY2MzgyfQ.V_NAQUDtm3C9yRLCalSG-My7HDG-Mx57gcvNI9mpRTU" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### **Step 5: Verify Data Updates**

Check if engagement scores are being populated:

```sql
SELECT * FROM client_engagement_score 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🎯 **Expected Results:**

After fixing:
- ✅ Edge Function should run without errors
- ✅ Engagement scores should be calculated for all clients
- ✅ Data should appear in `client_engagement_score` table
- ✅ Cron job should work every 8 hours

## 🔍 **Key Changes Made:**

1. **Fixed schema:** Changed `name` to `cl_name`
2. **Removed `is_active` filter:** Your table doesn't have this field
3. **Added environment variables:** Required for database connection
4. **Added limit:** Prevents processing too many clients at once

**Follow these steps and your engagement score calculation should start working!** 