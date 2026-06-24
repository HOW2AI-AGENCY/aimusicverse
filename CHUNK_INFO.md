# Codebase Chunk Information

This document defines the chunk structure for the MusicVerse AI codebase analysis.

## Total Chunks: 24

The codebase is divided into 24 logical chunks to enable parallel analysis and processing.

## Chunk Definitions 16-24

### Chunk 16: Player & Audio Components
- **Focus**: Audio player, waveform visualization, and audio-related UI components
- **Files**: 
  - `src/components/player/` - All player components (CompactPlayer, ExpandedPlayer, MobileFullscreenPlayer)
  - `src/components/waveform/` - Waveform visualization components
  - `src/components/audio/` - Audio-specific components
  - `src/components/audio-hub/` - Audio hub interface
  - `src/components/audio-record/` - Audio recording components
  - `src/components/audio-reference/` - Audio reference management
- **Approximate Files**: ~150

### Chunk 17: Studio & Stem Processing
- **Focus**: Music studio interface and stem separation features
- **Files**:
  - `src/components/studio/` - Studio components (excluding unified studio)
  - `src/components/studio/unified/` - Unified studio components
  - `src/components/stem-studio/` - Stem separation and mixing interface
  - `src/components/melody-mixer/` - Melody mixing components
- **Approximate Files**: ~200

### Chunk 18: Lyrics & Content Creation
- **Focus**: Lyrics editing, content generation, and text processing
- **Files**:
  - `src/components/lyrics/` - Lyrics display components
  - `src/components/lyrics-workspace/` - Lyrics editing workspace
  - `src/components/generation/` - Music generation interface
  - `src/components/generate-form/` - Generation form modules
  - `src/components/prompt-dj/` - Prompt engineering for generation
- **Approximate Files**: ~180

### Chunk 19: Library, Discovery & Navigation
- **Focus**: Content browsing, search, and navigation
- **Files**:
  - `src/components/library/` - Track library with virtualization
  - `src/components/discovery/` - Content discovery features
  - `src/components/navigation/` - Navigation components
  - `src/components/home/` - Home page components
  - `src/components/track/` - Track display components
  - `src/components/track-detail/` - Track detail views
- **Approximate Files**: ~220

### Chunk 20: Social, Community & Engagement
- **Focus**: Social features, user interaction, and engagement
- **Files**:
  - `src/components/social/` - Social sharing and interaction
  - `src/components/community/` - Community features
  - `src/components/engagement/` - User engagement components
  - `src/components/comments/` - Comment system
  - `src/components/announcements/` - Announcement system
  - `src/components/artist/` - Artist profile and features
- **Approximate Files**: ~160

### Chunk 21: Admin, Analytics & Professional Features
- **Focus**: Admin dashboard, analytics, and professional tools
- **Files**:
  - `src/components/admin/` - All admin components (analytics, dashboard, economy, features, subscription)
  - `src/components/analytics/` - Analytics components
  - `src/components/professional/` - Professional features
  - `src/components/analysis/` - Analysis tools
  - `src/components/chord-detection/` - Chord detection features
  - `src/components/guitar/` - Guitar-specific features
- **Approximate Files**: ~140

### Chunk 22: Mobile, Platform Integration & Special Features
- **Focus**: Mobile-specific components, Telegram integration, and specialized features
- **Files**:
  - `src/components/mobile/` - Mobile-specific components
  - `src/components/telegram/` - Telegram integration
  - `src/components/debug/` - Debug tools
  - `src/components/errors/` - Error handling components
  - `src/components/offline/` - Offline functionality
  - `src/components/performance/` - Performance monitoring
  - `src/components/screenshot/` - Screenshot functionality
- **Approximate Files**: ~120

### Chunk 23: Layout, UI Components & Shared Elements
- **Focus**: Layout system, reusable UI components, and shared elements
- **Files**:
  - `src/components/layout/` - Layout components
  - `src/components/ui/` - shadcn/ui base components and custom UI components
  - `src/components/dialog/` - Dialog components
  - `src/components/dialogs/` - Various dialog implementations
  - `src/components/shared/` - Shared/reusable components
  - `src/components/common/` - Common utility components
  - `src/components/lazy/` - Lazy-loaded components
  - `src/components/loading/` - Loading states
  - `src/components/skeletons/` - Skeleton loaders
- **Approximate Files**: ~250

### Chunk 24: Settings, Payment, Onboarding & Supporting Features
- **Focus**: User settings, payments, onboarding, and supporting features
- **Files**:
  - `src/components/settings/` - Settings interface
  - `src/components/payment/` - Payment components
  - `src/components/payments/` - Additional payment features
  - `src/components/premium/` - Premium features
  - `src/components/onboarding/` - User onboarding
  - `src/components/help/` - Help system
  - `src/components/notifications/` - Notification system
  - `src/components/profile/` - User profile components
  - `src/components/branding/` - Branding components
  - `src/components/theme/` - Theme management
  - `src/components/blog/` - Blog components
  - `src/components/beta/` - Beta features
  - `src/components/cloud/` - Cloud features
  - `src/content-hub/` - Content management
  - `src/components/upload/` - Upload functionality
  - `src/components/workflows/` - Workflow components
  - `src/components/project/` - Project management
  - `src/components/music-graph/` - Music graph visualization
  - `src/components/music-lab/` - Music lab features
  - `src/components/music-recognition/` - Music recognition
  - `src/components/recording/` - Recording features
  - `src/components/tab-editor/` - Tab editor
  - `src/components/track-actions/` - Track action menus
  - `src/components/track-menu/` - Track menu components
  - `src/components/cover/` - Cover generation
  - `src/components/actors/` - Actor components
  - `src/components/drum-machine/` - Drum machine
  - `src/components/gamification/` - Gamification features
  - `src/components/hints/` - Hint system
  - `src/components/popups/` - Popup components
  - `src/components/suno/` - Suno AI integration
  - `src/components/playlist/` - Playlist components
- **Approximate Files**: ~200

## Chunks 1-15 (Defined Elsewhere)
1. Core Architecture & Configuration
2. API Layer (13 files)
3. Service Layer (13 files)
4. Hooks (200+ files)
5. Global State (Zustand stores)
6. Context Providers (10 files)
7. Utility Functions (lib/)
8. Types & Interfaces
9. Pages (40+ files)
10. Public Routes
11. Authenticated Routes
12. Admin Routes
13. Test Infrastructure
14. Build Configuration
15. Documentation & Root Files

## File Count Summary
- Total TypeScript/TSX files: ~1959
- Files per chunk (average): ~82
- Chunks 16-24 focus on: Components (~1200 files)
- Largest chunk: Chunk 23 (UI/Layout components, ~250 files)
- Smallest chunk: Chunk 22 (Platform integration, ~120 files)

## Usage
When analyzing chunks 16-24:
1. Use CHUNK_INFO.md to understand chunk boundaries
2. Use individual chunk file lists (CHUNK_16_FILES.md through CHUNK_24_FILES.md)
3. Each chunk is designed to be analyzed independently
4. Chunks are organized by feature domain for logical coherence

## Generation Date
2026-06-25