# Code Cleanup Priorities

**Updated:** 2025-12-18

## ✅ Completed Improvements

### Phase 1: Quick Wins
- ✅ Character counter fix - LyricsValidator excludes tags, shows `characterCountWithTags`
- ✅ Debouncing for validateLyrics() - 500ms debounce already implemented
- ✅ Trending/Popular algorithms - using `trending_score`, `quality_score`, `approved_tracks_count`
- ✅ Type guards for section tags - `VALID_SECTION_TAGS`, `isValidSectionTag()`, `sanitizeLyrics()`

### Phase 2: UX Improvements
- ✅ Version Context in TrackDetailSheet - HeaderVersionSelector component
- ✅ Draft Auto-Save in GenerateSheet - via useGenerateDraft hook
- ✅ Direct Studio Access from TrackCard - Wand2 button with tooltip

### Phase 3: Technical Debt
- ✅ Track Cleanup on Delete - deleteTrackWithCleanup in tracks.service.ts
- ✅ Sentry Integration - @sentry/react with conditional initialization (add VITE_SENTRY_DSN)

## 🔄 Remaining Work

### Phase 2: UX (Completed)
- ✅ Comment Reporting - ReportCommentDialog with moderation_reports integration
- ✅ Breadcrumbs Navigation - src/components/navigation/Breadcrumbs.tsx

### Phase 4: New Features
- ✅ Generation History Database - `user_generation_history` table + `useGenerationHistory` hook
- ✅ set-music-profile Edge Function - Send track to Telegram for profile music setup
- ✅ Telegram Home Screen Shortcuts - `ShortcutsPanel` component for quick access
- ✅ Multi-Track File Upload - `MultiTrackUpload` component for batch audio upload

### Phase 5: Audit & Deposition System
- ✅ Content Audit Log - `content_audit_log` table for tracking all user/AI actions
- ✅ Content Deposits - `content_deposits` table for proof-of-creation documents
- ✅ Audit Edge Function - `audit-log` function with SHA-256 hashing
- ✅ useAuditLog Hook - Frontend hook for logging and proof generation
- ✅ Track Generation Audit - Integrated into `suno-music-callback`
- ✅ Lyrics Generation Audit - Integrated into `generate-lyrics`
- ✅ Cover Generation Audit - Integrated into `generate-track-cover`
- ✅ Artist Portrait Audit - Integrated into `generate-artist-portrait`
- ✅ Project AI Actions Audit - Integrated into `project-ai-actions`
- ✅ Project/Artist Creation Audit - Integrated into useProjects/useArtists hooks

## Code Quality Notes
- Some direct `date-fns` imports (should use `@/lib/date-utils`)
- Some direct `framer-motion` imports (should use `@/lib/motion`)
