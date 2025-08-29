-- Deduplicate and add unique constraint for schedule upsert
BEGIN;

-- 1) Remove duplicates, keep the latest per (client_id, for_date, type)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY client_id, for_date, type
           ORDER BY id DESC
         ) AS rn
  FROM schedule
)
DELETE FROM schedule s
USING ranked r
WHERE s.id = r.id
  AND r.rn > 1;

-- 2) Add unique constraint for upsert conflict target
ALTER TABLE schedule
  ADD CONSTRAINT schedule_unique_client_date_type
  UNIQUE (client_id, for_date, type);

COMMIT;
