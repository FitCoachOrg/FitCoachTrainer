-- Fitness Score Database Schema
-- This schema supports comprehensive fitness score calculation with goal-aware scoring

-- 1. Fitness Score Configuration Table
CREATE TABLE IF NOT EXISTS fitness_score_config (
    id SERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES client(client_id) ON DELETE CASCADE,
    
    -- Goal Category Selection
    goal_category VARCHAR(20) NOT NULL CHECK (goal_category IN ('fat_loss', 'muscle_gain', 'wellness', 'performance')),
    
    -- Selected Factors for Scoring (JSON array of factor keys)
    selected_factors JSONB NOT NULL DEFAULT '[]',
    
    -- Factor Weights (JSON object with factor:weight pairs)
    factor_weights JSONB NOT NULL DEFAULT '{}',
    
    -- Target Values (JSON object with factor:target pairs)
    target_values JSONB NOT NULL DEFAULT '{}',
    
    -- Configuration metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(client_id)
);

-- 2. Fitness Score History Table
CREATE TABLE IF NOT EXISTS fitness_score_history (
    id SERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES client(client_id) ON DELETE CASCADE,
    
    -- Score calculation period
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    
    -- Overall fitness score
    overall_score DECIMAL(5,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    
    -- Individual factor scores (JSON object)
    factor_scores JSONB NOT NULL DEFAULT '{}',
    
    -- Raw data used for calculation (JSON object)
    raw_data JSONB NOT NULL DEFAULT '{}',
    
    -- Goal category at time of calculation
    goal_category VARCHAR(20) NOT NULL,
    
    -- Metadata
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(client_id, week_start_date)
);

-- 3. Body Metrics Table
CREATE TABLE IF NOT EXISTS body_metrics (
    id SERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES client(client_id) ON DELETE CASCADE,
    
    -- Basic measurements
    weight_kg DECIMAL(5,2),
    height_cm INTEGER,
    bmi DECIMAL(4,2),
    body_fat_percent DECIMAL(4,2),
    waist_cm DECIMAL(5,2),
    hip_cm DECIMAL(5,2),
    waist_to_hip_ratio DECIMAL(3,2),
    lean_mass_percent DECIMAL(4,2),
    
    -- Measurement metadata
    measurement_date DATE NOT NULL,
    measurement_time TIME,
    measurement_method VARCHAR(50), -- 'scale', 'caliper', 'bioimpedance', etc.
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(client_id, measurement_date)
);

-- 4. Sleep & Recovery Table
CREATE TABLE IF NOT EXISTS sleep_recovery (
    id SERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES client(client_id) ON DELETE CASCADE,
    
    -- Sleep metrics
    sleep_hours DECIMAL(3,1),
    sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
    energy_on_wakeup INTEGER CHECK (energy_on_wakeup >= 1 AND energy_on_wakeup <= 10),
    hrv_ms INTEGER, -- Heart Rate Variability in milliseconds
    
    -- Sleep metadata
    sleep_date DATE NOT NULL,
    bed_time TIME,
    wake_time TIME,
    sleep_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(client_id, sleep_date)
);

-- 5. Hydration & Activity Table
CREATE TABLE IF NOT EXISTS hydration_activity (
    id SERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES client(client_id) ON DELETE CASCADE,
    
    -- Hydration
    water_intake_ml INTEGER,
    water_intake_glasses INTEGER,
    
    -- Activity metrics
    step_count INTEGER,
    exercise_adherence_percent DECIMAL(4,2),
    mobility_score INTEGER CHECK (mobility_score >= 1 AND mobility_score <= 10),
    balance_score INTEGER CHECK (balance_score >= 1 AND balance_score <= 10),
    
    -- Activity metadata
    activity_date DATE NOT NULL,
    activity_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(client_id, activity_date)
);

-- 6. Nutrition Tracking Table
CREATE TABLE IF NOT EXISTS nutrition_tracking (
    id SERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES client(client_id) ON DELETE CASCADE,
    
    -- Calorie tracking
    total_calories INTEGER,
    target_calories INTEGER,
    calorie_deficit_surplus INTEGER,
    
    -- Macronutrients
    protein_grams DECIMAL(6,2),
    carbs_grams DECIMAL(6,2),
    fats_grams DECIMAL(6,2),
    
    -- Protein targets
    target_protein_grams DECIMAL(6,2),
    protein_per_kg DECIMAL(4,2),
    
    -- Logging consistency
    meals_logged INTEGER DEFAULT 0,
    total_meals_planned INTEGER DEFAULT 3,
    
    -- Nutrition metadata
    nutrition_date DATE NOT NULL,
    nutrition_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(client_id, nutrition_date)
);

-- 7. Emotional & Lifestyle Table
CREATE TABLE IF NOT EXISTS emotional_lifestyle (
    id SERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES client(client_id) ON DELETE CASCADE,
    
    -- Emotional metrics
    mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
    stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
    
    -- Lifestyle factors
    alcohol_drinks INTEGER DEFAULT 0,
    screen_time_bedtime_minutes INTEGER,
    caffeine_cups INTEGER DEFAULT 0,
    caffeine_after_2pm BOOLEAN DEFAULT false,
    
    -- Lifestyle metadata
    lifestyle_date DATE NOT NULL,
    lifestyle_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(client_id, lifestyle_date)
);

-- 8. Fitness Score Factors Reference Table
CREATE TABLE IF NOT EXISTS fitness_score_factors (
    id SERIAL PRIMARY KEY,
    factor_key VARCHAR(50) UNIQUE NOT NULL,
    factor_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    
    -- Default weights by goal category
    fat_loss_weight INTEGER DEFAULT 0,
    muscle_gain_weight INTEGER DEFAULT 0,
    wellness_weight INTEGER DEFAULT 0,
    performance_weight INTEGER DEFAULT 0,
    
    -- Scoring parameters
    scoring_notes TEXT,
    data_source VARCHAR(50), -- 'body_metrics', 'sleep_recovery', etc.
    is_trackable BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default fitness score factors
INSERT INTO fitness_score_factors (factor_key, factor_name, category, description, fat_loss_weight, muscle_gain_weight, wellness_weight, performance_weight, scoring_notes, data_source) VALUES
-- Body Metrics
('bmi', 'BMI', 'Body Metrics', 'Body Mass Index calculation', 7, 3, 5, 2, 'Full score if BMI 18.5–24.9 (CDC). Penalize outside this range (linear drop).', 'body_metrics'),
('weight_trend', 'Weight Trend', 'Body Metrics', 'Weekly weight change trend', 8, 5, 3, 3, 'Compare last 7–14 day weight change to goal. Fat loss: -0.5% to -1%/week = 100 pts. Muscle gain: +0.25–0.5%/week = full score.', 'body_metrics'),
('waist_to_hip_ratio', 'Waist-to-Hip Ratio', 'Body Metrics', 'Waist to hip circumference ratio', 5, 3, 5, 2, 'Use WHO thresholds: Female: <0.80 ideal; Male: <0.90 ideal. Score drops in higher-risk ranges.', 'body_metrics'),
('body_fat_percent', 'Body Fat %', 'Body Metrics', 'Body fat percentage', 7, 8, 5, 5, 'Target range: Female 18–24%, Male 10–18%. Score 100 if in range, drop off linearly outside.', 'body_metrics'),
('lean_mass_percent', 'Lean Mass %', 'Body Metrics', 'Lean body mass percentage', 0, 8, 3, 6, 'Compare to previous baseline. Positive trend = higher score.', 'body_metrics'),

-- Sleep & Recovery
('sleep_hours', 'Sleep Hours', 'Sleep & Recovery', 'Hours of sleep per night', 5, 6, 8, 6, 'Target 7–9 hrs/night (CDC). Full score in range, 10 pts drop per hour outside.', 'sleep_recovery'),
('sleep_quality', 'Sleep Quality', 'Sleep & Recovery', 'Subjective sleep quality rating', 4, 5, 7, 5, 'Score of 8–10 (or device 80–100%) = full score. Below 5 = 0; linear scaling between.', 'sleep_recovery'),
('energy_on_wakeup', 'Energy on Wakeup', 'Sleep & Recovery', 'Morning energy level rating', 2, 2, 4, 4, '1–10 subjective scale. Score = value × 10.', 'sleep_recovery'),
('hrv', 'HRV', 'Sleep & Recovery', 'Heart Rate Variability', 0, 2, 4, 6, 'Higher HRV = better recovery. Compare to user baseline HRV.', 'sleep_recovery'),

-- Hydration & Activity
('water_intake', 'Water Intake', 'Hydration & Activity', 'Daily water consumption', 4, 4, 6, 3, 'Ideal: 35ml/kg/day. Score = (actual/target) × 100, capped at 100.', 'hydration_activity'),
('step_count', 'Step Count', 'Hydration & Activity', 'Average daily steps', 6, 2, 5, 3, 'Target = 7,000–10,000/day. Score = min(actual/target, 1) × 100.', 'external_device_connect'),
('exercise_adherence', 'Exercise Adherence', 'Hydration & Activity', 'Workout completion rate', 10, 10, 6, 10, 'Adherence % = (completed/planned). Full score ≥90%, 50% for 50%, 0 for <30%.', 'schedule'),
('mobility', 'Mobility', 'Hydration & Activity', 'Functional movement score', 2, 2, 4, 4, 'Coach-graded or self-rated 1–10. Score = rating × 10.', 'hydration_activity'),
('balance', 'Balance', 'Hydration & Activity', 'Balance and stability score', 0, 0, 4, 2, 'Similar to mobility. Scaled by rating or test result.', 'hydration_activity'),

-- Nutrition
('calorie_intake', 'Calorie Intake vs Goal', 'Nutrition', 'Calorie consumption vs target', 10, 7, 5, 6, 'Target range = ±10% of daily calorie goal. Full score if within range, scale down 10 pts per additional ±5%.', 'nutrition_tracking'),
('protein_intake', 'Protein Intake', 'Nutrition', 'Daily protein consumption', 8, 10, 5, 8, 'Goal: 1.2–2.2g/kg body weight. Score = (actual/target) × 100, max 100. <0.8g/kg = 0.', 'nutrition_tracking'),
('carbs_intake', 'Carbs Intake', 'Nutrition', 'Daily carbohydrate consumption', 2, 3, 4, 5, 'Target varies (based on macro plan). Score = within ±15% = 100 pts. Outside = linear drop.', 'nutrition_tracking'),
('fats_intake', 'Fats Intake', 'Nutrition', 'Daily fat consumption', 2, 3, 4, 3, 'Target 20–35% of total calories. Score = within range, else drop linearly.', 'nutrition_tracking'),
('logging_consistency', 'Logging Consistency', 'Nutrition', 'Nutrition tracking consistency', 4, 3, 5, 3, '% of days logged in past 7 days. 6–7 days = 100, 5 = 80, <3 = 0.', 'nutrition_tracking'),

-- Emotional & Lifestyle
('mood_stress', 'Mood/Stress', 'Emotional & Lifestyle', 'Mood and stress level', 2, 1, 4, 2, 'Self-rated 1–10 scale. Score = rating × 10.', 'emotional_lifestyle'),
('alcohol_intake', 'Alcohol Intake', 'Emotional & Lifestyle', 'Weekly alcohol consumption', 2, 1, 3, 1, 'Full score = 0–1 drinks/week. Penalty = -10 pts per extra drink.', 'emotional_lifestyle'),
('screen_time', 'Screen Time (Bedtime)', 'Emotional & Lifestyle', 'Screen time before bed', 2, 1, 3, 1, '<30 mins = 100 pts, 30–60 mins = 80 pts, >2 hrs = 0.', 'emotional_lifestyle'),
('caffeine_usage', 'Caffeine Usage', 'Emotional & Lifestyle', 'Daily caffeine consumption', 2, 1, 3, 1, 'Full score = ≤3 cups/day, none after 2pm. Penalty for higher intake or late-night caffeine.', 'emotional_lifestyle');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fitness_score_config_client_id ON fitness_score_config(client_id);
CREATE INDEX IF NOT EXISTS idx_fitness_score_history_client_id ON fitness_score_history(client_id);
CREATE INDEX IF NOT EXISTS idx_fitness_score_history_week_start ON fitness_score_history(week_start_date);
CREATE INDEX IF NOT EXISTS idx_body_metrics_client_date ON body_metrics(client_id, measurement_date);
CREATE INDEX IF NOT EXISTS idx_sleep_recovery_client_date ON sleep_recovery(client_id, sleep_date);
CREATE INDEX IF NOT EXISTS idx_hydration_activity_client_date ON hydration_activity(client_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_nutrition_tracking_client_date ON nutrition_tracking(client_id, nutrition_date);
CREATE INDEX IF NOT EXISTS idx_emotional_lifestyle_client_date ON emotional_lifestyle(client_id, lifestyle_date);

-- Add comments for documentation
COMMENT ON TABLE fitness_score_config IS 'Client-specific fitness score configuration including goal category and factor weights';
COMMENT ON TABLE fitness_score_history IS 'Weekly fitness score calculation history';
COMMENT ON TABLE body_metrics IS 'Body composition and measurement tracking';
COMMENT ON TABLE sleep_recovery IS 'Sleep quality and recovery metrics';
COMMENT ON TABLE hydration_activity IS 'Hydration and physical activity tracking';
COMMENT ON TABLE nutrition_tracking IS 'Nutrition and macronutrient tracking';
COMMENT ON TABLE emotional_lifestyle IS 'Emotional well-being and lifestyle factors';
COMMENT ON TABLE fitness_score_factors IS 'Reference table for all fitness score factors and their default weights'; 