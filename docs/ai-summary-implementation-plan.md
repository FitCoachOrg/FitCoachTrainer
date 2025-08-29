## AI Summary Implementation Plan

### Phase 0 – Prep (same day)
- Create docs (strategy, plan) and TODOs – DONE.
- Confirm data sources: workout_info, schedule, activity_info, meal_info, client_engagement_score.

### Phase 1 – Data views and indexes (day 1)
1) SQL views or API JSON:
   - adherence_14d(client_id, adherence_pct)
   - momentum_3w(client_id, sessions_delta, volume_delta, avg_sessions, avg_volume)
   - readiness_7d(client_id, sleep_quality_avg, sleep_duration_avg, energy_avg)
   - nutrition_7d(client_id, kcal_avg, protein_avg, carbs_avg, fat_avg)
   - engagement_14d(client_id, eng_score_avg, latest_score)
2) Indexes:
   - schedule(client_id, scheduled_at, status)
   - workout_info(client_id, created_at)

### Phase 2 – LLM prompt + schema + post-processor (day 1–2)
1) Prompt: include only 5 view payloads + recent trainer notes + latest ai_summary.
2) Output schema: strict JSON (see strategy doc).
3) Post-processor:
   - Enforce caps and max lengths.
   - Validate allowed reason_tag set.
   - Drop empty/duplicated items.
   - If missing data → neutral sections; skip todo generation.

### Phase 3 – Todo mapping service (day 2)
1) Convert actions to todos only if `add_to_todo_hint=true`.
2) Priority rules, category mapping, due date heuristics.
3) Deduplication (title, client_id, ±10 days).
4) Write with `source='ai_recommendation'` and populate `ai_context`.

### Phase 4 – UI updates (day 2–3)
1) Snapshot header: momentum, adherence 14d, readiness, one-liner.
2) Capped sections: actions (3), risks (2), next session (3), weekly focus (2), positives (2).
3) Show more toggles for extended content.
4) Action badges (reason), Add to Todo, Add all to Todo.
5) Timestamp + Data sources link under snapshot.

### Phase 5 – Telemetry & QA (day 3)
1) Log generation events with version and inputs; store JSON.
2) Track rates: actions accepted, todos created, dismissals.
3) QA scenarios: missing data, low adherence, high RPE, no meals, etc.

### Deliverables checklist
- [ ] Views/APIs created and indexed
- [ ] Prompt updated; schema enforced
- [ ] Post-processor implemented with unit tests
- [ ] Todo mapper implemented with unit tests
- [ ] UI updated with caps and toggles
- [ ] Telemetry logging in place

### Rollback plan
- Toggle feature flag to revert to previous AI Insights presentation.
- Keep old render path for one release as fallback.

### Risks & Mitigations
- Incomplete data → neutral outputs; no todos created.
- LLM variability → strict schema + post-processing + item caps.
- Performance → indexes + small view payloads.


