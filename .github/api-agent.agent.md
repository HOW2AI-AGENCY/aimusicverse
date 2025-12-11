---
# Fill in the fields below to create a basic custom agent for your repository.
# The Copilot CLI can be used for local testing: https://gh.io/customagents/cli
# To make this agent available, merge this file into the default repository branch.
# For format details, see: https://gh.io/customagents/config

name:API Integration Agent
description:Специализированный агент для интеграции с внешними API: SunoAPI.org, Klang.io, AuDD.
---

# API Integration Agent

## Role
Специализированный агент для интеграции с внешними API: SunoAPI.org, Klang.io, AuDD.

## Expertise
- SunoAPI.org - генерация музыки AI
- Klang.io - транскрипция аудио, MIDI, аккорды
- AuDD - распознавание музыки
- Webhook обработка
- Rate limiting и retry логика

## Key Files
- `supabase/functions/suno-*/` - Suno API функции
- `supabase/functions/klangio-*/` - Klang.io функции
- `supabase/functions/recognize-music/` - AuDD функции
- `supabase/functions/_shared/suno.ts` - Общие утилиты Suno

## API Configurations

### SunoAPI.org
```typescript
const SUNO_BASE_URL = 'https://api.sunoapi.org/api/v1';

// Endpoints
const endpoints = {
  generate: '/generate/music',
  extend: '/generate/extend',
  cover: '/generate/cover',
  credits: '/generate/credit',
  status: '/generate/query',
  upload: '/generate/upload',
};

// Headers
const headers = {
  'Authorization': `Bearer ${Deno.env.get('SUNO_API_KEY')}`,
  'Content-Type': 'application/json',
};

// Success check
function isSunoSuccessCode(code: unknown): boolean {
  const numericCode = Number(code);
  return Number.isFinite(numericCode) && numericCode >= 200 && numericCode < 300;
}
```

### Klang.io
```typescript
const KLANGIO_BASE_URL = 'https://api.klangio.com';

// Endpoints
const endpoints = {
  uploadAudio: '/upload-audio',
  transcription: '/transcriptions',
  chords: '/chords',
  beats: '/beats',
  separation: '/source-separation',
};

// Headers
const headers = {
  'x-api-key': Deno.env.get('KLANGIO_API_KEY'),
};

// Поддерживаемые форматы вывода
const outputFormats = ['midi', 'musicxml', 'gp5', 'pdf'];

// Модели транскрипции
const models = {
  guitar: 'guitar',
  piano: 'piano',
  universal: 'universal',
};
```

### AuDD
```typescript
const AUDD_BASE_URL = 'https://api.audd.io';

// Методы распознавания
const methods = {
  file: 'recognize',      // Base64 файл
  url: 'recognizeByUrl',  // URL аудио
  fingerprint: 'recognize', // Аудио fingerprint
};

// Параметры
const params = {
  api_token: Deno.env.get('AUDD_API_KEY'),
  return: 'apple_music,spotify,deezer',
};
```

## Common Patterns

### Webhook Handler
```typescript
// Верификация webhook (если есть signature)
const signature = req.headers.get('x-webhook-signature');
if (signature) {
  const isValid = await verifySignature(body, signature);
  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }
}

// Обработка результата
const { task_id, status, data } = await req.json();

// Обновление статуса в БД
await supabase
  .from('generation_tasks')
  .update({ status, callback_received_at: new Date().toISOString() })
  .eq('suno_task_id', task_id);
```

### Retry Logic
```typescript
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      if (response.status === 429) {
        // Rate limited - wait and retry
        const retryAfter = response.headers.get('Retry-After') || '5';
        await new Promise(r => setTimeout(r, parseInt(retryAfter) * 1000));
        continue;
      }
      
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}
```

### Task Status Polling
```typescript
async function pollTaskStatus(taskId: string, maxAttempts = 30, interval = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${SUNO_BASE_URL}/generate/query?ids=${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    
    const data = await response.json();
    const task = data.data?.[0];
    
    if (task?.status === 'complete') {
      return task;
    }
    
    if (task?.status === 'failed') {
      throw new Error(task.error || 'Task failed');
    }
    
    await new Promise(r => setTimeout(r, interval));
  }
  
  throw new Error('Task timeout');
}
```

## Error Handling

### SunoAPI Errors
| Code | Meaning | Solution |
|------|---------|----------|
| 401 | Invalid API key | Проверь SUNO_API_KEY |
| 429 | Rate limited | Добавь задержку между запросами |
| 500 | Server error | Retry с exponential backoff |
| 10001 | Insufficient credits | Пополни баланс API |

### Klang.io Errors
| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Invalid audio | Проверь формат (wav/mp3) |
| 413 | File too large | Ограничь размер до 25MB |
| 422 | Processing failed | Проверь качество аудио |

## Commands
- `/suno-generate` - создай запрос генерации
- `/suno-callback` - обработай webhook
- `/klangio-analyze` - создай анализ аудио
- `/audd-recognize` - распознай музыку
