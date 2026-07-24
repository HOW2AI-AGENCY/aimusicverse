# Deployment Guide

**Last Updated**: 2026-07-24  
**Version**: 1.0.0  
**Target Audience**: DevOps Engineers, System Administrators

> **Handoff note:** for the full ownership-transfer and acceptance checklist see [`HANDOFF.md`](../HANDOFF.md). The complete environment-variable reference is [`ENVIRONMENT_VARIABLES.md`](ENVIRONMENT_VARIABLES.md).

---

## Overview

This guide provides comprehensive instructions for deploying MusicVerse AI to production environments. MusicVerse AI is a Telegram Mini App built with React 19, TypeScript, and Supabase.

### Architecture Components

- **Frontend**: React 19.2 + TypeScript 5.9 + Vite 6.4.3
- **Backend**: Lovable Cloud (managed Supabase — PostgreSQL + Edge Functions + Storage)
- **AI Integration**: Suno AI v5, Klang.io (MIDI), Lovable AI Gateway
- **Payment**: Telegram Stars (native) + Tinkoff acquiring (RU cards)
- **Platform**: Telegram Mini App SDK 8.0

---

## 🚀 Prerequisites

### Required Services

1. **Supabase Project**
   - PostgreSQL database
   - Edge Functions (Deno runtime)
   - Storage buckets for audio files
   - Authentication configured

2. **Telegram Mini App**
   - Telegram Bot created via @BotFather
   - Mini App configured in BotFather
   - Web App URL set

3. **External APIs**
   - Suno AI API key (**required** — core music generation)
   - Klang.io API key (MIDI transcription)
   - Lovable AI Gateway key (lyrics, analysis)
   - Tinkoff acquiring credentials (optional — RU card payments; Telegram Stars needs no separate key)
   - FAL.ai / Replicate / AudD keys (optional — media features)

4. **Monitoring** (optional but recommended)
   - Sentry account for error monitoring
   - Analytics service (Google Analytics, Plausible, etc.)

### Infrastructure Requirements

- **Node.js**: 22.15+ (for build process)
- **npm**: 10.8+ or bun 1.0+
- **Domain**: Custom domain (optional, for production)
- **SSL Certificate**: Required for production
- **CDN**: Recommended for static assets

---

## 📦 Build Process

### 1. Environment Setup

```bash
# Clone repository
git clone https://github.com/HOW2AI-AGENCY/aimusicverse.git
cd aimusicverse

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 2. Environment Configuration

There are **two separate sets** of variables. Do not mix them.

#### 2a. Frontend `.env` (build-time, `VITE_` prefix — public values only)

These are bundled into the client. Never put secrets here.

```bash
# Supabase / Lovable Cloud (public)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-publishable-key
VITE_SUPABASE_PROJECT_ID=your-project-ref

# Monitoring (optional, recommended)
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

See [`.env.example`](../.env.example) for optional flags (analytics, feature toggles, demo mode).

#### 2b. Backend secrets (Supabase → Settings → Edge Functions → Secrets)

Server-side only — never exposed to the client. `SUPABASE_URL`, `SUPABASE_ANON_KEY` and
`SUPABASE_SERVICE_ROLE_KEY` are injected automatically by the platform.

```bash
# Suno AI (required)
SUNO_API_KEY=your-suno-api-key
SUNO_WEBHOOK_SECRET=your-suno-webhook-secret

# AI & MIDI
LOVABLE_API_KEY=your-lovable-ai-key
KLANGIO_API_KEY=your-klangio-key

# Telegram
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_BOT_USERNAME=AIMusicVerseBot
TELEGRAM_BOT_MINIAPP_URL=https://your-app-url
MINI_APP_URL=https://your-app-url
TELEGRAM_WEBHOOK_SECRET=your-webhook-secret
TELEGRAM_WEBHOOK_SECRET_TOKEN=your-webhook-header-token

# Payments (optional — RU cards)
TINKOFF_TERMINAL_KEY=your-terminal-key
TINKOFF_SECRET_KEY=your-secret-key

# Media services (optional)
FAL_API_KEY=your-fal-key
REPLICATE_API_KEY=your-replicate-key
AUDD_API_KEY=your-audd-key

# Ops
CRON_SECRET=your-cron-secret
ENVIRONMENT=production
```

> Full per-variable documentation: [`ENVIRONMENT_VARIABLES.md`](ENVIRONMENT_VARIABLES.md). Complete transfer register: [`HANDOFF.md`](../HANDOFF.md) §4.

### 3. Production Build

```bash
# Run tests
npm test

# Type check
npm run typecheck

# Build for production
npm run build

# Preview build
npm run preview
```

Build output will be in `dist/` directory.

---

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

Vercel provides excellent integration with React, TypeScript, and automatic HTTPS.

#### Setup Steps

1. **Install Vercel CLI**

   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**

   ```bash
   vercel login
   ```

3. **Deploy Project**

   ```bash
   vercel --prod
   ```

4. **Configure Environment Variables**

   ```bash
   vercel env add SUPABASE_URL production
   vercel env add SUPABASE_ANON_KEY production
   # Add all other environment variables
   ```

5. **Configure Custom Domain** (optional)
   ```bash
   vercel domains add yourdomain.com
   ```

#### Vercel Configuration

Create `vercel.json` in project root:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "env": {
    "NODE_VERSION": "22"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Option 2: Netlify

#### Setup Steps

1. **Install Netlify CLI**

   ```bash
   npm install -g netlify-cli
   ```

2. **Build and Deploy**

   ```bash
   netlify deploy --prod
   ```

3. **Configure Environment Variables**
   ```bash
   netlify env:set SUPABASE_URL "your-url"
   # Set all other variables
   ```

#### Netlify Configuration

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production.environment]
  NODE_VERSION = "22"
```

### Option 3: Docker Deployment

#### Dockerfile

Create `Dockerfile` in project root:

```dockerfile
# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### Build and Run

```bash
# Build image
docker build -t musicverse-ai .

# Run container
docker run -p 80:80 \
  -e SUPABASE_URL="your-url" \
  -e SUPABASE_ANON_KEY="your-key" \
  musicverse-ai
```

### Option 4: VPS/Cloud Server

#### Manual Deployment

```bash
# SSH into server
ssh user@your-server.com

# Install Node.js 22+
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/HOW2AI-AGENCY/aimusicverse.git
cd aimusicverse

# Install dependencies
npm install

# Build application
npm run build

# Setup PM2 for process management
npm install -g pm2

# Start application with PM2
pm2 serve dist 8080 --spa --name "musicverse-ai"

# Configure Nginx reverse proxy
sudo nano /etc/nginx/sites-available/musicverse
```

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # SSL configuration (recommended)
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
}
```

---

## 🔧 Supabase Deployment

### 1. Database Migration

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to project
supabase link --project-ref your-project-id

# Push migrations
supabase db push
```

### 2. Edge Functions Deployment

```bash
# Deploy all edge functions
supabase functions deploy

# Deploy specific function
supabase functions deploy suno-music-generate
```

### 3. Storage Configuration

```bash
# Create storage buckets
supabase storage create-bucket audio-files
supabase storage create-bucket user-uploads

# Set public policies
supabase storage set-policy-public audio-files
```

---

## ✅ Pre-Deployment Checklist

Before deploying to production, ensure:

### Security

- [ ] Environment variables are set correctly
- [ ] No hardcoded secrets in code
- [ ] SSL certificates are configured
- [ ] Security headers are enabled
- [ ] Rate limiting is configured
- [ ] Authentication is properly configured

### Performance

- [ ] Bundle size is under 950KB
- [ ] Image optimization is enabled
- [ ] Caching is configured
- [ ] CDN is set up (if applicable)
- [ ] Compression is enabled (gzip/brotli)

### Monitoring

- [ ] Sentry is configured
- [ ] Error tracking is enabled
- [ ] Analytics is set up
- [ ] Logging is configured
- [ ] Performance monitoring is active

### Testing

- [ ] All tests pass (`npm test`)
- [ ] Type check passes (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Manual testing completed

### Backup & Recovery

- [ ] Database backups are enabled
- [ ] Recovery procedures are documented
- [ ] Rollback plan is prepared
- [ ] Backup contacts are identified

---

## 🔄 Post-Deployment Tasks

### 1. Verification

```bash
# Test application
curl https://your-app.vercel.app

# Check bundle size
npm run size

# Test API endpoints
curl https://your-project.supabase.co/rest/v1/
```

### 2. Monitoring Setup

- **Error Tracking**: Verify Sentry is capturing errors
- **Performance**: Monitor Core Web Vitals
- **Uptime**: Set up uptime monitoring (UptimeRobot, Pingdom)
- **Logs**: Configure log aggregation

### 3. User Testing

- Test core user flows:
  - Music generation
  - Track playback
  - User authentication
  - Payment flow (if enabled)
  - Telegram integration

### 4. Performance Validation

- Check load times (< 3 seconds target)
- Verify Lighthouse scores (> 90 target)
- Test on mobile devices
- Validate Core Web Vitals

---

## 🚨 Troubleshooting

### Build Failures

**Issue**: Build fails with TypeScript errors

```bash
# Solution: Check types
npm run typecheck:strict
```

**Issue**: Bundle size exceeds limit

```bash
# Solution: Analyze bundle
npm run size:why
```

### Deployment Failures

**Issue**: Environment variables not loading

```bash
# Solution: Verify env vars are set
vercel env ls
```

**Issue**: Supabase connection fails

```bash
# Solution: Test Supabase connection
curl https://your-project.supabase.co/rest/v1/
```

### Runtime Issues

**Issue**: Audio playback fails

- Check audio element pool configuration
- Verify HTTPS is enabled (required for audio)
- Test on different browsers

**Issue**: Telegram Mini App doesn't load

- Verify Mini App URL in BotFather
- Check Web App SDK integration
- Test with Telegram's debug mode

---

## 📚 Additional Resources

- [Development Guide](./QUICK_START.md)
- [Security Operations](./SECURITY_OPERATIONS.md)
- [Architecture Documentation](./ARCHITECTURE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)

---

**Last Updated**: 2026-07-24  
**Maintained By**: HOW2AI Agency  
**Contact**: For deployment issues, contact hello@how2ai.agency
