# Аудит пайплайна генерации и версионирования MusicVerse

Дата: 2026-07-26
Область: генерация треков (Suno), версионирование (track_versions), replace_section handler.

## Сводка по критичности

| Уровень   | Кол-во |
| --------- | ------ |
| Critical  | 3      |
| High      | 6      |
| Medium    | 7      |
| Low       | 5      |
| **Итого** | **21** |

---

## CRITICAL

### C1. Replace-section handler не обновляет `suno_task_id` на tracks при применении версии

**Файл:** `supabase/functions/suno-music-callback/handlers/replace.ts:225-236`
**Симптом:** После replace_section `tracks.suno_task_id` остаётся от ОРИГИНАЛЬНОЙ генерации, хотя `tracks.suno_id` обновляется на новый clip id.
**Почему критично:** Timestamped lyrics, stems separation, video generation и `replace_section` (повторный) все читают `track.suno_task_id` для привязки к Suno. После первой замены секции они продолжают работать со СТАРЫМ task → некорректные данные или тихий отказ. Особенно `useTrackActions.handleSeparateVocals` (строки 81-84) требует `track.suno_task_id` + `suno_id` одной генерации, а после replace они рассинхронизированы.
**Фикс:**

```ts
// replace.ts строка 225, добавить suno_task_id в update
const { error: trackUpdateError } = await supabase
  .from("tracks")
  .update({
    active_version_id: primaryCreated.id,
    audio_url: primaryCreated.audioUrl,
    streaming_url: getStreamUrl(primaryCreated.clip) || primaryCreated.audioUrl,
    cover_url: getImageUrl(primaryCreated.clip) || null,
    duration_seconds: Math.round(primaryCreated.clip.duration) || null,
    suno_id: primaryCreated.clip.id,
    suno_task_id: task.suno_task_id, // ← ДОБАВИТЬ
    has_stems: false,
  })
  .eq("id", trackId);
```

Аналогично в `complete.ts:198-216` уже есть `suno_task_id: sunoTaskId` — там всё ок. Replace handler — единственное место пропуска.

---

### C2. Несоответствие имени колонки telegram: `telegram_id` vs `telegram_chat_id`

**Файл:** `supabase/functions/suno-replace-section/index.ts:175, 282`
**Симптом:** Строка 175 выбирает `telegram_id`, строка 282 читает `profile?.telegram_chat_id` → всегда `undefined`. В результате `generation_tasks.telegram_chat_id` всегда NULL для replace_section задач, и ВСЕ telegram-уведомления о завершении замены секции тихо не отправляются (handler `replace.ts:272` проверяет `task.telegram_chat_id`).
**Почему критично:** Пользователь никогда не получает уведомление в Telegram о готовности замены секции, хотя платит кредиты. `first.ts`/`complete.ts` работают корректно (попадают через другой путь). В `suno-music-extend/index.ts:183-190` видно правильный паттерн: `select("telegram_id")` → `profile?.telegram_id`.
**Фикс:**

```ts
// строка 282
telegram_chat_id: profile?.telegram_id, // не telegram_chat_id
```

---

### C3. Race condition: replace_section callback авто-назначает primary БЕЗ учёта существующих версий пользователя

**Файл:** `supabase/functions/suno-music-callback/handlers/replace.ts:200-216`
**Симптом:** При завершении replace_section handler СРАЗУ делает первую новую версию primary (`is_primary: true`) и обновляет `tracks.audio_url`/`active_version_id`. Это противоречит UX-контракту из контекста: «yields selectable A/B versions; applying syncs is_primary». Пользователь теряет возможность ВЫБРАТЬ между оригиналом и заменой — его текущая primary-версия молча перезаписывается.
**Сценарий:** Пользователь слушает версию A (primary), запускает replace_section, получает версии C/D. Handler немедленно делает C primary и переключает audio_url. Если пользователь закрыл приложение, он обнаружит «испорченный» трек.
**Фикс:** Не делать авто-primary. Создавать версии с `is_primary: false` и не трогать `tracks.audio_url`/`active_version_id`. Уведомление должно вести в студию для выбора. Если нужно сохранить авто-применение для non-interactive flow (Telegram), добавить флаг в task metadata (`auto_apply: boolean`).

```ts
// Удалить строки 200-243 (auto-primary + track update) или вынести в отдельный шаг,
// выполняемый только когда versions.length === 1 ИЛИ есть явный auto_apply флаг.
```

---

## HIGH

### H1. Double credit deduction: RPC `deduct_credits` + ручной insert в `credit_transactions`

**Файл:** `supabase/functions/suno-replace-section/index.ts:312-333`
**Симптом:** После успешного создания задачи вызывается `supabase.rpc("deduct_credits", ...)` (строка 313), а затем НЕЗАВИСИМО делается `supabase.from("credit_transactions").insert(...)` (строка 326). Если RPC `deduct_credits` уже списывает баланс И пишет транзакцию (стандартный паттерн для таких RPC), происходит двойное списание: баланс уменьшается дважды, в журнале две записи.
**Почему не Critical:** Тот же паттерн повторяется в `suno-extend-audio`, `suno-midi`, `suno-music-extend`, `suno-remix` — если это баг, он системный. Нужно проверить реализацию `deduct_credits` RPC в БД. Если RPC только обновляет `user_credits.balance` без вставки в `credit_transactions`, то текущий код корректен.
**Фикс:** Проверить тело `deduct_credits` RPC. Если он пишет транзакцию — удалить ручной insert (строки 326-333) во ВСЕХ edge-функциях. Если нет — оставить, но документировать. Сейчас в репозитории миграций RPC не найден (вероятно создан вручную).

---

### H2. Replace-section handler игнорирует обновление `tags`/`lyrics`/`title` на tracks

**Файл:** `supabase/functions/suno-music-callback/handlers/replace.ts:225-236`
**Симптом:** В отличие от `useVersionSwitcher` (frontend, строки 96-104), который при переключении версии копирует `tags`/`title`/`lyrics` из metadata версии на tracks, backend replace handler НЕ обновляет эти поля. Cards/detail views читают title/tags/lyrics с `tracks`, а не с `track_versions` → после replace_section отображаются устаревшие метаданные.
**Фикс:** Добавить в metadata новой версии поля tags/title/lyrics из clip, и обновить tracks при авто-применении:

```ts
metadata: { ..., tags: clip.tags, title: clip.title, lyrics: clip.prompt },
// и в track update:
tags: clip.tags, title: clip.title, lyrics: clip.prompt,
```

---

### H3. Callback `index.ts` пропускает idempotency check для replace_section и first callbacks

**Файл:** `supabase/functions/suno-music-callback/index.ts:78-82`
**Симптом:** Строка 78 проверяет `task.status === "completed" && callbackType === "complete"` → возвращает `already_processed`. Но для `replace_section` (который роутится по `generation_mode`, строка 94, ДО этой проверки — нет, проверка на строке 78 идёт раньше) и `first` callback НЕТ проверки на повторную обработку. Suno может присылать дубликаты колбэков (retry). Для `first` это создаст дубль Version A (есть частичная защита в `first.ts:67-77` через lookup по label "A"), но для `replace_section` дубль колбэка создаст ДУБЛИКАТЫ версий C/D/E.
**Контр-аргумент:** Replace handler смотрит `latestVersion` для расчёта baseLabelCode (строка 52), поэтому второй колбэк создаст E/F вместо дубля C/D — но это всё равно мусорные версии.
**Фикс:** Добавить проверку статуса task в начале `handleReplaceSection`:

```ts
if (task.status === "completed") {
  return { success: true, status: "already_processed" };
}
```

---

### H4. `version_label` генерация в replace.ts переполняется после Z (код 90)

**Файл:** `supabase/functions/suno-music-callback/handlers/replace.ts:52, 71`
**Симптом:** `baseLabelCode = latestVersion.version_label.charCodeAt(0) + 1`. Если последняя версия имеет label `"Z"` (charCode 90), следующая будет `[` (91) — невалидный label. При нескольких replace_section итерациях label быстро уходит за пределы A-Z.
**Дополнительно:** Если `version_label.length !== 1` (например, `"V5"`), fallback = 65 = `"A"` → КОЛЛИЗИЯ с существующей версией A.
**Фикс:** Использовать схему типа `R1`, `R2`, ... для replace-версий или зациклить алфавит с префиксом:

```ts
function nextReplaceLabel(existingCount: number): string {
  return `R${existingCount + 1}`; // однозначно, без коллизий с A/B/C
}
```

---

### H5. Отсутствует транзакционность: partial-failure оставляет inconsistent state

**Файл:** `supabase/functions/suno-music-callback/handlers/replace.ts` (весь), `complete.ts` (весь)
**Симптом:** Несколько UPDATE в sequence без транзакции. Если `unsetPrimaryError` (строка 206) или `setPrimaryError` (строка 217) падает, но `trackUpdateError` (строка 225) succeeds → track указывает на версию через `active_version_id`, но `is_primary` флаг на версиях некорректен. Это ломает `fetchPrimaryVersion` (ищет по `is_primary=true`) и UnifiedVersionSelector.
**Фикс:** Использовать RPC с серверной логикой для атомарного применения версии, либо хотя бы Postgres function:

```sql
CREATE FUNCTION apply_track_version(p_track_id uuid, p_version_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE track_versions SET is_primary = false WHERE track_id = p_track_id;
  UPDATE track_versions SET is_primary = true WHERE id = p_version_id;
  UPDATE tracks SET active_version_id = p_version_id, ... WHERE id = p_track_id;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### H6. `useVersionSwitcher` не инвалидирует `queryKeys.tracks.versions` (structured key)

**Файл:** `src/hooks/useVersionSwitcher.ts:165-182`
**Симптом:** `onSettled` инвалидирует набор строковых ключей (`["track-versions", trackId]`, `["track-versions-unified", trackId]`, ...), но `useTrackVersionsList` использует `queryKeys.tracks.versions(trackId)` (структурированный ключ из `src/lib/queryKeys`). Если этот key не совпадает с `["track-versions", trackId]`, кэш `GenerationResultSheet` не обновится после switch.
**Фикс:** Проверить `queryKeys.tracks.versions` и добавить его в список инвалидируемых ключей, либо использовать prefix-инвалидацию:

```ts
queryClient.invalidateQueries({ queryKey: queryKeys.tracks.all });
```

---

## MEDIUM

### M1. `cancelGenerationTask` не предотвращает callback-обработку

**Файл:** `src/api/generation.api.ts:267-292`, `supabase/functions/suno-music-callback/index.ts`
**Симптом:** Soft-cancel ставит `status = "cancelled"`, но callback handler НЕ проверяет это состояние. Если Suno присылает success callback для отменённой задачи, `handleCompleteCallback` создаст versions, обновит track, спишет credits — хотя пользователь отменил. `index.ts:78` проверяет только `status === "completed"`, не `cancelled`.
**Фикс:** В `index.ts` после валидации task (строка 65-76) добавить:

```ts
if (task.status === "cancelled") {
  return new Response(JSON.stringify({ success: true, status: "ignored_cancelled" }), { ... });
}
```

---

### M2. Replace-section: `sectionStart`/`sectionEnd` = 0 при ошибке чтения log

**Файл:** `supabase/functions/suno-music-callback/handlers/replace.ts:162-181`
**Симптом:** Если `replace_section_started` log не найден (`.single()` возвращает ошибку → catch), `sectionStart=0, sectionEnd=0`. Эти значения пишутся в metadata completed log и audit log → некорректная аналитика.
**Фикс:** Использовать `maybeSingle()` вместо `single()` и логировать warn с реальным trackId/taskId (сейчас warn без контекста).

---

### M3. `fetchTrackVersions` (versioning.ts) дедуплицирует по label, теряя replace_section версии

**Файл:** `src/integrations/supabase/queries/versioning.ts:22-38`
**Симптом:** Функция делает reduce по `version_label`, оставляя первую с уникальным label. Но replace_section handler (C3 fix aside) создаёт версии с label C/D/E... Если когда-либо появится коллизия label (H4), эта дедупликация ТИХО удалит версию из списка. Для `useTrackVersions` hook → UI не покажет все версии.
**Фикс:** Убрать дедупликацию (она маскирует баги в backend) или дедуплицировать по `id`/`suno_id`, а не по label.

---

### M4. `useTrackVersionsList` использует другой queryKey, чем `useTrackVersions`

**Файл:** `src/hooks/generation/useTrackVersionsList.ts:19` vs `src/hooks/useTrackVersions.ts:19`
**Симптом:** `useTrackVersionsList` → `queryKeys.tracks.versions(trackId)`. `useTrackVersions` → `["track-versions", trackId]`. Это два РАЗНЫХ кэша для одних и тех же данных → двойной fetch, рассинхронизация при switch.
**Фикс:** Унифицировать queryKey через `queryKeys.tracks.versions(trackId)` везде.

---

### M5. Replace-section validation: `maxAllowed` fallback = 60 при `trackDuration=0`

**Файл:** `supabase/functions/suno-replace-section/index.ts:160`
**Симптом:** Если `track.duration_seconds` = 0/null (например, track ещё streaming_ready но не completed), `maxAllowed = min(60, 0 > 0 ? ... : 60) = 60`. Проверка `sectionDuration > maxAllowed` пропускает секции до 60с. По контракту лимит — ≤50% длительности трека. Для трека без известной длительности это позволяет заменить секцию длиннее самого трека.
**Фикс:** Требовать `trackDuration > 0` для replace_section; если 0 — возвращать ошибку «дождитесь завершения генерации».

---

### M6. `complete.ts` cover generation: задержка `setTimeout(6000)` блокирует response

**Файл:** `supabase/functions/suno-music-callback/handlers/complete.ts:717`
**Симптом:** В `sendTelegramResults` есть `await new Promise(r => setTimeout(r, 6000))` — 6 секунд блокировки внутри callback handler. Увеличивает время ответа Suno callback, риск timeout/retry.
**Фикс:** Вынести telegram-уведомление в fire-and-forget (не await) или в отдельный background function.

---

### M7. `complete.ts`: cover generation и MIDI выполняются синхронно в callback

**Файл:** `supabase/functions/suno-music-callback/handlers/complete.ts:272-287, 442-464`
**Симптом:** Cover gen (fetch) и auto-MIDI (`supabase.functions.invoke`) выполняются последовательно с `await`, удлиняя callback. Хотя они best-effort (try/catch), они добавляют латентность.
**Фикс:** Запускать через `EdgeRuntime.waitUntil(...)` или без await после основных обновлений.

---

## LOW

### L1. `replace.ts:44-50` использует `.single()` вместо `.maybeSingle()`

**Файл:** `supabase/functions/suno-music-callback/handlers/replace.ts:49`
Если у трека ещё нет версий (edge case), `.single()` вернёт ошибку → `latestVersion` = null → baseLabelCode = 65. Работает, но логирует noise. Использовать `.maybeSingle()`.

---

### L2. `replace.ts:138` хранит clips как `JSON.stringify(clips)` в `audio_clips`

**Файл:** `supabase/functions/suno-music-callback/handlers/replace.ts:138, 152`
В то же время `complete.ts:341` тоже stringify. Но `sync-stale-tasks` (строка 162-165) парсит обратно. Согласованно, но хрупко — лучше хранить как JSONB напрямую.

---

### L3. `UnifiedVersionSelector.tsx:99` fallback label может конфликтовать

**Файл:** `src/components/shared/UnifiedVersionSelector.tsx:97-99`
`label: v.version_label || String.fromCharCode(65 + index)` — если backend label = null, генерируется A/B/C по индексу. Но если часть версий имеет label, а часть нет — индексы смещаются. Низкая вероятность, но стоит нормализовать на backend.

---

### L4. `useTrackActions.tsx:11` — глобальный mutable callback

**Файл:** `src/hooks/useTrackActions.tsx:11-15`
`subscriptionDialogCallback` — module-level mutable variable. Работает, но антипаттерн: несколько инициализаций перезапишут. Минимальный риск, но стоит вынести в context/store.

---

### L5. `GenerationResultSheet.tsx:87` — `selectedVersion` в deps effect

**Файл:** `src/components/generate-form/GenerationResultSheet.tsx:76-87`
Effect зависит от `selectedVersion`, что может вызвать loop: effect устанавливает `selectedVersion` → effect перезапускается. Защита `!selectedVersion` (строка 84) предотвращает, но хрупко. Убрать `selectedVersion` из deps или использовать ref.

---

## Архитектурные рекомендации

1. **Единый RPC для применения версии** (H5): `apply_track_version(track_id, version_id)` — атомарно обновляет is_primary, active_version_id, audio_url, метаданные. Использовать и в frontend `useVersionSwitcher`, и в backend handlers.

2. **Единый queryKey namespace** (H6, M4): все запросы версий должны идти через `queryKeys.tracks.versions(trackId)`. Унифицировать `useTrackVersions`, `useTrackVersionsList`, `useTrackActionsState`, `UnifiedVersionSelector`.

3. **Idempotency guard в callback router** (H3, M1): единая проверка `task.status in (completed, cancelled, failed)` перед роутингом.

4. **Replace-section как «предложение», а не «применение»** (C3): разделить создание версий и их применение. Создание → уведомление → пользователь выбирает в UI → RPC применяет.

5. **Логирование telegram_chat_id** (C2): добавить integration-тест, проверяющий что notification доходит до Telegram для replace_section flow.
