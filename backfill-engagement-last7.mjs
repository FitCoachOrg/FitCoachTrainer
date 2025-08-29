#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function backfill() {
  const now = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (i + 1)));
    return d.toISOString().slice(0, 10);
  });
  console.log('Processing dates:', dates.join(', '));

  const { data: clients, error: clientErr } = await supabase.from('client').select('client_id, cl_name');
  if (clientErr) throw clientErr;

  let inserted = 0; let errors = 0;

  for (const c of clients || []) {
    for (const forDate of dates) {
      const { data: schedules, error: scheduleErr } = await supabase
        .from('schedule')
        .select('id, status, for_date')
        .eq('client_id', c.client_id)
        .eq('for_date', forDate);
      if (scheduleErr) { console.error('Schedule error', c.client_id, forDate, scheduleErr); errors++; continue; }
      const totalDue = (schedules || []).length;
      const completed = (schedules || []).filter(s => s.status === 'completed').length;
      const engScore = totalDue > 0 ? Math.round((completed / totalDue) * 100) : null;
      if (totalDue > 0 || engScore !== null) {
        const { error: delErr } = await supabase
          .from('client_engagement_score')
          .delete()
          .eq('client_id', c.client_id)
          .eq('for_date', forDate);
        if (delErr) { console.error('Delete error', c.client_id, forDate, delErr); errors++; continue; }
        const { error: insErr } = await supabase
          .from('client_engagement_score')
          .insert({ for_date: forDate, eng_score: engScore, client_id: c.client_id, total_due: totalDue, completed });
        if (insErr) { console.error('Insert error', c.client_id, forDate, insErr); errors++; }
        else { inserted++; }
      }
    }
  }
  console.log('Done. Inserted:', inserted, 'Errors:', errors);
}

backfill().catch((e)=>{console.error(e); process.exit(1);});
