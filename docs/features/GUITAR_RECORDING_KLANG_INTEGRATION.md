# Guitar Recording & Klang.io Integration

## Overview

MusicVerse AI integrates with [Klang.io](https://klangio.com) for advanced audio analysis and music transcription. This document describes the architecture and usage of the guitar recording feature.

## Features

- **Beat Detection**: Automatic tempo and beat tracking
- **Chord Recognition**: Real-time chord detection
- **MIDI Transcription**: Convert audio to MIDI notes
- **Multi-format Export**: MIDI, GP5 (Guitar Pro), PDF, MusicXML

## Architecture

```
┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Guitar Recording   │────▶│  Supabase Edge   │────▶│   Klang.io API  │
│  (Browser Audio)    │     │  Function        │     │                 │
└─────────────────────┘     └──────────────────┘     └─────────────────┘
                                    │
                                    ▼
                            ┌──────────────────┐
                            │  Supabase Storage │
                            │  (Audio + Files)  │
                            └──────────────────┘
```

## Components

### Frontend

- **GuitarStudio** (`src/pages/GuitarStudio.tsx`): Main page for guitar recording
- **GuitarRecordDialog** (`src/components/guitar/GuitarRecordDialog.tsx`): Recording dialog with waveform visualization
- **ScoreViewer** (`src/components/guitar/ScoreViewer.tsx`): PDF/notes viewer with zoom controls

### Hooks

- **useGuitarAnalysis** (`src/hooks/useGuitarAnalysis.ts`): Main hook for Klang.io integration
- **useMidiFileParser** (`src/hooks/useMidiFileParser.ts`): Parse MIDI files for piano roll display
- **useMidiSynth** (`src/hooks/useMidiSynth.ts`): MIDI playback with Web Audio

### Edge Functions

- **klangio-analyze** (`supabase/functions/klangio-analyze/index.ts`): Proxy to Klang.io API

## API Endpoints

### Klang.io Modes

| Mode | Description | Outputs |
|------|-------------|---------|
| `drums` | Drum transcription | MIDI, PDF |
| `guitar` | Guitar/bass transcription | MIDI, GP5, PDF, MusicXML |
| `piano` | Piano transcription | MIDI, PDF, MusicXML |
| `melody` | Single melody line | MIDI, PDF |
| `chords` | Chord detection only | Chord timeline |

### Request Format

```typescript
interface KlangioRequest {
  audioUrl: string;        // Public URL to audio file
  mode: 'drums' | 'guitar' | 'piano' | 'melody' | 'chords';
  outputs: string[];       // ['midi', 'pdf', 'gp5', 'musicxml']
  vocabulary?: string;     // For guitar: 'guitar' | 'bass' | 'ukulele'
}
```

### Response Format

```typescript
interface KlangioResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  files?: {
    midi_url?: string;
    midi_quant_url?: string;
    pdf_url?: string;
    gp5_url?: string;
    mxml_url?: string;
  };
  analysis?: {
    bpm: number;
    key: string;
    timeSignature: string;
    beats: number[];
    chords: Array<{ time: number; chord: string }>;
    notes: Array<{ pitch: number; time: number; duration: number; velocity: number }>;
  };
}
```

## Usage Examples

### Basic Transcription

```typescript
import { useGuitarAnalysis } from '@/hooks/useGuitarAnalysis';

function MyComponent() {
  const { startAnalysis, progress, result, isAnalyzing } = useGuitarAnalysis();
  
  const handleRecord = async (audioBlob: Blob) => {
    await startAnalysis(audioBlob, {
      mode: 'guitar',
      outputs: ['midi', 'pdf', 'gp5'],
    });
  };
  
  return (
    <div>
      {isAnalyzing && <p>Progress: {progress}%</p>}
      {result?.midi_url && <a href={result.midi_url}>Download MIDI</a>}
    </div>
  );
}
```

### With Recording

```typescript
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useGuitarAnalysis } from '@/hooks/useGuitarAnalysis';

function RecordAndTranscribe() {
  const { startRecording, stopRecording, audioBlob } = useAudioRecorder();
  const { startAnalysis, result } = useGuitarAnalysis();
  
  const handleStop = async () => {
    const blob = await stopRecording();
    await startAnalysis(blob, { mode: 'guitar' });
  };
  
  // ...
}
```

## Supported Formats

### Input
- MP3 (recommended)
- WAV
- M4A
- FLAC
- OGG

### Output
- **MIDI** (.mid): Standard MIDI file
- **MIDI Quantized** (.mid): Beat-aligned MIDI
- **PDF** (.pdf): Sheet music notation
- **Guitar Pro** (.gp5): Tablature for Guitar Pro
- **MusicXML** (.musicxml): Universal notation format

## Database Schema

```sql
CREATE TABLE guitar_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  track_id UUID REFERENCES tracks(id),
  audio_url TEXT NOT NULL,
  title TEXT,
  
  -- Analysis results
  bpm NUMERIC,
  key TEXT,
  time_signature TEXT,
  beats JSONB,
  chords JSONB,
  notes JSONB,
  
  -- Generated files
  midi_url TEXT,
  midi_quant_url TEXT,
  pdf_url TEXT,
  gp5_url TEXT,
  musicxml_url TEXT,
  
  -- Status
  analysis_status JSONB,
  style_analysis JSONB,
  generated_tags TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Error Handling

| Error Code | Description | Solution |
|------------|-------------|----------|
| `AUDIO_TOO_SHORT` | Recording < 5 seconds | Record longer audio |
| `AUDIO_TOO_LONG` | Recording > 10 minutes | Split into segments |
| `UNSUPPORTED_FORMAT` | File format not supported | Convert to MP3 |
| `ANALYSIS_FAILED` | Klang.io processing error | Retry or contact support |
| `QUOTA_EXCEEDED` | API quota reached | Wait or upgrade plan |

## Best Practices

1. **Audio Quality**: Record in a quiet environment for best results
2. **Tempo**: Play at a steady tempo for accurate beat detection
3. **Clean Playing**: Avoid excessive effects/distortion
4. **Duration**: 10-60 seconds works best for transcription
5. **Single Instrument**: Record one instrument at a time

## Future Enhancements

- [ ] Real-time transcription during recording
- [ ] Multi-track analysis
- [ ] AI-powered style suggestions
- [ ] Integration with DAW export
