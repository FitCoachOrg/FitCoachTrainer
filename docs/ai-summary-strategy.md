## AI Summary Strategy

### Objectives
- Make insights concise, decision-oriented, and grounded in reliable data.
- Generate better, actionable todos from LLM output with clear priority, category, due dates, and traceability.

### North-star outcomes
- Trainer scans insights in ≤30 seconds.
- Exactly 3 immediate actions with short reasons.
- Todos are specific, trackable, and tied to the client’s schedule.

### Current data backbone
- workout_info: sets, reps, duration, intensity (RPE proxy)
- schedule: adherence via status = 'completed'
- activity_info: sleep quality/duration, hydration, energy (readiness proxies)
- meal_info: calories, protein, carbs, fat
- client_engagement_score: daily engagement (0–100)
- trainer_client_web.ai_summary: JSON for AI recommendations and context

### Minimal LLM-ready views (or API JSON shapes)
- adherence_14d(client_id, adherence_pct)
- momentum_3w(client_id, sessions_delta, volume_delta, avg_sessions, avg_volume)
- readiness_7d(client_id, sleep_quality_avg, sleep_duration_avg, energy_avg)
- nutrition_7d(client_id, kcal_avg, protein_avg, carbs_avg, fat_avg)
- engagement_14d(client_id, eng_score_avg, latest_score)

These can be created as SQL views or emitted by an API layer with the same shape.

### AI Summary structure (strict, concise)
1) Key Snapshot
- Fitness Momentum: Up/Flat/Down (sessions_delta/volume_delta)
- Adherence 14d: n%
- Readiness: Low/Medium/High (from readiness_7d)
- One-liner (≤120 chars)

2) Immediate Actions (max 3)
- Format: "Do X → constraint — reason"
- Reason tags: consistency, recovery, technique, nutrition, adherence

3) Risks & Watchouts (max 2)
- Format: "Signal — mitigation (≤100 chars)"

4) Next Session (max 3)
- Format: "Specific exercise + scheme + RPE"

5) Focus This Week (max 2)
- Format: "Focus: metric; target"

6) Positives (max 2)
- Format: "Concrete improvement — keep it up"

Everything else collapses under "Show more".

### LLM inputs and guardrails
- Inputs
  - The 5 small data views above
  - Trainer notes (last 2 weeks)
  - Latest ai_summary for continuity
- Guardrails
  - Enforce item caps and max lengths
  - Use reason tags from a fixed set
  - No narratives; bullets and one-liners only

### Output schema (strict)
```
snapshot: { momentum: 'Up'|'Flat'|'Down', adherence_pct: number|null, readiness: 'Low'|'Medium'|'High'|null, one_liner: string }
actions: [{ text: string, reason_tag: 'consistency'|'recovery'|'technique'|'nutrition'|'adherence', impact?: string, add_to_todo_hint?: boolean }]
risks: [{ text: string, mitigation: string }]
next_session: [{ text: string }]
weekly_focus: [{ text: string, metric?: string, target?: string }]
positives: [{ text: string }]
metadata: { version: string, generated_at: string, data_sources: string[] }
```

### Todo generation strategy (deterministic)
- Create todos only for actions with `add_to_todo_hint=true`.
- Max 3 new todos per run; dedupe by (title, client_id, ±10 days).
- Title: imperative, ≤80 chars, no jargon.
- Priority
  - high: adherence < 60% OR readiness = Low OR risk present
  - medium: otherwise
- Category: from reason_tag
- Due date
  - Behavioral/habit → +3 days
  - Session-specific → next planned session date if available; else +2 days
- ai_context: store original action text + snapshot for traceability

### Readiness, Momentum, Adherence (now)
- Readiness (proxy)
  - Weighted score from activity_info: sleep_quality 40%, sleep_duration 30%, energy 30%
  - Buckets: ≥70 High, 40–69 Medium, <40 Low
- Momentum
  - sessions_delta (count in workout_info) and volume_delta (sum sets×reps) over last 3 weeks
  - Up if both rising, Flat if mixed/small, Down if both falling
- Adherence
  - From schedule: completed / total in last 14 days; if total=0 → null (avoid claims)

### Safeguards
- If any view is empty/null, LLM must not hallucinate; return neutral lines and skip todo creation.
- Post-process and enforce section caps and text lengths before render.
- Log generation metadata (version, inputs) for audit.

### UX conventions
- Icons + color-coded labels (Up/Flat/Down, Low/Med/High)
- Reason badges on actions
- "Add all to Todo" with preview/edit and 3-item cap
- Timestamp and "Data sources" link under Snapshot

### Acceptance criteria
- Above-the-fold summary fits on laptop without scrolling.
- Caps: 3 actions, 2 risks, 3 next-session items, 2 focus, 2 positives.
- Todos have priority, category, due date, ai_context; max 3; deduped.
- No fabricated metrics when data is missing.


