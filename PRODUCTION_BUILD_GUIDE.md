# Production Build Guide

## 🚀 **Quick Production Build**

### **1. Build the Application**
```bash
# Build for production
npm run build

# This will create optimized files in the `dist/` directory
```

### **2. Test the Production Build**
```bash
# Preview the production build locally
npm run preview

# This serves the built files from `dist/` directory
```

## 🔧 **Complete Production Setup**

### **Step 1: Environment Configuration**

Create a production `.env` file:

```bash
# .env.production
VITE_SUPABASE_URL=https://zyozeuihjptarceuipwu.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_OPENAI_API_KEY=your-production-openai-key
VITE_OPENROUTER_API_KEY=your-production-openrouter-key
NODE_ENV=production
```

### **Step 2: Build Commands**

```bash
# Clean previous builds
rm -rf dist/

# Build for production
npm run build

# Build with specific environment
npm run build -- --mode production
```

### **Step 3: Build Output**

The build will create:
```
dist/
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [other assets]
├── index.html
└── [other files]
```

## 🐳 **Docker Production Build**

### **Dockerfile (Already exists)**
```dockerfile
# Use the existing Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "preview"]
```

### **Build Docker Image**
```bash
# Build the Docker image
docker build -t fitcoachtrainer:latest .

# Run the container
docker run -p 3000:3000 fitcoachtrainer:latest
```

## 🌐 **Deployment Options**

### **Option 1: VPS Deployment (Current)**

```bash
# On your VPS server
cd /path/to/your/app
git pull origin main
npm install
npm run build

# Serve with nginx (already configured)
sudo systemctl restart nginx
```

### **Option 2: Vercel Deployment**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### **Option 3: Netlify Deployment**

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

### **Option 4: AWS S3 + CloudFront**

```bash
# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## 🔒 **Production Security Checklist**

### **Environment Variables**
- [ ] All API keys are set correctly
- [ ] Supabase URL points to production
- [ ] No development URLs in production
- [ ] OAuth redirects point to production domain

### **Security Headers**
```nginx
# Add to nginx.conf
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### **CORS Configuration**
```javascript
// Ensure CORS is properly configured for production
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://repute.cloud',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

## 📊 **Performance Optimization**

### **Build Optimization**
```bash
# Analyze bundle size
npm run build -- --analyze

# Check for large dependencies
npm ls --depth=0
```

### **Image Optimization**
```bash
# Optimize images before build
npm install -g imagemin-cli
imagemin client/src/assets/* --out-dir=client/src/assets/optimized
```

### **Code Splitting**
```javascript
// Use React.lazy for code splitting
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Clients = React.lazy(() => import('./pages/Clients'));
```

## 🧪 **Testing Production Build**

### **Local Testing**
```bash
# Build and test locally
npm run build
npm run preview

# Test on different browsers
# Test OAuth flow
# Test email functionality
# Test all major features
```

### **Production Testing Checklist**
- [ ] OAuth login works
- [ ] Email invitations send correctly
- [ ] Branding page loads
- [ ] Email templates work
- [ ] Client management functions
- [ ] All API calls work
- [ ] No console errors
- [ ] Mobile responsiveness

## 🚀 **Deployment Commands**

### **Quick Deploy Script**
```bash
#!/bin/bash
# deploy.sh

echo "🚀 Starting production deployment..."

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build for production
npm run build

# Restart nginx
sudo systemctl restart nginx

echo "✅ Deployment complete!"
```

### **Automated Deployment**
```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

## 📈 **Monitoring & Analytics**

### **Error Tracking**
```javascript
// Add error boundary for production
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Send to error tracking service
    console.error('Production error:', error, errorInfo);
  }
}
```

### **Performance Monitoring**
```javascript
// Add performance monitoring
if (process.env.NODE_ENV === 'production') {
  // Initialize monitoring service
  console.log('Performance monitoring enabled');
}
```

## 🔄 **CI/CD Pipeline**

### **GitHub Actions Example**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run test
      - name: Deploy to server
        run: |
          # Deploy to your VPS
          ssh user@your-server.com 'cd /app && git pull && npm run build'
```

## 🎯 **Production Checklist**

### **Pre-Deployment**
- [ ] All tests pass
- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] Supabase functions deployed
- [ ] OAuth redirects configured
- [ ] Email service configured

### **Post-Deployment**
- [ ] Application loads correctly
- [ ] OAuth login works
- [ ] Email invitations send
- [ ] All features functional
- [ ] Performance acceptable
- [ ] No console errors
- [ ] Mobile devices tested

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Build fails**:
   ```bash
   # Clear cache and rebuild
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **OAuth not working**:
   - Check redirect URIs in Google Console
   - Verify Supabase auth settings
   - Check environment variables

3. **Email not sending**:
   - Verify Mailgun configuration
   - Check Supabase function deployment
   - Test function locally

4. **Performance issues**:
   ```bash
   # Analyze bundle
   npm run build -- --analyze
   
   # Check for large dependencies
   npm ls --depth=0
   ```

## 📝 **Quick Commands Reference**

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to VPS
./deploy.sh

# Check build size
du -sh dist/

# Test production locally
npm run build && npm run preview

# Docker build
docker build -t fitcoachtrainer:latest .
docker run -p 3000:3000 fitcoachtrainer:latest
```

This guide covers all aspects of building and deploying your FitCoachTrainer application to production! 🚀 