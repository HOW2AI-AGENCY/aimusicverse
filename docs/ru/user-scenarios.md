# 📊 Визуализация пользовательских сценариев MusicVerse AI

## Детальные User Flows и навигационные паттерны

**Дата создания:** 25 декабря 2025  
**Версия:** 1.0

---

## 📱 Навигационная архитектура

### Главная навигация (Island Navigation)

```
┌────────────────────────────────────────────────────────┐
│                    Content Area                        │
│                 (Scroll Container)                     │
│                                                        │
│  [Dynamic content based on current route]             │
│                                                        │
│                                                        │
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│                                                        │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  │
│  │ 🏠   │  │ 🎵   │  │  ➕  │  │ 📁   │  │ ≡    │  │
│  │Главн.│  │Треки │  │Созд. │  │Проект│  │Ещё   │  │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘  │
│                                                        │
└────────────────────────────────────────────────────────┘
     ↑          ↑          ↑          ↑          ↑
     │          │          │          │          └─ More Menu
     │          │          │          └─ Projects
     │          │          └─ FAB (Generate Sheet)
     │          └─ Library (Grid/List)
     └─ Home (Discovery)
```

### Навигационная карта приложения

```
┌─────────────────────────────────────────────────────────────┐
│                       MusicVerse AI                          │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
    ┌───▼────┐           ┌────▼────┐          ┌────▼────┐
    │ Home   │           │ Library │          │Projects │
    │ (/)    │           │(/library)│         │(/projects)│
    └───┬────┘           └────┬────┘          └────┬────┘
        │                     │                     │
        │                     ├──> Track Detail    │
        │                     │    (/library/:id)  │
        │                     │                     │
        │                     ├──> Stem Studio     │
        │                     │    (/studio/:id)   │
        │                     │                     │
        ├──> Featured         │                     ├──> Project Detail
        ├──> New Releases     │                     │    (/projects/:id)
        ├──> Popular          │                     │
        ├──> Auto-Playlists   │                     ├──> Plan Tracks
        ├──> Professional Hub │                     │
        └──> Quick Actions    │                     └──> Cloud Sync
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
    ┌───▼────┐           ┌────▼────┐          ┌────▼────┐
    │Generate│           │Playlists│          │ More   │
    │(Sheet) │           │(/playlists)        │(Sheet) │
    └───┬────┘           └────┬────┘          └────┬────┘
        │                     │                     │
        ├──> Simple Mode      ├──> My Playlists    ├──> Studios
        ├──> Custom Mode      ├──> Auto-Playlists  │    ├─> Music Lab
        ├──> AI Lyrics Wizard ├──> Create New      │    ├─> Guitar
        ├──> References       │                     │    └─> Lyrics
        └──> History          │                     │
                              │                     ├──> Community
                              │                     │    ├─> Blog
                              │                     │    ├─> Artists
                              │                     │    └─> Community
                              │                     │
                              │                     ├──> Account
                              │                     │    ├─> Profile
                              │                     │    ├─> Rewards
                              │                     │    └─> Settings
                              │                     │
                              │                     └──> Admin (if admin)
                              │                          ├─> Dashboard
                              │                          ├─> Moderation
                              │                          ├─> Analytics
                              │                          └─> Feedback
```

---

## 🎯 Детальные User Flows

### Flow 1: Новый пользователь → Первый трек

```
START: User opens Telegram Bot
│
├─> Click "Launch Mini App"
│   │
│   └─> Load MusicVerse AI
│       ├─ Check auth (Telegram)
│       ├─ Show GuestModeBanner (if guest)
│       └─ Trigger OnboardingTrigger
│
├─> Onboarding Flow (9 steps)
│   │
│   ├─ Step 1: Welcome screen
│   │   "Добро пожаловать в MusicVerse AI"
│   │   [Skip] [Next →]
│   │
│   ├─ Step 2: Generate intro
│   │   "Создавайте музыку с помощью AI"
│   │   [Demo: Generate button highlight]
│   │
│   ├─ Step 3: Library intro
│   │   "Ваша музыкальная библиотека"
│   │   [Demo: Library navigation]
│   │
│   ├─ Step 4: Stem Studio intro
│   │   "Разделяйте треки на компоненты"
│   │   [Demo: Studio showcase]
│   │
│   ├─ Step 5: Projects intro
│   │   "Организуйте музыку в проекты"
│   │
│   ├─ Step 6: Playlists intro
│   │   "Создавайте и делитесь плейлистами"
│   │
│   ├─ Step 7: Community intro
│   │   "Находите вдохновение в сообществе"
│   │
│   ├─ Step 8: AI Features intro
│   │   "AI Lyrics Wizard, Auto-covers, etc."
│   │
│   └─ Step 9: Call to action
│       "Готовы создать свой первый трек?"
│       [Создать трек →]
│
├─> Navigate to Home (/)
│   │
│   ├─ Show HomeHeader with profile
│   ├─ GamificationBar (если включена)
│   ├─ HeroQuickActions
│   │   ┌──────────────────────┐
│   │   │ [🎵 Создать музыку] │ ← Primary CTA
│   │   │ [🎧 Распознать]     │
│   │   │ [📁 Мои проекты]    │
│   │   └──────────────────────┘
│   │
│   └─ QuickPresetsCarousel (10-15 готовых промптов)
│       [Pop Love Song] [Rock Anthem] [Lo-fi Chill] ...
│
├─> Click "Создать музыку" or Quick Preset
│   │
│   └─> Open GenerateSheet (bottom sheet)
│       │
│       ├─ Header: Mode toggle (Simple/Custom)
│       │  [Simple ●] [Custom ○]
│       │
│       ├─ Simple Mode (default):
│       │  │
│       │  ├─ "Что вы хотите создать?"
│       │  │  [Text area: "Создай романтичную поп-балладу..."]
│       │  │  (500 characters max)
│       │  │
│       │  ├─ Quick chips (optional):
│       │  │  [🎸 Рок] [🎹 Поп] [🎵 Джаз] [🎤 Хип-хоп]
│       │  │
│       │  ├─ Project selector (optional):
│       │  │  "Добавить в проект" [Выбрать проект ▼]
│       │  │
│       │  └─ Actions:
│       │     [🤖 AI Lyrics Wizard] (открыть помощник)
│       │     [📜 История] (previous prompts)
│       │     [✨ Создать] ← Primary button (Telegram MainButton)
│       │
│       └─ Custom Mode:
│          │
│          ├─ Lyrics (full control):
│          │  [Text area: multi-line, section tags]
│          │  [Verse], [Chorus], [Bridge]
│          │
│          ├─ Style:
│          │  [Text input: "pop rock, electric guitar..."]
│          │  [🎨 Boost Style] (AI enhancement)
│          │
│          ├─ Title:
│          │  [Text input: "My Song"]
│          │
│          ├─ References (optional):
│          │  [Add Reference Audio]
│          │  ├─ Upload audio file
│          │  ├─ Use existing stem
│          │  └─ Use library track
│          │
│          └─ Actions: same as Simple Mode
│
├─> Fill prompt (example: "Создай весёлую летнюю поп-песню")
│   │
│   └─> Click "Создать" (✨)
│       │
│       ├─ Validate input (non-empty)
│       ├─ Show loading state
│       ├─ Call Edge Function: suno-music-generate
│       │  ├─ Creates generation_tasks record
│       │  ├─ Calls Suno API
│       │  └─ Returns task_id
│       │
│       └─> Close GenerateSheet
│           Show toast: "Генерация началась 🎵"
│
├─> Navigate to Library (/library)
│   │
│   └─> Show generation progress
│       │
│       ├─ Track card with skeleton
│       │  ┌───────────────────────┐
│       │  │ [Cover: shimmer]     │
│       │  │ "My Song"            │
│       │  │ ▓▓▓▓▓░░░░░ 50%      │
│       │  │ "Генерация..."       │
│       │  └───────────────────────┘
│       │
│       └─ Real-time updates via Supabase Realtime
│           ├─ 0-30s: "Подготовка..."
│           ├─ 30s-1min: "Создание музыки..."
│           └─ 1-2min: "Финализация..."
│
├─> Wait 1-2 minutes
│   │
│   └─> Receive Telegram notification
│       "🎵 Ваш трек готов! My Song"
│       [Открыть →]
│
├─> Track completed, auto-refresh Library
│   │
│   └─> Track card updated
│       ┌───────────────────────┐
│       │ [Cover image]         │
│       │ "My Song"            │
│       │ 2:34                 │
│       │ [▶️] [A] [❤️] [⋯]   │ ← Version A selected
│       └───────────────────────┘
│
├─> Click track to play
│   │
│   └─> Open CompactPlayer (bottom of screen)
│       ┌─────────────────────────────────┐
│       │ [Cover] My Song          [❤️]  │
│       │ ▓▓▓▓▓▓░░░░░░░░░░░      2:34   │
│       │ [⏮️] [▶️] [⏭️]  [A][B] [⋯] [⬆️]│
│       └─────────────────────────────────┘
│                                    ↑
│                                    └─ Expand to fullscreen
│
├─> Play track, listen to Version A
│   │
│   ├─> Click [B] to switch to Version B
│   │   ├─ Seamless version switch (same timestamp)
│   │   └─ Update active_version_id in DB
│   │
│   └─> Like track [❤️]
│       ├─ Optimistic update (immediate feedback)
│       ├─ Update track_likes table
│       └─ Show heart animation
│
├─> Click expand button [⬆️]
│   │
│   └─> Open MobileFullscreenPlayer
│       ┌─────────────────────────────────┐
│       │ [× Close]            [⋯ Menu]  │
│       │                                 │
│       │    [Large Cover Art]            │
│       │                                 │
│       │    My Song                      │
│       │    AI Artist · 2:34             │
│       │                                 │
│       │ ▓▓▓▓▓▓▓▓░░░░░░░░░░░░           │
│       │ 0:45                      2:34  │
│       │                                 │
│       │       [⏮️] [▶️] [⏭️]            │
│       │                                 │
│       │  [Version A ▼] [❤️ 1] [Add +]  │
│       │                                 │
│       │  📝 Lyrics (auto-scroll)        │
│       │  ┌─────────────────────────┐   │
│       │  │ [Verse 1]               │   │
│       │  │ Summer days are here... │   │
│       │  │                         │   │
│       │  │ [Chorus] ← highlighted  │   │
│       │  │ Dancing in the sun...   │   │
│       │  └─────────────────────────┘   │
│       └─────────────────────────────────┘
│
└─> SUCCESS: First track created and played! 🎉
    │
    ├─> Show achievement notification
    │   "🏆 Первый трек создан! +50 XP"
    │
    └─> Update gamification stats
        ├─ Unlock "First Track" badge
        ├─ Add XP to profile
        └─ Show in GamificationBar

END: User is now familiar with core flow
```

**Время прохождения:** 5-7 минут  
**Ключевые точки:**

- ✅ Простой onboarding
- ✅ Быстрый старт (Quick Presets)
- ✅ Real-time прогресс
- ✅ Telegram уведомления
- ✅ Gamification rewards

---

### Flow 2: Продвинутый пользователь → Stem Studio

```
START: User has existing track in Library
│
├─> Navigate to Library (/library)
│   │
│   └─> View track cards (Grid/List)
│       ┌───────────────────────┐
│       │ [Cover]               │
│       │ "Epic Rock Track"     │
│       │ 3:45 · ❤️ 12         │
│       │ [▶️] [A] [⋯]          │
│       └───────────────────────┘
│
├─> Click track menu [⋯]
│   │
│   └─> Open context menu (bottom sheet)
│       ┌─────────────────────────┐
│       │ Epic Rock Track         │
│       ├─────────────────────────┤
│       │ [▶️] Play               │
│       │ [➕] Add to Queue       │
│       │ [📋] Add to Playlist    │
│       │ [🎚️] Open Stem Studio  │ ← Target action
│       │ [📥] Download           │
│       │ [📤] Share              │
│       │ [🗑️] Delete             │
│       └─────────────────────────┘
│
├─> Click "Open Stem Studio"
│   │
│   └─> Navigate to /studio/:trackId
│       │
│       ├─ Show loading state
│       │  "Загрузка студии..."
│       │
│       └─> Check if stems exist
│           │
│           ├─ If NO stems:
│           │  │
│           │  └─> Show StemSeparationModeDialog
│           │      ┌──────────────────────────────┐
│           │      │ Разделение трека              │
│           │      ├──────────────────────────────┤
│           │      │ Выберите режим:              │
│           │      │                              │
│           │      │ ○ Базовый (2 стема)         │
│           │      │   Vocals + Instrumental      │
│           │      │   Быстро, бесплатно          │
│           │      │                              │
│           │      │ ● Полный (8+ стемов)        │
│           │      │   Vocals, Drums, Bass,       │
│           │      │   Guitar, Keys, etc.         │
│           │      │   2-3 минуты, -10 credits   │
│           │      │                              │
│           │      │ [Начать разделение]          │
│           │      └──────────────────────────────┘
│           │      │
│           │      └─> Click "Начать разделение"
│           │          │
│           │          ├─ Create stem_separation_tasks
│           │          ├─ Call Suno API
│           │          └─> Show StemSeparationProgress
│           │              ┌────────────────────────┐
│           │              │ Разделение трека...    │
│           │              │ ▓▓▓▓▓░░░░░ 50%        │
│           │              │ 1:30 осталось          │
│           │              └────────────────────────┘
│           │              │
│           │              └─ Wait 2-3 minutes
│           │                 └─> Stems ready
│           │
│           └─ If stems EXIST:
│              │
│              └─> Load Stem Studio interface
│
├─> Stem Studio loaded
│   │
│   └─> Desktop Layout (isDesktop)
│       ┌──────────────────────────────────────────────────┐
│       │ ← Back  Epic Rock Track        [Save] [Export]  │
│       ├──────────────────────────────────────────────────┤
│       │                                                  │
│       │  🎤 Vocals     ▓▓▓▓▓▓▓░░░ 70%  [S] [M] [Solo]  │
│       │  🎸 Guitar     ▓▓▓▓▓▓░░░░ 60%  [S] [M]         │
│       │  🥁 Drums      ▓▓▓▓▓▓▓▓░░ 80%  [S] [M]         │
│       │  🎹 Keys       ▓▓▓▓░░░░░░ 40%  [S] [M]         │
│       │  🎸 Bass       ▓▓▓▓▓░░░░░ 50%  [S] [M]         │
│       │  🎺 Other      ▓▓░░░░░░░░ 20%  [S] [M]         │
│       │                                                  │
│       │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│       │  0:00          1:30                      3:45   │
│       │                  ▲ playhead                     │
│       │                                                  │
│       │        [⏮️] [▶️ Play] [⏭️]    🔊 ▓▓▓▓▓▓▓░ 70%  │
│       │                                                  │
│       │  [Timeline] [Effects] [Sections] [Analysis]    │
│       └──────────────────────────────────────────────────┘
│
│   └─> Mobile Layout (!isDesktop)
│       ┌─────────────────────────────────┐
│       │ ← Back  Epic Rock Track   [⋯]  │
│       ├─────────────────────────────────┤
│       │                                 │
│       │  [Mixer] [Timeline] [Effects]  │ ← Tabs
│       │  ━━━━━━                         │
│       │                                 │
│       │  Mixer View:                    │
│       │  ┌───────────────────────────┐ │
│       │  │ 🎤 Vocals     [S] [M]    │ │
│       │  │ ▓▓▓▓▓▓▓░░░ 70%           │ │
│       │  │ ▬▬▬▬▬▬▬▬▬▬▬▬▬ Pan: C     │ │
│       │  └───────────────────────────┘ │
│       │  ┌───────────────────────────┐ │
│       │  │ 🎸 Guitar     [S] [M]    │ │
│       │  │ ▓▓▓▓▓▓░░░░ 60%           │ │
│       │  └───────────────────────────┘ │
│       │  ... more stems ...            │
│       │                                 │
│       │  [▶️ Play]   🔊 Master: 70%    │
│       └─────────────────────────────────┘
│
├─> User actions in Studio:
│   │
│   ├─ Adjust stem volumes
│   │  ├─ Drag sliders
│   │  ├─ Real-time audio mixing
│   │  └─ Smooth volume transitions
│   │
│   ├─ Solo/Mute stems
│   │  ├─ [S] Solo: only this stem plays
│   │  ├─ [M] Mute: exclude this stem
│   │  └─ Keyboard shortcuts: S, M keys
│   │
│   ├─ Apply effects (if available)
│   │  ├─ Reverb, Delay
│   │  ├─ EQ (Low, Mid, High)
│   │  ├─ Compression
│   │  └─ Stereo Width
│   │
│   ├─ Navigate timeline
│   │  ├─ Click to seek
│   │  ├─ Drag playhead
│   │  └─ Keyboard: Arrow keys
│   │
│   └─ View sections (if detected)
│       ├─ [Intro] [Verse] [Chorus] [Outro]
│       └─ Click section to jump
│
├─> Edit and mix to satisfaction
│   │
│   └─> Click "Save" or "Export"
│       │
│       └─> Open MixExportDialog
│           ┌─────────────────────────────┐
│           │ Экспорт микса               │
│           ├─────────────────────────────┤
│           │                             │
│           │ Что экспортировать:         │
│           │ ☑ Финальный микс (MP3)     │
│           │ ☐ Отдельные стемы          │
│           │ ☐ Все стемы (ZIP)          │
│           │                             │
│           │ Качество:                   │
│           │ ○ 128 kbps (Fast)          │
│           │ ● 320 kbps (Best)          │
│           │ ○ WAV (Lossless)           │
│           │                             │
│           │ [💾 Скачать] [📤 Share]    │
│           └─────────────────────────────┘
│           │
│           ├─> Click "Скачать"
│           │   ├─ Generate export file
│           │   ├─ Show progress
│           │   └─ Download via browser
│           │
│           └─> Click "Share"
│               ├─ Send via Telegram
│               ├─ Generate shareable link
│               └─ Copy to clipboard
│
└─> SUCCESS: Track mixed and exported! 🎚️
    │
    ├─> Save mix settings (if user has account)
    ├─> Update track metadata
    └─> Show achievement (if first mix)
        "🏆 Первый микс! +100 XP"

END: User has professional control over their music
```

**Время прохождения:** 10-15 минут  
**Ключевые возможности:**

- ✅ Multi-stem separation
- ✅ Real-time mixing
- ✅ Professional controls
- ✅ Multiple export formats
- ✅ Telegram sharing

---

### Flow 3: Collaborative Editing (Будущая функция)

```
START: User wants to collaborate with friend
│
├─> Open track in Stem Studio
│   │
│   └─> Click "Collaborate" button
│       │
│       └─> Open CollaborationPanel
│           ┌─────────────────────────────┐
│           │ Совместная работа           │
│           ├─────────────────────────────┤
│           │ Создать сессию:             │
│           │                             │
│           │ Session name:               │
│           │ [My Mix Session]            │
│           │                             │
│           │ Permissions:                │
│           │ ● Everyone can edit         │
│           │ ○ View only (streaming)     │
│           │                             │
│           │ [Create Session]            │
│           └─────────────────────────────┘
│
├─> Create session
│   │
│   ├─ Generate session_id
│   ├─ Create Supabase Realtime channel
│   └─> Show invite options
│       ┌─────────────────────────────┐
│       │ Пригласить участников       │
│       ├─────────────────────────────┤
│       │ Share link:                 │
│       │ [musicverse.ai/s/abc123]   │
│       │ [📋 Copy] [📤 Share Telegram]│
│       │                             │
│       │ или напрямую:              │
│       │ [@username] [Invite]       │
│       └─────────────────────────────┘
│
├─> Friend receives invite
│   │
│   └─> Click link → Open session
│       │
│       ├─ Request permissions
│       ├─ Connect to Realtime channel
│       └─> Join session
│           │
│           └─> Both users see:
│               ┌─────────────────────────────┐
│               │ 👥 Collaboration (2 active) │
│               ├─────────────────────────────┤
│               │ 👤 You (Owner)              │
│               │ 👤 John (Connected)        │
│               │                             │
│               │ [💬 Chat] [End Session]    │
│               └─────────────────────────────┘
│
├─> Real-time collaboration
│   │
│   ├─ User A adjusts Vocals volume
│   │  └─> User B sees change instantly
│   │       with live cursor indicator:
│   │       🎤 Vocals  👤A ▓▓▓▓▓▓▓░░░ 70%
│   │
│   ├─ User B solos Guitar
│   │  └─> Both hear only Guitar
│   │       Audio state synced via WebRTC
│   │
│   ├─ Chat communication
│   │  ┌─────────────────────────┐
│   │  │ 💬 Chat                 │
│   │  ├─────────────────────────┤
│   │  │ You: Let's boost vocals│
│   │  │ John: Sounds good! 👍  │
│   │  │ [Type message...]       │
│   │  └─────────────────────────┘
│   │
│   └─ Version control (automatic)
│       ├─ Every major change creates snapshot
│       ├─ Can revert to previous versions
│       └─ Conflict resolution via CRDT
│
├─> Export collaborative mix
│   │
│   └─> Both users can export
│       ├─ Full mix with all changes
│       ├─ Individual contribution credits
│       └─ Shared ownership
│
└─> SUCCESS: Collaborative editing complete! 🤝

END: Professional collaboration workflow
```

---

## 🎨 UI/UX Паттерны

### 1. Island Navigation Pattern

**Концепция:** Плавающая навигация, не блокирующая контент

```
Преимущества:
✅ Не занимает место в content area
✅ Всегда доступна (sticky)
✅ Thumb-friendly расположение
✅ Современный дизайн
✅ Haptic feedback

Реализация:
┌────────────────────────────────────────┐
│                                        │
│          Full Content Area             │
│    (No navigation obstruction)         │
│                                        │
│                                        │
└────────────────────────────────────────┘
             Safe area
┌────────────────────────────────────────┐
│  Island Nav (floating, rounded)        │
│  backdrop-blur, shadow                 │
│  [Home] [Library] [+] [Projects] [≡]  │
└────────────────────────────────────────┘
   env(safe-area-inset-bottom)
```

### 2. Progressive Disclosure

**Концепция:** Показывать функции по мере необходимости

```
Уровень 1: Базовый UI (всегда видим)
├─ Basic controls (Play, Pause, Volume)
├─ Essential info (Title, Artist, Duration)
└─ Primary actions (Like, Add to Playlist)

Уровень 2: Расширенный UI (при expand)
├─ Lyrics с автоскроллом
├─ Version switcher (A/B)
├─ Queue management
└─ Sharing options

Уровень 3: Продвинутый UI (отдельные экраны)
├─ Stem Studio (full mixing console)
├─ MIDI Editor (piano roll)
├─ Effects panel
└─ Advanced export options
```

### 3. Optimistic Updates

**Концепция:** Мгновенная обратная связь без ожидания сервера

```
Example: Like button

User clicks ❤️
├─> Immediate visual feedback
│   ├─ Icon: ♡ → ❤️ (filled, red)
│   ├─ Animation: heart scale + bounce
│   ├─ Count: 5 → 6
│   └─ Haptic feedback (if available)
│
├─> Background API call
│   ├─ POST /track_likes
│   └─ Returns success
│
└─> If API fails (rare):
    ├─ Revert visual state
    ├─ Show error toast
    └─ Allow retry
```

### 4. Skeleton Loading

**Концепция:** Показывать структуру контента до загрузки

```
Loading state:
┌─────────────────────────┐
│ ▒▒▒▒▒▒▒▒▒▒ (shimmer)    │ ← Cover placeholder
│ ▒▒▒▒▒▒▒▒                │ ← Title placeholder
│ ▒▒▒▒▒                   │ ← Metadata placeholder
│ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒          │ ← Progress placeholder
└─────────────────────────┘

Loaded state:
┌─────────────────────────┐
│ [Cover Image]           │
│ "Summer Vibes"          │
│ AI Artist · 2:34        │
│ ▓▓▓▓▓▓▓░░░░░░░ 50%     │
└─────────────────────────┘
```

### 5. Swipe Gestures (Mobile)

**Концепция:** Touch-first интерфейс с жестами

```
Track Card Swipe:

Swipe LEFT →
┌─────────────────────────────┐
│ [🎵 Track]    [➕][🔀][❤️] │ ← Actions revealed
└─────────────────────────────┘
     ↑
     └─ [➕] Play Next
        [🔀] Switch Version
        [❤️] Like

Swipe RIGHT ←
┌─────────────────────────────┐
│ [📋][📤][⋯]   [🎵 Track]   │ ← Alternative actions
└─────────────────────────────┘
     ↑
     └─ [📋] Add to Playlist
        [📤] Share
        [⋯] More options
```

### 6. Context-Aware Actions

**Концепция:** Действия зависят от контекста

```
Track Card in Library:
├─ Play, Add to Queue, Like
├─ Add to Playlist
├─ Open Stem Studio
└─ Download, Share, Delete

Track Card in Playlist:
├─ Play, Add to Queue, Like
├─ Remove from Playlist ← Unique action
├─ Move Up/Down ← Unique action
└─ Download, Share

Track Card in Search Results:
├─ Play, Add to Queue, Like
├─ Add to Library ← Unique action
├─ Add to Playlist
└─ View Artist Profile
```

---

## 📊 Ключевые метрики UX

### Time to Value (TTV)

```
Metric: Время до первого трека

Текущий флоу:
├─ Открытие бота: 10 сек
├─ Онбординг: 2-3 мин (9 шагов)
├─ Navigate to Generate: 5 сек
├─ Ввод prompt: 1 мин
├─ Ожидание генерации: 1-2 мин
└─ Прослушивание: 30 сек
Total: 5-7 минут ✅

Оптимизированный флоу (будущее):
├─ Открытие бота: 10 сек
├─ Сокращенный онбординг: 1 мин (5 шагов)
├─ Quick Preset: 10 сек (1 клик)
├─ Ожидание генерации: 1-2 мин
└─ Прослушивание: 30 сек
Total: 3-4 минуты 🎯
Улучшение: -40%
```

### Interaction Efficiency

```
Metric: Количество действий до цели

Создать трек:
Текущий: 5 действий
├─ Click "Создать" (1)
├─ Enter prompt (2)
├─ Click "Создать" (3)
├─ Navigate to Library (4)
└─ Click Play (5)

Оптимизированный: 3 действия
├─ Click Quick Preset (1) ← Готовый промпт
├─ Confirm (2)
└─ Auto-play when ready (3) ← Автоматически
Улучшение: -40%

Добавить в плейлист:
Текущий: 4 действия
├─ Click track menu (1)
├─ Click "Add to Playlist" (2)
├─ Select playlist (3)
└─ Confirm (4)

Swipe-based: 2 действия
├─ Swipe left (1)
└─ Click playlist icon (2)
Улучшение: -50%
```

### Cognitive Load

```
Metric: Сложность интерфейса

Navigation Items:
├─ BottomNavigation: 5 items ✅ (optimal)
├─ MoreMenu: 15+ items (organized) ✅
└─ Stem Studio controls: ~20 (grouped) ⚠️

Recommendations:
✅ Use progressive disclosure
✅ Group related actions
✅ Hide advanced features by default
⚠️ Provide "Learn Mode" для новичков
```

---

## 🔄 Continuous Improvement

### A/B Testing Candidates

```
1. Onboarding Length
   A: 9 steps (current)
   B: 5 steps (reduced)
   Metric: Completion rate, TTV

2. Generate Sheet Mode
   A: Simple Mode default
   B: Custom Mode default
   Metric: Generation success, user satisfaction

3. Track Card Layout
   A: Grid view default
   B: List view default
   Metric: Engagement, play rate

4. Quick Presets
   A: Carousel (horizontal scroll)
   B: Grid (2x5)
   Metric: Click-through rate, conversion

5. Player Expand Behavior
   A: Manual expand (click button)
   B: Auto-expand on first play
   Metric: Fullscreen usage, lyrics engagement
```

### User Feedback Loop

```
┌─────────────────────────────────────┐
│ Collect Feedback                    │
├─────────────────────────────────────┤
│ ├─ In-app surveys                   │
│ ├─ NPS scores                       │
│ ├─ Feature requests                 │
│ ├─ Bug reports                      │
│ └─ Analytics (behavior tracking)    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Analyze & Prioritize                │
├─────────────────────────────────────┤
│ ├─ Identify pain points             │
│ ├─ Find opportunities               │
│ ├─ Prioritize by impact/effort      │
│ └─ Create improvement roadmap       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Implement Changes                   │
├─────────────────────────────────────┤
│ ├─ Design iterations                │
│ ├─ Prototype & test                 │
│ ├─ Develop & QA                     │
│ └─ Gradual rollout                  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Measure Impact                      │
├─────────────────────────────────────┤
│ ├─ Track key metrics                │
│ ├─ Compare before/after             │
│ ├─ Collect new feedback             │
│ └─ Iterate further                  │
└─────────────────────────────────────┘
              ↓
         [Repeat Cycle]
```

---

## 🎯 Заключение

MusicVerse AI имеет **продуманную и современную архитектуру** с фокусом на mobile-first подход.

**Ключевые сильные стороны UX:**

- ✅ Island Navigation (современный, удобный)
- ✅ Progressive Disclosure (не перегружает новичков)
- ✅ Optimistic Updates (мгновенная обратная связь)
- ✅ Real-time sync (живые обновления)
- ✅ Telegram Integration (native experience)

**Области для улучшения:**

- 🔧 Сократить онбординг (9 → 5 шагов)
- 🔧 Quick Presets для новичков
- 🔧 Swipe gestures для всех действий
- 🔧 Context-aware помощь
- 🔧 Collaborative features

**Рекомендации:**

1. Фокус на Time to Value (первый трек за 3-4 мин)
2. Улучшить Discovery (Quick Presets, Templates)
3. Добавить Collaborative Editing (killer feature)
4. A/B тестирование ключевых флоу
5. Continuous feedback loop

---

**Документ создан:** 25 декабря 2025  
**Версия:** 1.0  
**Связанные документы:**

- ПЛАН*РАЗВИТИЯ*И*УЛУЧШЕНИЯ*СТУДИИ.md
- MOBILE_OPTIMIZATION_SUMMARY.md
- [NAVIGATION.md](../NAVIGATION.md)
