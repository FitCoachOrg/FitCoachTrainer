// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log("🚀 Starting engagement score calculation for last 7 days...");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      const msg = "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars";
      console.error(msg);
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Prepare last 7 dates in UTC (yesterday to 7 days ago)
    const now = new Date();
    const last7Dates: string[] = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
      last7Dates.push(d.toISOString().slice(0, 10));
    }
    const dateRangeLabel = `${last7Dates[last7Dates.length - 1]}..${last7Dates[0]}`;
    console.log(`📅 Calculating engagement scores for dates: ${dateRangeLabel}`);

    // 1. Get clients
    const { data: clientsData, error: clientError } = await supabase
      .from("client")
      .select("client_id, cl_name");

    if (clientError) {
      console.error("❌ Error fetching clients:", clientError);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch clients",
          details: clientError,
          timestamp: new Date().toISOString(),
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clients = clientsData ?? [];
    console.log(`👥 Found ${clients.length} clients`);

    let upsertedCount = 0;
    let errorCount = 0;

    // 2. Process each client
    for (const client of clients) {
      const clientId = client.client_id;
      const clientName = client.cl_name || `Client ${clientId}`;

      try {
        for (const forDate of last7Dates) {
          // Get all schedules due for this client on that day (UTC)
          const { data: schedules, error: scheduleError } = await supabase
            .from("schedule")
            .select("id, status, for_date")
            .eq("client_id", clientId)
            .eq("for_date", forDate);

          if (scheduleError) {
            console.error(`❌ Error fetching schedules for ${clientName} (${forDate}):`, scheduleError);
            errorCount++;
            continue;
          }

          const totalDue = (schedules ?? []).length;
          const completed = (schedules ?? []).filter((s: any) => s.status === "completed").length;
          const engScore = totalDue > 0 ? Math.round((completed / totalDue) * 100) : null;

          // Replace existing score (delete then insert) to avoid unique conflicts
          if (totalDue > 0 || engScore !== null) {
            const { error: deleteError } = await supabase
              .from("client_engagement_score")
              .delete()
              .eq("client_id", clientId)
              .eq("for_date", forDate);

            if (deleteError) {
              console.error(`❌ Error deleting existing score for ${clientName} (${forDate}):`, deleteError);
              errorCount++;
              continue;
            }

            const { error: insertError } = await supabase
              .from("client_engagement_score")
              .insert({
                for_date: forDate,
                eng_score: engScore,
                client_id: clientId,
                total_due: totalDue,
                completed: completed,
              });

            if (insertError) {
              console.error(`❌ Error inserting engagement score for ${clientName} (${forDate}):`, insertError);
              errorCount++;
            } else {
              console.log(`✅ ${clientName} ${forDate}: ${engScore}% (${completed}/${totalDue})`);
              upsertedCount++;
            }
          } else {
            console.log(`📝 ${clientName} ${forDate}: No tasks due`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing client ${clientName}:`, error);
        errorCount++;
      }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    const summary = {
      status: "Engagement scores calculated and upserted for last 7 days.",
      date_range: dateRangeLabel,
      duration: `${duration} seconds`,
      upserted: upsertedCount,
      errors: errorCount,
      total_clients: clients.length,
      timestamp: new Date().toISOString(),
    };

    console.log("\n📊 Daily Engagement Score Calculation Summary:");
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`✅ Upserted rows: ${upsertedCount}`);
    console.log(`❌ Errors: ${errorCount} clients`);
    console.log(`📅 Dates processed: ${dateRangeLabel}`);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Fatal error in daily engagement score calculation:", error);
    return new Response(
      JSON.stringify({
        error: "Fatal error in engagement score calculation",
        details: error?.message ?? String(error),
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});