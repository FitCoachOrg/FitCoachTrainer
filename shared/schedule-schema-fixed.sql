-- Trainer Schedule Management Schema (Fixed for existing database structure)
-- This schema provides comprehensive schedule management for fitness trainers

-- Enable Row Level Security (RLS)
ALTER TABLE IF EXISTS schedule_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS schedule_recurring_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS schedule_event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS schedule_event_notes ENABLE ROW LEVEL SECURITY;

-- Main schedule events table
CREATE TABLE IF NOT EXISTS schedule_events (
    id SERIAL PRIMARY KEY,
    
    -- Basic event information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('consultation', 'check-in', 'meeting', 'fitness', 'nutrition', 'assessment', 'follow-up', 'group_session')),
    
    -- Date and time
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0 AND duration_minutes <= 480),
    
    -- Location and virtual meeting
    location VARCHAR(255),
    is_virtual BOOLEAN DEFAULT false,
    meeting_url VARCHAR(500),
    meeting_platform VARCHAR(50), -- 'zoom', 'teams', 'google_meet', etc.
    
    -- Trainer information
    trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trainer_email VARCHAR(255) NOT NULL,
    
    -- Client information (optional for non-client events)
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    client_name VARCHAR(255),
    client_email VARCHAR(255),
    
    -- Event status and priority
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Recurring event information
    is_recurring BOOLEAN DEFAULT false,
    recurring_pattern VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'custom'
    recurring_end_date DATE,
    parent_event_id INTEGER REFERENCES schedule_events(id) ON DELETE CASCADE,
    
    -- Color and styling
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color code
    custom_color VARCHAR(7),
    
    -- Reminders and notifications
    reminder_minutes INTEGER DEFAULT 15, -- Minutes before event
    send_reminder BOOLEAN DEFAULT true,
    reminder_sent BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT valid_duration CHECK (duration_minutes = EXTRACT(EPOCH FROM (end_time - start_time)) / 60)
);

-- Recurring events template table
CREATE TABLE IF NOT EXISTS schedule_recurring_events (
    id SERIAL PRIMARY KEY,
    
    -- Basic information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL,
    
    -- Time pattern
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    
    -- Recurrence pattern
    recurrence_type VARCHAR(50) NOT NULL CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'yearly', 'custom')),
    recurrence_interval INTEGER DEFAULT 1, -- Every X days/weeks/months
    recurrence_days INTEGER[], -- For weekly: [1,3,5] for Mon,Wed,Fri
    recurrence_day_of_month INTEGER, -- For monthly: day of month
    recurrence_month_of_year INTEGER, -- For yearly: month (1-12)
    
    -- Date range
    start_date DATE NOT NULL,
    end_date DATE,
    max_occurrences INTEGER, -- Limit number of occurrences
    
    -- Trainer and client
    trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trainer_email VARCHAR(255) NOT NULL,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    client_name VARCHAR(255),
    
    -- Settings
    color VARCHAR(7) DEFAULT '#3B82F6',
    reminder_minutes INTEGER DEFAULT 15,
    send_reminder BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Event attendees table (for group sessions)
CREATE TABLE IF NOT EXISTS schedule_event_attendees (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES schedule_events(id) ON DELETE CASCADE,
    
    -- Attendee information
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    
    -- Attendance status
    status VARCHAR(50) DEFAULT 'invited' CHECK (status IN ('invited', 'confirmed', 'declined', 'attended', 'no_show')),
    response_date TIMESTAMP WITH TIME ZONE,
    
    -- Notes
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event notes and follow-up table
CREATE TABLE IF NOT EXISTS schedule_event_notes (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES schedule_events(id) ON DELETE CASCADE,
    
    -- Note content
    note_type VARCHAR(50) DEFAULT 'general' CHECK (note_type IN ('general', 'pre_session', 'post_session', 'follow_up', 'assessment')),
    title VARCHAR(255),
    content TEXT NOT NULL,
    
    -- Attachments
    attachments JSONB, -- Array of file URLs/metadata
    
    -- Author
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_by_name VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trainer availability table
CREATE TABLE IF NOT EXISTS trainer_availability (
    id SERIAL PRIMARY KEY,
    trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Availability pattern
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Settings
    is_available BOOLEAN DEFAULT true,
    max_bookings_per_slot INTEGER DEFAULT 1,
    
    -- Date range
    valid_from DATE NOT NULL,
    valid_until DATE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trainer time off/blocked time table
CREATE TABLE IF NOT EXISTS trainer_time_off (
    id SERIAL PRIMARY KEY,
    trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Time off details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Type
    time_off_type VARCHAR(50) DEFAULT 'personal' CHECK (time_off_type IN ('personal', 'sick', 'vacation', 'training', 'other')),
    
    -- Settings
    is_all_day BOOLEAN DEFAULT false,
    auto_decline_bookings BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_schedule_events_trainer_id ON schedule_events(trainer_id);
CREATE INDEX IF NOT EXISTS idx_schedule_events_client_id ON schedule_events(client_id);
CREATE INDEX IF NOT EXISTS idx_schedule_events_start_time ON schedule_events(start_time);
CREATE INDEX IF NOT EXISTS idx_schedule_events_end_time ON schedule_events(end_time);
CREATE INDEX IF NOT EXISTS idx_schedule_events_status ON schedule_events(status);
CREATE INDEX IF NOT EXISTS idx_schedule_events_event_type ON schedule_events(event_type);
CREATE INDEX IF NOT EXISTS idx_schedule_events_date_range ON schedule_events(start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_schedule_recurring_events_trainer_id ON schedule_recurring_events(trainer_id);
CREATE INDEX IF NOT EXISTS idx_schedule_recurring_events_start_date ON schedule_recurring_events(start_date);

CREATE INDEX IF NOT EXISTS idx_schedule_event_attendees_event_id ON schedule_event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_schedule_event_attendees_client_id ON schedule_event_attendees(client_id);

CREATE INDEX IF NOT EXISTS idx_schedule_event_notes_event_id ON schedule_event_notes(event_id);
CREATE INDEX IF NOT EXISTS idx_schedule_event_notes_created_by ON schedule_event_notes(created_by);

CREATE INDEX IF NOT EXISTS idx_trainer_availability_trainer_id ON trainer_availability(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_availability_day_time ON trainer_availability(day_of_week, start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_trainer_time_off_trainer_id ON trainer_time_off(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_time_off_date_range ON trainer_time_off(start_time, end_time);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_schedule_events_updated_at BEFORE UPDATE ON schedule_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedule_recurring_events_updated_at BEFORE UPDATE ON schedule_recurring_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedule_event_attendees_updated_at BEFORE UPDATE ON schedule_event_attendees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedule_event_notes_updated_at BEFORE UPDATE ON schedule_event_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trainer_availability_updated_at BEFORE UPDATE ON trainer_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trainer_time_off_updated_at BEFORE UPDATE ON trainer_time_off FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for schedule_events
CREATE POLICY "Trainers can view their own events" ON schedule_events
    FOR SELECT USING (auth.uid()::integer = trainer_id);

CREATE POLICY "Trainers can insert their own events" ON schedule_events
    FOR INSERT WITH CHECK (auth.uid()::integer = trainer_id);

CREATE POLICY "Trainers can update their own events" ON schedule_events
    FOR UPDATE USING (auth.uid()::integer = trainer_id);

CREATE POLICY "Trainers can delete their own events" ON schedule_events
    FOR DELETE USING (auth.uid()::integer = trainer_id);

-- RLS Policies for other tables (similar pattern)
CREATE POLICY "Trainers can manage their recurring events" ON schedule_recurring_events
    FOR ALL USING (auth.uid()::integer = trainer_id);

CREATE POLICY "Trainers can manage their event attendees" ON schedule_event_attendees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM schedule_events 
            WHERE schedule_events.id = schedule_event_attendees.event_id 
            AND schedule_events.trainer_id = auth.uid()::integer
        )
    );

CREATE POLICY "Trainers can manage their event notes" ON schedule_event_notes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM schedule_events 
            WHERE schedule_events.id = schedule_event_notes.event_id 
            AND schedule_events.trainer_id = auth.uid()::integer
        )
    );

CREATE POLICY "Trainers can manage their availability" ON trainer_availability
    FOR ALL USING (auth.uid()::integer = trainer_id);

CREATE POLICY "Trainers can manage their time off" ON trainer_time_off
    FOR ALL USING (auth.uid()::integer = trainer_id);

-- Function to get events for a date range
CREATE OR REPLACE FUNCTION get_trainer_events(
    p_trainer_id INTEGER,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    id INTEGER,
    title VARCHAR(255),
    description TEXT,
    event_type VARCHAR(50),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    location VARCHAR(255),
    is_virtual BOOLEAN,
    meeting_url VARCHAR(500),
    client_id INTEGER,
    client_name VARCHAR(255),
    status VARCHAR(50),
    priority VARCHAR(20),
    color VARCHAR(7),
    reminder_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        se.id,
        se.title,
        se.description,
        se.event_type,
        se.start_time,
        se.end_time,
        se.duration_minutes,
        se.location,
        se.is_virtual,
        se.meeting_url,
        se.client_id,
        se.client_name,
        se.status,
        se.priority,
        se.color,
        se.reminder_minutes,
        se.created_at
    FROM schedule_events se
    WHERE se.trainer_id = p_trainer_id
    AND DATE(se.start_time) >= p_start_date
    AND DATE(se.start_time) <= p_end_date
    ORDER BY se.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create recurring events
CREATE OR REPLACE FUNCTION create_recurring_events()
RETURNS TRIGGER AS $$
DECLARE
    current_date DATE;
    end_date DATE;
    event_date DATE;
    event_start TIMESTAMP WITH TIME ZONE;
    event_end TIMESTAMP WITH TIME ZONE;
    occurrence_count INTEGER := 0;
BEGIN
    -- Only process if this is a new recurring event
    IF TG_OP = 'INSERT' AND NEW.is_recurring = true THEN
        current_date := DATE(NEW.start_time);
        end_date := COALESCE(NEW.recurring_end_date, current_date + INTERVAL '1 year');
        
        -- Create events based on recurrence pattern
        WHILE current_date <= end_date AND occurrence_count < COALESCE(NEW.max_occurrences, 1000) LOOP
            event_start := current_date + (NEW.start_time::time);
            event_end := current_date + (NEW.end_time::time);
            
            -- Insert the recurring event
            INSERT INTO schedule_events (
                title, description, event_type, start_time, end_time, duration_minutes,
                location, is_virtual, meeting_url, meeting_platform, trainer_id, trainer_email,
                client_id, client_name, status, priority, is_recurring, recurring_pattern,
                recurring_end_date, parent_event_id, color, reminder_minutes, send_reminder,
                created_by, updated_by
            ) VALUES (
                NEW.title, NEW.description, NEW.event_type, event_start, event_end, NEW.duration_minutes,
                NEW.location, NEW.is_virtual, NEW.meeting_url, NEW.meeting_platform, NEW.trainer_id, NEW.trainer_email,
                NEW.client_id, NEW.client_name, NEW.status, NEW.priority, true, NEW.recurring_pattern,
                NEW.recurring_end_date, NEW.id, NEW.color, NEW.reminder_minutes, NEW.send_reminder,
                NEW.created_by, NEW.updated_by
            );
            
            -- Move to next occurrence based on pattern
            CASE NEW.recurring_pattern
                WHEN 'daily' THEN
                    current_date := current_date + INTERVAL '1 day';
                WHEN 'weekly' THEN
                    current_date := current_date + INTERVAL '1 week';
                WHEN 'monthly' THEN
                    current_date := current_date + INTERVAL '1 month';
                WHEN 'yearly' THEN
                    current_date := current_date + INTERVAL '1 year';
                ELSE
                    current_date := current_date + INTERVAL '1 day';
            END CASE;
            
            occurrence_count := occurrence_count + 1;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for creating recurring events
CREATE TRIGGER trigger_create_recurring_events
    AFTER INSERT ON schedule_events
    FOR EACH ROW
    EXECUTE FUNCTION create_recurring_events(); 