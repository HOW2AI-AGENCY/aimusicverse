# Auth Page

> **Route:** `/auth`  
> **Module:** Authentication & Onboarding  
> **Generated:** 2026-06-26

## Overview

Auth Page handles Telegram OAuth authentication for the Telegram Mini App. Users authenticate via Telegram Web App SDK, with automatic profile creation and session management.

**Primary Use Cases:**
- Login via Telegram
- First-time user registration
- Session management
- Error handling for auth failures

## Layout

```
┌──────────────────────────┐
│ HEADER: "Music Verse AI"  │
├──────────────────────────┤
│ Auth Flow                │
│ ┌──────────────────────┐ │
│ │ [Telegram Icon]      │ │
│ │ Signing in...        │ │
│ │ [Spinner]            │ │
│ └──────────────────────┘ │
│                          │
│ Error State (if fails)  │
│ ┌──────────────────────┐ │
│ │ Authentication failed │ │
│ │ [Retry]              │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

## Fields

### Loading State

| Element | Type | Notes |
|---------|------|-------|
| Telegram Icon | Animated | Pulsing Telegram logo |
| Message | Text | "Signing in..." |
| Spinner | Component | Loading indicator |

### Error State

| Element | Type | Notes |
|---------|------|-------|
| Error Icon | Icon | Warning or error icon |
| Error Message | Text | User-friendly error message |
| Retry Button | Button | "Try again" |
| Cancel Button | Button | Return to home |

---

## Interactions

### Page Load

**Behavior:**
1. Initialize Telegram WebApp SDK
2. Check URL params for auth token
3. If token present: Exchange for session, navigate to home
4. If no token: Initiate Telegram OAuth flow

**Telegram OAuth Flow:**
1. Check if running in Telegram WebApp context
2. Get user data from Telegram (`Telegram.WebApp.getUserInfo`)
3. Send data to Supabase Edge Function
4. Edge Function creates or updates user profile
5. Returns session token
6. Client stores session, authenticates user
7. Navigate to home (or onboarding if new user)

### Authentication Success

**Trigger:** Successful auth token exchange

**Behavior:**
1. Store session in Supabase auth state
2. Navigate to home page (`/`)
3. If new user: Redirect to onboarding (`/onboarding`)

### Authentication Failure

**Trigger:** Error in auth flow

**Behavior:**
1. Show error state with message
2. Display "Try again" button
3. Log error for debugging
4. User can retry or cancel

## API Dependencies

| API | Method | Path | Trigger | Notes |
|-----|--------|------|---------|-------|
| Telegram Auth | POST | /api/auth/telegram | Page load | Exchange token |
| Get Session | GET | /api/auth/session | Page load | Check existing session |

## Page Relationships

**From:**
- Telegram deep link → `t.me/AIMusicVerseBot/app`
- Protected routes → Redirect when not authenticated
- Manual navigation → `/auth`

**To:**
- `/` (Home) → After successful auth
- `/onboarding` → After auth if new user
- Back → Cancel auth attempt

## Business Rules

1. **Authentication Method:**
   - Telegram OAuth only (no email/password)
   - WebApp SDK integration: Uses `@twa-dev/sdk`
   - Automatic profile creation: New users created on first login

2. **Session Management:**
   - Token storage: Supabase auth state
   - Session expiry: 30 days of inactivity
   - Refresh: Auto-refresh if valid session exists
   - Logout: Clears session, returns to auth

3. **Error Handling:**
   - Network errors: Show retry option
   - Telegram errors: Suggest opening in Telegram app
   - Rate limits: Warn user about too many attempts
   - Server errors: Generic "Try again" message

4. **New User Detection:**
   - Check: Profile creation date equals login time
   - Or: Profile has `onboarding_completed = false`
   - Action: Redirect to onboarding after auth

5. **Security:**
   - CSRF protection: Token validation on server
   - HTTPS only: All auth over encrypted connection
   - Token validation: Server validates Telegram signature
   - Session hijacking prevention: Bind to IP/device (optional)

---

**Next:** [Mobile Player Page](./27-mobile-player.md) → Batch 7 continues
