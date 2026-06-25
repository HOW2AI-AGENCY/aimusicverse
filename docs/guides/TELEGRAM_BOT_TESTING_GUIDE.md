# Telegram Bot Testing Guide

Quick guide to test the Telegram bot integration fixes.

## Pre-Testing Setup

1. **Deploy Edge Functions:**

   ```bash
   # Deploy updated functions to Supabase
   supabase functions deploy send-telegram-notification
   supabase functions deploy suno-music-callback
   supabase functions deploy sync-stale-tasks
   supabase functions deploy telegram-bot
   ```

2. **Set Environment Variables (Optional):**
   ```bash
   # Only if you need custom values
   supabase secrets set TELEGRAM_BOT_USERNAME=YourBotUsername
   supabase secrets set TELEGRAM_APP_SHORT_NAME=app
   ```

## Test Cases

### ✅ Test 1: Multiple Track Versions

**Expected:** User receives 2 notifications (Version A and Version B)

**Steps:**

1. Start a new track generation via Telegram bot: `/generate энергичный рок трек`
2. Wait for generation to complete (1-2 minutes)
3. Check Telegram for notifications

**Success Criteria:**

- [ ] Received 2 separate audio messages
- [ ] First message has title ending with "(версия A)"
- [ ] Second message has title ending with "(версия B)"
- [ ] Caption shows "Версия A из 2" and "Версия B из 2"
- [ ] Both tracks are playable

**Troubleshooting:**

- If only 1 message: Check `suno-music-callback` logs for errors
- If no messages: Check `send-telegram-notification` logs
- If timeout: Run `/status` to check generation status

---

### ✅ Test 2: Readable Track Titles

**Expected:** Track titles are meaningful, not generic

**Steps:**

1. Generate a track with prompt: `/generate спокойная джазовая музыка для вечера`
2. Check the title in notification

**Success Criteria:**

- [ ] Title is NOT "Трек" or "Untitled"
- [ ] Title is descriptive (e.g., "Спокойная джазовая музыка")
- [ ] Title is under 60 characters
- [ ] No technical prefixes like "generate" or "create"

**Test with different prompts:**

- Simple: `romantic piano melody`
- Multi-line: `Dark electronic beat\nWith heavy bass\nFor workout`
- With prefix: `Create an upbeat pop song`

---

### ✅ Test 3: Deep Links Work

**Expected:** Deep links open the Mini App with correct track

**Steps:**

1. Receive a track notification
2. Click "🎵 Открыть в приложении" button
3. Verify Mini App opens and shows the track

**Success Criteria:**

- [ ] Button opens Telegram Mini App (not external browser)
- [ ] Library page loads with track highlighted
- [ ] Track can be played immediately
- [ ] No errors in console

**Also test:**

- [ ] Deep links from inline sharing (@AIMusicVerseBot in chat)
- [ ] Deep links from `/library` command
- [ ] Deep links from `/share` menu

---

### ✅ Test 4: Sync Stale Tasks

**Expected:** Stale tasks are recovered and send both versions

**Steps:**

1. Find or create a stale task (pending >10 min)
2. Manually trigger sync: Call `sync-stale-tasks` function
3. Check Telegram for notifications

**Success Criteria:**

- [ ] Received 2 notifications for each completed track
- [ ] Titles are readable
- [ ] Deep links work

**Manual trigger:**

```bash
# Via Supabase SQL editor
SELECT * FROM generation_tasks
WHERE status IN ('pending', 'processing')
AND created_at < NOW() - INTERVAL '10 minutes';

# Then invoke function (Supabase Dashboard → Edge Functions → sync-stale-tasks → Invoke)
```

---

### ✅ Test 5: Version Labels and Metadata

**Expected:** Captions show version information

**Steps:**

1. Generate any track
2. Check notification caption

**Success Criteria:**

- [ ] Caption includes "Версия A из 2"
- [ ] Caption includes emoji and formatting
- [ ] Style and duration are shown
- [ ] Tags are formatted as hashtags (#electronic #chill)
- [ ] Footer includes @AIMusicVerseBot mention

---

### ✅ Test 6: Rate Limiting

**Expected:** Multiple versions send without errors

**Steps:**

1. Generate 3-4 tracks simultaneously
2. Check logs for rate limit errors

**Success Criteria:**

- [ ] All versions delivered successfully
- [ ] No "429 Too Many Requests" errors
- [ ] Messages arrive with ~1 second delay between versions

---

### ✅ Test 7: Edge Cases

**Test these scenarios:**

#### Empty Title

- Generate track with no title from Suno
- Expected: Uses cleaned prompt or "AI Music Track"

#### Long Prompt

- Use 200+ character prompt
- Expected: Title truncated to 60 chars

#### Special Characters

- Use prompt with: `Rock & Roll - "Best" Track (2025)`
- Expected: Characters properly escaped in Markdown

#### Failed Generation

- Check notification for failed track
- Expected: Error message with retry button, no audio

---

## Debugging Tools

### Check Edge Function Logs

**Supabase Dashboard:**

1. Go to Edge Functions
2. Select function (e.g., `suno-music-callback`)
3. View Logs tab

**Look for:**

```
📤 Sending 2 track version(s) to Telegram
✅ Version A created: ...
✅ Version B created: ...
```

### Check Notification Settings

```sql
-- Check user's notification preferences
SELECT * FROM user_notification_settings
WHERE telegram_chat_id = YOUR_CHAT_ID;

-- Should have notify_completed = true
```

### Manual Deep Link Test

Open this URL directly in Telegram:

```
https://t.me/AIMusicVerseBot/app?startapp=track_YOUR_TRACK_ID
```

### Check Track Versions

```sql
-- Verify both versions were created
SELECT version_label, audio_url, is_primary
FROM track_versions
WHERE track_id = 'YOUR_TRACK_ID'
ORDER BY version_label;

-- Should show versions A and B
```

---

## Common Issues

### Issue: No notifications received

**Check:**

1. Bot token is correct: `TELEGRAM_BOT_TOKEN`
2. User started bot conversation (send `/start`)
3. Notification settings allow completed tracks
4. Chat ID is stored in `telegram_chat_id` field

### Issue: Only 1 version received

**Check:**

1. Logs show "Sending 2 track version(s)"
2. Second message not blocked by rate limit
3. Both clips exist in `audio_clips` field

### Issue: Generic track titles

**Check:**

1. Suno API returns title in clip data
2. Track has `title` field in database
3. Prompt is not empty

### Issue: Deep links open browser

**Check:**

1. URL format: `https://t.me/BOT/app?startapp=X`
2. Bot username matches `TELEGRAM_BOT_USERNAME`
3. App short name matches `TELEGRAM_APP_SHORT_NAME`

---

## Success Metrics

After all tests pass, you should see:

- ✅ 2 versions sent per track (100% of generations)
- ✅ Meaningful titles (>90% of tracks)
- ✅ Deep links work (100% of clicks)
- ✅ No rate limit errors (0 errors in logs)
- ✅ Sync recovers stale tracks with both versions

---

## Need Help?

1. Check logs in Supabase Dashboard
2. Review `docs/TELEGRAM_BOT_INTEGRATION_FIX_2025-12-04.md`
3. Test with `/help` command for bot documentation
4. Open issue with logs and test case details

**Last Updated:** December 4, 2025
