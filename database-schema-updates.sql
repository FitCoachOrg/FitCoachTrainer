-- Add monthly_reports column to client table
-- This will store JSON data for metric selections and report preferences

ALTER TABLE client 
ADD COLUMN IF NOT EXISTS monthly_reports JSONB DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN client.monthly_reports IS 'JSONB column storing monthly report preferences including selected metrics, last generated month, and report settings';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_client_monthly_reports ON client USING GIN (monthly_reports);

-- Example structure of monthly_reports JSONB:
-- {
--   "selected_metrics": ["weight", "sleep", "heartRate"],
--   "last_generated_month": "2025-08",
--   "report_settings": {
--     "include_ai_insights": true,
--     "include_targets": true,
--     "include_charts": false
--   },
--   "generated_reports": [
--     {
--       "month": "2025-08",
--       "generated_at": "2025-08-30T12:42:43Z",
--       "file_path": "/client/34/reports/July_25.pdf",
--       "metrics_count": 3
--     }
--   ]
-- }
