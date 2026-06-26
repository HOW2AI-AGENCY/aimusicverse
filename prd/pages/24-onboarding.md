# Onboarding Page

> **Route:** `/onboarding`  
> **Module: Authentication & Onboarding  
> **Generated:** 2026-06-26

## Overview

Onboarding Page guides new users through platform setup and first steps. Features multi-step wizard with profile setup, first generation tutorial, and feature introduction. Optimized for new user experience.

**Primary Use Cases:**
- Complete initial profile setup
- Learn basic features through interactive tutorial
- Generate first track with guided assistance
- Understand platform capabilities

## Layout

### Mobile Layout (Stepper)

```
┌──────────────────────────┐
│ Progress: [1/5]           │
│ ═════░░░░░░░░░░░░░░░░░░░│
├──────────────────────────┤
│ Step Content              │
│                          │
│ Step 1: Welcome         │
│ ┌──────────────────────┐ │
│ │ Welcome to MusicVerse!│ │
│ │ Let's set up your     │ │
│ │ profile.              │ │
│ │ [Continue] →         │ │
│ └──────────────────────┘ │
│                          │
│ Step 2: Profile Setup   │
│ [Username input]         │
│ [Avatar selection]       │
│ [Continue] →            │
│                          │
│ Step 3: Features Tour   │
│ [Feature cards]          │
│ [Continue] →            │
│                          │
│ Step 4: First Track    │
│ [Guided generation]     │
│ [Continue] →            │
│                          │
│ Step 5: Ready!        │
│ [Completion message]   │
│ [Go to Library]         │
└──────────────────────────┘
```

## Fields

### Step 1: Welcome

| Element | Type | Notes |
|---------|------|-------|
| Title | Text (H1) | "Welcome to MusicVerse!" |
| Description | Text | Introduction to platform |
| Illustration | Image | Welcome graphic |
| Continue Button | Button | Proceed to next step |

### Step 2: Profile Setup

| Element | Type | Required | Notes |
|---------|------|----------|-------|
| Username | Text input | Yes | Alphanumeric, 3-20 chars |
| Display Name | Text input | No | Public display name |
| Avatar | Image selector | No | Choose from presets |
| Bio | Textarea | No | Short description |

### Step 3: Features Tour

| Element | Type | Notes |
|---------|------|-------|
| Feature Card 1 | Card | Generate music with AI |
| Feature Card 2 | Card | Edit in Studio |
| Feature Card 3 | Card | Share with community |

### Step 4: First Track

| Element | Type | Notes |
|---------|------|-------|
| Quick Generation Form | Component | Simplified generation form |
| Preset Styles | Cards | Pre-built style options |
| Generate Button | Button | Start first generation |
| Loading State | Progress | Generation progress indicator |

### Step 5: Completion

| Element | Type | Notes |
|---------|------|-------|
| Success Message | Text | "You're all set!" |
| Stats Display | Number | Shows: 1 track created |
| CTA Button | Button | "Go to Library" |

---

## Interactions

### Page Load

**Behavior:**
1. Check if user has completed onboarding via profile flag
2. If completed: Redirect to home page
3. If not: Initialize step state (step 1)
4. Setup Telegram Back Button (returns to home, but can exit onboarding)

**API Calls:**
- `GET /api/profiles/{userId}` — Check onboarding status

### Step Navigation

**Next Button:**
- **Trigger:** Click "Continue" button
- **Behavior:**
  - Validate current step inputs
  - Save progress to localStorage
  - Advance to next step
  - Show step progress update

**Back Button:**
- **Trigger:** Click back button in header
- **Behavior:**
  - Return to previous step
  - Restore step state from localStorage
  - Update progress indicator

### Profile Setup (Step 2)

**Trigger:** Click "Continue" after entering username

**Validation:**
- Username required: Min 3 chars, max 20 chars
- Format: Alphanumeric and underscore only
- Unique: Check availability (API call)

**API Call:**
- `PATCH /api/profiles/{userId}` — Update profile

### Complete Onboarding

**Trigger:** Click "Go to Library" button (step 5)

**Behavior:**
1. Call API to mark onboarding complete
2. Navigate to `/library`
3. Show success toast: "Onboarding complete!"

**API Call:**
- `PATCH /api/profiles/{userId}` — Set `onboarding_completed = true`

### Skip Onboarding

**Trigger:** Click skip button (optional, not shown in current code)

**Behavior:**
1. Show confirmation: "Skip onboarding?"
2. User confirms
3. Mark onboarding as complete
4. Navigate to home page

## API Dependencies

| API | Method | Path | Trigger | Notes |
|-----|--------|------|---------|-------|
| Check Onboarding Status | GET | /api/profiles/{userId} | Page load | Returns onboarding_completed flag |
| Update Profile | PATCH | /api/profiles/{userId} | Step 2 continue | Save username/avatar |
| Complete Onboarding | PATCH | /api/profiles/{userId} | Final step | Set onboarding_completed = true |

## Page Relationships

**From:**
- `/auth` → After first login (if new user)
- `/` (Home) → Redirect if onboarding not complete

**To:**
- `/library` → After completion
- `/` (Home) → Skip onboarding

**Data Coupling:**
- Progress: Saved to localStorage (restored on return)
- Profile data: Synced with database on each step
- Completion flag: Stored in profile, checked on next visit

## Business Rules

1. **Onboarding Trigger:**
   - New users: Redirected after first auth
   - Check: `profile.onboarding_completed === false`
   - Skip: If user refreshes, don't restart onboarding

2. **Step Validation:**
   - Step 1 (Welcome): No validation, always proceed
   - Step 2 (Profile): Username required and unique
   - Step 3 (Tour): No validation, informational only
   - Step 4 (First Track): Generation must complete
   - Step 5 (Complete): No validation

3. **Progress Persistence:**
   - Storage: localStorage
   - Restoration: On page reload or back navigation
   - Expiry: Cleared after onboarding completion

4. **Profile Setup Rules:**
   - Username: Must be unique platform-wide
   - Display name: Optional (defaults to Telegram name)
   - Avatar: Presets only (no upload during onboarding)
   - Bio: Optional (can add later in settings)

5. **First Generation Guidance:**
   - Simplified form: Only basic fields (title, style)
   - Preset styles: Pre-configured options for easy selection
   - Credit check: Warn if insufficient credits
   - Success celebration: Special success animation for first track

6. **Features Tour:**
   - Interactive: Cards are clickable to learn more
   - Depth: High-level overview only (detailed guides in blog/help)
   - Skipable: Can skip tour and return later
   - Completion: Tour counted as complete after viewing all cards

7. **Mobile Optimizations:**
   - Touch targets: Minimum 44×44px
   - Swipe gestures: Not implemented (uses button navigation)
   - Safe areas: Padding for notch/island
    - Keyboard handling: Adapts when keyboard open
    - Haptic feedback: On step transitions

8. **Completion Criteria:**
   - All steps completed OR user skips
   - First generation: Must complete successfully (or skipped)
   - Profile setup: Username is required field
   - Flag update: Server-side `onboarding_completed` set to true

9. **Re-onboarding:**
   - Not supported: Users only see onboarding once
   - Profile reset: Cannot reset onboarding (one-time flow)
   - Tutorials: Available elsewhere (blog, help center)

10. **Telegram Integration:**
    - Bot command: `/start` can trigger onboarding
    - Deep link: `startapp=onboarding` opens onboarding flow
    - Context: Telegram username pre-filled if available

---

**Next:** [Analytics Page](./25-analytics.md) → Batch 7 continues
