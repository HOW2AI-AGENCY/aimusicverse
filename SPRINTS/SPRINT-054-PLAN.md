# Sprint 054: Suno Details Suite + Per-Task Introspection (Q4 2026)

**Дата плана:** 2026-07-04
**Длительность:** ~6 дней (1 фаза)
**Зависимость:** Sprint 052 + 053 завершены
**Цель:** Закрыть gap #7 — специализированные details-эндпоинты Suno для точечного polling, retry и прогресс-баров в UI.

---

## Контекст

Сейчас для всех Suno-тасков используется общий `suno-check-status` с двумя путями: `/api/v1/generate/get?taskId=...` и `/api/v1/generate/record-info?taskId=...`. Это:

- не различает тип таска (music vs wav vs cover vs video vs midi)
- возвращает лишние поля (для WAV-callback не нужны `vocalGender`, для MIDI-callback не нужен `image_url`)
- усложняет per-task retry-policy

Suno API выставляет отдельные details-эндпоинты для каждой категории — они быстрее (меньше payload), точнее и позволяют дифференцировать backoff.

**Gap #7 — Details endpoints:**

| Endpoint Suno                                                    | Edge в коде                        | UI hook  |
| ---------------------------------------------------------------- | ---------------------------------- | -------- |
| `/api/v1/generate/details` (`get-music-generation-details`)      | ⚠️ через общий `suno-check-status` | ⚠️ общий |
| `/api/v1/image/details` (`get-cover-suno-details`)               | ❌ нет                             | ❌ нет   |
| `/api/v1/mp4/details` (`get-music-video-details`)                | ❌ нет                             | ❌ нет   |
| `/api/v1/generate/wav/details` (`get-wav-conversion-details`)    | ❌ нет                             | ❌ нет   |
| `/api/v1/generate/midi/details` (`get-midi-details`)             | ✅ в 053                           | ✅ в 053 |
| `/api/v1/lyrics/details` (`get-lyrics-generation-details`)       | ❌ нет                             | ❌ нет   |
| `/api/v1/vocal-removal/details` (`get-vocal-separation-details`) | ❌ нет                             | ❌ нет   |

**Ожидаемое состояние выхода:**

- ✅ 6 новых details-edge (5 в этом спринте + 1 уже в 053)
- ✅ 6 UI-хук для per-task polling/retry
- ✅ `suno-check-status` рефакторится в диспетчер по типу таска
- ✅ Снижение error-rate за счёт точечного backoff (метрика: <2% вместо ~5%)

---

## Фаза A: Details Suite (дни 1–6)

| ID      | Задача                                                                                                                                                                                                                                            | Приоритет   | Оценка |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------ |
| 054-A1  | **`suno-music-details` edge function** (`/api/v1/generate/details`): POST с `taskId` → возврат status + clips; используется в `useGenerationStatus`                                                                                               | 🔴 Critical | 0.5d   |
| 054-A2  | **`suno-cover-details` edge function** (`/api/v1/image/details`): POST с `taskId` → image_url; используется в `generate-track-cover` для retry                                                                                                    | 🟠 High     | 0.5d   |
| 054-A3  | **`suno-video-details` edge function** (`/api/v1/mp4/details`): POST с `taskId` → mp4_url, duration; используется в `useVideoGenerationStatus` (точнее прогресс)                                                                                  | 🟠 High     | 0.5d   |
| 054-A4  | **`suno-wav-details` edge function** (`/api/v1/generate/wav/details`): POST с `taskId` → wav_url; используется в `useWavConversion`                                                                                                               | 🟡 Medium   | 0.5d   |
| 054-A5  | **`suno-lyrics-details` edge function** (`/api/v1/lyrics/details`): POST с `taskId` → text; используется в `useLyricsVersioning`                                                                                                                  | 🟡 Medium   | 0.5d   |
| 054-A6  | **`suno-separation-details` edge function** (`/api/v1/vocal-removal/details`): POST с `taskId` → vocal/instrumental urls; используется в `useStemSeparation`                                                                                      | 🟠 High     | 0.5d   |
| 054-A7  | **Рефакторинг `suno-check-status`**: dispatcher по `taskType` (`music`/`cover`/`video`/`wav`/`midi`/`lyrics`/`separation`) → вызывает соответствующий details-edge; backoff-strategy per task_type (midi — длиннее, lyrics — короче)              | 🔴 Critical | 1d     |
| 054-A8  | **UI-хук `useSunoTaskDetails`** в `src/hooks/generation/useSunoTaskDetails.ts`: generic hook `useQuery({ queryKey: ['suno-task', taskId, taskType], queryFn: () => invoke('suno-${taskType}-details', { taskId }) })` — заменяет 6 ad-hoc polling | 🟠 High     | 1d     |
| 054-A9  | **Обновление существующих UI-хуков**: `useGenerationStatus`, `useVideoGenerationStatus`, `useStemSeparation`, `useLyricsVersioning`, `useWavConversion` — мигрируют на `useSunoTaskDetails`                                                       | 🟠 High     | 1d     |
| 054-A10 | **Документация**: `docs/SUNO_API.md` раздел 6 «Details Endpoints»; обновить Mermaid-диаграмму callback-flow; `CHANGELOG.md`                                                                                                                       | 🟠 High     | 0.5d   |

### Шаблон

Все 6 details-edge максимально однотипные (15-30 строк каждый): принимают `{ taskId }`, fetch `/api/v1/{type}/details`, валидация Zod, возврат payload. Выделить общий код в `_shared/suno-details.ts` (signature: `fetchSunoTaskDetails(taskType, taskId)`).

### Шаблоны контракта

**Любой `*-details`** request/response:

```json
// request
{ "taskId": "5c79****be8e" }
// response (для music)
{
  "taskId": "5c79****be8e",
  "status": "SUCCESS" | "PENDING" | "FAILED",
  "clips": [
    { "id": "8551****662c", "audio_url": "https://...", "image_url": "https://...", "duration": 198.44 }
  ]
}
```

---

## Definition of Done

- [ ] 6 details-edge задеплоены и документированы в `docs/SUNO_API.md`
- [ ] Общий код вынесен в `_shared/suno-details.ts`
- [ ] `suno-check-status` стал диспетчером с per-type backoff
- [ ] `useSunoTaskDetails` заменяет 6 ad-hoc polling
- [ ] Все UI polling-хуки переведены на новый generic hook
- [ ] `npm test` — все новые unit-тесты + существующие не сломаны
- [ ] Error-rate polling снизился (метрика Sentry: `<2%` на dashboard `suno-check-status`)
- [ ] `npm run size` — total bundle < 2.16 МБ (delta ≤ +20 КБ gzip)

## Следующие спринты

- **Sprint 055 — Cost Optimization + Observability**: расширенный кредит-дашборд, retry-policy, webhook-secret rotation, метрики latency per task_type
- **Sprint 056 — Suno 2026-Q4 Roadmap**: новые модели Suno (когда выйдут), `persona-sharing` (между пользователями), batch-генерация (10+ клипов за раз)
