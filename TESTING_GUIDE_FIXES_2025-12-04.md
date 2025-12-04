# 🧪 Testing Guide: Telegram Bot & Project Tracklist Fixes

**Date**: December 4, 2025  
**Related**: AUDIT_REPORT_2025-12-04.md  
**Purpose**: Verify fixes for Telegram bot errors and project tracklist issues

---

## 🎯 Overview

This guide provides step-by-step instructions to test the recent fixes:
1. **Telegram Bot**: Chat validation and error handling
2. **Project Tracklist**: Query logging and reliability

---

## ✅ Pre-Test Checklist

Before starting tests, ensure:

- [ ] Edge functions deployed to Supabase
- [ ] Frontend built and deployed
- [ ] Access to Supabase dashboard (for logs)
- [ ] Access to Telegram bot
- [ ] Test user accounts available
- [ ] Browser DevTools accessible

---

## 📱 Test Suite 1: Telegram Bot

### Test 1.1: Valid Chat ID - Success Path ✅

**Objective**: Verify normal track sending works correctly

**Steps:**
1. Open the MusicVerse AI Telegram Mini App
2. Generate a new track using the bot
3. Wait for generation to complete
4. Check if audio message arrives in Telegram

**Expected Results:**
- ✅ Audio message received in Telegram
- ✅ Message includes track title, cover, and duration
- ✅ Deep link button works
- ✅ No errors in edge function logs

**Logs to Check:**
```
Supabase Dashboard > Edge Functions > suno-music-callback
Look for: "✅ Audio sent successfully to Telegram"
```

---

### Test 1.2: Invalid Chat ID - Validation ⚠️

**Objective**: Verify chat_id validation prevents bad API calls

**How to Simulate:**
You cannot directly test this from UI, but you can:

**Option A: Edge Function Direct Call**
```bash
curl -X POST \
  https://YOUR_PROJECT.supabase.co/functions/v1/suno-send-audio \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": -999,
    "trackId": "test-track-id",
    "audioUrl": "https://example.com/test.mp3",
    "title": "Test Track",
    "duration": 120
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Invalid or missing chat_id",
  "skipped": true
}
```

**Expected HTTP Status:** 400

**Option B: Check Logs**
```
Supabase Dashboard > Edge Functions > suno-send-audio
Look for: "❌ Invalid or missing chat_id: -999"
```

---

### Test 1.3: Blocked Bot - Graceful Handling 🚫

**Objective**: Verify graceful handling when user blocks bot

**Steps:**
1. Generate a track while logged in to Telegram
2. Block the @AIMusicVerseBot
3. Wait for track generation to complete
4. Check edge function logs

**Expected Results:**
- ✅ No error thrown (function doesn't crash)
- ✅ Log shows: "⚠️ Chat unavailable, user may have blocked bot"
- ✅ Response status: 200 (to prevent retries)
- ✅ Response includes: `{ "skipped": true, "reason": "chat_unavailable" }`

**Logs to Check:**
```
Supabase Dashboard > Edge Functions > send-telegram-notification
Look for: "Chat unavailable (CHAT_ID): bot was blocked by the user"
```

---

### Test 1.4: Deleted User Account - Graceful Handling 👤

**Objective**: Verify handling when Telegram user deletes account

**Steps:**
This is hard to test manually, but you can check:

**Logs to Watch For:**
```
⚠️ Chat unavailable, user may have blocked bot or deleted account
```

**Expected Behavior:**
- Function returns 200 (not 500)
- No retry attempts
- Error logged but not propagated

---

### Test 1.5: Network Error - Retry Behavior 🔄

**Objective**: Verify proper error propagation for actual network issues

**How to Simulate:**
Temporarily disable network in Supabase settings (if possible) or:

**Option: Check Real Network Errors**
Monitor logs for actual Telegram API timeouts or network errors

**Expected Behavior:**
- ✅ Error is thrown (not swallowed)
- ✅ Returns 500 status
- ✅ Detailed error in logs with status code
- ✅ Error message: "Telegram API error (XXX): {description}"

---

## 📊 Test Suite 2: Project Tracklist

### Test 2.1: Load Empty Project Tracklist 📝

**Objective**: Verify empty state displays correctly

**Steps:**
1. Navigate to `/projects` page
2. Create a new project:
   - Click "Create Project" button
   - Fill in project details (title, genre, mood)
   - Save project
3. Open the project detail page
4. Click "Треклист" (Tracklist) tab
5. Open browser DevTools Console

**Expected Results:**
- ✅ Empty state message displayed: "Треклист пуст"
- ✅ "AI Треклист" button visible
- ✅ "Добавить вручную" button visible
- ✅ Console log: "🔍 Fetching project tracks for project: {PROJECT_ID}"
- ✅ Console log: "✅ Loaded 0 project tracks"

**Screenshot Example:**
```
┌──────────────────────────────────┐
│         Треклист пуст            │
│                                  │
│     [🌟 AI Треклист]            │
│     [➕ Добавить вручную]        │
└──────────────────────────────────┘
```

---

### Test 2.2: Add Track Manually ➕

**Objective**: Verify CRUD operations work correctly

**Steps:**
1. From empty tracklist (Test 2.1)
2. Click "Добавить вручную" button
3. Fill in track details:
   - Title: "Test Track 1"
   - Style: "Rock, энергичный"
   - Notes: "Test notes"
   - Duration: 180 seconds
4. Click "Добавить" button
5. Watch browser console

**Expected Results:**
- ✅ Track appears in list immediately
- ✅ Toast notification: "Трек добавлен"
- ✅ Console log: "✅ Loaded 1 project tracks"
- ✅ Track shows position badge "1"
- ✅ Track shows status badge "Черновик"
- ✅ Action buttons visible (Generate, Edit, Delete)

**Screenshot Example:**
```
┌──────────────────────────────────┐
│ [≡] 1  Test Track 1    [📝]     │
│        Rock, энергичный           │
│        [⚡ Создать] [✏️] [🗑️]    │
└──────────────────────────────────┘
```

---

### Test 2.3: Load Existing Tracklist 📚

**Objective**: Verify tracks load correctly on page navigation

**Steps:**
1. Use project from Test 2.2 (with at least 1 track)
2. Navigate away to another page (e.g., `/library`)
3. Navigate back to project detail page
4. Click "Треклист" tab
5. Watch browser console

**Expected Results:**
- ✅ Console log: "🔍 Fetching project tracks for project: {PROJECT_ID}"
- ✅ Console log: "✅ Loaded {N} project tracks"
- ✅ All tracks display in correct order
- ✅ No loading spinner stuck
- ✅ Query completes within 2 seconds

**Timing:**
- Initial load: < 1 second (normal)
- With retry: < 5 seconds (network issues)

---

### Test 2.4: Query Error Handling ❌

**Objective**: Verify error logging and retry behavior

**How to Simulate:**

**Option A: Temporarily Break RLS Policy**
```sql
-- In Supabase SQL Editor
DROP POLICY "Users can view tracks in own projects" ON project_tracks;
```

**Steps:**
1. Try to load project tracklist
2. Watch browser console
3. Restore policy after test

**Expected Results:**
- ✅ Console log: "❌ Error fetching project tracks: {error}"
- ✅ Query retries 2 times (total 3 attempts)
- ✅ User sees loading spinner during retries
- ✅ After retries fail, empty state or error message shown

**Restore Policy:**
```sql
CREATE POLICY "Users can view tracks in own projects"
  ON public.project_tracks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.music_projects 
    WHERE music_projects.id = project_tracks.project_id 
    AND music_projects.user_id = auth.uid()
  ));
```

---

### Test 2.5: Realtime Updates 🔄

**Objective**: Verify realtime subscription updates tracklist

**Steps:**
1. Open project tracklist in Browser A
2. Open same project tracklist in Browser B (incognito/different device)
3. In Browser B: Add a new track
4. Watch Browser A

**Expected Results:**
- ✅ Browser A shows new track automatically (within 2 seconds)
- ✅ Console in Browser A: "📊 Project tracks change received: {payload}"
- ✅ No page refresh needed
- ✅ Tracks remain in correct order

---

### Test 2.6: Drag & Drop Reordering 🔀

**Objective**: Verify track position updates work

**Steps:**
1. Create project with 3+ tracks
2. Drag track from position 3 to position 1
3. Watch browser console

**Expected Results:**
- ✅ Tracks reorder visually immediately
- ✅ Toast notification: "Порядок треков обновлен"
- ✅ Console log: "✅ Loaded {N} project tracks" (after update)
- ✅ Position badges update (1, 2, 3, etc.)
- ✅ Order persists after page refresh

---

### Test 2.7: Stale Time Behavior ⏱️

**Objective**: Verify query doesn't refetch unnecessarily

**Steps:**
1. Load project tracklist
2. Note console log: "🔍 Fetching project tracks..."
3. Navigate to "Детали" tab
4. Navigate back to "Треклист" tab within 30 seconds
5. Watch console

**Expected Results:**
- ✅ NO new fetch log (data is cached)
- ✅ Tracks display immediately from cache
- ✅ After 30 seconds, next navigation triggers new fetch

**Timing Test:**
- Load tracklist: Time = 0s
- Switch tab away: Time = 10s
- Switch tab back: Time = 20s → ✅ Uses cache
- Switch tab away: Time = 35s
- Switch tab back: Time = 45s → ✅ Fetches new data

---

### Test 2.8: Generate AI Tracklist 🤖

**Objective**: Verify AI generation creates multiple tracks

**Steps:**
1. Open empty project or project with few tracks
2. Click "AI Треклист" button
3. Wait for generation to complete
4. Watch browser console

**Expected Results:**
- ✅ Button shows "Генерация..." with spinner
- ✅ After completion: Multiple tracks appear (typically 8-12)
- ✅ Toast notification: "Трек-лист создан с помощью AI"
- ✅ Console log: "✅ Loaded {N} project tracks"
- ✅ Tracks have recommended tags and styles

---

## 🔍 Monitoring & Debugging

### Browser Console Logs

**Successful Query:**
```
🔍 Fetching project tracks for project: abc-123-def-456
✅ Loaded 5 project tracks
```

**Query Error:**
```
🔍 Fetching project tracks for project: abc-123-def-456
❌ Error fetching project tracks: { message: "...", code: "..." }
```

**No Project ID:**
```
⚠️ useProjectTracks: No projectId provided
```

---

### Supabase Edge Function Logs

**Location:** 
```
Supabase Dashboard > Edge Functions > [Function Name] > Logs
```

**Key Log Patterns:**

#### suno-send-audio
```
✅ Audio sent successfully to Telegram
❌ Invalid or missing chat_id: -999
⚠️ Chat unavailable, user may have blocked bot
❌ Telegram API error (400): chat not found
```

#### suno-music-callback
```
📤 Sending 2 track version(s) to Telegram (chat_id: 123456789)
✅ Version A created
✅ Version B created
❌ Invalid or missing chat_id: null
```

#### send-telegram-notification
```
📤 Sending generation complete notification with audio
✅ Audio sent successfully
⚠️ Chat unavailable (123456789): bot was blocked by the user
```

---

### Database Query Testing

**Test Query Execution:**
```sql
-- Verify project_tracks table
SELECT * FROM project_tracks WHERE project_id = 'YOUR_PROJECT_ID' ORDER BY position;

-- Check RLS policy
SELECT * FROM project_tracks WHERE project_id = 'YOUR_PROJECT_ID';
-- Should only return tracks if you own the project

-- Verify realtime is enabled
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'project_tracks';
```

---

## 📋 Test Results Template

Use this template to record test results:

```markdown
## Test Execution Report

**Date**: YYYY-MM-DD  
**Tester**: [Name]  
**Environment**: [Production/Staging]

### Telegram Bot Tests

| Test ID | Test Name | Status | Notes |
|---------|-----------|--------|-------|
| 1.1 | Valid Chat ID | ✅ PASS | |
| 1.2 | Invalid Chat ID | ✅ PASS | |
| 1.3 | Blocked Bot | ✅ PASS | |
| 1.4 | Deleted User | ⚠️ N/A | Cannot simulate |
| 1.5 | Network Error | ✅ PASS | |

### Project Tracklist Tests

| Test ID | Test Name | Status | Notes |
|---------|-----------|--------|-------|
| 2.1 | Load Empty Tracklist | ✅ PASS | |
| 2.2 | Add Track Manually | ✅ PASS | |
| 2.3 | Load Existing | ✅ PASS | |
| 2.4 | Query Error | ✅ PASS | |
| 2.5 | Realtime Updates | ✅ PASS | |
| 2.6 | Drag & Drop | ✅ PASS | |
| 2.7 | Stale Time | ✅ PASS | |
| 2.8 | AI Generation | ✅ PASS | |

### Issues Found

- [ ] No issues
- [ ] Issue 1: [Description]
- [ ] Issue 2: [Description]

### Recommendations

- [Add your recommendations here]
```

---

## 🚨 Troubleshooting

### Problem: Tracks Not Loading

**Symptoms:**
- Spinner never stops
- Empty state shows even with tracks in DB

**Check:**
1. Browser console for error messages
2. Network tab for failed requests
3. User authentication status
4. Project ID is valid

**Solution:**
```javascript
// Check if user is authenticated
console.log('User:', user);
// Check if project ID exists
console.log('Project ID:', projectId);
// Manually query database
const { data, error } = await supabase
  .from('project_tracks')
  .select('*')
  .eq('project_id', projectId);
console.log('Manual query result:', data, error);
```

---

### Problem: Telegram Notifications Not Arriving

**Symptoms:**
- Track generates but no Telegram message

**Check:**
1. Edge function logs for errors
2. chat_id is valid
3. Bot is not blocked
4. Telegram API status

**Solution:**
```javascript
// Check telegram_chat_id in task
const { data: task } = await supabase
  .from('generation_tasks')
  .select('telegram_chat_id')
  .eq('id', taskId)
  .single();
console.log('Task chat_id:', task.telegram_chat_id);
```

---

### Problem: Retry Loop

**Symptoms:**
- Continuous API calls
- High edge function invocation count

**Check:**
1. Error response status code
2. Retry configuration

**Solution:**
Ensure blocked/unavailable chats return 200 status (not 500) to prevent retries.

---

## 📊 Success Metrics

Track these metrics after deployment:

### Telegram Bot
- **Target**: <5% chat unavailable errors
- **Target**: 0% invalid chat_id errors
- **Target**: >95% successful deliveries (for valid chats)

### Project Tracklist
- **Target**: <2% query failures
- **Target**: <1s average load time
- **Target**: <10% retry rate

---

## ✅ Sign-Off

Once all tests pass:

- [ ] All critical path tests completed
- [ ] No P0/P1 bugs found
- [ ] Logs reviewed and clean
- [ ] Performance acceptable
- [ ] User experience smooth

**Approved By**: _______________  
**Date**: _______________

---

**Document Version**: 1.0  
**Last Updated**: December 4, 2025  
**Related Documents**: 
- AUDIT_REPORT_2025-12-04.md
- TELEGRAM_BOT_TESTING_GUIDE.md
