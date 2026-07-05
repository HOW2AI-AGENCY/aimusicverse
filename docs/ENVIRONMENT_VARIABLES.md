# 🔐 Environment Variables - MusicVerse AI

**Last Updated:** 2026-06-26  
**Version:** 1.0.0  
**Status:** ✅ Active

---

## 🎯 Overview

This document provides comprehensive documentation of all environment variables used in the MusicVerse AI project. Environment variables are used to configure application behavior, API credentials, and feature flags across different environments (development, staging, production).

---

## 📋 Required Environment Variables

### 🔑 Supabase Configuration

| Variable                        | Type   | Required | Description                   | Example                                   |
| ------------------------------- | ------ | -------- | ----------------------------- | ----------------------------------------- |
| `VITE_SUPABASE_URL`             | string | ✅ Yes   | Supabase project URL          | `https://xxxxx.supabase.co`               |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | string | ✅ Yes   | Supabase anon/public key      | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_SUPABASE_PROJECT_ID`      | string | ✅ Yes   | Supabase project reference ID | `ygmvthybdrqymfsqifmj`                    |

**Usage:**

```typescript
// src/integrations/supabase/client.ts
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
```

**Get your credentials:**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to Settings → API
4. Copy URL, anon/public key, and project reference ID

---

### ☀️ Suno AI Configuration

| Variable            | Type   | Required       | Description                                | Example            |
| ------------------- | ------ | -------------- | ------------------------------------------ | ------------------ |
| `SUNO_API_KEY`      | string | ✅ Yes         | Suno AI API key for music generation       | `sk-xxxxxxxxxxxxx` |
| `VITE_SUNO_API_KEY` | string | ⚠️ Conditional | Client-side Suno API key (not recommended) | `sk-xxxxxxxxxxxxx` |

**Usage:**

```typescript
// Edge Functions (server-side)
const apiKey = Deno.env.get("SUNO_API_KEY");

// Client-side (NOT recommended - only for demo)
const apiKey = import.meta.env.VITE_SUNO_API_KEY;
```

**Security Note:** ⚠️ **Never expose `SUNO_API_KEY` in client-side code.** Always use it in Edge Functions only.

**Get your API key:**

1. Sign up at [Suno AI](https://suno.ai)
2. Navigate to Account Settings → API Keys
3. Generate and copy your API key

---

### 🤖 Telegram Bot Configuration

| Variable                     | Type   | Required       | Description                            | Example                                 |
| ---------------------------- | ------ | -------------- | -------------------------------------- | --------------------------------------- |
| `TELEGRAM_BOT_TOKEN`         | string | ✅ Yes         | Telegram bot token from BotFather      | `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz` |
| `MINI_APP_URL`               | string | ✅ Yes         | URL of the deployed Mini App           | `https://your-app.vercel.app`           |
| `VITE_TELEGRAM_BOT_USERNAME` | string | ⚠️ Conditional | Telegram bot username (for deep links) | `AIMusicVerseBot`                       |

**Usage:**

```typescript
// Edge Functions (server-side)
const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");

// Client-side deep links
const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
const deepLink = `https://t.me/${botUsername}/app?startapp=track_123`;
```

**Get your bot token:**

1. Open [@BotFather](https://t.me/BotFather) on Telegram
2. Create a new bot or select existing one
3. Copy the provided token
4. Set up Mini App URL in BotFather settings

---

### 📊 Sentry Error Tracking

| Variable          | Type   | Required    | Description                                | Example                         |
| ----------------- | ------ | ----------- | ------------------------------------------ | ------------------------------- |
| `VITE_SENTRY_DSN` | string | ⚠️ Optional | Sentry Data Source Name for error tracking | `https://xxxxx@sentry.io/xxxxx` |

**Usage:**

```typescript
// src/lib/sentry.ts
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
export const isSentryEnabled = !!SENTRY_DSN;
```

**Get your DSN:**

1. Go to [Sentry Dashboard](https://sentry.io)
2. Create a new project or select existing
3. Navigate to Settings → Client Keys (DSN)
4. Copy the DSN URL

**Note:** Sentry is optional. The app works without it, but error tracking won't be available.

---

## 🎛️ Optional Environment Variables

### 🚀 Application Configuration

| Variable                             | Type    | Default       | Description                   |
| ------------------------------------ | ------- | ------------- | ----------------------------- |
| `VITE_APP_VERSION`                   | string  | `1.0.0-beta`  | Application version number    |
| `VITE_APP_ENV`                       | string  | `development` | Environment identifier        |
| `VITE_ENABLE_ANALYTICS`              | boolean | `true`        | Enable analytics tracking     |
| `VITE_ENABLE_PERFORMANCE_MONITORING` | boolean | `true`        | Enable performance monitoring |

### 🎨 Feature Flags

| Variable                           | Type    | Default | Description                       |
| ---------------------------------- | ------- | ------- | --------------------------------- |
| `VITE_FEATURE_MIDI_TRANSCRIPTION`  | boolean | `false` | Enable MIDI transcription feature |
| `VITE_FEATURE_ADVANCED_MASTERING`  | boolean | `false` | Enable advanced mastering         |
| `VITE_FEATURE_AI_MIXING`           | boolean | `false` | Enable AI mixing                  |
| `VITE_FEATURE_CLOUD_COLLABORATION` | boolean | `false` | Enable cloud collaboration        |
| `VITE_FEATURE_MOBILE_RECORDING`    | boolean | `false` | Enable mobile recording           |

### 📱 Mobile Configuration

| Variable                | Type    | Default                       | Description                 |
| ----------------------- | ------- | ----------------------------- | --------------------------- |
| `VITE_MOBILE_ENABLED`   | boolean | `true`                        | Enable mobile optimizations |
| `VITE_SAFE_AREA_TOP`    | string  | `env(safe-area-inset-top)`    | iOS safe area top inset     |
| `VITE_SAFE_AREA_BOTTOM` | string  | `env(safe-area-inset-bottom)` | iOS safe area bottom inset  |

### ⚡ Performance Configuration

| Variable                | Type    | Default | Description                       |
| ----------------------- | ------- | ------- | --------------------------------- |
| `VITE_CACHE_AUDIO`      | boolean | `true`  | Enable audio caching              |
| `VITE_LAZY_LOAD_IMAGES` | boolean | `true`  | Enable lazy loading for images    |
| `VITE_PREFETCH_ROUTES`  | boolean | `true`  | Enable route prefetching          |
| `VITE_REDUCED_MOTION`   | boolean | `true`  | Respect reduced motion preference |

### 🧪 Testing Configuration

| Variable           | Type    | Default | Description                       |
| ------------------ | ------- | ------- | --------------------------------- |
| `VITE_TEST_MODE`   | boolean | `false` | Enable test mode                  |
| `VITE_DEMO_MODE`   | boolean | `false` | Enable demo mode with sample data |
| `VITE_DEBUG_TOOLS` | boolean | `false` | Enable debug tools in development |

---

## 🔒 Security Guidelines

### ✅ DOs

1. **Use server-side variables for sensitive data**
   - API keys, database credentials should only be used in Edge Functions
   - Use `Deno.env.get()` in server-side code

2. **Use VITE\_ prefix for client-side variables**
   - Only non-sensitive data should use `VITE_` prefix
   - These variables are exposed in the browser bundle

3. **Use .env.example for documentation**
   - Keep example values in `.env.example`
   - Never commit actual credentials

4. **Use different values per environment**
   - Development: `dev` credentials
   - Staging: `staging` credentials
   - Production: `production` credentials

### ❌ DON'Ts

1. **Never commit actual credentials to git**
   - `.env` should be in `.gitignore`
   - Never include real keys in code

2. **Never expose server-side keys to client**
   - `SUNO_API_KEY` should only be used in Edge Functions
   - `TELEGRAM_BOT_TOKEN` should only be used server-side

3. **Never log sensitive values**
   - Don't log API keys or tokens
   - Mask sensitive values in error tracking

4. **Never share credentials in chat/email**
   - Use secure password managers
   - Share through secure channels only

---

## 📁 Environment Files

### File Structure

```
aimusicverse/
├── .env                    # Local environment (not committed)
├── .env.example            # Example template (committed)
├── .env.development        # Development overrides (optional)
├── .env.staging            # Staging overrides (optional)
├── .env.production         # Production overrides (optional)
└── .env.test              # Test environment (optional)
```

### .env.example Template

```bash
# ==========================================
# Supabase Configuration (REQUIRED)
# ==========================================
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eHl6eHl6eHl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzOTI2NDcsImV4cCI6MjA3OTk2ODY0N30.example
VITE_SUPABASE_PROJECT_ID=your_project_reference_id

# ==========================================
# Suno AI Configuration (REQUIRED)
# ==========================================
SUNO_API_KEY=sk-xxxxxxxxxxxxx
# Note: VITE_SUNO_API_KEY is NOT recommended (security risk)

# ==========================================
# Telegram Bot Configuration (REQUIRED)
# ==========================================
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
MINI_APP_URL=https://your-app.vercel.app
VITE_TELEGRAM_BOT_USERNAME=your_bot_username

# ==========================================
# Sentry Error Tracking (OPTIONAL)
# ==========================================
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# ==========================================
# Application Configuration (OPTIONAL)
# ==========================================
VITE_APP_VERSION=1.0.0-beta
VITE_APP_ENV=development
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PERFORMANCE_MONITORING=true

# ==========================================
# Feature Flags (OPTIONAL)
# ==========================================
VITE_FEATURE_MIDI_TRANSCRIPTION=false
VITE_FEATURE_ADVANCED_MASTERING=false
VITE_FEATURE_AI_MIXING=false
VITE_FEATURE_CLOUD_COLLABORATION=false
VITE_FEATURE_MOBILE_RECORDING=false

# ==========================================
# Performance Configuration (OPTIONAL)
# ==========================================
VITE_CACHE_AUDIO=true
VITE_LAZY_LOAD_IMAGES=true
VITE_PREFETCH_ROUTES=true
VITE_REDUCED_MOTION=true

# ==========================================
# Testing Configuration (OPTIONAL)
# ==========================================
VITE_TEST_MODE=false
VITE_DEMO_MODE=false
VITE_DEBUG_TOOLS=false
```

---

## 🚀 Setup Instructions

### 1. Initial Setup

```bash
# Copy the example template
cp .env.example .env

# Edit the file with your actual values
nano .env  # or use your preferred editor
```

### 2. Get Required Credentials

#### Supabase

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → API
4. Copy: URL, anon key, project reference ID

#### Suno AI

1. Create account at [suno.ai](https://suno.ai)
2. Navigate to Account Settings → API Keys
3. Generate and copy API key

#### Telegram Bot

1. Open [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` command
3. Follow instructions and copy token
4. Set up Mini App URL

#### Sentry (Optional)

1. Create account at [sentry.io](https://sentry.io)
2. Create new project
3. Copy DSN from Settings → Client Keys

### 3. Configure Environment Variables

Edit `.env` file:

```bash
# Replace placeholder values with your actual credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_actual_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_ref_id

SUNO_API_KEY=sk-your_actual_api_key
TELEGRAM_BOT_TOKEN=1234567890:your_actual_token
MINI_APP_URL=https://your-deployed-app.vercel.app

# Optional
VITE_SENTRY_DSN=https://your@sentry.dsn
```

### 4. Verify Configuration

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Check console for any configuration errors
# Open browser: http://localhost:8080
```

---

## 🌍 Environment-Specific Configuration

### Development Environment

```bash
# .env.development
VITE_APP_ENV=development
VITE_ENABLE_ANALYTICS=false
VITE_DEBUG_TOOLS=true
VITE_TEST_MODE=true
```

### Staging Environment

```bash
# .env.staging
VITE_APP_ENV=staging
VITE_ENABLE_ANALYTICS=true
VITE_DEBUG_TOOLS=false
VITE_TEST_MODE=false
```

### Production Environment

```bash
# .env.production
VITE_APP_ENV=production
VITE_ENABLE_ANALYTICS=true
VITE_DEBUG_TOOLS=false
VITE_TEST_MODE=false
VITE_ENABLE_PERFORMANCE_MONITORING=true
```

---

## 🔍 Troubleshooting

### Common Issues

#### 1. Supabase Connection Failed

**Problem:** `Supabase connection error: Invalid API key`

**Solution:**

- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are correct
- Check keys are copied from Supabase Dashboard → Settings → API
- Ensure project is active on Supabase

#### 2. Suno API Returns 401

**Problem:** `Suno API error: 401 Unauthorized`

**Solution:**

- Verify `SUNO_API_KEY` is correct and active
- Check API key hasn't expired
- Ensure API key is used in Edge Functions, not client-side

#### 3. Telegram Bot Not Responding

**Problem:** `Telegram bot not responding to commands`

**Solution:**

- Verify `TELEGRAM_BOT_TOKEN` is correct
- Check bot is set up properly with BotFather
- Ensure Mini App URL is configured in BotFather

#### 4. Environment Variables Not Loading

**Problem:** `import.meta.env.VITE_* is undefined`

**Solution:**

- Ensure variables have `VITE_` prefix for client-side access
- Restart dev server after adding new variables
- Check `.env` file is in root directory
- Verify file is named exactly `.env` (not `.env.txt`)

#### 5. Sentry Not Working

**Problem:** `Sentry not capturing errors`

**Solution:**

- Verify `VITE_SENTRY_DSN` is set correctly
- Check Sentry project is active
- Ensure `isSentryEnabled` returns `true` in console
- Check browser console for Sentry initialization errors

---

## 📊 Variable Access Patterns

### Client-Side Access (VITE_ prefix)

```typescript
// ✅ Correct - Client-side
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const appVersion = import.meta.env.VITE_APP_VERSION;

// ❌ Wrong - Server-only variables not accessible
const apiKey = import.meta.env.SUNO_API_KEY; // undefined
```

### Server-Side Access (Edge Functions)

```typescript
// ✅ Correct - Server-side
const apiKey = Deno.env.get("SUNO_API_KEY");
const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");

// ❌ Wrong - VITE_ prefix not needed server-side
const url = Deno.env.get("VITE_SUPABASE_URL"); // Don't do this
```

---

## 🔧 Best Practices

### 1. Variable Naming

- Use `UPPER_SNAKE_CASE` for all variables
- Use `VITE_` prefix for client-side variables
- Group related variables with comments
- Provide descriptive examples

### 2. Documentation

- Keep `.env.example` updated
- Document all variables in this file
- Include security warnings for sensitive data
- Provide setup instructions

### 3. Security

- Never commit `.env` file
- Use different credentials per environment
- Rotate API keys regularly
- Monitor for leaked credentials

### 4. Testing

- Test with production-like values in staging
- Verify all required variables are set
- Test error handling for missing variables
- Validate environment on application startup

---

## 📝 Adding New Variables

### Step-by-Step Process

1. **Add to .env.example**

   ```bash
   VITE_NEW_FEATURE=true
   ```

2. **Add to this documentation**

   ```markdown
   | Variable           | Type    | Default | Description        |
   | ------------------ | ------- | ------- | ------------------ |
   | `VITE_NEW_FEATURE` | boolean | `true`  | Enable new feature |
   ```

3. **Add TypeScript validation (if needed)**

   ```typescript
   // src/config/app.config.ts
   export const NEW_FEATURE_ENABLED = import.meta.env.VITE_NEW_FEATURE === "true";
   ```

4. **Update type definitions (if needed)**

   ```typescript
   // vite-env.d.ts
   interface ImportMetaEnv {
     readonly VITE_NEW_FEATURE: string;
   }
   ```

5. **Test in development**

   ```bash
   # Add to .env
   VITE_NEW_FEATURE=true

   # Restart dev server
   npm run dev
   ```

6. **Document usage**
   ```typescript
   // src/hooks/useNewFeature.ts
   /**
    * Check if new feature is enabled
    * Requires VITE_NEW_FEATURE=true
    */
   export function useNewFeature() {
     return import.meta.env.VITE_NEW_FEATURE === "true";
   }
   ```

---

## 📚 Related Documentation

- **[README.md](../README.md)** - Main project documentation
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Development setup guide
- **[docs/ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture
- **[docs/SECURITY_SUMMARY.md](SECURITY_SUMMARY.md)** - Security guidelines
- **[supabase/functions/](../supabase/functions/)** - Edge Functions usage

---

## 🔗 Quick Reference

### Required Variables (Must Set)

```bash
VITE_SUPABASE_URL=✅
VITE_SUPABASE_PUBLISHABLE_KEY=✅
VITE_SUPABASE_PROJECT_ID=✅
SUNO_API_KEY=✅
TELEGRAM_BOT_TOKEN=✅
MINI_APP_URL=✅
```

### Optional Variables (Recommended)

```bash
VITE_SENTRY_DSN=🌟 (error tracking)
VITE_APP_VERSION=🌟 (version display)
VITE_TELEGRAM_BOT_USERNAME=🌟 (deep links)
```

### Feature Flags (Development)

```bash
VITE_FEATURE_MIDI_TRANSCRIPTION=🔧
VITE_FEATURE_ADVANCED_MASTERING=🔧
VITE_FEATURE_AI_MIXING=🔧
```

---

<div align="center">

**Environment variables documentation maintained by MusicVerse AI Team**

_Last Updated: 2026-06-26_

[🏠 Home](../README.md) • [📚 Documentation Index](../DOCUMENTATION_INDEX.md) • [🔧 Contributing](../CONTRIBUTING.md)

</div>
