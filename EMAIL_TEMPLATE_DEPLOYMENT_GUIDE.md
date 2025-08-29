# Email Template System Deployment Guide

## Overview
This guide covers the deployment of the new trainer-specific email template system that allows each trainer to customize their client invitation emails with logos, branding, and personalized messaging.

## Database Schema Changes

### 1. Run the Database Migration
Execute the SQL migration script to create the new tables:

```bash
# Connect to your Supabase database and run:
psql -h your-supabase-host -U postgres -d postgres -f trainer-email-templates-schema.sql
```

Or run it through the Supabase dashboard SQL editor.

### 2. Verify Tables Created
The following tables should be created:
- `trainer_email_templates` - Stores email templates per trainer
- `trainer_branding` - Stores trainer branding information
- `trainer_template_variables` - Stores dynamic template variables

### 3. Create Storage Bucket
Create a storage bucket for trainer logos:

```sql
-- In Supabase dashboard, go to Storage and create:
-- Bucket name: trainer-assets
-- Public bucket: true
-- File size limit: 10MB
-- Allowed MIME types: image/*
```

## Supabase Function Updates

### 1. Deploy Updated Function
The `send_client_invitation` function has been updated to use database-driven templates:

```bash
supabase functions deploy send_client_invitation
```

### 2. Verify Environment Variables
Ensure these environment variables are set in Supabase:

```bash
supabase secrets set MAILGUN_API_KEY="your-mailgun-api-key"
supabase secrets set MAILGUN_DOMAIN="mg.repute.cloud"
supabase secrets set MAILGUN_FROM_EMAIL="postmaster@mg.repute.cloud"
supabase secrets set FRONTEND_URL="https://repute.cloud"
```

## Frontend Integration

### 1. Add Email Template Manager Component
The `EmailTemplateManager` component provides a UI for trainers to:
- Customize email templates
- Upload logos
- Set branding colors
- Preview emails

### 2. Add to Navigation
Add the email template manager to your navigation:

```tsx
// In your navigation component
<Link href="/email-templates">Email Templates</Link>
```

### 3. Create Route
Add the route in your App.tsx:

```tsx
<Route path="/email-templates" element={<EmailTemplateManager />} />
```

## Features

### ✅ Trainer-Specific Templates
- Each trainer can have their own email template
- Templates are stored in the database
- Fallback to default template if no custom template exists

### ✅ Logo Upload
- Trainers can upload their business logo
- Logos are stored in Supabase Storage
- Automatic URL generation for email templates

### ✅ Branding Customization
- Primary, secondary, and accent colors
- Custom font families
- Business information (name, website, contact details)

### ✅ Template Variables
- Dynamic content replacement
- Variables: `{client_name}`, `{trainer_name}`, `{business_name}`, `{signup_url}`, `{custom_message}`, `{logo_url}`, `{primary_color}`

### ✅ Preview System
- Real-time email preview
- Shows how the email will look to clients
- Live variable replacement

## Testing

### 1. Test Template Creation
1. Log in as a trainer
2. Navigate to Email Templates
3. Customize the template
4. Save and verify it's stored in the database

### 2. Test Email Sending
1. Send a client invitation
2. Check the email received
3. Verify custom branding is applied
4. Confirm logo appears correctly

### 3. Test Fallback
1. Delete a trainer's custom template
2. Send an invitation
3. Verify default template is used

## Security

### Row Level Security (RLS)
All tables have RLS policies ensuring trainers can only:
- View their own templates
- Edit their own templates
- Upload to their own storage folder

### Storage Security
- Logos are stored in trainer-specific folders
- Public URLs are generated for email use
- File size and type restrictions apply

## Troubleshooting

### Common Issues

1. **Template not loading**
   - Check if trainer has a record in `trainer_email_templates`
   - Verify RLS policies are working

2. **Logo not appearing**
   - Check storage bucket permissions
   - Verify logo URL is accessible
   - Check file size limits

3. **Email not sending**
   - Verify Mailgun configuration
   - Check function logs in Supabase dashboard
   - Ensure all environment variables are set

### Debug Commands

```bash
# Check if tables exist
supabase db diff

# View function logs
supabase functions logs send_client_invitation

# Test function locally
supabase functions serve send_client_invitation
```

## Migration from Hardcoded Templates

The system automatically:
1. Creates default templates for existing trainers
2. Falls back to default template if no custom template exists
3. Maintains backward compatibility

## Performance Considerations

- Templates are cached in the function
- Logo URLs are pre-generated
- Database queries are optimized with indexes
- Storage bucket is configured for public access

## Next Steps

1. **Deploy the database schema**
2. **Update the Supabase function**
3. **Add the EmailTemplateManager component to your app**
4. **Test with a few trainers**
5. **Monitor function logs for any issues**

## Support

If you encounter issues:
1. Check the Supabase function logs
2. Verify database permissions
3. Test with the default template first
4. Ensure all environment variables are set correctly 