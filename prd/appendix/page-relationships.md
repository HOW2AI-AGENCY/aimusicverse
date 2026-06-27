# Page Relationships & Navigation Flows

> **Complete Navigation Map for MusicVerse AI**

---

## Primary Navigation Flows

### Main Navigation (Bottom Navigation Bar)

**Navigation Items:**
- Home (`/`) - Music generation and discovery
- Library (`/library`) - Personal track collection  
- Projects (`/projects`) - Project organization
- Profile (`/profile`) - User profile and settings

---

## User Journey Maps

### New User Onboarding Flow

```
/auth → /onboarding → / (first-time) → Generate First Track → /library
```

### Returning User Flow

```
/auth → / (with draft restoration) → [Quick Create | Browse Featured | Edit in Studio]
```

### Track Creation Flow

```
/ (Home) → GenerateSheet → Polling → GenerationResultSheet → /library OR /studio-v2/track/{id}
```

### Studio Editing Flow

```
/library → "Edit in Studio" → /studio-v2/track/{id} → [Stem Separation | MIDI Transcription | Export]
```

---

## Cross-Page Data Coupling

### Global State (Updated Across Multiple Pages)

| State | Updated By | Affects Pages | Persistence |
|-------|-----------|---------------|-------------|
| `creditsBalance` | Generation, purchases | Home, Library, Generate Form | Database + Optimistic |
| `playerState` | Track play on any page | All pages (global player) | Zustand store |
| `userProfile` | Settings page | All pages | Database |
| `activeGenerations` | Generation API | Home, Library | Polling (3s) |

---

## Deep Link Reference

**Format:** `t.me/AIMusicVerseBot/app?startapp=PARAM`

| Parameter | Target Page | Behavior |
|-----------|-------------|----------|
| `track_TRACKID` | `/library` | Highlights track |
| `playlist_PLAYLISTID` | `/playlists` | Opens playlist |
| `generate` | `/` | Opens generation form |
| `ref_USERNAME` | `/auth` | Stores referral code |

---

## Navigation Guards

### Protected Routes

**Guard:** `<ProtectedRoute>`

**Protected Routes:** `/`, `/library`, `/profile`, `/projects`, `/studio-v2/*`, `/rewards`

### Admin Routes

**Guard:** `<AdminRoute>`

**Admin Routes:** `/admin/*`

---

**Generated:** 2026-06-27