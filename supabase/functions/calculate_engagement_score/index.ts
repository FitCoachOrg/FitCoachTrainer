import { createClient } from "@supabase/supabase-js";

// Environment variables for Supabase service role key and URL
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function handler(req: any, res: any) {
  // Calculate the previous day in UTC
  const now = new Date();
  const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  const forDate = yesterday.toISOString().slice(0, 10); // YYYY-MM-DD

  // 1. Get all clients
  const { data: clients, error: clientError } = await supabase.from("client").select("client_id");
  if (clientError) {
    return res.status(500).json({ error: "Failed to fetch clients", details: clientError });
  }

  for (const client of clients) {
    const clientId = client.client_id;
    // 2. Check if score already exists for this client and date
    const { data: existing, error: existingError } = await supabase
      .from("client_engagement_score")
      .select("id")
      .eq("client_id", clientId)
      .eq("for_date", forDate)
      .maybeSingle();
    if (existingError) {
      console.error(`Error checking existing score for client ${clientId}:`, existingError);
      continue;
    }
    if (existing) {
      // Score already exists, skip
      continue;
    }
    // 3. Get all schedules due for this client on that day (UTC)
    const { data: schedules, error: scheduleError } = await supabase
      .from("schedule")
      .select("id, status, due_date")
      .eq("client_id", clientId)
      .gte("due_date", `${forDate}T00:00:00+00:00`)
      .lt("due_date", `${forDate}T23:59:59.999+00:00`);
    if (scheduleError) {
      console.error(`Error fetching schedules for client ${clientId}:`, scheduleError);
      continue;
    }
    const totalDue = schedules.length;
    const completed = schedules.filter((s: any) => s.status === "completed").length;
    const engScore = totalDue > 0 ? Math.round((completed / totalDue) * 100) : null;
    // 4. Insert the score
    const { error: insertError } = await supabase.from("client_engagement_score").insert({
      for_date: forDate,
      eng_score: engScore,
      client_id: clientId,
    });
    if (insertError) {
      console.error(`Error inserting engagement score for client ${clientId}:`, insertError);
    }
  }
  return res.status(200).json({ status: "Engagement scores calculated and stored for previous day." });
} 