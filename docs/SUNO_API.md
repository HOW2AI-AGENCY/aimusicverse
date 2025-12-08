# 🎵 Suno AI API v5 - Полная документация

## Обзор

Suno AI API v5 - это самая продвинутая версия API для генерации музыки с AI, поддерживающая:
- ✅ 174+ мета-тегов для точного контроля
- ✅ 277+ музыкальных стилей
- ✅ 75+ языков вокала
- ✅ Промпты до 5000 символов
- ✅ Стили до 1000 символов (до 500 для non-custom режима)

## API Endpoint

```
https://api.sunoapi.org
```

## Аутентификация

Все запросы требуют Bearer токен аутентификацию:

```bash
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

## Endpoints

### 1. POST /api/generate

Простая генерация музыки из текстового описания.

**Параметры:**

| Параметр | Тип | Обязательный | Max | Описание |
|----------|-----|--------------|-----|----------|
| `prompt` | string | ✓ | 500 | Описание желаемой музыки |
| `model` | string | ✗ | - | Версия модели (V5, V4_5, V4) |
| `make_instrumental` | boolean | ✗ | - | Без вокала |
| `wait_audio` | boolean | ✗ | - | Ждать завершения |

**Пример запроса:**

```bash
curl -X POST 'https://api.sunoapi.org/api/generate' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "Upbeat electronic dance music with strong bass and catchy melodies",
    "model": "V5",
    "make_instrumental": false
  }'
```

**Ответ:**

```json
{
  "code": "success",
  "message": "",
  "data": "task-id-uuid-here"
}
```

### 2. POST /api/custom_generate

Расширенная генерация с полным контролем над лирикой, стилем и настройками.

**Параметры:**

| Параметр | Тип | Обязательный | Max | Описание |
|----------|-----|--------------|-----|----------|
| `title` | string | ✓ | 100 | Название трека |
| `prompt` | string | ✓ | 5000 | Лирика с секциями |
| `style` | string | ✓ | 1000 | Meta tags и стиль |
| `instrumental` | boolean | ✗ | - | Без вокала |
| `model` | string | ✗ | - | V5 (default) |

**Пример запроса:**

```typescript
const response = await fetch('https://api.sunoapi.org/api/custom_generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUNO_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: "Cosmic Journey",
    prompt: `[Intro]
Soft synthesizer pads
[Verse]
Walking through the stars so bright
Lights dancing in the endless night
[Chorus]
Cosmic journey takes me high
Beyond the clouds and endless sky
[Bridge]
Floating in the space between
Colors that you've never seen
[Outro]
Fading into starlight`,
    style: "[Genre: Ambient Electronic] [Mood: Ethereal, Dreamy] [Instrument: Synthesizer, Pad, Piano] [Vocal Style: Breathy] [Language: English] [Texture: Wide Stereo, Reverb-Soaked]",
    instrumental: false,
    model: "V5"
  })
});

const result = await response.json();
// Returns: { code: "success", data: "task-id" }
```

### 3. POST /api/generate_lyrics

Генерация лирики с помощью AI на основе темы или описания.

**Параметры:**

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `prompt` | string | ✓ | Тема/описание для лирики |

**Пример:**

```typescript
const response = await fetch('https://api.sunoapi.org/api/generate_lyrics', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUNO_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: "A melancholic love song about lost opportunities in autumn"
  })
});

const result = await response.json();
```

**Ответ:**

```json
{
  "code": "success",
  "data": {
    "id": "lyrics-uuid",
    "text": "[Verse 1]\nFalling leaves in golden light\nMemories of you tonight\n...",
    "title": "Autumn Goodbye"
  }
}
```

### 4. GET /api/get

Получение информации о сгенерированных треках.

**Параметры:**

| Параметр | Тип | Описание |
|----------|-----|----------|
| `ids` | string | Comma-separated task IDs (опционально) |

**Примеры:**

```bash
# Все треки пользователя
curl 'https://api.sunoapi.org/api/get' \
  -H 'Authorization: Bearer YOUR_API_KEY'

# Конкретные треки
curl 'https://api.sunoapi.org/api/get?ids=task1,task2,task3' \
  -H 'Authorization: Bearer YOUR_API_KEY'
```

**Ответ:**

```json
{
  "code": "success",
  "data": [
    {
      "id": "track-uuid",
      "title": "Cosmic Journey",
      "status": "SUCCESS",
      "audio_url": "https://cdn.suno.ai/audio.mp3",
      "image_url": "https://cdn.suno.ai/cover.png",
      "video_url": "https://cdn.suno.ai/video.mp4",
      "model_name": "V5",
      "metadata": {
        "tags": ["[Genre: Ambient Electronic]", "[Mood: Dreamy]"],
        "prompt": "Original prompt text",
        "duration": 215
      }
    }
  ]
}
```

**Статусы трека:**

- `PENDING` - В очереди
- `PROCESSING` - Генерируется
- `SUCCESS` - Готов
- `FAILED` - Ошибка

### 5. GET /api/get_limit

Проверка оставшихся кредитов и квоты.

```bash
curl 'https://api.sunoapi.org/api/get_limit' \
  -H 'Authorization: Bearer YOUR_API_KEY'
```

**Ответ:**

```json
{
  "code": "success",
  "data": {
    "credits_left": 50,
    "monthly_quota": 500,
    "daily_used": 10
  }
}
```

### 6. POST /api/extend_audio

Продление или расширение существующего трека.

**Параметры:**

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `clip_id` | string | ✓ | ID трека для расширения |
| `continue_at` | string | ✗ | Инструкция продолжения |

**Пример:**

```typescript
const response = await fetch('https://api.sunoapi.org/api/extend_audio', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUNO_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    clip_id: "existing-track-uuid",
    continue_at: "[Bridge]\nNew section with different mood"
  })
});
```

## Модели

| Модель | ID | Статус | Промпт | Стиль | Особенности |
|--------|---|--------|--------|-------|-------------|
| v3.5 | V3_5 | Deprecated | 3000 | 200 | Устарела |
| v4 | V4 | Active | 3000 | 200 | Надежная |
| v4.5 | V4_5 | Active | 5000 | 1000 | Улучшенная |
| v4.5+ | V4_5PLUS | Active | 5000 | 1000 | Стабильная |
| **v5** | **V5** | **Latest** | **5000** | **1000** | **Лучшая** |

> **ВАЖНО:** Параметр `mv` устарел. Используйте `model` с значениями V5, V4_5PLUS, V4_5, V4, V3_5.
> Устаревшие chirp-* идентификаторы (chirp-crow, chirp-bluejay, chirp-auk, chirp-v4) больше не поддерживаются.

## Лучшие практики

### ✅ DO

- Используйте V5 для максимального качества
- Начинайте с 1-2 тегов на категорию
- Размещайте теги ПЕРЕД секцией, к которой они относятся
- Используйте формат `[Category: Value]` для v4.5+
- Комбинируйте максимум 2 жанра
- Проверяйте timestamp для защиты от replay атак

### ❌ DON'T

- Не используйте 3+ жанра одновременно
- Не смешивайте противоречивые настроения
- Не перегружайте эффектами (max 2-3)
- Не размещайте теги ПОСЛЕ лирики
- Не используйте устаревшие модели без необходимости
- Не используйте устаревший параметр `mv` - используйте `model`
- Не используйте chirp-* идентификаторы - используйте V5, V4_5, V4, etc.

## Примеры использования

### Пример 1: Простой трек

```typescript
const simpleTrack = {
  prompt: "Energetic pop music with catchy melodies and upbeat rhythm",
  model: "V5"
};
```

### Пример 2: Профессиональный контроль

```typescript
const professionalTrack = {
  title: "Digital Dreams",
  prompt: `[Intro]
Glitchy synth arpeggios
[Verse]
Lost in the digital maze
Neon lights and pixel haze
[Chorus]
Digital dreams in cyber space
Running through this virtual place
[Bridge]
Reality fades, connections made
In this electronic cascade
[Outro]
Logging off, back to life`,
  style: `[Genre: Synthwave, Electronic]
[Mood: Futuristic, Energetic]
[Instrument: Synthesizer, 808s, Electric Guitar]
[Vocal Style: Smooth, Processed]
[Language: English]
[Texture: Wide Stereo, Sidechained]
[Production: Layered, Polished]
[Energy: High]
[BPM: 128]`,
  model: "V5"
};
```

### Пример 3: Инструментальный трек

```typescript
const instrumentalTrack = {
  title: "Epic Orchestral Journey",
  style: `[Genre: Orchestral, Cinematic]
[Mood: Heroic, Epic, Dramatic]
[Instrument: String Ensemble, Brass Horns, Timpani, Choir Pad]
[Texture: Wide Stereo, Tape-Saturated]
[Production: Lush, Layered]
[Energy: High]
[Build]
[Crescendo]`,
  instrumental: true,
  model: "V5"
};
```

### Пример 4: Многоязычный трек

```typescript
const multilingualTrack = {
  title: "Global Unity",
  prompt: `[Verse | Language: English]
Together we stand, hand in hand
[Verse | Language: Spanish]
Juntos estamos, de la mano
[Verse | Language: Russian]
Вместе мы стоим рука об руку
[Chorus | Language: English, Spanish, Russian]
Unity, Unidad, Единство`,
  style: `[Genre: World Music, Pop]
[Mood: Uplifting, Inspiring]
[Instrument: Guitar, Piano, Strings]
[Vocal Style: Powerful, Emotional]`,
  model: "V5"
};
```

## Rate Limits

- **Бесплатный план**: 10 генераций/день
- **Pro план**: 100 генераций/день
- **Business план**: 500 генераций/день
- **Enterprise**: Custom

## Стоимость кредитов

- Простая генерация: ~1 кредит
- Кастомная генерация: ~1-2 кредита
- Расширение: ~0.5 кредита
- Генерация лирики: ~0.25 кредита

## Обработка ошибок

```typescript
try {
  const response = await fetch('https://api.sunoapi.org/api/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUNO_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded');
    }
    if (response.status === 402) {
      throw new Error('Insufficient credits');
    }
    if (response.status === 401) {
      throw new Error('Invalid API key');
    }
    throw new Error(`API error: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.code !== 'success') {
    throw new Error(result.message || 'Generation failed');
  }

  return result.data;
} catch (error) {
  console.error('Suno API error:', error);
  throw error;
}
```

## Мониторинг статуса

```typescript
async function pollTrackStatus(taskId: string): Promise<Track> {
  const maxAttempts = 30;
  const pollInterval = 2000; // 2 seconds

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(
      `https://api.sunoapi.org/api/get?ids=${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${SUNO_API_KEY}`
        }
      }
    );

    const result = await response.json();
    const track = result.data[0];

    if (track.status === 'SUCCESS') {
      return track;
    }

    if (track.status === 'FAILED') {
      throw new Error('Generation failed');
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Timeout waiting for track');
}
```

## История изменений

### 2025-12-08
- **BREAKING**: Параметр `mv` заменен на `model`
- **BREAKING**: Идентификаторы chirp-* заменены на V5, V4_5PLUS, V4_5, V4, V3_5
- Обновлены все примеры кода

## Дополнительные ресурсы

- 📖 [Официальная документация](https://docs.sunoapi.org)
- 💬 [Discord сообщество](https://discord.gg/suno)
- 🐛 [GitHub Issues](https://github.com/sunoai/api/issues)
- 📧 [Email поддержка](mailto:support@suno.com)
