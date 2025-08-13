import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const now = new Date();
const last7 = Array.from({length:7}, (_,i)=>{const d=new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()-(i+1)));return d.toISOString().slice(0,10)});
console.log('Dates:', last7.join(', '));
const { data: clients, error: clientErr } = await supabase.from('client').select('client_id, cl_name').limit(5);
if (clientErr) { console.error('Client fetch error:', clientErr); process.exit(1); }
for (const c of clients) {
  console.log(`\nClient ${c.client_id} ${c.cl_name}`);
  for (const forDate of last7) {
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedule')
      .select('id, status, for_date')
      .eq('client_id', c.client_id)
      .eq('for_date', forDate);
    if (scheduleError) { console.error('Schedule error', {client:c.client_id, forDate, scheduleError}); continue; }
    const totalDue = (schedules ?? []).length;
    const completed = (schedules ?? []).filter(s=>s.status==='completed').length;
    const engScore = totalDue>0 ? Math.round((completed/totalDue)*100) : null;
    if (totalDue>0 || engScore!==null) {
      const { error: delErr } = await supabase.from('client_engagement_score').delete().eq('client_id', c.client_id).eq('for_date', forDate);
      if (delErr) { console.error('Delete error', {client:c.client_id, forDate, delErr}); continue; }
      const { error: insErr } = await supabase.from('client_engagement_score').insert({for_date: forDate, eng_score: engScore, client_id: c.client_id, total_due: totalDue, completed});
      if (insErr) { console.error('Insert error', {client:c.client_id, forDate, insErr}); }
      else { console.log(`Upserted ${forDate}: ${engScore}% (${completed}/${totalDue})`); }
    } else {
      console.log(`No tasks ${forDate}`);
    }
  }
}
