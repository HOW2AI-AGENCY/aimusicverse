# Полный анализ аудио-логики MusicVerse AI

**Дата анализа:** 9 декабря 2025  
**Версия:** 1.0  
**Язык:** Русский

---

## 📋 Оглавление

1. [Обзор архитектуры](#обзор-архитектуры)
2. [Глобальный аудио-плеер](#глобальный-аудио-плеер)
3. [Система очереди воспроизведения](#система-очереди-воспроизведения)
4. [Stem Studio: Профессиональная аудио-обработка](#stem-studio-профессиональная-аудио-обработка)
5. [Аудио-эффекты и обработка](#аудио-эффекты-и-обработка)
6. [Экспорт и сохранение результатов](#экспорт-и-сохранение-результатов)
7. [Визуализация аудио](#визуализация-аудио)
8. [Редактирование секций треков](#редактирование-секций-треков)
9. [Управление состоянием](#управление-состоянием)
10. [Потоки данных](#потоки-данных)
11. [Оптимизация производительности](#оптимизация-производительности)

---

## Обзор архитектуры

MusicVerse AI использует многоуровневую архитектуру для работы с аудио. Приложение построено на React 19 + TypeScript 5 с использованием Vite для сборки и Zustand для управления состоянием.

### Основные компоненты системы:

- **Глобальный плеер** (singleton Audio Element)
- **Система очередей** с персистентностью
- **Stem Studio** для профессионального редактирования
- **Web Audio API** для обработки эффектов
- **Offline Audio Context** для экспорта
- **WaveSurfer.js** для визуализации

---

## Глобальный аудио-плеер

### 📁 Файл: `src/hooks/audio/useGlobalAudioPlayer.ts`

Центральный компонент системы воспроизведения использует паттерн **Singleton** для единого аудио-элемента.

### Ключевые особенности глобального плеера:

#### 1. Singleton Audio Element

```typescript
let globalAudioElement: HTMLAudioElement | null = null;

function getGlobalAudio(): HTMLAudioElement {
  if (!globalAudioElement) {
    globalAudioElement = new Audio();
    globalAudioElement.preload = "metadata";
  }
  return globalAudioElement;
}
```

**Преимущества:**

- Один аудио-элемент на всё приложение → меньше потребление памяти
- Согласованное состояние воспроизведения
- Избегание конфликтов при одновременном воспроизведении

#### 2. Приоритетная система источников

```typescript
const getAudioSource = () => {
  return (
    activeTrack.streaming_url || // 1. CDN (предпочтительно)
    activeTrack.local_audio_url || // 2. Локальный кэш (fallback)
    activeTrack.audio_url
  ); // 3. Оригинальный URL (last resort)
};
```

#### 3. Автоматическая обработка событий

- `ended` - автоматический переход к следующему треку или повтор
- `error` - логирование ошибок и приостановка
- Интеграция с Zustand store для синхронизации

#### 4. API плеера

```typescript
{
  seek: (time: number) => void,           // Перемотка
  setVolume: (volume: number) => void,    // Громкость (0-1)
  getCurrentTime: () => number,           // Текущая позиция
  getDuration: () => number,              // Длительность
  getBuffered: () => number,              // % буферизации
  audioElement: HTMLAudioElement          // Прямой доступ
}
```

---

## Система очереди воспроизведения

### 📁 Файл: `src/hooks/audio/usePlaybackQueue.ts`

Мощная система управления очередью с **автоматической персистентностью** и поддержкой shuffle/repeat.

### Основные операции:

#### 1. Добавление треков

```typescript
addTrack(track, playNow: boolean)  // Один трек
addTracks(tracks, playFirst)        // Batch добавление
setQueue(tracks, startIndex)        // Замена очереди
```

**Логика `playNow`:**

- `true` → трек в начало, сразу играет
- `false` → трек в конец очереди

#### 2. Управление порядком

```typescript
removeTrack(index); // Удаление с пересчётом индекса
reorder(fromIndex, toIndex); // Drag & drop
jumpToTrack(index); // Прямой переход
```

**Умный пересчёт при удалении:**

```typescript
if (index < currentIndex) {
  newCurrentIndex = currentIndex - 1;
} else if (index === currentIndex) {
  // Текущий удалён → играет следующий
  activeTrack = newQueue[currentIndex];
}
```

#### 3. Режимы воспроизведения

**Shuffle:**

```typescript
toggleShuffleMode() {
  if (newShuffleState) {
    const shuffled = shuffleQueue(queue, currentIndex);
    setState({ queue: shuffled, currentIndex: 0 });
  }
}
```

**Repeat Modes:**

- `off` → остановка в конце
- `all` → цикл всей очереди
- `one` → повтор трека

#### 4. Персистентность localStorage

**Двухуровневая стратегия:**

```typescript
// 1. Очередь треков
localStorage.setItem("musicverse-playback-queue", JSON.stringify(queue));

// 2. Состояние (критичное)
localStorage.setItem(
  "musicverse-queue-state",
  JSON.stringify({
    currentIndex,
    shuffle,
    repeat,
  }),
);
```

**Обработка ошибок:**

- `QuotaExceededError` → silent fail с warning
- `SecurityError` (приватный режим) → продолжение без сохранения
- Валидация при восстановлении

---

## Stem Studio: Профессиональная аудио-обработка

### 📁 Файлы:

- `src/hooks/studio/useStemStudioEngine.ts` - мульти-стем менеджер
- `src/hooks/studio/useStemAudioEngine.ts` - single stem engine
- `src/components/stem-studio/StemStudioContent.tsx` - UI

Stem Studio - **профессиональный многодорожечный аудио-редактор** с эффектами реального времени.

### Web Audio API граф для каждого стема:

```
Source (MediaElement)
    ↓
Gain Node (Volume)
    ↓
EQ Chain:
  - Low Shelf (320 Hz)
  - Mid Peaking (1000 Hz)
  - High Shelf (3200 Hz)
    ↓
Compressor (DynamicsCompressor)
    ↓
Parallel Routing:
  ├─→ Dry Gain ─→ Output
  └─→ Convolver (Reverb) → Wet Gain → Output
    ↓
Master Gain (Shared)
    ↓
Destination (Speakers)
```

### API Stem Studio:

```typescript
const {
  enginesState, // Состояние всех стемов
  isInitialized, // Готовность
  initializeStemEngine, // Инициализация стема
  updateStemEQ, // Обновление EQ
  updateStemCompressor, // Обновление компрессора
  updateStemReverb, // Обновление реверберации
  applyStemEQPreset, // Применить пресет EQ
  resetStemEffects, // Сброс эффектов
  setStemVolume, // Громкость стема
  setMasterVolume, // Мастер громкость
} = useStemStudioEngine(stemIds);
```

### Эффекты:

#### EQ (3-полосный эквалайзер)

```typescript
interface EQSettings {
  lowGain: number; // -12 до +12 dB
  midGain: number; // -12 до +12 dB
  highGain: number; // -12 до +12 dB
  lowFreq: number; // Hz (default 320)
  highFreq: number; // Hz (default 3200)
}

// Пресеты
eqPresets = {
  flat: { lowGain: 0, midGain: 0, highGain: 0 },
  warm: { lowGain: 3, midGain: -1, highGain: -2 },
  bright: { lowGain: -2, midGain: 0, highGain: 4 },
  bass_boost: { lowGain: 6, midGain: 0, highGain: 0 },
  vocal_presence: { lowGain: -2, midGain: 3, highGain: 2 },
};
```

#### Compressor

```typescript
interface CompressorSettings {
  threshold: number; // -100 до 0 dB
  ratio: number; // 1 до 20
  attack: number; // 0 до 1 сек
  release: number; // 0 до 1 сек
  knee: number; // 0 до 40 dB
  enabled: boolean;
}

// Пресеты
compressorPresets = {
  gentle: { threshold: -20, ratio: 2, attack: 0.01 },
  moderate: { threshold: -24, ratio: 4, attack: 0.003 },
  heavy: { threshold: -30, ratio: 8, attack: 0.001 },
  vocals: { threshold: -18, ratio: 3, attack: 0.005 },
};
```

#### Reverb (с Dry/Wet)

```typescript
interface ReverbSettings {
  wetDry: number; // 0-1 (сухой/мокрый)
  decay: number; // 0.1-10 секунд
  enabled: boolean;
}

// Генерация импульсной характеристики
function createImpulseResponse(ctx, duration, decay) {
  // Случайный шум с экспоненциальным затуханием
  for (let i = 0; i < length; i++) {
    channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
  }
}
```

### Solo/Mute Logic:

```typescript
interface StemState {
  muted: boolean;
  solo: boolean;
  volume: number;
}

// Если есть solo - играют только solo стемы
const hasSolo = Object.values(stemStates).some((s) => s.solo);
const isMuted = masterMuted || state.muted || (hasSolo && !state.solo);
const finalVolume = isMuted ? 0 : state.volume;
```

---

## Экспорт и сохранение результатов

### 📁 Файлы:

- `src/hooks/useMixExport.ts` - экспорт микса
- `src/hooks/studio/useTrimExport.ts` - обрезка

### 1. Mix Export

#### Процесс экспорта:

```
1. Фильтрация активных стемов (solo/mute)
2. Загрузка аудио буферов
3. Создание OfflineAudioContext
4. Построение графа эффектов
5. Рендеринг в AudioBuffer
6. Конвертация в WAV/MP3
7. Скачивание файла
```

#### Код:

```typescript
const exportMix = async (
  stems: StemMixData[],
  masterVolume: number,
  trackTitle: string,
  options: { format: "wav" | "mp3" },
) => {
  // 1. Фильтрация
  const hasSolo = stems.some((s) => s.solo);
  const activeStems = stems.filter((s) => (hasSolo ? s.solo : !s.muted));

  // 2. Загрузка буферов
  const audioBuffers = await Promise.all(
    activeStems.map(async (stem) => {
      const response = await fetch(stem.audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = await audioContext.decodeAudioData(arrayBuffer);
      return { stem, buffer };
    }),
  );

  // 3. OfflineAudioContext
  const maxDuration = Math.max(...audioBuffers.map((ab) => ab.buffer.duration));
  const offlineContext = new OfflineAudioContext(2, maxDuration * sampleRate, sampleRate);

  // 4. Граф с эффектами
  const masterGain = offlineContext.createGain();
  masterGain.gain.value = masterVolume;
  masterGain.connect(offlineContext.destination);

  for (const { stem, buffer } of audioBuffers) {
    // Source → EQ → Compressor → Reverb → Master
    const chain = buildEffectsChain(offlineContext, stem.effects);
    source.connect(chain.input);
    chain.output.connect(masterGain);
    source.start(0);
  }

  // 5. Рендеринг
  const renderedBuffer = await offlineContext.startRendering();

  // 6. Конвертация
  const blob = options.format === "mp3" ? audioBufferToMp3(renderedBuffer, 192) : audioBufferToWav(renderedBuffer);

  return blob;
};
```

#### WAV Encoder:

```typescript
function audioBufferToWav(buffer: AudioBuffer): Blob {
  // Создание 44-байтного WAV заголовка
  // RIFF chunk
  writeString(view, 0, "RIFF");
  view.setUint32(4, bufferLength - 8, true);
  writeString(view, 8, "WAVE");

  // fmt chunk
  writeString(view, 12, "fmt ");
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);

  // data chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  // Интерлейсинг каналов
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = channels[ch][i];
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}
```

#### MP3 Encoder (lamejs):

```typescript
function audioBufferToMp3(buffer: AudioBuffer, bitRate = 192): Blob {
  const mp3encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, bitRate);

  // Float32 → Int16
  const leftInt16 = new Int16Array(left.length);
  for (let i = 0; i < left.length; i++) {
    leftInt16[i] = Math.round(left[i] * 32767);
  }

  // Кодирование блоками 1152 семпла
  const blockSize = 1152;
  for (let i = 0; i < leftInt16.length; i += blockSize) {
    const chunk = leftInt16.subarray(i, i + blockSize);
    const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    if (mp3buf.length > 0) mp3Data.push(Array.from(mp3buf));
  }

  const mp3buf = mp3encoder.flush();
  return new Blob([combined], { type: "audio/mp3" });
}
```

### 2. Trim Export (Обрезка)

```typescript
const trimAudio = async ({ audioUrl, startTime, endTime }) => {
  // 1. Загрузка и декодирование
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // 2. Вычисление позиций семплов
  const startSample = Math.floor(startTime * sampleRate);
  const endSample = Math.floor(endTime * sampleRate);
  const trimmedLength = endSample - startSample;

  // 3. Создание нового буфера
  const trimmedBuffer = audioContext.createBuffer(audioBuffer.numberOfChannels, trimmedLength, sampleRate);

  // 4. Копирование данных
  for (let ch = 0; ch < numChannels; ch++) {
    const sourceData = audioBuffer.getChannelData(ch);
    const trimmedData = trimmedBuffer.getChannelData(ch);
    for (let i = 0; i < trimmedLength; i++) {
      trimmedData[i] = sourceData[startSample + i];
    }
  }

  // 5. Рендеринг через OfflineAudioContext
  const offlineContext = new OfflineAudioContext(trimmedBuffer.numberOfChannels, trimmedBuffer.length, sampleRate);

  const source = offlineContext.createBufferSource();
  source.buffer = trimmedBuffer;
  source.connect(offlineContext.destination);
  source.start();

  const renderedBuffer = await offlineContext.startRendering();
  const wavBlob = await audioBufferToWav(renderedBuffer);

  return { blob: wavBlob, url: URL.createObjectURL(wavBlob) };
};
```

---

## Визуализация аудио

### 📁 Файл: `src/hooks/audio/useWaveform.ts`

Использует **WaveSurfer.js** для волновой визуализации.

```typescript
const useWaveform = ({
  audioUrl,
  container,
  height = 48,
  waveColor = "rgba(255, 255, 255, 0.3)",
  progressColor = "rgba(255, 255, 255, 0.6)",
  barWidth = 2,
  normalize = true,
}) => {
  const wavesurfer = WaveSurfer.create({
    container,
    height,
    waveColor,
    progressColor,
    barWidth,
    barGap: 1,
    barRadius: 2,
    backend: "WebAudio",
    interact: false,
    hideScrollbar: true,
    fillParent: true,
  });

  wavesurfer.on("ready", () => {
    setDuration(wavesurfer.getDuration());
  });

  wavesurfer.on("timeupdate", (time) => {
    setCurrentTime(time);
  });

  wavesurfer.load(audioUrl);

  return {
    wavesurfer,
    seek: (time) => wavesurfer.seekTo(time / duration),
    setVolume: (vol) => wavesurfer.setVolume(vol),
  };
};
```

### Компоненты:

- **StemWaveform** - визуализация стемов
- **AudioVisualizer** - динамическая визуализация через Canvas API
- **ProgressBar** - интерактивный прогресс-бар

---

## Редактирование секций треков

### 📁 Файлы:

- `src/hooks/useSectionReplacement.ts`
- `src/hooks/useSectionDetection.ts`
- `src/hooks/useReplaceSectionMutation.ts`

### Детекция секций:

```typescript
const useSectionDetection = (lyrics, alignedWords, duration) => {
  // Поиск тегов [Verse], [Chorus] и т.д.
  const pattern = /\[(Verse|Chorus|Bridge|Intro|Outro)\]/gi;

  const sections = [];
  let match;

  while ((match = pattern.exec(lyrics)) !== null) {
    const sectionName = match[1];
    const startIndex = match.index;

    // Время через alignedWords
    const startWord = alignedWords.find((w) => w.charIndex >= startIndex);
    const startTime = startWord?.startTime || 0;

    // Конец = следующая секция или конец трека
    const nextMatch = pattern.exec(lyrics);
    const endTime = nextMatch ? alignedWords.find((w) => w.charIndex >= nextMatch.index)?.startTime : duration;

    sections.push({ name: sectionName, startTime, endTime, lyrics });
  }

  return sections;
};
```

### Замена секции:

```typescript
const executeReplacement = async () => {
  const result = await replaceMutation.mutateAsync({
    trackId,
    prompt,
    tags,
    infillStartS: Math.round(startTime * 10) / 10,
    infillEndS: Math.round(endTime * 10) / 10,
  });

  if (result?.taskId) {
    setActiveTask(result.taskId); // Отслеживание
  }
};
```

### Пресеты:

```typescript
const SECTION_PRESETS = [
  { id: "energetic", label: "⚡ Энергичнее", prompt: "more energetic, higher tempo" },
  { id: "soft", label: "🎵 Мягче", prompt: "softer, gentler, acoustic" },
  { id: "epic", label: "🎬 Эпичнее", prompt: "epic, orchestral, cinematic" },
  { id: "rock", label: "🎸 Рок", prompt: "rock style, distorted guitar" },
];
```

### Realtime обновления:

```typescript
const useReplaceSectionRealtime = (trackId) => {
  useEffect(() => {
    const channel = supabase
      .channel(`replaced_sections:${trackId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "replaced_sections",
          filter: `track_id=eq.${trackId}`,
        },
        (payload) => {
          queryClient.invalidateQueries(["replacedSections", trackId]);

          if (payload.new.status === "completed") {
            toast.success("Замена завершена!");
          }
        },
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [trackId]);
};
```

---

## Управление состоянием

### Zustand Stores:

#### 1. playerStore (базовый)

```typescript
// src/stores/playerStore.ts
interface PlayerState {
  currentTime: number;
  isPlaying: boolean;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
}
```

#### 2. usePlayerState (расширенный)

```typescript
// src/hooks/audio/usePlayerState.ts
interface PlayerState {
  activeTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  currentIndex: number;
  shuffle: boolean;
  repeat: "off" | "all" | "one";
  playerMode: "minimized" | "compact" | "expanded" | "fullscreen";

  playTrack: (track?: Track) => void;
  pauseTrack: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
}
```

#### 3. sectionEditorStore

```typescript
// src/stores/useSectionEditorStore.ts
interface SectionEditorState {
  editMode: "select" | "custom" | null;
  selectedSectionIndex: number | null;
  customRange: { start: number; end: number } | null;
  activeTask: string | null;

  selectSection: (index: number) => void;
  setCustomRange: (start: number, end: number) => void;
  clearSelection: () => void;
  reset: () => void;
}
```

#### 4. lyricsWizardStore (с персистентностью)

```typescript
// src/stores/lyricsWizardStore.ts
export const useLyricsWizardStore = create<LyricsWizardState>()(
  persist(
    (set, get) => ({
      currentStep: 0,
      theme: "",
      generatedLyrics: "",
      setTheme: (theme) => set({ theme }),
      generateLyrics: async () => {
        /* AI logic */
      },
    }),
    {
      name: "lyrics-wizard-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
```

---

## Потоки данных

### 1. Воспроизведение трека:

```
User clicks track
      ↓
TrackCard.onClick()
      ↓
usePlayerStore.playTrack(track)
      ↓
playerLogic.playTrack()
  - Check if same track
  - Update queue index if needed
  - Set activeTrack, isPlaying=true
      ↓
useGlobalAudioPlayer (effect)
      ↓
Audio element update
  - Get source (streaming → local → original)
  - Load if changed
  - Call audio.play()
      ↓
HTML5 Audio playback
      ↓
Events:
  - timeupdate → update state
  - ended → nextTrack()
  - error → fallback source
      ↓
Components re-render
```

### 2. Экспорт микса:

```
User clicks "Export"
      ↓
useMixExport.downloadMix()
      ↓
exportMix() async:
  1. Filter active stems (10%)
  2. Load audio buffers (30%)
  3. Create OfflineAudioContext (40%)
  4. Build effects graph (50-80%)
  5. Render (85%)
  6. Convert WAV/MP3 (95%)
  7. Download (100%)
      ↓
File downloaded
```

### 3. Замена секции:

```
User selects & clicks "Replace"
      ↓
useSectionReplacement.executeReplacement()
      ↓
useReplaceSectionMutation.mutateAsync()
      ↓
Supabase Edge Function: suno-replace-section
      ↓
Edge Function:
  1. Call Suno API
  2. Create task record
  3. Return taskId
      ↓
Database insert: replaced_sections
      ↓
useSectionEditorStore.setActiveTask(taskId)
      ↓
Realtime subscription listening
      ↓
When status → 'completed':
  - Show toast
  - Invalidate cache
  - Show preview
```

---

## Оптимизация производительности

### 1. Singleton Pattern

```typescript
// Единый Audio Element
let globalAudioElement: HTMLAudioElement | null = null;

// Shared AudioContext
let sharedAudioContext: AudioContext | null = null;
```

### 2. Cleanup

```typescript
useEffect(() => {
  return () => {
    audio.pause();
    audio.src = ""; // Release memory
    audio = null;
  };
}, []);
```

### 3. Memoization

```typescript
export const StemChannel = React.memo(({ stem, volume, onVolumeChange }) => {
  // Heavy component in list
});

const updateVolume = useCallback(
  (stemId, vol) => {
    setStemVolume(stemId, vol);
  },
  [setStemVolume],
);
```

### 4. Debouncing

```typescript
const debouncedSeek = useDebouncedCallback((time) => {
  audioElement.currentTime = time;
}, 50);
```

### 5. Batch Updates

```typescript
// Single re-render вместо 4-х
usePlayerStore.setState({
  activeTrack: newTrack,
  isPlaying: true,
  currentIndex: newIndex,
  playerMode: "compact",
});
```

### 6. Virtualization

```typescript
import { Virtuoso } from 'react-virtuoso';

<Virtuoso
  data={queue}
  itemContent={(index, track) => <QueueItem track={track} />}
  style={{ height: '400px' }}
/>
```

---

## 🎯 Ключевые выводы

### Архитектурные преимущества:

1. **Модульность**: Четкое разделение layers (UI, Hooks, State, Web Audio, Storage)
2. **Переиспользуемость**: Hooks для разных компонентов
3. **Singleton pattern**: Эффективное использование ресурсов
4. **Web Audio API**: Профессиональная обработка, низкая латентность
5. **Персистентность**: Автоматическое сохранение в localStorage
6. **Realtime**: Supabase subscriptions для живых обновлений

### Технологический стек:

- **State Management**: Zustand (легковесный, производительный)
- **Audio Processing**: Web Audio API (нативный, мощный)
- **Visualization**: WaveSurfer.js + Canvas API
- **Export**: OfflineAudioContext + lamejs (MP3)
- **Storage**: localStorage + Supabase Storage
- **Realtime**: Supabase Realtime subscriptions
- **Query**: TanStack Query (кэширование, optimistic updates)

### Масштабируемость:

- Легко добавлять новые эффекты в цепь
- Модульные hooks для расширения функционала
- Готовая инфраструктура для улучшений (gapless playback, crossfade)

### Основные файлы:

```
src/
├── hooks/
│   ├── audio/
│   │   ├── useGlobalAudioPlayer.ts    # Singleton player
│   │   ├── usePlaybackQueue.ts        # Queue management
│   │   ├── usePlayerState.ts          # State store
│   │   └── useWaveform.ts             # Visualization
│   ├── studio/
│   │   ├── useStemStudioEngine.ts     # Multi-stem manager
│   │   ├── useStemAudioEngine.ts      # Single stem
│   │   ├── useStudioPlayer.ts         # Studio playback
│   │   └── useTrimExport.ts           # Trim audio
│   ├── useMixExport.ts                # Mix export
│   ├── useSectionReplacement.ts       # Section editing
│   └── useSectionDetection.ts         # Section detection
├── stores/
│   ├── playerStore.ts                 # Basic player state
│   ├── lyricsWizardStore.ts           # AI lyrics
│   ├── planTrackStore.ts              # Track planning
│   └── useSectionEditorStore.ts       # Section editor
└── components/
    ├── player/                        # Player UI components
    │   ├── MiniPlayer.tsx
    │   ├── ExpandedPlayer.tsx
    │   ├── MobileFullscreenPlayer.tsx
    │   ├── PlaybackControls.tsx
    │   ├── ProgressBar.tsx
    │   ├── VolumeControl.tsx
    │   ├── QueueSheet.tsx
    │   └── AudioVisualizer.tsx
    └── stem-studio/                   # Studio components
        ├── StemStudioContent.tsx
        ├── StemChannel.tsx
        ├── StemWaveform.tsx
        ├── MixExportDialog.tsx
        ├── TrimDialog.tsx
        └── effects/
            ├── EqualizerControl.tsx
            ├── CompressorControl.tsx
            └── ReverbControl.tsx
```

---

**Конец документа**

Дата создания: 9 декабря 2025
