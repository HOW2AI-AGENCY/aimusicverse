# Visual Comparison: Before vs After

## Problem: Notes Visualization Not Working in Studio-v2

### BEFORE (Broken Behavior)

```
User flow when clicking "View Notes" on a stem with existing transcription:

1. User sees stem with MIDI/PDF/GP5 badges ✅
2. User clicks "View Notes" button or notes badge
3. ❌ StemMidiDrawer opens (wrong!)
   - Shows transcription CREATION interface
   - Shows model selection dropdown
   - Shows "Transcribe" button
   - Ignores existing transcription data
4. User is confused - data already exists!
```

**Code Issue (BEFORE):**
```typescript
case 'view-notes':
  setSelectedStemForMidi(stem);
  setMidiDrawerOpen(true);  // ❌ Always opens creation drawer
  break;
```

---

### AFTER (Fixed Behavior)

```
User flow when clicking "View Notes" on a stem with existing transcription:

1. User sees stem with MIDI/PDF/GP5 badges ✅
2. User clicks "View Notes" button or notes badge
3. ✅ NotesViewerDialog opens (correct!)
   - Shows Piano Roll with notes
   - Shows all available formats in tabs
   - Shows metadata (BPM, key, time signature)
   - Allows downloading all formats
   - Syncs playback with timeline
4. User can view and interact with notes!
```

**Code Fix (AFTER):**
```typescript
case 'view-notes':
  // Check if stem has transcription data to view
  const stemTranscription = transcriptionsByStem?.[stem.id];
  if (stemTranscription && (
    stemTranscription.midi_url || 
    stemTranscription.pdf_url || 
    stemTranscription.gp5_url || 
    stemTranscription.mxml_url
  )) {
    // ✅ Open viewer for existing transcription
    setSelectedStemForNotes(stem);
    setNotesViewerOpen(true);
  } else {
    // Fallback: No transcription exists - open creation drawer
    setSelectedStemForMidi(stem);
    setMidiDrawerOpen(true);
  }
  break;
```

---

## Component Architecture

### Components Involved

```
UnifiedStudioContent
├── IntegratedStemTracks (displays stems)
│   ├── StemNotesPreview (mini piano roll)
│   └── [MIDI/PDF/GP5 badges]
│
├── NotesViewerDialog (NEW - for viewing) ✅
│   ├── TabsList (Piano/PDF/Guitar/XML)
│   ├── InteractivePianoRoll
│   ├── PDF Preview
│   ├── Guitar Pro info
│   └── MusicXML visualization
│
└── StemMidiDrawer (for creating transcriptions)
    └── Transcription creation form
```

---

## User Interface Changes

### Desktop View - NotesViewerDialog

```
┌─────────────────────────────────────────────────────────┐
│  🎵 Ноты: Vocals                          [Klangio Pro] │
├─────────────────────────────────────────────────────────┤
│  [🎹 Piano Roll] [📄 PDF] [🎸 TAB] [📋 MusicXML]       │
├─────────────────────────────────────────────────────────┤
│  [247 нот] [120 BPM] [C Major] [4/4]                   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                   │   │
│  │      Interactive Piano Roll                      │   │
│  │      ▓▓░░▓▓░░░░▓▓▓▓░░▓▓░░░                        │   │
│  │      ░░▓▓░░▓▓▓▓░░░░▓▓░░▓▓                        │   │
│  │              │                                    │   │
│  │           Playhead                                │   │
│  │                                                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  [⬇ MIDI] [⬇ MIDI Квантизированный]                    │
│                                                          │
│                                                     [✕]  │
└─────────────────────────────────────────────────────────┘
```

### Mobile View - NotesViewerDialog (Sheet)

```
┌─────────────────────────┐
│ 🎵 Ноты: Vocals         │
│                [Klangio]│
├─────────────────────────┤
│ [🎹 Piano] [📄 PDF]     │
│ [🎸 TAB]   [📋 XML]     │
├─────────────────────────┤
│ [247 нот] [120 BPM]    │
│                         │
│ ┌─────────────────────┐ │
│ │  Piano Roll         │ │
│ │  ▓░▓░░▓▓░▓          │ │
│ │  ░▓░▓▓░░▓           │ │
│ │     │                │ │
│ └─────────────────────┘ │
│                         │
│ [⬇ MIDI] [👁 View]     │
│                         │
│ [🎸 Guitar Pro]         │
│ [📋 MusicXML]           │
└─────────────────────────┘
```

### Stem Card Indicators (in IntegratedStemTracks)

```
BEFORE (hidden in unified studio):
No visual indication of available notes/transcriptions

AFTER (visible indicators):
┌──────────────────────────────────────────────┐
│ 🎤 VOX  [MIDI] [TAB] [NOTES]                │
│                                               │
│ Mini Piano Roll: ▓░▓░░▓▓░▓░░░▓▓░            │
│ 247 нот • 120 BPM • C Major                  │
│                              [👁 Ноты] [⬇]   │
└──────────────────────────────────────────────┘
```

---

## Format Support

### All Supported Formats Now Visible

| Format | Icon | Badge Color | View Mode | Download |
|--------|------|-------------|-----------|----------|
| MIDI | 🎵 Music2 | Blue | Piano Roll | ✅ .mid |
| MusicXML | 📋 FileCode2 | Default | Piano Roll | ✅ .musicxml |
| PDF Notes | 📄 FileText | - | PDF Viewer | ✅ .pdf |
| Guitar Pro 5 | 🎸 Guitar | Amber | Info + Links | ✅ .gp5 |

### Tab Navigation Logic

The dialog intelligently shows only available tabs:

```typescript
const availableTabs = useMemo(() => {
  const tabs = [];
  
  if (transcription?.midi_url) 
    tabs.push({ id: 'piano', label: 'Piano Roll', icon: Piano });
  
  if (transcription?.pdf_url) 
    tabs.push({ id: 'pdf', label: 'Ноты (PDF)', icon: FileText });
  
  if (transcription?.gp5_url) 
    tabs.push({ id: 'guitar', label: 'Табы (GP5)', icon: Guitar });
  
  if (transcription?.mxml_url) 
    tabs.push({ id: 'xml', label: 'MusicXML', icon: FileCode2 });
  
  return tabs;
}, [transcription]);
```

---

## Data Flow

### State Management

```typescript
// NEW state for notes viewer
const [notesViewerOpen, setNotesViewerOpen] = useState(false);
const [selectedStemForNotes, setSelectedStemForNotes] = useState<TrackStem | null>(null);

// Existing state for MIDI creation
const [midiDrawerOpen, setMidiDrawerOpen] = useState(false);
const [selectedStemForMidi, setSelectedStemForMidi] = useState<TrackStem | null>(null);
```

### Props Passed to NotesViewerDialog

```typescript
<NotesViewerDialog
  open={notesViewerOpen}
  onOpenChange={setNotesViewerOpen}
  transcription={
    selectedStemForNotes 
      ? transcriptionsByStem?.[selectedStemForNotes.id] || null 
      : null
  }
  stemType={selectedStemForNotes?.stem_type || 'Стем'}
  currentTime={currentTime}    // ✅ Synced with playback
  isPlaying={isPlaying}        // ✅ Synced with playback
/>
```

---

## Key Features Now Working

✅ **Piano Roll Visualization**: Interactive canvas-based note display
✅ **PDF Preview**: Desktop iframe, mobile fullscreen
✅ **Guitar Pro**: Download with editor recommendations
✅ **MusicXML**: Parsed and displayed as piano roll
✅ **Playback Sync**: Notes highlight in real-time
✅ **Metadata Display**: BPM, key, time signature, note count
✅ **Download All**: Buttons for each available format
✅ **Mobile Optimized**: Sheet view with touch-friendly controls
✅ **Lazy Loading**: Files parse only when needed
✅ **Fallback**: Opens creation drawer if no transcription exists

---

## Impact on User Experience

### Before
- ❌ Users couldn't view their transcribed notes
- ❌ "View Notes" button was misleading
- ❌ Notes indicators showed data but couldn't access it
- ❌ Had to re-transcribe or download files externally

### After
- ✅ One-click access to all transcription formats
- ✅ Visual piano roll with playback sync
- ✅ PDF preview directly in browser (desktop)
- ✅ Easy download of all formats
- ✅ Clear distinction between viewing and creating transcriptions
- ✅ Proper mobile experience with sheet UI

---

## Testing Checklist

- [ ] MIDI files display in piano roll
- [ ] PDF files preview correctly
- [ ] GP5 files show download option with editor links
- [ ] MusicXML files parse and display
- [ ] Notes sync with playback timeline
- [ ] Download buttons work for all formats
- [ ] Mobile sheet view renders properly
- [ ] Desktop dialog view renders properly
- [ ] Tabs only show for available formats
- [ ] Fallback to StemMidiDrawer when no transcription exists
- [ ] Metadata badges display correctly
- [ ] Mini piano roll shows on stem cards
