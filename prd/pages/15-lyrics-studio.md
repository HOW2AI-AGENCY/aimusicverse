# Lyrics Studio Page

> **Route:** `/lyrics-studio`  
> **Module:** Projects & Creativity  
> **Generated:** 2026-06-26

## Overview

Lyrics Studio is a dedicated lyrics editing workspace with AI assistance, versioning, and integration with music generation. Features full-featured lyrics editor, AI chat assistant for suggestions, version history, and tools for organizing lyrics into projects.

**Primary Use Cases:**
- Write and edit lyrics with AI assistance
- Manage lyric versions and history
- Organize lyrics into projects
- Generate tracks from lyrics
- Export lyrics for use in generation

## Layout

```
┌─────────────────────────────────────────────────┐
│  HEADER: Back + "Lyrics Studio"                 │
├─────────────────────────────────────────────────┤
│ Editor Layout (Split View)                       │
│ ┌─────────────────────┬───────────────────────┐  │
│ │ Lyrics Editor       │ AI Assistant          │  │
│ │ (Main Area)         │ (Sidebar)             │  │
│ │                     │                       │  │
│ │ [Toolbar]           │ Chat Interface        │  │
│ │ Bold, Italic, ...   │                       │  │
│ ├─────────────────────┤                       │  │
│ │                     │ [Suggestions]         │  │
│ │ Lyrics text area    │ Rhymes               │  │
│ │ (scrollable)        │ Templates            │  │
│ │                     │ Genre-specific        │  │
│ │                     │                       │  │
│ │ [Version History]   │ [Chat Input]         │  │
│ │ [Save] [Generate]    │ Type & send          │  │
│ └─────────────────────┴───────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## Fields

### Editor Toolbar

| Tool | Function |
|------|----------|
| Bold | Format selected text bold |
| Italic | Format selected text italic |
| Undo | Undo last edit |
| Redo | Redo last undone edit |
| Save | Save current version |
| Generate | Generate track from lyrics |

### Lyrics Editor

| Element | Type | Notes |
|---------|------|-------|
| Text Area | Large textarea | Main lyrics editing area |
| Line Numbers | Gutter | Shows line numbers (optional) |
| Word Count | Status bar | Shows total word count |
| Auto-Save | Indicator | Shows save status |

### AI Assistant Sidebar

| Element | Type | Notes |
|---------|------|-------|
| Chat Messages | List | Conversation with AI |
| Suggestions | Panel | Context-aware lyric suggestions |
| Rhymes | List | Rhyming words for selected word |
| Templates | List | Genre-specific lyric templates |
| Chat Input | Text input + send | Type message to AI |

### Version History

| Element | Type | Notes |
|---------|------|-------|
| Version List | List | All saved versions |
| Timestamp | Date | When version was saved |
| Change Summary | Text | Description of changes |
| Restore | Button | Restore selected version |

---

## Interactions

### Page Load

**Behavior:**
1. Load lyrics draft from URL param or create new
2. Initialize AI chat assistant
3. Setup editor with default toolbar options
4. Setup Telegram Back Button

**API Calls:**
- `GET /api/lyrics/{id}` — Load existing lyrics
- `GET /api/lyrics/versions/{lyricsId}` — Load version history

### Edit Lyrics

**Trigger:** Type in lyrics editor

**Behavior:**
1. Update editor content immediately
2. Auto-save to localStorage every 30 seconds
3. Show "Unsaved changes" indicator
4. Enable "Save" button

### Save Version

**Trigger:** Click "Save" button

**Behavior:**
1. Open save dialog:
   - Version summary (optional description)
   - Change notes (optional)
2. Call API: `POST /api/lyrics/versions`
3. On success: Update version history, show "Saved!" toast

**API Request:**
```typescript
POST /api/lyrics/versions
{
  lyrics_id: string;
  content: string;
  change_summary?: string;
}
```

### Generate Track from Lyrics

**Trigger:** Click "Generate" button

**Behavior:**
1. Open generation form with lyrics pre-filled
2. User adjusts style, vocals, settings
3. Submit generation
4. On completion: Ask to associate lyrics with track

### AI Chat

**Trigger:** Type message in chat input and send

**Behavior:**
1. Send message to AI assistant via API
2. AI responds with suggestions
3. Suggestions can be:
   - Rhyming words
   - Lyric continuations
   - Genre-specific suggestions
   - Structure advice
4. User can insert suggestions into editor

**API Call:**
- `POST /api/lyrics/ai-assistant` — AI chat response

### Restore Version

**Trigger:** Click "Restore" on version in history

**Behavior:**
1. Show confirmation: "Restore this version?"
2. User confirms
3. Replace editor content with version content
4. Create new version (restored version becomes latest)

## API Dependencies

| API | Method | Path | Trigger | Notes |
|-----|--------|------|---------|-------|
| Get Lyrics | GET | /api/lyrics/{id} | Page load | Load existing lyrics |
| Save Lyrics | POST | /api/lyrics | Save action | Create or update lyrics |
| Save Version | POST | /api/lyrics/versions | Save version | Create new version |
| Get Versions | GET | /api/lyrics/versions/{lyricsId} | Load history | Version history |
| AI Assistant | POST | /api/lyrics/ai-assistant | Chat message | AI suggestions |
| Generate Track | POST | /api/generation/generate | Generate action | Create track from lyrics |

## Page Relationships

**From:**
- `/music-lab` → Click "Lyrics" tab
- `/projects` → Click "Lyrics" in project tools
- `/` (Home) → From generation form "Save as Lyrics"

**To:**
- `/` (Home) → Generate track from lyrics
- `/projects/{id}` → Associate lyrics with project
- Back button → Previous page

## Business Rules

1. **Lyrics Versioning:**
   - Every save creates new version
   - Unlimited versions per lyric
   - Storage: All versions stored indefinitely
   - Restore: Can restore any previous version

2. **AI Assistant Capabilities:**
   - Rhyme finder: Finds rhyming words
   - Continuations: Suggests next lines
   - Templates: Genre-specific structures
   - Languages: EN, RU, ES, DE, FR supported

3. **Auto-Save:**
   - Frequency: Every 30 seconds
   - Storage: localStorage + server backup
   - Conflict detection: Warns if multiple edits detected
   - Recovery: Can recover from last auto-save

4. **Generation Integration:**
   - Pre-fill: Lyrics auto-filled in generation form
   - Association: Track can be linked to lyrics
   - Versions: Each generation creates new lyric version
   - Export: Lyrics can be exported as text file

---

**Next:** [Voice Library Page](./16-voice-library.md) → Batch 3 continues
