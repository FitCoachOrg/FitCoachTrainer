import { AISummary, CAPS, ALLOWED_REASON_TAGS } from './ai-summary-schema';

function truncate(text: string, max: number): string {
  if (!text) return text;
  return text.length > max ? text.slice(0, max).trim() : text;
}

export function postProcessSummary(raw: AISummary): AISummary {
  const summary: AISummary = JSON.parse(JSON.stringify(raw));

  // snapshot
  if (summary.snapshot.one_liner) {
    summary.snapshot.one_liner = truncate(summary.snapshot.one_liner, CAPS.oneLinerChars);
  }

  // filter and cap arrays
  summary.actions = (summary.actions || [])
    .filter(a => a && a.text && ALLOWED_REASON_TAGS.includes(a.reason_tag))
    .slice(0, CAPS.actions)
    .map(a => ({
      ...a,
      text: truncate(a.text, CAPS.actionChars)
    }));

  summary.risks = (summary.risks || [])
    .filter(r => r && r.text && r.mitigation)
    .slice(0, CAPS.risks)
    .map(r => ({
      ...r,
      text: truncate(r.text, CAPS.riskChars),
      mitigation: truncate(r.mitigation, CAPS.mitigationChars)
    }));

  summary.next_session = (summary.next_session || [])
    .filter(n => n && n.text)
    .slice(0, CAPS.nextSession)
    .map(n => ({ text: truncate(n.text, CAPS.nextSessionChars) }));

  summary.weekly_focus = (summary.weekly_focus || [])
    .filter(w => w && w.text)
    .slice(0, CAPS.weeklyFocus)
    .map(w => ({
      ...w,
      text: truncate(w.text, CAPS.focusChars)
    }));

  summary.positives = (summary.positives || [])
    .filter(p => p && p.text)
    .slice(0, CAPS.positives)
    .map(p => ({ text: truncate(p.text, CAPS.positiveChars) }));

  return summary;
}


