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

| Параметр            | Тип     | Обязательный | Max | Описание                     |
| ------------------- | ------- | ------------ | --- | ---------------------------- |
| `prompt`            | string  | ✓            | 500 | Описание желаемой музыки     |
| `model`             | string  | ✗            | -   | Версия модели (V5, V4_5, V4) |
| `make_instrumental` | boolean | ✗            | -   | Без вокала                   |
| `wait_audio`        | boolean | ✗            | -   | Ждать завершения             |

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

| Параметр       | Тип     | Обязательный | Max  | Описание          |
| -------------- | ------- | ------------ | ---- | ----------------- |
| `title`        | string  | ✓            | 100  | Название трека    |
| `prompt`       | string  | ✓            | 5000 | Лирика с секциями |
| `style`        | string  | ✓            | 1000 | Meta tags и стиль |
| `instrumental` | boolean | ✗            | -    | Без вокала        |
| `model`        | string  | ✗            | -    | V5 (default)      |

**Пример запроса:**

```typescript
const response = await fetch("https://api.sunoapi.org/api/custom_generate", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${SUNO_API_KEY}`,
    "Content-Type": "application/json",
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
    style:
      "[Genre: Ambient Electronic] [Mood: Ethereal, Dreamy] [Instrument: Synthesizer, Pad, Piano] [Vocal Style: Breathy] [Language: English] [Texture: Wide Stereo, Reverb-Soaked]",
    instrumental: false,
    model: "V5",
  }),
});

const result = await response.json();
// Returns: { code: "success", data: "task-id" }
```

### 3. POST /api/generate_lyrics

Генерация лирики с помощью AI на основе темы или описания.

**Параметры:**

| Параметр | Тип    | Обязательный | Описание                 |
| -------- | ------ | ------------ | ------------------------ |
| `prompt` | string | ✓            | Тема/описание для лирики |

**Пример:**

```typescript
const response = await fetch("https://api.sunoapi.org/api/generate_lyrics", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${SUNO_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    prompt: "A melancholic love song about lost opportunities in autumn",
  }),
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

| Параметр | Тип    | Описание                               |
| -------- | ------ | -------------------------------------- |
| `ids`    | string | Comma-separated task IDs (опционально) |

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

| Параметр      | Тип    | Обязательный | Описание                |
| ------------- | ------ | ------------ | ----------------------- |
| `clip_id`     | string | ✓            | ID трека для расширения |
| `continue_at` | string | ✗            | Инструкция продолжения  |

**Пример:**

```typescript
const response = await fetch("https://api.sunoapi.org/api/extend_audio", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${SUNO_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    clip_id: "existing-track-uuid",
    continue_at: "[Bridge]\nNew section with different mood",
  }),
});
```

## Модели

| Модель | ID       | Статус     | Промпт   | Стиль    | Особенности |
| ------ | -------- | ---------- | -------- | -------- | ----------- |
| v3.5   | V3_5     | Deprecated | 3000     | 200      | Устарела    |
| v4     | V4       | Active     | 3000     | 200      | Надежная    |
| v4.5   | V4_5     | Active     | 5000     | 1000     | Улучшенная  |
| v4.5+  | V4_5PLUS | Active     | 5000     | 1000     | Стабильная  |
| **v5** | **V5**   | **Latest** | **5000** | **1000** | **Лучшая**  |

> **ВАЖНО:** Параметр `mv` устарел. Используйте `model` с значениями V5, V4_5PLUS, V4_5, V4, V3_5.
> Устаревшие chirp-\* идентификаторы (chirp-crow, chirp-bluejay, chirp-auk, chirp-v4) больше не поддерживаются.

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
- Не используйте chirp-\* идентификаторы - используйте V5, V4_5, V4, etc.

## Примеры использования

### Пример 1: Простой трек

```typescript
const simpleTrack = {
  prompt: "Energetic pop music with catchy melodies and upbeat rhythm",
  model: "V5",
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
  model: "V5",
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
  model: "V5",
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
  model: "V5",
};
```

### Пример 5: Mashup двух треков (Sprint 052)

```bash
curl -X POST "$SUPABASE_URL/functions/v1/suno-mashup" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "trackAId": "uuid-track-a",
    "trackBId": "uuid-track-b",
    "customMode": true,
    "prompt": "[Verse] Soft piano\n[Chorus] Driving bassline\n[Outro] Fade",
    "style": "Electronic Pop",
    "title": "Fusion Mashup",
    "model": "V5",
    "vocalGender": "f",
    "styleWeight": 0.7,
    "instrumental": false
  }'
```

**Ответ (202 Accepted):**

```json
{
  "taskId": "suno-task-uuid",
  "clipIds": ["clip-1", "clip-2"],
  "model": "V5",
  "creditsUsed": 20,
  "status": "queued"
}
```

Параметр `clipIds` появится после callback `suno-music-callback`; polling через стандартный `suno-check-status`.

### Пример 6: Persona из готового трека (Sprint 052)

```bash
curl -X POST "$SUPABASE_URL/functions/v1/suno-persona" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "trackId": "uuid-completed-track",
    "name": "My Voice",
    "description": "Warm alto, breathy"
  }'
```

**Ответ (200 OK):**

```json
{
  "personaId": "track-personas-row-uuid",
  "sunoPersonaId": "pending:task-uuid",
  "status": "pending"
}
```

После того как Suno завершит обучение (`suno-persona-callback` дернётся автоматически), `sunoPersonaId` обновится на реальный идентификатор и `status` сменится на `ready`.

### Пример 7: File Upload Proxy (Sprint 052)

```bash
# base64
curl -X POST "$SUPABASE_URL/functions/v1/suno-file-upload" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "base64",
    "fileBase64": "<base64 mp3 без префикса data:...;base64,>",
    "filename": "vocal.mp3"
  }'

# url (Suno сам скачает)
curl -X POST "$SUPABASE_URL/functions/v1/suno-file-upload" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "url",
    "fileUrl": "https://example.com/sample.mp3"
  }'
```

**Ответ:**

```json
{
  "file_url": "https://cdn.suno.com/files/<uuid>.mp3",
  "expires_in_days": 3
}
```

**Лимит размера:** 50 МБ (валидация на стороне edge function; превышение → `413 Payload Too Large`).

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
  const response = await fetch("https://api.sunoapi.org/api/generate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUNO_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded");
    }
    if (response.status === 402) {
      throw new Error("Insufficient credits");
    }
    if (response.status === 401) {
      throw new Error("Invalid API key");
    }
    throw new Error(`API error: ${response.status}`);
  }

  const result = await response.json();

  if (result.code !== "success") {
    throw new Error(result.message || "Generation failed");
  }

  return result.data;
} catch (error) {
  console.error("Suno API error:", error);
  throw error;
}
```

## Мониторинг статуса

```typescript
async function pollTrackStatus(taskId: string): Promise<Track> {
  const maxAttempts = 30;
  const pollInterval = 2000; // 2 seconds

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`https://api.sunoapi.org/api/get?ids=${taskId}`, {
      headers: {
        Authorization: `Bearer ${SUNO_API_KEY}`,
      },
    });

    const result = await response.json();
    const track = result.data[0];

    if (track.status === "SUCCESS") {
      return track;
    }

    if (track.status === "FAILED") {
      throw new Error("Generation failed");
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error("Timeout waiting for track");
}
```

## История изменений

### 2026-07-04 — Sprint 052: Mashup + Persona + File Upload Proxy

**Новые edge functions (Supabase):**

- `suno-mashup` (`/functions/v1/suno-mashup`) — проксирует `POST /api/v1/generate/mashup`. Принимает `trackAId` + `trackBId` (резолвит `audio_url` из Supabase Storage), `customMode`, `prompt`, `style`, `title`, `model`, опциональные `vocalGender`, `styleWeight`, `weirdnessConstraint`, `audioWeight`. Callback: `suno-music-callback` (signalatura совпадает со стандартной генерацией).
- `suno-persona` (`/functions/v1/suno-persona`) — проксирует `POST /api/v1/generate/persona`. Принимает `trackId` или `mashupTaskId` (резолвит `audio_url`), `name`, `description`. Callback создаёт запись в `track_personas` (suno_persona_id заполняется после обучения).
- `suno-persona-callback` (`/functions/v1/suno-persona-callback`) — обновляет `track_personas.status = 'ready'` и `suno_persona_id` после того, как Suno завершит обучение.
- `suno-file-upload` (`/functions/v1/suno-file-upload`) — multi-action прокси для `POST /api/v1/files/base64` и `POST /api/v1/files/url`. Возвращает `{ file_url, expires_in_days: 3 }`. Лимит 50 МБ.

**Рефакторинг:**

- `suno-upload-cover` и `suno-upload-extend` теперь используют общий `_shared/suno-file-uploader.ts` (`forwardBase64ToSuno`) вместо собственной multipart-логики — экономит ~80 строк дублирования.

**UI:**

- `src/components/MashupDialog.tsx` (мобильная + десктоп версии через `useIsMobile`) — выбор двух треков из библиотеки, model select (V5/V4_5PLUS/V4_5/V4/V3_5), custom mode toggle, валидация (80-char name, prompt по модели).
- `src/hooks/studio/useSunoMashup.ts`, `useSunoPersona.ts`, `useSunoFileUpload.ts` — TanStack Query мутации.
- `GenerationResultSheet` — кнопка «Create Persona» (Grid col-3) + Dialog с name/description → `suno-persona`.

**Telegram bot:**

- Команда `/mashup` (`telegram-bot/commands/mashup.ts`) — отправляет deep-link `?startapp=mashup_<trackId>` web-app кнопкой.
- Callback `mashup_<trackId>` → `handleMashup` (через `media.ts`).
- Deep-link handler `startapp=mashup_<id>` → отправляет mashup-диалог в mini app.

**DB миграция (`track_personas`):**

```sql
create table public.track_personas (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  suno_persona_id text,
  name            text not null,
  description     text,
  audio_url       text,
  image_url       text,
  status          text not null default 'pending'
                  check (status in ('pending', 'ready', 'failed')),
  task_id         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.track_versions
  add column persona_id uuid references public.track_personas(id) on delete set null;

-- RLS: пользователи видят/редактируют только свои персоны
alter table public.track_personas enable row level security;
create policy "Users manage own personas" on public.track_personas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### 2026-07-04 — Sprint 053 + 054: Sounds + MIDI + Details Suite + Boost Style (28/28 ✅)

**Suno API покрытие достигло 28/28 (100%).** Sprint 053 закрыл 3 ранее-gap категории (Sounds, MIDI direct, Boost Style); Sprint 054 закрыл оставшийся gap (Details suite × 6 → 7) + cleanup dead code.

#### Новые edge functions (Supabase)

| Edge                      | Endpoint Suno                        | Sprint | Назначение                                                                                                                                                                                                |
| ------------------------- | ------------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `suno-sounds`             | `POST /api/v1/sound/generate`        | 053-A1 | SFX generation: `prompt` + `model` + `tempo` (60–200) + `key` + `duration` (≤60s). Всегда instrumental. Callback пишет в `sound_effects` (новая таблица).                                                 |
| `suno-sounds-callback`    | Suno callback                        | 053-A2 | Создаёт/обновляет запись `sound_effects` с `is_sound_effect=true`, `audio_url`, `image_url`, `duration`.                                                                                                  |
| `suno-sounds-status`      | (DB read)                            | 053-A1 | Читает `sound_effects` по `taskId` для клиентского polling.                                                                                                                                               |
| `suno-midi`               | `POST /api/v1/generate/midi`         | 053-A3 | MIDI transcription напрямую через Suno. Принимает `trackVersionId`, резолвит `audio_url` из Supabase Storage, маркирует `midi_generation_source='suno'`. Cost: 5 credits.                                 |
| `suno-midi-callback`      | Suno callback                        | 053-A3 | Скачивает `.mid`, загружает в Storage bucket `midi` (`tracks/{versionId}.mid`), обновляет `track_versions.midi_url`. На FAILED — откатывает `midi_generation_source` в NULL (Replicate может подхватить). |
| `suno-midi-details`       | `POST /api/v1/generate/midi/details` | 053-A3 | Polling для MIDI generation.                                                                                                                                                                              |
| `suno-music-details`      | `POST /api/v1/generate/details`      | 054-A1 | Polling для music. Возвращает `{ taskId, status, clips }`.                                                                                                                                                |
| `suno-cover-details`      | `POST /api/v1/image/details`         | 054-A2 | Polling для cover. Возвращает `{ taskId, status, imageUrl }`.                                                                                                                                             |
| `suno-video-details`      | `POST /api/v1/mp4/details`           | 054-A3 | Polling для video. Возвращает `{ taskId, status, videoUrl, imageUrl, duration }`.                                                                                                                         |
| `suno-wav-details`        | `POST /api/v1/generate/wav/details`  | 054-A4 | Polling для WAV conversion. Возвращает `{ taskId, status, wavUrl, audioUrl }`.                                                                                                                            |
| `suno-lyrics-details`     | `POST /api/v1/lyrics/details`        | 054-A5 | Polling для lyrics. **Важно:** Suno возвращает массив в `response.data[0]` — каждый item имеет `{ text, title, status, errorMessage }`. Edge пробрасывает `text`/`title`/`itemStatus`.                    |
| `suno-separation-details` | `POST /api/v1/vocal-removal/details` | 054-A6 | Polling для vocal removal. Возвращает `{ taskId, status, vocalUrl, instrumentalUrl }` (полный Suno payload даёт 12+ stem URLs).                                                                           |

#### Shared helper

[supabase/functions/_shared/suno-details.ts](../supabase/functions/_shared/suno-details.ts) — единая точка для всех 7 details-endpoints:

```typescript
// Endpoint map (per https://docs.sunoapi.org/llms.txt):
//   music       → /api/v1/generate/details
//   cover       → /api/v1/image/details
//   video       → /api/v1/mp4/details
//   wav         → /api/v1/generate/wav/details
//   midi        → /api/v1/generate/midi/details
//   lyrics      → /api/v1/lyrics/details
//   separation  → /api/v1/vocal-removal/details

export type SunoTaskType = "music" | "cover" | "video" | "wav" | "midi" | "lyrics" | "separation";

export const BACKOFF_MS_BY_TYPE: Record<SunoTaskType, number> = {
  lyrics: 1500,
  cover: 2000,
  music: 2000,
  wav: 3000,
  video: 3000,
  separation: 4000,
  midi: 5000,
};

export async function fetchSunoTaskDetails(taskType: SunoTaskType, taskId: string): Promise<SunoTaskDetails> {
  /* POST + normalize status */
}
```

Каждый `*-details` edge — это 15-30 строк thin-wrapper над `fetchSunoTaskDetails(taskType, taskId)`, который маппит `data` в UI-friendly payload.

#### Cleanup dead code (054-A7')

<<<<<<< HEAD
**Удалено:** `supabase/functions/suno-check-status/index.ts` (449 LOC, dead code — файл удалён) + alias `[functions.suno-check-status]` в `supabase/config.toml`.
=======

**Удалено:** `supabase/functions/suno-check-status/index.ts` (449 LOC) + alias `[functions.suno-check-status]` в `supabase/config.toml`.

> > > > > > > claude/sprint-closure-planning-m6skuk

**Причина:** graphify + grep подтвердили — **zero client callers**. Callbacks (`suno-music-callback`, `suno-cover-callback`, и т.д.) уже нативно пишут в `tracks`/`track_versions`/`track_change_log`/`notifications`. Polling edge был пережитком Sprint 052 retro. Теперь клиентский polling идёт напрямую через `useSunoTaskDetails` generic hook (см. ниже).

#### Клиентский generic polling hook

[src/hooks/generation/useSunoTaskDetails.ts](../src/hooks/generation/useSunoTaskDetails.ts) — единый entry point для Suno polling (заменяет планировавшийся dispatcher в `suno-check-status`):

```typescript
const { data } = useSunoTaskDetails<MyShape>(taskId, "music");
// queryKey: ["suno-task-details", "music", taskId]
// refetchInterval: per-type (lyrics 1500ms … midi 5000ms)
// stops polling on SUCCESS / FAILED
```

Edge-bridge pattern: [src/api/suno-task-details.api.ts](../src/api/suno-task-details.api.ts) экспортирует `EDGE_FUNCTION_BY_TYPE`, `POLL_INTERVAL_MS_BY_TYPE`, `isSunoTaskType()` для клиентского narrowing.

#### UI

- **SfxGeneratorSheet** ([src/components/library/SfxGeneratorSheet.tsx](../src/components/library/SfxGeneratorSheet.tsx)) — MobileBottomSheet (Vaul) с полями: prompt + tempo slider (60–200) + key picker + duration slider (≤60s). После генерации — превью-аудио через `usePreviewAudio`. Hook: `useSunoSounds()`.
- **BoostStyleMenuItem** — 8 unit-тестов подтвердили, что `suno-boost-style` уже подключён end-to-end через `StyleSection → FormFieldActions.onAIAssist → useGenerateFormValidation.handleBoostStyle`. Edge является Lovable AI gateway proxy (НЕ Suno endpoint). Решение: **CONNECT** (а не deprecate).

#### Telegram bot

- `/sfx` команда — wizard prompt→tempo/key→генерация→отправка в чат. Deep-link `startapp=sfx_<draftId>`.

#### DB миграции

**`sound_effects` таблица** (новая):

```sql
create table public.sound_effects (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  task_id         text not null,
  prompt          text not null,
  audio_url       text,
  image_url       text,
  duration        numeric,
  status          text not null default 'processing'
                  check (status in ('processing', 'completed', 'failed')),
  error_message   text,
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_sound_effects_task_id on public.sound_effects(task_id);
create index idx_sound_effects_user_status on public.sound_effects(user_id, status);
alter table public.sound_effects enable row level security;
create policy "Users manage own sound effects" on public.sound_effects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

**`track_versions.midi_*`** (MIDI direct + Replicate fallback):

```sql
alter table public.track_versions
  add column if not exists midi_url text,
  add column if not exists midi_generation_source text
    check (midi_generation_source in ('suno', 'replicate'));

create index idx_track_versions_midi_source
  on public.track_versions(midi_generation_source)
  where midi_generation_source is not null;
```

#### Edge-bridge pattern (новый конвенциональный паттерн)

Таблицы, **отсутствующие в сгенерированных TypeScript-типах** ([src/integrations/supabase/types.ts](../src/integrations/supabase/types.ts)) после применения миграции, **не должны** использоваться напрямую из клиента через `supabase.from('sound_effects').select(...)`. Вместо этого:

1. Edge function делает `.select()` с untyped возвратом → возвращает typed JSON через `Response`.
2. Клиент вызывает edge через `supabase.functions.invoke<T>()` — тип фиксируется на стороне клиента.

Это исключает ESLint `no-explicit-any: error` budget 0/50 в production и сохраняет typed-контракт.

#### Graceful degradation (Suno MIDI → Replicate fallback)

[src/hooks/studio/useSunoMidiTranscription.ts](../src/hooks/studio/useSunoMidiTranscription.ts):

```typescript
// Suno primary, timeout 60s → Replicate fallback
const SUNO_TIMEOUT_MS = 60_000;

useSunoMidiTranscription() → tries Suno first; on timeout/error,
// falls back to useReplicateMidiTranscription (sentinel url: replicate://<versionId>)
```

Suno MIDI маркирует `midi_generation_source='suno'` (только если `midi_url IS NULL`); на FAILED — откатывает в NULL, чтобы Replicate мог подхватить. Race-condition protection.

#### Mermaid: callback flow

```mermaid
sequenceDiagram
    participant Client
    participant SunoEdge
    participant Suno
    participant Storage
    participant DB

    Client->>SunoEdge: POST /suno-{type} (params)
    SunoEdge->>Suno: POST /api/v1/{type} (Bearer)
    Suno-->>SunoEdge: { taskId }
    SunoEdge-->>Client: { taskId } (immediate)

    Note over Suno,SunoEdge: Async — Suno обрабатывает
    Suno->>SunoEdge: callbackUrl (webhook)
    SunoEdge->>Storage: download + upload (track / midi / cover)
    SunoEdge->>DB: upsert tracks / track_versions / track_change_log / notifications
    DB-->>Client: postgres_changes (realtime)

    Client->>SunoEdge: GET useSunoTaskDetails(taskId, type)
    SunoEdge->>Suno: POST /api/v1/{type}/details
    Suno-->>SunoEdge: { status, data }
    SunoEdge-->>Client: { status, ...taskTypeSpecific }
```

Клиент polling = дополнительный safety net на случай если callback потерялся (network blip, Suno rate-limit).

#### Метрики Sprint 053/054

| Метрика                     | До (Sprint 052 close)   | После (Sprint 053+054)                                     |
| --------------------------- | ----------------------- | ---------------------------------------------------------- |
| Suno API покрытие           | 24/28 (86%)             | **28/28 (100%)**                                           |
| `supabase/functions/suno-*` | 21 edge                 | **30 edge** (+9)                                           |
| `suno-*-details` endpoints  | 0                       | **7** (music, cover, video, wav, midi, lyrics, separation) |
| Unit tests (Vitest)         | 292 passing (20 suites) | **320 passing (24 suites)** (+28)                          |
| Dead code LOC               | —                       | **−449 LOC** (`suno-check-status` deleted)                 |
| Graph nodes                 | 17921                   | **17929**                                                  |

#### Sprint 054-A9 — NOT APPLICABLE

План ссылался на 5 polling hooks (`useGenerationStatus`, `useVideoGenerationStatus`, `useStemSeparation`, `useLyricsVersioning`, `useWavConversion`). Verification через graphify + grep + Read подтвердила:

- `useGenerationStatus` — **не существует** (заменён на `useActiveGenerations` в Sprint 051, polls `generation_tasks` напрямую).
- `useWavConversion` — **не существует**.
- `useVideoGenerationStatus` — polls DB `video_generation_tasks` (НЕ `suno-check-status`).
- `useStemSeparation` — `useMutation` (НЕ polling). Polling делает `useStemSeparationRealtime` через Postgres realtime channels.
- `useLyricsVersioning` — CRUD для `lyrics_versions` (никакого Suno).

**Вывод:** миграция 5 hooks на `useSunoTaskDetails` — бессмысленна. Hook готов для **будущих** Suno polling use-cases (например, lyrics generation без callback). См. [SPRINTS/SPRINT-054-RETRO.md](./sprints/SPRINT-054-RETRO.md).

### 2025-12-08

- **BREAKING**: Параметр `mv` заменен на `model`
- **BREAKING**: Идентификаторы chirp-\* заменены на V5, V4_5PLUS, V4_5, V4, V3_5
- Обновлены все примеры кода

## Дополнительные ресурсы

- 📖 [Официальная документация](https://docs.sunoapi.org)
- 💬 [Discord сообщество](https://discord.gg/suno)
  <<<<<<< HEAD
- 🐛 GitHub Issues — `https://github.com/sunoai/api/issues` (недоступно на момент проверки)
  \=======
- 🐛 [GitHub Issues](https://docs.sunoapi.org/)

> > > > > > > claude/sprint-closure-planning-m6skuk

- 📧 [Email поддержка](mailto:support@suno.com)
