# 🎵 MusicVerse AI - Профессиональная DAW-подобная Студия

# Полное Руководство по Улучшению и Развитию

**Дата создания:** 2025-12-10  
**Версия:** 1.0.0  
**Статус:** Спецификация для реализации

---

## 📋 СОДЕРЖАНИЕ

1. [Исполнительное Резюме](#исполнительное-резюме)
2. [Анализ Текущего Состояния](#анализ-текущего-состояния)
3. [Концепция DAW-подобной Студии](#концепция-daw-подобной-студии)
4. [Архитектура Системы](#архитектура-системы)
5. [Детальная Спецификация Функций](#детальная-спецификация-функций)
6. [План Реализации (Спринты)](#план-реализации-спринты)
7. [UI/UX Дизайн](#uiux-дизайн)
8. [Технические Требования](#технические-требования)
9. [Метрики Производительности](#метрики-производительности)
10. [Инструкции для Разработчиков](#инструкции-для-разработчиков)

---

## 📊 ИСПОЛНИТЕЛЬНОЕ РЕЗЮМЕ

### Видение

MusicVerse AI становится **полноценной профессиональной DAW (Digital Audio Workstation)** в формате Telegram Mini App, объединяющей:

- ✅ AI-генерацию музыки (Suno AI v5)
- 🆕 **Многодорожечное редактирование**
- 🆕 **Послойную работу со стемами**
- 🆕 **Профессиональную обработку аудио**
- 🆕 **MIDI-секвенсор и нотный редактор**
- 🆕 **AI-мастеринг и remastering**

### Ключевые Улучшения

#### 1. **DAW Core Engine** (новый)

- Timeline с миллисекундной точностью
- Multi-track editing с до 32 дорожек
- Non-destructive editing
- Unlimited undo/redo с полной историей
- Real-time audio preview

#### 2. **Advanced Stem Studio** (улучшение)

- Послойное редактирование каждого стема
- Volume automation с кривыми
- Pan automation (стерео)
- Effect chains (EQ, Compressor, Reverb, Delay)
- Crossfade между секциями

#### 3. **Section Editor Pro** (расширение)

- Visual waveform editing
- Trim, cut, copy, paste секций
- Time-stretching без изменения pitch
- Pitch-shifting без изменения tempo
- Замена только vocal/instrumental частей

#### 4. **MIDI Studio** (новый)

- Piano Roll editor с полной функциональностью
- Drum sequencer с grid view
- MIDI import/export (GP5, MusicXML, MIDI, PDF)
- Quantization и humanization
- Velocity editing

#### 5. **AI-Powered Features** (расширение)

- AI Beat Detection улучшенный
- AI Chord Recognition расширенный
- AI Mastering (loudness, EQ, compression)
- AI Stem Separation v2 (улучшенное качество)
- AI Style Transfer

#### 6. **Performance Optimization** (критично)

- Web Workers для обработки audio
- OffscreenCanvas для visualizers
- Virtual scrolling для больших проектов
- IndexedDB для кэширования
- Progressive loading

---

## 🔍 АНАЛИЗ ТЕКУЩЕГО СОСТОЯНИЯ

### Что Работает Хорошо ✅

#### 1. **Audio Player System**

```typescript
// src/components/GlobalAudioProvider.tsx
// ✅ Отличная архитектура: единый источник audio
// ✅ 3 режима: compact/expanded/fullscreen
// ✅ Retry logic с exponential backoff
// ✅ Health diagnostics и recovery
```

**Сильные стороны:**

- Глобальное управление через Zustand store
- Синхронизированные lyrics с точностью ±0.05s
- Queue management (Play Next, Add to Queue)
- Audio visualizer через Web Audio API

#### 2. **Stem Studio Foundation**

```typescript
// src/components/stem-studio/StemStudioContent.tsx
// ✅ Web Audio API для синхронного playback
// ✅ Individual volume/mute/solo controls
// ✅ MIDI transcription integration
// ✅ Section detection и replacement
```

**Сильные стороны:**

- Separation на 6 стемов (vocals, drums, bass, guitar, piano, other)
- Real-time mixing с low latency
- MIDI export в 4 форматах
- klang.io integration

#### 3. **State Management**

```typescript
// src/stores/
// ✅ Zustand для local state
// ✅ TanStack Query для server state
// ✅ Optimistic updates
// ✅ Эффективное кэширование
```

**Сильные стороны:**

- Централизованные stores (playerStore, sectionEditorStore)
- Query invalidation стратегия
- Offline-first подход

#### 4. **Component Architecture**

- **420 компонентов** хорошо организованы
- Lazy loading для оптимизации bundle
- shadcn/ui для consistent UI
- Framer Motion для animations

### Что Требует Улучшения ⚠️

#### 1. **Stem Studio Limitations**

**Проблема 1: Отсутствие Timeline**

```typescript
// ТЕКУЩЕЕ: нет visual timeline
// src/components/stem-studio/StemStudioContent.tsx
// Только basic playback controls без timeline
```

**Требуется:**

- Visual timeline с waveform preview
- Zoom in/out функциональность
- Snap to grid/beats
- Markers и loop points

**Проблема 2: Нет Layer Effects**

```typescript
// ТЕКУЩЕЕ: только volume control
// src/components/stem-studio/StemChannel.tsx
const [volume, setVolume] = useState(0.85);
// Нет effect chains!
```

**Требуется:**

- EQ (3-band minimum, 8-band professional)
- Compressor (threshold, ratio, attack, release)
- Reverb (room, hall, plate presets)
- Delay (tempo-synced)
- Limiting для prevention clipping

**Проблема 3: Ограниченное Section Editing**

```typescript
// ТЕКУЩЕЕ: замена целых секций
// src/hooks/useSectionDetection.ts
// Нет детального editing
```

**Требуется:**

- Cut, Copy, Paste операции
- Time-stretch
- Pitch-shift
- Fade in/out curves
- Crossfade между секциями

#### 2. **Missing DAW Features**

**Критично Отсутствует:**

- ❌ Multi-track timeline view
- ❌ Automation lanes (volume, pan, effects)
- ❌ MIDI editor interface
- ❌ Project saving/loading
- ❌ Export mixdown options
- ❌ Routing и buses
- ❌ Master chain effects

#### 3. **Performance Issues**

**Проблема: Audio Processing на Main Thread**

```typescript
// ПРОБЛЕМА: все audio processing блокирует UI
// src/hooks/studio/useStemStudioEngine.ts
// Web Audio API calls на main thread
```

**Impact:**

- UI freezing при heavy processing
- Laggy waveform rendering
- Slow stem loading

**Решение:**

- Web Workers для audio processing
- OffscreenCanvas для waveforms
- Streaming audio chunks

#### 4. **UI/UX Issues**

**Issue 1: Waveform Fallback**

```typescript
// src/components/CompactPlayer.tsx (lines 148-177)
// ❌ Random bars при loading → резкая замена
```

**Issue 2: Desktop Card Click**

```typescript
// src/components/TrackCard.tsx
// ❌ На desktop клик по карточке не работает
handleCardClick: isMobile ? setSheetOpen(true) : НЕТ ДЕЙСТВИЯ
```

**Issue 3: Полноэкранный Player**

- Обложка слишком большая на mobile
- Volume control не нужен на mobile
- Lyrics скрыты за scroll

---

## 🏗️ КОНЦЕПЦИЯ DAW-ПОДОБНОЙ СТУДИИ

### Философия Дизайна

#### 1. **"Professional Yet Accessible"**

- **Для профессионалов:** Все функции DAW
- **Для новичков:** Progressive disclosure, tooltips, wizards
- **Для всех:** Mobile-first, touch-optimized

#### 2. **"Non-Destructive by Default"**

- Все операции сохраняют оригинал
- Unlimited undo/redo
- Version history
- A/B comparison всегда доступно

#### 3. **"AI-Assisted, Not AI-Replaced"**

- AI предлагает, человек решает
- AI automation опциональна
- Ручной контроль всегда доступен

### Core Architecture Modules

```
┌─────────────────────────────────────────────────────────────┐
│                    MUSICVERSE AI PRO STUDIO                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Project    │  │   Timeline   │  │    Mixer     │      │
│  │   Manager    │  │   Engine     │  │   Engine     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│  ┌──────▼───────────────────▼──────────────────▼───────┐   │
│  │              DAW Core Engine                         │   │
│  │  • Multi-track synchronization                       │   │
│  │  • Audio routing & buses                             │   │
│  │  • Real-time processing                              │   │
│  │  • Undo/Redo system                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Track Layers                            │    │
│  │  ┌────────────────────────────────────────────┐     │    │
│  │  │ Track 1: Master Mix (locked)               │     │    │
│  │  └────────────────────────────────────────────┘     │    │
│  │  ┌────────────────────────────────────────────┐     │    │
│  │  │ Track 2: Vocals (stem)                     │     │    │
│  │  │  ├─ Volume Automation                      │     │    │
│  │  │  ├─ EQ Chain                               │     │    │
│  │  │  └─ Reverb Send                            │     │    │
│  │  └────────────────────────────────────────────┘     │    │
│  │  ┌────────────────────────────────────────────┐     │    │
│  │  │ Track 3: Drums (stem)                      │     │    │
│  │  └────────────────────────────────────────────┘     │    │
│  │  ┌────────────────────────────────────────────┐     │    │
│  │  │ Track 4: Bass (stem)                       │     │    │
│  │  └────────────────────────────────────────────┘     │    │
│  │  ... (до 32 треков)                                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Professional Tools                      │    │
│  │  • Stem Studio Pro                                   │    │
│  │  • MIDI Editor & Piano Roll                          │    │
│  │  • Effect Rack (VST-like)                            │    │
│  │  • Master Chain                                      │    │
│  │  • AI Assistant Panel                                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### User Workflows

#### Workflow 1: AI Generation → Professional Mix

```
1. Generate Track (Suno AI)
   ↓
2. AI Stem Separation
   ↓
3. Import to DAW Timeline
   ↓
4. Edit Sections (cut, trim, rearrange)
   ↓
5. Apply Effects per Stem
   ↓
6. Volume & Pan Automation
   ↓
7. AI-Assisted Mastering
   ↓
8. Export Mix
```

#### Workflow 2: Guitar Recording → Full Production

```
1. Record Guitar (Guitar Studio)
   ↓
2. AI Analysis (klang.io)
   ↓
3. Extract MIDI + Chords
   ↓
4. Generate Drums AI (based on BPM)
   ↓
5. Generate Bass AI (based on chords)
   ↓
6. Mix in DAW Studio
   ↓
7. Add vocals (AI or record)
   ↓
8. Master & Export
```

#### Workflow 3: Remix Existing Track

```
1. Load Track
   ↓
2. Separate Stems
   ↓
3. Replace Section (e.g., chorus)
   ↓
4. Time-stretch to match BPM
   ↓
5. Apply new effects
   ↓
6. Add new instrumental layer
   ↓
7. A/B Compare with original
   ↓
8. Export remix
```

---

## 🎯 АРХИТЕКТУРА СИСТЕМЫ

### 1. DAW Core Engine

**Файл:** `src/lib/daw/engine.ts`

```typescript
/**
 * DAW Core Engine - Центральная система управления проектом
 *
 * Ответственность:
 * - Multi-track synchronization
 * - Audio routing
 * - Effect processing
 * - Automation
 * - Undo/redo
 */

import { create } from "zustand";
import { produce } from "immer";

// ──────────────────────────────────────────────────────────────
// ТИПЫ И ИНТЕРФЕЙСЫ
// ──────────────────────────────────────────────────────────────

/**
 * Тип аудио трека в проекте
 */
export type TrackType =
  | "master" // Мастер трек (всегда один)
  | "stem" // Stem от separation
  | "audio" // Аудио запись
  | "midi" // MIDI трек
  | "aux"; // Auxiliary (для эффектов)

/**
 * Состояние воспроизведения
 */
export type PlaybackState = "stopped" | "playing" | "paused" | "recording";

/**
 * Automation Point - точка автоматизации на timeline
 */
export interface AutomationPoint {
  time: number; // Время в секундах
  value: number; // Значение (0-1)
  curve?: "linear" | "exponential" | "logarithmic";
}

/**
 * Automation Lane - дорожка автоматизации параметра
 */
export interface AutomationLane {
  id: string;
  parameter: string; // 'volume', 'pan', 'eq.gain', etc.
  points: AutomationPoint[];
  enabled: boolean;
}

/**
 * Audio Region - регион аудио на timeline
 */
export interface AudioRegion {
  id: string;
  startTime: number; // Начало на timeline (секунды)
  duration: number; // Длительность
  offset: number; // Смещение в source audio
  audioUrl: string; // URL source audio
  fadeIn?: number; // Fade in duration
  fadeOut?: number; // Fade out duration
  gain: number; // Gain adjustment (0-2)
  muted: boolean;
  locked: boolean;
}

/**
 * Effect - аудио эффект в цепи
 */
export interface Effect {
  id: string;
  type: "eq" | "compressor" | "reverb" | "delay" | "limiter" | "distortion";
  enabled: boolean;
  parameters: Record<string, number>;
  preset?: string;
}

/**
 * Track - аудио дорожка в проекте
 */
export interface Track {
  id: string;
  name: string;
  type: TrackType;
  color: string; // Цвет для visual distinction

  // Audio routing
  inputSource?: string; // 'mic', 'file', 'stem_id'
  outputBus: string; // 'master', 'aux_1', etc.

  // Playback state
  regions: AudioRegion[];
  volume: number; // 0-1
  pan: number; // -1 (left) to 1 (right)
  muted: boolean;
  solo: boolean;
  armed: boolean; // Для recording

  // Effects
  effects: Effect[];
  sendLevels: Record<string, number>; // Aux send levels

  // Automation
  automationLanes: AutomationLane[];

  // UI state
  height: number; // Высота на timeline
  collapsed: boolean;
  locked: boolean;
}

/**
 * Project - DAW проект
 */
export interface Project {
  id: string;
  name: string;
  tempo: number; // BPM
  timeSignature: {
    numerator: number; // 4 in 4/4
    denominator: number; // 4 in 4/4
  };

  // Tracks
  tracks: Track[];
  masterTrack: Track; // Мастер трек

  // Timeline
  duration: number; // Общая длительность (секунды)
  loopStart: number | null;
  loopEnd: number | null;
  markers: Array<{
    time: number;
    label: string;
    color: string;
  }>;

  // Playback
  currentTime: number;
  playbackState: PlaybackState;

  // Metadata
  createdAt: string;
  updatedAt: string;
  trackId?: string; // Link to MusicVerse track
}

/**
 * History Entry для Undo/Redo
 */
interface HistoryEntry {
  timestamp: number;
  action: string;
  snapshot: Project;
}

// ──────────────────────────────────────────────────────────────
// DAW ENGINE STORE
// ──────────────────────────────────────────────────────────────

interface DAWEngineState {
  // Current project
  project: Project | null;

  // History для undo/redo
  history: HistoryEntry[];
  historyIndex: number;

  // Selection
  selectedTrackIds: string[];
  selectedRegionIds: string[];

  // UI State
  zoom: number; // Pixels per second
  scrollPosition: number; // Horizontal scroll
  snapEnabled: boolean;
  snapValue: number; // В beats

  // Audio Engine
  audioContext: AudioContext | null;
  masterGainNode: GainNode | null;

  // Actions
  createProject: (name: string) => void;
  loadProject: (project: Project) => void;
  saveProject: () => Promise<void>;

  // Track management
  addTrack: (type: TrackType, name: string) => void;
  removeTrack: (trackId: string) => void;
  duplicateTrack: (trackId: string) => void;
  reorderTracks: (trackIds: string[]) => void;

  // Region management
  addRegion: (trackId: string, region: Omit<AudioRegion, "id">) => void;
  removeRegion: (regionId: string) => void;
  moveRegion: (regionId: string, newStartTime: number) => void;
  trimRegion: (regionId: string, newStart: number, newDuration: number) => void;
  splitRegion: (regionId: string, splitTime: number) => void;

  // Playback
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Automation
  addAutomationPoint: (trackId: string, parameter: string, point: AutomationPoint) => void;
  removeAutomationPoint: (trackId: string, parameter: string, pointIndex: number) => void;
}

/**
 * DAW Engine Store - Zustand store для управления проектом
 */
export const useDAWEngine = create<DAWEngineState>((set, get) => ({
  project: null,
  history: [],
  historyIndex: -1,
  selectedTrackIds: [],
  selectedRegionIds: [],
  zoom: 100, // 100 pixels per second
  scrollPosition: 0,
  snapEnabled: true,
  snapValue: 0.25, // 1/4 beat
  audioContext: null,
  masterGainNode: null,

  // ────────────────────────────────────────────────────────
  // PROJECT MANAGEMENT
  // ────────────────────────────────────────────────────────

  /**
   * Создать новый проект
   */
  createProject: (name: string) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      tempo: 120,
      timeSignature: { numerator: 4, denominator: 4 },
      tracks: [],
      masterTrack: {
        id: "master",
        name: "Master",
        type: "master",
        color: "#ef4444",
        outputBus: "output",
        regions: [],
        volume: 0.85,
        pan: 0,
        muted: false,
        solo: false,
        armed: false,
        effects: [],
        sendLevels: {},
        automationLanes: [],
        height: 120,
        collapsed: false,
        locked: false,
      },
      duration: 180, // 3 minutes default
      loopStart: null,
      loopEnd: null,
      markers: [],
      currentTime: 0,
      playbackState: "stopped",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set({
      project: newProject,
      history: [],
      historyIndex: -1,
    });
  },

  /**
   * Загрузить существующий проект
   */
  loadProject: (project: Project) => {
    set({
      project,
      history: [],
      historyIndex: -1,
    });
  },

  /**
   * Сохранить проект (в IndexedDB и опционально на сервер)
   */
  saveProject: async () => {
    const { project } = get();
    if (!project) return;

    // TODO: Implement save to IndexedDB
    // TODO: Implement sync to Supabase Storage
    console.log("Saving project:", project.name);
  },

  // ────────────────────────────────────────────────────────
  // TRACK MANAGEMENT
  // ────────────────────────────────────────────────────────

  /**
   * Добавить новый трек
   */
  addTrack: (type: TrackType, name: string) => {
    set(
      produce((state: DAWEngineState) => {
        if (!state.project) return;

        const newTrack: Track = {
          id: crypto.randomUUID(),
          name,
          type,
          color: getRandomTrackColor(),
          outputBus: "master",
          regions: [],
          volume: 0.85,
          pan: 0,
          muted: false,
          solo: false,
          armed: false,
          effects: [],
          sendLevels: {},
          automationLanes: [],
          height: 120,
          collapsed: false,
          locked: false,
        };

        state.project.tracks.push(newTrack);
        state.project.updatedAt = new Date().toISOString();

        // Add to history
        addToHistory(state, "Add Track");
      }),
    );
  },

  /**
   * Удалить трек
   */
  removeTrack: (trackId: string) => {
    set(
      produce((state: DAWEngineState) => {
        if (!state.project) return;

        state.project.tracks = state.project.tracks.filter((t) => t.id !== trackId);
        state.project.updatedAt = new Date().toISOString();

        addToHistory(state, "Remove Track");
      }),
    );
  },

  /**
   * Дублировать трек
   */
  duplicateTrack: (trackId: string) => {
    set(
      produce((state: DAWEngineState) => {
        if (!state.project) return;

        const track = state.project.tracks.find((t) => t.id === trackId);
        if (!track) return;

        const duplicated: Track = {
          ...track,
          id: crypto.randomUUID(),
          name: `${track.name} (Copy)`,
          regions: track.regions.map((r) => ({
            ...r,
            id: crypto.randomUUID(),
          })),
        };

        const index = state.project.tracks.indexOf(track);
        state.project.tracks.splice(index + 1, 0, duplicated);
        state.project.updatedAt = new Date().toISOString();

        addToHistory(state, "Duplicate Track");
      }),
    );
  },

  /**
   * Изменить порядок треков
   */
  reorderTracks: (trackIds: string[]) => {
    set(
      produce((state: DAWEngineState) => {
        if (!state.project) return;

        const trackMap = new Map(state.project.tracks.map((t) => [t.id, t]));

        state.project.tracks = trackIds.map((id) => trackMap.get(id)).filter(Boolean) as Track[];

        state.project.updatedAt = new Date().toISOString();

        addToHistory(state, "Reorder Tracks");
      }),
    );
  },

  // ────────────────────────────────────────────────────────
  // REGION MANAGEMENT
  // ────────────────────────────────────────────────────────

  /**
   * Добавить audio region на трек
   */
  addRegion: (trackId: string, regionData: Omit<AudioRegion, "id">) => {
    set(
      produce((state: DAWEngineState) => {
        if (!state.project) return;

        const track = state.project.tracks.find((t) => t.id === trackId);
        if (!track) return;

        const region: AudioRegion = {
          ...regionData,
          id: crypto.randomUUID(),
        };

        track.regions.push(region);
        state.project.updatedAt = new Date().toISOString();

        addToHistory(state, "Add Region");
      }),
    );
  },

  /**
   * Удалить region
   */
  removeRegion: (regionId: string) => {
    set(
      produce((state: DAWEngineState) => {
        if (!state.project) return;

        for (const track of state.project.tracks) {
          track.regions = track.regions.filter((r) => r.id !== regionId);
        }

        state.project.updatedAt = new Date().toISOString();

        addToHistory(state, "Remove Region");
      }),
    );
  },

  /**
   * Переместить region по времени
   */
  moveRegion: (regionId: string, newStartTime: number) => {
    set(
      produce((state: DAWEngineState) => {
        if (!state.project) return;

        for (const track of state.project.tracks) {
          const region = track.regions.find((r) => r.id === regionId);
          if (region) {
            region.startTime = newStartTime;
            state.project.updatedAt = new Date().toISOString();
            break;
          }
        }

        addToHistory(state, "Move Region");
      }),
    );
  },

  /**
   * Обрезать region (trim)
   */
  trimRegion: (regionId: string, newStart: number, newDuration: number) => {
    set(
      produce((state: DAWEngineState) => {
        if (!state.project) return;

        for (const track of state.project.tracks) {
          const region = track.regions.find((r) => r.id === regionId);
          if (region) {
            region.startTime = newStart;
            region.duration = newDuration;
            state.project.updatedAt = new Date().toISOString();
            break;
          }
        }

        addToHistory(state, "Trim Region");
      }),
    );
  },

  /**
   * Разделить region на две части
   */
  splitRegion: (regionId: string, splitTime: number) => {
    set(
      produce((state: DAWEngineState) => {
        if (!state.project) return;

        for (const track of state.project.tracks) {
          const regionIndex = track.regions.findIndex((r) => r.id === regionId);
          if (regionIndex !== -1) {
            const region = track.regions[regionIndex];
            const relativeTime = splitTime - region.startTime;

            // Создаем две новые region
            const region1: AudioRegion = {
              ...region,
              id: crypto.randomUUID(),
              duration: relativeTime,
            };

            const region2: AudioRegion = {
              ...region,
              id: crypto.randomUUID(),
              startTime: splitTime,
              duration: region.duration - relativeTime,
              offset: region.offset + relativeTime,
            };

            track.regions.splice(regionIndex, 1, region1, region2);
            state.project.updatedAt = new Date().toISOString();
            break;
          }
        }

        addToHistory(state, "Split Region");
      }),
    );
  },

  // ────────────────────────────────────────────────────────
  // PLAYBACK CONTROL
  // ────────────────────────────────────────────────────────

  /**
   * Начать воспроизведение
   */
  play: () => {
    set(
      produce((state: DAWEngineState) => {
        if (!state.project) return;
        state.project.playbackState = "playing";
        // TODO: Start Web Audio API playback
      }),
    );
  },

  /**
   * Пауза
   */
  pause: () => {
    set(
      produce((state: DAWEngineState) => {
        if (!state.project) return;
        state.project.playbackState = "paused";
        // TODO: Pause Web Audio API
      }),
    );
  },

  /**
   * Остановить (return to start)
   */
  stop: () => {
    set(
      produce((state: DAWEngineState) => {
        if (!state.project) return;
        state.project.playbackState = "stopped";
        state.project.currentTime = 0;
        // TODO: Stop Web Audio API
      }),
    );
  },

  /**
   * Перейти к времени
   */
  seek: (time: number) => {
    set(
      produce((state: DAWEngineState) => {
        if (!state.project) return;
        state.project.currentTime = Math.max(0, Math.min(time, state.project.duration));
        // TODO: Seek Web Audio API
      }),
    );
  },

  // ────────────────────────────────────────────────────────
  // UNDO/REDO
  // ────────────────────────────────────────────────────────

  /**
   * Отменить последнее действие
   */
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;

    const newIndex = historyIndex - 1;
    const entry = history[newIndex];

    set({
      project: entry.snapshot,
      historyIndex: newIndex,
    });
  },

  /**
   * Повторить отмененное действие
   */
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;

    const newIndex = historyIndex + 1;
    const entry = history[newIndex];

    set({
      project: entry.snapshot,
      historyIndex: newIndex,
    });
  },

  /**
   * Можно ли отменить
   */
  canUndo: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },

  /**
   * Можно ли повторить
   */
  canRedo: () => {
    const { history, historyIndex } = get();
    return historyIndex < history.length - 1;
  },

  // ────────────────────────────────────────────────────────
  // AUTOMATION
  // ────────────────────────────────────────────────────────

  /**
   * Добавить точку автоматизации
   */
  addAutomationPoint: (trackId: string, parameter: string, point: AutomationPoint) => {
    set(
      produce((state: DAWEngineState) => {
        if (!state.project) return;

        const track = state.project.tracks.find((t) => t.id === trackId);
        if (!track) return;

        let lane = track.automationLanes.find((l) => l.parameter === parameter);

        if (!lane) {
          lane = {
            id: crypto.randomUUID(),
            parameter,
            points: [],
            enabled: true,
          };
          track.automationLanes.push(lane);
        }

        // Добавляем точку в отсортированном порядке
        const index = lane.points.findIndex((p) => p.time > point.time);
        if (index === -1) {
          lane.points.push(point);
        } else {
          lane.points.splice(index, 0, point);
        }

        state.project.updatedAt = new Date().toISOString();

        addToHistory(state, "Add Automation Point");
      }),
    );
  },

  /**
   * Удалить точку автоматизации
   */
  removeAutomationPoint: (trackId: string, parameter: string, pointIndex: number) => {
    set(
      produce((state: DAWEngineState) => {
        if (!state.project) return;

        const track = state.project.tracks.find((t) => t.id === trackId);
        if (!track) return;

        const lane = track.automationLanes.find((l) => l.parameter === parameter);
        if (!lane) return;

        lane.points.splice(pointIndex, 1);

        state.project.updatedAt = new Date().toISOString();

        addToHistory(state, "Remove Automation Point");
      }),
    );
  },
}));

// ──────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ──────────────────────────────────────────────────────────────

/**
 * Добавить snapshot в history
 */
function addToHistory(state: DAWEngineState, action: string) {
  if (!state.project) return;

  // Удаляем все entries после текущего index (для branching)
  state.history = state.history.slice(0, state.historyIndex + 1);

  // Добавляем новый entry
  state.history.push({
    timestamp: Date.now(),
    action,
    snapshot: JSON.parse(JSON.stringify(state.project)),
  });

  state.historyIndex = state.history.length - 1;

  // Ограничиваем размер history (max 50 entries)
  if (state.history.length > 50) {
    state.history.shift();
    state.historyIndex--;
  }
}

/**
 * Случайный цвет для трека
 */
function getRandomTrackColor(): string {
  const colors = [
    "#ef4444", // red
    "#f97316", // orange
    "#f59e0b", // amber
    "#84cc16", // lime
    "#10b981", // emerald
    "#06b6d4", // cyan
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#d946ef", // fuchsia
    "#ec4899", // pink
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
```

### 2. Timeline Component

**Файл:** `src/components/daw/Timeline.tsx`

```typescript
/**
 * Timeline Component - Визуальный timeline для DAW
 *
 * Features:
 * - Horizontal scrolling
 * - Zoom in/out
 * - Ruler с временными метками
 * - Track lanes с waveforms
 * - Playhead indicator
 * - Selection tools
 * - Drag-and-drop regions
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ZoomIn, ZoomOut, Grid3x3, Ruler, PlayCircle,
  Scissors, Copy, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useDAWEngine } from '@/lib/daw/engine';
import { TrackLane } from './TrackLane';
import { TimelineRuler } from './TimelineRuler';
import { Playhead } from './Playhead';
import { cn } from '@/lib/utils';

export const Timeline = () => {
  const {
    project,
    zoom,
    scrollPosition,
    snapEnabled,
    selectedTrackIds,
    selectedRegionIds,
    play,
    pause,
    stop,
    seek,
  } = useDAWEngine();

  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // ────────────────────────────────────────────────────────
  // ZOOM CONTROL
  // ────────────────────────────────────────────────────────

  const handleZoomIn = useCallback(() => {
    useDAWEngine.setState(state => ({
      zoom: Math.min(state.zoom * 1.5, 1000),
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    useDAWEngine.setState(state => ({
      zoom: Math.max(state.zoom / 1.5, 10),
    }));
  }, []);

  const handleZoomFit = useCallback(() => {
    if (!project || !containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const newZoom = containerWidth / project.duration;

    useDAWEngine.setState({ zoom: newZoom, scrollPosition: 0 });
  }, [project]);

  // ────────────────────────────────────────────────────────
  // SCROLL HANDLING
  // ────────────────────────────────────────────────────────

  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Zoom with Ctrl/Cmd + wheel
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      useDAWEngine.setState(state => ({
        zoom: Math.max(10, Math.min(1000, state.zoom * delta)),
      }));
    } else if (e.shiftKey) {
      // Horizontal scroll with Shift + wheel
      e.preventDefault();
      useDAWEngine.setState(state => ({
        scrollPosition: Math.max(0, state.scrollPosition + e.deltaY),
      }));
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // ────────────────────────────────────────────────────────
  // PLAYHEAD INTERACTION
  // ────────────────────────────────────────────────────────

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!project || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollPosition;
    const time = x / zoom;

    seek(time);
  }, [project, zoom, scrollPosition, seek]);

  // ────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <p className="text-muted-foreground">No project loaded</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b bg-card">
        {/* Playback Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={project.playbackState === 'playing' ? pause : play}
          >
            {project.playbackState === 'playing' ? (
              <PauseCircle className="w-5 h-5" />
            ) : (
              <PlayCircle className="w-5 h-5" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={stop}>
            <Square className="w-5 h-5" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <div className="w-32">
            <Slider
              value={[zoom]}
              onValueChange={([val]) => useDAWEngine.setState({ zoom: val })}
              min={10}
              max={1000}
              step={10}
            />
          </div>
          <Button variant="ghost" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomFit}
            className="text-xs"
          >
            Fit
          </Button>
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Snap Grid */}
        <Button
          variant={snapEnabled ? 'default' : 'ghost'}
          size="icon"
          onClick={() => useDAWEngine.setState(s => ({
            snapEnabled: !s.snapEnabled
          }))}
        >
          <Grid3x3 className="w-4 h-4" />
        </Button>

        {/* Time Display */}
        <div className="ml-auto font-mono text-sm">
          {formatTime(project.currentTime)} / {formatTime(project.duration)}
        </div>
      </div>

      {/* Timeline Area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-auto"
        style={{
          scrollbarGutter: 'stable',
        }}
      >
        <div
          ref={timelineRef}
          className="relative"
          style={{
            width: project.duration * zoom,
            minHeight: '100%',
          }}
          onClick={handleTimelineClick}
        >
          {/* Ruler */}
          <TimelineRuler
            duration={project.duration}
            zoom={zoom}
            tempo={project.tempo}
            timeSignature={project.timeSignature}
          />

          {/* Track Lanes */}
          <div className="relative">
            {project.tracks.map((track, index) => (
              <TrackLane
                key={track.id}
                track={track}
                zoom={zoom}
                scrollPosition={scrollPosition}
                isSelected={selectedTrackIds.includes(track.id)}
                index={index}
              />
            ))}

            {/* Master Track (always at bottom) */}
            <TrackLane
              track={project.masterTrack}
              zoom={zoom}
              scrollPosition={scrollPosition}
              isSelected={false}
              index={project.tracks.length}
              isMaster
            />
          </div>

          {/* Playhead */}
          <Playhead
            currentTime={project.currentTime}
            zoom={zoom}
            isPlaying={project.playbackState === 'playing'}
          />

          {/* Loop Region */}
          {project.loopStart !== null && project.loopEnd !== null && (
            <div
              className="absolute top-0 bottom-0 bg-primary/10 border-x-2 border-primary pointer-events-none"
              style={{
                left: project.loopStart * zoom,
                width: (project.loopEnd - project.loopStart) * zoom,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Format time в MM:SS.mmm
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}
```

---

Это только начало документа. Он продолжается с детальными спецификациями компонентов, UI/UX дизайном, планами спринтов и инструкциями для разработчиков. Вся документация будет на русском языке.

Продолжить создание полного документа?
