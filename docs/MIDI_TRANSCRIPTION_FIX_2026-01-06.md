# MIDI Transcription Integration - Implementation Report

**Date:** 2026-01-06  
**Issue:** Исправить ошибку MIDI транскрипции  
**Status:** ✅ Implemented  

## Problem

The MIDI transcription feature was separated from the stem editor interface. The old studio had a unified interface where MIDI visualization and notes were integrated directly with stem components, not in separate tabs or modals.

## Solution

### 1. Created InlineStemNotes Component
**File:** `src/components/stem-studio/InlineStemNotes.tsx`

A new component that:
- Automatically loads existing transcriptions from `stem_transcriptions` table
- Shows a compact indicator when collapsed (notes count, BPM, key)
- Expands to show full `UnifiedNotesViewer` with piano roll
- Syncs playback time with audio
- Uses React.memo for performance

**Key Features:**
```typescript
- Auto-fetches transcription data via useStemTranscription hook
- Collapsed view: Mini indicator with metadata
- Expanded view: Full notes viewer with piano roll, notation, and list views
- Playback sync: currentTime prop updates in real-time
- Mobile-friendly: Responsive design with compact mode
```

### 2. Enhanced StemChannel Component
**File:** `src/components/stem-studio/StemChannel.tsx`

- Added `InlineStemNotes` between waveform and effects panel
- Passes required props: stem, trackTitle, currentTime, duration, isPlaying
- Maintains backward compatibility with existing features

### 3. Updated TranscriptionExportPanel
**File:** `src/components/stem-studio/TranscriptionExportPanel.tsx`

- Integrated `useSaveTranscription` hook
- Saves transcription data to `stem_transcriptions` table after completion
- Supports both engines:
  - **Replicate (Basic Pitch):** Saves MIDI URL and model info
  - **Klang.io:** Saves MIDI, PDF, GP5, MusicXML URLs plus metadata (BPM, key, time signature, notes count)

## Architecture

```
StemChannel
├── Waveform
├── InlineStemNotes (NEW)
│   ├── Collapsed: Mini indicator
│   ├── Expanded: UnifiedNotesViewer
│   │   ├── Piano Roll
│   │   ├── Staff Notation (if MusicXML available)
│   │   └── Notes List
│   └── Data: useStemTranscription(stemId)
└── Effects Panel
```

## Database Integration

```typescript
// stem_transcriptions table structure:
{
  stem_id: string
  track_id: string
  midi_url: string | null
  midi_quant_url: string | null
  mxml_url: string | null
  gp5_url: string | null
  pdf_url: string | null
  model: string
  notes_count: number | null
  bpm: number | null
  key_detected: string | null
  time_signature: string | null
  duration_seconds: number | null
}
```

## User Experience Flow

1. **Before Transcription:**
   - Stem shows waveform, controls, effects
   - MIDI button available to start transcription

2. **During Transcription:**
   - TranscriptionExportPanel shows progress
   - Engine selection (Replicate vs Klang.io)
   - Model selection (for Klang.io)

3. **After Transcription:**
   - Data saved to `stem_transcriptions` table
   - InlineStemNotes appears automatically
   - Mini indicator shows: "X нот • Y BPM • Key"
   - Click chevron to expand/collapse full view

4. **Playback:**
   - Notes visualization syncs with audio playback
   - Playhead moves in real-time
   - No separate playback controls (unified with audio)

## Benefits

✅ **Unified Interface:** MIDI visualization integrated directly into stem component  
✅ **Better UX:** No modal/sheet required to view notes  
✅ **Persistent Data:** Transcriptions saved and auto-loaded  
✅ **Playback Sync:** Real-time visualization during playback  
✅ **Multiple Engines:** Supports both Replicate and Klang.io  
✅ **Mobile-Friendly:** Responsive design with compact mode  
✅ **Performance:** React.memo optimization, conditional rendering  

## Files Changed

- ✅ Created: `src/components/stem-studio/InlineStemNotes.tsx`
- ✅ Modified: `src/components/stem-studio/StemChannel.tsx`
- ✅ Modified: `src/components/stem-studio/TranscriptionExportPanel.tsx`

## Testing Required

See `MIDI_TRANSCRIPTION_TEST_PLAN.md` for comprehensive test scenarios.

Key tests:
1. Transcription with Replicate engine
2. Transcription with Klang.io engine
3. Inline visualization appearance
4. Expand/collapse functionality
5. Playback sync
6. Data persistence across sessions
7. Mobile responsiveness
8. Multiple stems with different transcriptions

## Migration Notes

- Existing transcriptions remain accessible via transcription sheet
- New transcriptions automatically appear inline
- No breaking changes to existing functionality
- Old transcription data needs migration to `stem_transcriptions` table (if any exists)

## Future Enhancements

- [ ] Auto-transcribe option (checkbox in settings)
- [ ] Transcription quality indicator
- [ ] Edit MIDI notes inline
- [ ] Export to DAW directly
- [ ] Batch transcription for all stems
- [ ] Transcription presets per instrument

## References

- Hook: `src/hooks/useStemTranscription.ts`
- Viewer: `src/components/studio/UnifiedNotesViewer.tsx`
- Edge Function: `supabase/functions/transcribe-midi/index.ts`
- Table: `stem_transcriptions`
