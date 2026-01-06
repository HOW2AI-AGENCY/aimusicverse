# Testing Guide: MIDI/Notes Visualization in Studio-v2

## Overview
This guide describes how to test the improved MIDI, MusicXML, PDF Notes, and Guitar Pro 5 visualization in the unified studio-v2 interface.

## What Was Fixed

### Problem
In the unified studio-v2 interface, when users clicked on notes indicators or "View Notes" button for stems with existing transcriptions, the system incorrectly opened the transcription creation drawer (`StemMidiDrawer`) instead of showing the already-transcribed notes.

### Solution
- Added `NotesViewerDialog` component integration to `UnifiedStudioContent`
- Updated the `view-notes` action handler to:
  1. Check if the stem has existing transcription data (MIDI, PDF, GP5, or MusicXML)
  2. Open `NotesViewerDialog` if transcription exists
  3. Fallback to `StemMidiDrawer` if no transcription (for creating new transcription)

## Files Changed

1. **`src/components/studio/unified/UnifiedStudioContent.tsx`**
   - Added import for `NotesViewerDialog`
   - Added state: `notesViewerOpen`, `selectedStemForNotes`
   - Updated `view-notes` case in `handleStemAction`
   - Added `<NotesViewerDialog>` component with proper props

## Testing Instructions

### Prerequisites
1. Have a track in the studio with separated stems
2. At least one stem should have transcription data (MIDI, PDF, GP5, or MusicXML)

### Test Cases

#### 1. View Existing MIDI Transcription
**Steps:**
1. Navigate to Studio-v2 with a track that has stem transcriptions
2. Look for stem tracks that show MIDI badge/indicator
3. Click on the notes badge or open the stem menu and select "View Notes"
4. **Expected:** `NotesViewerDialog` opens showing:
   - Piano Roll visualization with notes
   - Metadata badges (note count, BPM, key, time signature)
   - Download button for MIDI file
   - Tab navigation if multiple formats available

#### 2. View PDF Notes
**Steps:**
1. Find a stem with PDF transcription (indicated by PDF badge)
2. Click "View Notes" or notes indicator
3. Switch to "PDF" tab in the dialog
4. **Expected:**
   - **Desktop:** PDF preview in iframe
   - **Mobile:** PDF preview card with "Open PDF" button
   - Download and open buttons available

#### 3. View Guitar Pro 5 (GP5) Tabs
**Steps:**
1. Find a stem with GP5 transcription (Guitar badge indicator)
2. Click "View Notes"
3. Switch to "Guitar Tab (GP5)" tab
4. **Expected:**
   - Information about GP5 format
   - Download button for GP5 file
   - Links to free editors (TuxGuitar, Songsterr, Guitar Pro)
   - Message explaining browser preview not available

#### 4. View MusicXML Notation
**Steps:**
1. Find a stem with MusicXML transcription
2. Click "View Notes"
3. Switch to "MusicXML" tab
4. **Expected:**
   - Piano Roll visualization of MusicXML notes
   - Metadata (note count, BPM, key signature, time signature)
   - Part names if available
   - Download button for MusicXML file
   - Links to compatible editors (MuseScore, Flat.io, Finale, Sibelius)

#### 5. Playback Synchronization
**Steps:**
1. Open notes viewer while audio is playing
2. **Expected:** Notes visualization should sync with current playback time
3. Playhead should move across the piano roll
4. Active notes should be highlighted

#### 6. Mobile vs Desktop Views
**Steps:**
1. Test on mobile (or narrow viewport)
   - **Expected:** Sheet component with bottom drawer
   - Simplified mobile notes viewer
   - Compact controls
2. Test on desktop (wide viewport)
   - **Expected:** Dialog with full tab interface
   - More detailed visualizations
   - Larger preview areas

#### 7. No Transcription Available
**Steps:**
1. Find a stem without any transcription data
2. Click "View Notes" or MIDI button in stem menu
3. **Expected:** 
   - `StemMidiDrawer` opens (transcription creation interface)
   - Shows options to create new transcription
   - Model selection available

#### 8. Multiple Format Support
**Steps:**
1. Find a stem with multiple transcription formats (MIDI + PDF + GP5 + MusicXML)
2. Open notes viewer
3. **Expected:**
   - All format tabs available
   - Can switch between Piano Roll, PDF, Guitar Tab, and MusicXML
   - Each tab shows correct data
   - Download buttons available for each format

## Visual Indicators to Check

### On Stem Cards (IntegratedStemTracks)
- **MIDI badge:** Blue badge with Music2 icon and "MIDI" text
- **Guitar Tab badge:** Amber badge with Guitar icon and "TAB" text
- **Notes badge:** Emerald badge with FileMusic icon and "NOTES" text (when PDF/MusicXML available)
- **Mini piano roll:** Should show on stem cards when transcription notes available
- **View button:** Eye icon button to open full notes viewer

### In NotesViewerDialog
- **Desktop:** Full-screen dialog with tabs at top
- **Mobile:** Bottom sheet with compact tabs
- **Tabs:** Piano Roll, PDF, Guitar Tab (GP5), MusicXML (only shown if data available)
- **Metadata badges:** Note count, BPM, key signature, time signature
- **Download buttons:** One for each available format
- **Model badge:** Shows transcription model used (e.g., "Klangio Piano")

## Known Behaviors

1. **PDF on Mobile:** Opens in fullscreen instead of inline (Telegram limitation)
2. **GP5 Preview:** Not available in browser - download required
3. **MusicXML:** Shows as Piano Roll visualization (not staff notation in current implementation)
4. **Auto-parsing:** MIDI files are automatically parsed when viewer opens
5. **Lazy loading:** MusicXML only loads when tab is active

## Success Criteria

✅ Clicking notes indicators opens NotesViewerDialog (not StemMidiDrawer)
✅ All transcription formats (MIDI, PDF, GP5, MusicXML) display correctly
✅ Piano roll visualization shows notes accurately
✅ Playback synchronization works with currentTime prop
✅ Download buttons work for all formats
✅ Mobile and desktop views render appropriately
✅ Tabs only show for available formats
✅ Fallback to StemMidiDrawer works when no transcription exists

## Troubleshooting

### NotesViewerDialog doesn't open
- Check browser console for errors
- Verify `transcriptionsByStem` has data for the stem
- Ensure at least one URL field is not null (midi_url, pdf_url, gp5_url, mxml_url)

### Piano Roll is empty
- Check if `notes` array exists in transcription data
- Verify MIDI URL is accessible
- Check browser console for parsing errors

### PDF doesn't load
- Verify PDF URL is accessible
- Check CORS settings on storage
- On mobile, use "Open PDF" button instead of inline view

### Playback not syncing
- Ensure `currentTime` and `isPlaying` props are being passed correctly
- Check that parent component is updating these props during playback

## Related Components

- **NotesViewerDialog** (`src/components/studio/NotesViewerDialog.tsx`)
- **StemNotesPreview** (`src/components/studio/StemNotesPreview.tsx`)
- **IntegratedStemTracks** (`src/components/studio/unified/IntegratedStemTracks.tsx`)
- **UnifiedStudioContent** (`src/components/studio/unified/UnifiedStudioContent.tsx`)
- **InteractivePianoRoll** (`src/components/analysis/InteractivePianoRoll.tsx`)
- **MobileNotesViewer** (`src/components/analysis/MobileNotesViewer.tsx`)

## API Endpoints

- **Transcriptions:** Fetched via `useStudioData` hook
- **MIDI Parsing:** Client-side via `useMidiFileParser` hook
- **MusicXML Parsing:** Client-side via `useMusicXmlParser` hook
- **MIDI Synth:** Client-side via `useMidiSynth` hook (Tone.js)
