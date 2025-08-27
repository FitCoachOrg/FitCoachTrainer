import { ActionItem, AISummary } from './ai-summary-schema';

export interface TodoInput {
  trainerId: string; // UUID string from supabase auth
  clientId: number;
}

export interface TodoRecord {
  title: string;
  priority: 'low' | 'medium' | 'high';
  client_id: number;
  category?: string;
  due_date?: string; // ISO string
  source: 'manual' | 'ai_recommendation';
  ai_context?: string;
}

function priorityFromSignals(summary: AISummary): 'low' | 'medium' | 'high' {
  const adherence = summary.snapshot?.adherence_pct ?? null;
  const readiness = summary.snapshot?.readiness ?? null;
  const hasRisks = (summary.risks || []).length > 0;
  if ((adherence !== null && adherence < 60) || readiness === 'Low' || hasRisks) return 'high';
  return 'medium';
}

function dueDateFromAction(action: ActionItem): string | undefined {
  const now = new Date();
  const days = action.reason_tag === 'consistency' || action.reason_tag === 'adherence' ? 3 : 2;
  now.setDate(now.getDate() + days);
  return now.toISOString();
}

function normalizeTitle(text: string): string {
  let t = text.trim();
  if (t.endsWith('.')) t = t.slice(0, -1);
  if (t.length > 80) t = t.slice(0, 80).trim();
  // Make imperative feel
  if (/^swap/i.test(t)) return t; // already imperative verb
  return t;
}

function keyForDedupe(title: string, clientId: number): string {
  return `${clientId}::${title.toLowerCase()}`;
}

export function mapActionsToTodos(summary: AISummary, ctx: TodoInput): TodoRecord[] {
  const actions = (summary.actions || []).filter(a => a.add_to_todo_hint);
  const out: TodoRecord[] = [];
  const seen = new Map<string, Date>();
  const basePriority = priorityFromSignals(summary);

  for (const a of actions) {
    if (!a.text) continue;
    const title = normalizeTitle(a.text);
    const k = keyForDedupe(title, ctx.clientId);
    if (seen.has(k)) continue;
    seen.set(k, new Date());

    const rec: TodoRecord = {
      title,
      priority: basePriority,
      client_id: ctx.clientId,
      category: a.reason_tag,
      due_date: dueDateFromAction(a),
      source: 'ai_recommendation',
      ai_context: JSON.stringify({ action: a, snapshot: summary.snapshot })
    };
    out.push(rec);
    if (out.length >= 3) break; // cap
  }
  return out;
}


