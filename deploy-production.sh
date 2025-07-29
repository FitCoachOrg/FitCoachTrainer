#!/bin/bash

# Production Deployment Script for FitCoachTrainer
# This script builds and deploys the application to production

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_status "Checking current branch..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_warning "You're not on the main branch. Current branch: $CURRENT_BRANCH"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled."
        exit 1
    fi
fi

print_status "Pulling latest changes from git..."
git pull origin main

print_status "Installing dependencies..."
npm install

print_status "Building for production..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    print_error "Build failed - dist directory not found"
    exit 1
fi

print_status "Build completed successfully!"

# Check build size
BUILD_SIZE=$(du -sh dist/ | cut -f1)
print_status "Build size: $BUILD_SIZE"

# Check if nginx is available
if command -v nginx &> /dev/null; then
    print_status "Restarting nginx..."
    sudo systemctl restart nginx
    print_status "Nginx restarted successfully"
else
    print_warning "Nginx not found. You may need to manually restart your web server."
fi

# Check if the application is accessible
print_status "Testing application..."
if command -v curl &> /dev/null; then
    # Wait a moment for nginx to restart
    sleep 2
    
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost || echo "000")
    if [ "$HTTP_STATUS" = "200" ]; then
        print_status "Application is accessible (HTTP 200)"
    else
        print_warning "Application returned HTTP $HTTP_STATUS"
    fi
else
    print_warning "curl not available - cannot test application accessibility"
fi

print_status "Deployment completed successfully! 🎉"

# Optional: Show deployment info
echo ""
echo "📊 Deployment Summary:"
echo "  • Build size: $BUILD_SIZE"
echo "  • Build location: $(pwd)/dist/"
echo "  • Main entry point: dist/index.html"
echo "  • Assets: dist/assets/"
echo ""
echo "🌐 Your application should now be live at your domain!"
echo ""
echo "🔍 To verify deployment:"
echo "  • Visit your domain in a browser"
echo "  • Check that OAuth login works"
echo "  • Test email invitation functionality"
echo "  • Verify Branding page loads correctly" 