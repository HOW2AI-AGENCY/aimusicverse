
# План улучшения функционала записи, загрузки и анализа аудио

## 1. Анализ текущего состояния

### Компоненты записи (выявлено 7+ дублирований)

| Компонент | Назначение | Особенности |
|-----------|------------|-------------|
| `AudioRecordDialog` | Запись вокала | Облачное хранение, auto-save, actions (instrumental/vocals/cover/extend) |
| `AudioReferenceRecorder` | Запись для LyricsStudio | Vocal/Guitar режимы, анализ |
| `RecordTrackDrawer` | Запись в студийный проект | Chord detection для гитары, VU-meter |
| `GuitarRecordDialog` | Guitar Studio | Klangio анализ, сохранение записей |
| `GuitarRecordingStudio` | Полноценная гитарная студия | Realtime chords, tuner, BPM |
| `AudioReferenceUpload` | Загрузка референса | Auto-analyze, кэширование |
| `UploadDialog` (cloud) | Загрузка в облако | Simple upload/record |

### Хуки (дублирование логики MediaRecorder)

| Хук | Назначение |
|-----|------------|
| `useAudioRecording` | Базовый (70 строк) - минимальный |
| `useMelodyAnalysis` | Запись + анализ мелодии |
| `useGuitarAnalysis` | Запись + Klangio анализ |
| `useRealtimeChordDetection` | Realtime chord detection |

### Edge Functions для анализа

| Функция | Назначение |
|---------|------------|
| `analyze-audio-flamingo` | AI анализ стиля, настроения |
| `analyze-reference-audio` | Анализ референса |
| `klangio-analyze` | Beat tracking, chord recognition, transcription |
| `transcribe-midi` | MIDI транскрипция |
| `transcribe-lyrics` | Распознавание текста |
| `speech-to-text` | Голос в текст |
| `recognize-music` | Shazam-style распознавание |

---

## 2. Выявленные проблемы

### P0 - Критические

1. **Дублирование кода записи** - 7 компонентов с почти идентичной логикой MediaRecorder
2. **Фрагментация анализа** - 5+ edge functions без унифицированного API
3. **Отсутствие единой точки входа** - пользователь не понимает, где записывать

### P1 - Важные

4. **Нет audio waveform во время записи** - только timer или VU-meter
5. **Нет визуализации результатов анализа в едином формате**
6. **Нет batch-режима для анализа нескольких файлов**
7. **Отсутствует прогресс загрузки с детализацией этапов**

### P2 - Улучшения

8. **Нет drag-and-drop для загрузки**
9. **Отсутствует автодетекция типа записи (вокал/гитара/инструмент)**
10. **Нет истории записей с поиском и фильтрацией**
11. **Отсутствует экспорт результатов анализа (JSON, CSV)**

---

## 3. План решения

### Фаза 1: Унифицированный Recording Hook

**Создать `useUnifiedRecording`** - единый хук для всей логики записи:

```
src/hooks/audio/useUnifiedRecording.ts
```

Возможности:
- Поддержка режимов: vocal, guitar, instrument
- Audio level monitoring (VU-meter)
- Recording duration tracking
- Auto-detect optimal audio settings по режиму
- Pause/Resume recording
- Callback hooks: onStart, onStop, onData
- Waveform data accumulation для визуализации

### Фаза 2: Единый Recording Component

**Создать `UnifiedRecorder`** - переиспользуемый компонент:

```
src/components/recording/
├── UnifiedRecorder.tsx       # Главный компонент
├── RecordingVisualizer.tsx   # VU-meter + waveform
├── RecordingControls.tsx     # Start/Stop/Pause
├── RecordingTypeSelector.tsx # Vocal/Guitar/Instrument
├── RecordingPreview.tsx      # Playback preview
└── index.ts
```

Особенности:
- Адаптивный UI (dialog/drawer/inline)
- Real-time waveform visualization
- Audio level bars (как в RecordTrackDrawer)
- Chord detection indicator для гитары
- Touch-friendly controls (44px+)

### Фаза 3: Унифицированный Analysis Service

**Создать `AudioAnalysisService`**:

```
src/services/audio-analysis/
├── AudioAnalysisService.ts   # Unified API
├── types.ts                  # Common types
├── analyzers/
│   ├── styleAnalyzer.ts      # Flamingo
│   ├── beatAnalyzer.ts       # Klangio beats
│   ├── chordAnalyzer.ts      # Klangio chords
│   ├── transcriptionAnalyzer.ts # MIDI
│   └── lyricsAnalyzer.ts     # Speech-to-text
└── index.ts
```

Единый интерфейс:
```typescript
interface AnalysisRequest {
  audioUrl: string;
  types: ('style' | 'beats' | 'chords' | 'midi' | 'lyrics')[];
  options?: AnalysisOptions;
}

interface AnalysisResult {
  style?: StyleAnalysis;
  beats?: BeatAnalysis;
  chords?: ChordAnalysis;
  midi?: MidiData;
  lyrics?: LyricsData;
  processingTime: number;
}
```

### Фаза 4: Analysis Results UI

**Создать `AnalysisResultsPanel`**:

```
src/components/analysis/
├── AnalysisResultsPanel.tsx  # Main container
├── StyleCard.tsx             # Genre, mood, energy
├── BeatCard.tsx              # BPM, time signature
├── ChordProgressionCard.tsx  # Chord chart
├── LyricsCard.tsx            # Transcribed text
├── ExportButton.tsx          # JSON/CSV export
└── index.ts
```

### Фаза 5: Audio Hub Page

**Создать единую точку входа `/audio-hub`**:

```
Tabs:
├── Запись (UnifiedRecorder)
├── Загрузка (Drag & Drop)
├── Облако (reference_audio list)
├── Анализ (Batch analysis)
└── История (Recordings history)
```

---

## 4. Рефакторинг существующих компонентов

### Компоненты для замены на UnifiedRecorder:

| Компонент | Действие |
|-----------|----------|
| `AudioRecordDialog` | Использовать `UnifiedRecorder` + actions panel |
| `AudioReferenceRecorder` | Заменить на `UnifiedRecorder` |
| `RecordTrackDrawer` | Использовать `UnifiedRecorder` в drawer |
| `UploadDialog` | Объединить с Audio Hub |

### Компоненты для сохранения (специализированные):

| Компонент | Причина |
|-----------|---------|
| `GuitarRecordDialog` | Специфичная логика Klangio + saved recordings |
| `GuitarRecordingStudio` | Полноценная студия с tuner, realtime chords |

---

## 5. Техническая реализация

### Новые файлы

```
src/hooks/audio/
├── useUnifiedRecording.ts      # 150 lines

src/components/recording/
├── UnifiedRecorder.tsx         # 200 lines
├── RecordingVisualizer.tsx     # 80 lines
├── RecordingControls.tsx       # 60 lines
├── RecordingTypeSelector.tsx   # 50 lines
├── RecordingPreview.tsx        # 70 lines
└── index.ts                    # exports

src/services/audio-analysis/
├── AudioAnalysisService.ts     # 150 lines
├── types.ts                    # 80 lines
└── index.ts                    # exports

src/components/analysis/
├── AnalysisResultsPanel.tsx    # 120 lines
├── StyleCard.tsx               # 50 lines
├── BeatCard.tsx                # 40 lines
├── ChordProgressionCard.tsx    # 60 lines
├── LyricsCard.tsx              # 50 lines
└── index.ts                    # exports

src/pages/
├── AudioHub.tsx                # 200 lines (новая страница)
```

### Модифицируемые файлы

| Файл | Изменения |
|------|-----------|
| `AudioRecordDialog.tsx` | Использовать UnifiedRecorder |
| `AudioReferenceRecorder.tsx` | Делегировать к UnifiedRecorder |
| `RecordTrackDrawer.tsx` | Использовать UnifiedRecorder |
| `UploadDialog.tsx` | Добавить drag-and-drop |
| `MusicLab.tsx` | Ссылка на Audio Hub |
| Routing | Добавить /audio-hub |

---

## 6. UI/UX улучшения

### Recording Visualizer
- Real-time waveform (не только после записи)
- Animated VU-meter bars (12-20 штук)
- Color-coded audio levels (green → yellow → red)
- Recording time display (MM:SS)

### Drag-and-Drop Upload
- Visual drop zone с анимацией
- File type validation
- Progress indicator
- Multi-file support

### Analysis Progress
- Step-by-step progress (Upload → Analyze → Complete)
- Estimated time remaining
- Cancel button

### Results Export
- Copy to clipboard (tags)
- Export as JSON
- Export as CSV

---

## 7. Порядок выполнения

### Фаза 1 (Core - 2 задачи)
1. `useUnifiedRecording` hook
2. `UnifiedRecorder` component

### Фаза 2 (Analysis - 2 задачи)
3. `AudioAnalysisService`
4. `AnalysisResultsPanel`

### Фаза 3 (Integration - 3 задачи)
5. Рефакторинг `AudioRecordDialog`
6. Drag-and-drop в `UploadDialog`
7. Audio Hub page

### Фаза 4 (Polish - 2 задачи)
8. Batch analysis support
9. Export functionality

---

## 8. Метрики успеха

- **Сокращение кода**: -40% дублирования в recording логике
- **Улучшение UX**: +50% completion rate для записи
- **Скорость разработки**: Новые recording features за 50% времени
- **Пользовательское понимание**: Единая точка входа для всех аудио операций

---

## 9. Зависимости

- `UnifiedRecorder` требует `useUnifiedRecording`
- `AnalysisResultsPanel` требует `AudioAnalysisService`
- Audio Hub требует все вышеперечисленные компоненты
- Существующие компоненты продолжают работать до рефакторинга

---

## 10. Риски и митигация

| Риск | Митигация |
|------|-----------|
| Регрессии в существующих диалогах | Постепенная миграция, сохранение старых компонентов |
| Производительность waveform в реальном времени | Canvas rendering, requestAnimationFrame |
| Большой bundle size нового кода | Lazy loading для Audio Hub |
