# Klang.io Provider Integration

## Обзор

Полная интеграция провайдера **klang.io** в мобильный интерфейс приложения MusicVerse AI для профессиональной записи, анализа и транскрипции гитары.

### Ключевые возможности

✅ **Запись гитары** - Touch-friendly интерфейс с real-time мониторингом уровня  
✅ **Beat tracking** - Определение темпа, битов и сильных долей  
✅ **Chord recognition** - Распознавание аккордов с extended vocabulary  
✅ **Transcription** - Конвертация в MIDI, GP5, MusicXML, PDF  
✅ **Интеграция Stem Studio** - Автоматическое отображение анализа  
✅ **Mobile-first дизайн** - Оптимизация для сенсорных устройств  

---

## Архитектура

### Компонентная структура

```
Guitar Studio (Recording & Analysis)
├── GuitarRecordingPanel       # Touch-friendly панель записи
├── BeatGridVisualizer          # Canvas визуализация ритм-сетки
├── ChordProgressionTimeline    # Интерактивная шкала аккордов
├── MidiExportPanelMobile       # Экспорт всех форматов
└── LinkToTrackDialog           # Привязка анализа к треку

Stem Studio (Playback & Integration)
└── GuitarTrackIntegration     # Отображение анализа в студии

Hooks
├── useGuitarAnalysis          # Основная логика анализа
├── useAudioLevel              # Real-time аудио мониторинг
└── useTrackGuitarAnalysis     # Загрузка сохранённого анализа
```

### Data Flow

```
┌────────────────┐
│ Guitar Studio  │
│   Recording    │
└───────┬────────┘
        │
        ▼
┌────────────────┐      ┌──────────────────┐
│  klang.io API  │◄─────┤ Edge Function    │
│   Analysis     │      │ klangio-analyze  │
└───────┬────────┘      └──────────────────┘
        │
        ▼
┌────────────────────────────────────────┐
│ Results:                               │
│ • Beat tracking (BPM, downbeats)      │
│ • Chord recognition (chords, key)      │
│ • Transcription (MIDI, GP5, XML, PDF) │
└───────┬────────────────────────────────┘
        │
        ▼
┌────────────────┐
│  Save to       │
│  Storage       │ ──► {userId}/guitar-analysis/{trackId}.json
└───────┬────────┘
        │
        ▼
┌────────────────┐
│  Stem Studio   │
│  Integration   │
└────────────────┘
```

---

## Компоненты

### 1. GuitarRecordingPanel

**Путь**: `src/components/guitar/GuitarRecordingPanel.tsx`

Компактная мобильная панель записи с real-time мониторингом.

**Возможности:**
- Touch-friendly кнопки управления (44px+ targets)
- Real-time audio level meter (0-100%)
- Pulse анимация при записи
- Audio preview с встроенным плеером
- Запись времени с форматированием
- Советы для лучшего качества

**Props:**
```typescript
interface GuitarRecordingPanelProps {
  isRecording: boolean;
  recordingTime: number;
  recordedAudioUrl: string | null;
  audioLevel: number;         // 0-100
  onStartRecording: () => void;
  onStopRecording: () => void;
  onAnalyze: () => void;
  onClear: () => void;
  isAnalyzing?: boolean;
}
```

**Пример использования:**
```tsx
<GuitarRecordingPanel
  isRecording={isRecording}
  recordingTime={recordingTime}
  recordedAudioUrl={recordedAudioUrl}
  audioLevel={audioLevel}
  onStartRecording={handleStartRecording}
  onStopRecording={handleStopRecording}
  onAnalyze={handleAnalyze}
  onClear={handleClear}
  isAnalyzing={isAnalyzing}
/>
```

---

### 2. BeatGridVisualizer

**Путь**: `src/components/guitar/BeatGridVisualizer.tsx`

Canvas-based визуализация ритм-сетки с битами и сильными долями.

**Возможности:**
- Canvas рендеринг для производительности
- Различие сильных долей (красные) и обычных битов (синие)
- Интерактивный seek по клику
- Real-time playhead с анимацией
- Автоматический расчёт time signature
- Встроенный audio player

**Props:**
```typescript
interface BeatGridVisualizerProps {
  beats: BeatData[];
  downbeats: number[];
  bpm: number;
  audioUrl?: string;
  duration: number;
}
```

**Пример использования:**
```tsx
<BeatGridVisualizer
  beats={analysisResult.beats}
  downbeats={analysisResult.downbeats}
  bpm={analysisResult.bpm}
  audioUrl={analysisResult.audioUrl}
  duration={analysisResult.totalDuration}
/>
```

---

### 3. ChordProgressionTimeline

**Путь**: `src/components/guitar/ChordProgressionTimeline.tsx`

Интерактивная временная шкала с аккордами и навигацией.

**Возможности:**
- Горизонтальная timeline с цветовой кодировкой
- Крупное отображение текущего аккорда (4xl font)
- Навигация между аккордами (prev/next buttons)
- Touch-friendly interactions
- Chord palette с уникальными аккордами
- Синхронизация с audio playback

**Props:**
```typescript
interface ChordProgressionTimelineProps {
  chords: ChordData[];
  audioUrl?: string;
  duration: number;
  keySignature?: string;
}
```

**Пример использования:**
```tsx
<ChordProgressionTimeline
  chords={analysisResult.chords}
  audioUrl={analysisResult.audioUrl}
  duration={analysisResult.totalDuration}
  keySignature={analysisResult.key}
/>
```

---

### 4. MidiExportPanelMobile

**Путь**: `src/components/guitar/MidiExportPanelMobile.tsx`

Мобильный интерфейс экспорта всех klang.io форматов.

**Возможности:**
- Поддержка всех форматов: MIDI, MIDI Quantized, GP5, MusicXML, PDF
- Expandable карточки с детальной информацией
- Web Share API для нативного шаринга
- Batch download всех форматов
- Визуальные индикаторы (loading, completed)
- Haptic feedback (vibration)

**Форматы:**
| Формат | Расширение | Use Case |
|--------|-----------|----------|
| MIDI Standard | .mid | DAW, синтезаторы, аранжировка |
| MIDI Quantized | .mid | Точная синхронизация, EDM |
| Guitar Pro 5 | .gp5 | Обучение, табы, Guitar Pro |
| MusicXML | .xml | Finale, Sibelius, MuseScore |
| PDF Ноты | .pdf | Печать, просмотр, архив |

**Props:**
```typescript
interface MidiExportPanelMobileProps {
  transcriptionFiles: TranscriptionFiles;
  midiUrl?: string;
}
```

**Пример использования:**
```tsx
<MidiExportPanelMobile
  transcriptionFiles={analysisResult.transcriptionFiles}
  midiUrl={analysisResult.midiUrl}
/>
```

---

### 5. LinkToTrackDialog

**Путь**: `src/components/guitar/LinkToTrackDialog.tsx`

Dialog для привязки анализа гитары к существующему треку.

**Возможности:**
- Поиск треков по названию/стилю
- Preview треков с обложками
- Badge индикаторы (Stems, длительность)
- Summary анализа (BPM, Key, Chords)
- Toast notifications с action buttons
- Auto-navigation после сохранения

**Props:**
```typescript
interface LinkToTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisResult: GuitarAnalysisResult | null;
}
```

**Пример использования:**
```tsx
<LinkToTrackDialog
  open={linkDialogOpen}
  onOpenChange={setLinkDialogOpen}
  analysisResult={analysisResult}
/>
```

---

### 6. GuitarTrackIntegration

**Путь**: `src/components/stem-studio/GuitarTrackIntegration.tsx`

Компонент интеграции гитарного анализа в Stem Studio.

**Возможности:**
- Collapsible панель для экономии места
- Tabs: Chords, Beats, Export
- Completion status badges
- Analysis summary (chords, beats, notes count)
- AI-generated tags display
- Sync с playback state

**Props:**
```typescript
interface GuitarTrackIntegrationProps {
  analysisResult: GuitarAnalysisResult | null;
  trackId: string;
  currentTime?: number;
  isPlaying?: boolean;
}
```

**Пример использования:**
```tsx
{guitarAnalysis && (
  <GuitarTrackIntegration
    analysisResult={guitarAnalysis}
    trackId={trackId}
    currentTime={currentTime}
    isPlaying={isPlaying}
  />
)}
```

---

## Hooks

### useAudioLevel

**Путь**: `src/hooks/useAudioLevel.ts`

Hook для real-time мониторинга аудио уровня.

**Особенности:**
- Web Audio API (AudioContext, AnalyserNode)
- RAF loop для плавных обновлений
- Normalized output (0-100)
- Автоматический cleanup
- Graceful error handling

**Использование:**
```typescript
const audioLevel = useAudioLevel(mediaStream, isRecording);
```

**Внутренняя логика:**
```typescript
// Setup
AudioContext → createMediaStreamSource → connect(AnalyserNode)
AnalyserNode.fftSize = 256
AnalyserNode.smoothingTimeConstant = 0.8

// RAF Loop
getByteFrequencyData(dataArray)
average = sum(dataArray) / length
normalized = min(100, (average / 255) * 150)
setAudioLevel(normalized)

// Cleanup
cancelAnimationFrame(rafId)
disconnect sources
close AudioContext
```

---

### useTrackGuitarAnalysis

**Путь**: `src/hooks/useTrackGuitarAnalysis.ts`

Hook для загрузки сохранённого анализа гитары для трека.

**Особенности:**
- TanStack Query integration
- Storage path: `{userId}/guitar-analysis/{trackId}.json`
- Caching: staleTime 5 мин, gcTime 30 мин
- Auto-enabled при trackId

**Использование:**
```typescript
const { data: guitarAnalysis } = useTrackGuitarAnalysis(trackId);
```

**Helper функция:**
```typescript
// Сохранение анализа
await saveGuitarAnalysisForTrack(trackId, analysis);
```

**Storage структура:**
```json
{
  "trackId": "uuid",
  "analysis": {
    "beats": [...],
    "downbeats": [...],
    "bpm": 120,
    "timeSignature": "4/4",
    "chords": [...],
    "key": "C major",
    "notes": [...],
    "transcriptionFiles": {
      "midiUrl": "https://...",
      "gp5Url": "https://...",
      "musicXmlUrl": "https://...",
      "pdfUrl": "https://..."
    },
    "generatedTags": ["guitar", "mid-tempo", ...],
    "styleDescription": "Key: C major, 120 BPM, ...",
    "totalDuration": 180,
    "audioUrl": "https://...",
    "analysisComplete": {
      "beats": true,
      "chords": true,
      "transcription": true
    }
  },
  "createdAt": "2025-12-10T...",
  "updatedAt": "2025-12-10T..."
}
```

---

## klang.io API Integration

### Edge Function

**Путь**: `supabase/functions/klangio-analyze/index.ts`

Serverless функция для взаимодействия с klang.io API.

**Endpoints:**
- `/transcription` - Guitar/piano transcription
- `/chord-recognition-extended` - Chord detection
- `/beat-tracking` - Tempo and beat detection

**Request:**
```typescript
{
  audio_url: string;
  mode: 'transcription' | 'chord-recognition-extended' | 'beat-tracking';
  model?: 'guitar' | 'piano' | ...;
  outputs?: ['midi', 'gp5', 'mxml', 'pdf', 'json'];
  vocabulary?: 'major-minor' | 'full';
  user_id?: string;
}
```

**Response Examples:**

```typescript
// Beat Tracking
{
  job_id: "uuid",
  mode: "beat-tracking",
  status: "completed",
  beats: [0.5, 1.0, 1.5, 2.0, ...],
  downbeats: [0.5, 2.5, 4.5, ...],
  bpm: 120
}

// Chord Recognition
{
  job_id: "uuid",
  mode: "chord-recognition-extended",
  status: "completed",
  chords: [
    { chord: "C", startTime: 0, endTime: 2 },
    { chord: "Am", startTime: 2, endTime: 4 },
    ...
  ],
  key: "C major",
  strumming: []
}

// Transcription
{
  job_id: "uuid",
  mode: "transcription",
  status: "completed",
  files: {
    midi: "https://storage/.../midi",
    midi_quant: "https://storage/.../midi_quant",
    gp5: "https://storage/.../gp5",
    mxml: "https://storage/.../xml",
    pdf: "https://storage/.../pdf"
  },
  notes: [
    { pitch: 60, startTime: 0, endTime: 0.5, velocity: 80, noteName: "C4" },
    ...
  ]
}
```

**Parallel Processing:**
```typescript
// Все три анализа выполняются параллельно
const [beatResult, chordResult, transcriptionResult] = await Promise.all([
  beatTracking(),
  chordRecognition(),
  transcription()
]);
```

---

## Workflow

### Guitar Studio Recording Flow

```
1. User opens Guitar Studio (/guitar-studio)
   ↓
2. Setup: Microphone permission, audio context
   ↓
3. Recording:
   - Start recording (MediaRecorder API)
   - Real-time level monitoring (useAudioLevel)
   - Visual feedback (pulse, timer, meter)
   ↓
4. Stop recording:
   - Save to Blob/File
   - Create URL for preview
   - Enable "Analyze" button
   ↓
5. Analyze:
   - Upload audio to storage
   - Call klangio-analyze edge function
   - Parallel processing: beats + chords + transcription
   - Poll job status until completion
   - Display progress indicator
   ↓
6. Results:
   - Show Analysis Report
   - Display interactive components:
     * ChordProgressionTimeline
     * BeatGridVisualizer
     * MidiExportPanelMobile
   - Enable "Link to Track" button
   ↓
7. Link to Track (optional):
   - Open LinkToTrackDialog
   - Search/select track
   - Save analysis to storage
   - Navigate to Stem Studio
```

### Stem Studio Integration Flow

```
1. User opens Stem Studio with track (/stem-studio/:trackId)
   ↓
2. Load track data + Check for guitar analysis
   - useTrackGuitarAnalysis(trackId)
   - Fetch from storage: {userId}/guitar-analysis/{trackId}.json
   ↓
3. If analysis exists:
   - Render GuitarTrackIntegration component
   - Display collapsible panel
   - Sync with track playback (currentTime, isPlaying)
   ↓
4. User interactions:
   - Toggle panel (expand/collapse)
   - Switch tabs (Chords, Beats, Export)
   - Navigate timeline
   - Export files
   - View AI tags
```

---

## API Reference

### klang.io Endpoints

**Base URL**: `https://api.klang.io`

#### 1. Beat Tracking

```http
POST /beat-tracking
Content-Type: multipart/form-data
Headers: kl-api-key: <API_KEY>

Body:
  file: <audio file>

Response:
{
  "beats": [0.5, 1.0, 1.5, ...],
  "downbeats": [0.5, 2.5, 4.5, ...],
  "bpm": 120,
  "tempo": 120
}
```

#### 2. Chord Recognition (Extended)

```http
POST /chord-recognition-extended?vocabulary=full
Content-Type: multipart/form-data
Headers: kl-api-key: <API_KEY>

Body:
  file: <audio file>

Response:
{
  "chords": [
    [0.0, 2.0, "C"],
    [2.0, 4.0, "Am"],
    ...
  ],
  "key": "C major"
}
```

#### 3. Transcription

```http
POST /transcription?model=guitar
Content-Type: multipart/form-data
Headers: kl-api-key: <API_KEY>

Body:
  file: <audio file>
  outputs: midi
  outputs: midi_quant
  outputs: gp5
  outputs: mxml
  outputs: pdf
  outputs: json

Response (after job completion):
{
  "midi": <binary>,
  "midi_quant": <binary>,
  "gp5": <binary>,
  "xml": <binary>,
  "pdf": <binary>,
  "json": {
    "notes": [...],
    "events": [...]
  }
}
```

#### Job Status Polling

```http
GET /job/{job_id}/status
Headers: kl-api-key: <API_KEY>

Response:
{
  "status": "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED",
  "error": "<error message if failed>"
}
```

---

## Performance Optimization

### Canvas Rendering

- Device pixel ratio для retina displays
- Conditional rendering на основе viewport size
- RAF loop cleanup для предотвращения leaks

### Audio Processing

- MediaRecorder API с optimal settings (44.1kHz, mono)
- Web Audio API с efficient buffer sizes
- RAF-based level monitoring с throttling

### Storage & Caching

- TanStack Query с staleTime/gcTime
- JSON format для flexibility и compression
- Lazy loading анализа (enabled by trackId)

### Mobile Optimization

- Touch targets 44px+
- Framer Motion для smooth animations
- Responsive layouts (mobile/desktop)
- Haptic feedback (vibration API)

---

## Troubleshooting

### Common Issues

**1. Microphone access denied**
```typescript
// Check permissions
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
// Prompt user to allow in browser settings
```

**2. Analysis timeout**
```typescript
// Increase polling timeout in edge function
const maxAttempts = mode === 'transcription' ? 90 : 60;
```

**3. Storage upload error**
```typescript
// Check user authentication
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('Not authenticated');
```

**4. klang.io API error 401**
```
// Verify KLANGIO_API_KEY in Supabase environment variables
// Edge Functions → Settings → Secrets
```

**5. Audio level not updating**
```typescript
// Ensure MediaStream is active and useAudioLevel is enabled
const audioLevel = useAudioLevel(mediaStream, isRecording);
```

**6. Only MIDI and MusicXML generated (PDF, GP5, MIDI Quantized missing)** ⚠️ **KNOWN ISSUE**
```
// Issue: Klangio API generates only 2 out of 5 requested formats
// Status: Under investigation with enhanced diagnostic logging
// PR: #149 - https://github.com/HOW2AI-AGENCY/aimusicverse/pull/149
// Documentation: See KLANG_IO_DIAGNOSTIC_LOGGING_2025-12-11.md

// Temporary workaround: Use available formats (MIDI + MusicXML)
// Investigation: Diagnostic logs added to determine root cause
```

See [Diagnostic Logging Documentation](./KLANG_IO_DIAGNOSTIC_LOGGING_2025-12-11.md) for details.

---

## Recent Updates

### 2025-12-11: Diagnostic Logging Enhancement
**PR**: [#149](https://github.com/HOW2AI-AGENCY/aimusicverse/pull/149)
**Status**: ✅ Merged to Main

Added comprehensive diagnostic logging to investigate output format generation issues:
- ✅ Enhanced logging at 5 critical points in Edge Function
- ✅ Query parameters validation and construction logging
- ✅ Complete endpoint URL logging before API submission
- ✅ Job creation and completion status logging with generation flags
- ✅ Integrated with database logging (klangio_analysis_logs table)

**Purpose**: Determine why only MIDI and MusicXML are generated, but not PDF, GP5, or MIDI Quantized.

**Testing Required**:
1. Deploy Edge Function: `npx supabase functions deploy klangio-analyze`
2. Record high-quality guitar audio (15-20 seconds)
3. Run analysis and collect logs from Supabase Dashboard
4. Analyze diagnostic output to identify root cause

**Documentation**: See [KLANG_IO_DIAGNOSTIC_LOGGING_2025-12-11.md](./KLANG_IO_DIAGNOSTIC_LOGGING_2025-12-11.md)

### 2025-12-11: MIME Type Support
**Status**: ✅ Completed

Fixed storage upload issues for music notation formats:
- Added support for audio/midi, application/xml, application/pdf
- Fixed MusicXML MIME type (changed from vnd.recordare to application/xml)
- Enhanced file type validation and error handling

**Documentation**: See [KLANG_IO_MIME_TYPE_FIX_2025-12-11.md](./KLANG_IO_MIME_TYPE_FIX_2025-12-11.md)

### 2025-12-10: Transcription UI Improvements
**Status**: ✅ Completed

Enhanced user interface with new components:
- TranscriptionPreview with Sheet Music, Tablature, and MIDI tabs
- AnalysisProgressStages with 4-stage progress indicator
- TranscriptionToGenerationBridge for AI music generation integration

**Documentation**: See [KLANG_IO_TRANSCRIPTION_IMPROVEMENTS_2025-12-10.md](./KLANG_IO_TRANSCRIPTION_IMPROVEMENTS_2025-12-10.md)

---

## Future Enhancements

### Planned Features

- [ ] Multi-instrument support (bass, drums, vocals)
- [ ] Real-time pitch detection during recording
- [ ] AI-powered chord suggestions
- [ ] Automatic key detection improvements
- [ ] Strumming pattern analysis
- [ ] Export to additional formats (Musescore, Finale)
- [ ] Collaborative editing в Stem Studio
- [ ] MIDI editing interface
- [ ] Guitar effects processing

### Technical Debt

- [ ] Add unit tests для hooks
- [ ] Add E2E tests для recording flow
- [ ] Optimize canvas rendering для large tracks
- [ ] Add offline mode support
- [ ] Implement progressive loading для long audio
- [ ] Add error recovery mechanisms
- [ ] Improve accessibility (ARIA labels, keyboard nav)

---

## Contributing

При добавлении новых функций соблюдайте:

1. **Mobile-first подход** - все UI сначала для mobile
2. **Touch targets 44px+** - доступность на сенсорных устройствах
3. **Graceful degradation** - fallbacks при отсутствии данных
4. **Performance** - мониторинг RAF loops и cleanup
5. **Error handling** - toast notifications и logging
6. **TypeScript** - строгая типизация для props и hooks
7. **Documentation** - JSDoc комментарии для всех публичных API

---

## References

### Documentation
- [Diagnostic Logging Enhancement](./KLANG_IO_DIAGNOSTIC_LOGGING_2025-12-11.md) - **NEW**
- [MIME Type Fixes](./KLANG_IO_MIME_TYPE_FIX_2025-12-11.md)
- [Transcription UI Improvements](./KLANG_IO_TRANSCRIPTION_IMPROVEMENTS_2025-12-10.md)
- [Implementation Summary](./KLANG_IO_IMPLEMENTATION_SUMMARY.md)
- [Полное руководство по интеграции Klang.io API](docs/KLANG_IO_API_GUIDE_RU.md)

### External APIs
- [klang.io API Documentation](https://api.klang.io/docs)
- [klang.io OpenAPI Specification](https://api.klang.io/openapi.json)

### Web Technologies
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Framer Motion](https://www.framer.com/motion/)
- [TanStack Query](https://tanstack.com/query/latest)

### Pull Requests
- [PR #149 - Diagnostic Logging Enhancement](https://github.com/HOW2AI-AGENCY/aimusicverse/pull/149) - ✅ Merged

---

**Last Updated**: 2025-12-11
**Version**: 1.1.0
**Author**: GitHub Copilot Agent & Claude AI Assistant
