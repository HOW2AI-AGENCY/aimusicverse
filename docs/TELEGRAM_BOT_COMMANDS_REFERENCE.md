# Telegram Bot Commands Reference

**Bot:** @AIMusicVerseBot  
**Last Updated:** 2025-12-16

## Overview

Comprehensive reference for all Telegram bot commands, inline queries, and callback handlers.

## Bot Commands

### Core Commands

#### /start
**Description:** Start bot, show welcome message, initialize user  
**Usage:** `/start` or `/start track_ID` or `/start playlist_ID`  
**Features:**
- Deep link handling for tracks and playlists
- User profile initialization
- Welcome keyboard with quick actions

**Implementation:** `commands/start.ts`

#### /help
**Description:** Show help message with all available commands  
**Usage:** `/help`  
**Features:**
- Command list with descriptions
- Category-based help organization
- Quick action buttons

**Implementation:** `commands/help.ts`

#### /app
**Description:** Open MusicVerse Mini App  
**Usage:** `/app`  
**Features:**
- Direct Mini App launch button
- Session initialization

**Implementation:** `commands/app.ts`

### Music Generation

#### /generate
**Description:** Start music generation wizard  
**Usage:** `/generate`  
**Features:**
- Step-by-step generation wizard
- Style and prompt input
- Direct to Mini App for advanced options

**Implementation:** `commands/generate.ts`

#### /status
**Description:** Check generation task status  
**Usage:** `/status` or `/status TASK_ID`  
**Features:**
- Active tasks overview
- Task-specific status
- Progress indication

**Implementation:** `commands/status.ts`

#### /check_task
**Description:** Check specific task status (alias for /status)  
**Usage:** `/check_task TASK_ID`  

**Implementation:** `commands/check-task.ts`

### Library Management

#### /library
**Description:** Browse user's music library  
**Usage:** `/library` or `/library page_2`  
**Features:**
- Paginated track listing
- 5 tracks per page
- Play/download/share buttons
- Navigation between pages

**Implementation:** `commands/library.ts`

#### /playlist
**Description:** Manage playlists  
**Usage:** `/playlist` or `/playlist PLAYLIST_ID`  
**Features:**
- List user playlists
- View playlist details
- Add/remove tracks
- Share playlist

**Implementation:** `commands/playlist.ts`

### Track Actions

#### /lyrics
**Description:** View track lyrics  
**Usage:** `/lyrics TRACK_ID`  
**Features:**
- Full lyrics display
- Formatted text
- Back to track button

**Implementation:** `commands/lyrics.ts`

#### /stats
**Description:** View track statistics  
**Usage:** `/stats TRACK_ID`  
**Features:**
- Play count
- Like count
- Share count
- Creation date
- Duration

**Implementation:** `commands/stats.ts`

#### /remix
**Description:** Create remix variations  
**Usage:** `/remix TRACK_ID`  
**Features:**
- Add vocals
- Add instrumental
- Style variations

**Implementation:** `commands/remix.ts`

#### /stems
**Description:** Separate track into stems  
**Usage:** `/stems TRACK_ID`  
**Features:**
- Stem separation initiation
- Status checking
- Download separated stems

**Implementation:** `commands/stems.ts`

### Audio Processing

#### /upload
**Description:** Upload audio file for processing  
**Usage:** Send audio file to bot  
**Features:**
- Auto-detection of audio messages
- MP3, WAV, OGG support
- Voice message support
- Processing queue

**Implementation:** `commands/upload.ts`, `commands/audio-upload.ts`

#### /recognize
**Description:** Recognize uploaded audio  
**Usage:** Automatic on audio upload  
**Features:**
- Melody recognition
- Style detection
- Chord analysis

**Implementation:** `commands/recognize.ts`

#### /analyze
**Description:** Analyze track with AI  
**Usage:** `/analyze TRACK_ID`  
**Features:**
- Comprehensive audio analysis
- Genre detection
- Mood/energy levels
- Technical details

**Implementation:** `commands/analyze.ts`

#### /guitar
**Description:** Guitar-specific analysis and tools  
**Usage:** `/guitar TRACK_ID`  
**Features:**
- Chord progressions
- Tabs generation
- Guitar tone analysis

**Implementation:** `commands/guitar.ts`

#### /midi
**Description:** MIDI file operations  
**Usage:** `/midi` or send MIDI file  
**Features:**
- MIDI to audio conversion
- MIDI analysis
- MIDI upload

**Implementation:** `commands/midi.ts`

### Studio Features

#### /studio
**Description:** Open stem studio for track mixing  
**Usage:** `/studio TRACK_ID`  
**Features:**
- Multi-track mixing
- Volume controls
- Solo/mute per stem
- Export mixed version

**Implementation:** `commands/studio.ts`

### User Settings

#### /settings
**Description:** User preferences and settings  
**Usage:** `/settings`  
**Features:**
- Notification preferences
- Emoji reactions
- Language settings
- Privacy options

**Implementation:** `commands/settings.ts`

### Information

#### /news
**Description:** Latest updates and news  
**Usage:** `/news`  
**Features:**
- Platform updates
- New features
- Maintenance notices

**Implementation:** `commands/news.ts`

#### /legal
**Description:** Terms of service and privacy policy  
**Usage:** `/legal`  
**Features:**
- Terms of Service
- Privacy Policy
- License information

**Implementation:** `commands/legal.ts`

#### /projects
**Description:** View user projects  
**Usage:** `/projects`  
**Features:**
- Project listing
- Project details
- Track management within projects

**Implementation:** `commands/projects.ts`

## Inline Queries (Enhanced)

### Usage Pattern
Type `@AIMusicVerseBot` followed by a query in any chat.

### Categories

#### Default Search (Public)
**Query:** `@AIMusicVerseBot rock`  
**Description:** Search all public tracks for "rock"  
**Cache:** 2 minutes

#### My Tracks
**Query:** `@AIMusicVerseBot my:rock`  
**Description:** Search user's own tracks  
**Cache:** 30 seconds  
**Auth:** Required

#### Trending
**Query:** `@AIMusicVerseBot trending:`  
**Description:** Show trending tracks (last 7 days)  
**Cache:** 5 minutes

#### New Releases
**Query:** `@AIMusicVerseBot new:`  
**Description:** Tracks from last 24 hours  
**Cache:** 1 minute

#### Featured
**Query:** `@AIMusicVerseBot featured:`  
**Description:** High-quality curated tracks  
**Cache:** 5 minutes

#### Genre Filter
**Query:** `@AIMusicVerseBot genre:jazz`  
**Description:** Filter by specific genre  
**Cache:** 3 minutes  
**Genres:** rock, pop, jazz, electronic, hip-hop, classical, r&b, country, latin, blues, metal, folk

#### Mood Filter
**Query:** `@AIMusicVerseBot mood:chill`  
**Description:** Filter by mood/vibe  
**Cache:** 3 minutes  
**Moods:** happy, sad, chill, energetic, romantic

#### Popular
**Query:** `@AIMusicVerseBot popular`  
**Description:** All-time most popular tracks  
**Cache:** 5 minutes

### Guest Users
Non-authenticated users see:
- Limited public content (10 tracks)
- Login button
- Encouragement to sign up

**Implementation:** `commands/inline-enhanced.ts`, `commands/inline-types.ts`

## Callback Queries (Inline Buttons)

### Navigation
- `nav_main` - Main menu
- `nav_library` - Library view
- `nav_projects` - Projects view
- `nav_settings` - Settings view

### Library Pagination
- `lib_page_N` - Go to library page N
- `project_page_N` - Go to project page N

### Track Actions
- `play_TRACK_ID` - Play track
- `dl_TRACK_ID` - Download track
- `share_TRACK_ID` - Share track
- `like_TRACK_ID` - Like/unlike track
- `lyrics_TRACK_ID` - Show lyrics
- `stats_TRACK_ID` - Show statistics
- `remix_TRACK_ID` - Remix options

### Remix Actions
- `add_vocals_TRACK_ID` - Add vocals to instrumental
- `add_instrumental_TRACK_ID` - Extract instrumental

### Stem Studio
- `studio_TRACK_ID` - Open stem studio
- `separate_stems_TRACK_ID` - Start stem separation
- `download_stems_TRACK_ID` - Download all stems
- `stem_mode_TRACK_ID_MODE` - Change stem mixing mode

### Playlist Actions
- `add_playlist_TRACK_ID` - Show playlist selection
- `playlist_add_PLAYLIST_ID_TRACK_ID` - Add track to playlist
- `playlist_new_TRACK_ID` - Create new playlist with track

### Settings
- `settings_notify_TYPE` - Toggle notification type
- `settings_emoji_TYPE` - Toggle emoji preference

**Implementation:** `handlers/callback.ts`, `handlers/navigation.ts`, `handlers/media.ts`

## Webhooks

### Main Webhook
**URL:** `https://[SUPABASE_URL]/functions/v1/telegram-bot`  
**Method:** POST  
**Allowed Updates:**
- `message` - Text and media messages
- `callback_query` - Inline button presses
- `inline_query` - Inline search queries
- `pre_checkout_query` - Payment validation

**Implementation:** `index.ts`, `bot.ts`

## Rate Limiting

- **Messages:** 20 per minute per user
- **Inline Queries:** Variable cache times per category
- **API Calls:** Telegram API limits apply (30 msgs/sec)

## Error Handling

### User-Facing Errors
- Rate limit exceeded: "⏳ Слишком много запросов"
- Track not found: "❌ Трек не найден"
- Generation failed: "❌ Ошибка генерации"
- Auth required: "🔑 Требуется авторизация"

### Internal Errors
All errors logged to Supabase logs with:
- Error type
- User ID / Chat ID
- Context (command, parameters)
- Stack trace

**Implementation:** `utils/logger.ts`, `utils/error-handler.ts`

## Notifications

### Generation Complete
**Trigger:** Suno task completes  
**Content:**
- Both A/B versions sent
- Cover art included
- Inline buttons (download, share, remix)

**Settings:** `settings_notify_completed`

### Generation Failed
**Trigger:** Suno task fails  
**Content:**
- Error reason
- Retry button
- Support link

**Settings:** `settings_notify_failed`

### Stem Separation Ready
**Trigger:** Stem separation completes  
**Content:**
- Number of stems
- Download buttons
- Open studio button

**Settings:** `settings_notify_stem_ready`

**Implementation:** `supabase/functions/send-telegram-notification/`

## File Handling

### Audio Sending
**Method:** FormData with Blob download  
**Features:**
- Proper track title display in Telegram
- Cover thumbnail attachment
- File ID caching for repeat sends
- Fallback to URL-based sending

**Implementation:** `supabase/functions/suno-send-audio/`

### File ID Caching
**Table:** `tracks.telegram_file_id`  
**Purpose:** Avoid re-uploading same audio  
**Strategy:** Store after first successful send

## Security

### HMAC Validation
Mini App initData validated using:
```typescript
const secretKey = HMACSHA256('WebAppData', BOT_TOKEN)
const dataCheckString = sortAndJoinParams(params)
const hash = HMACSHA256(dataCheckString, secretKey)
```

**Implementation:** `supabase/functions/telegram-auth/`

### Rate Limiting
- Per-user request tracking
- Time window: 60 seconds
- Max requests: 20
- Response: 429 Too Many Requests

### RLS Policies
- User can only access own tracks (unless public)
- Service role for bot operations
- No direct user DB access from bot

## Testing

### Manual Testing Commands
```bash
# Test start command
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
  -d "chat_id=$CHAT_ID&text=/start"

# Test inline query
curl -X POST "https://[SUPABASE_URL]/functions/v1/telegram-bot" \
  -H "Content-Type: application/json" \
  -d '{"inline_query": {"id": "test", "from": {"id": 123}, "query": "rock", "offset": "0"}}'

# Set webhook
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  -d "url=https://[SUPABASE_URL]/functions/v1/telegram-bot" \
  -d "allowed_updates=[\"message\",\"callback_query\",\"inline_query\"]"
```

### Integration Tests
See `tests/telegram-bot/` directory (to be created)

## Monitoring

### Key Metrics
- Message response time
- Inline query latency
- Generation completion rate
- Notification delivery rate
- Error rate by command

### Logging
All bot interactions logged to Supabase with:
- Timestamp
- User ID / Chat ID
- Command / Query
- Response time
- Success / Error

**Implementation:** `utils/logger.ts`, `utils/metrics.ts`

## Configuration

### Environment Variables
```bash
TELEGRAM_BOT_TOKEN=        # Bot API token
MINI_APP_URL=              # Mini App URL
SUPABASE_URL=              # Database URL
SUPABASE_SERVICE_ROLE_KEY= # Admin key
```

### Bot Settings (@BotFather)
- Name: MusicVerse AI
- Username: @AIMusicVerseBot
- Description: AI-powered music creation platform
- About: Create music with Suno AI v5
- Commands: Auto-generated from this list
- Inline Mode: Enabled
- Inline Feedback: 100%
- Payments: Telegram Stars enabled

## Troubleshooting

### Common Issues

**Issue:** Bot not responding  
**Solution:** Check webhook status, verify environment variables

**Issue:** Inline queries return no results  
**Solution:** Check database migration applied, verify RLS policies

**Issue:** Audio files not playing in Telegram  
**Solution:** Verify audio_url is valid, check FormData implementation

**Issue:** Notifications not sending  
**Solution:** Check user settings, verify chat is not blocked

### Debug Commands
```bash
# Check webhook info
curl "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"

# Check bot info
curl "https://api.telegram.org/bot$BOT_TOKEN/getMe"

# Delete webhook (for local testing)
curl "https://api.telegram.org/bot$BOT_TOKEN/deleteWebhook"
```

## References

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Inline Mode](https://core.telegram.org/bots/inline)
- [Telegram Payments](https://core.telegram.org/bots/payments)
- [Mini App SDK](https://core.telegram.org/bots/webapps)

---

**Last Updated:** 2025-12-16  
**Maintainer:** Development Team  
**Version:** 2.0 (Enhanced Inline Mode)
