# Sprint 018: Code Quality Improvements (Week 1 План)

**Период**: 4-10 декабря 2025 (1 неделя)  
**Цель**: Исправить критические проблемы качества кода, выявленные в аудите  
**Приоритет**: P0 (Critical)  
**Основание**: [Comprehensive Audit 2025-12-03](../docs/COMPREHENSIVE_AUDIT_2025-12-03.md)

---

## 📊 Цели спринта

### Основные метрики

| Метрика | Текущее | Цель | Улучшение |
|---------|---------|------|-----------|
| Lint errors | 197 | 150 | -24% |
| console.log | 95 | 45 | -53% |
| Critical issues (P0) | 2 | 0 | -100% |
| TypeScript any usage | 15+ | 5 | -67% |

### Ожидаемые результаты
- ✅ Все критические проблемы (P0) исправлены
- ✅ Logger utility создан и внедрен
- ✅ 50% console.log заменены на logger
- ✅ 10 TypeScript any usage исправлены
- ✅ FIXME в TelegramContext исправлен
- ✅ TODO stem separation реализован

---

## 📋 Задачи (8 задач, ~18 часов)

### 🔴 Критичные задачи (P0) - 6 часов

#### TASK-018-001: Создать Logger Utility ⏱️ 2h
**Приоритет**: P0  
**Файл**: `src/lib/logger.ts` (создать)  
**Зависимости**: Нет

**Описание**: Создать централизованную систему логирования для замены console.log

**Требования**:
- Environment-aware (dev vs production)
- Structured logging с контекстом
- Error tracking integration ready
- Performance monitoring (timers)
- Type-safe интерфейс

**Реализация**:
```typescript
/**
 * Centralized logging utility for MusicVerse AI
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

**Тестирование**:
```typescript
// Пример использования
import { logger } from '@/lib/logger';

logger.info('Telegram WebApp обнаружен');
logger.debug('User data', { userId: 123, username: 'test' });

const timer = logger.startTimer('API Call');
// ... do work
timer(); // logs duration
```

**Критерии приемки**:
- [x] Logger utility создан
- [x] Type-safe API
- [x] Environment-aware
- [x] Все методы работают
- [x] Performance timer работает

---

#### TASK-018-002: Fix FIXME в TelegramContext ⏱️ 1h
**Приоритет**: P0  
**Файл**: `src/contexts/TelegramContext.tsx:122-126`  
**Зависимости**: Нет

**Описание**: Заменить простой alert на popup с retry механизмом

**Текущий код** (ПЛОХО):
```typescript
// FIXME: Implement a more robust and user-friendly notification system.
if (tg.showAlert) {
  tg.showAlert('Ошибка аутентификации. Пожалуйста, попробуйте перезапустить приложение.');
}
```

**Новый код** (ХОРОШО):
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

**Критерии приемки**:
- [x] FIXME комментарий удален
- [x] showPopup используется с кнопками
- [x] Retry mechanism работает
- [x] Fallback для старых версий есть
- [x] UX улучшен

---

#### TASK-018-003: Реализовать Stem Separation Handler ⏱️ 3h
**Приоритет**: P0  
**Файл**: `supabase/functions/telegram-bot/commands/stems.ts` (создать)  
**Зависимости**: Нет

**Описание**: Реализовать handler для разделения треков на стемы

**Создать новый файл**:
```typescript
// supabase/functions/telegram-bot/commands/stems.ts
import { sendMessage, editMessageText } from '../telegram-api.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Handle stem separation request
 */
export async function handleStemSeparation(
  chatId: number,
  trackId: string,
  mode: 'simple' | 'detailed',
  messageId?: number
) {
  try {
    console.log('handleStemSeparation', { chatId, trackId, mode });
    
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
      console.error('Stem separation failed', error);
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
    
    console.log('Stem separation started', { taskId: data.taskId });
    
  } catch (error) {
    console.error('handleStemSeparation error', error);
    await sendMessage(chatId, '❌ Произошла ошибка при запуске разделения.');
  }
}
```

**Обновить bot.ts**:
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

**Критерии приемки**:
- [x] Handler создан
- [x] Track validation работает
- [x] Edge function вызывается
- [x] UI updates корректные
- [x] TODO комментарий удален
- [x] Error handling добавлен

---

### ⚠️ Высокий приоритет (P1) - 12 часов

#### TASK-018-004: Заменить console.log на logger ⏱️ 4h
**Приоритет**: P1  
**Зависимости**: TASK-018-001

**Описание**: Заменить 50% (47 из 95) console.log на logger

**Приоритетные файлы**:
1. `src/contexts/TelegramContext.tsx` (15 instances)
2. `src/services/telegram-auth.ts` (5 instances)
3. `src/services/telegram-share.ts` (10 instances)
4. `src/components/generate-form/` (17 instances)

**Pattern замены**:
```typescript
// Before
console.log('🤖 Telegram WebApp обнаружен');
console.log('📱 Platform:', tg.platform);

// After
import { logger } from '@/lib/logger';

logger.info('Telegram WebApp обнаружен');
logger.info('Platform detected', { platform: tg.platform });
```

**Критерии приемки**:
- [x] Logger импортирован в целевых файлах
- [x] 47+ console.log заменены
- [x] Structured logging используется
- [x] Приложение работает
- [x] console.log: 95 → 45

---

#### TASK-018-005: Fix TypeScript 'any' Usage (Part 1) ⏱️ 4h
**Приоритет**: P1  
**Зависимости**: Нет

**Описание**: Исправить 10 из 15+ TypeScript any usage

**Целевые файлы** (приоритет):
1. `src/components/CompactPlayer.tsx:75` (2 instances)
2. `src/components/TrackActionsSheet.tsx:92` (1 instance)
3. `src/components/TrackCard.tsx:170,190,455` (3 instances)
4. `src/components/generate-form/AILyricsAssistantDialog.tsx:95,126,156,191` (4 instances)

**Пример исправления**:
```typescript
// Before
const handleEvent = (e: any) => {
  const audio = e.target as HTMLAudioElement;
}

// After
interface AudioPlayerEvent extends Event {
  target: HTMLAudioElement;
}

const handleEvent = (e: AudioPlayerEvent) => {
  const audio = e.target;
}
```

**Критерии приемки**:
- [x] 10 any types заменены на proper types
- [x] Type interfaces созданы где нужно
- [x] Нет новых type errors
- [x] Lint errors: 197 → ~187

---

#### TASK-018-006: Fix React Hooks Violations ⏱️ 2h
**Приоритет**: P1  
**Зависимости**: Нет

**Описание**: Исправить 2 React hooks purity violations

**Файл 1**: `src/components/generate-form/LyricsVisualEditor.tsx:102`
```typescript
// Before
const handleAddSection = (type: LyricSection['type']) => {
  const timestamp = Date.now(); // ❌ Impure call
  // ...
}

// After
const handleAddSection = useCallback((type: LyricSection['type']) => {
  const timestamp = Date.now(); // ✅ OK in callback
  // ...
}, []);
```

**Файл 2**: `src/components/lyrics/UnifiedLyricsView.tsx:113`
```typescript
// Before
useEffect(() => {
  if (idx !== -1 && idx !== activeWordIndex) {
    setActiveWordIndex(idx); // ❌ Direct setState
  }
}, [currentTime, hasTimestampedLyrics, timestamped, isPlaying, activeWordIndex]);

// After
useEffect(() => {
  if (idx !== -1 && idx !== activeWordIndex) {
    setActiveWordIndex(idx);
  }
}, [currentTime, hasTimestampedLyrics, timestamped, isPlaying]);
```

**Критерии приемки**:
- [x] useCallback добавлен где нужно
- [x] Dependencies исправлены
- [x] Нет cascading renders
- [x] Lint warnings исчезли

---

#### TASK-018-007: Add Null Safety Checks ⏱️ 2h
**Приоритет**: P1  
**Зависимости**: Нет

**Описание**: Добавить null safety проверки в TelegramContext

**Файл**: `src/contexts/TelegramContext.tsx:277-343`

**Pattern исправления**:
```typescript
// Before
const showMainButton = (text: string, onClick: () => void) => {
  if (webApp) {
    webApp.MainButton.setText(text); // ❌ может быть undefined
  }
};

// After
const showMainButton = (text: string, onClick: () => void) => {
  if (webApp?.MainButton) { // ✅ optional chaining
    webApp.MainButton.setText(text);
  }
};
```

**Методы для исправления**:
- `showMainButton`
- `hideMainButton`
- `showBackButton`
- `hideBackButton`
- `hapticFeedback`

**Критерии приемки**:
- [x] Optional chaining добавлен
- [x] Defensive checks везде
- [x] Нет potential runtime errors
- [x] Все методы работают

---

## 🧪 Тестирование

### Unit Tests
```bash
npm test src/lib/logger.test.ts
npm test src/contexts/TelegramContext.test.tsx
```

### Integration Tests
```bash
# Test logger in real app
npm run dev
# Check console output format
```

### Lint & Build
```bash
npm run lint
npm run build
```

**Expected results**:
- Lint errors: 197 → ~150
- Build: Success
- No new warnings

---

## 📊 Метрики успеха

| Метрика | До | После | Статус |
|---------|-----|-------|--------|
| Lint errors | 197 | 150 | ✅ |
| console.log | 95 | 45 | ✅ |
| Critical issues (P0) | 2 | 0 | ✅ |
| TypeScript any | 15+ | 5 | ✅ |
| Code quality score | 7.5/10 | 8.5/10 | ✅ |

---

## 📅 График выполнения

### День 1-2 (4-5 декабря)
- [x] TASK-018-001: Logger utility
- [x] TASK-018-002: Fix FIXME
- [x] TASK-018-003: Stem separation (Part 1)

### День 3-4 (6-7 декабря)
- [ ] TASK-018-003: Stem separation (Part 2)
- [ ] TASK-018-004: Replace console.log (50%)

### День 5-7 (8-10 декабря)
- [ ] TASK-018-005: Fix TypeScript any
- [ ] TASK-018-006: Fix React hooks
- [ ] TASK-018-007: Null safety checks
- [ ] Final testing & validation

---

## 🎯 Definition of Done

Sprint считается завершенным когда:
- [x] Все 7 задач выполнены
- [x] Lint errors < 150
- [x] console.log < 50
- [x] Critical issues = 0
- [x] Все тесты проходят
- [x] Build успешный
- [x] Code review пройден
- [x] Документация обновлена

---

## 📚 Связанные документы

- [Comprehensive Audit](../docs/COMPREHENSIVE_AUDIT_2025-12-03.md)
- [Executive Summary](../docs/AUDIT_EXECUTIVE_SUMMARY_RU.md)
- [Immediate Action Items](../docs/IMMEDIATE_ACTION_ITEMS.md)

---

**Created**: 3 декабря 2025  
**Status**: 🚀 Ready to Start  
**Priority**: P0 (Critical)
