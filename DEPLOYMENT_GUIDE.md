# FitCoachTrainer VPS Deployment Guide

This guide will walk you through deploying your FitCoachTrainer application on a VPS (Virtual Private Server).

## 📋 Prerequisites

### 1. VPS Requirements
- **OS**: Ubuntu 20.04 LTS or later
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 20GB
- **CPU**: 1-2 cores minimum
- **Domain**: Optional but recommended for SSL

### 2. Environment Variables Needed
Before deployment, gather these environment variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenRouter API (for AI features)
VITE_OPENROUTER_API_KEY=your_openrouter_api_key

# Google OAuth (optional)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## 🚀 Quick Deployment (Automated)

### Step 1: Prepare Your Local Project
```bash
# Ensure all files are committed to git
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Connect to Your VPS
```bash
# SSH into your VPS
ssh username@your_vps_ip

# Update system
sudo apt update && sudo apt upgrade -y
```

### Step 3: Clone and Deploy
```bash
# Clone your repository
git clone https://github.com/yourusername/FitCoachTrainer.git
cd FitCoachTrainer

# Make deployment script executable
chmod +x deploy.sh

# Run the deployment script
./deploy.sh
```

### Step 4: Configure Environment Variables
```bash
# Navigate to app directory
cd /opt/fitcoachtrainer

# Create environment file
cp .env.template .env
nano .env

# Add your actual environment variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key
VITE_OPENROUTER_API_KEY=your_actual_openrouter_key
NODE_ENV=production
```

### Step 5: Restart Application
```bash
# Restart with new environment variables
docker-compose restart

# Check if it's running
docker-compose ps
```

## 🔧 Manual Deployment (Step-by-Step)

### Step 1: Server Setup

#### 1.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

#### 1.2 Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Logout and login again for group changes to take effect
exit
# SSH back in
```

#### 1.3 Install Docker Compose
```bash
# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Step 2: Application Deployment

#### 2.1 Clone Repository
```bash
# Create application directory
sudo mkdir -p /opt/fitcoachtrainer
sudo chown $USER:$USER /opt/fitcoachtrainer

# Clone your repository
cd /opt
git clone https://github.com/yourusername/FitCoachTrainer.git fitcoachtrainer
cd fitcoachtrainer
```

#### 2.2 Configure Environment
```bash
# Create environment file
cp .env.template .env
nano .env

# Add your environment variables:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key
VITE_OPENROUTER_API_KEY=your_actual_openrouter_key
NODE_ENV=production
```

#### 2.3 Build and Deploy
```bash
# Build the Docker image
docker-compose build

# Start the application
docker-compose up -d

# Check if it's running
docker-compose ps
```

### Step 3: Domain and SSL Setup (Optional)

#### 3.1 Install Nginx and Certbot
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

#### 3.2 Configure Domain
```bash
# Create nginx configuration
sudo nano /etc/nginx/sites-available/fitcoachtrainer

# Add this configuration:
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Enable the site
sudo ln -s /etc/nginx/sites-available/fitcoachtrainer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 3.3 Setup SSL Certificate
```bash
# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## 📊 Monitoring and Maintenance

### Check Application Status
```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f

# Check resource usage
docker stats
```

### Update Application
```bash
# Navigate to app directory
cd /opt/fitcoachtrainer

# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

### Backup Application
```bash
# Create backup
cd /opt
tar -czf fitcoachtrainer_backup_$(date +%Y%m%d_%H%M%S).tar.gz fitcoachtrainer/

# Restore from backup
tar -xzf fitcoachtrainer_backup_YYYYMMDD_HHMMSS.tar.gz
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Application Not Starting
```bash
# Check logs
docker-compose logs

# Check if port 80 is available
sudo netstat -tlnp | grep :80

# Restart Docker
sudo systemctl restart docker
```

#### 2. Environment Variables Not Loading
```bash
# Check if .env file exists
ls -la /opt/fitcoachtrainer/.env

# Verify environment variables
docker-compose exec fitcoach-app env | grep VITE
```

#### 3. SSL Certificate Issues
```bash
# Check nginx configuration
sudo nginx -t

# Check SSL certificate
sudo certbot certificates

# Renew certificate manually
sudo certbot renew
```

### Performance Optimization

#### 1. Enable Gzip Compression
The nginx configuration already includes gzip compression.

#### 2. Set Up Monitoring
```bash
# Install monitoring tools
sudo apt install -y htop iotop

# Monitor system resources
htop
```

#### 3. Database Optimization
- Ensure your Supabase project is in the same region as your VPS
- Monitor database connection limits
- Consider using connection pooling for high traffic

## 🔒 Security Considerations

### 1. Firewall Setup
```bash
# Install UFW
sudo apt install ufw

# Configure firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. Regular Updates
```bash
# Create update script
cat > /opt/fitcoachtrainer/update-system.sh << 'EOF'
#!/bin/bash
sudo apt update && sudo apt upgrade -y
docker system prune -f
EOF

chmod +x /opt/fitcoachtrainer/update-system.sh

# Run weekly updates
sudo crontab -e
# Add: 0 2 * * 0 /opt/fitcoachtrainer/update-system.sh
```

### 3. Backup Strategy
```bash
# Create automated backup script
cat > /opt/fitcoachtrainer/backup-daily.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d)
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/fitcoachtrainer_$DATE.tar.gz -C /opt fitcoachtrainer
# Keep only last 7 days
find $BACKUP_DIR -name "fitcoachtrainer_*.tar.gz" -mtime +7 -delete
EOF

chmod +x /opt/fitcoachtrainer/backup-daily.sh

# Add to crontab for daily backups
sudo crontab -e
# Add: 0 1 * * * /opt/fitcoachtrainer/backup-daily.sh
```

## 📈 Scaling Considerations

### 1. Load Balancer
For high traffic, consider using a load balancer:
- AWS Application Load Balancer
- Nginx Plus
- HAProxy

### 2. CDN
For global performance:
- Cloudflare (free tier available)
- AWS CloudFront
- Google Cloud CDN

### 3. Database Scaling
- Consider Supabase Pro for higher limits
- Implement caching strategies
- Use read replicas for analytics

## 🆘 Support

If you encounter issues:

1. **Check logs**: `docker-compose logs -f`
2. **Verify environment**: Ensure all environment variables are set
3. **Test connectivity**: Check if Supabase and OpenRouter APIs are accessible
4. **Monitor resources**: Ensure VPS has sufficient resources

## 📝 Post-Deployment Checklist

- [ ] Application is accessible via HTTP/HTTPS
- [ ] All environment variables are configured
- [ ] SSL certificate is installed (if using domain)
- [ ] Firewall is configured
- [ ] Backup strategy is in place
- [ ] Monitoring is set up
- [ ] Update scripts are working
- [ ] Health checks are passing

Your FitCoachTrainer application should now be successfully deployed and running on your VPS! 🎉 