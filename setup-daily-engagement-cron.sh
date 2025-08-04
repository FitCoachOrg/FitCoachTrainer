#!/bin/bash

# Setup script for Daily Engagement Score Calculation
# This script helps configure the daily engagement score calculation as a cron job

echo "🚀 Setting up Daily Engagement Score Calculation..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if the script exists
SCRIPT_PATH="$(pwd)/daily-engagement-score-calculator.mjs"
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ daily-engagement-score-calculator.mjs not found in current directory"
    exit 1
fi

# Make the script executable
chmod +x "$SCRIPT_PATH"
echo "✅ Made script executable"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Please create one with the following variables:"
    echo "   SUPABASE_URL=your_supabase_url"
    echo "   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    echo ""
    echo "You can get these from your Supabase project settings."
    exit 1
fi

# Test the script
echo "🧪 Testing the script..."
node "$SCRIPT_PATH" --help

if [ $? -eq 0 ]; then
    echo "✅ Script test successful"
else
    echo "❌ Script test failed. Please check your .env file and dependencies."
    exit 1
fi

# Create cron job entry
CRON_JOB="0 1 * * * cd $(pwd) && node $SCRIPT_PATH >> $(pwd)/engagement-scores.log 2>&1"

echo ""
echo "📋 Cron Job Configuration"
echo "========================="
echo "To set up daily engagement score calculation, add this line to your crontab:"
echo ""
echo "$CRON_JOB"
echo ""
echo "This will run the script daily at 1:00 AM and log output to engagement-scores.log"
echo ""

# Ask user if they want to install the cron job
read -p "Do you want to install this cron job now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Add to crontab
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✅ Cron job installed successfully!"
    echo "📝 You can view the cron jobs with: crontab -l"
    echo "📝 You can edit the cron jobs with: crontab -e"
    echo "📝 Logs will be written to: $(pwd)/engagement-scores.log"
else
    echo "📝 You can manually add the cron job later using: crontab -e"
fi

echo ""
echo "📖 Manual Usage:"
echo "================"
echo "Run for yesterday: node $SCRIPT_PATH"
echo "Run for date range: node $SCRIPT_PATH --date-range 2024-01-01,2024-01-31"
echo ""
echo "📊 Monitoring:"
echo "=============="
echo "Check logs: tail -f $(pwd)/engagement-scores.log"
echo "Check cron jobs: crontab -l"
echo ""

echo "�� Setup complete!" 