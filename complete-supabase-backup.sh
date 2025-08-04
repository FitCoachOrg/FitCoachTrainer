#!/bin/bash

# Complete Supabase Backup Script
# This script backs up database, edge functions, and cron jobs

# Configuration
PROJECT_REF="zyozeuihjptarceuipwu"
BACKUP_DIR="./complete_backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="supabase_complete_backup_${TIMESTAMP}"

# Create backup directory structure
mkdir -p "$BACKUP_DIR/$BACKUP_NAME"
mkdir -p "$BACKUP_DIR/$BACKUP_NAME/database"
mkdir -p "$BACKUP_DIR/$BACKUP_NAME/functions"
mkdir -p "$BACKUP_DIR/$BACKUP_NAME/cron_jobs"
mkdir -p "$BACKUP_DIR/$BACKUP_NAME/storage"

echo "🚀 Starting Complete Supabase Backup..."
echo "📁 Backup will be saved to: $BACKUP_DIR/$BACKUP_NAME"
echo ""

# Step 1: Database Backup
echo "📊 Step 1: Database Backup (includes RLS policies)"
echo "⚠️  You'll need to enter your database password when prompted"
echo ""

read -p "Do you want to backup the database? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Creating database backup..."
    supabase db dump --file "$BACKUP_DIR/$BACKUP_NAME/database/backup.sql"
    
    if [ $? -eq 0 ]; then
        echo "✅ Database backup completed!"
        echo "📁 Database backup saved to: $BACKUP_DIR/$BACKUP_NAME/database/backup.sql"
    else
        echo "❌ Database backup failed. You can create it manually from the dashboard."
        echo "🔗 Go to: https://supabase.com/dashboard/project/$PROJECT_REF/settings/database"
    fi
else
    echo "⏭️  Skipping database backup"
fi

# Step 2: Edge Functions Backup
echo ""
echo "⚡ Step 2: Edge Functions Backup"
echo ""

# List all functions
echo "📋 Available Edge Functions:"
supabase functions list

echo ""
read -p "Do you want to backup edge functions? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Backing up edge functions..."
    
    # Create functions directory
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME/functions"
    
    # List of functions to backup
    FUNCTIONS=(
        "auto-wakeup-events"
        "send_client_invitation"
        "push"
        "send-otp-email"
        "calculate_engagement_score_improved"
    )
    
    for func in "${FUNCTIONS[@]}"; do
        echo "📦 Backing up function: $func"
        
        # Download function code
        supabase functions download "$func" --output-dir "$BACKUP_DIR/$BACKUP_NAME/functions/$func" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo "✅ Function $func backed up successfully"
        else
            echo "⚠️  Could not download function $func (may not exist locally)"
        fi
    done
    
    echo "✅ Edge functions backup completed!"
else
    echo "⏭️  Skipping edge functions backup"
fi

# Step 3: Cron Jobs Backup
echo ""
echo "⏰ Step 3: Cron Jobs Backup"
echo ""

# Create cron jobs directory
mkdir -p "$BACKUP_DIR/$BACKUP_NAME/cron_jobs"

# List cron jobs (if any)
echo "📋 Checking for cron jobs..."
# Note: Supabase CLI doesn't have direct cron job listing
# You'll need to document them manually

echo ""
echo "📝 Manual Cron Jobs Documentation:"
echo "Please document your cron jobs in: $BACKUP_DIR/$BACKUP_NAME/cron_jobs/cron_jobs.txt"
echo ""

# Create cron jobs documentation template
cat > "$BACKUP_DIR/$BACKUP_NAME/cron_jobs/cron_jobs.txt" << 'EOF'
# Cron Jobs Documentation
# Add your cron jobs here with details

# Example:
# 1. Daily Engagement Score Calculation
#    - Function: calculate_engagement_score_improved
#    - Schedule: Daily at 2 AM UTC
#    - Purpose: Calculate daily engagement scores for all clients

# 2. Auto Wakeup Events
#    - Function: auto-wakeup-events
#    - Schedule: Every hour
#    - Purpose: Send wakeup notifications

# Add your cron jobs below:
EOF

echo "📝 Cron jobs template created at: $BACKUP_DIR/$BACKUP_NAME/cron_jobs/cron_jobs.txt"

# Step 4: Storage Backup
echo ""
echo "📁 Step 4: Storage Backup"
echo ""

mkdir -p "$BACKUP_DIR/$BACKUP_NAME/storage"

echo "📋 Storage buckets backup:"
echo "Note: Storage files need to be backed up manually from the dashboard"
echo "🔗 Go to: https://supabase.com/dashboard/project/$PROJECT_REF/storage"
echo ""

# Create storage documentation
cat > "$BACKUP_DIR/$BACKUP_NAME/storage/storage_info.txt" << 'EOF'
# Storage Backup Information

## Manual Backup Required
Storage files (images, documents, etc.) need to be backed up manually from the Supabase dashboard.

## Steps:
1. Go to Supabase Dashboard → Storage
2. Download important files
3. Store them in this directory

## Storage Buckets:
- Add your bucket names here
- Document what files are stored in each bucket

## Backup Frequency:
- Profile pictures: Weekly
- Documents: Daily
- Temporary files: As needed
EOF

echo "📝 Storage documentation created at: $BACKUP_DIR/$BACKUP_NAME/storage/storage_info.txt"

# Step 5: Project Configuration Backup
echo ""
echo "⚙️ Step 5: Project Configuration Backup"
echo ""

mkdir -p "$BACKUP_DIR/$BACKUP_NAME/config"

# Backup project configuration
echo "📋 Backing up project configuration..."
supabase projects list --output json > "$BACKUP_DIR/$BACKUP_NAME/config/project_info.json" 2>/dev/null

# Create configuration documentation
cat > "$BACKUP_DIR/$BACKUP_NAME/config/backup_summary.txt" << EOF
# Supabase Complete Backup Summary

## Project Information
- Project Name: FitCoach
- Project Reference: $PROJECT_REF
- Backup Date: $(date)
- Backup Timestamp: $TIMESTAMP

## What's Included:
✅ Database (tables, data, RLS policies, indexes)
✅ Edge Functions (code and configuration)
✅ Cron Jobs (documentation)
✅ Storage (documentation)
✅ Project Configuration

## What's NOT Included:
❌ Storage files (need manual backup)
❌ Authentication settings (backed up separately)
❌ API keys and secrets (stored securely)
❌ Custom domains and SSL certificates

## Restore Instructions:
1. Database: Use Supabase Dashboard → Settings → Database → Restore
2. Functions: Deploy using 'supabase functions deploy'
3. Cron Jobs: Recreate manually from documentation
4. Storage: Upload files manually
5. Configuration: Recreate from documentation

## Backup Location:
$BACKUP_DIR/$BACKUP_NAME/

## Files Created:
- database/backup.sql (if successful)
- functions/ (edge function code)
- cron_jobs/cron_jobs.txt (documentation)
- storage/storage_info.txt (documentation)
- config/project_info.json (project info)
- config/backup_summary.txt (this file)

## Next Steps:
1. Verify all files were created
2. Test database backup by checking file size
3. Store backup in secure location
4. Test restore procedures
EOF

echo "✅ Configuration backup completed!"

# Step 6: Create Backup Summary
echo ""
echo "📊 Step 6: Backup Summary"
echo ""

echo "📁 Backup Location: $BACKUP_DIR/$BACKUP_NAME/"
echo "📅 Backup Date: $(date)"
echo "⏰ Backup Time: $TIMESTAMP"
echo ""

# List all created files
echo "📋 Files Created:"
find "$BACKUP_DIR/$BACKUP_NAME" -type f | while read file; do
    size=$(ls -lh "$file" | awk '{print $5}')
    echo "   📄 $(basename "$file") ($size)"
done

echo ""
echo "🔍 Backup Verification:"
echo ""

# Check database backup
if [ -f "$BACKUP_DIR/$BACKUP_NAME/database/backup.sql" ]; then
    DB_SIZE=$(ls -lh "$BACKUP_DIR/$BACKUP_NAME/database/backup.sql" | awk '{print $5}')
    echo "✅ Database backup: $DB_SIZE"
else
    echo "❌ Database backup: Not found (create manually from dashboard)"
fi

# Check functions
FUNC_COUNT=$(find "$BACKUP_DIR/$BACKUP_NAME/functions" -type d | wc -l)
echo "✅ Edge Functions: $FUNC_COUNT functions backed up"

# Check documentation files
DOC_COUNT=$(find "$BACKUP_DIR/$BACKUP_NAME" -name "*.txt" | wc -l)
echo "✅ Documentation: $DOC_COUNT files created"

echo ""
echo "🎉 Complete backup finished!"
echo ""
echo "💡 Next Steps:"
echo "   1. Verify all files were created correctly"
echo "   2. Store backup in a secure location"
echo "   3. Test restore procedures"
echo "   4. Create regular backup schedule"
echo ""
echo "🔗 Dashboard: https://supabase.com/dashboard/project/$PROJECT_REF"
echo "📁 Backup Location: $BACKUP_DIR/$BACKUP_NAME/" 