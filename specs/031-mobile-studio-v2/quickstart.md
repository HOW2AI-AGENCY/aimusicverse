# Quickstart Guide: Mobile Studio V2 - Legacy Feature Migration

**Feature**: 031-mobile-studio-v2
**Date**: 2026-01-06
**Audience**: Developers implementing the migrated studio features

## Prerequisites

- Node.js 20+ installed
- Project cloned and dependencies installed (`npm install`)
- Supabase CLI configured
- Telegram Mini App environment variables set
- Code editor with TypeScript support

## Development Setup

### 1. Feature Branch

You're already on the feature branch:
```bash
git branch  # Should show: * 031-mobile-studio-v2
```

### 2. Database Setup

Run database migrations to create new tables:

```bash
# Apply migrations
supabase db push

# Verify tables created
supabase db remote tables list
```

Expected new tables:
- `lyric_versions`
- `section_notes`
- `recording_sessions`
- `presets`
- `stem_batches`
- `midi_files`
- `chord_detection_results`

### 3. Environment Variables

Ensure these are set in `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_TELEGRAM_BOT_USERNAME=your_bot_username
```

## Component Structure

### Files to Create

```
src/components/studio/unified/
├── LyricsPanel.tsx              # Lyrics editing with AI assist
├── MusicLabPanel.tsx            # Recording workspace
├── RecordingControls.tsx        # Vocal/guitar recording UI
├── ChordDetectionPanel.tsx      # Chord analysis results
├── ProfessionalDashboard.tsx    # Stats and preset management
├── PresetManager.tsx            # Preset CRUD interface
├── BatchStemProcessor.tsx       # Batch operations UI
├── ReplacementHistoryDrawer.tsx # Section replacement history
├── MidiViewerPanel.tsx          # MIDI visualization
├── KeyboardShortcutsDialog.tsx  # Shortcuts reference
└── StudioFAB.tsx                # Floating action button
```

### Files to Modify

```
src/components/studio/unified/
├── StudioShell.tsx              # Add new tabs to navigation
└── useUnifiedStudioStore.ts     # Extend state for new features

src/pages/studio-v2/
└── UnifiedStudioPage.tsx        # Integrate new panels
```

## Implementation Priority

### Phase 1: Lyrics Studio (P1) - Week 1

**Step 1**: Create LyricsPanel component
```typescript
// src/components/studio/unified/LyricsPanel.tsx
import { useLyricVersions } from '@/hooks/useLyricVersions';
import { useSectionNotes } from '@/hooks/useSectionNotes';

export function LyricsPanel({ trackId }: { trackId: string }) {
  const { data: versions, createVersion, restoreVersion } = useLyricVersions(trackId);
  const { data: notes, createNote } = useSectionNotes(trackId);

  return (
    <div className="lyrics-panel">
      {/* Lyrics editor with AI assistance */}
      {/* Version history sidebar */}
      {/* Section notes */}
    </div>
  );
}
```

**Step 2**: Add hooks for lyrics operations
```typescript
// src/hooks/useLyricVersions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useLyricVersions(trackId: string) {
  const queryClient = useQueryClient();

  const { data: versions } = useQuery({
    queryKey: ['lyrics', trackId, 'versions'],
    queryFn: () => fetch(`/tracks/${trackId}/lyrics/versions`).then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (content: string) =>
      fetch(`/tracks/${trackId}/lyrics/versions`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lyrics', trackId] });
    },
  });

  return { versions, createVersion: createMutation.mutate };
}
```

**Step 3**: Integrate into StudioShell
```typescript
// Add to tab navigation
const tabs = [
  { id: 'player', label: 'Player' },
  { id: 'sections', label: 'Sections' },
  { id: 'lyrics', label: 'Lyrics' },  // NEW
  // ... other tabs
];
```

**Test**:
1. Open a track in unified studio
2. Navigate to Lyrics tab
3. Edit lyrics and save
4. View version history
5. Restore previous version

---

### Phase 2: MusicLab Recording (P2) - Week 2

**Step 1**: Create RecordingControls component
```typescript
// src/components/studio/unified/RecordingControls.tsx
import { useEffect, useState } from 'react';
import { WebApp } from '@twa-dev/sdk';

export function RecordingControls({ type }: { type: 'vocal' | 'guitar' }) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    setMediaRecorder(recorder);
    recorder.start();
    setIsRecording(true);
    WebApp.HapticFeedback.impactOccurred('medium');
  };

  return (
    <button onClick={startRecording} className="record-button">
      {isRecording ? '● Recording...' : '○ Start Recording'}
    </button>
  );
}
```

**Step 2**: Create chord detection panel
```typescript
// src/components/studio/unified/ChordDetectionPanel.tsx
export function ChordDetectionPanel({ recordingId }: { recordingId: string }) {
  const { data: chords } = useQuery({
    queryKey: ['chords', recordingId],
    queryFn: () => fetch(`/recordings/${recordingId}/chords`).then(r => r.json()),
  });

  return (
    <div className="chord-detection">
      {chords?.chords.map(chord => (
        <div key={chord.time}>
          {chord.time}s: {chord.chord} ({Math.round(chord.confidence * 100)}%)
        </div>
      ))}
    </div>
  );
}
```

**Test**:
1. Grant microphone permission
2. Record vocal/guitar
3. View real-time waveform
4. Trigger chord detection
5. View chord results

---

### Phase 3: Professional Dashboard (P3) - Week 3

**Step 1**: Create dashboard component
```typescript
// src/components/studio/unified/ProfessionalDashboard.tsx
export function ProfessionalDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => fetch('/dashboard/stats').then(r => r.json()),
  });

  return (
    <div className="dashboard">
      <h2>Studio Statistics</h2>
      <div className="stats-grid">
        <StatCard label="Tracks" value={stats?.tracks.total} />
        <StatCard label="Storage" value={`${stats?.storage.percentage}%`} />
      </div>
    </div>
  );
}
```

**Step 2**: Create preset manager
```typescript
// src/components/studio/unified/PresetManager.tsx
export function PresetManager({ trackId }: { trackId: string }) {
  const { data: presets } = usePresets();
  const applyPreset = useApplyPreset(trackId);

  return (
    <div className="preset-manager">
      {presets?.map(preset => (
        <button key={preset.id} onClick={() => applyPreset.mutate(preset.id)}>
          {preset.name}
        </button>
      ))}
    </div>
  );
}
```

**Test**:
1. Open professional dashboard
2. View statistics
3. Create a preset
4. Apply preset to track
5. Edit/delete preset

---

### Phase 4: Batch Processing (P2) - Week 4

**Step 1**: Create batch processor component
```typescript
// src/components/studio/unified/BatchStemProcessor.tsx
export function BatchStemProcessor({ trackId }: { trackId: string }) {
  const [selectedStems, setSelectedStems] = useState<string[]>([]);
  const batchTranscribe = useBatchTranscribe(trackId);

  return (
    <div className="batch-processor">
      <StemSelector
        stems={stems}
        selected={selectedStems}
        onChange={setSelectedStems}
      />
      <button
        onClick={() => batchTranscribe.mutate({ stemIds: selectedStems })}
        disabled={selectedStems.length === 0}
      >
        Batch Transcribe ({selectedStems.length})
      </button>
    </div>
  );
}
```

**Step 2**: Track batch progress
```typescript
// Use Supabase Realtime for progress updates
useEffect(() => {
  const channel = supabase
    .channel('batch-progress')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'stem_batches',
      filter: `id=eq.${batchId}`
    }, (payload) => {
      setProgress(payload.new.progress);
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [batchId]);
```

**Test**:
1. Select multiple stems
2. Initiate batch transcription
3. Monitor progress in real-time
4. View results
5. Handle individual failures

---

## Common Patterns

### Mobile-First Component Template

```typescript
import { cn } from '@/lib/utils';
import { MobileBottomSheet } from '@/components/mobile/MobileBottomSheet';

export function YourMobilePanel({ trackId, open, onClose }: Props) {
  return (
    <MobileBottomSheet open={open} onOpenChange={onClose}>
      <div className="flex flex-col h-full px-4 safe-bottom">
        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <h2 className="text-lg font-semibold">Panel Title</h2>
          <button onClick={onClose} className="p-2">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Panel content */}
        </div>

        {/* Actions */}
        <div className="py-4 safe-bottom">
          <button className="w-full py-3 bg-primary text-primary-foreground rounded-lg">
            Action Button
          </button>
        </div>
      </div>
    </MobileBottomSheet>
  );
}
```

### TanStack Query Pattern

```typescript
// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['entity', id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('table')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
  staleTime: 30_000, // 30 seconds
});

// Mutate data
const mutation = useMutation({
  mutationFn: async (payload) => {
    const { data, error } = await supabase
      .from('table')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['entity'] });
  },
});
```

### Telegram SDK Integration

```typescript
import { WebApp } from '@twa-dev/sdk';

// Haptic feedback
WebApp.HapticFeedback.impactOccurred('light');  // button tap
WebApp.HapticFeedback.notificationOccurred('success');  // success
WebApp.HapticFeedback.notificationOccurred('error');  // error

// Main button
WebApp.MainButton.setText('Save');
WebApp.MainButton.onClick(() => handleSave());
WebApp.MainButton.show();

// Back button
WebApp.BackButton.onClick(() => navigate(-1));
WebApp.BackButton.show();
```

### Touch Target Compliance

```typescript
// All interactive elements must be 44px minimum
<button className="min-h-[44px] min-w-[44px] flex items-center justify-center">
  <Icon className="w-6 h-6" />
</button>

// Spacing between touch targets
<div className="grid grid-cols-2 gap-4">
  <button className="min-h-[44px]">Action 1</button>
  <button className="min-h-[44px]">Action 2</button>
</div>
```

## Testing Checklist

### Unit Tests (Jest)
- [ ] Lyrics version CRUD operations
- [ ] Preset apply/remove logic
- [ ] Shortcut parsing and validation
- [ ] Chord detection result parsing

### Integration Tests
- [ ] Recording → upload → chord detection flow
- [ ] Batch stem processing → progress tracking
- [ ] MIDI upload → parse → visualize flow

### E2E Tests (Playwright)
- [ ] Complete lyrics editing workflow
- [ ] Recording from microphone
- [ ] Preset creation and application
- [ ] Batch operation initiation and monitoring

### Mobile Tests
- [ ] Touch targets (44px minimum)
- [ ] Safe area handling (notch/island)
- [ ] Keyboard avoidance (forms)
- [ ] Haptic feedback on actions
- [ ] Portrait orientation enforcement

## Performance Checks

Before committing, always run:

```bash
# Check bundle size
npm run size

# Run linter
npm run lint

# Run type check
npm run type-check

# Run tests
npm test

# Build production
npm run build
```

## Troubleshooting

### Issue: "Microphone permission denied"

**Solution**: Ensure you're testing in HTTPS or localhost. Telegram Mini Apps require secure context for microphone access.

### Issue: "Bundle size exceeded"

**Solution**:
1. Check which components are imported: `npm run size:why`
2. Move large components to `src/components/lazy/`
3. Ensure lazy loading is working: `React.lazy(() => import(...))`

### Issue: "Touch targets too small"

**Solution**: Apply `min-h-[44px] min-w-[44px]` to all interactive elements. Use browser DevTools to measure.

### Issue: "Keyboard not dismissing on mobile"

**Solution**: Use visualViewport API for keyboard tracking:
```typescript
useEffect(() => {
  const handler = () => {
    setKeyboardHeight(window.visualViewport.height - window.innerHeight);
  };
  window.visualViewport?.addEventListener('resize', handler);
  return () => window.visualViewport?.removeEventListener('resize', handler);
}, []);
```

## Resources

- **Constitution**: [.specify/memory/constitution.md](../../../.specify/memory/constitution.md)
- **Data Model**: [data-model.md](./data-model.md)
- **API Contracts**: [contracts/api-contracts.md](./contracts/api-contracts.md)
- **Research**: [research.md](./research.md)
- **Project Docs**: [../../../CLAUDE.md](../../../CLAUDE.md)

## Support

For questions or issues:
1. Check the constitution for architectural principles
2. Review data model for entity relationships
3. Reference API contracts for endpoint details
4. Consult research.md for technical decisions
5. Ask in team chat or create GitHub issue

Happy coding! 🎵
