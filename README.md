# FitCoachTrainer Documentation

## Workout Plan Save Logic (Latest)

### Table: `schedule`

#### Schema (Relevant Columns)
```sql
create table public.schedule (
  id bigint generated by default as identity not null,
  client_id integer not null,
  task text null,
  summary text null,
  type text null,
  for_date date not null,
  for_time time with time zone not null,
  icon text null,
  coach_tip text null,
  workout_id uuid null,
  details_json jsonb null,
  -- ...other columns...
  constraint schedule_pkey primary key (id),
  constraint schedule_client_id_fkey foreign KEY (client_id) references client (client_id)
);
```

#### Field Mapping for Insert
| Field         | Source/Logic                                      |
|---------------|---------------------------------------------------|
| type          | `"workout"`                                       |
| task          | `"workout"`                                       |
| for_date      | `ex.date`                                         |
| for_time      | Fetched from `client.workout_time`                |
| icon          | `ex.icon`                                         |
| coach_tip     | `ex.coach_tip`                                    |
| summary       | `ex.exercise`                                     |
| client_id     | `clientId`                                        |
| workout_id    | `ex.workout_id` or generated UUID                 |
| details_json  | Built from exercise fields as per sample below    |

#### details_json Sample
```json
{
  "category": "Cardio",
  "body_part": "Full Body",
  "sets": 1,
  "reps": 15,
  "weight": 0,
  "other_details": "Focus on your form."
}
```

### Error Handling & Robustness
- The AI prompt now instructs the LLM to return ONLY valid JSON, with no extra text.
- The code extracts the first JSON block from the AI response and handles parsing errors gracefully.
- If the AI returns invalid JSON, a user-friendly error is shown and the raw response is logged for debugging.

### Known Issues
- If you see a 400 (Bad Request) error from Supabase, check that all required fields are present and correctly typed in the upsert payload.
- The most common cause is a missing or malformed field in the upsert data (see mapping above).

---

_Last updated: [automated]_ Significant changes to workout plan save logic, error handling, and documentation._
