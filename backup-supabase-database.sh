#!/bin/bash

# Supabase Database Backup Script
# This script creates a backup of your Supabase database

# Configuration
PROJECT_REF="zyozeuihjptarceuipwu"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="supabase_backup_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🚀 Starting Supabase Database Backup..."
echo "📁 Backup will be saved to: $BACKUP_DIR/$BACKUP_FILE"
echo ""

# Method 1: Try using Supabase CLI (requires password)
echo "📋 Method 1: Using Supabase CLI"
echo "⚠️  You'll need to enter your database password when prompted"
echo ""

read -p "Do you want to proceed with CLI backup? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Creating backup using Supabase CLI..."
    supabase db dump --file "$BACKUP_DIR/$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✅ Backup completed successfully!"
        echo "📁 Backup saved to: $BACKUP_DIR/$BACKUP_FILE"
    else
        echo "❌ CLI backup failed. Trying alternative method..."
    fi
else
    echo "⏭️  Skipping CLI backup"
fi

echo ""
echo "📋 Method 2: Manual Dashboard Backup"
echo ""
echo "🔗 Go to: https://supabase.com/dashboard/project/$PROJECT_REF/settings/database"
echo "📋 Steps:"
echo "   1. Click 'Settings' in the sidebar"
echo "   2. Click 'Database' in the settings menu"
echo "   3. Scroll down to 'Backups' section"
echo "   4. Click 'Create backup'"
echo "   5. Choose 'Full backup'"
echo "   6. Wait for completion (2-5 minutes)"
echo "   7. Click 'Download' button"
echo "   8. Save the .sql file to: $BACKUP_DIR/"
echo ""

echo "📋 Method 3: Using pg_dump directly (Advanced)"
echo ""
echo "🔧 If you have the database connection string, you can use:"
echo "   pg_dump 'postgresql://postgres:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:5432/postgres' > $BACKUP_DIR/$BACKUP_FILE"
echo ""

echo "📋 Backup Summary:"
echo "   - Project: FitCoach ($PROJECT_REF)"
echo "   - Timestamp: $TIMESTAMP"
echo "   - Backup Directory: $BACKUP_DIR"
echo ""

# List existing backups
if [ -d "$BACKUP_DIR" ] && [ "$(ls -A $BACKUP_DIR)" ]; then
    echo "📁 Existing backups in $BACKUP_DIR:"
    ls -la "$BACKUP_DIR"/*.sql 2>/dev/null || echo "   No .sql backup files found"
fi

echo ""
echo "✅ Backup instructions completed!"
echo "💡 Tip: Store backups in a secure location and test restore procedures regularly" 