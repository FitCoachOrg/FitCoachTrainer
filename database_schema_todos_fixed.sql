-- Todo List Table Schema for FitCoachTrainer (FIXED VERSION)
-- This schema supports all features from the TodoList component
-- Fixed: Removed overly restrictive due_date constraint
-- Enhanced: Added AI integration fields for converting AI recommendations to todos

-- Create the todos table
CREATE TABLE IF NOT EXISTS todos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    client_id INTEGER REFERENCES client(client_id) ON DELETE SET NULL,
    completed BOOLEAN DEFAULT FALSE,
    priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    due_date TIMESTAMP WITH TIME ZONE,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- AI Integration Fields (Minimal)
    source VARCHAR(50) DEFAULT 'manual' CHECK (source IN ('manual', 'ai_recommendation')),
    ai_context TEXT, -- Simple text field for original AI recommendation
    
    -- Add constraints (removed the restrictive due_date constraint)
    CONSTRAINT todos_title_not_empty CHECK (title != '')
    -- Removed: CONSTRAINT todos_due_date_future CHECK (due_date IS NULL OR due_date >= created_at)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_todos_trainer_id ON todos(trainer_id);
CREATE INDEX IF NOT EXISTS idx_todos_client_id ON todos(client_id);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);
CREATE INDEX IF NOT EXISTS idx_todos_trainer_completed ON todos(trainer_id, completed);
CREATE INDEX IF NOT EXISTS idx_todos_trainer_priority ON todos(trainer_id, priority);
CREATE INDEX IF NOT EXISTS idx_todos_source ON todos(source);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_todos_updated_at 
    BEFORE UPDATE ON todos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy: Users can only see their own todos
CREATE POLICY "Users can view own todos" ON todos
    FOR SELECT USING (auth.uid() = trainer_id);

-- Policy: Users can insert their own todos
CREATE POLICY "Users can insert own todos" ON todos
    FOR INSERT WITH CHECK (auth.uid() = trainer_id);

-- Policy: Users can update their own todos
CREATE POLICY "Users can update own todos" ON todos
    FOR UPDATE USING (auth.uid() = trainer_id);

-- Policy: Users can delete their own todos
CREATE POLICY "Users can delete own todos" ON todos
    FOR DELETE USING (auth.uid() = trainer_id);

-- Create a view for easier querying with client information
CREATE OR REPLACE VIEW todos_with_clients AS
SELECT 
    t.id,
    t.trainer_id,
    t.title,
    t.client_id,
    c.cl_name as client_name,
    c.cl_email as client_email,
    t.completed,
    t.priority,
    t.due_date,
    t.category,
    t.created_at,
    t.updated_at,
    CASE 
        WHEN t.due_date IS NULL THEN NULL
        WHEN t.due_date < NOW() AND NOT t.completed THEN 'overdue'
        WHEN t.due_date::date = NOW()::date THEN 'today'
        WHEN t.due_date::date = (NOW() + INTERVAL '1 day')::date THEN 'tomorrow'
        ELSE 'upcoming'
    END as due_status
FROM todos t
LEFT JOIN client c ON t.client_id = c.client_id;

-- Create a function to get todos with filtering options
CREATE OR REPLACE FUNCTION get_todos_with_filters(
    p_trainer_id UUID,
    p_completed BOOLEAN DEFAULT NULL,
    p_priority VARCHAR(10) DEFAULT NULL,
    p_client_id INTEGER DEFAULT NULL,
    p_category VARCHAR(100) DEFAULT NULL,
    p_due_status VARCHAR(20) DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    trainer_id UUID,
    title VARCHAR(255),
    client_id INTEGER,
    client_name VARCHAR(255),
    client_email VARCHAR(255),
    completed BOOLEAN,
    priority VARCHAR(10),
    due_date TIMESTAMP WITH TIME ZONE,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    due_status VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.trainer_id,
        t.title,
        t.client_id,
        c.cl_name as client_name,
        c.cl_email as client_email,
        t.completed,
        t.priority,
        t.due_date,
        t.category,
        t.created_at,
        t.updated_at,
        CASE 
            WHEN t.due_date IS NULL THEN NULL
            WHEN t.due_date < NOW() AND NOT t.completed THEN 'overdue'
            WHEN t.due_date::date = NOW()::date THEN 'today'
            WHEN t.due_date::date = (NOW() + INTERVAL '1 day')::date THEN 'tomorrow'
            ELSE 'upcoming'
        END as due_status
    FROM todos t
    LEFT JOIN client c ON t.client_id = c.client_id
    WHERE t.trainer_id = p_trainer_id
        AND (p_completed IS NULL OR t.completed = p_completed)
        AND (p_priority IS NULL OR t.priority = p_priority)
        AND (p_client_id IS NULL OR t.client_id = p_client_id)
        AND (p_category IS NULL OR t.category = p_category)
        AND (
            p_due_status IS NULL 
            OR (
                CASE 
                    WHEN t.due_date IS NULL THEN NULL
                    WHEN t.due_date < NOW() AND NOT t.completed THEN 'overdue'
                    WHEN t.due_date::date = NOW()::date THEN 'today'
                    WHEN t.due_date::date = (NOW() + INTERVAL '1 day')::date THEN 'tomorrow'
                    ELSE 'upcoming'
                END = p_due_status
            )
        )
    ORDER BY 
        CASE t.priority 
            WHEN 'high' THEN 1 
            WHEN 'medium' THEN 2 
            WHEN 'low' THEN 3 
        END,
        t.due_date ASC NULLS LAST,
        t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get todo statistics
CREATE OR REPLACE FUNCTION get_todo_stats(p_trainer_id UUID)
RETURNS TABLE (
    total_todos INTEGER,
    completed_todos INTEGER,
    overdue_todos INTEGER,
    today_todos INTEGER,
    tomorrow_todos INTEGER,
    high_priority_todos INTEGER,
    medium_priority_todos INTEGER,
    low_priority_todos INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_todos,
        COUNT(*) FILTER (WHERE completed)::INTEGER as completed_todos,
        COUNT(*) FILTER (WHERE due_date < NOW() AND NOT completed)::INTEGER as overdue_todos,
        COUNT(*) FILTER (WHERE due_date::date = NOW()::date)::INTEGER as today_todos,
        COUNT(*) FILTER (WHERE due_date::date = (NOW() + INTERVAL '1 day')::date)::INTEGER as tomorrow_todos,
        COUNT(*) FILTER (WHERE priority = 'high')::INTEGER as high_priority_todos,
        COUNT(*) FILTER (WHERE priority = 'medium')::INTEGER as medium_priority_todos,
        COUNT(*) FILTER (WHERE priority = 'low')::INTEGER as low_priority_todos
    FROM todos
    WHERE trainer_id = p_trainer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON todos TO authenticated;
GRANT SELECT ON todos_with_clients TO authenticated;
GRANT EXECUTE ON FUNCTION get_todos_with_filters(UUID, BOOLEAN, VARCHAR(10), INTEGER, VARCHAR(100), VARCHAR(20)) TO authenticated;
GRANT EXECUTE ON FUNCTION get_todo_stats(UUID) TO authenticated;

-- Comments for documentation
COMMENT ON TABLE todos IS 'Stores todo items for trainers with client associations';
COMMENT ON COLUMN todos.trainer_id IS 'References the trainer (user) who owns this todo';
COMMENT ON COLUMN todos.client_id IS 'Optional reference to a specific client this todo is related to';
COMMENT ON COLUMN todos.priority IS 'Priority level: low, medium, or high';
COMMENT ON COLUMN todos.due_date IS 'Optional due date for the todo (can be in the past for overdue items)';
COMMENT ON COLUMN todos.category IS 'Optional category for organizing todos';
COMMENT ON VIEW todos_with_clients IS 'View that joins todos with client information for easier querying';
