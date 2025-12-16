# Adding New Commands to Telegram Bot - Developer Guide

**Last Updated:** 2025-12-16

## Quick Start

This guide shows you how to add new commands to the MusicVerse Telegram bot.

## File Structure

```
supabase/functions/telegram-bot/
├── bot.ts                  # Main router - ADD COMMAND IMPORT HERE
├── commands/
│   ├── your-command.ts    # Your new command - CREATE THIS
│   └── ...
├── handlers/
│   └── callback.ts        # ADD CALLBACK HANDLERS HERE
├── keyboards/
│   └── your-keyboard.ts   # Optional: Custom keyboards
└── config.ts              # ADD MESSAGES HERE
```

## Step 1: Create Command File

Create `supabase/functions/telegram-bot/commands/your-command.ts`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG } from '../config.ts';
import { logger } from '../utils/index.ts';
import { sendMessage, sendAudio } from '../telegram-api.ts';

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

/**
 * Handle /yourcommand
 * @param chatId - Telegram chat ID
 * @param userId - Telegram user ID
 * @param args - Command arguments
 */
export async function handleYourCommand(
  chatId: number,
  userId: number,
  args: string[]
): Promise<void> {
  try {
    logger.info('your_command_start', { chatId, userId, args });

    // 1. Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_id', userId)
      .single();

    if (!profile) {
      await sendMessage(
        chatId,
        '🔑 Требуется авторизация. Нажмите /start',
        undefined,
        null
      );
      return;
    }

    // 2. Process command logic
    const result = await processYourCommand(profile, args);

    // 3. Send response
    await sendMessage(
      chatId,
      result.message,
      'MarkdownV2',
      {
        inline_keyboard: [
          [
            { text: '🎵 Открыть приложение', web_app: { url: BOT_CONFIG.miniAppUrl } }
          ]
        ]
      }
    );

    logger.info('your_command_success', { chatId, userId });
  } catch (error) {
    logger.error('your_command_error', { error, chatId, userId });
    await sendMessage(
      chatId,
      '❌ Произошла ошибка. Попробуйте позже.',
      undefined,
      null
    );
  }
}

async function processYourCommand(profile: any, args: string[]) {
  // Your business logic here
  return {
    message: '✅ Команда выполнена успешно!'
  };
}
```

## Step 2: Register Command in Router

Edit `supabase/functions/telegram-bot/bot.ts`:

```typescript
async function handleCommand(
  command: string,
  args: string[],
  chatId: number,
  userId: number
) {
  switch (command) {
    // ... existing commands ...
    
    case '/yourcommand':
      const { handleYourCommand } = await import('./commands/your-command.ts');
      await handleYourCommand(chatId, userId, args);
      break;
    
    // ... rest of cases ...
  }
}
```

## Step 3: Add Command to BotFather

1. Open [@BotFather](https://t.me/BotFather) in Telegram
2. Send `/mybots`
3. Select @AIMusicVerseBot
4. Choose "Edit Bot" → "Edit Commands"
5. Add your command:
```
yourcommand - Brief description of what it does
```

## Step 4: Add to Config (Optional)

Edit `supabase/functions/telegram-bot/config.ts`:

```typescript
export const BOT_CONFIG = {
  // ... existing config ...
  
  messages: {
    // ... existing messages ...
    
    yourCommand: {
      success: '✅ Команда выполнена!',
      error: '❌ Ошибка выполнения команды',
      help: 'Используйте: /yourcommand [аргументы]'
    }
  }
};
```

## Step 5: Add Callback Handlers (If Needed)

If your command uses inline keyboard buttons, add callback handlers in `handlers/callback.ts`:

```typescript
export async function handleCallbackQuery(callbackQuery: any) {
  const data = callbackQuery.data;
  
  if (data.startsWith('your_action_')) {
    const id = data.replace('your_action_', '');
    await handleYourAction(callbackQuery.message.chat.id, id);
    await answerCallbackQuery(callbackQuery.id, 'Действие выполнено!');
    return;
  }
  
  // ... existing handlers ...
}

async function handleYourAction(chatId: number, id: string) {
  // Handle the callback
}
```

## Common Patterns

### Pattern 1: Command with Database Query

```typescript
export async function handleListCommand(chatId: number, userId: number) {
  const { data: items } = await supabase
    .from('your_table')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  const message = items?.map(item => `• ${item.name}`).join('\n') || 'Нет элементов';
  await sendMessage(chatId, message);
}
```

### Pattern 2: Command with Pagination

```typescript
export async function handlePaginatedCommand(
  chatId: number,
  userId: number,
  page: number = 1
) {
  const pageSize = 5;
  const offset = (page - 1) * pageSize;

  const { data: items, count } = await supabase
    .from('your_table')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .range(offset, offset + pageSize - 1);

  const totalPages = Math.ceil((count || 0) / pageSize);

  await sendMessage(chatId, formatItems(items), 'MarkdownV2', {
    inline_keyboard: [
      [
        { text: '◀️ Назад', callback_data: `page_${page - 1}` },
        { text: `${page}/${totalPages}`, callback_data: 'noop' },
        { text: 'Вперёд ▶️', callback_data: `page_${page + 1}` }
      ]
    ]
  });
}
```

### Pattern 3: Command with File Upload

```typescript
export async function handleUploadCommand(chatId: number, file: any) {
  // 1. Download file from Telegram
  const fileUrl = await getFileUrl(file.file_id);
  const response = await fetch(fileUrl);
  const blob = await response.blob();

  // 2. Upload to Supabase Storage
  const fileName = `${crypto.randomUUID()}.${file.mime_type.split('/')[1]}`;
  const { data: uploadData } = await supabase.storage
    .from('uploads')
    .upload(fileName, blob);

  // 3. Process file
  const result = await processFile(uploadData.path);

  await sendMessage(chatId, `✅ Файл обработан: ${result}`);
}
```

### Pattern 4: Command with Async Task

```typescript
export async function handleAsyncCommand(chatId: number, userId: number) {
  // 1. Create task
  const { data: task } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      status: 'pending',
      type: 'your_task_type'
    })
    .select()
    .single();

  // 2. Send immediate response
  await sendMessage(
    chatId,
    '⏳ Задача запущена. Вы получите уведомление по завершении.',
    undefined,
    {
      inline_keyboard: [[
        { text: '🔍 Проверить статус', callback_data: `task_${task.id}` }
      ]]
    }
  );

  // 3. Process asynchronously (in another function/edge function)
  // The task will send notification when complete
}
```

## Testing Your Command

### 1. Local Testing (Development)

```bash
# Send test message via Telegram API
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
  -d "chat_id=$YOUR_CHAT_ID&text=/yourcommand arg1 arg2"
```

### 2. Edge Function Testing

```bash
# Deploy function
supabase functions deploy telegram-bot

# Test via webhook
curl -X POST "https://[SUPABASE_URL]/functions/v1/telegram-bot" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "chat": {"id": 123456789},
      "from": {"id": 123456789},
      "text": "/yourcommand arg1 arg2"
    }
  }'
```

### 3. Integration Testing

Create a test file in `tests/telegram-bot/`:

```typescript
import { describe, it, expect } from '@jest/globals';
import { handleYourCommand } from '../../supabase/functions/telegram-bot/commands/your-command';

describe('YourCommand', () => {
  it('should execute successfully', async () => {
    const result = await handleYourCommand(123, 456, ['arg1']);
    expect(result).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    // Test error scenarios
  });
});
```

## Best Practices

### ✅ DO

1. **Always validate user authentication**
   ```typescript
   if (!profile) {
     await sendMessage(chatId, '🔑 Требуется авторизация');
     return;
   }
   ```

2. **Log all actions**
   ```typescript
   logger.info('command_start', { chatId, userId, args });
   ```

3. **Handle errors gracefully**
   ```typescript
   try {
     // command logic
   } catch (error) {
     logger.error('command_error', error);
     await sendMessage(chatId, '❌ Ошибка');
   }
   ```

4. **Use MarkdownV2 escaping**
   ```typescript
   import { escapeMarkdownV2 } from '../utils/text-processor.ts';
   const text = escapeMarkdownV2(userInput);
   ```

5. **Provide clear user feedback**
   ```typescript
   await sendMessage(chatId, '✅ Действие выполнено успешно');
   ```

6. **Add inline keyboard buttons**
   ```typescript
   {
     inline_keyboard: [
       [{ text: '🎵 Открыть', url: deepLink }]
     ]
   }
   ```

### ❌ DON'T

1. **Don't expose internal errors to users**
   ```typescript
   // BAD
   await sendMessage(chatId, error.message);
   
   // GOOD
   logger.error('error', error);
   await sendMessage(chatId, '❌ Произошла ошибка');
   ```

2. **Don't forget rate limiting**
   ```typescript
   if (!checkRateLimit(userId, 10, 60000)) {
     await sendMessage(chatId, '⏳ Слишком много запросов');
     return;
   }
   ```

3. **Don't block the response**
   ```typescript
   // BAD - blocks webhook response
   await longRunningTask();
   
   // GOOD - async processing
   createTask().then(processAsync);
   await sendMessage(chatId, '⏳ Задача запущена');
   ```

4. **Don't send too many messages at once**
   ```typescript
   // Use pagination or summary instead of spamming
   ```

## Command Types

### 1. Query Command
Returns information without modifying data.
**Examples:** `/stats`, `/status`, `/library`

### 2. Action Command
Performs an action and returns result.
**Examples:** `/generate`, `/remix`, `/upload`

### 3. Settings Command
Modifies user preferences.
**Examples:** `/settings`, `/notify`

### 4. Navigation Command
Opens app or changes context.
**Examples:** `/app`, `/start`

## Inline Keyboard Patterns

### Simple Button
```typescript
{
  inline_keyboard: [
    [{ text: '🎵 Action', callback_data: 'action_id' }]
  ]
}
```

### Multiple Rows
```typescript
{
  inline_keyboard: [
    [{ text: 'Option 1', callback_data: 'opt1' }],
    [{ text: 'Option 2', callback_data: 'opt2' }],
    [{ text: 'Cancel', callback_data: 'cancel' }]
  ]
}
```

### Web App Button
```typescript
{
  inline_keyboard: [
    [{ text: '🎵 Open App', web_app: { url: BOT_CONFIG.miniAppUrl } }]
  ]
}
```

### URL Button
```typescript
{
  inline_keyboard: [
    [{ text: '🔗 Open Link', url: 'https://example.com' }]
  ]
}
```

## Troubleshooting

### Issue: Command not responding
**Check:**
- Is command registered in `bot.ts`?
- Is webhook working? (`/getWebhookInfo`)
- Are there any errors in Supabase logs?

### Issue: Markdown formatting broken
**Solution:** Use `escapeMarkdownV2()` for all user-generated content

### Issue: Callback query timeout
**Solution:** Answer callback query within 10 seconds, even if action is still processing

## Resources

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Bot Commands Reference](./TELEGRAM_BOT_COMMANDS_REFERENCE.md)
- [Inline Mode Implementation](./TELEGRAM_BOT_INLINE_MODE_IMPLEMENTATION.md)

---

**Happy Coding! 🚀**
