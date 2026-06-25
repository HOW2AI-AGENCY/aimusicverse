# 🚀 MusicVerse AI - План оптимизации 2026

**Версия:** 1.0.0  
**Дата создания:** 21 декабря 2025  
**Период действия:** Январь - Июнь 2026  
**Базовый документ:** [CURRENT_STATE_ANALYSIS_2025-12-21.md](CURRENT_STATE_ANALYSIS_2025-12-21.md)

---

## 📋 Оглавление

1. [Резюме](#резюме)
2. [Критические задачи (Немедленно)](#критические-задачи-немедленно)
3. [Sprint 027: Consolidation](#sprint-027-consolidation)
4. [Sprint 028: Mobile Polish](#sprint-028-mobile-polish)
5. [Q1 2026: Ключевые функции](#q1-2026-ключевые-функции)
6. [Q2 2026: Масштабирование](#q2-2026-масштабирование)
7. [Метрики и KPI](#метрики-и-kpi)
8. [Риски и митигация](#риски-и-митигация)

---

## 📊 Резюме

### Цели оптимизации

**Performance:**

- Bundle size: 500 KB → **<450 KB** (brotli)
- TTI (4G): ~4.5s → **<3s**
- List FPS: 45 → **>58 FPS**
- Lighthouse: TBD → **>90**

**Code Quality:**

- Stem Studio: 94 файла → **65 файлов** (-31%)
- Test coverage: ~75% → **>80%**
- Code duplication: TBD → **<5%**
- ESLint warnings: TBD → **0**

**User Experience:**

- Creation flow: 9 шагов → **4 шага** (-55%)
- Time to first track: 10 min → **<5 min** (-50%)
- Mobile UX: Переработанная 4-tab навигация
- Onboarding completion: TBD → **>70%**

---

## 🔥 Критические задачи (Немедленно)

### Неделя 1-2 (9 дней разработки)

#### 1. AudioContext Management Fix ⚠️ CRITICAL

**Проблема:**

- Memory leaks от orphaned audio nodes
- Mobile browsers ограничивают 6-8 audio элементов
- Нет state machine для AudioContext lifecycle
- Crashes на некоторых мобильных устройствах

**Решение:**

```typescript
// src/lib/audio/AudioManager.ts (создать)

class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext;
  private audioPool: Map<string, HTMLAudioElement> = new Map();
  private maxPoolSize = 8;

  private constructor() {
    this.audioContext = new AudioContext();
    this.setupAudioContextStateManagement();
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  async getAudioElement(id: string): Promise<HTMLAudioElement> {
    // Audio element pooling logic
    if (this.audioPool.size >= this.maxPoolSize) {
      const oldestKey = this.audioPool.keys().next().value;
      const oldElement = this.audioPool.get(oldestKey);
      oldElement?.pause();
      this.audioPool.delete(oldestKey);
    }

    const audio = new Audio();
    this.audioPool.set(id, audio);
    return audio;
  }

  releaseAudioElement(id: string): void {
    const audio = this.audioPool.get(id);
    if (audio) {
      audio.pause();
      audio.src = "";
      this.audioPool.delete(id);
    }
  }

  private setupAudioContextStateManagement(): void {
    // State machine для AudioContext
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.audioContext.state === "running") {
        this.audioContext.suspend();
      } else if (!document.hidden && this.audioContext.state === "suspended") {
        this.audioContext.resume();
      }
    });
  }

  cleanup(): void {
    this.audioPool.forEach((audio) => {
      audio.pause();
      audio.src = "";
    });
    this.audioPool.clear();
    this.audioContext.close();
  }
}

export const audioManager = AudioManager.getInstance();
```

**Обновить файлы:**

```
src/contexts/GlobalAudioProvider.tsx - использовать AudioManager
src/hooks/studio/useStemStudioAudio.ts - рефакторинг для pooling
src/components/stem-studio/StemChannel.tsx - cleanup на unmount
```

**Оценка:**

- **Сложность:** MEDIUM
- **Приоритет:** P0 (CRITICAL)
- **Время:** 3 дня
- **Риск:** MEDIUM (может затронуть существующую логику)
- **Impact:** HIGH (критично для mobile stability)

---

#### 2. Lyrics Wizard State Persistence

**Проблема:**

- Потеря состояния при закрытии sheet
- Неправильный подсчет символов (включает структурные теги)
- Нет валидации секций
- Нет undo/redo

**Решение:**

```typescript
// src/lib/lyricsValidation.ts (создать)

interface Section {
  type: "Verse" | "Chorus" | "Bridge" | "Pre-Chorus" | "Outro" | "Intro";
  content: string;
}

export function validateLyrics(lyrics: string): {
  isValid: boolean;
  errors: string[];
  sections: Section[];
} {
  const errors: string[] = [];
  const sections: Section[] = [];

  // Разбор секций
  const sectionRegex = /\[(Verse|Chorus|Bridge|Pre-Chorus|Outro|Intro).*?\]([\s\S]*?)(?=\[|$)/g;
  let match;

  while ((match = sectionRegex.exec(lyrics)) !== null) {
    const type = match[1] as Section["type"];
    const content = match[2].trim();

    if (!content) {
      errors.push(`Секция [${type}] пустая`);
    } else {
      sections.push({ type, content });
    }
  }

  if (sections.length === 0) {
    errors.push("Не найдено ни одной секции. Используйте [Verse], [Chorus], etc.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sections,
  };
}

export function countRealCharacters(lyrics: string): number {
  // Удаляем структурные теги для подсчета реальных символов
  return lyrics
    .replace(/\[.*?\]/g, "") // Удалить все [теги]
    .replace(/\n\s*\n/g, "\n") // Убрать лишние пустые строки
    .trim().length;
}

export function formatLyrics(lyrics: string): string {
  // Автоформатирование: пустая строка после каждой секции
  return lyrics.replace(/(\[.*?\][\s\S]*?)(?=\[|$)/g, "$1\n");
}
```

```typescript
// src/stores/lyricsWizardStore.ts (обновить)

interface LyricsWizardState {
  // ... existing
  history: string[];
  historyIndex: number;
  autoSaveTimestamp: number | null;
}

// Добавить actions
const useLyricsWizardStore = create<LyricsWizardState>((set, get) => ({
  // ... existing
  history: [],
  historyIndex: -1,
  autoSaveTimestamp: null,

  // Auto-save в localStorage
  setupAutoSave: () => {
    const interval = setInterval(() => {
      const state = get();
      if (state.lyrics) {
        localStorage.setItem(
          "lyrics-wizard-draft",
          JSON.stringify({
            lyrics: state.lyrics,
            timestamp: Date.now(),
          }),
        );
        set({ autoSaveTimestamp: Date.now() });
      }
    }, 30000); // каждые 30 секунд

    // Восстановить при загрузке
    const draft = localStorage.getItem("lyrics-wizard-draft");
    if (draft) {
      const { lyrics, timestamp } = JSON.parse(draft);
      // Восстановить если < 30 минут назад
      if (Date.now() - timestamp < 30 * 60 * 1000) {
        set({ lyrics, autoSaveTimestamp: timestamp });
      }
    }

    return () => clearInterval(interval);
  },

  // Undo
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      set({
        lyrics: history[newIndex],
        historyIndex: newIndex,
      });
    }
  },

  // Redo
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      set({
        lyrics: history[newIndex],
        historyIndex: newIndex,
      });
    }
  },

  // Update lyrics с history tracking
  setLyrics: (lyrics: string) => {
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(lyrics);

    // Ограничить историю до 20 состояний
    if (newHistory.length > 20) {
      newHistory.shift();
    }

    set({
      lyrics,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },
}));
```

**Обновить файлы:**

```
src/stores/lyricsWizardStore.ts - добавить auto-save и undo/redo
src/components/generate-form/LyricsWizardSheet.tsx - UI для undo/redo
src/lib/lyricsValidation.ts - создать валидацию
```

**Оценка:**

- **Сложность:** MEDIUM
- **Приоритет:** P1 (HIGH)
- **Время:** 2 дня
- **Риск:** LOW
- **Impact:** HIGH (часто используемая функция)

---

#### 3. Component Optimization (React.memo)

**Проблема:**

- StemChannel, TrackCard re-render при любом изменении
- Нет memoization для дорогих вычислений
- FPS падает при большом количестве треков/стемов

**Решение:**

```typescript
// src/components/stem-studio/StemChannel.tsx

import React, { memo } from 'react';

interface StemChannelProps {
  stem: Stem;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onSoloToggle: () => void;
  isPlaying: boolean;
}

const StemChannel = memo<StemChannelProps>(({
  stem,
  onVolumeChange,
  onMuteToggle,
  onSoloToggle,
  isPlaying,
}) => {
  // Memoize expensive calculations
  const waveformData = useMemo(() =>
    generateWaveformData(stem.audioUrl),
    [stem.audioUrl]
  );

  // Memoize callbacks
  const handleVolumeChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    onVolumeChange(parseFloat(e.target.value));
  }, [onVolumeChange]);

  return (
    <div className="stem-channel">
      {/* ... */}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison для избежания лишних re-renders
  return (
    prevProps.stem.id === nextProps.stem.id &&
    prevProps.stem.volume === nextProps.stem.volume &&
    prevProps.stem.isMuted === nextProps.stem.isMuted &&
    prevProps.stem.isSoloed === nextProps.stem.isSoloed &&
    prevProps.isPlaying === nextProps.isPlaying
  );
});

StemChannel.displayName = 'StemChannel';

export default StemChannel;
```

**Аналогично для:**

```
src/components/library/TrackCard.tsx
src/components/library/TrackRow.tsx
src/components/playlist/PlaylistCard.tsx
```

**Оценка:**

- **Сложность:** LOW
- **Приоритет:** P1 (HIGH)
- **Время:** 1 день
- **Риск:** LOW
- **Impact:** MEDIUM-HIGH (FPS improvement)

---

#### 4. Waveform Web Worker

**Проблема:**

- Генерация waveform блокирует main thread
- UI freezes на 1-3 секунды
- Нет прогресса загрузки

**Решение:**

```typescript
// src/workers/waveformGenerator.worker.ts (создать)

interface WaveformRequest {
  audioBuffer: ArrayBuffer;
  sampleRate: number;
  numberOfChannels: number;
  width: number;
  height: number;
}

interface WaveformResponse {
  waveformData: Float32Array;
  duration: number;
}

self.addEventListener("message", async (e: MessageEvent<WaveformRequest>) => {
  const { audioBuffer, sampleRate, numberOfChannels, width, height } = e.data;

  try {
    // Decode audio в Web Worker
    const audioContext = new OfflineAudioContext(numberOfChannels, audioBuffer.byteLength, sampleRate);
    const decodedData = await audioContext.decodeAudioData(audioBuffer);

    // Generate waveform data
    const channelData = decodedData.getChannelData(0);
    const samples = width;
    const blockSize = Math.floor(channelData.length / samples);
    const waveformData = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      const start = blockSize * i;
      let sum = 0;

      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[start + j]);
      }

      waveformData[i] = (sum / blockSize) * height;

      // Report progress every 10%
      if (i % Math.floor(samples / 10) === 0) {
        self.postMessage({ type: "progress", progress: (i / samples) * 100 });
      }
    }

    const response: WaveformResponse = {
      waveformData,
      duration: decodedData.duration,
    };

    self.postMessage({ type: "complete", data: response });
  } catch (error) {
    self.postMessage({ type: "error", error: error.message });
  }
});
```

```typescript
// src/hooks/audio/useWaveform.ts (создать)

import { useEffect, useState } from "react";

interface UseWaveformOptions {
  audioUrl: string;
  width: number;
  height: number;
  cacheKey?: string;
}

export function useWaveform({ audioUrl, width, height, cacheKey }: UseWaveformOptions) {
  const [waveformData, setWaveformData] = useState<Float32Array | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let worker: Worker | null = null;

    async function generateWaveform() {
      // Check cache first (IndexedDB)
      if (cacheKey) {
        const cached = await getWaveformFromCache(cacheKey);
        if (cached) {
          setWaveformData(cached);
          setIsLoading(false);
          return;
        }
      }

      try {
        // Fetch audio
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();

        // Create worker
        worker = new Worker(new URL("../workers/waveformGenerator.worker.ts", import.meta.url));

        worker.onmessage = (e) => {
          if (e.data.type === "progress") {
            setProgress(e.data.progress);
          } else if (e.data.type === "complete") {
            setWaveformData(e.data.data.waveformData);
            setIsLoading(false);

            // Cache result
            if (cacheKey) {
              cacheWaveform(cacheKey, e.data.data.waveformData);
            }
          } else if (e.data.type === "error") {
            setError(e.data.error);
            setIsLoading(false);
          }
        };

        // Send to worker
        worker.postMessage({
          audioBuffer: arrayBuffer,
          sampleRate: 44100,
          numberOfChannels: 2,
          width,
          height,
        });
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    }

    generateWaveform();

    return () => {
      if (worker) {
        worker.terminate();
      }
    };
  }, [audioUrl, width, height, cacheKey]);

  return { waveformData, isLoading, progress, error };
}

// IndexedDB caching helpers
async function getWaveformFromCache(key: string): Promise<Float32Array | null> {
  // ... IndexedDB logic
}

async function cacheWaveform(key: string, data: Float32Array): Promise<void> {
  // ... IndexedDB logic
}
```

**Обновить файлы:**

```
src/workers/waveformGenerator.worker.ts - создать Web Worker
src/hooks/audio/useWaveform.ts - создать хук
src/components/player/Waveform.tsx - использовать хук
src/components/stem-studio/StemWaveform.tsx - использовать хук
```

**Оценка:**

- **Сложность:** MEDIUM
- **Приоритет:** P1 (HIGH)
- **Время:** 2 дня
- **Риск:** MEDIUM (новая технология)
- **Impact:** HIGH (perceived performance)

---

#### 5. Error Handling Standardization

**Решение:**

```typescript
// src/lib/errors.ts (расширить)

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

export class NetworkError extends AppError {
  constructor(message: string) {
    super(message, "NETWORK_ERROR", 503);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message, "VALIDATION_ERROR", 400);
  }
}

export class AudioError extends AppError {
  constructor(message: string) {
    super(message, "AUDIO_ERROR", 500);
  }
}

export class SunoAPIError extends AppError {
  constructor(
    message: string,
    public apiResponse?: unknown,
  ) {
    super(message, "SUNO_API_ERROR", 502);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Требуется авторизация") {
    super(message, "AUTH_ERROR", 401);
  }
}
```

```typescript
// src/components/ErrorBoundary.tsx (создать)

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught an error', { error, errorInfo });

    // Send to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold mb-4">Что-то пошло не так</h1>
            <p className="text-muted-foreground mb-6">
              {this.state.error instanceof AppError
                ? this.state.error.message
                : 'Произошла неожиданная ошибка'}
            </p>
            <button
              onClick={this.reset}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Обновить файлы:**

```
src/lib/errors.ts - расширить иерархию ошибок
src/components/ErrorBoundary.tsx - создать компонент
src/App.tsx - обернуть в ErrorBoundary
```

**Оценка:**

- **Сложность:** LOW
- **Приоритет:** P2 (MEDIUM)
- **Время:** 1 день
- **Риск:** LOW
- **Impact:** MEDIUM (better DX and UX)

---

### Итого Неделя 1-2:

| Задача                    | Дни        | Приоритет | Impact |
| ------------------------- | ---------- | --------- | ------ |
| AudioContext Management   | 3          | P0        | HIGH   |
| Lyrics Wizard Persistence | 2          | P1        | HIGH   |
| Component Optimization    | 1          | P1        | HIGH   |
| Waveform Web Worker       | 2          | P1        | HIGH   |
| Error Handling            | 1          | P2        | MEDIUM |
| **ИТОГО**                 | **9 дней** |           |        |

**Ресурсы:** 1 Senior Frontend Developer  
**Результат:** Критические баги исправлены, улучшена производительность

---

## 🧹 Sprint 027: Consolidation

### Цели (2 недели)

**Основная цель:** Упростить Stem Studio архитектуру

- 94 файла → 65 файлов (-31%)
- Устранить дублирование кода
- Извлечь shared hooks
- Улучшить maintainability

---

### Week 1: Analysis & Planning

#### День 1-2: Dependency Analysis

**Задачи:**

1. Построить dependency graph для всех 94 файлов
2. Идентифицировать дублирование кода (jscpd)
3. Найти кандидатов на объединение

**Инструменты:**

```bash
# Dependency graph
npx madge --image deps-graph.svg src/components/stem-studio

# Code duplication
npx jscpd src/components/stem-studio

# Complexity analysis
npx complexity-report src/components/stem-studio
```

**Deliverables:**

- `docs/stem-studio/DEPENDENCY_GRAPH.md`
- `docs/stem-studio/DUPLICATION_REPORT.md`
- `docs/stem-studio/CONSOLIDATION_PLAN.md`

---

#### День 3-4: Extract Shared Hooks

**Цель:** Извлечь 5 shared hooks из компонентов

**Hooks to create:**

```typescript
// src/hooks/studio/useStemMixer.ts
export function useStemMixer(trackId: string) {
  // Управление миксером: volume, mute, solo, pan
  const [stems, setStems] = useState<Stem[]>([]);
  const [masterVolume, setMasterVolume] = useState(1);

  const handleVolumeChange = useCallback((stemId: string, volume: number) => {
    // ...
  }, []);

  const handleMuteToggle = useCallback((stemId: string) => {
    // ...
  }, []);

  const handleSoloToggle = useCallback((stemId: string) => {
    // ...
  }, []);

  return {
    stems,
    masterVolume,
    setMasterVolume,
    handleVolumeChange,
    handleMuteToggle,
    handleSoloToggle,
  };
}
```

```typescript
// src/hooks/studio/useStemPlayback.ts
export function useStemPlayback(stems: Stem[]) {
  // Синхронное воспроизведение всех стемов
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const play = useCallback(() => {
    // Синхронный запуск всех стемов
  }, [stems]);

  const pause = useCallback(() => {
    // Синхронная пауза всех стемов
  }, [stems]);

  const seek = useCallback(
    (time: number) => {
      // Синхронная перемотка всех стемов
    },
    [stems],
  );

  return { isPlaying, currentTime, play, pause, seek };
}
```

```typescript
// src/hooks/studio/useStemEffects.ts
export function useStemEffects(stem: Stem) {
  // Применение эффектов к стему
  const [effects, setEffects] = useState<Effect[]>([]);

  const applyEffect = useCallback(
    (effect: Effect) => {
      // ...
    },
    [stem],
  );

  const removeEffect = useCallback(
    (effectId: string) => {
      // ...
    },
    [stem],
  );

  return { effects, applyEffect, removeEffect };
}
```

```typescript
// src/hooks/studio/useStemExport.ts
export function useStemExport(trackId: string) {
  // Экспорт стемов и миксов
  const exportMix = useCallback(
    async (options: ExportOptions) => {
      // ...
    },
    [trackId],
  );

  const exportStems = useCallback(async () => {
    // ...
  }, [trackId]);

  const exportMIDI = useCallback(async () => {
    // ...
  }, [trackId]);

  return { exportMix, exportStems, exportMIDI };
}
```

```typescript
// src/hooks/studio/useStemAnalysis.ts
export function useStemAnalysis(stem: Stem) {
  // Анализ стема (BPM, key, etc.)
  const [analysis, setAnalysis] = useState<StemAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyze = useCallback(async () => {
    // ...
  }, [stem]);

  return { analysis, isAnalyzing, analyze };
}
```

---

### Week 2: Implementation

#### День 5-7: Merge Similar Components

**План объединения:**

**1. Timeline Components (8 → 3)**

```
Было:
- DAWTimeline.tsx
- StudioTimeline.tsx
- UnifiedWaveformTimeline.tsx
- VersionTimeline.tsx
- DAWTrackLane.tsx
- SectionTimelineVisualization.tsx
- ... (еще 2)

Стало:
- UnifiedTimeline.tsx (main timeline с modes: 'daw' | 'simple' | 'version')
- TimelineTrack.tsx (track lane компонент)
- TimelineMarkers.tsx (markers и regions)
```

**2. Section Editor Components (8 → 4)**

```
Было:
- SectionEditorPanel.tsx
- SectionPicker.tsx
- SectionSelector.tsx
- SectionComparePanel.tsx
- IntegratedSectionEditor.tsx
- SectionTimelineVisualization.tsx
- SectionWaveformPreview.tsx
- SectionQuickActions.tsx

Стало:
- SectionEditorPanel.tsx (main panel с tabs)
- SectionSelector.tsx (объединенный picker + selector)
- SectionCompare.tsx (comparison UI)
- SectionActions.tsx (quick actions)
```

**3. Dialogs (25 → 15)**

```
Merge candidates:
- ExtendDialog + RemixDialog → MusicGenerationDialog (with modes)
- TrimDialog + LoopRegionSelector → AudioEditDialog
- VocalReplacementDialog → part of SectionReplacementPanel
- ... (аналогично для других)
```

**4. Mobile Components (10 → 6)**

```
Было:
- TrackStudioMobileLayout.tsx
- MobileStudioHeader.tsx
- MobileActionsBar.tsx
- MobileSectionTimelineCompact.tsx
- MobileMasterVolume.tsx
- MobileVersionBadge.tsx
- ... (еще 4)

Стало:
- MobileStudioLayout.tsx (unified layout)
- MobileHeader.tsx (header + version badge)
- MobileControls.tsx (actions + master volume)
- MobileSectionEditor.tsx (section editor для mobile)
- MobileWaveform.tsx
- MobileMixer.tsx
```

---

#### День 8-9: Update Imports & Tests

**Автоматизация:**

```bash
# Find all imports
grep -r "from '@/components/stem-studio" src/

# Update imports (bulk)
npx jscodeshift -t scripts/codemods/update-stem-imports.ts src/
```

**Test updates:**

```
tests/stem-studio/ - обновить тесты
- useStemMixer.test.ts (new)
- useStemPlayback.test.ts (new)
- UnifiedTimeline.test.tsx (updated)
- SectionEditorPanel.test.tsx (updated)
```

---

#### День 10: Documentation

**Создать документацию:**

```
docs/STEM_STUDIO_ARCHITECTURE.md - архитектура после consolidation
docs/STEM_STUDIO_MIGRATION_GUIDE.md - гайд для разработчиков
docs/components/stem-studio/ - документация компонентов
```

---

### Success Criteria

**Metrics:**

- ✅ Stem Studio: 94 файла → 65 файлов (-31%)
- ✅ Code duplication: >15% → <5%
- ✅ Average file size: ~174 строки → ~250 строк (более плотный код)
- ✅ Shared hooks: 0 → 5
- ✅ Test coverage: maintained or improved

**Quality Gates:**

- ✅ All tests passing
- ✅ No ESLint warnings
- ✅ Build successful
- ✅ No runtime errors
- ✅ Bundle size не увеличился

---

## 📱 Sprint 028: Mobile Polish

### Цели (2 недели)

**Основная цель:** Улучшить mobile UX

- Новая 4-tab navigation (bottom bar)
- Progressive disclosure patterns
- Touch optimizations (≥44×44px)
- Mobile performance (<3s TTI)

---

### Week 1: Navigation Redesign

#### День 1-3: 4-Tab Bottom Navigation

**Design:**

```
┌──────────────────────┐
│                      │
│   Page Content       │
│                      │
│                      │
├──────────────────────┤
│ [🏠] [➕] [📚] [👤] │ ← Bottom 25% of screen
└──────────────────────┘

Tabs:
1. Home (🏠) - Homepage с discovery
2. Create (➕) - Quick create + all creative tools
3. Library (📚) - Track library
4. Profile (👤) - User profile + settings
```

**Implementation:**

```typescript
// src/components/navigation/BottomNav.tsx

import { Home, Plus, Library, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from '@/lib/motion';

const tabs = [
  { id: 'home', label: 'Главная', icon: Home, path: '/' },
  { id: 'create', label: 'Создать', icon: Plus, path: '/generate' },
  { id: 'library', label: 'Библиотека', icon: Library, path: '/library' },
  { id: 'profile', label: 'Профиль', icon: User, path: '/profile' },
];

export function BottomNav() {
  const location = useLocation();
  const activeTab = tabs.find(tab => location.pathname.startsWith(tab.path))?.id || 'home';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-inset-bottom">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <Link
              key={tab.id}
              to={tab.path}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
            >
              <Icon
                className={`w-6 h-6 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
              />
              <span className={`text-xs mt-1 ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {tab.label}
              </span>

              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute top-0 left-0 right-0 h-0.5 bg-primary"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

**Platform-specific tweaks:**

```typescript
// src/lib/platform.ts

export function getPlatform(): "ios" | "android" | "web" {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "web";
}

export function getPlatformStyles() {
  const platform = getPlatform();

  if (platform === "ios") {
    return {
      bottomNav: "backdrop-blur-xl bg-background/80", // iOS blur effect
      borderRadius: "rounded-t-2xl", // iOS rounded corners
    };
  }

  if (platform === "android") {
    return {
      bottomNav: "bg-background shadow-lg", // Material shadow
      borderRadius: "", // No rounding
    };
  }

  return {
    bottomNav: "bg-background",
    borderRadius: "",
  };
}
```

---

#### День 4-5: Progressive Disclosure

**Patterns:**

**1. Collapsible Sections**

```typescript
// src/components/ui/Collapsible.tsx (расширить)

import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';

interface CollapsibleProps {
  title: string;
  badge?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function Collapsible({ title, badge, defaultOpen = false, children }: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-accent"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">{title}</span>
          {badge && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {badge}
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

**2. Bottom Sheets**

```typescript
// src/components/ui/BottomSheet.tsx

import { motion, AnimatePresence } from '@/lib/motion';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl shadow-2xl max-h-[80vh] overflow-hidden safe-area-inset-bottom"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-accent rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(80vh-64px)]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

**3. Context Menus (Long Press)**

```typescript
// src/hooks/useLongPress.ts

import { useCallback, useRef } from "react";

interface UseLongPressOptions {
  onLongPress: () => void;
  delay?: number;
}

export function useLongPress({ onLongPress, delay = 500 }: UseLongPressOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(
    (e: TouchEvent | MouseEvent) => {
      // Haptic feedback (Telegram)
      if ("TelegramWebApp" in window) {
        window.TelegramWebApp?.HapticFeedback?.impactOccurred("medium");
      }

      timerRef.current = setTimeout(() => {
        onLongPress();
        // Second haptic on trigger
        if ("TelegramWebApp" in window) {
          window.TelegramWebApp?.HapticFeedback?.notificationOccurred("success");
        }
      }, delay);
    },
    [onLongPress, delay],
  );

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
  };
}
```

---

### Week 2: Touch & Performance

#### День 6-7: Touch Optimizations

**1. Touch Target Audit**

```bash
# Script to find undersized touch targets
node scripts/audit-touch-targets.js
```

**2. Fix Undersized Targets**

```typescript
// Ensure all interactive elements ≥44×44px

// Before:
<button className="p-1">
  <Icon className="w-4 h-4" />
</button>

// After:
<button className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center">
  <Icon className="w-4 h-4" />
</button>
```

**3. Swipe Gestures**

```typescript
// src/hooks/useSwipeGestures.ts

import { useCallback, useRef } from "react";

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

export function useSwipeGestures({ onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold = 50 }: SwipeOptions) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!touchStart.current) return;

      const deltaX = e.changedTouches[0].clientX - touchStart.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStart.current.y;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > threshold) {
          if (deltaX > 0) {
            onSwipeRight?.();
          } else {
            onSwipeLeft?.();
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > threshold) {
          if (deltaY > 0) {
            onSwipeDown?.();
          } else {
            onSwipeUp?.();
          }
        }
      }

      touchStart.current = null;
    },
    [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold],
  );

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}
```

**4. Pull to Refresh**

```typescript
// src/hooks/usePullToRefresh.ts

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);

  const handleTouchStart = (e: TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (startY.current === 0) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;

    if (distance > 0 && distance < 100) {
      setPullDistance(distance);
      setIsPulling(true);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60) {
      // Trigger refresh
      await onRefresh();
    }

    setIsPulling(false);
    setPullDistance(0);
    startY.current = 0;
  };

  return {
    isPulling,
    pullDistance,
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}
```

---

#### День 8-10: Mobile Performance

**1. Mobile Bundle Optimization**

```javascript
// vite.config.ts

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Separate mobile-specific chunks
          if (id.includes("src/components/mobile")) {
            return "mobile";
          }
          // ...
        },
      },
    },
  },
});
```

**2. Image Optimization**

```typescript
// Convert all images to WebP
// Implement responsive images

<LazyImage
  src={track.coverUrl}
  srcSet={`
    ${track.coverUrl}?w=320 320w,
    ${track.coverUrl}?w=640 640w,
    ${track.coverUrl}?w=1280 1280w
  `}
  sizes="(max-width: 768px) 320px, 640px"
  alt={track.title}
  format="webp"
  placeholder="blur"
/>
```

**3. Animation Performance**

```typescript
// Use GPU-accelerated transforms
// Avoid layout thrashing

motion.div({
  initial: { opacity: 0, transform: "translateY(20px)" }, // GPU
  // NOT: { opacity: 0, y: 20 } // CSS property (slower)
});
```

**4. Performance Testing**

```bash
# Lighthouse CI для mobile
npx lighthouse https://app.musicverse.ai \
  --preset=mobile \
  --throttling.cpuSlowdownMultiplier=4 \
  --output=html
```

---

### Success Criteria

**Metrics:**

- ✅ TTI (4G mobile): ~4.5s → <3s
- ✅ Touch target compliance: TBD → 100%
- ✅ Navigation depth: TBD → <3 taps average
- ✅ FPS (mobile): TBD → >58 FPS
- ✅ Bundle size (mobile): 500 KB → <450 KB

---

## 📅 Q1 2026: Ключевые функции

### Январь (после Sprint 027-028)

**AI-powered Mastering** (1 неделя)

- Анализ частотного спектра
- Автоматическая EQ, компрессия, лимитинг
- Presets: Pop, Rock, EDM, Cinematic
- A/B comparison

**Loop & Sample Library** (1 неделя)

- Библиотека loops и samples
- Фильтры по BPM, ключу, жанру
- Drag & drop в Stem Studio

---

### Февраль

**Subscription Tiers** (1 неделя)

- Free: 50 credits/месяц
- Pro ($9.99): 500 credits
- Studio ($29.99): 2000 credits
- Enterprise: Custom

**Export to Streaming Platforms** (1 неделя)

- Spotify, Apple Music, YouTube Music
- Metadata editing
- Distribution tracking

**Testing Sprint** (2 недели)

- Unit tests coverage: 75% → 80%
- Integration tests
- E2E tests

---

### Март

**Social Media Auto-posting** (1 неделя)

- Instagram, TikTok, Twitter, VK
- Auto-post при публикации
- Video generation

**Marketplace for AI Artists** (5 дней)

- Creators создают AI Artists
- Revenue sharing (70/30)

**Testing Sprint продолжение** (2 недели)

- Visual regression testing
- Performance testing
- Security audit

---

## 📈 Q2 2026: Масштабирование

### Апрель

**Collaborative Editing** (3 недели)

- Real-time collaboration
- Shared sessions
- Live cursors
- Chat в студии

**Security Audit** (1 неделя)

- OWASP Top 10 review
- Vulnerability scan
- Penetration testing

---

### Май

**MIDI Editor** (3 недели)

- Piano roll
- Virtual instruments
- Export/Import MIDI
- Quantization

**Analytics & Monitoring** (1 неделя)

- User analytics dashboard
- A/B testing framework
- Product analytics

---

### Июнь

**Internationalization (i18n)** (2 недели)

- 8 языков (EN, RU, ES, PT, DE, FR, JA, KO)
- Translation management
- RTL support

**Performance Optimization** (1 неделя)

- Database optimization
- Redis caching
- Edge Function optimization

---

## 📊 Метрики и KPI

### Technical KPIs

**Performance:**

```
Bundle size:    500 KB → <450 KB (-10%)
TTI (4G):       ~4.5s → <3s (-33%)
List FPS:       45 → >58 (+29%)
Lighthouse:     TBD → >90
```

**Quality:**

```
Test coverage:  ~75% → >80% (+5%)
ESLint warnings: TBD → 0
Code duplication: TBD → <5%
Build time:     TBD → <1 min
```

**Architecture:**

```
Stem Studio files: 94 → 65 (-31%)
Edge Functions: 94 → optimized
Total LOC: ~35,000 → maintain
```

---

### User Metrics

**Engagement:**

```
Tracks generated:     10/month → 15/month (+50%)
Avg listening time:   30 min → 40 min (+33%)
Stem Studio adoption: TBD → 25%
Social interactions:  TBD → 5/user/week
```

**Retention:**

```
D1:   TBD → 60%
D7:   TBD → 30%
D30:  TBD → 15%
Churn: TBD → <5%/month
```

**Revenue:**

```
Conversion: TBD → 5-10%
MRR growth: TBD → +15% м/м
ARPU:       TBD → $15-20
LTV:CAC:    TBD → >3:1
```

---

## ⚠️ Риски и митигация

### HIGH Risks

**1. Stem Studio Refactor Breaks Functionality**

- **Вероятность:** MEDIUM
- **Impact:** HIGH
- **Митигация:**
  - Comprehensive tests перед рефакторингом
  - Incremental refactor (10-15 файлов за раз)
  - Feature flags для gradual rollout
  - Staging environment testing
  - Rollback plan

**2. Mobile Audio Crashes**

- **Вероятность:** HIGH (некоторые устройства)
- **Impact:** HIGH
- **Митигация:**
  - Audio element pooling (max 8)
  - Graceful degradation
  - Clear user messaging
  - Testing на реальных устройствах
  - Fallback для старых браузеров

---

### MEDIUM Risks

**3. UX Changes Confuse Users**

- **Вероятность:** MEDIUM
- **Impact:** MEDIUM
- **Митигация:**
  - Gradual rollout (A/B testing)
  - Interactive tutorial
  - Changelog notifications
  - User feedback collection
  - Quick revert if needed

**4. Bundle Size Doesn't Reduce**

- **Вероятность:** LOW
- **Impact:** MEDIUM
- **Митигация:**
  - Multiple optimization strategies
  - Monitoring bundle size in CI
  - Code splitting
  - Lazy loading

---

### LOW Risks

**5. Third-party Breaking Changes**

- **Вероятность:** LOW
- **Impact:** MEDIUM
- **Митигация:**
  - Lock dependencies versions
  - Test updates separately
  - Monitor changelogs

---

## ✅ Success Criteria

### Sprint 027 Complete When:

- ✅ Stem Studio: 94 → 65 файлов
- ✅ Code duplication: <5%
- ✅ All tests passing
- ✅ Documentation updated
- ✅ No performance regression

### Sprint 028 Complete When:

- ✅ 4-tab navigation deployed
- ✅ All touch targets ≥44×44px
- ✅ TTI (mobile) <3s
- ✅ Progressive disclosure implemented
- ✅ User acceptance testing passed

### Q1 2026 Complete When:

- ✅ Subscriptions live
- ✅ Streaming export working
- ✅ AI Mastering available
- ✅ Test coverage >80%
- ✅ All critical bugs fixed

### Q2 2026 Complete When:

- ✅ Collaborative editing live
- ✅ MIDI Editor production-ready
- ✅ 8 languages supported
- ✅ Security audit passed
- ✅ Performance targets met

---

## 📝 Следующие шаги

### Для Product Owner:

1. ✅ Review и approve optimization plan
2. ✅ Prioritize features (P0, P1, P2)
3. ✅ Allocate resources (dev time)
4. ✅ Setup sprint planning meetings
5. ✅ Define success metrics

### Для Development Team:

1. ✅ Start Critical fixes (Week 1)
2. ✅ Setup Sprint 027 environment
3. ✅ Review Stem Studio codebase
4. ✅ Prepare test infrastructure
5. ✅ Setup performance monitoring

### Для DevOps:

1. ✅ Setup staging environment
2. ✅ Configure CI/CD for performance tests
3. ✅ Setup monitoring and alerts
4. ✅ Prepare deployment checklists
5. ✅ Setup A/B testing infrastructure

---

**Документ создан:** 21 декабря 2025  
**Следующее обновление:** После Sprint 027 (конец января 2026)  
**Ответственный:** Development Team Lead

---

_Конец документа_
