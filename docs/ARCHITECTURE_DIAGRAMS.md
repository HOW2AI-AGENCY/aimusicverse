# 🏗️ MusicVerse AI - Architecture Diagrams

**Last Updated:** 2025-12-08  
**Version:** 1.0

---

## 📑 Содержание

- [Общая архитектура системы](#общая-архитектура-системы)
- [Frontend архитектура](#frontend-архитектура)
- [Backend архитектура](#backend-архитектура)
- [Потоки данных](#потоки-данных)
- [Архитектура компонентов](#архитектура-компонентов)
- [Deployment архитектура](#deployment-архитектура)

---

## Общая архитектура системы

### High-Level Overview

```mermaid
C4Context
    title System Context Diagram for MusicVerse AI

    Person(user, "User", "Telegram user creating music")
    
    System(musicverse, "MusicVerse AI", "AI-powered music creation platform")
    
    System_Ext(telegram, "Telegram", "Mini App platform & notifications")
    System_Ext(suno, "Suno AI", "Music generation service")
    System_Ext(gemini, "Gemini AI", "Portrait generation")
    
    Rel(user, telegram, "Opens Mini App")
    Rel(telegram, musicverse, "Launches app with auth")
    Rel(musicverse, telegram, "Sends notifications")
    Rel(musicverse, suno, "Generates music")
    Rel(musicverse, gemini, "Generates portraits")
    Rel(user, musicverse, "Creates & manages music")
```

### Technology Stack

```mermaid
graph TB
    subgraph "Client Side"
        A[React 19 + TypeScript]
        B[Tailwind + shadcn/ui]
        C[TanStack Query]
        D[Zustand]
        E[Framer Motion]
        F[react-virtuoso]
        G[wavesurfer.js]
    end
    
    subgraph "Server Side - Lovable Cloud"
        H[PostgreSQL 15]
        I[Supabase Auth]
        J[Edge Functions Deno]
        K[Supabase Storage]
        L[Realtime Subscriptions]
    end
    
    subgraph "External APIs"
        M[Suno AI v5]
        N[Telegram Bot API]
        O[Gemini AI]
        P[Whisper API]
    end
    
    A --> C
    C --> I
    C --> J
    J --> H
    J --> K
    J --> M
    J --> N
    J --> O
    
    A --> D
    A --> E
    A --> F
    A --> G
    B --> A
    
    H --> L
    L --> C
    
    style A fill:#61DAFB
    style H fill:#336791
    style M fill:#e74c3c
    style N fill:#26A5E4
```

---

## Frontend архитектура

### Component Hierarchy

```mermaid
graph TB
    A[App.tsx] --> B[Router]
    B --> C[Layout]
    
    C --> D[GlobalAudioProvider]
    C --> E[TelegramContext]
    C --> F[QueryClientProvider]
    
    D --> G[CompactPlayer]
    D --> H[ExpandedPlayer]
    D --> I[MobileFullscreenPlayer]
    
    B --> J[Pages]
    J --> K[Index - Homepage]
    J --> L[Library - Track List]
    J --> M[Artists - AI Personas]
    J --> N[Projects - Organization]
    J --> O[Playlists - Collections]
    J --> P[Community - Discovery]
    J --> Q[Profile - User Settings]
    
    L --> R[VirtualizedTrackList]
    R --> S[TrackCard/TrackRow]
    S --> T[TrackActions]
    
    K --> U[FeaturedSection]
    K --> V[NewReleasesSection]
    K --> W[PopularSection]
    K --> X[AutoPlaylistsSection]
    
    style A fill:#61DAFB
    style D fill:#FF6B6B
    style F fill:#FF4154
```

### State Management Architecture

```mermaid
graph LR
    subgraph "Global State - Zustand"
        A[playerStore]
        B[lyricsWizardStore]
        C[planTrackStore]
        D[stemReferenceStore]
    end
    
    subgraph "Server State - TanStack Query"
        E[useTracksInfinite]
        F[usePublicContentOptimized]
        G[usePlaylists]
        H[useArtists]
        I[usePlayerState]
    end
    
    subgraph "Components"
        J[Player Components]
        K[Library Components]
        L[Generation Form]
        M[Stem Studio]
    end
    
    A --> J
    B --> L
    C --> L
    D --> M
    
    E --> K
    F --> K
    G --> K
    H --> K
    I --> J
    
    J -.->|updates| A
    L -.->|updates| B
    L -.->|updates| C
    M -.->|updates| D
    
    style A fill:#764ABC
    style E fill:#FF4154
    style J fill:#61DAFB
```

### Player State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle: App starts
    
    Idle --> Loading: play()
    Loading --> Playing: onCanPlay
    Loading --> Error: onError
    
    Playing --> Paused: pause()
    Playing --> Loading: changeTrack()
    Playing --> Ended: onEnded
    
    Paused --> Playing: play()
    Paused --> Loading: changeTrack()
    
    Ended --> Idle: clear()
    Ended --> Loading: playNext()
    
    Error --> Idle: reset()
    Error --> Loading: retry()
    
    state Playing {
        [*] --> Compact
        Compact --> Expanded: expand()
        Expanded --> Fullscreen: maximize()
        Fullscreen --> Expanded: exitFullscreen()
        Expanded --> Compact: minimize()
    }
```

---

## Backend архитектура

### Database Architecture

```mermaid
graph TB
    subgraph "Core Tables"
        A[profiles]
        B[tracks]
        C[track_versions]
        D[track_stems]
    end
    
    subgraph "Organization"
        E[playlists]
        F[playlist_tracks]
        G[music_projects]
        H[artists]
    end
    
    subgraph "Generation System"
        I[generation_tasks]
        J[generation_tag_usage]
        K[suno_meta_tags]
        L[music_styles]
    end
    
    subgraph "Analytics"
        M[audio_analysis]
        N[track_likes]
        O[track_change_log]
    end
    
    A -->|creates| B
    B -->|has| C
    B -->|has| D
    B -->|analyzed by| M
    B -->|receives| N
    B -->|logs| O
    
    A -->|owns| E
    E -->|contains| F
    F -->|references| B
    
    A -->|creates| G
    G -->|contains| B
    
    A -->|creates| H
    B -->|by| H
    
    I -->|generates| B
    I -->|uses| J
    J -->|references| K
    J -->|references| L
    
    style B fill:#90EE90
    style C fill:#87CEEB
    style A fill:#FFE4B5
```

### Edge Functions Architecture

```mermaid
graph TB
    subgraph "Music Generation"
        A[suno-music-generate]
        B[suno-music-callback]
        C[suno-upload-cover]
        D[suno-upload-extend]
        E[suno-boost-style]
    end
    
    subgraph "AI Services"
        F[ai-lyrics-assistant]
        G[ai-blog-assistant]
        H[analyze-audio-flamingo]
        I[generate-track-cover]
        J[generate-artist-portrait]
        K[generate-playlist-cover]
    end
    
    subgraph "Telegram Integration"
        L[telegram-bot]
        M[telegram-send-notification]
        N[suno-send-audio]
    end
    
    subgraph "Data Management"
        O[cleanup-tracks]
        P[sync-profile]
        Q[validate-telegram-init]
    end
    
    A -->|webhooks| B
    B -->|notifies| M
    M -->|sends via| N
    
    F -->|assists| A
    E -->|enhances| A
    H -->|analyzes| B
    
    L -->|triggers| A
    L -->|triggers| C
    L -->|triggers| D
    
    style A fill:#e74c3c
    style L fill:#26A5E4
    style F fill:#9B59B6
```

### RLS Security Model

```mermaid
flowchart TB
    A[Client Request] --> B{Authenticated?}
    
    B -->|No| C[Anonymous Context]
    B -->|Yes| D[User Context<br/>auth.uid]
    
    C --> E{Public Data Only}
    E -->|SELECT| F[is_public = true]
    E -->|Other ops| G[Denied ❌]
    
    D --> H{Resource Type}
    
    H --> I{Own Resources}
    I -->|user_id = auth.uid| J[Full Access ✅]
    
    H --> K{Public Resources}
    K -->|is_public = true| L[Read Only ✅]
    K -->|is_public = false| M[Denied ❌]
    
    H --> N{Admin Resources}
    N -->|app_role = admin| O[Admin Access ✅]
    N -->|app_role ≠ admin| P[Denied ❌]
    
    style J fill:#90EE90
    style L fill:#90EE90
    style O fill:#90EE90
    style G fill:#FFB6C1
    style M fill:#FFB6C1
    style P fill:#FFB6C1
```

---

## Потоки данных

### Music Generation Flow

```mermaid
sequenceDiagram
    actor User
    participant App as React App
    participant Edge as Edge Functions
    participant DB as PostgreSQL
    participant Suno as Suno AI
    participant TG as Telegram Bot
    
    User->>App: Fill generation form
    App->>App: Auto-save to localStorage
    
    User->>App: Submit generation
    App->>Edge: POST /suno-music-generate
    
    Edge->>DB: INSERT generation_tasks
    DB-->>Edge: task_id
    
    Edge->>Suno: POST /generate
    Suno-->>Edge: suno_task_id
    
    Edge->>DB: UPDATE task with suno_task_id
    Edge-->>App: 202 Accepted + task_id
    
    App->>App: Show progress skeleton
    
    loop Streaming Phase
        Suno-->>Edge: Streaming URL ready
        Edge->>DB: UPDATE streaming_url
        DB-->>App: Realtime subscription
        App->>User: Preview available 🎵
    end
    
    Suno->>Edge: Webhook: Generation complete
    
    Edge->>DB: INSERT tracks
    Edge->>DB: INSERT track_versions (A & B)
    Edge->>DB: UPDATE task status
    
    Edge->>TG: Send notification
    TG->>User: "Ваш трек готов!" 🎉
    
    User->>App: Open track
    App->>DB: SELECT track + versions
    DB-->>App: Track data
    App->>User: Start playback 🎵
```

### Version Switching Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Track Card
    participant Hook as useVersionSwitcher
    participant DB as PostgreSQL
    participant Store as playerStore
    
    User->>UI: Click version B
    UI->>Hook: switchVersion(versionB_id)
    
    Hook->>DB: BEGIN TRANSACTION
    
    par Update Flags
        Hook->>DB: UPDATE is_primary<br/>SET false WHERE track_id
        Hook->>DB: UPDATE is_primary<br/>SET true WHERE id = versionB_id
    and Update Active
        Hook->>DB: UPDATE tracks<br/>SET active_version_id = versionB_id
    and Log Change
        Hook->>DB: INSERT track_change_log
    end
    
    Hook->>DB: COMMIT
    
    DB-->>Hook: Success
    Hook->>Hook: Invalidate queries
    Hook-->>UI: Update complete
    
    alt Player is playing this track
        Hook->>Store: Update activeTrack
        Store->>Store: Switch audio source
    end
    
    UI->>User: Show version B ✅
```

### Playlist Creation & Sharing Flow

```mermaid
sequenceDiagram
    actor User
    participant App as React App
    participant Edge as Edge Functions
    participant DB as PostgreSQL
    participant AI as Gemini AI
    participant TG as Telegram
    
    User->>App: Create new playlist
    App->>App: Enter title & description
    
    User->>App: Click "Generate Cover"
    App->>Edge: POST /generate-playlist-cover
    Edge->>AI: Generate image
    AI-->>Edge: cover_url
    Edge-->>App: Cover ready
    
    User->>App: Add tracks
    App->>DB: INSERT INTO playlists
    DB-->>App: playlist_id
    
    par Add Tracks
        loop Each track
            App->>DB: INSERT playlist_tracks
            DB-->>App: position assigned
        end
    and Update Stats
        DB->>DB: Trigger: update_playlist_stats
    end
    
    User->>App: Click Share
    App->>TG: shareURL(deep_link)
    TG->>User: Share dialog
    
    User->>TG: Share to chat
    
    Note over TG: Friend clicks link
    TG->>App: Open with startapp=playlist_ID
    App->>DB: SELECT playlist + tracks
    DB-->>App: Playlist data
    App->>User: Show shared playlist 🎵
```

---

## Архитектура компонентов

### Generate Form Architecture

```mermaid
graph TB
    A[GenerateSheet.tsx] --> B[useGenerateForm hook]
    
    A --> C[GenerateFormHeader]
    A --> D[GenerateFormSimple]
    A --> E[GenerateFormCustom]
    A --> F[GenerateFormReferences]
    A --> G[GenerateFormActions]
    
    D --> H[PromptInput]
    D --> I[VoiceRecording]
    
    E --> J[LyricsInput]
    E --> K[StyleInput]
    E --> L[AdvancedOptions]
    
    K --> M[AI Lyrics Chat]
    M --> N[useLyricsChat hook]
    
    N --> O[GenreSelector]
    N --> P[MoodSelector]
    N --> Q[LanguageSelector]
    N --> R[StructureBuilder]
    
    F --> S[ArtistSelector]
    F --> T[ProjectSelector]
    F --> U[StemReferenceSelector]
    
    B -.->|manages state| A
    B -.->|auto-saves| V[localStorage]
    
    style A fill:#61DAFB
    style B fill:#764ABC
    style M fill:#9B59B6
```

### Stem Studio Architecture

```mermaid
graph TB
    A[StemStudioPage] --> B[useStemStudio hook]
    
    A --> C[StemStudioHeader]
    A --> D[WaveformDisplay]
    A --> E[StemMixer]
    A --> F[StemActions]
    
    D --> G[wavesurfer.js]
    D --> H[WaveformRegions]
    
    E --> I[VolumeSlider]
    E --> J[MuteButton]
    E --> K[SoloButton]
    
    F --> L[DownloadStems]
    F --> M[UseAsReference]
    
    B -.->|manages| N[stemReferenceStore]
    B -.->|fetches| O[useTrackStems]
    
    G -.->|visualizes| P[Audio Element]
    
    M --> Q[GenerateSheet]
    Q --> R[Pre-filled with stem data]
    
    style A fill:#61DAFB
    style B fill:#764ABC
    style G fill:#FF6B6B
```

### Library Virtualization Architecture

```mermaid
graph TB
    A[Library.tsx] --> B[useTracksInfinite]
    
    B --> C{View Mode}
    
    C -->|Grid| D[VirtuosoGrid]
    C -->|List| E[Virtuoso]
    
    D --> F[TrackCard]
    E --> G[TrackRow]
    
    F --> H[LazyImage]
    F --> I[TrackActions]
    F --> J[VersionSwitcher]
    
    G --> H
    G --> I
    G --> J
    
    B --> K[TanStack Query]
    K --> L{Cache}
    L -->|Hit| M[Return cached]
    L -->|Miss| N[Fetch from DB]
    
    N --> O[Batch likes query]
    N --> P[Batch versions query]
    
    style B fill:#FF4154
    style D fill:#FFD700
    style E fill:#FFD700
    style H fill:#90EE90
```

---

## Deployment архитектура

### Infrastructure Overview

```mermaid
graph TB
    subgraph "Lovable Cloud Platform"
        A[Vite Build]
        B[CDN Static Assets]
        C[PostgreSQL 15]
        D[Supabase Storage]
        E[Deno Edge Runtime]
    end
    
    subgraph "Telegram Infrastructure"
        F[Bot API]
        G[Mini App Hosting]
        H[Webhook Delivery]
    end
    
    subgraph "External Services"
        I[Suno AI API]
        J[Gemini AI API]
        K[Whisper API]
    end
    
    A -->|deploys to| B
    B -->|serves| G
    
    G -->|connects to| E
    E -->|queries| C
    E -->|stores files| D
    
    E -->|calls| I
    E -->|calls| J
    E -->|calls| K
    
    I -->|webhooks| H
    H -->|routes to| E
    
    E -->|notifications| F
    
    style B fill:#61DAFB
    style C fill:#336791
    style E fill:#3ECF8E
    style F fill:#26A5E4
```

### CI/CD Pipeline

```mermaid
flowchart LR
    A[Git Push] --> B[GitHub Actions]
    
    B --> C{Branch?}
    
    C -->|main| D[Run Tests]
    C -->|dev| E[Run Linters]
    C -->|feature/*| F[Quick Check]
    
    D --> G{Tests Pass?}
    G -->|Yes| H[Build Production]
    G -->|No| I[Fail ❌]
    
    H --> J[Deploy to Lovable Cloud]
    J --> K[Update Edge Functions]
    K --> L[Run Migrations]
    L --> M[Health Check]
    
    M --> N{Healthy?}
    N -->|Yes| O[Deploy Complete ✅]
    N -->|No| P[Rollback ⚠️]
    
    E --> Q{Lint Pass?}
    Q -->|Yes| R[Deploy to Staging]
    Q -->|No| I
    
    F --> S[Preview Build]
    
    style O fill:#90EE90
    style I fill:#FFB6C1
    style P fill:#FFA500
```

### Monitoring & Observability

```mermaid
graph TB
    subgraph "Application Metrics"
        A[Performance Monitoring]
        B[Error Tracking]
        C[User Analytics]
    end
    
    subgraph "Infrastructure Metrics"
        D[Database Performance]
        E[Edge Function Logs]
        F[Storage Usage]
    end
    
    subgraph "Business Metrics"
        G[Generation Success Rate]
        H[User Engagement]
        I[Feature Adoption]
    end
    
    subgraph "Alerting"
        J[Slack Notifications]
        K[Telegram Alerts]
        L[Email Reports]
    end
    
    A --> J
    B --> K
    D --> L
    E --> K
    G --> L
    
    style K fill:#26A5E4
    style J fill:#4A154B
```

---

## Best Practices

### Component Design Principles

1. **Single Responsibility**: Каждый компонент решает одну задачу
2. **Composition over Inheritance**: Используем композицию
3. **Hooks for Logic**: Логика в кастомных хуках
4. **Types First**: TypeScript типы для всех props
5. **Performance**: memo, useMemo, useCallback где нужно

### State Management Guidelines

```typescript
// ✅ GOOD: Global player state in Zustand
const usePlayerStore = create<PlayerState>((set) => ({
  activeTrack: null,
  isPlaying: false,
  play: (track) => set({ activeTrack: track, isPlaying: true }),
}));

// ✅ GOOD: Server state in TanStack Query
const { data } = useQuery({
  queryKey: ['tracks', userId],
  queryFn: () => fetchTracks(userId),
  staleTime: 30_000,
});

// ❌ BAD: Mixing concerns
const [tracks, setTracks] = useState([]); // Don't manage server state in useState
```

### Database Query Patterns

```sql
-- ✅ GOOD: Batch operations
SELECT t.*, tv.audio_url, tv.version_label,
       COALESCE(l.liked, false) as is_liked
FROM tracks t
JOIN track_versions tv ON tv.id = t.active_version_id
LEFT JOIN track_likes l ON l.track_id = t.id AND l.user_id = $1
WHERE t.user_id = $1
LIMIT 20;

-- ❌ BAD: N+1 queries
SELECT * FROM tracks WHERE user_id = $1;
-- Then for each track:
SELECT * FROM track_versions WHERE track_id = $2;
SELECT * FROM track_likes WHERE track_id = $2;
```

---

## Дополнительные ресурсы

- [DATABASE.md](./DATABASE.md) - Полная схема базы данных
- [PLAYER_ARCHITECTURE.md](./PLAYER_ARCHITECTURE.md) - Детали архитектуры плеера
- [TELEGRAM_BOT_ARCHITECTURE.md](./TELEGRAM_BOT_ARCHITECTURE.md) - Архитектура Telegram бота
- [PROJECT_SPECIFICATION.md](./PROJECT_SPECIFICATION.md) - Спецификация проекта

---

**Maintained by:** MusicVerse AI Team  
**License:** Proprietary
