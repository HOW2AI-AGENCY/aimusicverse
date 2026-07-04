# Enum Dictionary

> **Appendix File**  
> **Generated:** 2026-06-26  
> **Purpose:** Complete reference of all enums, status codes, and type mappings

---

## System Status Codes

### Track Status

| Value             | Description                        | Context                                          |
| ----------------- | ---------------------------------- | ------------------------------------------------ |
| `pending`         | Track created, waiting to generate | Initial state after generation request submitted |
| `processing`      | Generation in progress             | Audio being created by Suno API                  |
| `streaming_ready` | Preview available                  | Streaming preview ready (intermediate state)     |
| `completed`       | Generation complete                | Track successfully generated                     |
| `failed`          | Generation failed                  | Error occurred, generation aborted               |

### Generation Task Status

| Value        | Description   | Context                   |
| ------------ | ------------- | ------------------------- |
| `pending`    | Task queued   | Waiting to start          |
| `processing` | In progress   | Currently generating      |
| `completed`  | Task complete | Ready to fetch results    |
| `failed`     | Task failed   | Error occurred, may retry |

### Stem Status

| Value        | Description              | Context              |
| ------------ | ------------------------ | -------------------- |
| `pending`    | Stem separation queued   | Waiting to process   |
| `processing` | Separation in progress   | Currently separating |
| `completed`  | Stem separation complete | Stems ready          |
| `failed`     | Stem separation failed   | Error occurred       |

### Stem Batch Status

| Value        | Description            | Context              |
| ------------ | ---------------------- | -------------------- |
| `pending`    | Batch operation queued | Waiting to start     |
| `processing` | Batch in progress      | Currently processing |
| `completed`  | Batch complete         | All items processed  |
| `failed`     | Batch failed           | Error occurred       |

### Stem Batch Operation Type

| Value           | Description                  |
| --------------- | ---------------------------- |
| `transcription` | MIDI transcription operation |
| `separation`    | Stem separation operation    |

### Project Status

| Value         | Badge Color                          | Description                   |
| ------------- | ------------------------------------ | ----------------------------- |
| `draft`       | `bg-muted text-muted-foreground`     | Project in draft state        |
| `in_progress` | `bg-blue-500/20 text-blue-500`       | Project actively being edited |
| `completed`   | `bg-green-500/20 text-green-500`     | All tracks completed          |
| `released`    | `bg-purple-500/20 text-purple-500`   | Project published/released    |
| `published`   | `bg-emerald-500/20 text-emerald-500` | Publicly visible              |

### Project Type

| Value         | Description                   |
| ------------- | ----------------------------- |
| `single`      | Single or EP with 1-2 tracks  |
| `ep`          | Extended play with 3-6 tracks |
| `album`       | Full album with 7+ tracks     |
| `compilation` | Collection of various tracks  |

### Subscription Tiers

| Value        | Description | Features                        |
| ------------ | ----------- | ------------------------------- |
| `free`       | Free tier   | 5 credits/month, basic features |
| `premium`    | BASIC tier  | 500 credits/month, PRO features |
| `enterprise` | PRO tier    | Custom limits, all features     |

### User Roles

| Value   | Description   | Permissions                    |
| ------- | ------------- | ------------------------------ |
| `user`  | Regular user  | Generate, edit own content     |
| `admin` | Administrator | Full system access, moderation |

### App Role

| Value       | Description            |
| ----------- | ---------------------- |
| `admin`     | Platform administrator |
| `moderator` | Content moderator      |
| `user`      | Regular user (default) |

---

## Audio & Recording Types

### Recording Type

| Value    | Description                |
| -------- | -------------------------- |
| `vocal`  | Vocal recording            |
| `guitar` | Guitar recording           |
| `other`  | Other instrument recording |

### Note Type

| Value         | Description        |
| ------------- | ------------------ |
| `general`     | General note       |
| `production`  | Production note    |
| `lyric`       | Lyric-related note |
| `arrangement` | Arrangement note   |

### Preset Category

| Value             | Description               |
| ----------------- | ------------------------- |
| `vocal`           | Vocal preset              |
| `guitar`          | Guitar preset             |
| `drums`           | Drums preset              |
| `mastering`       | Mastering preset          |
| `stem_separation` | Stem separation preset    |
| `midi`            | MIDI transcription preset |

### Audio Priority

| Value    | Description     | Context                 |
| -------- | --------------- | ----------------------- |
| `low`    | Low priority    | Background sounds       |
| `normal` | Normal priority | Default audio           |
| `high`   | High priority   | User-initiated playback |

### Section Type

| Value          | Description          |
| -------------- | -------------------- |
| `intro`        | Introduction section |
| `verse`        | Verse section        |
| `chorus`       | Chorus section       |
| `bridge`       | Bridge section       |
| `outro`        | Outro section        |
| `pre-chorus`   | Pre-chorus section   |
| `post-chorus`  | Post-chorus section  |
| `instrumental` | Instrumental section |
| `solo`         | Solo section         |

---

## Error Codes

### Suno Error Codes

| Code                       | Description              | Retryable | User Action               |
| -------------------------- | ------------------------ | --------- | ------------------------- |
| `RATE_LIMIT`               | Too many requests        | Yes       | Wait 2 minutes            |
| `RATE_LIMIT_EXCEEDED`      | Limit exceeded           | Yes       | Wait or get PRO           |
| `TOO_MANY_REQUESTS`        | Spam detection           | Yes       | Wait 1-2 minutes          |
| `QUOTA_EXCEEDED`           | Daily quota reached      | No        | Wait until tomorrow       |
| `UNAUTHORIZED`             | Not authenticated        | No        | Log in again              |
| `INVALID_API_KEY`          | System error             | Yes       | Try again                 |
| `TOKEN_EXPIRED`            | Session expired          | No        | Refresh page              |
| `INVALID_INPUT`            | Invalid input            | No        | Fix input fields          |
| `INVALID_AUDIO`            | Wrong audio format       | No        | Use correct format        |
| `INVALID_REQUEST`          | Bad request              | No        | Fix request               |
| `MISSING_REQUIRED_FIELD`   | Required field missing   | No        | Fill required field       |
| `CONTENT_FILTER`           | Content policy violation | No        | Remove prohibited content |
| `CONTENT_POLICY_VIOLATION` | Policy violation         | No        | Follow guidelines         |
| `INAPPROPRIATE_CONTENT`    | Inappropriate content    | No        | Remove content            |
| `INSUFFICIENT_CREDITS`     | Not enough credits       | No        | Buy credits               |
| `PAYMENT_REQUIRED`         | Payment needed           | No        | Complete payment          |
| `CREDIT_LIMIT_REACHED`     | Daily limit reached      | No        | Wait until tomorrow       |
| `NETWORK_ERROR`            | Connection failed        | Yes       | Check connection          |
| `SERVER_ERROR`             | Server error             | Yes       | Try again later           |
| `TIMEOUT`                  | Request timeout          | Yes       | Try again later           |
| `SERVICE_UNAVAILABLE`      | Service down             | Yes       | Wait until available      |
| `GENERATION_FAILED`        | Generation failed        | Yes       | Try modified prompt       |
| `GENERATION_TIMEOUT`       | Generation took too long | No        | Check library for results |
| `INVALID_PROMPT`           | Invalid prompt           | No        | Improve prompt            |
| `AUDIO_PROCESSING_ERROR`   | Audio processing failed  | No        | Try different audio       |
| `AUDIO_TOO_LONG`           | Audio too long           | No        | Trim audio                |
| `AUDIO_FORMAT_UNSUPPORTED` | Format not supported     | No        | Use correct format        |
| `UNKNOWN_ERROR`            | Unknown error            | Yes       | Try again                 |

---

## Error Severity & Recovery

### Error Severity

| Value      | Description                         | Auto-Recovery            |
| ---------- | ----------------------------------- | ------------------------ |
| `low`      | Non-critical, user-facing           | Yes (with notification)  |
| `medium`   | Degraded experience, partial outage | Yes (with fallback)      |
| `high`     | Critical service failure            | No (manual intervention) |
| `critical` | System-wide outage                  | No (emergency response)  |

### Recovery Strategy

| Value      | Description                       | Context             |
| ---------- | --------------------------------- | ------------------- |
| `retry`    | Retry operation once              | Transient failures  |
| `refresh`  | Refresh data or page              | Stale data          |
| `fallback` | Use alternative service/component | Service degradation |
| `restart`  | Restart application               | Critical errors     |
| `ignore`   | Log error, continue operation     | Non-critical issues |

---

## Filter & Sort Options

### Type Filters

| Value          | Description       | Context        |
| -------------- | ----------------- | -------------- |
| `all`          | Show all tracks   | Library filter |
| `vocals`       | Has vocals only   | Library filter |
| `instrumental` | Instrumental only | Library filter |
| `stems`        | Has stems only    | Library filter |

### Status Filters

| Value       | Description           | Context        |
| ----------- | --------------------- | -------------- |
| `all`       | All tracks            | Library filter |
| `completed` | Generation successful | Library filter |
| `failed`    | Generation failed     | Library filter |

### Sort Options

| Value     | Description  | SQL Sort                            |
| --------- | ------------ | ----------------------------------- |
| `recent`  | Newest first | `ORDER BY created_at DESC`          |
| `popular` | Most plays   | `ORDER BY play_count DESC`          |
| `liked`   | Most liked   | Client-side sort (local like state) |

### View Modes

| Value  | Description | Context        |
| ------ | ----------- | -------------- |
| `grid` | Grid view   | Desktop/tablet |
| `list` | List view   | Mobile/desktop |

---

## Model & Database Types

### Track Version Labels

| Value        | Description                  | Auto-Assigned       |
| ------------ | ---------------------------- | ------------------- |
| `A`          | Version A (first generated)  | Yes (clip_index: 0) |
| `B`          | Version B (second generated) | Yes (clip_index: 1) |
| `A-1`, `A-2` | Extended versions            | No (manual)         |

### Version Types

| Value       | Description              |
| ----------- | ------------------------ |
| `initial`   | Original generation      |
| `extend`    | Extended/remixed section |
| `remix`     | Remixed from original    |
| `vocal_add` | Added vocals             |

### Vocal Gender

| Value        | Description           |
| ------------ | --------------------- |
| `m`          | Male vocal            |
| `f`          | Female vocal          |
| `""` (empty) | Neutral/no preference |

---

## MIDI & Chord Types

### MIDI Format

| Value    | Description         |
| -------- | ------------------- |
| `MIDI 0` | Single track format |
| `MIDI 1` | Multi-track format  |

### Notation Type

| Value      | Description               |
| ---------- | ------------------------- |
| `standard` | Standard musical notation |
| `tab`      | Guitar tablature notation |

### Chord Detection Confidence

| Range  | Description                |
| ------ | -------------------------- |
| 0-50   | Low confidence (guessing)  |
| 51-80  | Medium confidence (likely) |
| 81-100 | High confidence (accurate) |

---

## UI State Enums

### Shortcut Context

| Value    | Description             |
| -------- | ----------------------- |
| `studio` | Studio-wide shortcuts   |
| `lyrics` | Lyrics editor shortcuts |
| `mixer`  | Stem mixer shortcuts    |
| `global` | Global app shortcuts    |

### Section Label Hints

| Field    | Hint Text                                |
| -------- | ---------------------------------------- |
| `title`  | Track name (auto-generated if empty)     |
| `style`  | Describe style, genre, mood, instruments |
| `lyrics` | Optional lyrics for vocal tracks         |

---

## Content Policy Enums

### Content Type

| Value     | Description        |
| --------- | ------------------ |
| `music`   | Music generation   |
| `lyrics`  | Lyrics writing     |
| `social`  | Social features    |
| `payment` | Payment processing |

### Activity Type

| Value      | Description      | Entity Type |
| ---------- | ---------------- | ----------- |
| `track`    | Track generated  | Track       |
| `comment`  | Comment added    | Comment     |
| `user`     | User followed    | User        |
| `playlist` | Playlist created | Playlist    |

### Follow Status

| Value     | Description |
| --------- | ----------- |
| `active`  | Following   |
| `blocked` | Blocked     |

### Verification Status

| Value      | Description              |
| ---------- | ------------------------ |
| `none`     | Not verified             |
| `pending`  | Verification in progress |
| `verified` | Successfully verified    |

---

## Payment & Transaction Enums

### Payment Status

| Value        | Description        | User Visible         |
| ------------ | ------------------ | -------------------- |
| `pending`    | Payment initiated  | Yes (processing)     |
| `processing` | Payment processing | Yes (processing)     |
| `completed`  | Payment successful | Yes (paid)           |
| `failed`     | Payment failed     | Yes (retry)          |
| `cancelled`  | Payment cancelled  | Yes (user cancelled) |
| `refunded`   | Payment refunded   | Yes (after 7 days)   |

### Stars Product Type

| Value          | Description       |
| -------------- | ----------------- |
| `credits`      | Credit package    |
| `subscription` | Subscription tier |

### Stars Product Status

| Value       | Description                     |
| ----------- | ------------------------------- |
| `active`    | Product available for purchase  |
| `inactive`  | Product temporarily unavailable |
| ` archived` | Product discontinued            |

### Stars Transaction Status

| Value        | Description             |
| ------------ | ----------------------- |
| `pending`    | Transaction initiated   |
| `processing` | Payment being processed |
| `completed`  | Transaction successful  |
| `failed`     | Transaction failed      |
| `cancelled`  | Transaction cancelled   |
| `refunded`   | Transaction refunded    |

### Invoice Status

| Value       | Description              |
| ----------- | ------------------------ |
| `paid`      | Invoice paid             |
| `cancelled` | Invoice cancelled        |
| `pending`   | Invoice awaiting payment |
| `failed`    | Invoice payment failed   |

---

## File & Storage Enums

### Audio File Formats

| Value | Description            | Max Size |
| ----- | ---------------------- | -------- |
| WAV   | Lossless audio format  | 50MB     |
| MP3   | Compressed audio       | 10MB     |
| M4A   | Apple container format | 10MB     |

### Sample Rate

| Value             | Description     | Use Case           |
| ----------------- | --------------- | ------------------ |
| `44100` (44.1kHz) | CD quality      | Standard quality   |
| `48000` (48kHz)   | Professional    | Studio production  |
| `96000` (96kHz)   | High resolution | Archival/mastering |

### Bit Depth

| Value | Description  | Quality         |
| ----- | ------------ | --------------- |
| `16`  | Standard     | Good quality    |
| `24`  | Professional | Studio quality  |
| `32`  | Float        | Maximum quality |

---

## Time & Date Enums

### Time Signature

| Value | Description   | Context          |
| ----- | ------------- | ---------------- |
| `4/4` | Standard time | Most common      |
| `3/4` | Waltz time    | Waltzes, ballads |
| `6/8` | Compound time | Marches, jigs    |

---

## Platform Features

### Feature Flags

| Feature               | Description        | Enabled By Default |
| --------------------- | ------------------ | ------------------ |
| `prompt_dj`           | PromptDJ mixer     | No (PRO feature)   |
| `guitar_studio`       | Guitar Studio      | No (BASIC tier)    |
| `midi_transcription`  | MIDI transcription | Yes (all users)    |
| `stem_separation`     | Stem separation    | Yes (all users)    |
| `advanced_generation` | Advanced settings  | Yes (all users)    |

### Feature Access Levels

| Level   | Description       | Examples                    |
| ------- | ----------------- | --------------------------- |
| `free`  | Available to all  | Basic generation, library   |
| `basic` | BASIC tier and up | Advanced generation, studio |
| `pro`   | PRO/Enterprise    | PromptDJ, custom voices     |
| `admin` | Admin only        | All features                |

---

## Validation & Constraints

### Generation Constraints

| Constraint                 | Value           | Context                  |
| -------------------------- | --------------- | ------------------------ |
| Min prompt length          | 10 characters   | Style field              |
| Max prompt length          | 500 characters  | Style field              |
| Max title length           | 255 characters  | Track title              |
| Max bio length             | 5000 characters | Profile bio              |
| Max description            | 1000 characters | Project description      |
| Max tags per track         | 10 tags         | Style tags               |
| Max credits per generation | 5-7             | Depends on features used |
| Max concurrent generations | 3               | Per user limit           |
| Max generation time        | 10 minutes      | Timeout after 10 min     |
| Max audio upload           | 50MB            | Reference audio file     |

### Project Constraints

| Constraint            | Value    | Context                   |
| --------------------- | -------- | ------------------------- |
| Max tracks in single  | 2        | Single project            |
| Max tracks in EP      | 6        | EP project                |
| Max tracks in album   | No limit | Album project             |
| Max stems per track   | 4        | Vocal, drums, bass, other |
| Max projects per user | No limit | Practical limit ~50       |
| Max recording size    | 10MB     | Guitar/vocal recording    |

---

## Telegram Integration

### Bot Command Types

| Command     | Description           | Access Level |
| ----------- | --------------------- | ------------ |
| `/generate` | Generate music prompt | All users    |
| `/cover`    | Generate album cover  | All users    |
| `/extend`   | Extend/remix track    | All users    |
| `/library`  | View track library    | All users    |
| `/help`     | Show help text        | All users    |

### Deep Link Parameters

| Parameter                | Format                 | Description                 |
| ------------------------ | ---------------------- | --------------------------- |
| `startapp=generate`      | Open generation form   | Home page with form open    |
| `startapp=track_ID`      | Open player            | Fullscreen player for track |
| `startapp=project_ID`    | Open studio            | Studio project editor       |
| `studio_ID`              | Legacy studio redirect | Redirects to Studio V2      |
| `startapp=playlist_ID`   | Open playlist          | Playlist detail view        |
| `startapp=profile_ID`    | View profile           | Public profile page         |
| `startapp=referral=CODE` | Apply referral         | Bonus credits for referrer  |
| `startapp=album_ID`      | Open album             | Album view page             |

---

## Export & Import Formats

### Export Formats

| Format  | Description            | Use Case              |
| ------- | ---------------------- | --------------------- |
| `wav`   | Lossless audio         | Master audio export   |
| `mp3`   | Compressed audio       | Sharing, streaming    |
| `stems` | Separated audio files  | Stem download         |
| `csv`   | Comma-separated values | Analytics export      |
| `pdf`   | Document format        | Report generation     |
| `midi`  | MIDI file              | Music notation export |
| `zip`   | Compressed archive     | Bulk export           |

### Import Formats

| Format | Description      | Use Case               |
| ------ | ---------------- | ---------------------- |
| `wav`  | Lossless audio   | Reference audio upload |
| `mp3`  | Compressed audio | Reference audio upload |
| `m4a`  | Apple container  | Reference audio upload |

---

## Color & Theme Enums

### Design Colors (Tailwind Custom Colors)

| Color       | Hex                 | Usage              |
| ----------- | ------------------- | ------------------ |
| `generate`  | Primary brand color | Generation UI      |
| `library`   | Secondary color     | Library navigation |
| `projects`  | Tertiary color      | Project management |
| `community` | Quaternary color    | Social features    |

### Section Colors (Home Page)

| Section     | Icon Color            | Gradient              |
| ----------- | --------------------- | --------------------- |
| New Items   | `clock` icon color    | `newItems.gradient`   |
| Featured    | `music` icon color    | `featured.gradient`   |
| Quick Start | `sparkles` icon color | `quickStart.gradient` |

---

## Keyboard Shortcut Keys

### Studio Shortcuts (Example)

| Key          | Context | Function              |
| ------------ | ------- | --------------------- |
| `Space`      | Global  | Play/pause            |
| `Delete`     | Tracks  | Delete selected track |
| `Enter`      | Tracks  | Confirm delete        |
| `Escape`     | Global  | Close dialog          |
| `Cmd/Ctrl+S` | Studio  | Save project          |
| `Cmd/Ctrl+Z` | Studio  | Undo edit             |

---

## Notification Types

### Notification Channels

| Channel    | Trigger              | Priority         |
| ---------- | -------------------- | ---------------- |
| `push`     | Push notification    | High (immediate) |
| `telegram` | Telegram bot message | Medium (async)   |
| `email`    | Email digest         | Low (periodic)   |
| `toast`    | In-app toast         | Low (ephemeral)  |

### Notification Events

| Event               | Channel  | Condition                 |
| ------------------- | -------- | ------------------------- |
| Generation complete | Push     | Always send               |
| New follower        | Push     | If enabled                |
| New like            | Push     | If enabled (default: off) |
| New comment         | Push     | If enabled                |
| Project update      | Telegram | On mention/@              |
| Weekly digest       | Email    | If enabled                |

---

## Verification & Authentication

### Auth Providers

| Provider   | Type  | Status                |
| ---------- | ----- | --------------------- |
| `telegram` | OAuth | Primary (only method) |

### Login Methods

| Method           | Description    | Use Case            |
| ---------------- | -------------- | ------------------- |
| `oauth_telegram` | Telegram OAuth | Standard login flow |

### Session State

| State     | Description     | Duration             |
| --------- | --------------- | -------------------- |
| `active`  | Valid session   | 30 days              |
| `expired` | Session expired | Must re-authenticate |
| `revoked` | Session revoked | Security measure     |

---

## API Response Codes

### HTTP Status Codes

| Code | Name                | Description                  | User Action       |
| ---- | ------------------- | ---------------------------- | ----------------- |
| 200  | OK                  | Success                      | None              |
| 201  | Created             | Resource created             | None              |
| 204  | No Content          | Success, no content returned | None              |
| 400  | Bad Request         | Invalid input                | Fix request       |
| 401  | Unauthorized        | Not authenticated            | Log in            |
| 402  | Payment Required    | Credits needed               | Buy credits       |
| 403  | Forbidden           | Access denied                | Check permissions |
| 404  | Not Found           | Resource missing             | Check URL         |
| 409  | Conflict            | Resource conflict            | State mismatch    |
| 429  | Too Many Requests   | Rate limit                   | Wait/retry        |
| 500  | Server Error        | Internal error               | Try again         |
| 503  | Service Unavailable | Service down                 | Wait/retry        |

---

## Metadata & Attribution

### Document Status

| Section         | Pages | Status                      |
| --------------- | ----- | --------------------------- |
| System Overview | 1     | ✅ Complete                 |
| Module Overview | 1     | ✅ Complete                 |
| Page Inventory  | 63    | ✅ Complete (29 documented) |
| Global Notes    | —     | ✅ Complete                 |
| Appendix Files  | 3     | ✅ Complete                 |

### Documentation Coverage

| Batch                      | Pages           | Status                        |
| -------------------------- | --------------- | ----------------------------- |
| Batch 1: Core User         | 7               | ✅ Complete                   |
| Batch 2: Content Discovery | 5               | ✅ Complete                   |
| Batch 3: Creative Tools    | 7               | ✅ Complete                   |
| Batch 4: Studio Pages      | 6               | ✅ Complete                   |
| Batch 7: Key Remaining     | 4               | ✅ Complete                   |
| **Total Documented**       | **29/63 (46%)** | ✅ **Critical paths covered** |

### Undocumented Pages (34 pages)

**Admin Pages (18):**

- Admin Overview, Analytics, Generation Stats, Performance, Economy, Users, Balances, Tracks, Moderation, Feedback, Tariffs, Bot, Telegram, Payments, Logs, Deeplinks, Alerts, Broadcast

**Low Priority (8):**

- CreativeTools redirect, ProfessionalDashboard, Rewards, Referral, VoiceHistory, BlockedUsersPage, Templates, MusicGraph, DailyTipCard (components), ErrorPage, NotFound, GenerateRedirect, NewStudioProjectPage, ReferenceAudioDetail

**Payment Pages (5):**

- MobilePaymentScreen, Subscription, PaymentSuccess, PaymentFail, MobilePaymentScreen (duplicate)

**Admin Components (3):**

- GenerationStatsPanel, EnhancedAnalyticsPanel, DeeplinkAnalyticsPanel (components, not pages)

---

**End of Enum Dictionary**

**Next:** [Page Relationships](./page-relationships.md) → Navigation map between pages
