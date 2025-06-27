import { supabase } from "./supabase";

export async function getOrCreateEngagementScore(clientId: number): Promise<number | null> {
  // Calculate the last 30 days in UTC
  const now = new Date();
  const days: { forDate: string }[] = [];
  for (let i = 1; i <= 30; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    const forDate = d.toISOString().slice(0, 10); // YYYY-MM-DD
    days.push({ forDate });
  }

  // 1. Fetch existing scores for the last 30 days
  const { data: existingRows, error: existingError } = await supabase
    .from("client_engagement_score")
    .select("for_date, eng_score")
    .eq("client_id", clientId)
    .in("for_date", days.map(d => d.forDate));

  if (existingError) {
    console.error("Error checking engagement scores:", existingError);
    return null;
  }
  const existingDates = new Set((existingRows || []).map((row: any) => row.for_date));

  // 2. For each missing day, calculate and insert
  for (const { forDate } of days) {
    // Defensive: skip today and future dates
    const today = new Date();
    const yesterday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 1));
    const forDateObj = new Date(forDate);
    if (forDateObj >= today) {
      console.log(`[EngagementScore] Skipping today or future date: ${forDate}`);
      continue;
    }
    // Only calculate for yesterday and backwards
    if (forDateObj > yesterday) {
      console.log(`[EngagementScore] Skipping date after yesterday: ${forDate}`);
      continue;
    }

    // Ensure only one entry per client per day
    const { data: existing, error: existingError } = await supabase
      .from("client_engagement_score")
      .select("id")
      .eq("client_id", clientId)
      .eq("for_date", forDate)
      .maybeSingle();
    if (existingError) {
      console.error(`Error checking for existing engagement score for ${forDate}:`, existingError, { clientId, forDate });
      continue;
    }
    if (existing) {
      // Entry already exists, skip insert
      console.log(`[EngagementScore] Entry already exists for client ${clientId} on ${forDate}, skipping insert.`);
      continue;
    }

    // Use .eq for date columns (use correct column name 'for_date')
    const { data: schedules, error: scheduleError } = await supabase
      .from("schedule")
      .select("id, status, for_date") // select for_date, not due_date
      .eq("client_id", clientId)
      .eq("for_date", forDate); // Use correct column name
    if (scheduleError) {
      console.error(`Error fetching schedules for ${forDate}:`, scheduleError, { clientId, forDate });
      continue;
    }
    const totalDue = schedules.length;
    const completed = schedules.filter((s: any) => s.status === "completed").length;
    const engScore = totalDue > 0 ? Math.round((completed / totalDue) * 100) : null;
    if (engScore !== null) {
      // Insert engagement score, total_due, and completed into the table
      const { error: insertError } = await supabase.from("client_engagement_score").insert({
        for_date: forDate,
        eng_score: engScore,
        client_id: clientId,
        total_due: totalDue, // total number of tasks
        completed: completed, // number of completed tasks
      });
      if (insertError) {
        console.error(`Error inserting engagement score for ${forDate}:`, insertError, { clientId, forDate, engScore, totalDue, completed });
      }
    }
  }

  // 3. Return the score for the previous day (UTC)
  const prevDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1)).toISOString().slice(0, 10);
  const { data: prevScoreRow, error: prevScoreError } = await supabase
    .from("client_engagement_score")
    .select("eng_score")
    .eq("client_id", clientId)
    .eq("for_date", prevDay)
    .maybeSingle();
  if (prevScoreError) {
    console.error("Error fetching previous day's engagement score:", prevScoreError);
    return null;
  }
  return prevScoreRow && prevScoreRow.eng_score !== null ? Number(prevScoreRow.eng_score) : null;
} 