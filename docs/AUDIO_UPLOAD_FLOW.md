# Audio Upload and Processing Flow Documentation

## Overview

This document describes the complete data flow for uploading audio files and generating covers or extensions using both the Web App and Telegram Bot interfaces.

## System Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   User      │────────▶│   Interface  │────────▶│  Supabase   │
│             │         │ (Web/Bot)    │         │  Storage    │
└─────────────┘         └──────────────┘         └─────────────┘
                               │                         │
                               │                         │
                               ▼                         ▼
                        ┌──────────────┐         ┌─────────────┐
                        │ Edge Function│────────▶│  SunoAPI.org│
                        │ (upload-*)   │         │             │
                        └──────────────┘         └─────────────┘
                               │                         │
                               │                         │
                               ▼                         ▼
                        ┌──────────────┐         ┌─────────────┐
                        │  Database    │◀────────│  Callback   │
                        │ (tracks)     │         │  Handler    │
                        └──────────────┘         └─────────────┘
```

## Web App Flow

### Step 1: User Interface
1. User opens Generate Sheet
2. Clicks "Audio" button to upload reference
3. New `AudioUploadActionDialog` appears

### Step 2: Audio Upload & Action Selection
```typescript
// New improved flow with AudioUploadActionDialog
┌─────────────────────────────────────────┐
│  Step 1: Upload Audio                   │
│  - Upload file (max 20MB)               │
│  - Or record from microphone            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Step 2: Choose Action                  │
│  ┌───────────────────────────────────┐  │
│  │ 🎵 Create Cover                   │  │
│  │ - Change musical style            │  │
│  │ - Keep structure and melody       │  │
│  │ - Add or remove vocals            │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ ➕ Extend Track                   │  │
│  │ - Continue composition            │  │
│  │ - Add new parts                   │  │
│  │ - Increase duration               │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Step 3: Configure Parameters           │
│  (Opens UploadAudioDialog)              │
│  - Style, lyrics, instrumental          │
│  - Advanced settings                    │
│  - Model selection                      │
└──────────────┬──────────────────────────┘
               │
               ▼
         Submit to Edge Function
```

### Step 3: Edge Function Processing

#### For Cover Generation
**Endpoint:** `/functions/v1/suno-upload-cover`

```typescript
{
  audioFile: {
    name: string,
    type: string,
    data: base64string
  },
  customMode: boolean,  // Consistent parameter
  instrumental: boolean,
  prompt?: string,
  style?: string,
  title?: string,
  model: 'V5' | 'V4_5' | 'V4',
  // Advanced
  negativeTags?: string,
  vocalGender?: 'm' | 'f',
  styleWeight?: number,
  weirdnessConstraint?: number,
  audioWeight?: number
}
```

#### For Track Extension
**Endpoint:** `/functions/v1/suno-upload-extend`

```typescript
{
  audioFile: {
    name: string,
    type: string,
    data: base64string
  },
  customMode: boolean,  // Fixed: Now consistent with cover
  instrumental: boolean,
  prompt?: string,
  style?: string,
  title?: string,
  continueAt?: number,  // Seconds to continue from
  model: 'V5' | 'V4_5' | 'V4',
  // Advanced
  negativeTags?: string,
  vocalGender?: 'm' | 'f',
  styleWeight?: number,
  weirdnessConstraint?: number,
  audioWeight?: number
}
```

### Step 4: Storage Upload
Edge function uploads audio to Supabase Storage:
```
Bucket: project-assets
Path: {userId}/uploads/{timestamp}-{filename}
```

### Step 5: SunoAPI Call
Edge function calls SunoAPI with public URL:

**Upload Methods Supported:**
1. **URL Upload** (currently used):
   ```typescript
   POST https://api.sunoapi.org/api/v1/generate/upload-cover
   POST https://api.sunoapi.org/api/v1/generate/upload-extend
   
   {
     uploadUrl: string,
     customMode: boolean,
     instrumental: boolean,
     style?: string,
     prompt?: string,
     title?: string,
     model: string,
     callBackUrl: string
   }
   ```

2. **Stream Upload** (alternative):
   - More efficient for large files
   - Direct binary stream

3. **Base64 Upload** (alternative):
   - Smaller files
   - Inline encoding

### Step 6: Task Tracking
1. Create `generation_tasks` record with `suno_task_id`
2. Create placeholder `tracks` record with status='pending'
3. Return taskId to user

### Step 7: Callback Processing
When SunoAPI completes:
1. POST to `/functions/v1/suno-music-callback`
2. Update track record with audio URLs
3. Send notification to user

---

## Telegram Bot Flow

### Step 1: User Initiates Upload

#### Option A: Command First (Recommended)
```
User: /cover --style="indie rock" --instrumental
Bot: 🎵 Создание кавера
     Отправьте аудиофайл (MP3, WAV, OGG)
     
     📝 Стиль: indie rock
     🎸 Режим: Инструментал
     
     ⏳ Ожидание аудио... (15 минут)
     ❌ Отмена: /cancel

User: [sends audio.mp3]
Bot: ⬇️ Загружаю аудиофайл...
     📤 Обрабатываю и отправляю на генерацию...
     ✅ Генерация кавера началась!
```

#### Option B: Audio First (New Inline Keyboard)
```
User: [sends audio.mp3]
Bot: 🎵 Аудио получено!
     
     Выберите что хотите сделать:
     
     [🎤 Создать кавер] [➕ Расширить]
     [📤 Загрузить в облако] [🎼 Распознать]
     
     Или используйте команду:
     /cover - создать кавер-версию
     /extend - расширить/продолжить трек
```

### Step 2: Audio Processing in Bot

**File:** `supabase/functions/telegram-bot/handlers/audio.ts`

```typescript
async function handleAudioMessage(
  chatId: number,
  userId: number,
  audio: TelegramAudio | TelegramVoice | TelegramDocument,
  type: 'audio' | 'voice' | 'document'
) {
  // 1. Check for pending upload
  const pendingUpload = await consumePendingUpload(userId);
  
  if (!pendingUpload) {
    // Show action selection inline keyboard
    await sendInlineKeyboard(chatId);
    return;
  }
  
  // 2. Get file from Telegram
  const fileUrl = await getFileUrl(audio.file_id);
  
  // 3. Download audio
  const audioResponse = await fetch(fileUrl);
  const audioBlob = await audioResponse.blob();
  
  // 4. Convert to base64
  const audioBuffer = await audioBlob.arrayBuffer();
  const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
  
  // 5. Upload to Supabase Storage
  const storagePath = `${userId}/telegram-uploads/${Date.now()}-${fileName}`;
  await supabase.storage.from('project-assets').upload(storagePath, audioBuffer);
  
  // 6. Call SunoAPI
  const result = await processAudioUpload(userId, pendingUpload, audioFile, chatId);
}
```

### Step 3: Edge Function Call from Bot

Bot calls edge function with special authentication:
```typescript
{
  source: 'telegram_bot',
  userId: string,  // Supabase user_id
  telegramChatId: number,
  audioUrl: string,  // Pre-uploaded to Supabase
  customMode: boolean,
  instrumental: boolean,
  prompt?: string,
  style?: string,
  title?: string,
  model?: string
}

Headers: {
  'x-telegram-bot-secret': TELEGRAM_BOT_TOKEN
}
```

### Step 4: Storage Paths

**Bot uploads to:**
```
Bucket: project-assets
Path: {userId}/telegram-uploads/{timestamp}-{filename}
```

**Alternative: reference-audio bucket**
```
Bucket: reference-audio
Path: {userId}/reference-audio/{timestamp}-{filename}

Purpose:
- /upload command - save for later use
- Can be reused for multiple generations
- Stored in reference_audio table
```

### Step 5: Notification
When generation completes:
1. Edge function `send-telegram-notification` is called
2. Bot sends message to user with inline keyboard
3. User can open Mini App to view/edit track

---

## SunoAPI Integration Details

### API Endpoints

#### 1. Upload & Cover Audio
**Documentation:** https://docs.sunoapi.org/suno-api/upload-and-cover-audio

```typescript
POST https://api.sunoapi.org/api/v1/generate/upload-cover

Request:
{
  uploadUrl: string,      // Public URL to audio file
  customMode: boolean,    // true = custom parameters
  instrumental: boolean,  // false = with vocals
  style?: string,         // Required in custom mode
  prompt?: string,        // Lyrics (if not instrumental)
  title?: string,
  model: string,          // V5, V4_5, V4
  callBackUrl: string,    // Completion webhook
  
  // Optional advanced
  personaId?: string,
  negativeTags?: string,
  vocalGender?: 'm' | 'f',
  styleWeight?: number,       // 0.0-1.0
  weirdnessConstraint?: number, // 0.0-1.0
  audioWeight?: number        // 0.0-1.0
}

Response:
{
  code: 200,
  msg: "Success",
  data: {
    taskId: string,
    clips: [{
      id: string,
      status: "submitted"
    }]
  }
}
```

#### 2. Upload & Extend Audio
**Documentation:** https://docs.sunoapi.org/suno-api/upload-and-extend-audio

```typescript
POST https://api.sunoapi.org/api/v1/generate/upload-extend

Request:
{
  uploadUrl: string,
  customMode: boolean,    // Fixed: Now consistent
  instrumental?: boolean,
  style?: string,         // Required in custom mode
  prompt?: string,        // Continuation text
  title?: string,
  continueAt?: number,    // Seconds to continue from (0-480)
  model: string,
  callBackUrl: string,
  
  // Optional advanced
  personaId?: string,
  negativeTags?: string,
  vocalGender?: 'm' | 'f',
  styleWeight?: number,
  weirdnessConstraint?: number,
  audioWeight?: number
}
```

### Alternative Upload Methods

#### Method 1: Direct URL Upload (Current)
**Best for:** Public URLs, Telegram file downloads
**Pros:** Simple, no additional encoding
**Cons:** Requires public URL

#### Method 2: File Stream Upload
**Documentation:** https://docs.sunoapi.org/file-upload-api/upload-file-stream

```typescript
POST https://api.sunoapi.org/api/v1/file/upload

Content-Type: multipart/form-data

{
  file: <binary_stream>,
  prefix?: string  // Custom storage prefix
}

Response:
{
  code: 200,
  data: {
    url: string  // Use this in upload-cover/extend
  }
}
```

**Best for:** Large files (>10MB), direct uploads
**Pros:** More efficient, handles large files
**Cons:** More complex implementation

#### Method 3: Base64 Upload
**Documentation:** https://docs.sunoapi.org/file-upload-api/upload-file-base-64

```typescript
POST https://api.sunoapi.org/api/v1/file/upload-base64

{
  file: string,      // Base64 encoded audio
  fileName: string,
  prefix?: string
}
```

**Best for:** Small files (<5MB), embedded data
**Pros:** Simple integration, works with base64
**Cons:** Larger payload size, encoding overhead

---

## Database Schema

### generation_tasks
```sql
{
  id: uuid,
  user_id: uuid,
  suno_task_id: text,
  generation_mode: text,  -- 'upload_cover' | 'upload_extend'
  model_used: text,
  status: text,
  source: text,           -- 'mini_app' | 'telegram'
  telegram_chat_id: bigint,
  created_at: timestamp
}
```

### tracks
```sql
{
  id: uuid,
  user_id: uuid,
  suno_task_id: text,
  generation_mode: text,
  status: text,           -- 'pending' | 'completed' | 'failed'
  audio_url: text,
  cover_url: text,
  title: text,
  style: text,
  lyrics: text,
  has_vocals: boolean,
  provider: text,         -- 'suno'
  suno_model: text,
  project_id: uuid
}
```

### reference_audio (Bot uploads)
```sql
{
  id: uuid,
  user_id: uuid,
  file_name: text,
  file_url: text,
  file_size: bigint,
  mime_type: text,
  duration_seconds: integer,
  source: text,           -- 'telegram_upload'
  metadata: jsonb,        -- { telegram_file_id, upload_type, title }
  created_at: timestamp
}
```

---

## Error Handling

### Common Errors

1. **File Too Large**
   - Web: Max 20MB
   - Telegram: Max 25MB
   - Solution: Show error, suggest compression

2. **Invalid Format**
   - Web: Check `file.type.startsWith('audio/')`
   - Bot: Check mime_type
   - Solution: Show supported formats

3. **Insufficient Credits**
   - Check user balance before generation
   - Return 402 status code
   - Show payment options

4. **SunoAPI Errors**
   - 429: Rate limit / No credits
   - 430: Too frequent requests
   - Solution: Show user-friendly message, suggest retry

---

## Performance Optimization

### File Upload Optimization
1. **Compress audio before upload** (optional)
2. **Use appropriate upload method:**
   - Small files (<5MB): Base64
   - Medium files (5-20MB): Direct URL
   - Large files (>20MB): Stream upload

### Caching Strategy
1. **Telegram file_id caching:**
   - Store in `reference_audio.metadata`
   - Reuse for multiple generations
   
2. **Storage optimization:**
   - Clean up old uploads (>30 days)
   - Use lifecycle policies

---

## Testing Checklist

### Web App
- [ ] Upload audio file
- [ ] Record audio
- [ ] Select cover action
- [ ] Select extend action
- [ ] Configure custom parameters
- [ ] Generate with advanced settings
- [ ] Verify callback processing
- [ ] Check track in library

### Telegram Bot
- [ ] /cover command with audio
- [ ] /extend command with audio
- [ ] Audio first, then action selection
- [ ] /upload for reference storage
- [ ] Verify file download from Telegram
- [ ] Check storage upload
- [ ] Verify edge function call
- [ ] Test notification delivery

---

## Future Improvements

1. **Streaming Upload Support**
   - Implement file-upload-stream endpoint
   - Handle large files more efficiently

2. **Audio Preview**
   - Show waveform before generation
   - Allow trimming/editing

3. **Batch Processing**
   - Upload multiple files
   - Generate variations

4. **Smart Recommendations**
   - Suggest style based on audio analysis
   - Auto-detect genre/mood

---

## Related Documentation

- [SunoAPI Upload File URL](https://docs.sunoapi.org/file-upload-api/upload-file-url)
- [SunoAPI Upload File Stream](https://docs.sunoapi.org/file-upload-api/upload-file-stream)
- [SunoAPI Upload File Base64](https://docs.sunoapi.org/file-upload-api/upload-file-base-64)
- [SunoAPI Upload & Cover Audio](https://docs.sunoapi.org/suno-api/upload-and-cover-audio)
- [SunoAPI Upload & Cover Audio Callbacks](https://docs.sunoapi.org/suno-api/upload-and-cover-audio-callbacks)
- [SunoAPI Upload & Extend Audio](https://docs.sunoapi.org/suno-api/upload-and-extend-audio)
- [SunoAPI Upload & Extend Audio Callbacks](https://docs.sunoapi.org/suno-api/upload-and-extend-audio-callbacks)

---

**Last Updated:** 2025-12-12
**Status:** Active Development
