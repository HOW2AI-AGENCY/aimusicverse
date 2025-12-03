# ⚡ Immediate Action Items - Priority Tasks

**Created**: December 3, 2025  
**Context**: Based on [Comprehensive Audit](./COMPREHENSIVE_AUDIT_2025-12-03.md)  
**Goal**: Quick wins to improve code quality

---

## 🔴 Critical (Do Today - 6 hours)

### 1. Fix FIXME in TelegramContext.tsx ⏱️ 1h

**File**: `src/contexts/TelegramContext.tsx:122-126`

**Current**:
```typescript
// FIXME: Implement a more robust and user-friendly notification system.
if (tg.showAlert) {
  tg.showAlert('Ошибка аутентификации. Пожалуйста, попробуйте перезапустить приложение.');
}
```

**Replace with**:
```typescript
if (tg.showPopup) {
  tg.showPopup({
    title: '❌ Ошибка аутентификации',
    message: 'Не удалось войти в систему. Хотите попробовать снова?',
    buttons: [
      { id: 'retry', type: 'default', text: '🔄 Попробовать снова' },
      { id: 'cancel', type: 'cancel', text: 'Отмена' },
    ],
  }, (buttonId) => {
    if (buttonId === 'retry') {
      // Retry authentication
      console.log('🔄 Retrying authentication...');
      telegramAuthService.authenticateWithTelegram(tg.initData)
        .then(authData => {
          if (authData) {
            console.log('✅ Retry successful');
            tg.showPopup({
              message: '✅ Успешно вошли в систему!',
              buttons: [{ type: 'close' }],
            });
          } else {
            console.log('❌ Retry failed');
            tg.showPopup({
              message: '❌ Не удалось войти. Пожалуйста, перезапустите приложение.',
              buttons: [{ type: 'close' }],
            });
          }
        });
    }
  });
} else if (tg.showAlert) {
  // Fallback for older Telegram versions
  tg.showAlert('Ошибка аутентификации. Пожалуйста, попробуйте перезапустить приложение.');
}
```

### 2. Create Logger Utility ⏱️ 2h

**File**: `src/lib/logger.ts` (create new)

```typescript
/**
 * Centralized logging utility for MusicVerse AI
 * 
 * Features:
 * - Environment-aware (dev vs production)
 * - Structured logging
 * - Error tracking integration ready
 * - Performance monitoring
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private appName = 'MusicVerse AI';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.appName}]`;
    
    if (context) {
      return `${prefix} ${message} ${JSON.stringify(context)}`;
    }
    
    return `${prefix} ${message}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      ...(error instanceof Error && {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
      }),
    };
    
    console.error(this.formatMessage('error', message, errorContext));
    
    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // this.sendToErrorTracking(message, errorContext);
  }

  // Performance monitoring
  startTimer(label: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.debug(`⏱️ ${label}`, { duration: `${duration.toFixed(2)}ms` });
    };
  }
}

export const logger = new Logger();
```

**Usage example**:
```typescript
// Before
console.log('🤖 Telegram WebApp обнаружен');

// After
logger.info('Telegram WebApp обнаружен');
```

### 3. Implement Stem Separation Handler ⏱️ 3h

**File**: `supabase/functions/telegram-bot/commands/stems.ts` (create new)

```typescript
import { sendMessage, editMessageText } from '../telegram-api.ts';
import { logger } from '../utils/logger.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Handle stem separation request
 * 
 * @param chatId - Telegram chat ID
 * @param trackId - Track UUID
 * @param mode - Separation mode ('simple' or 'detailed')
 * @param messageId - Message ID to update
 */
export async function handleStemSeparation(
  chatId: number,
  trackId: string,
  mode: 'simple' | 'detailed',
  messageId?: number
) {
  try {
    logger.info('handleStemSeparation', { chatId, trackId, mode });
    
    // 1. Validate track exists
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('id, title, audio_url')
      .eq('id', trackId)
      .single();
    
    if (trackError || !track) {
      await sendMessage(chatId, '❌ Трек не найден.');
      return;
    }
    
    if (!track.audio_url) {
      await sendMessage(chatId, '❌ У трека нет аудио файла.');
      return;
    }
    
    // 2. Call stem separation edge function
    const { data, error } = await supabase.functions.invoke('suno-separate-vocals', {
      body: { 
        trackId: track.id,
        audioUrl: track.audio_url,
        mode,
      },
    });
    
    if (error) {
      logger.error('Stem separation failed', error);
      await sendMessage(chatId, '❌ Не удалось запустить разделение. Попробуйте позже.');
      return;
    }
    
    // 3. Update message with progress info
    const modeText = mode === 'simple' ? 'Простое (2 стема: вокал + инструменты)' : 'Детальное (4+ стемов)';
    const estimatedTime = mode === 'simple' ? '2-3 минуты' : '4-5 минут';
    
    const message = `✅ Разделение запущено!\n\n` +
      `🎵 Трек: ${track.title || 'Без названия'}\n` +
      `🎛️ Режим: ${modeText}\n` +
      `⏱️ Примерное время: ${estimatedTime}\n` +
      `🆔 ID задачи: \`${data.taskId}\`\n\n` +
      `📬 Вы получите уведомление когда стемы будут готовы.`;
    
    if (messageId) {
      await editMessageText(chatId, messageId, message);
    } else {
      await sendMessage(chatId, message);
    }
    
    logger.info('Stem separation started', { taskId: data.taskId });
    
  } catch (error) {
    logger.error('handleStemSeparation error', error);
    await sendMessage(chatId, '❌ Произошла ошибка при запуске разделения.');
  }
}

/**
 * Handle check stems status
 */
export async function handleCheckStemsStatus(
  chatId: number,
  trackId: string,
  messageId?: number
) {
  try {
    // Get stems for track
    const { data: stems, error } = await supabase
      .from('track_stems')
      .select('*')
      .eq('track_id', trackId)
      .order('created_at', { ascending: false });
    
    if (error || !stems || stems.length === 0) {
      await sendMessage(chatId, '❌ Стемы не найдены. Возможно, разделение еще не завершено.');
      return;
    }
    
    const message = `🎛️ Стемы готовы!\n\n` +
      `📊 Найдено стемов: ${stems.length}\n\n` +
      stems.map((stem, i) => `${i + 1}. ${stem.stem_type}`).join('\n') +
      `\n\nОткройте трек в студии для работы со стемами.`;
    
    if (messageId) {
      await editMessageText(chatId, messageId, message);
    } else {
      await sendMessage(chatId, message);
    }
    
  } catch (error) {
    logger.error('handleCheckStemsStatus error', error);
  }
}
```

**Update bot.ts**:
```typescript
// Line 122 - Replace TODO with actual implementation
if (data?.startsWith('stem_mode_')) {
  const [_, mode, trackId] = data.split('_').slice(1);
  const { handleStemSeparation } = await import('./commands/stems.ts');
  await handleStemSeparation(
    chatId, 
    trackId, 
    mode as 'simple' | 'detailed', 
    messageId
  );
  await answerCallbackQuery(id);
  return;
}
```

---

## ⚠️ High Priority (This Week - 12 hours)

### 4. Replace console.log with logger ⏱️ 4h

**Automated replacement**:
```bash
# Find all console.log (excluding console.error, console.warn)
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "console\.log" {} \;

# Manual replacement in key files:
# 1. src/contexts/TelegramContext.tsx (15 instances)
# 2. src/services/telegram-auth.ts (5 instances)
# 3. src/services/telegram-share.ts (10 instances)
```

**Pattern**:
```typescript
// Before
console.log('🤖 Telegram WebApp обнаружен');
console.log('📱 Platform:', tg.platform);

// After
logger.info('Telegram WebApp обнаружен');
logger.info('Platform detected', { platform: tg.platform });
```

### 5. Fix TypeScript 'any' Usage ⏱️ 8h

**Priority files** (15 instances):
1. `src/components/CompactPlayer.tsx:75`
2. `src/components/TrackActionsSheet.tsx:92`
3. `src/components/TrackCard.tsx:170,190,455`
4. `src/components/generate-form/AILyricsAssistantDialog.tsx:95,126,156,191`

**Example fix**:
```typescript
// Before
const handleEvent = (e: any) => {
  // ...
}

// After
interface AudioPlayerEvent {
  target: HTMLAudioElement;
  timeStamp: number;
  type: string;
}

const handleEvent = (e: AudioPlayerEvent) => {
  // ...
}
```

---

## 📋 Medium Priority (Next Week - 8 hours)

### 6. Add Error Handling in telegram-auth ⏱️ 2h

**File**: `supabase/functions/telegram-auth/index.ts`

**Lines 200-205** - Add error details:
```typescript
if (profileCheckError) {
  console.error('❌ Profile check error:', profileCheckError);
  
  return new Response(
    JSON.stringify({ 
      error: 'Database error',
      code: 'PROFILE_CHECK_FAILED',
      ...(Deno.env.get('ENVIRONMENT') === 'development' && {
        details: profileCheckError.message,
        hint: profileCheckError.hint,
      }),
    }),
    { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}
```

### 7. Fix React Hooks Violations ⏱️ 3h

**File 1**: `src/components/generate-form/LyricsVisualEditor.tsx:102`

```typescript
// Before
const handleAddSection = (type: LyricSection['type']) => {
  const timestamp = Date.now(); // ❌ Impure
  // ...
}

// After
const handleAddSection = useCallback((type: LyricSection['type']) => {
  const timestamp = Date.now(); // ✅ OK in callback
  // ...
}, [/* dependencies */]);
```

**File 2**: `src/components/lyrics/UnifiedLyricsView.tsx:113`

```typescript
// Before
useEffect(() => {
  if (idx !== -1 && idx !== activeWordIndex) {
    setActiveWordIndex(idx); // ❌ Direct setState in effect
  }
}, [currentTime, hasTimestampedLyrics, timestamped, isPlaying, activeWordIndex]);

// After - Option 1: Remove from dependencies
useEffect(() => {
  if (idx !== -1 && idx !== activeWordIndex) {
    setActiveWordIndex(idx);
  }
}, [currentTime, hasTimestampedLyrics, timestamped, isPlaying]);
// activeWordIndex removed - use functional update if needed

// After - Option 2: Use ref
const activeWordIndexRef = useRef(activeWordIndex);

useEffect(() => {
  activeWordIndexRef.current = activeWordIndex;
}, [activeWordIndex]);

useEffect(() => {
  if (idx !== -1 && idx !== activeWordIndexRef.current) {
    setActiveWordIndex(idx);
  }
}, [currentTime, hasTimestampedLyrics, timestamped, isPlaying]);
```

### 8. Add Null Safety Checks ⏱️ 3h

**File**: `src/contexts/TelegramContext.tsx:277-343`

```typescript
// Before
const showMainButton = (text: string, onClick: () => void) => {
  if (webApp) {
    webApp.MainButton.setText(text);
    webApp.MainButton.show();
    webApp.MainButton.onClick(onClick);
  }
};

// After
const showMainButton = (text: string, onClick: () => void) => {
  if (webApp?.MainButton) {
    webApp.MainButton.setText(text);
    webApp.MainButton.show();
    webApp.MainButton.onClick(onClick);
  }
};

const hideMainButton = () => {
  if (webApp?.MainButton) {
    webApp.MainButton.hide();
    webApp.MainButton.offClick(() => {});
  }
};

const showBackButton = (onClick: () => void) => {
  if (webApp?.BackButton) {
    webApp.BackButton.show();
    webApp.BackButton.onClick(onClick);
  }
};

const hideBackButton = () => {
  if (webApp?.BackButton) {
    webApp.BackButton.hide();
    webApp.BackButton.offClick(() => {});
  }
};

const hapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection') => {
  if (!webApp?.HapticFeedback) return;
  
  switch (type) {
    case 'light':
    case 'medium':
    case 'heavy':
      webApp.HapticFeedback.impactOccurred(type);
      break;
    case 'success':
    case 'error':
    case 'warning':
      webApp.HapticFeedback.notificationOccurred(type);
      break;
    case 'selection':
      webApp.HapticFeedback.selectionChanged();
      break;
  }
};
```

---

## ✅ Checklist

### Today (Critical - 6 hours)
- [ ] Fix FIXME in TelegramContext.tsx (1h)
- [ ] Create logger utility (2h)
- [ ] Implement stem separation handler (3h)
- [ ] Test changes
- [ ] Commit and push

### This Week (High Priority - 12 hours)
- [ ] Replace console.log with logger (4h)
- [ ] Fix TypeScript 'any' usage in 15 files (8h)
- [ ] Run lint and fix auto-fixable issues
- [ ] Test affected components

### Next Week (Medium Priority - 8 hours)
- [ ] Add error handling in telegram-auth (2h)
- [ ] Fix React hooks violations (3h)
- [ ] Add null safety checks (3h)
- [ ] Run full test suite
- [ ] Update documentation

---

## 📊 Progress Tracking

| Task | Priority | Time | Status | Assignee | Notes |
|------|----------|------|--------|----------|-------|
| Fix FIXME | 🔴 P0 | 1h | ⏳ Pending | - | - |
| Create logger | 🔴 P0 | 2h | ⏳ Pending | - | - |
| Stem separation | 🔴 P0 | 3h | ⏳ Pending | - | - |
| Replace console.log | ⚠️ P1 | 4h | ⏳ Pending | - | - |
| Fix TypeScript any | ⚠️ P1 | 8h | ⏳ Pending | - | - |
| Error handling | ℹ️ P2 | 2h | ⏳ Pending | - | - |
| Fix React hooks | ℹ️ P2 | 3h | ⏳ Pending | - | - |
| Null safety | ℹ️ P2 | 3h | ⏳ Pending | - | - |

**Total Estimated Time**: 26 hours  
**Target Completion**: December 10, 2025

---

## 🚀 Quick Start

```bash
# 1. Pull latest changes
git pull

# 2. Create feature branch
git checkout -b fix/immediate-improvements

# 3. Start with logger utility
touch src/lib/logger.ts
# Copy code from above

# 4. Fix FIXME in TelegramContext
code src/contexts/TelegramContext.tsx
# Apply changes

# 5. Implement stem separation
mkdir -p supabase/functions/telegram-bot/commands
touch supabase/functions/telegram-bot/commands/stems.ts
# Copy code from above

# 6. Test changes
npm run lint
npm run build
npm test

# 7. Commit
git add .
git commit -m "fix: implement immediate improvements from audit"

# 8. Push and create PR
git push -u origin fix/immediate-improvements
```

---

**Next Steps**: After completing these tasks, proceed to [4-Week Improvement Plan](./AUDIT_EXECUTIVE_SUMMARY_RU.md#-4-недельный-план-улучшений)
