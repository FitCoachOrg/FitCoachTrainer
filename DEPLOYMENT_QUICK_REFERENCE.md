# 🚀 FitCoachTrainer Deployment Quick Reference

## 📋 Pre-Deployment Checklist

### Environment Variables Needed:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id (optional)
NODE_ENV=production
```

## 🚀 Quick Deploy Commands

### 1. Automated Deployment
```bash
# On your VPS
git clone https://github.com/yourusername/FitCoachTrainer.git
cd FitCoachTrainer
chmod +x deploy.sh
./deploy.sh
```

### 2. Manual Deployment
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Deploy
cd /opt
sudo mkdir -p fitcoachtrainer
sudo chown $USER:$USER fitcoachtrainer
git clone https://github.com/yourusername/FitCoachTrainer.git fitcoachtrainer
cd fitcoachtrainer
cp .env.template .env
nano .env  # Add your environment variables
docker-compose build
docker-compose up -d
```

## 🔧 Management Commands

### Check Status
```bash
docker-compose ps
docker-compose logs -f
docker stats
```

### Update Application
```bash
cd /opt/fitcoachtrainer
git pull origin main
docker-compose down
docker-compose build
docker-compose up -d
```

### Restart Application
```bash
docker-compose restart
```

### Stop Application
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f fitcoach-app
```

## 🔒 SSL Setup (Optional)

### Install SSL Certificate
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Renew SSL Certificate
```bash
sudo certbot renew
```

## 📊 Monitoring

### System Resources
```bash
htop
df -h
free -h
```

### Application Health
```bash
curl http://localhost/health
```

### Container Resources
```bash
docker stats
docker system df
```

## 🔧 Troubleshooting

### Application Not Starting
```bash
# Check logs
docker-compose logs

# Check port availability
sudo netstat -tlnp | grep :80

# Restart Docker
sudo systemctl restart docker
```

### Environment Variables Issues
```bash
# Check if .env exists
ls -la /opt/fitcoachtrainer/.env

# Verify environment variables
docker-compose exec fitcoach-app env | grep VITE
```

### SSL Issues
```bash
# Check nginx config
sudo nginx -t

# Check certificates
sudo certbot certificates

# Renew manually
sudo certbot renew
```

## 📈 Performance Commands

### Clean Docker
```bash
docker system prune -f
docker volume prune -f
```

### Monitor Performance
```bash
# Real-time monitoring
htop
iotop
docker stats

# Check disk usage
df -h
du -sh /opt/fitcoachtrainer
```

## 🔄 Backup & Restore

### Create Backup
```bash
cd /opt
tar -czf fitcoachtrainer_backup_$(date +%Y%m%d_%H%M%S).tar.gz fitcoachtrainer/
```

### Restore from Backup
```bash
cd /opt
tar -xzf fitcoachtrainer_backup_YYYYMMDD_HHMMSS.tar.gz
cd fitcoachtrainer
docker-compose up -d
```

## 🛡️ Security Commands

### Setup Firewall
```bash
sudo apt install ufw
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

## 📝 Useful Aliases

Add these to your `~/.bashrc`:
```bash
alias fitcoach='cd /opt/fitcoachtrainer'
alias fitcoach-logs='docker-compose logs -f'
alias fitcoach-status='docker-compose ps'
alias fitcoach-restart='docker-compose restart'
alias fitcoach-update='git pull && docker-compose down && docker-compose build && docker-compose up -d'
```

## 🆘 Emergency Commands

### Complete Reset
```bash
cd /opt/fitcoachtrainer
docker-compose down
docker system prune -f
docker-compose up -d
```

### Check All Services
```bash
sudo systemctl status docker
sudo systemctl status nginx
docker-compose ps
```

### View All Logs
```bash
docker-compose logs --tail=100
sudo journalctl -u docker
sudo journalctl -u nginx
```

---

**Remember**: Always backup before major changes and test in a staging environment first! 