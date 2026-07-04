# Guitar Studio Page

> **Route:** `/guitar-studio`  
> **Module:** Studio V2  
> **Generated:** 2026-06-26

## Overview

Guitar Studio provides specialized tools for guitar recording, chord detection, and tone editing. Features real-time chord visualization, recording interface, and tone shaping controls optimized for guitarists.

**Primary Use Cases:**

- Record guitar performances
- Detect chords in real-time
- Edit guitar tone and effects
- Transcribe recordings to notation
- Export audio and chord data

## Layout

```
┌─────────────────────────────────────────┐
│  HEADER: Back + "Guitar Studio"        │
├─────────────────────────────────────────┤
│ Recording Controls                       │
│ [● Record] [■ Stop] [▶ Play]          │
│ Chord Display: C  Am  F  G 7           │
├─────────────────────────────────────────┤
│ Tone Controls                            │
│ [Gain] [EQ] [Reverb] [Distortion]      │
├─────────────────────────────────────────┤
│ Chord Timeline                           │
│ ┌───────────────────────────────────┐  │
│ │ C    Am   F    C    G7           │  │
│ │ 0:00 0:15 0:30 0:45 1:00        │  │
│ └───────────────────────────────────┘  │
├─────────────────────────────────────────┤
│ Actions                                  │
│ [Save Recording] [Export] [Transcribe]│
└─────────────────────────────────────────┘
```

## Fields

| Element        | Type      | Notes                                   |
| -------------- | --------- | --------------------------------------- |
| Record Button  | Toggle    | Starts/stops recording                  |
| Chord Display  | Real-time | Shows current chord (name + confidence) |
| Tone Controls  | Sliders   | Gain, Bass, Mid, Treble, Presence       |
| Effects Rack   | Toggles   | Reverb, Distortion, Chorus, Delay       |
| Chord Timeline | Visual    | Chord progression over time             |
| Export Options | Select    | WAV, MP3, Chords only                   |

---

## Interactions

### Start Recording

**Trigger:** Click "● Record" button

**Behavior:**

1. Start audio capture from microphone/guitar input
2. Begin real-time chord detection
3. Display detected chords in timeline
4. Show recording duration

### Stop Recording

**Trigger:** Click "■ Stop" button

**Behavior:**

1. Stop audio capture
2. Process chord detection results
3. Save recording with chord data
4. Enable playback and export

### Transcribe Chords

**Trigger:** Click "Transcribe" button

**Behavior:**

1. Analyze recording for chord progression
2. Display chords with timestamps
3. Export as text or MIDI chord file

## API Dependencies

| API            | Method | Path                             | Trigger        |
| -------------- | ------ | -------------------------------- | -------------- |
| Save Recording | POST   | /api/recordings/guitar           | Stop recording |
| Detect Chords  | POST   | /api/chords/detect               | Recording stop |
| Export Chords  | GET    | api/chords/export?recording={id} | Export action  |

## Page Relationships

**From:** `/music-lab` → Guitar tab
**To:** `/audio-hub` → Save recording

---
