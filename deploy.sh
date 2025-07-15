#!/bin/bash

# FitCoachTrainer VPS Deployment Script
# This script automates the deployment process on your VPS

set -e  # Exit on any error

echo "🚀 Starting FitCoachTrainer deployment..."

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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
print_status "Installing required packages..."
sudo apt install -y curl wget git docker.io docker-compose nginx certbot python3-certbot-nginx

# Start and enable Docker
print_status "Starting Docker service..."
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
print_status "Adding user to docker group..."
sudo usermod -aG docker $USER

# Create application directory
APP_DIR="/opt/fitcoachtrainer"
print_status "Creating application directory: $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Clone or copy application files
if [ -d ".git" ]; then
    print_status "Copying application files..."
    cp -r . $APP_DIR/
else
    print_status "Please ensure your application files are in the current directory"
    exit 1
fi

# Create logs directory
mkdir -p $APP_DIR/logs

# Create environment file template
print_status "Creating environment file template..."
cat > $APP_DIR/.env.template << EOF
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenRouter API (for AI features)
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here

# Google OAuth (if using)
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# Environment
NODE_ENV=production
EOF

# Create production environment file
if [ ! -f "$APP_DIR/.env" ]; then
    print_warning "Please create .env file with your actual environment variables:"
    echo "cp $APP_DIR/.env.template $APP_DIR/.env"
    echo "Then edit $APP_DIR/.env with your actual values"
fi

# Build and start the application
print_status "Building and starting the application..."
cd $APP_DIR

# Build the Docker image
print_status "Building Docker image..."
docker-compose build

# Start the application
print_status "Starting the application..."
docker-compose up -d

# Wait for application to start
print_status "Waiting for application to start..."
sleep 10

# Check if application is running
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_status "✅ Application is running successfully!"
else
    print_error "❌ Application failed to start. Check logs with: docker-compose logs"
    exit 1
fi

# Setup SSL with Let's Encrypt (optional)
read -p "Do you want to setup SSL with Let's Encrypt? (y/n): " setup_ssl
if [[ $setup_ssl == "y" || $setup_ssl == "Y" ]]; then
    read -p "Enter your domain name: " domain_name
    if [[ -n "$domain_name" ]]; then
        print_status "Setting up SSL for domain: $domain_name"
        
        # Stop nginx if running on host
        sudo systemctl stop nginx
        
        # Create nginx config for domain
        sudo tee /etc/nginx/sites-available/fitcoachtrainer << EOF
server {
    listen 80;
    server_name $domain_name;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
        
        # Enable the site
        sudo ln -sf /etc/nginx/sites-available/fitcoachtrainer /etc/nginx/sites-enabled/
        sudo nginx -t && sudo systemctl start nginx
        
        # Get SSL certificate
        sudo certbot --nginx -d $domain_name --non-interactive --agree-tos --email admin@$domain_name
        
        print_status "✅ SSL certificate installed for $domain_name"
    fi
fi

# Create systemd service for auto-restart
print_status "Creating systemd service for auto-restart..."
sudo tee /etc/systemd/system/fitcoachtrainer.service << EOF
[Unit]
Description=FitCoachTrainer Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
sudo systemctl enable fitcoachtrainer.service
sudo systemctl start fitcoachtrainer.service

# Create update script
print_status "Creating update script..."
cat > $APP_DIR/update.sh << 'EOF'
#!/bin/bash
cd /opt/fitcoachtrainer
git pull origin main
docker-compose down
docker-compose build
docker-compose up -d
echo "✅ Application updated successfully!"
EOF

chmod +x $APP_DIR/update.sh

# Create backup script
print_status "Creating backup script..."
cat > $APP_DIR/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf $BACKUP_DIR/fitcoachtrainer_backup_$DATE.tar.gz -C /opt fitcoachtrainer
echo "✅ Backup created: $BACKUP_DIR/fitcoachtrainer_backup_$DATE.tar.gz"
EOF

chmod +x $APP_DIR/backup.sh

# Final instructions
print_status "🎉 Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Create .env file with your environment variables:"
echo "   cp $APP_DIR/.env.template $APP_DIR/.env"
echo "   nano $APP_DIR/.env"
echo ""
echo "2. Restart the application:"
echo "   cd $APP_DIR && docker-compose restart"
echo ""
echo "3. View logs:"
echo "   docker-compose logs -f"
echo ""
echo "4. Update application:"
echo "   $APP_DIR/update.sh"
echo ""
echo "5. Create backup:"
echo "   $APP_DIR/backup.sh"
echo ""
echo "🌐 Your application should be available at:"
echo "   http://$(curl -s ifconfig.me)"
echo "   or http://localhost"
echo ""
echo "📊 Monitor the application:"
echo "   docker-compose ps"
echo "   docker stats" 