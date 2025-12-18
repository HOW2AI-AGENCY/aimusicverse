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

## Code Quality Notes
- Some direct `date-fns` imports (should use `@/lib/date-utils`)
- Some direct `framer-motion` imports (should use `@/lib/motion`)
