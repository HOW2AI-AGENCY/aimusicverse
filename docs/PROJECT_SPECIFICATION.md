# MusicVerse AI Platform Specification

**Version:** 2.0  
**Last Updated:** 2025-12-05  
**Status:** Active / Production

## Overview

MusicVerse AI is a Telegram Mini App for AI-powered music creation using Suno AI v5. The platform enables users to generate, organize, and share music with advanced AI features.

## Core Features

### 1. Music Generation (P1)
- Text prompt to music generation via Suno AI v5
- A/B versioning - each generation creates two versions
- Streaming preview during generation
- Custom mode with full lyrics/style control
- AI-assisted lyrics wizard (5-step pipeline)
- Style prompt boost (Russian language, 450 char limit)
- Form draft auto-save with 30-minute expiry

### 2. Track Library (P1)
- Virtualized infinite scroll (react-virtuoso)
- Grid/List view toggle (list default on mobile)
- Lazy-loaded cover images with blur placeholder
- Real-time generation progress skeletons
- A/B version inline switcher
- Swipe actions on mobile (queue, version switch)
- Like/unlike with optimistic updates

### 3. Playlist System (P2)
- Create, edit, delete playlists
- Drag-drop track reordering
- AI-generated playlist covers
- Auto-generated genre playlists from community
- Telegram deep link sharing
- Auto-updated stats (track count, duration)

### 4. AI Artist System (P2)
- Create AI artist personas
- AI portrait generation
- Artist-linked track generation
- Public artist discovery page

### 5. Stem Separation Studio (P2)
- Vocal/instrumental separation
- Multi-stem mode (drums, bass, guitar, etc.)
- Per-stem volume/mute controls
- Stem download (MP3/WAV, ZIP)
- Use stem as generation reference

### 6. Audio Player (P1)
- Global audio provider (single audio element)
- Compact/Expanded/Fullscreen modes
- Mobile-optimized fullscreen with lyrics
- Synchronized lyrics with auto-scroll
- Play queue with Play Next/Add to Queue
- Version playback modes (active-only, all-versions)

### 7. Telegram Integration (P1)
- Mini App SDK integration
- Native sharing (Stories, Messages)
- Deep linking (tracks, playlists, studio)
- Inline query track search
- Bot notifications for generation completion
- File ID caching for media reuse
- Portrait orientation lock

### 8. Music Projects (P2)
- Project-based track organization
- Plan tracks with style/tags/notes
- Generate from plan with pre-filled data
- Track status progression (draft → in_progress → completed)

### 9. User Onboarding (P3)
- 9-step guided tour
- Feature highlights with navigation
- One-time display with manual restart option

## Technical Architecture

### Frontend Stack
- React 19 + TypeScript 5
- Vite build system
- Tailwind CSS + shadcn/ui
- TanStack Query (optimized caching)
- Zustand state management
- Framer Motion animations
- react-virtuoso list virtualization

### Backend (Lovable Cloud)
- PostgreSQL database with RLS
- Supabase Edge Functions
- Supabase Storage for media
- Realtime subscriptions

### Key Optimizations
- Single consolidated public content query
- 30-60s staleTime, 10-15min gcTime
- Lazy image loading with blur
- Virtualized lists for 100+ items
- Batch version/stem count queries

## Database Schema

### Core Tables
| Table | Purpose |
|-------|---------|
| tracks | Main track data |
| track_versions | A/B versions |
| track_stems | Separated stems |
| track_change_log | Audit trail |
| playlists | User playlists |
| playlist_tracks | Playlist associations |
| artists | AI artist personas |
| audio_analysis | Music analysis |
| generation_tasks | Job tracking |
| profiles | User data |
| track_likes | Like tracking |

### Key Fields
- `tracks.active_version_id` - Current active version
- `track_versions.is_primary` - Primary version flag
- `track_versions.version_label` - A/B label
- `tracks.has_stems` - Stems available
- `profiles.is_public` - Profile visibility

## API Integrations

### Suno AI v5
- Music generation with prompts
- Stem separation
- Streaming preview
- 500 char prompt limit (non-custom mode)

### Telegram Bot API
- SendAudio with FormData
- MarkdownV2 formatting
- Inline query results
- Deep link handling

### Lovable AI
- Playlist cover generation (gemini-3-pro-image-preview)
- Artist portrait generation
- Style prompt boost (gemini-2.5-flash)

## Success Metrics

| Metric | Target |
|--------|--------|
| Page load | < 2s on 4G |
| Audio start | < 500ms |
| Generation submit | 95% success |
| Concurrent users | 100+ |

## Security Requirements

- RLS on all user tables
- `is_public` field for visibility control
- Telegram auth validation
- Input validation client + server
- No secrets in client code

## Mobile-First Design

- 44px minimum touch targets
- Portrait orientation lock
- Swipe gestures for quick actions
- Compact list view default
- Responsive breakpoints

---

**Contact:** @AIMusicVerseBot on Telegram
