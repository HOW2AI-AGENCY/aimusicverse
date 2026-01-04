# MusicVerse AI - Comprehensive Architecture Documentation

**Last Updated**: 2026-01-04
**Document Version**: 2.0
**Audience**: Developers, System Architects, Technical Stakeholders

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Technology Stack](#technology-stack)
4. [Frontend Architecture](#frontend-architecture)
5. [Backend Architecture](#backend-architecture)
6. [Data Architecture](#data-architecture)
7. [Integration Architecture](#integration-architecture)
8. [State Management](#state-management)
9. [Audio Architecture](#audio-architecture)
10. [Security Architecture](#security-architecture)
11. [Performance Optimization](#performance-optimization)
12. [Deployment Architecture](#deployment-architecture)

---

## Executive Summary

MusicVerse AI is a production-grade, AI-powered music creation platform built as a Telegram Mini App. The system leverages modern web technologies and cloud infrastructure to deliver professional music creation tools directly within Telegram.

### Key Metrics
- **Components**: 828 React components
- **Custom Hooks**: 263 hooks (48,812 lines)
- **Edge Functions**: 100+ serverless functions
- **Database Tables**: 30+ with Row-Level Security
- **Bundle Size**: ~500KB (Brotli compressed)
- **Test Coverage**: Unit, Integration, E2E tests
- **Performance**: Lighthouse CI integrated

### Core Capabilities
1. **AI Music Generation**: Suno AI v5 integration with 174+ meta tags
2. **Advanced Audio Processing**: Stem separation, mixing, effects
3. **Real-time Collaboration**: WebSocket-based real-time updates
4. **Mobile-First Design**: Optimized for Telegram Mini App
5. **Scalable Infrastructure**: Serverless edge functions

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     TELEGRAM MINI APP                        │
│                    (React 19 Frontend)                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   UI Layer   │  │  State Mgmt  │  │ Audio Engine │     │
│  │  828 Comps   │  │    Zustand   │  │   Tone.js    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   API Gateway   │
                    │ (Edge Functions)│
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼─────┐     ┌───────▼──────┐    ┌───────▼──────┐
   │PostgreSQL│     │ Suno AI v5   │    │Telegram API  │
   │Database  │     │Music Gen API │    │Bot Platform  │
   └──────────┘     └──────────────┘    └──────────────┘
```

### Data Flow Patterns

#### 1. Music Generation Flow
```
User Input → Form Validation → Edge Function → Suno API
    ↓                                               ↓
LocalStorage Draft                          Streaming Preview
    ↓                                               ↓
Auto-save (30min)                          Database Write
    ↓                                               ↓
Resume Session                            Telegram Notification
```

#### 2. Real-time Audio Flow
```
Track Selection → Global Audio Provider → HTMLAudioElement
                         ↓
                  Player Store (Zustand)
                         ↓
        ┌────────────────┴────────────────┐
        ▼                ▼                ▼
   Compact Player  Expanded Player  Fullscreen Player
        ↓                ▼                ▼
   Position Sync    Lyrics Sync     Visualizer
```

#### 3. State Synchronization Flow
```
User Action → Optimistic UI Update → Edge Function → Database
                     ↓                                    ↓
              Show Loading State                  Real-time Channel
                     ↓                                    ↓
              Haptic Feedback ← Confirmation ← React Query Cache
                                                          ↓
                                                   UI Re-render
```

---

## Technology Stack

### Frontend Stack

#### Core Framework
- **React 19** (latest) - Component library with concurrent features
- **TypeScript 5.9** - Static typing and enhanced developer experience
- **Vite 5.0** - Lightning-fast build tool and dev server

#### UI & Styling
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **shadcn/ui** - Accessible component primitives (25+ Radix UI components)
- **Framer Motion 12** - Advanced animation library
- **React Spring** - Physics-based animations
- **Lucide React** - Icon library (555 icons)

#### State Management
- **Zustand 5.0** - Lightweight global state (player, studio, lyrics)
- **TanStack Query 5.90** - Server state management with caching
- **React Hook Form 7.67** - Performant form state
- **Zod 4.1** - TypeScript-first schema validation

#### Audio & Music
- **Tone.js 14.9** - Web Audio API framework for synthesis
- **WaveSurfer.js 7.8** - Waveform visualization
- **OpenSheetMusicDisplay 1.9** - Music notation rendering
- **@tonejs/midi 2.0** - MIDI file parsing and playback
- **lamejs 1.2** - MP3 encoding in browser

### Backend Stack

#### Platform
- **Lovable Cloud** - Supabase-based backend platform
- **PostgreSQL** - Primary database with JSONB support
- **Edge Functions** - Deno-based serverless functions (100+)
- **Supabase Storage** - Object storage for audio files

#### External Services
- **Suno AI v5** - Music generation API
- **Telegram Bot API** - Bot commands and notifications
- **Telegram Mini App SDK 8.0** - Native app integration

### Development Tools

#### Testing
- **Jest 30.2** - Unit testing framework
- **Playwright 1.57** - E2E testing
- **Vitest 4.0** - Alternative test runner with browser support
- **@testing-library/react 16.3** - React component testing

#### Quality
- **ESLint** - Code quality and consistency
- **Prettier** - Code formatting
- **TypeScript Strict Mode** - Maximum type safety
- **Lighthouse CI** - Performance monitoring

#### Build Optimization
- **Rollup** - Module bundler with tree-shaking
- **Terser** - JavaScript minification
- **vite-plugin-compression** - Gzip/Brotli compression
- **size-limit** - Bundle size monitoring

---

## Frontend Architecture

### Component Hierarchy

```
App (Router + Providers)
├── ErrorBoundary (Global error handling)
├── QueryClientProvider (TanStack Query)
├── ThemeProvider (Dark/Light mode)
├── TelegramProvider (Mini App SDK)
├── AuthProvider (User authentication)
├── GuestModeProvider (Demo mode)
├── GlobalAudioProvider (Single audio element)
├── NotificationProvider (Toast system)
├── AnnouncementProvider (Global announcements)
├── GamificationProvider (Achievements/XP)
└── BrowserRouter
    ├── NavigationProvider (Navigation state)
    └── Routes
        ├── MainLayout (With BottomNavigation)
        │   ├── ProfileSetupGuard
        │   └── Pages (33+ route components)
        └── Standalone Routes (Studio V2, Auth, Error)
```

### Component Organization

#### Directory Structure
```
src/components/
├── ui/                    # shadcn/ui primitives (50+ components)
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── sheet.tsx
│   └── ...
├── player/                # Audio player components
│   ├── CompactPlayer.tsx
│   ├── ExpandedPlayer.tsx
│   ├── MobileFullscreenPlayer.tsx
│   ├── LyricsDisplay.tsx
│   └── QueuePanel.tsx
├── library/               # Track library components
│   ├── TrackCard.tsx      # 27KB - Complex component
│   ├── TrackRow.tsx
│   ├── TrackFilters.tsx
│   └── VirtualizedTrackList.tsx
├── generate-form/         # Music generation
│   ├── GenerateSheet.tsx
│   ├── lyrics-chat/       # AI Lyrics Assistant
│   ├── StyleSelector.tsx
│   └── MetaTagsSelector.tsx
├── stem-studio/           # Stem separation & mixing
│   ├── core/              # Core components
│   ├── hardware/          # Hardware studio
│   └── mobile/            # Mobile optimized
├── studio-v2/             # Unified Studio V2
│   ├── UnifiedStudioPage.tsx
│   ├── StudioHubPage.tsx
│   └── components/
├── admin/                 # Admin dashboard
│   ├── AdminDashboard.tsx
│   ├── UserManagement.tsx
│   └── Analytics.tsx
└── ... (92 total subdirectories)
```

#### Component Patterns

**1. Lazy Loading Pattern**
```typescript
// App.tsx
const Library = lazy(() => import("./pages/Library"));
const Projects = lazy(() => import("./pages/Projects"));
const AdminDashboard = lazy(() => import(
  /* webpackChunkName: "admin" */ "./pages/AdminDashboard"
));

<Suspense fallback={<LoadingScreen />}>
  <Routes>
    <Route path="/library" element={<Library />} />
  </Routes>
</Suspense>
```

**2. Compound Component Pattern**
```typescript
// TrackCard component
export const TrackCard = ({ track }) => (
  <Card>
    <TrackCard.Image src={track.cover_url} />
    <TrackCard.Content>
      <TrackCard.Title>{track.title}</TrackCard.Title>
      <TrackCard.Artist>{track.artist}</TrackCard.Artist>
    </TrackCard.Content>
    <TrackCard.Actions track={track} />
  </Card>
);
```

**3. Render Props Pattern**
```typescript
// VirtualizedList
<Virtuoso
  data={tracks}
  itemContent={(index, track) => (
    <TrackRow track={track} index={index} />
  )}
/>
```

### Custom Hooks Architecture

#### Hook Categories (13 categories, 263 hooks)

**Audio System** (`src/hooks/audio/` - 25+ hooks)
- Player state and control
- Playback queue management
- Audio visualization and analysis
- Performance monitoring

**Studio & Production** (`src/hooks/studio/` - 28+ hooks)
- Multi-track audio engine
- Effects chain processing
- Mix export and rendering
- MIDI synchronization

**Generation** (`src/hooks/generation/` - 8+ hooks)
- Form management with auto-save
- Progress tracking
- Task synchronization
- Failed generation recovery

**Social & Engagement** (`src/hooks/social/` - 8+ hooks)
- Following system
- Activity feed
- Comments and likes
- User blocking

**Detailed Hook Documentation**: See `/docs/HOOKS_REFERENCE.md`

### Routing Architecture

#### Route Structure
```typescript
// Protected routes with MainLayout (BottomNavigation)
<Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
  <Route path="/" element={<Index />} />
  <Route path="/library" element={<Library />} />
  <Route path="/projects" element={<Projects />} />
  <Route path="/artists" element={<Artists />} />
  // ... 30+ more routes
</Route>

// Standalone routes without navigation
<Route path="/studio-v2/:projectId" element={
  <ProtectedRoute><UnifiedStudioPage /></ProtectedRoute>
} />

// Public routes
<Route path="/auth" element={<Auth />} />
```

#### Deep Linking
```typescript
// Telegram deep link format
t.me/AIMusicVerseBot/app?startapp=track_<trackId>
t.me/AIMusicVerseBot/app?startapp=playlist_<playlistId>
t.me/AIMusicVerseBot/app?startapp=studio_<projectId>

// Handled by DeepLinkHandler component
<DeepLinkHandler />  // Parses Telegram WebApp start_param
```

---

## Backend Architecture

### Edge Functions Overview

Total: **100+ functions** organized by domain

#### Core Categories

**1. Music Generation** (suno-*.ts)
- `suno-music-generate` - Main generation function
- `suno-remix` - Track remixing
- `suno-extend` - Track extension
- `suno-separate-vocals` - Vocal separation
- `suno-credits` - Credit management
- `suno-convert-wav` - Audio conversion
- `suno-upload-cover` - Cover image upload

**2. AI Assistants** (ai-*.ts)
- `ai-lyrics-assistant` - Lyrics AI helper (10+ tools)
- `ai-lyrics-edit` - Lyrics editing AI
- `ai-blog-assistant` - Blog content generation

**3. Audio Analysis** (analyze-*.ts)
- `analyze-audio` - BPM, key, genre detection
- `analyze-audio-flamingo` - Advanced analysis
- `analyze-music-emotion` - Emotion mapping
- `analyze-reference-audio` - Reference comparison
- `analyze-track-context` - Track context analysis

**4. Telegram Integration** (telegram-*.ts, bot-*.ts)
- `telegram-auth` - Authentication validation
- `bot-api` - Bot command handler
- `broadcast-notification` - Push notifications
- `broadcast-feature` - Feature announcements

**5. Transcription** (transcribe-*.ts)
- `transcribe-lyrics` - Speech to lyrics
- `transcribe-midi` - Audio to MIDI
- `extract-lyrics-from-stem` - Lyric extraction

**6. System & Admin** (various)
- `health-check` - System health monitoring
- `health-alert` - Health alerts
- `audit-log` - Activity logging
- `archive-old-activities` - Data archival
- `cleanup-stale-tasks` - Cleanup tasks
- `cleanup-orphaned-data` - Data cleanup
- `send-admin-message` - Admin messaging

**7. Payment** (stars-*.ts)
- `stars-webhook` - Telegram Stars webhook
- `stars-admin-transactions` - Transaction tracking

### Edge Function Pattern

```typescript
// Typical edge function structure
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

// CORS headers for Mini App
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Invalid user');

    // Business logic
    const { data, error } = await performOperation();

    // Return response
    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### Database Functions & Triggers

#### RPC Functions
```sql
-- Example: Get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_id UUID)
RETURNS TABLE (
  total_tracks INT,
  total_plays INT,
  total_likes INT,
  followers_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT t.id)::INT,
    SUM(t.play_count)::INT,
    SUM(t.likes_count)::INT,
    COUNT(DISTINCT f.follower_id)::INT
  FROM tracks t
  LEFT JOIN user_follows f ON f.followed_id = user_id
  WHERE t.user_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Database Triggers
```sql
-- Auto-update playlist track count
CREATE TRIGGER update_playlist_count
AFTER INSERT OR DELETE OR UPDATE ON playlist_tracks
FOR EACH ROW EXECUTE FUNCTION update_playlist_track_count();

-- Increment play count
CREATE TRIGGER increment_play_count
AFTER INSERT ON track_plays
FOR EACH ROW EXECUTE FUNCTION increment_track_plays();
```

---

## Data Architecture

### Entity Relationship Overview

```
users (profiles)
  ├── 1:N → tracks (music creations)
  │    ├── 1:N → track_versions (A/B versions)
  │    ├── 1:1 → audio_analysis (BPM, key, genre)
  │    ├── 1:N → track_stems (separated audio)
  │    ├── 1:N → track_likes (engagement)
  │    ├── 1:N → track_comments (social)
  │    └── M:N → playlists (via playlist_tracks)
  ├── 1:N → playlists (collections)
  ├── 1:N → artists (AI personas)
  ├── 1:N → music_projects (organization)
  ├── 1:N → generation_tasks (AI generation)
  └── 1:N → user_follows (social graph)
```

### Core Tables

#### Users & Profiles
```sql
-- profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  telegram_id TEXT UNIQUE,
  username TEXT,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  is_public BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tracks & Versions
```sql
-- Main tracks table
CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  active_version_id UUID,  -- Fast lookup for current version
  title TEXT NOT NULL,
  prompt TEXT,
  is_public BOOLEAN DEFAULT false,
  has_stems BOOLEAN DEFAULT false,
  play_count INT DEFAULT 0,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Version system (A/B variants)
CREATE TABLE track_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  version_label TEXT DEFAULT 'A',  -- 'A' or 'B'
  is_primary BOOLEAN DEFAULT false,
  audio_url TEXT,
  cover_url TEXT,
  duration NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Changelog for auditing
CREATE TABLE track_change_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  old_version_id UUID REFERENCES track_versions(id),
  new_version_id UUID REFERENCES track_versions(id),
  change_type TEXT NOT NULL,  -- 'version_switch', 'edit', etc.
  changed_by UUID REFERENCES profiles(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Audio Analysis
```sql
CREATE TABLE audio_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  bpm NUMERIC,
  key_signature TEXT,
  genre TEXT[],
  mood TEXT[],
  energy NUMERIC,  -- 0-1 scale
  valence NUMERIC, -- 0-1 scale (happiness)
  arousal NUMERIC, -- 0-1 scale (energy)
  structure JSONB,  -- Verse, Chorus, Bridge sections
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Social Features
```sql
-- Following system
CREATE TABLE user_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES profiles(id),
  followed_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, followed_id)
);

-- Comments with threading
CREATE TABLE track_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  parent_id UUID REFERENCES track_comments(id),  -- For threading
  content TEXT NOT NULL,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Likes (denormalized)
CREATE TABLE track_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(track_id, user_id)
);
```

### Row-Level Security (RLS) Policies

#### Public Content Policy
```sql
-- Anyone can read public tracks
CREATE POLICY "Public tracks are viewable by everyone"
ON tracks FOR SELECT
USING (is_public = true);

-- Users can read their own tracks
CREATE POLICY "Users can view own tracks"
ON tracks FOR SELECT
USING (auth.uid() = user_id);
```

#### Write Policies
```sql
-- Users can only insert their own tracks
CREATE POLICY "Users can insert own tracks"
ON tracks FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own tracks
CREATE POLICY "Users can update own tracks"
ON tracks FOR UPDATE
USING (auth.uid() = user_id);
```

#### Security-Definer Functions
```sql
-- Safely increment play count (bypasses RLS)
CREATE OR REPLACE FUNCTION increment_play_count(track_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE tracks
  SET play_count = play_count + 1
  WHERE id = track_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Integration Architecture

### Suno AI Integration

#### API Flow
```typescript
// 1. Frontend initiates generation
const generateMusic = async (prompt: string, style: string) => {
  const { data, error } = await supabase.functions.invoke('suno-music-generate', {
    body: { prompt, style, custom_mode: false }
  });
  return data;
};

// 2. Edge function calls Suno API
const response = await fetch('https://api.suno.ai/v1/generate', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${SUNO_API_KEY}` },
  body: JSON.stringify({ prompt, style })
});

// 3. Suno returns task ID and streaming URL
const { id, streaming_url } = await response.json();

// 4. Database task created
await supabase.from('generation_tasks').insert({
  user_id,
  task_id: id,
  streaming_url,
  status: 'processing'
});

// 5. Frontend subscribes to real-time updates
supabase
  .channel(`generation-${taskId}`)
  .on('postgres_changes', { ... }, (payload) => {
    // Update UI with progress
  });

// 6. Webhook receives completion
// POST to /suno-webhook
// Creates track + 2 versions (A/B)
// Sends Telegram notification
```

#### Streaming Preview
```typescript
// Play streaming preview while generation in progress
const { streaming_url } = generationTask;
if (streaming_url) {
  audioRef.current.src = streaming_url;
  audioRef.current.play();
}
```

### Telegram Integration

#### Authentication Flow
```typescript
// 1. User opens Mini App
const initData = window.Telegram.WebApp.initData;
const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;

// 2. Send to edge function for validation
const { data } = await supabase.functions.invoke('telegram-auth', {
  body: { initData, user: initDataUnsafe.user }
});

// 3. Edge function validates HMAC signature
const isValid = validateTelegramWebAppData(initData, BOT_TOKEN);

// 4. Create/update user profile
const { data: profile } = await supabase
  .from('profiles')
  .upsert({
    telegram_id: user.id,
    username: user.username,
    display_name: user.first_name
  });

// 5. Return session token
return { session: data.session, user: profile };
```

#### Bot Commands
```typescript
// Bot command handler (bot-api edge function)
const commands = {
  '/start': handleStart,
  '/generate': handleGenerate,
  '/library': handleLibrary,
  '/help': handleHelp,
};

// Generate command example
async function handleGenerate(chatId: number, prompt: string) {
  // Initiate generation
  const task = await generateMusic(prompt);

  // Send inline keyboard
  await sendMessage(chatId, 'Generating your track...', {
    inline_keyboard: [[
      { text: 'Open App', web_app: { url: APP_URL } }
    ]]
  });

  // Send notification when complete
  await sendNotification(chatId, task.id);
}
```

#### Notifications
```typescript
// Send notification via edge function
const sendNotification = async (userId: string, trackId: string) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('telegram_id')
    .eq('id', userId)
    .single();

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: profile.telegram_id,
      text: '🎵 Your track is ready!',
      reply_markup: {
        inline_keyboard: [[
          {
            text: 'Listen Now',
            web_app: { url: `${APP_URL}?startapp=track_${trackId}` }
          }
        ]]
      }
    })
  });
};
```

---

## State Management

### Zustand Stores

#### Player Store (usePlayerState.ts)
```typescript
interface PlayerState {
  // Active playback
  activeTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;

  // Queue management
  queue: Track[];
  currentIndex: number;
  shuffle: boolean;
  repeat: 'off' | 'one' | 'all';

  // Audio settings
  volume: number;

  // Actions
  playTrack: (track: Track) => void;
  pauseTrack: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  addToQueue: (track: Track) => void;
}

const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      // Initial state
      activeTrack: null,
      isPlaying: false,
      queue: [],
      volume: 1,

      // Actions with immer-like syntax
      playTrack: (track) => set({
        activeTrack: track,
        isPlaying: true,
        currentIndex: get().queue.findIndex(t => t.id === track.id)
      }),

      pauseTrack: () => set({ isPlaying: false }),

      nextTrack: () => {
        const { queue, currentIndex } = get();
        const nextIndex = (currentIndex + 1) % queue.length;
        set({
          currentIndex: nextIndex,
          activeTrack: queue[nextIndex],
          isPlaying: true
        });
      },

      // ... more actions
    }),
    {
      name: 'player-state',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

#### Studio Store (useUnifiedStudioStore.ts)
```typescript
interface UnifiedStudioState {
  // Project
  projectId: string | null;
  tracks: StudioTrack[];

  // Playback
  isPlaying: boolean;
  currentTime: number;

  // Stems
  stems: StemTrack[];
  stemControls: Record<string, StemControls>;

  // Effects
  effectsChain: EffectNode[];

  // History
  history: UndoRedoState;

  // Actions
  loadProject: (id: string) => void;
  addTrack: (track: StudioTrack) => void;
  updateStemControl: (stemId: string, control: Partial<StemControls>) => void;
  applyEffect: (effectType: string, params: any) => void;
  undo: () => void;
  redo: () => void;
}
```

### TanStack Query (React Query)

#### Configuration
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
  },
});
```

#### Query Patterns
```typescript
// Basic query
const { data: tracks } = useQuery({
  queryKey: ['tracks', userId],
  queryFn: async () => {
    const { data } = await supabase
      .from('tracks')
      .select('*')
      .eq('user_id', userId);
    return data;
  },
  enabled: !!userId,
});

// Infinite query
const {
  data,
  fetchNextPage,
  hasNextPage,
} = useInfiniteQuery({
  queryKey: ['tracks', 'infinite'],
  queryFn: async ({ pageParam = 0 }) => {
    const { data } = await supabase
      .from('tracks')
      .select('*')
      .range(pageParam, pageParam + 20);
    return data;
  },
  getNextPageParam: (lastPage, pages) => {
    return lastPage.length === 20 ? pages.length * 20 : undefined;
  },
});

// Mutation with optimistic update
const likeMutation = useMutation({
  mutationFn: async (trackId: string) => {
    return await supabase
      .from('track_likes')
      .insert({ track_id: trackId, user_id: userId });
  },
  onMutate: async (trackId) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['track', trackId]);

    // Snapshot previous value
    const previous = queryClient.getQueryData(['track', trackId]);

    // Optimistically update
    queryClient.setQueryData(['track', trackId], (old: Track) => ({
      ...old,
      likes_count: old.likes_count + 1,
    }));

    return { previous };
  },
  onError: (err, trackId, context) => {
    // Rollback on error
    queryClient.setQueryData(['track', trackId], context?.previous);
  },
  onSuccess: (data, trackId) => {
    // Invalidate to sync with server
    queryClient.invalidateQueries(['track', trackId]);
  },
});
```

---

## Audio Architecture

### Global Audio Provider

Single audio element for entire app (prevents multi-audio chaos)

```typescript
// GlobalAudioProvider.tsx
export function GlobalAudioProvider({ children }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { activeTrack, isPlaying, volume } = usePlayerStore();

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'auto';
      setGlobalAudioRef(audioRef.current);
    }
  }, []);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Sync playback
  useEffect(() => {
    if (!audioRef.current || !activeTrack) return;

    if (isPlaying) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, activeTrack]);

  return <>{children}</>;
}
```

### Stem Audio Engine

Multi-track synchronization with drift detection

```typescript
// useStemAudioEngine.ts
export function useStemAudioEngine(stems: Stem[]) {
  const audioElements = useRef<Map<string, HTMLAudioElement>>(new Map());
  const syncIntervalRef = useRef<number | null>(null);

  // Create audio elements for each stem
  useEffect(() => {
    stems.forEach(stem => {
      if (!audioElements.current.has(stem.id)) {
        const audio = new Audio(stem.url);
        audio.preload = 'auto';
        audioElements.current.set(stem.id, audio);
      }
    });
  }, [stems]);

  // Synchronization with drift detection
  const syncStems = useCallback(() => {
    const times = Array.from(audioElements.current.values())
      .map(audio => audio.currentTime);

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxDrift = Math.max(...times.map(t => Math.abs(t - avgTime)));

    // Re-sync if drift > 0.1s
    if (maxDrift > 0.1) {
      audioElements.current.forEach(audio => {
        audio.currentTime = avgTime;
      });
    }
  }, []);

  // Start sync interval
  useEffect(() => {
    syncIntervalRef.current = window.setInterval(syncStems, 100);
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [syncStems]);

  return {
    play: () => audioElements.current.forEach(a => a.play()),
    pause: () => audioElements.current.forEach(a => a.pause()),
    setVolume: (stemId: string, volume: number) => {
      const audio = audioElements.current.get(stemId);
      if (audio) audio.volume = volume;
    },
  };
}
```

### Audio Caching (IndexedDB)

```typescript
// useAudioCache.ts
class AudioCache {
  private db: IDBDatabase | null = null;
  private maxSize = 500 * 1024 * 1024; // 500MB

  async get(url: string): Promise<ArrayBuffer | null> {
    const tx = this.db!.transaction('audio', 'readonly');
    const store = tx.objectStore('audio');
    const result = await store.get(url);
    return result?.buffer || null;
  }

  async set(url: string, buffer: ArrayBuffer): Promise<void> {
    // LRU eviction if over limit
    await this.evictIfNeeded(buffer.byteLength);

    const tx = this.db!.transaction('audio', 'readwrite');
    const store = tx.objectStore('audio');
    await store.put({
      url,
      buffer,
      timestamp: Date.now(),
    });
  }

  private async evictIfNeeded(newSize: number): Promise<void> {
    // Get all entries sorted by timestamp
    const entries = await this.getAllEntries();
    let currentSize = entries.reduce((s, e) => s + e.buffer.byteLength, 0);

    // Evict oldest until under limit
    while (currentSize + newSize > this.maxSize && entries.length > 0) {
      const oldest = entries.shift()!;
      await this.delete(oldest.url);
      currentSize -= oldest.buffer.byteLength;
    }
  }
}
```

---

## Security Architecture

### Authentication

**Telegram WebApp Validation**
```typescript
// telegram-auth edge function
function validateTelegramWebAppData(initData: string, botToken: string): boolean {
  const parsed = new URLSearchParams(initData);
  const hash = parsed.get('hash');
  parsed.delete('hash');

  // Sort and join
  const dataCheckString = Array.from(parsed.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // HMAC validation
  const secretKey = crypto.createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const calculatedHash = crypto.createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return hash === calculatedHash;
}
```

### Row-Level Security (RLS)

**Enable RLS on all tables**
```sql
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_likes ENABLE ROW LEVEL SECURITY;
```

**Policy Examples**
```sql
-- Read own + public
CREATE POLICY "Read own and public tracks"
ON tracks FOR SELECT
USING (
  auth.uid() = user_id OR is_public = true
);

-- Write own only
CREATE POLICY "Insert own tracks only"
ON tracks FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update own only
CREATE POLICY "Update own tracks only"
ON tracks FOR UPDATE
USING (auth.uid() = user_id);
```

### Input Validation

**Zod Schemas**
```typescript
const GenerateFormSchema = z.object({
  prompt: z.string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(500, 'Prompt must be under 500 characters'),
  style: z.string().min(1, 'Style is required'),
  customMode: z.boolean(),
  lyrics: z.string().optional(),
});

type GenerateFormData = z.infer<typeof GenerateFormSchema>;
```

**DOMPurify for HTML Sanitization**
```typescript
import DOMPurify from 'dompurify';

const sanitizedContent = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
  ALLOWED_ATTR: ['href'],
});
```

---

## Performance Optimization

### Code Splitting

**Vite Configuration**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks (better caching)
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-tone': ['tone'],
          'vendor-wavesurfer': ['wavesurfer.js'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-radix': [/* all @radix-ui/* */],

          // Feature chunks
          'page-stem-studio': ['/src/pages/studio-v2/UnifiedStudioPage'],
          'page-admin': ['/src/pages/AdminDashboard'],
          'feature-stem-studio': ['/src/components/stem-studio'],
          'feature-lyrics': ['/src/components/generate-form/lyrics-chat'],
        },
      },
    },
  },
});
```

**Bundle Sizes (Brotli)**
- index.css: 19.68 KB
- index.js: 50.94 KB
- feature-generate: 54.85 KB
- feature-stem-studio: 52.50 KB
- vendor-other: 184.28 KB

### Lazy Loading

**Component Lazy Loading**
```typescript
const AdminDashboard = lazy(() => import(
  /* webpackChunkName: "admin" */
  "./pages/AdminDashboard"
));
```

**Image Lazy Loading**
```typescript
// LazyImage component
export function LazyImage({ src, alt }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative">
      {!loaded && <Skeleton className="absolute inset-0" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={cn({ 'opacity-0': !loaded })}
      />
    </div>
  );
}
```

### Virtual Scrolling

**react-virtuoso for Large Lists**
```typescript
import { Virtuoso } from 'react-virtuoso';

<Virtuoso
  data={tracks}
  itemContent={(index, track) => (
    <TrackRow track={track} index={index} />
  )}
  overscan={200}  // Render extra items for smooth scrolling
/>
```

### Memoization

**useMemo for Expensive Computations**
```typescript
const filteredTracks = useMemo(() => {
  return tracks.filter(t =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [tracks, searchTerm]);
```

**React.memo for Component Optimization**
```typescript
export const TrackCard = React.memo(({ track }) => {
  return <Card>...</Card>;
}, (prev, next) => prev.track.id === next.track.id);
```

---

## Deployment Architecture

### Build Process

**Production Build**
```bash
npm run build
# - TypeScript compilation
# - Vite build with tree-shaking
# - CSS minification (Tailwind purge)
# - Terser minification
# - Brotli/Gzip compression
# - Source maps generation
```

**Build Optimizations**
- Tree-shaking unused code
- Dead code elimination
- Scope hoisting
- Minification (Terser)
- CSS purge (Tailwind)
- Asset optimization

### Deployment Flow

```
git push → GitHub Actions → Build → Deploy to Lovable Cloud
                                         ↓
                              ┌──────────┴──────────┐
                              ▼                     ▼
                         Static Assets        Edge Functions
                         (CDN cached)         (Deno runtime)
```

### Environment Variables

```env
# Required
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJxxx...
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx

# Optional
VITE_TELEGRAM_BOT_TOKEN=xxx (server-side only)
VITE_SUNO_API_KEY=xxx (server-side only)
```

---

## Appendices

### A. Performance Benchmarks

| Metric | Target | Current |
|--------|--------|---------|
| First Contentful Paint | < 1.5s | 1.2s |
| Largest Contentful Paint | < 2.5s | 2.1s |
| Time to Interactive | < 3.5s | 3.0s |
| Cumulative Layout Shift | < 0.1 | 0.05 |
| Bundle Size (Brotli) | < 500KB | ~400KB |

### B. Key Decisions (ADRs)

See `/ADR/` directory for Architecture Decision Records:
- ADR-001: Technology Stack Choice
- ADR-002: Frontend Architecture And Stack
- ADR-003: Performance Optimization Architecture
- ADR-004: Audio Playback Optimization
- ADR-005: State Machine Architecture
- ADR-006: Type-Safe Audio Context

### C. Further Reading

- [Hooks Reference](/docs/HOOKS_REFERENCE.md)
- [Component Guide](/docs/COMPONENT_GUIDE.md)
- [API Reference](/docs/API_REFERENCE.md)
- [Database Schema](/docs/DATABASE.md)
- [Deployment Guide](/docs/DEPLOYMENT.md)

---

**Document Maintained By**: MusicVerse AI Development Team
**Last Review**: 2026-01-04
**Next Review**: 2026-02-01
