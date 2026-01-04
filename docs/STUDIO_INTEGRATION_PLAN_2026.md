# 🎼 План интеграции Studio с функциями записи и транскрипции

**Дата создания:** 2026-01-04  
**Статус:** 📋 Planning  
**Приоритет:** P1 (Critical)  
**Связанные документы:**
- [SDD-015-Studio-Enhancement.md](../specs/SDD-015-Studio-Enhancement.md)
- [001-unified-studio-mobile](../specs/001-unified-studio-mobile/)
- [STUDIO_V2_INTERFACE_IMPROVEMENTS.md](../STUDIO_V2_INTERFACE_IMPROVEMENTS.md)

---

## 📋 Оглавление

1. [Введение и цели](#-введение-и-цели)
2. [Текущее состояние](#-текущее-состояние)
3. [Предлагаемая архитектура](#-предлагаемая-архитектура)
4. [Функциональные возможности](#-функциональные-возможности)
5. [Технические спецификации](#-технические-спецификации)
6. [Дорожная карта реализации](#-дорожная-карта-реализации)
7. [Интеграции с API](#-интеграции-с-api)
8. [Модель данных](#-модель-данных)
9. [UX/UI спецификации](#-uxui-спецификации)
10. [Метрики успеха](#-метрики-успеха)

---

## 🎯 Введение и цели

### Описание проблемы

В настоящее время платформа MusicVerse AI имеет разрозненные функции записи и обработки аудио:
- **AudioRecordDialog** - базовая запись микрофона
- **GuitarStudio** - специализированная страница для гитарных записей
- **TranscriptionExportPanel** - экспорт стемов в MIDI
- **VocalReplacementDialog/ArrangementReplacementDialog** - замена частей трека

Эти функции работают изолированно, что создаёт:
- ❌ Фрагментированный пользовательский опыт
- ❌ Дублирование кода (~30% перекрытия)
- ❌ Сложность в поддержке и развитии
- ❌ Неполное использование возможностей API (Klangio, Replicate, Suno)
- ❌ Отсутствие единого workflow для музыкантов

### Цели интеграции

#### Бизнес-цели
1. **Unified Recording Studio** - единое место для всех типов записи
2. **Professional Workflow** - DAW-стиль работы для музыкантов
3. **AI-Powered Tools** - интеллектуальная транскрипция и анализ
4. **Mobile-First** - оптимизация для мобильных устройств
5. **User Retention** - увеличение вовлечённости через профессиональные инструменты

#### Технические цели
1. Консолидация кодовой базы (-40% дублирования)
2. Унифицированный API для всех типов записи
3. Полная интеграция Klangio API (chords, transcription, beat tracking)
4. Real-time визуализация (waveform, chords, MIDI roll)
5. Оптимизация производительности (lazy loading, virtualization)

---

## 📊 Текущее состояние

### Существующие компоненты

#### 1. Recording Components
```
src/components/audio-record/
├── AudioRecordDialog.tsx           # Диалог записи микрофона (✅ работает)
├── CloudAudioPicker.tsx            # Выбор из облачных файлов (✅ работает)
└── InstrumentalSettingsDialog.tsx  # Настройки инструментала (✅ работает)
```

**Возможности:**
- ✅ Запись с микрофона (до 5 минут)
- ✅ Загрузка из облака (reference-audio bucket)
- ✅ Авто-сохранение в облако
- ✅ Preview перед отправкой
- ❌ Отсутствует: метроном, тюнер, мониторинг уровня
- ❌ Отсутствует: multi-take recording (запись нескольких дублей)

#### 2. Guitar Studio
```
src/pages/GuitarStudio.tsx          # Специализированная страница (✅ работает частично)
src/hooks/useGuitarAnalysis.ts      # Анализ через Klangio (⚠️ требует доработки)
src/types/guitar.ts                 # Типы для гитарных данных
```

**Возможности:**
- ✅ Запись гитары
- ✅ Анализ через Klangio API
- ✅ Определение темпа, аккордов, бит-трекинг
- ⚠️ Экспорт в MIDI/GP5/PDF (частично работает - см. SDD-015)
- ❌ Визуализация аккордов на waveform
- ❌ Табулатуры guitar pro

#### 3. Transcription Export
```
src/components/stem-studio/TranscriptionExportPanel.tsx  # MIDI экспорт (✅ работает)
```

**Возможности:**
- ✅ Транскрипция стемов в MIDI (Replicate + Klangio)
- ✅ Выбор модели (guitar/piano/bass/drums/vocal/universal)
- ✅ Экспорт в MIDI, GP5, PDF, MusicXML
- ⚠️ Klangio возвращает только 2/5 форматов (MIDI + MusicXML) - баг в API
- ❌ MIDI roll визуализация
- ❌ Редактирование MIDI перед экспортом

#### 4. Stem Studio Dialogs
```
src/components/stem-studio/
├── VocalReplacementDialog.tsx       # Замена вокала (⚠️ требует audioUrl стема)
├── ArrangementReplacementDialog.tsx # Замена аранжировки (⚠️ требует audioUrl стема)
├── ExtendDialog.tsx                 # Продление трека (✅ работает)
├── RemixDialog.tsx                  # Ремикс трека (✅ работает)
└── TrimDialog.tsx                   # Обрезка трека (✅ работает)
```

**Возможности:**
- ✅ Extend - продление трека на 10-40 секунд
- ✅ Remix - создание ремикса с новым стилем
- ✅ Trim - обрезка начала/конца
- ⚠️ Replace Vocal - требует instrumental stem URL (баг)
- ⚠️ Replace Arrangement - требует vocal stem URL (баг)
- ❌ Add Vocal - добавление вокала к instrumental треку
- ❌ Add Instrumental - добавление инструментала к vocal треку

#### 5. Edge Functions
```
supabase/functions/
├── klangio-analyze/           # Klangio API integration (⚠️ диагностика в PR #149)
├── replicate-midi-transcription/ # Basic Pitch MIDI transcription (✅ работает)
├── transcribe-midi/           # Legacy MIDI transcription (❌ устарел)
└── transcribe-lyrics/         # Lyrics transcription (✅ работает)
```

**Статус интеграций:**
- ✅ **Klangio API** - chord recognition, beat tracking, transcription
  - ⚠️ **BLOCKER**: API возвращает только 2/5 форматов (MIDI + MusicXML)
  - ⏳ **PR #149**: Диагностическое логирование развёрнуто, ожидание результатов
- ✅ **Replicate Basic Pitch** - MIDI transcription (работает стабильно)
- ✅ **Suno AI v5** - генерация музыки, extend, remix

### Проблемные зоны

#### Критические баги (P1)
1. **VocalReplacementDialog** - не передаёт audioUrl стема → генерация падает
2. **ArrangementReplacementDialog** - не передаёт audioUrl стема → генерация падает
3. **Klangio outputs** - возвращает только 2/5 форматов (MIDI + MusicXML)
4. **Section detection** - не извлекает секции из lyrics корректно

#### Архитектурные проблемы (P2)
1. **Фрагментация** - 3 разных места для записи аудио
2. **Дублирование** - схожий код в AudioRecordDialog и GuitarStudio
3. **Нет единого workflow** - пользователь не понимает, где что делать
4. **Отсутствие визуализации** - нет chord overlay на waveform, нет MIDI roll

#### Отсутствующие функции (P3)
1. **Multi-take recording** - запись нескольких дублей для выбора лучшего
2. **Vocal tuning tools** - метроном, тюнер, pitch correction
3. **Chord library** - библиотека аккордов с аппликатурами
4. **MIDI editor** - редактирование MIDI перед экспортом
5. **Export presets** - пресеты экспорта (stems + MIDI + PDF в один клик)

---

## 🏗️ Предлагаемая архитектура

### Концепция: Unified Recording Studio

Создание единого компонента **UnifiedRecordingStudio**, который:
1. Заменяет разрозненные диалоги и страницы
2. Интегрируется в **UnifiedStudioPage** как вкладка "Recording"
3. Предоставляет единый интерфейс для всех типов записи
4. Поддерживает профессиональный workflow (запись → анализ → транскрипция → экспорт)

### Архитектурная схема

```
┌─────────────────────────────────────────────────────────────┐
│                    UnifiedStudioPage                         │
│  (src/pages/studio-v2/UnifiedStudioPage.tsx)                │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ tabs: ['tracks', 'mixer', 'recording', 'export']
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     StudioShell                              │
│  (src/components/studio/unified/StudioShell.tsx)            │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Tracks Tab  │  │  Mixer Tab   │  │  Recording Tab   │  │
│  │              │  │              │  │  (NEW)           │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                               │              │
└───────────────────────────────────────────────┼──────────────┘
                                                │
                        ┌───────────────────────┴───────────────────────┐
                        │                                               │
                        ▼                                               ▼
        ┌──────────────────────────────┐              ┌──────────────────────────────┐
        │  UnifiedRecordingStudio      │              │  TranscriptionWorkflow       │
        │  (NEW Component)             │              │  (NEW Component)             │
        │                              │              │                              │
        │  • RecordingPanel            │              │  • TranscriptionPanel        │
        │  • SourceSelector            │◄─────────────│  • ChordVisualization        │
        │  • MonitoringTools           │              │  • MIDIRollViewer            │
        │  • TakeManager               │              │  • ExportOptionsPanel        │
        └──────────────────────────────┘              └──────────────────────────────┘
                        │                                               │
                        │                                               │
                        ▼                                               ▼
        ┌──────────────────────────────┐              ┌──────────────────────────────┐
        │  Recording Services          │              │  Analysis Services           │
        │                              │              │                              │
        │  • RecordingService          │              │  • KlangioService            │
        │  • AudioProcessingService    │              │  • ReplicateService          │
        │  • CloudStorageService       │              │  • ChordDetectionService     │
        └──────────────────────────────┘              └──────────────────────────────┘
```

### Компонентная структура

#### Новые компоненты

```
src/components/studio/recording/
├── UnifiedRecordingStudio.tsx        # Главный компонент
├── RecordingPanel.tsx                # Панель записи
│   ├── RecordButton.tsx              # Кнопка записи
│   ├── TakesList.tsx                 # Список дублей
│   └── RecordingControls.tsx         # Управление записью
├── MonitoringTools.tsx               # Инструменты мониторинга
│   ├── Metronome.tsx                 # Метроном (✅ уже есть)
│   ├── GuitarTuner.tsx               # Тюнер (✅ уже есть)
│   ├── AudioLevelMeter.tsx           # Измеритель уровня (✅ уже есть)
│   └── PitchMonitor.tsx              # Монитор высоты тона (NEW)
├── SourceSelector.tsx                # Выбор источника
│   ├── MicrophoneSource.tsx          # Микрофон
│   ├── CloudSource.tsx               # Облачные файлы
│   └── TrackSource.tsx               # Стемы из треков
└── TakeManager.tsx                   # Менеджер дублей (NEW)

src/components/studio/transcription/
├── TranscriptionWorkflow.tsx         # Workflow транскрипции
├── TranscriptionPanel.tsx            # Панель транскрипции
│   ├── EngineSelector.tsx            # Выбор движка (Klangio/Replicate)
│   ├── ModelSelector.tsx             # Выбор модели
│   ├── TranscriptionProgress.tsx     # Прогресс транскрипции
│   └── TranscriptionResults.tsx      # Результаты
├── ChordVisualization.tsx            # Визуализация аккордов (NEW)
│   ├── ChordTimeline.tsx             # Таймлайн аккордов
│   ├── ChordDiagram.tsx              # Аппликатура аккорда
│   └── ChordLibrary.tsx              # Библиотека аккордов
├── MIDIRollViewer.tsx                # Просмотр MIDI (NEW)
│   ├── PianoRoll.tsx                 # Пиано-ролл
│   ├── DrumRoll.tsx                  # Барабанный редактор
│   └── GuitarTab.tsx                 # Табулатура
└── ExportOptionsPanel.tsx            # Опции экспорта
    ├── FormatSelector.tsx            # Выбор форматов
    ├── ExportPresets.tsx             # Пресеты экспорта
    └── BatchExport.tsx               # Групповой экспорт

src/services/studio/
├── RecordingService.ts               # Сервис записи (NEW)
├── TranscriptionService.ts           # Сервис транскрипции (NEW)
├── ChordDetectionService.ts          # Сервис определения аккордов (NEW)
└── MIDIProcessingService.ts          # Сервис обработки MIDI (NEW)

src/hooks/studio/
├── useRecordingWorkflow.ts           # Workflow записи (NEW)
├── useTranscriptionWorkflow.ts       # Workflow транскрипции (NEW)
├── useChordDetection.ts              # Определение аккордов (NEW)
└── useMIDIExport.ts                  # Экспорт MIDI (NEW)
```

#### Обновляемые компоненты

```
src/components/stem-studio/
├── VocalReplacementDialog.tsx        # FIX: передавать audioUrl стема
├── ArrangementReplacementDialog.tsx  # FIX: передавать audioUrl стема
└── TranscriptionExportPanel.tsx      # REFACTOR: использовать новый сервис
```

### Интеграция с существующей архитектурой

#### 1. Unified Studio Store
```typescript
// src/stores/useUnifiedStudioStore.ts
interface UnifiedStudioStore {
  project: StudioProject | null;
  activeTab: 'tracks' | 'mixer' | 'recording' | 'transcription' | 'export';
  
  // Recording state (NEW)
  recordingState: {
    isRecording: boolean;
    currentTake: AudioTake | null;
    takes: AudioTake[];
    source: 'microphone' | 'cloud' | 'stem';
    selectedStem?: TrackStem;
  };
  
  // Transcription state (NEW)
  transcriptionState: {
    isProcessing: boolean;
    engine: 'klangio' | 'replicate';
    model: TranscriptionModel;
    results: TranscriptionResults | null;
    chords: Chord[];
    midi: MIDIData | null;
  };
  
  // Actions (NEW)
  startRecording: (source: RecordingSource) => void;
  stopRecording: () => void;
  saveTake: (take: AudioTake) => Promise<void>;
  transcribeAudio: (audioUrl: string, options: TranscriptionOptions) => Promise<void>;
  detectChords: (audioUrl: string) => Promise<Chord[]>;
}
```

#### 2. Studio Project Model
```typescript
// Расширение существующей модели
interface StudioProject {
  // ... existing fields
  
  // NEW: Recording takes
  takes?: AudioTake[];
  
  // NEW: Transcription data
  transcription?: {
    chords: Chord[];
    midi: MIDIData;
    notes: Note[];
    beats: Beat[];
  };
}

interface AudioTake {
  id: string;
  project_id: string;
  audio_url: string;
  duration: number;
  created_at: string;
  source: 'microphone' | 'cloud' | 'stem';
  stem_id?: string;
  metadata?: {
    bpm?: number;
    key?: string;
    quality_score?: number; // AI оценка качества записи
  };
}
```

---

## 🎵 Функциональные возможности

### 1. Unified Recording System

#### 1.1 Recording Sources

**Microphone Recording**
- Запись с микрофона (до 10 минут)
- Real-time мониторинг уровня
- Метроном с настраиваемым темпом
- Count-in (отсчёт перед записью)
- Авто-сохранение каждые 30 секунд

**Cloud Audio Import**
- Выбор из reference-audio bucket
- Drag & drop загрузка
- Preview перед импортом
- Поддержка форматов: MP3, WAV, OGG, M4A

**Stem-based Recording**
- Запись поверх стема (вокал поверх instrumental)
- Замена стема (новый вокал вместо старого)
- Микс с оригиналом (blend control 0-100%)
- Auto-alignment (синхронизация по темпу)

#### 1.2 Multi-Take Recording

**Take Management**
- Запись нескольких дублей
- A/B сравнение дублей
- Оценка качества AI (pitch accuracy, timing, clarity)
- Выбор лучшего дубля автоматически
- Composite recording (сшивка лучших частей)

**Workflow:**
```
1. Настроить источник (микрофон/облако/стем)
2. Выбрать режим (single/multi-take)
3. Настроить метроном (BPM, count-in)
4. Записать дубль
5. Повторить 2-5 раз
6. Сравнить дубли (A/B comparison)
7. Выбрать лучший или создать composite
8. Сохранить в проект
```

#### 1.3 Monitoring Tools

**Metronome** (✅ уже есть в GuitarStudio)
- Настраиваемый BPM (40-240)
- Размеры: 2/4, 3/4, 4/4, 5/4, 6/8, 7/8
- Громкость (0-100%)
- Акценты на сильные доли
- Visual метроном (мигающий индикатор)

**Guitar Tuner** (✅ уже есть в GuitarStudio)
- Стандартный строй (E A D G B E)
- Альтернативные строи (Drop D, Open G, etc.)
- Real-time pitch detection
- Visual индикатор (центр/острее/тупее)
- Auto-tune режим (pitch correction)

**Audio Level Meter** (✅ уже есть в GuitarStudio)
- Peak level indicator
- RMS level indicator
- Clip detection
- Цветовая индикация (зелёный/жёлтый/красный)

**Pitch Monitor** (NEW)
- Real-time pitch visualization
- Pitch curve overlay
- Vibrato detection
- Pitch drift warning
- Target pitch indicator

### 2. Transcription & Analysis

#### 2.1 Chord Detection

**Klangio Chord Recognition**
- Режимы: basic, extended
- Vocabulary: major-minor, full (extended chords)
- Output: chord timeline с временными метками
- Confidence score для каждого аккорда
- Auto-correction для частых последовательностей

**Chord Visualization**
- Timeline с аккордами над waveform
- Chord diagrams (аппликатуры) для гитары
- Chord progression анализ (I-IV-V, ii-V-I, etc.)
- Chord library с поиском
- Export в ChordPro, UltimateGuitar format

**Workflow:**
```
1. Загрузить аудио (микрофон/облако/стем)
2. Запустить chord detection (Klangio API)
3. Дождаться результата (10-30 сек)
4. Просмотр chord timeline
5. Редактирование аккордов (если нужно)
6. Export в ChordPro/PDF
```

#### 2.2 MIDI Transcription

**Engine Selection**
- **Klangio** - более точный для guitar/piano/bass
- **Replicate Basic Pitch** - универсальный, быстрый

**Model Selection** (Klangio)
- guitar - оптимизирован для гитары
- piano - оптимизирован для фортепиано
- bass - оптимизирован для баса
- drums - оптимизирован для ударных
- vocal - оптимизирован для вокала
- universal - для любых инструментов

**Output Formats**
- MIDI (.mid) - стандартный MIDI файл
- MIDI Quantized (.mid) - квантизированный MIDI
- MusicXML (.xml/.mxml) - для Sibelius, Finale
- Guitar Pro (.gp5) - для Guitar Pro 5/6/7
- PDF (.pdf) - ноты + табулатура

**MIDI Roll Viewer** (NEW)
- Piano roll для клавишных
- Drum roll для ударных
- Guitar tab для гитары
- Zoom in/out
- Play back MIDI с синтезатором
- Export индивидуальных треков

**Workflow:**
```
1. Выбрать стем/запись для транскрипции
2. Выбрать движок (Klangio/Replicate)
3. Выбрать модель (guitar/piano/etc)
4. Запустить транскрипцию
5. Дождаться результата (30-120 сек)
6. Просмотр MIDI roll
7. Редактирование (если нужно)
8. Export в нужные форматы
```

#### 2.3 Beat Tracking

**Klangio Beat Detection**
- Tempo detection (BPM)
- Beat markers (downbeats)
- Time signature detection
- Tempo stability analysis
- Strumming pattern detection (для гитары)

**Visualization**
- Beat markers на waveform
- Tempo curve (если темп меняется)
- Grid overlay (сетка ритма)
- Click track generation

### 3. Vocal & Instrumental Processing

#### 3.1 Add Vocal to Instrumental

**Функция:** Добавление вокала к инструментальному треку

**Workflow:**
```
1. Выбрать instrumental трек (или стем)
2. Открыть "Add Vocal" dialog
3. Записать вокал (микрофон) ИЛИ загрузить из облака
4. Настроить параметры:
   - Volume balance (vocal vs instrumental)
   - Vocal effects (reverb, delay, compression)
   - Pitch correction (auto-tune level)
   - EQ presets (warm, bright, radio)
5. Preview микса
6. Отправить на генерацию через Suno AI
7. Получить новый трек с вокалом
```

**API Integration:**
- Suno AI v5 - `extend_audio` endpoint
- Параметры:
  - `audio_url` - instrumental трек
  - `vocals_audio_url` - записанный вокал
  - `prompt` - описание стиля (опционально)
  - `continue_at` - точка старта (обычно 0)

#### 3.2 Add Instrumental to Vocal

**Функция:** Добавление инструментала к вокальному треку

**Workflow:**
```
1. Выбрать vocal трек (или стем)
2. Открыть "Add Instrumental" dialog
3. Выбрать тип инструментала:
   - AI Generation (Suno генерирует новый)
   - From Library (выбор из библиотеки)
   - Record/Upload (запись гитары/пианино)
4. Настроить параметры:
   - Style prompt (для AI generation)
   - Volume balance
   - Key matching (авто-подбор тональности)
   - Tempo matching (авто-подбор темпа)
5. Preview микса
6. Отправить на генерацию
7. Получить новый трек с инструменталом
```

#### 3.3 Replace Vocal (FIX)

**Текущий баг:** VocalReplacementDialog не передаёт audioUrl стема

**Fix:**
```typescript
// VocalReplacementDialog.tsx
const handleGenerate = async () => {
  // ... existing code
  
  // FIX: Get instrumental stem URL
  const instrumentalStem = track.stems?.find(s => 
    s.stem_type === 'instrumental' || s.stem_type === 'accompaniment'
  );
  
  if (!instrumentalStem?.audio_url) {
    toast.error('Инструментальный стем не найден');
    return;
  }
  
  const requestData = {
    // ... existing fields
    audio_url: instrumentalStem.audio_url, // FIX: передать URL стема
    vocals_audio_url: recordedVocalUrl,    // Новый вокал
  };
  
  // ... rest of code
};
```

#### 3.4 Replace Arrangement (FIX)

**Текущий баг:** ArrangementReplacementDialog не передаёт audioUrl стема

**Fix:**
```typescript
// ArrangementReplacementDialog.tsx
const handleGenerate = async () => {
  // ... existing code
  
  // FIX: Get vocal stem URL
  const vocalStem = track.stems?.find(s => 
    s.stem_type === 'vocals'
  );
  
  if (!vocalStem?.audio_url) {
    toast.error('Вокальный стем не найден');
    return;
  }
  
  const requestData = {
    // ... existing fields
    audio_url: vocalStem.audio_url,        // FIX: передать URL стема
    instrumental_url: newInstrumentalUrl,   // Новый инструментал
  };
  
  // ... rest of code
};
```

### 4. Extension & Remix

#### 4.1 Extend Track (✅ уже работает)

**Функция:** Продление трека на 10-40 секунд

**Текущая реализация:**
- ExtendDialog.tsx - UI
- Suno AI v5 - `extend` endpoint
- Настройки: duration (10/20/30/40s), prompt

**Предлагаемые улучшения:**
- Auto-fade для плавного перехода
- Extend with new section (verse → chorus)
- Multiple extensions (40s → 80s → 120s)

#### 4.2 Remix Track (✅ уже работает)

**Функция:** Создание ремикса с новым стилем

**Текущая реализация:**
- RemixDialog.tsx - UI
- Suno AI v5 - `extend_audio` endpoint
- Настройки: style prompt, intensity

**Предлагаемые улучшения:**
- Style transfer from reference track
- Remix presets (EDM, Acoustic, Lo-fi)
- Stem-selective remix (только инструментал/вокал)

### 5. Export & Sharing

#### 5.1 Multi-format Export

**Audio Formats:**
- MP3 (320 kbps) - для шаринга
- WAV (44.1kHz, 16-bit) - для мастеринга
- OGG (high quality) - для веба
- M4A (AAC) - для iOS

**Notation Formats:**
- MIDI (.mid) - для DAW
- MIDI Quantized (.mid) - для точности
- MusicXML (.xml) - для нотаторов
- Guitar Pro (.gp5) - для гитаристов
- PDF (.pdf) - ноты + табулатура
- ChordPro (.cho) - текст с аккордами

**Stems Export:**
- Individual stems (vocals, instrumental, drums, bass, etc.)
- Grouped stems (drums + bass, synths + pads)
- Dry stems (без эффектов)
- Wet stems (с эффектами)

#### 5.2 Export Presets

**Quick Export Presets:**
- "Songwriter Package" - MP3 + Chords + Lyrics PDF
- "Producer Package" - WAV + Stems + MIDI
- "Guitarist Package" - MP3 + GP5 + PDF tabs
- "Karaoke Package" - Instrumental MP3 + Lyrics
- "Covers Package" - Stems + MIDI + Chords

#### 5.3 Batch Export

**Функция:** Экспорт нескольких файлов одновременно

**Workflow:**
```
1. Выбрать элементы для экспорта:
   - Tracks (основной трек + версии)
   - Stems (vocal, instrumental, etc.)
   - MIDI files
   - Chord charts
2. Выбрать форматы для каждого типа
3. Настроить опции (bitrate, sample rate, etc.)
4. Запустить batch export
5. Скачать ZIP архив со всеми файлами
```

---

## 🔧 Технические спецификации

### API Интеграции

#### 1. Klangio API

**Endpoint:** `https://api.klangio.com/v1/jobs`

**Поддерживаемые режимы:**
- `transcription` - транскрипция в MIDI/ноты
- `chord-recognition` - определение аккордов
- `chord-recognition-extended` - расширенные аккорды
- `beat-tracking` - определение темпа и бит

**Модели:**
- guitar, piano, bass, drums, vocal, lead, string, wind
- universal, detect, multi, piano_arrangement

**Outputs:**
- midi, midi_quant, mxml, gp5, pdf, json

**Текущие проблемы:**
- ⚠️ API возвращает только 2/5 форматов (MIDI + MusicXML)
- ⚠️ GP5, PDF, MIDI Quantized отсутствуют
- ⏳ PR #149: Диагностика развёрнута, ожидание результатов

**Предлагаемое решение:**
```typescript
// Edge Function: klangio-analyze/index.ts

// 1. Добавить retry логику для missing outputs
async function retryMissingOutputs(jobId: string, missingFormats: string[]) {
  // Попробовать получить outputs через отдельные запросы
  for (const format of missingFormats) {
    const response = await fetch(`https://api.klangio.com/v1/jobs/${jobId}/outputs/${format}`);
    if (response.ok) {
      // Сохранить output в storage
    }
  }
}

// 2. Fallback на генерацию PDF из MIDI
async function generatePdfFromMidi(midiUrl: string) {
  // Использовать musescore или другой конвертер
  // Загрузить в storage, вернуть URL
}

// 3. Квантизация MIDI на клиенте
function quantizeMidi(midiData: MIDIData, quantizeValue: number) {
  // Квантизировать ноты на клиенте
  // Сохранить как midi_quant
}
```

#### 2. Replicate API

**Model:** `spotify/basic-pitch`

**Endpoint:** `/predictions`

**Parameters:**
- `audio_url` - URL аудио файла
- `onset_threshold` - порог детекции нот (0.0-1.0)
- `frame_threshold` - порог фрейма (0.0-1.0)
- `minimum_note_length` - минимальная длина ноты (ms)
- `minimum_frequency` - минимальная частота (Hz)
- `maximum_frequency` - максимальная частота (Hz)

**Output:**
- MIDI file URL
- Note events (pitch, time, duration)

**Плюсы:**
- ✅ Стабильно работает
- ✅ Универсальный (не требует выбора модели)
- ✅ Быстрый (10-30 сек)

**Минусы:**
- ❌ Только MIDI (нет GP5, PDF, MusicXML)
- ❌ Менее точный для гитары/баса
- ❌ Не определяет аккорды

#### 3. Suno AI v5

**Endpoints:**

**3.1 Generate with Vocals**
```
POST /api/v5/generate
{
  "prompt": "style description",
  "vocals_audio_url": "URL to recorded vocals",
  "model": "chirp-v5",
  "instrumental": false
}
```

**3.2 Extend Audio**
```
POST /api/v5/extend
{
  "audio_url": "URL to base track",
  "continue_at": 30,
  "duration": 40
}
```

**3.3 Replace Section** (через extend_audio)
```
POST /api/v5/extend_audio
{
  "audio_url": "URL to base audio (stem)",
  "vocals_audio_url": "URL to new vocals/instrumental",
  "prompt": "style",
  "continue_at": 0
}
```

### Database Schema

#### Новые таблицы

**audio_takes** - хранение дублей записи
```sql
CREATE TABLE public.audio_takes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES studio_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER,
  source TEXT CHECK (source IN ('microphone', 'cloud', 'stem')),
  stem_id UUID REFERENCES track_stems(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  quality_score DECIMAL(3,2),
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audio_takes_project ON audio_takes(project_id);
CREATE INDEX idx_audio_takes_user ON audio_takes(user_id);
```

**transcription_jobs** - отслеживание задач транскрипции
```sql
CREATE TABLE public.transcription_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audio_url TEXT NOT NULL,
  engine TEXT CHECK (engine IN ('klangio', 'replicate')) NOT NULL,
  model TEXT,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  results JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  user_id UUID REFERENCES profiles(id)
);

CREATE INDEX idx_transcription_jobs_status ON transcription_jobs(status);
CREATE INDEX idx_transcription_jobs_user ON transcription_jobs(user_id);
```

**chord_data** - хранение данных об аккордах
```sql
CREATE TABLE public.chord_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  stem_id UUID REFERENCES track_stems(id) ON DELETE CASCADE,
  chords JSONB NOT NULL, -- Array of {chord, start, end, confidence}
  key TEXT,
  detected_at TIMESTAMPTZ DEFAULT now(),
  source TEXT CHECK (source IN ('klangio', 'manual')) DEFAULT 'klangio'
);

CREATE INDEX idx_chord_data_track ON chord_data(track_id);
CREATE INDEX idx_chord_data_stem ON chord_data(stem_id);
```

#### Обновление существующих таблиц

**studio_projects** - добавить поля для записи
```sql
ALTER TABLE studio_projects
ADD COLUMN recording_settings JSONB DEFAULT '{
  "metronome_enabled": false,
  "metronome_bpm": 120,
  "metronome_time_signature": "4/4",
  "count_in_bars": 2,
  "monitor_enabled": true
}'::jsonb;
```

**track_stems** - добавить поля для транскрипции
```sql
ALTER TABLE track_stems
ADD COLUMN midi_url TEXT,
ADD COLUMN midi_quant_url TEXT,
ADD COLUMN musicxml_url TEXT,
ADD COLUMN gp5_url TEXT,
ADD COLUMN pdf_url TEXT,
ADD COLUMN transcription_metadata JSONB DEFAULT '{}'::jsonb;
```

### Performance Optimization

#### 1. Lazy Loading
- Загружать chord diagrams только при hover/click
- Lazy load MIDI roll viewer (только когда открыт)
- Virtualize take list (react-virtuoso)

#### 2. Audio Streaming
- Использовать chunked streaming для больших файлов
- Progressive loading waveform (показать low-res, потом high-res)
- Cache decoded audio data в IndexedDB

#### 3. Caching Strategy
```typescript
// TanStack Query config
{
  staleTime: 5 * 60 * 1000,      // 5 минут
  gcTime: 30 * 60 * 1000,        // 30 минут
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
}
```

#### 4. Web Workers
- Decode audio в Web Worker
- Генерация waveform в Worker
- MIDI processing в Worker

---

## 📅 Дорожная карта реализации

### Phase 1: Foundation & Fixes (Week 1-2)

**Цель:** Исправить критические баги и подготовить базу

**Tasks:**
1. ✅ **T1.1**: Исправить VocalReplacementDialog - передавать audioUrl стема
2. ✅ **T1.2**: Исправить ArrangementReplacementDialog - передавать audioUrl стема
3. ⚠️ **T1.3**: Диагностика Klangio outputs (PR #149 уже развёрнут)
4. 🔄 **T1.4**: Создать базовую структуру UnifiedRecordingStudio компонента
5. 🔄 **T1.5**: Создать сервисы (RecordingService, TranscriptionService)
6. 🔄 **T1.6**: Обновить database schema (audio_takes, transcription_jobs, chord_data)

**Acceptance Criteria:**
- [ ] VocalReplacementDialog успешно заменяет вокал с использованием instrumental стема
- [ ] ArrangementReplacementDialog успешно заменяет аранжировку с использованием vocal стема
- [ ] Klangio диагностика показывает причину missing outputs
- [ ] Базовый UnifiedRecordingStudio компонент рендерится в StudioShell
- [ ] Сервисы покрыты unit тестами (>80% coverage)
- [ ] Database migrations успешно применяются

**Success Metrics:**
- Zero failed generations из-за missing audioUrl
- Diagnostic logs показывают root cause для Klangio
- 100% test coverage для новых сервисов

---

### Phase 2: Recording System (Week 3-4)

**Цель:** Реализовать unified recording system с multi-take support

**Tasks:**
1. 🔄 **T2.1**: Реализовать RecordingPanel с source selector
2. 🔄 **T2.2**: Интегрировать Metronome, GuitarTuner, AudioLevelMeter
3. 🔄 **T2.3**: Реализовать multi-take recording
4. 🔄 **T2.4**: Создать TakeManager с A/B comparison
5. 🔄 **T2.5**: Добавить AI quality scoring для дублей
6. 🔄 **T2.6**: Интегрировать с UnifiedStudioStore
7. 🔄 **T2.7**: Добавить cloud storage для takes (audio-takes bucket)

**Acceptance Criteria:**
- [ ] Пользователь может записать аудио с микрофона
- [ ] Метроном работает с настраиваемым BPM и размером
- [ ] Multi-take recording позволяет записать 5+ дублей
- [ ] A/B comparison позволяет сравнить любые 2 дубля
- [ ] AI quality score показывает оценку 0-100 для каждого дубля
- [ ] Дубли автоматически сохраняются в облако
- [ ] Выбранный дубль сохраняется в studio_project

**Success Metrics:**
- 90% пользователей успешно записывают первый дубль
- Average 3.5 дублей на одну сессию записи
- 80% выбирают дубль с highest AI score

---

### Phase 3: Transcription & Chords (Week 5-6)

**Цель:** Реализовать transcription workflow с chord visualization

**Tasks:**
1. 🔄 **T3.1**: Реализовать TranscriptionPanel с engine/model selector
2. 🔄 **T3.2**: Интегрировать Klangio chord detection
3. 🔄 **T3.3**: Создать ChordTimeline с overlay на waveform
4. 🔄 **T3.4**: Реализовать ChordDiagram с guitar fingerings
5. 🔄 **T3.5**: Создать ChordLibrary с поиском
6. 🔄 **T3.6**: Добавить MIDI transcription (Klangio + Replicate)
7. 🔄 **T3.7**: Реализовать MIDIRollViewer (piano roll)
8. 🔄 **T3.8**: Добавить GuitarTab viewer для табулатур
9. 🔄 **T3.9**: Интегрировать с TranscriptionExportPanel

**Acceptance Criteria:**
- [ ] Пользователь может запустить chord detection на любом аудио
- [ ] ChordTimeline показывает аккорды над waveform с sync
- [ ] Клик на аккорд показывает guitar fingering diagram
- [ ] ChordLibrary позволяет искать аккорды по названию
- [ ] MIDI transcription работает с обоими движками (Klangio + Replicate)
- [ ] MIDIRollViewer показывает ноты на piano roll
- [ ] GuitarTab показывает табулатуру для гитарных треков
- [ ] Экспорт работает во все форматы (MIDI, GP5, PDF, MusicXML)

**Success Metrics:**
- 70% гитаристов используют chord detection
- 85% chord detection accuracy (по feedback)
- 60% используют MIDI export

---

### Phase 4: Add Vocal/Instrumental (Week 7-8)

**Цель:** Реализовать функции добавления вокала/инструментала

**Tasks:**
1. 🔄 **T4.1**: Создать AddVocalDialog
2. 🔄 **T4.2**: Интегрировать запись вокала в AddVocalDialog
3. 🔄 **T4.3**: Добавить vocal effects (reverb, delay, compression)
4. 🔄 **T4.4**: Реализовать pitch correction (auto-tune)
5. 🔄 **T4.5**: Создать AddInstrumentalDialog
6. 🔄 **T4.6**: Интегрировать AI generation инструментала (Suno)
7. 🔄 **T4.7**: Добавить key/tempo matching
8. 🔄 **T4.8**: Реализовать volume balance controls
9. 🔄 **T4.9**: Интегрировать с Suno AI v5 API

**Acceptance Criteria:**
- [ ] AddVocalDialog позволяет записать вокал поверх instrumental
- [ ] Vocal effects применяются в real-time preview
- [ ] Pitch correction работает с настраиваемым уровнем (0-100%)
- [ ] AddInstrumentalDialog генерирует инструментал через Suno AI
- [ ] Key matching автоматически подбирает тональность
- [ ] Tempo matching синхронизирует темп
- [ ] Volume balance позволяет миксовать vocal + instrumental
- [ ] Генерация успешно создаёт новый трек

**Success Metrics:**
- 50% instrumental треков получают вокал
- 30% vocal треков получают новый инструментал
- 90% успешных генераций с первого раза

---

### Phase 5: Export & Polish (Week 9-10)

**Цель:** Реализовать export system и финальная полировка

**Tasks:**
1. 🔄 **T5.1**: Реализовать ExportOptionsPanel
2. 🔄 **T5.2**: Создать export presets (Songwriter, Producer, Guitarist, etc.)
3. 🔄 **T5.3**: Добавить batch export для нескольких файлов
4. 🔄 **T5.4**: Реализовать ZIP packaging для batch export
5. 🔄 **T5.5**: Добавить format conversion (MP3, WAV, OGG, M4A)
6. 🔄 **T5.6**: Оптимизация производительности (lazy loading, web workers)
7. 🔄 **T5.7**: Добавить keyboard shortcuts
8. 🔄 **T5.8**: Написать документацию и tutorials
9. 🔄 **T5.9**: E2E тестирование всех workflows
10. 🔄 **T5.10**: Beta testing с пользователями

**Acceptance Criteria:**
- [ ] ExportOptionsPanel позволяет выбрать форматы экспорта
- [ ] Export presets работают одним кликом
- [ ] Batch export создаёт ZIP с всеми файлами
- [ ] Format conversion поддерживает MP3, WAV, OGG, M4A
- [ ] Performance: <2s load time, 60 FPS UI
- [ ] Keyboard shortcuts для всех основных действий
- [ ] Документация покрывает все workflows
- [ ] E2E тесты проходят успешно (100%)
- [ ] Beta users дают 4.5+ rating

**Success Metrics:**
- 80% используют export presets
- 40% используют batch export
- 95% satisfaction rate (из beta feedback)
- <1% crash rate

---

## 📊 Метрики успеха

### Бизнес-метрики

1. **Adoption Rate**
   - Target: 60% пользователей используют recording studio в первую неделю
   - Current: N/A (new feature)

2. **Retention Impact**
   - Target: +15% increase in 7-day retention
   - Measure: Cohort analysis до/после запуска

3. **Engagement**
   - Target: Average 3.5 recordings per user per week
   - Target: 50% users transcribe at least one recording

4. **Premium Conversion**
   - Target: +20% conversion to premium (for unlimited recordings)
   - Measure: Conversion funnel from free → premium

### Технические метрики

1. **Performance**
   - Page load time: <2 seconds (p95)
   - Recording latency: <100ms
   - UI responsiveness: 60 FPS
   - Transcription time: <60s for 3-minute track

2. **Reliability**
   - Uptime: 99.9%
   - Error rate: <0.5%
   - API success rate: >98%
   - Data loss: 0%

3. **Code Quality**
   - Test coverage: >80%
   - Code duplication: <5%
   - Bundle size impact: <200KB gzipped

### UX метрики

1. **Task Success Rate**
   - Record first take: >90%
   - Multi-take comparison: >85%
   - Chord detection: >80%
   - MIDI export: >75%

2. **Time to Value**
   - First recording: <2 minutes
   - First transcription: <3 minutes
   - First export: <1 minute

3. **User Satisfaction**
   - NPS score: >40
   - Feature rating: >4.5/5
   - Would recommend: >80%

---

## 🎨 UX/UI спецификации

### Mobile-First Design

#### Touch Targets
- Minimum size: 56x56px (iOS guidelines)
- Spacing: 8px между элементами
- Safe areas: respect Telegram safe areas

#### Gestures
- Swipe left/right - переключение между дублями
- Pinch to zoom - zoom на waveform
- Long press - открыть контекстное меню
- Pull down - refresh/reload

#### Haptic Feedback
- Light impact - button tap
- Medium impact - recording start/stop
- Heavy impact - generation complete
- Success/Error notification - success/error haptic

### Visual Design

#### Color Scheme
```css
/* Recording states */
--recording-idle: #6B7280;      /* Gray */
--recording-active: #EF4444;    /* Red */
--recording-paused: #F59E0B;    /* Amber */
--recording-complete: #10B981;  /* Green */

/* Chord colors */
--chord-major: #3B82F6;         /* Blue */
--chord-minor: #8B5CF6;         /* Purple */
--chord-seventh: #EC4899;       /* Pink */
--chord-diminished: #F97316;    /* Orange */

/* Transcription states */
--transcription-pending: #6B7280;
--transcription-processing: #3B82F6;
--transcription-completed: #10B981;
--transcription-failed: #EF4444;
```

#### Typography
```css
/* Headers */
--font-header: 600 18px 'Inter';

/* Body */
--font-body: 400 14px 'Inter';

/* Caption */
--font-caption: 400 12px 'Inter';

/* Monospace (for BPM, timecode) */
--font-mono: 500 14px 'JetBrains Mono';
```

#### Spacing
```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
```

### Component States

#### Recording Button
```
Idle:       Gray circle, "Tap to Record" label
Recording:  Red pulsing circle, timer, "Tap to Stop"
Paused:     Amber circle, "Paused", "Resume" button
Complete:   Green checkmark, duration, "Save" button
```

#### Take Item
```
Default:    Waveform thumbnail, duration, timestamp
Selected:   Blue border, checkmark badge
Playing:    Play icon → Pause icon, progress bar
AI Score:   Badge with score 0-100, color-coded
```

#### Chord Overlay
```
Default:    Chord name above waveform, semi-transparent
Hover:      Solid background, chord diagram popup
Selected:   Blue border, chord details in sidebar
```

#### MIDI Roll
```
Piano Roll: White/black keys, colored note blocks
Drum Roll:  Drum icons, velocity bars
Guitar Tab: 6 strings, fret numbers, timing marks
```

---

## 🔒 Безопасность и конфиденциальность

### Data Privacy

1. **User Recordings**
   - Хранить в приватном bucket (audio-takes)
   - RLS policies: только owner видит свои записи
   - Auto-delete через 90 дней (если не в проекте)
   - GDPR compliance: право на удаление

2. **Audio Processing**
   - Все API calls через edge functions (proxy)
   - Не передавать user_id напрямую в Klangio/Replicate
   - Логировать только metadata, не содержимое
   - Encrypt audio URLs в транзите

3. **Transcription Data**
   - MIDI/Chords data принадлежит пользователю
   - Опция "Keep Private" (не делиться)
   - Export без watermarks для premium users

### Rate Limiting

```typescript
// Recording rate limits
const RATE_LIMITS = {
  free: {
    recordings_per_day: 10,
    max_duration_seconds: 300,      // 5 минут
    transcriptions_per_day: 5,
  },
  premium: {
    recordings_per_day: 100,
    max_duration_seconds: 600,      // 10 минут
    transcriptions_per_day: 50,
  },
};
```

### Error Handling

1. **Recording Errors**
   - Microphone permission denied → fallback to cloud upload
   - Storage quota exceeded → compress audio, notify user
   - Network error during upload → retry with exponential backoff

2. **Transcription Errors**
   - API timeout → retry once, then show error
   - Invalid audio format → convert to supported format
   - Rate limit exceeded → queue for later processing

3. **Generation Errors**
   - Suno API error → show detailed error message
   - Missing stem URL → guide user to separate stems first
   - Quota exceeded → prompt to upgrade to premium

---

## 📝 Заключение

Этот план интеграции предоставляет полное видение объединённой студии записи с функциями:

✅ **Unified Recording System** - запись вокала, инструментов, гитары  
✅ **Multi-Take Recording** - запись нескольких дублей с AI оценкой  
✅ **Transcription & Chords** - транскрипция в MIDI, определение аккордов  
✅ **Chord Visualization** - визуализация аккордов с аппликатурами  
✅ **Add Vocal/Instrumental** - добавление вокала или инструментала  
✅ **Extension & Remix** - продление и ремикс треков  
✅ **Multi-Format Export** - экспорт в MIDI, GP5, PDF, MusicXML, ChordPro  

### Следующие шаги

1. **Немедленные действия** (Week 1):
   - Исправить VocalReplacementDialog и ArrangementReplacementDialog
   - Проанализировать результаты Klangio диагностики (PR #149)
   - Создать базовую структуру UnifiedRecordingStudio

2. **Короткосрочные цели** (Week 2-4):
   - Реализовать recording system с multi-take support
   - Интегрировать monitoring tools (метроном, тюнер, level meter)

3. **Среднесрочные цели** (Week 5-8):
   - Реализовать transcription workflow с chord visualization
   - Добавить функции Add Vocal/Instrumental

4. **Долгосрочные цели** (Week 9-10):
   - Реализовать export system с presets
   - Финальная полировка и beta testing

### Ожидаемые результаты

- **Code Quality**: -40% дублирования, +80% test coverage
- **Performance**: <2s load, 60 FPS, <60s transcription
- **User Experience**: 4.5+ rating, 60% adoption, +15% retention
- **Business Impact**: +20% premium conversion, higher engagement

---

**Автор:** AI Planning Agent  
**Дата:** 2026-01-04  
**Версия:** 1.0  
**Статус:** Ready for Review
