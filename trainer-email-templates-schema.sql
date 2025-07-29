-- Trainer Email Templates Schema
-- This allows each trainer to customize their email templates, upload logos, and manage branding

-- Email templates table
CREATE TABLE trainer_email_templates (
  id SERIAL PRIMARY KEY,
  trainer_id UUID NOT NULL REFERENCES trainer(id) ON DELETE CASCADE,
  template_name VARCHAR(100) NOT NULL DEFAULT 'default',
  subject_template VARCHAR(255) NOT NULL DEFAULT '{trainer_name} has invited you to FitCoachTrainer',
  html_template TEXT NOT NULL,
  text_template TEXT NOT NULL,
  logo_url VARCHAR(500),
  logo_alt_text VARCHAR(100) DEFAULT 'Trainer Logo',
  primary_color VARCHAR(7) DEFAULT '#4a6cf7',
  secondary_color VARCHAR(7) DEFAULT '#ffffff',
  accent_color VARCHAR(7) DEFAULT '#f3f4f6',
  font_family VARCHAR(50) DEFAULT 'Arial, sans-serif',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure one template per trainer
  UNIQUE(trainer_id, template_name)
);

-- Trainer branding settings
CREATE TABLE trainer_branding (
  id SERIAL PRIMARY KEY,
  trainer_id UUID NOT NULL REFERENCES trainer(id) ON DELETE CASCADE,
  business_name VARCHAR(255),
  website_url VARCHAR(255),
  contact_email VARCHAR(255),
  phone_number VARCHAR(50),
  address TEXT,
  social_media JSONB, -- Store social media links
  custom_css TEXT, -- For advanced styling
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(trainer_id)
);

-- Email template variables (for dynamic content)
CREATE TABLE trainer_template_variables (
  id SERIAL PRIMARY KEY,
  trainer_id UUID NOT NULL REFERENCES trainer(id) ON DELETE CASCADE,
  variable_name VARCHAR(50) NOT NULL,
  variable_value TEXT,
  variable_type VARCHAR(20) DEFAULT 'text', -- text, image, link, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(trainer_id, variable_name)
);

-- Insert default template for existing trainers
INSERT INTO trainer_email_templates (trainer_id, template_name, subject_template, html_template, text_template)
SELECT 
  id as trainer_id,
  'default' as template_name,
  '{trainer_name} has invited you to FitCoachTrainer' as subject_template,
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
    <h2 style="color: #4a6cf7;">You''ve been invited to FitCoachTrainer!</h2>
    <p>Hello {client_name},</p>
    <p>{trainer_name} has invited you to join FitCoachTrainer, a platform for fitness coaching and tracking your progress.</p>
    {custom_message}
    <p>To get started:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{signup_url}" style="background-color: #4a6cf7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Create Your Account</a>
    </div>
    <p>This link will connect you directly with your trainer and set up your personalized fitness dashboard.</p>
    <p>If you have any questions, you can reply directly to this email.</p>
    <p>Looking forward to helping you achieve your fitness goals!</p>
    <p>The FitCoachTrainer Team</p>
  </div>' as html_template,
  'You''ve been invited to FitCoachTrainer!

Hello {client_name},

{trainer_name} has invited you to join FitCoachTrainer, a platform for fitness coaching and tracking your progress.
{custom_message}

To get started, create your account by visiting:
{signup_url}

This link will connect you directly with your trainer and set up your personalized fitness dashboard.

If you have any questions, you can reply directly to this email.

Looking forward to helping you achieve your fitness goals!

The FitCoachTrainer Team' as text_template
FROM trainer;

-- Create indexes for performance
CREATE INDEX idx_trainer_email_templates_trainer_id ON trainer_email_templates(trainer_id);
CREATE INDEX idx_trainer_branding_trainer_id ON trainer_branding(trainer_id);
CREATE INDEX idx_trainer_template_variables_trainer_id ON trainer_template_variables(trainer_id);

-- Add RLS policies
ALTER TABLE trainer_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_template_variables ENABLE ROW LEVEL SECURITY;

-- RLS policies for trainer_email_templates
CREATE POLICY "Trainers can view their own email templates" ON trainer_email_templates
  FOR SELECT USING (trainer_id::text = auth.jwt() ->> 'sub');

CREATE POLICY "Trainers can insert their own email templates" ON trainer_email_templates
  FOR INSERT WITH CHECK (trainer_id::text = auth.jwt() ->> 'sub');

CREATE POLICY "Trainers can update their own email templates" ON trainer_email_templates
  FOR UPDATE USING (trainer_id::text = auth.jwt() ->> 'sub');

CREATE POLICY "Trainers can delete their own email templates" ON trainer_email_templates
  FOR DELETE USING (trainer_id::text = auth.jwt() ->> 'sub');

-- RLS policies for trainer_branding
CREATE POLICY "Trainers can view their own branding" ON trainer_branding
  FOR SELECT USING (trainer_id::text = auth.jwt() ->> 'sub');

CREATE POLICY "Trainers can insert their own branding" ON trainer_branding
  FOR INSERT WITH CHECK (trainer_id::text = auth.jwt() ->> 'sub');

CREATE POLICY "Trainers can update their own branding" ON trainer_branding
  FOR UPDATE USING (trainer_id::text = auth.jwt() ->> 'sub');

CREATE POLICY "Trainers can delete their own branding" ON trainer_branding
  FOR DELETE USING (trainer_id::text = auth.jwt() ->> 'sub');

-- RLS policies for trainer_template_variables
CREATE POLICY "Trainers can view their own template variables" ON trainer_template_variables
  FOR SELECT USING (trainer_id::text = auth.jwt() ->> 'sub');

CREATE POLICY "Trainers can insert their own template variables" ON trainer_template_variables
  FOR INSERT WITH CHECK (trainer_id::text = auth.jwt() ->> 'sub');

CREATE POLICY "Trainers can update their own template variables" ON trainer_template_variables
  FOR UPDATE USING (trainer_id::text = auth.jwt() ->> 'sub');

CREATE POLICY "Trainers can delete their own template variables" ON trainer_template_variables
  FOR DELETE USING (trainer_id::text = auth.jwt() ->> 'sub'); 