# Mobile Player Page

> **Route:** `/player/:trackId`  
> **Module:** Player & Playback  
> **Generated:** 2026-06-26

## Overview

Mobile Player Page is a fullscreen mobile-optimized player interface for individual tracks. Features waveform visualization, playback controls, track information, and integration with global audio system.

**Primary Use Cases:**

- Fullscreen playback on mobile devices
- View track details and waveform
- Control playback with mobile gestures
- Access related tracks (versions, stems, artist)
- Share track via Telegram

## Layout

### Mobile Layout (Fullscreen)

```
┌──────────────────────────────────────┐
│ HEADER: Back + Track Title             │
├──────────────────────────────────────┤
│ Large Waveform Display                  │
│ ┌────────────────────────────────┐    │
│ │ Waveform with playhead           │    │
│ │ [======●====================]│    │
│ └────────────────────────────────┘    │
│                                          │
│ Track Info                               │
│ Title                                    │
│ Artist • Duration • BPM                │
│ Likes: 124 • Plays: 1.2K               │
│                                          │
│ Playback Controls                        │
│ [⏮][▶⏸][⏭]                      │
│ 15s / 2:34                             │
│                                          │
│ Version Selector (if applicable)         │
│ [Version A] [Version B]                   │
│                                          │
│ Actions Row                              │
│ [❤️][🔄][Share][☰ More...]             │
│                                          │
│ Stem Player (if has stems)               │
│ [Vocals][Drums][Bass][Other]            │
└──────────────────────────────────────┘
```

## Fields

### Waveform Display

| Element         | Type           | Notes                                |
| --------------- | -------------- | ------------------------------------ |
| Waveform Canvas | Canvas         | Wavesurfer.js waveform visualization |
| Playhead        | Line indicator | Current playback position (red)      |
| Zoom Level      | Number         | 0.1x to 10x zoom (pinch gesture)     |
| Time Display    | Text           | Current position / total duration    |

### Track Info

| Field         | Format       | Notes                           |
| ------------- | ------------ | ------------------------------- |
| Title         | Text (H2)    | Track name                      |
| Artist        | Text (link)  | Links to artist profile         |
| Duration      | Text (MM:SS) | Audio length                    |
| BPM           | Number       | Tempo (if available)            |
| Likes Count   | Number       | Total likes                     |
| Play Count    | Number       | Total plays                     |
| Version Label | Badge        | "A" or "B" (if versioned track) |

### Playback Controls

| Control          | Function | Notes                   |
| ---------------- | -------- | ----------------------- |
| Rewind 15s       | Button   | Jump back 15 seconds    |
| Play/Pause       | Toggle   | Start/pause playback    |
| Fast Forward 15s | Button   | Jump forward 15 seconds |
| Loop             | Toggle   | Enable/disable looping  |
| Progress         | Slider   | Manual seek (drag)      |

### Version Selector

| Element          | Type   | Notes                     |
| ---------------- | ------ | ------------------------- |
| Version A Button | Toggle | Switch to version A       |
| Version B Button | Toggle | Switch to version B       |
| Active Indicator | Badge  | Highlights active version |

### Stem Player

| Element      | Type    | Notes                           |
| ------------ | ------- | ------------------------------- |
| Stem Buttons | Toggles | Vocals, Drums, Bass, Other      |
| Stem Volume  | Sliders | Individual stem volume controls |
| Mute/Solo    | Toggles | Mute or solo individual stems   |

### Actions Row

| Action | Function | Notes                                      |
| ------ | -------- | ------------------------------------------ |
| Like   | Toggle   | Like/unlike track                          |
| Repost | Button   | Share to own story/feed                    |
| Share  | Button   | Share via Telegram                         |
| More   | Menu     | Additional options (add to playlist, etc.) |

---

## Interactions

### Page Load

1. Extract `trackId` from URL
2. Fetch track details and waveform
3. Setup global audio player
4. Initialize Wavesurfer.js
5. Hide bottom navigation (fullscreen)

**API Calls:**

- `GET /api/tracks/{id}` — Track details
- `GET /api/tracks/{id}/waveform` — Waveform data

### Play/Pause

- Toggle via global player
- Update playhead in real-time (60 FPS)

### Seek

- Drag progress slider or tap waveform
- Update global player position

### Version Switch

- Call API: `POST /api/tracks/{id}/switch-version`
- Reload player with new version

### Share Track

- Generate deep link: `startapp=track={id}`
- Open Telegram share dialog

### Exit Fullscreen

- Click back button
- Navigate to previous page
- Show bottom navigation again

## API Dependencies

| API            | Method | Path                            | Trigger        |
| -------------- | ------ | ------------------------------- | -------------- |
| Get Track      | GET    | /api/tracks/{id}                | Page load      |
| Get Waveform   | GET    | /api/tracks/{id}/waveform       | Page load      |
| Switch Version | POST   | /api/tracks/{id}/switch-version | Version switch |
| Like Track     | POST   | /api/tracks/{id}/like           | Like action    |

## Page Relationships

**From:** Anywhere → Click track title or "Open Fullscreen"
**To:** Previous page → Back button

**Data Coupling:** Global player (usePlayerStore), version state (useTrackVersions)

## Business Rules

1. **Fullscreen Mode:** Hides bottom navigation, gestures for exit
2. **Waveform:** Pre-computed, pinch-to-zoom (0.1x-10x)
3. **Version Switching:** Atomic update of is_primary + active_version_id
4. **Stem Mixing:** Solo/mute per stem, volume/pan controls
5. **Mobile Gestures:** Tap seek, pinch zoom, swipe down (optional)
6. **Background Playback:** Continues when navigating away
7. **Looping:** Single track repeat infinitely
8. **Share:** Deep link `startapp=track={id}`, Telegram share dialog

---
