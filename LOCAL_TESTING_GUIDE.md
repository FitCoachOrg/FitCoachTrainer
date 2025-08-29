# Local Testing Guide for Email Template System

## 🚀 **Quick Start for Local Testing**

### **1. Fix Environment File**
First, fix the malformed environment variable in your `.env` file:

```bash
# Edit .env file and change this line:
VITE_OPENROUTER_API_KEY-sk-or-v1-c783d7efbec1ef32d1bf1f1e7C425aadC2cfacfbf43a8543b51bf1cc164e5bf9

# To this:
VITE_OPENROUTER_API_KEY=sk-or-v1-c783d7efbec1ef32d1bf1f1e7C425aadC2cfacfbf43a8543b51bf1cc164e5bf9
```

### **2. Start Local Development**
```bash
# Start the frontend development server
npm run dev

# In another terminal, start Supabase locally
supabase start
```

### **3. Set Up Local Database**
```bash
# Apply the email template schema to local database
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f trainer-email-templates-schema.sql
```

### **4. Deploy Function Locally**
```bash
# Deploy the function to local Supabase
supabase functions deploy send_client_invitation --local
```

## 🧪 **Testing Steps**

### **Step 1: Test the Branding Page**
1. Navigate to `http://localhost:5173` (or your dev server URL)
2. Log in as a trainer
3. Go to **Dashboard → Branding**
4. You should see **4 tabs**: Branding, Email Templates, Terms of Service, Preview
5. Click on **"Email Templates"** tab

### **Step 2: Test Email Template Features**
1. **Subject Line**: Edit the email subject template
2. **Logo Upload**: Try uploading a logo (will use local storage)
3. **Colors**: Change primary, secondary, and accent colors
4. **HTML Template**: Edit the HTML template with variables
5. **Text Template**: Edit the plain text version
6. **Save**: Click "Save Template" button

### **Step 3: Test Email Sending**
1. Go to **Clients** page
2. Try inviting a client
3. Check if the email uses your custom template
4. Verify the BestFitApp download links work

## 🔧 **Local Development Setup**

### **Database Tables**
The system will work even without the database tables (it creates default templates), but for full functionality:

```sql
-- Run this in your local Supabase SQL editor
-- (Access via http://localhost:54323)

-- Create the email template tables
CREATE TABLE trainer_email_templates (
  id SERIAL PRIMARY KEY,
  trainer_id UUID NOT NULL REFERENCES trainer(id) ON DELETE CASCADE,
  template_name VARCHAR(100) NOT NULL DEFAULT 'default',
  subject_template VARCHAR(255) NOT NULL DEFAULT '{trainer_name} has invited you to download BestFitApp',
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
  UNIQUE(trainer_id, template_name)
);

-- Create branding table
CREATE TABLE trainer_branding (
  id SERIAL PRIMARY KEY,
  trainer_id UUID NOT NULL REFERENCES trainer(id) ON DELETE CASCADE,
  business_name VARCHAR(255),
  website_url VARCHAR(255),
  contact_email VARCHAR(255),
  phone_number VARCHAR(50),
  address TEXT,
  social_media JSONB,
  custom_css TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(trainer_id)
);

-- Add RLS policies
ALTER TABLE trainer_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_branding ENABLE ROW LEVEL SECURITY;

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
```

### **Storage Bucket**
Create a storage bucket for logos:

1. Go to **Storage** in local Supabase dashboard (`http://localhost:54323`)
2. Create new bucket: `trainer-assets`
3. Make it public
4. Set file size limit: 10MB
5. Allowed MIME types: `image/*`

### **Environment Variables for Local Testing**
```bash
# Add these to your .env file for local testing
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
```

## 🐛 **Debugging**

### **Check Console Logs**
Open browser console (F12) and look for:
- `"Branding page rendering with:"` - Shows page state
- `"Loading template and branding for trainer:"` - Shows trainer ID
- `"Found existing template:"` or `"Creating default template"` - Shows template loading

### **Common Issues**

1. **Page stuck loading**:
   - Check if trainer table exists
   - Verify authentication is working
   - Check console for errors

2. **Email Templates tab not visible**:
   - Hard refresh the page (Ctrl+F5)
   - Check if the component loaded properly
   - Verify no JavaScript errors

3. **Save not working**:
   - Check if database tables exist
   - Verify RLS policies are set up
   - Check console for save errors

4. **Logo upload not working**:
   - Verify storage bucket exists
   - Check bucket permissions
   - Verify file size limits

### **Test Without Database**
The system is designed to work even without the database tables. It will:
- Create default templates in memory
- Show the Email Templates tab
- Allow you to edit templates
- Show preview functionality

## 🎯 **What to Test**

### **✅ Core Functionality**
- [ ] Email Templates tab appears
- [ ] Can edit subject line
- [ ] Can upload logo
- [ ] Can change colors
- [ ] Can edit HTML template
- [ ] Can edit text template
- [ ] Save button works
- [ ] Preview shows correctly

### **✅ Email Sending**
- [ ] Send test invitation
- [ ] Email uses custom template
- [ ] BestFitApp links work
- [ ] Logo appears in email
- [ ] Colors are applied correctly

### **✅ Database Integration**
- [ ] Templates save to database
- [ ] Templates load from database
- [ ] Branding information saves
- [ ] Logo URLs are stored

## 🚀 **Quick Commands**

```bash
# Start everything
npm run dev & supabase start

# Apply schema
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f trainer-email-templates-schema.sql

# Deploy function
supabase functions deploy send_client_invitation --local

# Check logs
supabase functions logs send_client_invitation --local
```

## 📝 **Testing Checklist**

- [ ] Fix .env file
- [ ] Start local development
- [ ] Apply database schema
- [ ] Create storage bucket
- [ ] Deploy function locally
- [ ] Test Branding page
- [ ] Test Email Templates tab
- [ ] Test template editing
- [ ] Test logo upload
- [ ] Test email sending
- [ ] Verify BestFitApp links

This setup allows you to test the complete email template system locally without affecting production! 🎉 