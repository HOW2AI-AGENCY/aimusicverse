# Edge Functions Audit Report

**Date:** 2025-12-17
**Total Functions:** 87

## Function Categories

### 1. Music Generation (Suno) - 18 functions
| Function | Purpose | Dependencies |
|----------|---------|--------------|
| `suno-music-generate` | **PRIMARY** - Full generation with credits, fallback | suno-music-callback |
| `suno-generate` | Legacy multi-action endpoint | - |
| `suno-music-callback` | Handles completion callback | - |
| `suno-music-extend` | Extend existing tracks | suno-music-callback |
| `suno-cover-callback` | Cover completion callback | - |
| `suno-replace-section` | Section replacement | suno-music-callback |
| `suno-remix` | Remix generation | suno-music-callback |
| `suno-add-vocals` | Add vocals to instrumental | suno-vocal-callback |
| `suno-add-instrumental` | Add instrumental parts | - |
| `suno-separate-vocals` | Stem separation | suno-vocal-callback |
| `suno-boost-style` | Enhance style prompt | - |
| `suno-generate-cover-image` | Album art generation | - |
| `suno-generate-video` | Music video generation | suno-video-callback |
| `suno-convert-wav` | Audio format conversion | suno-wav-callback |
| `suno-upload-cover` | Upload for cover gen | - |
| `suno-upload-extend` | Upload for extend | - |
| `suno-send-audio` | Send audio to Telegram | - |
| `suno-credits` | Check Suno API credits | - |
| `suno-check-status` | Poll task status | - |

### 2. Audio Analysis - 6 functions
| Function | Purpose | AI Provider |
|----------|---------|-------------|
| `analyze-audio` | Comprehensive with transcription | fal.ai + Lovable AI |
| `analyze-audio-flamingo` | Audio Flamingo 3 analysis | Replicate |
| `analyze-music-emotion` | Arousal/valence analysis | Replicate |
| `analyze-track-context` | Track context for Studio | Lovable AI |
| `analyze-long-prompt` | Long prompt optimization | Lovable AI |
| `replicate-music-analysis` | Generic Replicate analysis | Replicate |

### 3. Transcription & Recognition - 5 functions
| Function | Purpose |
|----------|---------|
| `transcribe-lyrics` | Speech-to-text for lyrics |
| `transcribe-midi` | Audio to MIDI conversion |
| `recognize-music` | AudD music recognition |
| `recognize-lyrics` | Lyrics recognition |
| `speech-to-text` | General speech transcription |

### 4. Image Generation - 6 functions
| Function | Purpose | Provider |
|----------|---------|----------|
| `generate-cover-image` | Track cover art | Stability AI |
| `generate-profile-image` | Profile avatars/banners | Lovable AI |
| `generate-artist-portrait` | AI artist portraits | Lovable AI |
| `generate-blog-cover` | Blog post covers | Lovable AI |
| `generate-playlist-cover` | Playlist artwork | Stability AI |
| `generate-project-media` | Project assets | Stability AI |

### 5. Telegram Bot - 7 functions
| Function | Purpose |
|----------|---------|
| `telegram-bot` | Main bot handler |
| `telegram-auth` | Authentication flow |
| `telegram-webhook-setup` | Webhook configuration |
| `send-telegram-notification` | Push notifications |
| `send-admin-message` | Admin messages |
| `broadcast-notification` | Bulk notifications |
| `bot-api` | Bot API utilities |

### 6. Payments (Stars) - 5 functions
| Function | Purpose |
|----------|---------|
| `create-stars-invoice` | Generate payment invoice |
| `stars-webhook` | Payment webhook handler |
| `stars-subscription-check` | Check subscription status |
| `stars-admin-stats` | Payment statistics |
| `stars-admin-refund` | Refund processing |
| `stars-admin-transactions` | Transaction history |

### 7. AI Assistants - 4 functions
| Function | Purpose |
|----------|---------|
| `ai-lyrics-assistant` | Lyrics generation chat |
| `ai-lyrics-edit` | Lyrics editing |
| `ai-blog-assistant` | Blog content generation |
| `project-ai` | Project AI actions |
| `project-ai-actions` | Extended project AI |

### 8. Audio Processing - 5 functions
| Function | Purpose |
|----------|---------|
| `process-audio-pipeline` | Full audio analysis pipeline |
| `generate-sfx` | Sound effects generation |
| `musicgen-generate` | MusicGen generation |
| `detect-beats` | Beat detection |
| `klangio-analyze` | Klangio transcription |

### 9. Content & Moderation - 3 functions
| Function | Purpose |
|----------|---------|
| `moderate-content` | Content moderation |
| `correct-text` | Text correction |
| `parse-track-tags` | Tag parsing |

### 10. System & Maintenance - 8 functions
| Function | Purpose |
|----------|---------|
| `health-check` | Service health monitoring |
| `health-alert` | Alert notifications |
| `cleanup-stale-tasks` | Stale task cleanup |
| `cleanup-orphaned-data` | Orphaned data cleanup |
| `archive-old-activities` | Archive old records |
| `retry-failed-tasks` | Retry failed generations |
| `sync-stale-tasks` | Sync stuck tasks |
| `sync-suno-tags` | Sync Suno tags |

### 11. Other - 8 functions
| Function | Purpose |
|----------|---------|
| `create-notification` | Create notifications |
| `download-track` | Track download |
| `generate-lyrics` | Direct lyrics generation |
| `get-timestamped-lyrics` | Timestamped lyrics |
| `lyrics-callback` | Lyrics callback |
| `melody-to-tags` | Melody analysis to tags |
| `reward-action` | Gamification rewards |
| `stability-audio-cover` | Stability Audio cover |

## Consolidation Recommendations

### High Priority
1. **Merge `suno-generate` into `suno-music-generate`** - Legacy code, overlapping functionality
2. **Consolidate callbacks** - Create unified callback handler for suno-*-callback functions

### Medium Priority
3. **Merge analysis functions** - Create `analyze-audio-unified` with provider selection
4. **Consolidate image generators** - Single `generate-image` with type parameter

### Low Priority
5. **Combine cleanup functions** - Single maintenance function with action parameter

## Usage Statistics (from api_usage_logs)
- Most called: `suno-music-generate`, `analyze-audio-flamingo`, `telegram-bot`
- Rarely used: `suno-generate` (legacy), `replicate-music-analysis`

## Security Notes
- All functions use proper auth headers
- Service role key only used where necessary
- User credit validation in place for generation functions
