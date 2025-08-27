-- AI Todo Integration Migration Script
-- This script adds AI integration fields to the existing todos table

-- Add AI integration fields to todos table
ALTER TABLE todos 
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual' CHECK (source IN ('manual', 'ai_recommendation')),
ADD COLUMN IF NOT EXISTS ai_context TEXT;

-- Create index for better performance on source field
CREATE INDEX IF NOT EXISTS idx_todos_source ON todos(source);

-- Update existing todos to have 'manual' source
UPDATE todos SET source = 'manual' WHERE source IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN todos.source IS 'Source of the todo: manual or ai_recommendation';
COMMENT ON COLUMN todos.ai_context IS 'Original AI recommendation context as JSON string';

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'todos' 
  AND column_name IN ('source', 'ai_context')
ORDER BY column_name;

-- Show sample of existing todos with new fields
SELECT 
  id,
  title,
  source,
  CASE 
    WHEN ai_context IS NOT NULL THEN 'Has AI Context'
    ELSE 'No AI Context'
  END as ai_context_status
FROM todos 
LIMIT 5;
