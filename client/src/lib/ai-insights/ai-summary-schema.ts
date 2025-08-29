// AI Summary strict schema and validation utilities

export type Momentum = 'Up' | 'Flat' | 'Down';
export type Readiness = 'Low' | 'Medium' | 'High' | null;
export type ReasonTag = 'consistency' | 'recovery' | 'technique' | 'nutrition' | 'adherence';

export interface Snapshot {
  momentum: Momentum;
  adherence_pct: number | null;
  readiness: Readiness;
  one_liner: string;
}

export interface ActionItem {
  text: string;
  reason_tag: ReasonTag;
  impact?: string;
  add_to_todo_hint?: boolean;
}

export interface RiskItem {
  text: string;
  mitigation: string;
}

export interface FocusItem {
  text: string;
  metric?: string;
  target?: string;
}

export interface AISummary {
  snapshot: Snapshot;
  actions: ActionItem[];
  risks: RiskItem[];
  next_session: { text: string }[];
  weekly_focus: FocusItem[];
  positives: { text: string }[];
  metadata: { version: string; generated_at: string; data_sources: string[] };
}

export const CAPS = {
  actions: 3,
  risks: 2,
  nextSession: 3,
  weeklyFocus: 2,
  positives: 2,
  oneLinerChars: 120,
  actionChars: 120,
  riskChars: 120,
  mitigationChars: 100,
  nextSessionChars: 100,
  focusChars: 100,
  positiveChars: 80,
} as const;

export const ALLOWED_REASON_TAGS: ReasonTag[] = [
  'consistency',
  'recovery',
  'technique',
  'nutrition',
  'adherence',
];

export function validateAISummary(summary: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!summary || typeof summary !== 'object') {
    return { valid: false, errors: ['Summary must be an object'] };
  }

  const s = summary as Partial<AISummary>;
  if (!s.snapshot) errors.push('Missing snapshot');
  if (!s.metadata) errors.push('Missing metadata');

  const snap = s.snapshot as Partial<Snapshot> | undefined;
  if (snap) {
    if (!snap.momentum || !['Up', 'Flat', 'Down'].includes(String(snap.momentum))) {
      errors.push('snapshot.momentum invalid');
    }
    if (snap.adherence_pct !== null && snap.adherence_pct !== undefined) {
      const v = Number(snap.adherence_pct);
      if (Number.isNaN(v) || v < 0 || v > 100) errors.push('snapshot.adherence_pct out of range');
    }
    if (snap.one_liner && snap.one_liner.length > CAPS.oneLinerChars) {
      errors.push('snapshot.one_liner too long');
    }
  }

  const listChecks: Array<{ key: keyof AISummary; max: number }> = [
    { key: 'actions', max: CAPS.actions },
    { key: 'risks', max: CAPS.risks },
    { key: 'next_session', max: CAPS.nextSession },
    { key: 'weekly_focus', max: CAPS.weeklyFocus },
    { key: 'positives', max: CAPS.positives },
  ];
  listChecks.forEach(({ key, max }) => {
    const arr = (s as any)[key];
    if (arr && !Array.isArray(arr)) errors.push(`${String(key)} must be an array`);
    if (Array.isArray(arr) && arr.length > max) errors.push(`${String(key)} exceeds cap ${max}`);
  });

  if (Array.isArray(s.actions)) {
    s.actions.forEach((a, i) => {
      if (!ALLOWED_REASON_TAGS.includes(a.reason_tag)) errors.push(`actions[${i}].reason_tag invalid`);
      if (a.text && a.text.length > CAPS.actionChars) errors.push(`actions[${i}].text too long`);
    });
  }
  if (Array.isArray(s.risks)) {
    s.risks.forEach((r, i) => {
      if (r.text && r.text.length > CAPS.riskChars) errors.push(`risks[${i}].text too long`);
      if (r.mitigation && r.mitigation.length > CAPS.mitigationChars) errors.push(`risks[${i}].mitigation too long`);
    });
  }
  if (Array.isArray(s.next_session)) {
    s.next_session.forEach((n, i) => {
      if (n.text && n.text.length > CAPS.nextSessionChars) errors.push(`next_session[${i}].text too long`);
    });
  }
  if (Array.isArray(s.weekly_focus)) {
    s.weekly_focus.forEach((w, i) => {
      if (w.text && w.text.length > CAPS.focusChars) errors.push(`weekly_focus[${i}].text too long`);
    });
  }
  if (Array.isArray(s.positives)) {
    s.positives.forEach((p, i) => {
      if (p.text && p.text.length > CAPS.positiveChars) errors.push(`positives[${i}].text too long`);
    });
  }

  return { valid: errors.length === 0, errors };
}


