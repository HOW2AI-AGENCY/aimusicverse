# Deployment Checklist

**Last Updated**: 2026-06-25  
**Version**: 1.0.0  
**Purpose**: Ensure safe and consistent production deployments

---

## 📋 Pre-Deployment Checklist

Use this checklist before every production deployment.

### Code & Testing ✅

#### Quality Checks
- [ ] All tests passing: `npm test`
- [ ] Type check passing: `npm run typecheck`
- [ ] Linting passing: `npm run lint`
- [ ] Build successful: `npm run build`
- [ ] Bundle size under 950KB: `npm run size`
- [ ] E2E tests passing: `npm run test:e2e`
- [ ] No console errors in production build

#### Code Review
- [ ] Code reviewed by at least one team member
- [ ] Security-focused review completed
- [ ] Performance impact assessed
- [ ] Breaking changes documented
- [ ] Migration steps documented (if applicable)

### Security 🔒

#### Vulnerability Scanning
- [ ] `npm audit` run with no critical/high vulnerabilities
- [ ] Dependencies updated to latest secure versions
- [ ] No hardcoded secrets in code
- [ ] Environment variables verified
- [ ] API keys and secrets rotated (if due)
- [ ] Security documentation updated

#### Configuration
- [ ] Production environment variables set correctly
- [ ] No development/debug tools in production
- [ ] CORS configuration correct
- [ ] CSP headers configured
- [ ] Security headers enabled:
  - [ ] X-Frame-Options: DENY
  - [ ] X-Content-Type-Options: nosniff
  - [ ] X-XSS-Protection: 1; mode=block
  - [ ] Strict-Transport-Security (if SSL enabled)

### Performance 🚀

#### Optimization
- [ ] Images optimized and compressed
- [ ] Bundle size minimized
- [ ] Code splitting enabled
- [ ] Lazy loading configured
- [ ] Caching strategy defined
- [ ] CDN configured (if applicable)
- [ ] Compression enabled (gzip/brotli)

#### Monitoring Setup
- [ ] Sentry error tracking configured
- [ ] Performance monitoring enabled
- [ ] Analytics tracking set up
- [ ] Custom logging configured
- [ ] Error boundaries tested

### Database & Backend 💾

#### Supabase Configuration
- [ ] Database migrations applied: `supabase db push`
- [ ] Edge Functions deployed: `supabase functions deploy`
- [ ] Storage buckets created and configured
- [ ] RLS policies updated
- [ ] Database indexes created
- [ ] Connection pooling configured

#### Data Safety
- [ ] Database backups enabled
- [ ] Recovery procedures documented
- [ ] Data migration plan ready (if applicable)
- [ ] Rollback plan tested
- [ ] Backup verification completed

### External Integrations 🔗

#### Third-Party Services
- [ ] Suno AI API key valid and configured
- [ ] Tinkoff payment integration tested (if enabled)
- [ ] Telegram Mini App URL updated
- [ ] Webhook URLs configured (if applicable)
- [ ] API rate limits verified
- [ ] Fallback procedures documented

#### Communication
- [ ] Stakeholders notified of deployment
- [ ] Maintenance window communicated (if applicable)
- [ ] User notifications prepared (if breaking changes)
- [ ] Support team informed
- [ ] Incident response team on standby

---

## 🚀 Deployment Process

### Step 1: Final Verification (30 minutes before)

```bash
# Run final checks
npm run check-all
npm run size
npm run test:e2e

# Verify build
npm run build
npm run preview
```

- [ ] All checks passing
- [ ] Build artifacts verified
- [ ] Staging environment tested (if available)

### Step 2: Pre-Deployment Backup (15 minutes before)

```bash
# Database backup
supabase db dump --file backup-$(date +%Y%m%d).sql

# Current version backup
git tag backup-before-deploy-$(date +%Y%m%d-%H%M%S)
```

- [ ] Database backup completed
- [ ] Git backup tag created
- [ ] Current deployment version documented
- [ ] Rollback procedure confirmed

### Step 3: Deployment Execution

#### For Vercel:
```bash
# Deploy to production
vercel --prod

# Monitor deployment
vercel logs
```

#### For Docker:
```bash
# Build new image
docker build -t musicverse-ai:new .

# Test new container
docker run -p 8081:80 musicverse-ai:new

# Swap to production
docker tag musicverse-ai:new musicverse-ai:latest
docker-compose up -d
```

#### For Manual Deployment:
```bash
# Build on server
ssh user@server "cd /var/www/musicverse && npm run build"

# Restart service
pm2 restart musicverse-ai
```

### Step 4: Post-Deployment Verification (15 minutes after)

#### Health Checks
```bash
# Test application
curl https://your-app.vercel.app/health

# Check API endpoints
curl https://your-project.supabase.co/rest/v1/

# Test key user flows
# - Music generation
# - Audio playback
# - User authentication
```

- [ ] Homepage loads correctly
- [ ] Authentication working
- [ ] API endpoints responding
- [ ] Audio playback functional
- [ ] Payment flow tested (if enabled)
- [ ] Telegram Mini App loads

#### Monitoring Verification
- [ ] Sentry receiving data
- [ ] Error rates within baseline
- [ ] Performance metrics normal
- [ ] No unusual traffic patterns
- [ ] Database queries performing well

---

## 📊 Post-Deployment Monitoring (First 24 Hours)

### Immediate Monitoring (First Hour)

- [ ] Check error rates every 15 minutes
- [ ] Monitor server resources (CPU, memory)
- [ ] Verify database connection pool
- [ ] Test key user flows
- [ ] Check social media for user reports

### Extended Monitoring (First 24 Hours)

- [ ] Error rates within normal range
- [ ] Performance metrics acceptable
- [ ] No increase in support tickets
- [ ] Analytics show normal user behavior
- [ ] Automated alerts not triggered

### User Feedback Collection

- [ ] Monitor social media mentions
- [ ] Check support channels
- [ ] Review app store reviews (if applicable)
- [ ] Gather feedback from key users
- [ ] Document any issues found

---

## 🔄 Rollback Procedures

### When to Rollback

Rollback immediately if:
- Critical errors affecting >20% of users
- Security vulnerability detected
- Data loss or corruption
- Payment processing failures
- Performance degradation (>5x slower)

### Rollback Steps

#### Vercel Rollback
```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

#### Docker Rollback
```bash
# Stop current container
docker-compose down

# Start previous version
docker-compose up -d --scale app=1
```

#### Manual Rollback
```bash
# Restore from backup tag
git checkout backup-before-deploy-[timestamp]

# Rebuild and deploy
npm run build
pm2 restart musicverse-ai
```

### Rollback Verification
- [ ] Previous version restored
- [ ] Functionality verified
- [ ] Data integrity checked
- [ ] Users notified of rollback
- [ ] Root cause investigation initiated

---

## 📝 Deployment Documentation

### Deployment Record

After each deployment, document:

```
Deployment Date: [YYYY-MM-DD HH:MM]
Deployment Version: [git commit hash]
Deployed By: [name]
Deployment Type: [major/minor/patch/hotfix]

Pre-Deployment Checks:
- Tests: [passing/failing]
- Security: [issues found/resolved]
- Performance: [baseline/meets target]

Deployment Process:
- Started: [HH:MM]
- Completed: [HH:MM]
- Duration: [minutes]
- Issues: [any problems encountered]

Post-Deployment Verification:
- Health Checks: [passing/failing]
- User Feedback: [summary]
- Issues: [any problems found]

Rollback Required: [yes/no]
Reason for Rollback: [if applicable]

Next Steps:
- [Follow-up actions]
- [Monitoring requirements]
- [Improvement suggestions]
```

---

## 🎯 Success Criteria

A deployment is considered successful when:

### Technical Criteria
- [ ] All pre-deployment checks passing
- [ ] Deployment completed without errors
- [ ] All health checks passing
- [ ] Error rates within baseline
- [ ] Performance metrics acceptable

### User Experience Criteria
- [ ] No critical user-facing issues
- [ ] Key user flows functional
- [ ] No significant performance degradation
- [ ] No data loss or corruption
- [ ] Positive initial user feedback

### Operational Criteria
- [ ] Monitoring systems operational
- [ ] Alert systems configured
- [ ] Support team prepared
- [ ] Documentation updated
- [ ] Stakeholders informed

---

## 🚨 Emergency Contacts

### Primary Contacts
- **DevOps Lead**: [contact information]
- **Backend Lead**: [contact information]
- **Frontend Lead**: [contact information]
- **Database Administrator**: [contact information]

### Escalation Contacts
- **CTO**: [contact information]
- **Product Manager**: [contact information]
- **Customer Support**: [contact information]

### External Contacts
- **Supabase Support**: support@supabase.com
- **Vercel Support**: support@vercel.com
- **Sentry Support**: support@sentry.io

---

**Last Updated**: 2026-06-25  
**Next Review**: 2026-09-25  
**Maintained By**: DevOps Team  

**Usage**: This checklist must be completed for every production deployment. Keep copies for audit purposes.