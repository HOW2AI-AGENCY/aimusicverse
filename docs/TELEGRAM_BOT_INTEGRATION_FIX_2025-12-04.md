# Telegram Bot Integration Fix - December 4, 2025

## Summary

This document details the comprehensive audit and fixes applied to the Telegram bot integration to resolve issues with notifications, track naming, and deep links.

## Issues Identified and Fixed

### 1. ❌ Only 1 Track Version Sent Instead of 2 → ✅ FIXED

**Problem:**
- Suno AI generates 2 track versions (A and B) but users only received 1 notification
- `suno-music-callback` only sent the first clip's data
- Users missed out on comparing alternative versions

**Solution:**
- Modified `suno-music-callback/index.ts` to loop through clips and send up to 2 versions
- Each version is sent as a separate message with proper labeling
- Added 1-second delay between messages to avoid Telegram API rate limiting
- Version labels (A, B) are appended to track titles
- Updated `sync-stale-tasks` to follow the same pattern

**Technical Details:**
```typescript
const maxClipsToSend = Math.min(clips.length, 2);
for (let i = 0; i < maxClipsToSend; i++) {
  const versionLabel = ['A', 'B'][i];
  const titleWithVersion = `${trackTitle} (версия ${versionLabel})`;
  // Send notification with version info
}
```

### 2. ❌ Tracks Don't Have Readable Names → ✅ FIXED

**Problem:**
- Tracks were showing generic names like "Трек", "Untitled", or raw prompt text
- Title generation logic was too simplistic
- Users couldn't distinguish tracks easily

**Solution:**
- Implemented smart title fallback chain:
  1. Use clip title from Suno API if available
  2. Use track title from database
  3. Extract and clean first line from prompt (remove "create", "generate" prefixes)
  4. Fallback to "AI Music Track"
- Limit titles to 60 characters for readability
- Remove technical prefixes automatically

**Technical Details:**
```typescript
let trackTitle = clip.title || trackData?.title;
if (!trackTitle || trackTitle === 'Untitled' || trackTitle === 'Трек') {
  const promptLines = (task.prompt || '').split('\n').filter(line => line.trim().length > 0);
  trackTitle = promptLines.length > 0 
    ? promptLines[0].substring(0, 60).trim() 
    : 'AI Music Track';
  trackTitle = trackTitle.replace(/^(create|generate|make)\s+/i, '');
}
```

### 3. ❌ Deep Links Not Working Properly → ✅ FIXED

**Problem:**
- Multiple files had hardcoded deep link URLs
- No centralized configuration
- Difficult to change bot username or app name
- Inconsistent format across codebase

**Solution:**
- Created centralized configuration in `_shared/telegram-config.ts`
- Environment variables for flexibility:
  - `TELEGRAM_BOT_USERNAME` (default: "AIMusicVerseBot")
  - `TELEGRAM_APP_SHORT_NAME` (default: "app")
  - `MINI_APP_URL` (for web_app buttons)
- Updated all edge functions to use centralized config
- Proper deep link format: `https://t.me/{BOT_USERNAME}/{APP_SHORT_NAME}?startapp={param}`

**Files Updated:**
- `supabase/functions/_shared/telegram-config.ts` (NEW)
- `supabase/functions/send-telegram-notification/index.ts`
- `supabase/functions/suno-send-audio/index.ts`
- `supabase/functions/telegram-bot/config.ts`
- `supabase/functions/telegram-bot/commands/inline.ts`
- `supabase/functions/telegram-bot/commands/share.ts`
- `supabase/functions/telegram-bot/commands/remix.ts`
- `supabase/functions/telegram-bot/commands/studio.ts`
- `supabase/functions/telegram-bot/commands/playlist.ts`

### 4. ⚠️ Sync Tasks Using Old Notification Format → ✅ FIXED

**Problem:**
- `sync-stale-tasks` was sending notifications with old format
- Missing metadata like `versionsCount`, `versionLabel`
- Not using `type: 'generation_complete'`

**Solution:**
- Updated to use same notification format as callback
- Send both versions with proper metadata
- Include version labels and counts

## Environment Variables

Add these to your Supabase Edge Functions secrets:

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_BOT_USERNAME=AIMusicVerseBot
TELEGRAM_APP_SHORT_NAME=app
MINI_APP_URL=https://t.me/AIMusicVerseBot/app

# Supabase Configuration (already configured)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Suno API (already configured)
SUNO_API_KEY=your_suno_api_key
```

## Deep Link Format

The correct Telegram Mini App deep link format is:

```
https://t.me/{BOT_USERNAME}/{APP_SHORT_NAME}?startapp={param}
```

Examples:
- Track: `https://t.me/AIMusicVerseBot/app?startapp=track_abc123`
- Project: `https://t.me/AIMusicVerseBot/app?startapp=project_xyz789`
- Generate with style: `https://t.me/AIMusicVerseBot/app?startapp=generate_ambient`

The `start_param` is automatically extracted by Telegram and passed to the Mini App via:
```javascript
webApp.initDataUnsafe.start_param
```

## Frontend Deep Link Handling

The frontend already handles deep links correctly in `src/contexts/TelegramContext.tsx`:

```typescript
const startParam = webApp?.initDataUnsafe?.start_param;
if (startParam?.startsWith('track_')) {
  const trackId = startParam.replace('track_', '');
  navigate(`/library?track=${trackId}`);
}
```

Supported deep link parameters:
- `track_{id}` → Navigate to track in library
- `project_{id}` → Navigate to project details
- `generate_{style}` → Open generate page with pre-filled style
- `studio_{id}` → Open stem studio for track
- `remix_{id}` → Open remix page for track
- `lyrics_{id}` → View lyrics for track
- `share_{id}` → Open track with share dialog
- `stats_{id}` → View track statistics

## Notification Payload Structure

The updated notification payload includes:

```typescript
{
  type: 'generation_complete',
  chatId: number,
  trackId: string,
  audioUrl: string,
  coverUrl?: string,
  title: string,
  duration: number,
  tags?: string,
  style?: string,
  versionsCount: number,
  versionLabel: string,  // 'A', 'B', 'C', etc.
  currentVersion: number, // 1, 2, 3, etc.
  totalVersions: number   // 2 (typically)
}
```

## Testing Checklist

- [ ] Generate a track and verify both versions are sent to Telegram
- [ ] Check that track titles are readable and meaningful
- [ ] Click deep links from notifications and verify they open in Mini App
- [ ] Test deep links from inline sharing
- [ ] Verify version labels show correctly in captions
- [ ] Check that rate limiting (1s delay) prevents errors
- [ ] Test with tracks that have no title from Suno
- [ ] Test with tracks that have long prompts
- [ ] Verify sync-stale-tasks sends both versions

## Migration Notes

**No database migrations required.** All changes are in Edge Functions code only.

**No breaking changes.** The updates are backward compatible - old tracks will work with new logic.

**Environment variables are optional.** Default values will work for most deployments, but you can customize:
- `TELEGRAM_BOT_USERNAME` if your bot has a different username
- `TELEGRAM_APP_SHORT_NAME` if you registered a different app short name
- `MINI_APP_URL` for custom Mini App domains

## Architecture Improvements

1. **Centralized Configuration**: All Telegram-related configuration is now in one place
2. **Reusable Utilities**: `telegram-config.ts` provides helper functions for deep link generation
3. **Consistent Formatting**: All notifications use the same format and structure
4. **Better Error Handling**: Title generation has multiple fallbacks
5. **Rate Limiting**: Delay between multiple messages prevents API errors

## Performance Considerations

- **Rate Limiting**: 1-second delay between version notifications (2 versions = 2 seconds total)
- **Parallel Processing**: Each version is sent independently, failures don't affect others
- **Caching**: Telegram file IDs are still used when available for faster delivery

## Future Improvements

Potential enhancements for future iterations:

1. **User Preferences**: Let users choose to receive 1 or 2 versions
2. **Version Comparison**: Add buttons to switch between versions in Mini App
3. **Title Generation AI**: Use AI to generate better titles from prompts
4. **Batch Notifications**: Group multiple tracks in one message for multi-track generation
5. **Rich Media**: Include waveforms or spectrograms in notifications

## References

- [Telegram Bot API - Web Apps](https://core.telegram.org/bots/webapps)
- [Telegram Bot API - Deep Links](https://core.telegram.org/bots/features#deep-linking)
- [Suno API Documentation](https://sunoapi.org/)
- Project docs: `docs/TELEGRAM_BOT_ARCHITECTURE.md`

## Support

For issues related to this integration:
1. Check Edge Function logs in Supabase Dashboard
2. Verify environment variables are set correctly
3. Test deep links manually before reporting issues
4. Check that Telegram bot has proper permissions

---

**Fixed by:** GitHub Copilot  
**Date:** December 4, 2025  
**Status:** ✅ Ready for Testing
