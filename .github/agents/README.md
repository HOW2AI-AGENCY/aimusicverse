# GitHub Copilot Agents for MusicVerse

This directory contains specialized agent configurations for GitHub Copilot to assist with different aspects of the MusicVerse project.

## Available Agents

### 🗄️ Backend & Database Agent
**File:** `backend-database.md`
- Supabase PostgreSQL database
- Row Level Security (RLS) policies
- Edge Functions (Deno)
- Realtime subscriptions
- Database migrations

### 🔌 API Integration Agent
**File:** `api-integration.md`
- SunoAPI.org integration (music generation)
- Klang.io integration (transcription, chords, beats)
- AuDD integration (music recognition)
- Webhook handling
- Rate limiting and retry logic

### 🎵 Audio & DAW Agent
**File:** `audio-daw.md`
- Web Audio API
- Tone.js for synthesis and effects
- WaveSurfer.js for visualization
- MIDI processing
- Stem mixing and editing

### ⚛️ React & TypeScript Agent
**File:** `react-typescript.md`
- React 19 with hooks
- TypeScript strict mode
- TanStack Query
- Zustand state management
- Framer Motion animations

### 📱 Mobile & Telegram Agent
**File:** `mobile-telegram.md`
- Telegram Mini App SDK
- Mobile-first responsive design
- Touch interactions and gestures
- Safe area handling
- Deep linking

### 🐛 Error Debugger Agent
**File:** `error-debugger.md`
- Runtime error diagnosis
- TypeScript compilation errors
- React rendering issues
- Supabase/Database errors
- Audio playback issues

### ✅ Testing & Quality Agent
**File:** `testing-quality.md`
- Jest / Vitest unit testing
- React Testing Library
- Playwright E2E testing
- Code review best practices
- Security and performance audits

## How to Use

1. Reference the agent in your prompt:
   ```
   @workspace Using backend-database agent, help me create a migration for...
   ```

2. Use agent-specific commands:
   ```
   /db-schema tracks
   /create-migration add_column_to_tracks
   /diagnose "JWT expired error"
   ```

3. Combine agents for complex tasks:
   ```
   Using audio-daw and api-integration agents, implement stem separation with Suno API...
   ```

## Agent Selection Guide

| Task | Recommended Agent |
|------|-------------------|
| Create database table | backend-database |
| Write edge function | backend-database |
| Integrate Suno API | api-integration |
| Add audio visualization | audio-daw |
| Create React component | react-typescript |
| Optimize for mobile | mobile-telegram |
| Debug runtime error | error-debugger |
| Write unit test | testing-quality |
