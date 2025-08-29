# Supabase Database Backup Guide

## Overview
This guide provides detailed instructions for backing up your Supabase database using multiple methods.

## Project Information
- **Project Name**: FitCoach
- **Project Reference**: `zyozeuihjptarceuipwu`
- **Region**: us-east-2

## Method 1: Supabase Dashboard (Recommended)

### Step 1: Access Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your **FitCoach** project

### Step 2: Create Backup
1. In the left sidebar, click **Settings** (gear icon)
2. Click **Database** in the settings menu
3. Scroll down to the **Backups** section
4. Click **Create backup**
5. Choose backup type:
   - **Full backup**: Complete database dump (recommended)
   - **Differential backup**: Only changes since last backup
6. Click **Create backup**
7. Wait for completion (usually 2-5 minutes)

### Step 3: Download Backup
1. Once complete, you'll see the backup in the list
2. Click the **Download** button (📥 icon)
3. Save the `.sql` file to your computer

## Method 2: Supabase CLI

### Prerequisites
- Supabase CLI installed and logged in
- Database password (from dashboard)

### Step 1: Get Database Password
1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **Database**
3. Scroll down to **Connection string**
4. Copy the **Database password** from the connection string

### Step 2: Create Backup
```bash
# Navigate to your project directory
cd /path/to/your/project

# Create backup using CLI
supabase db dump --file backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 3: Enter Password
When prompted, enter your database password.

## Method 3: Direct pg_dump (Advanced)

### Step 1: Get Connection String
1. Go to Supabase Dashboard → Settings → Database
2. Copy the **Connection string**
3. Replace `[YOUR-PASSWORD]` with your actual password

### Step 2: Run pg_dump
```bash
pg_dump 'postgresql://postgres:[YOUR-PASSWORD]@aws-0-us-east-2.pooler.supabase.com:5432/postgres' > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Method 4: Automated Backup Script

### Step 1: Run Backup Script
```bash
# Make script executable
chmod +x backup-supabase-database.sh

# Run backup script
./backup-supabase-database.sh
```

### Step 2: Follow Prompts
The script will guide you through the backup process.

## Backup Storage Recommendations

### Local Storage
- Store backups in a dedicated folder
- Use descriptive filenames with timestamps
- Keep multiple versions

### Cloud Storage
- **Google Drive**: Upload backup files
- **Dropbox**: Sync backup folder
- **AWS S3**: Automated backup storage
- **GitHub**: Version control for schema changes

### Backup Schedule
- **Daily**: For active development
- **Weekly**: For production environments
- **Before major changes**: Always backup before schema changes

## Restore Instructions

### Using Supabase Dashboard
1. Go to **Settings** → **Database**
2. Click **Restore** in the Backups section
3. Upload your backup file
4. Confirm restore

### Using psql (Command Line)
```bash
psql 'postgresql://postgres:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:5432/postgres' < backup_file.sql
```

## Backup Verification

### Check Backup File
```bash
# Check file size (should be > 0)
ls -la backup_*.sql

# Check file content (should contain SQL)
head -20 backup_*.sql
```

### Test Restore (Optional)
1. Create a test database
2. Restore backup to test database
3. Verify data integrity
4. Delete test database

## Security Considerations

### Password Management
- Store database passwords securely
- Use environment variables
- Never commit passwords to version control

### Backup Encryption
- Encrypt backup files before storage
- Use strong encryption algorithms
- Secure encryption keys

### Access Control
- Limit access to backup files
- Use secure file transfer methods
- Regular access audits

## Troubleshooting

### Common Issues

#### CLI Connection Failed
```
pg_dump: error: connection to server failed
```
**Solution**: Check your database password and network connection

#### Permission Denied
```
error: permission denied
```
**Solution**: Ensure you have proper access to the project

#### Backup File Empty
**Solution**: Verify the backup process completed successfully

### Getting Help
- Supabase Documentation: [https://supabase.com/docs](https://supabase.com/docs)
- Supabase Support: [https://supabase.com/support](https://supabase.com/support)
- Community Discord: [https://discord.supabase.com](https://discord.supabase.com)

## Backup Checklist

- [ ] Database password available
- [ ] Sufficient storage space
- [ ] Network connection stable
- [ ] Backup file downloaded
- [ ] Backup file verified
- [ ] Backup stored securely
- [ ] Restore procedure tested (optional)

## Quick Commands

### Create Backup
```bash
# Dashboard method (recommended)
# Follow Method 1 steps above

# CLI method
supabase db dump --file backup_$(date +%Y%m%d_%H%M%S).sql

# Script method
./backup-supabase-database.sh
```

### List Backups
```bash
ls -la backups/
```

### Verify Backup
```bash
# Check file size
ls -lh backup_*.sql

# Check content
head -10 backup_*.sql
```

## Notes
- Always backup before making schema changes
- Test restore procedures regularly
- Keep multiple backup versions
- Store backups in multiple locations
- Document any custom procedures

---

**Last Updated**: August 4, 2025
**Project**: FitCoach (zyozeuihjptarceuipwu) 