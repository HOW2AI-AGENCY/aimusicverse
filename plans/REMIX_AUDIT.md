# Аудит: Функция ремикса трека

## Текущая архитектура

```
RemixDialog (UI)
  → useRemixTrack (mutation)
    → studio-operations.service.remixTrack
      → studioApi.invokeSunoRemix
        → supabase.functions.invoke("suno-remix")
          → suno-remix edge function
            → POST /api/v1/generate/upload-cover
              → callback → suno-cover-callback
```

**Ключевое открытие:** "Ремикс" технически = Suno Cover API.
Используется `upload-cover` эндпоинт, а не `remix`.

## Компоненты

| Компонент | LOC | Назначение |
|-----------|-----|------------|
| `RemixDialog.tsx` | 188 | UI диалог: prompt, style, presets, submit |
| `useRemixTrack.ts` | 30 | Мутация (react-query) |
| `studio-operations.service.ts` | 26 | Вызов edge function |
| `suno-remix/index.ts` | 407 | Edge function — cover generation |
| `suno-cover-callback/index.ts` | — | Обработка результата |

## Поток данных

### 1. UI → Edge
```
RemixDialog: {
  audioId: track.suno_id,    // suno_id или UUID
  audioUrl?: string,         // прямая ссылка на аудио
  prompt: string,            // описание желаемого звучания
  style: string,             // "lo-fi, chill..."
  title: string,             // "Track (ремикс)"
  instrumental: boolean,
  model: "V4_5",
  audioWeight: 0.5,          // влияние оригинала
  negativeTags?: string,
  vocalGender?: string,
  styleWeight?: number,
  weirdnessConstraint?: number
}
```

### 2. Edge Function
1. Проверка авторизации
2. Проверка кредитов (10 кредитов)
3. Поиск трека по `audioId` (suno_id → tracks, fallback UUID)
4. Создание нового трека (`generation_mode: "cover"`)
5. Создание `generation_task` (status: "pending")
6. Вызов Suno API `POST /api/v1/generate/upload-cover`:
   ```json
   {
     "uploadUrl": "<original audio URL>",
     "prompt": "...",
     "style": "...",
     "title": "...",
     "model": "V4_5",
     "audioWeight": 0.5,
     "instrumental": false,
     "callBackUrl": "https://.../suno-cover-callback",
     "callBackType": "all"
   }
   ```
7. Создание `task_id` в `generation_tasks`
8. Дедукция кредитов (`deduct_credits` RPC)

### 3. Callback
`suno-cover-callback` получает результат от Suno:
- `audio_url` → обновляет трек (status: "completed")
- `taskId` → обновляет task (status: "completed")

## Найденные проблемы

### P0 — Критический баг: списание кредитов
В `suno-remix/index.ts`:
```
// строка ~200: deduct_credits RPC
// строка ~380: INSERT INTO credit_transactions (ручной)
```
**Двойное списание.** `deduct_credits` уже записывает в `credit_transactions`.

**Фикс:** Удалить ручной INSERT.

### P1 — Структурные проблемы
1. **Нет таймаута на URL check** — есть, но 30s. ОК.
2. **Нет обработки ошибок Suno callback** — если Suno не ответил, трек навсегда "pending".
3. **Нет UI уведомления** после завершения ремикса — результат не показывается пользователю.
4. **Прессеты стилей** — только в `RemixDialog`, нет в generate form.

### P2 — UX
1. **Нет прогресса** — пользователь не знает, сколько ждать (30-90s).
2. **Нет fallback** если `suno_id` отсутствует (использует UUID, но старые треки могут не найтись).
3. **audioWeight** всегда 0.5 — нет UI для регулировки влияния оригинала.

## План фикса
1. Убрать двойное списание кредитов
2. Добавить таймаут-лог для зависших pending треков
3. Добавить toast при завершении ремикса (через NotificationOrchestrator)
4. Прогресс-бар в RemixDialog (через useStemRealtime или polling)
