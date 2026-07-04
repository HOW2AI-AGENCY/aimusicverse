# Sprint 052: Suno Mashup + Persona + File Upload Proxy (Q3 2026)

**Дата плана:** 2026-07-04
**Длительность:** ~10 дней (2 фазы по 5 дней)
**Зависимость:** Sprint 051 (Test Debt + God Files) завершён или в фазе C (тесты для новых edge уже написаны)
**Цель:** Полная интеграция трёх категорий Suno API (Mashup, Persona, File Upload) — дифференциатор продукта + устранение дублирования загрузок в `suno-upload-cover` / `suno-upload-extend`.

---

## Контекст

Аудит Suno API vs реализация (см. раздел 3 в `docs/SUNO_API.md` → будет дополнен в этом спринте) показал 7 категорий gap:

| #   | Категория                    | Path Suno API                                                    | Edge в коде                                     | UI              | Приоритет     |
| --- | ---------------------------- | ---------------------------------------------------------------- | ----------------------------------------------- | --------------- | ------------- |
| 1   | **Mashup**                   | `/api/v1/generate/mashup`                                        | ❌ нет                                          | ❌ нет          | 🟢 Sprint 052 |
| 2   | **Persona**                  | `/api/v1/generate/persona`                                       | ❌ нет                                          | ❌ нет          | 🟢 Sprint 052 |
| 3   | **File Upload Proxy**        | `/api/v1/files/*`                                                | ❌ нет (только локальный upload)                | ❌ нет          | 🟢 Sprint 052 |
| 4   | Sounds (loop/tempo/key)      | `/api/v1/sound/generate`                                         | ❌ нет (есть `generate-sfx` через Replicate)    | ❌ нет          | 🟡 Sprint 053 |
| 5   | MIDI direct                  | `/api/v1/generate/midi`                                          | ❌ нет (есть `transcribe-midi` через Replicate) | ❌ нет          | 🟡 Sprint 053 |
| 6   | Boost Style                  | `/api/v1/generate/boost-style`                                   | ✅ `suno-boost-style`                           | ❌ не подключён | 🟡 Sprint 053 |
| 7   | Details endpoints (per-task) | `/api/v1/{music,cover,video,wav,midi,lyrics,separation}/details` | ⚠️ частично (`get`, `record-info`)              | ❌ нет          | 🟠 Sprint 054 |

**Sprint 052 закрывает #1, #2, #3** — самые высокоценные с точки зрения дифференциации и снижения дублирования кода в существующих upload-edge.

**Состояние входа:**

- 282 unit-теста (Sprint 051 завершён → ожидается ~450)
- 0 файлов >1000 LOC (после Sprint 051)
- Edge functions `suno-upload-extend`, `suno-upload-cover` уже принимают локальный base64 (паттерн для File Upload Proxy)
- `suno-music-callback` уже умеет обрабатывать mashup как обычный generation (та же сигнатура)
- DB: нужна миграция `track_personas` + `track_versions.persona_id` (FK)
- i18n: строки для EN/RU под `i18n/suno-mashup.json`

**Ожидаемое состояние выхода:**

- ✅ 3 новых edge function (suno-mashup, suno-mashup-callback, suno-persona, suno-persona-callback, suno-file-upload)
- ✅ 2 новых UI hook (useSunoMashup, useSunoPersona) + 1 dialog (MashupDialog)
- ✅ 1 новый Telegram-бот команда `/mashup`
- ✅ DB-миграция: `track_personas`, `track_versions.persona_id`
- ✅ Снижение дублирования: `suno-upload-cover/extend` используют `suno-file-upload` вместо собственного multipart
- ✅ Документация: `docs/SUNO_API.md` обновлён, примеры curl для mashup/persona/upload

---

## Фаза A: Edge functions + DB-миграция (дни 1–5)

| ID     | Задача                                                                                                                                                                                                                                                                                                                                                                                                                                              | Приоритет   | Оценка |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------ |
| 052-A1 | **DB-миграция**: создать таблицу `track_personas` (id, user_id, suno_persona_id, name, description, audio_url, image_url, created_at) + добавить `track_versions.persona_id` (FK nullable) + RLS                                                                                                                                                                                                                                                    | 🔴 Critical | 0.5d   |
| 052-A2 | **`suno-mashup` edge function** (`/api/v1/generate/mashup`): принимает `trackAId + trackBId` (resolve до audio_url из Supabase Storage), `customMode`, `prompt`, `style`, `title`, `model`, опциональные `vocalGender/styleWeight/weirdnessConstraint/audioWeight`; валидация Zod (лимиты 3000/5000 по модели, 200/1000 style, 80/100 title); экономика кредитов (mashup = N × cost of model); callback `suno-music-callback` (signature совпадает) | 🔴 Critical | 1.5d   |
| 052-A3 | **`suno-persona` edge function** (`/api/v1/generate/persona`): принимает `trackId` или `mashupTaskId` (resolve до `audio_url`); вызывает Suno `/api/v1/generate/persona`; callback создаёт запись в `track_personas`                                                                                                                                                                                                                                | 🔴 Critical | 1d     |
| 052-A4 | **`suno-file-upload` edge function** (multi-action: `base64`, `url`): внутренний POST `/api/v1/files/base64` или `/api/v1/files/url`; возвращает `{ file_url, expires_in_days: 3 }` (Suno auto-deletes через 3 дня); лимит размера 50 МБ; cleanup-job через 7 дней (cron `cleanup-orphaned-data`)                                                                                                                                                   | 🔴 Critical | 1d     |
| 052-A5 | **Рефакторинг**: `suno-upload-cover` и `suno-upload-extend` переключаются на `suno-file-upload` (action: `base64`) вместо собственного multipart; unit-тесты для обеих                                                                                                                                                                                                                                                                              | 🟠 High     | 1d     |

### Шаблоны для копирования

- `supabase/functions/suno-upload-extend/index.ts` — паттерн: локальный base64 → upload → callback flow (L186 `base64Data`, L194 fetch upload-extend, L275 requestBody)
- `supabase/functions/suno-add-instrumental/index.ts` — паттерн: callback через `suno-music-callback` (L169 callBackUrl, L211 fetch add-instrumental)
- `supabase/functions/suno-separate-vocals/index.ts` — паттерн: resolve track_id → audio_url → Suno call (L78 callbackUrl, L95 fetch vocal-removal)

### Контракты edge functions

**`suno-mashup`** request:

```json
{
  "trackAId": "uuid",
  "trackBId": "uuid",
  "customMode": true,
  "prompt": "[Verse] ...",
  "style": "Electronic Pop",
  "title": "Fusion Mashup",
  "model": "V5",
  "vocalGender": "f",
  "styleWeight": 0.7,
  "instrumental": false
}
```

**`suno-persona`** request:

```json
{
  "trackId": "uuid",
  "name": "My Voice",
  "description": "Warm alto"
}
```

**`suno-file-upload`** request:

```json
{ "action": "base64", "fileBase64": "...", "filename": "vocal.mp3" }
{ "action": "url", "fileUrl": "https://..." }
```

---

## Фаза B: UI + Telegram + Docs (дни 6–10)

| ID      | Задача                                                                                                                                                                                                                                                                                                                               | Приоритет   | Оценка |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ------ |
| 052-B1  | **Hook `useSunoMashup`** в `src/hooks/generation/useSunoMashup.ts`: TanStack Query mutation `invoke('suno-mashup', body)` → optimistic task в `generationStore` → polling через `suno-check-status` (стандартный паттерн, без выделенного callback на UI-стороне)                                                                    | 🔴 Critical | 0.5d   |
| 052-B2  | **Hook `useSunoPersona`** в `src/hooks/generation/useSunoPersona.ts`: мутация + `useQuery(['personas', userId])` для списка персон пользователя                                                                                                                                                                                      | 🔴 Critical | 0.5d   |
| 052-B3  | **Hook `useSunoFileUpload`** в `src/hooks/generation/useSunoFileUpload.ts`: утилита для всех upload-flow (cover, extend, mashup); заменяет `multipart`-логику в 4 компонентах                                                                                                                                                        | 🟠 High     | 0.5d   |
| 052-B4  | **`MashupDialog`** в `src/components/track-actions/MashupDialog.tsx`: MobileBottomSheet (Pitfall #11); два audio-пикера (выбор двух треков из библиотеки), форма Custom/Non-custom mode, превью сгенерированного prompt; встраивается в `track-actions/MashupMenuItem` в `AudioActionDialog` (Pitfall #15: единый селектор действий) | 🔴 Critical | 1.5d   |
| 052-B5  | **Кнопка «Create Persona»** на `GenerationResultSheet`: после успешной генерации/машапа → вызов `useSunoPersona` → toast `Persona created, used automatically for next generations`                                                                                                                                                  | 🟠 High     | 0.5d   |
| 052-B6  | **Telegram bot команда `/mashup`**: зеркалит UI flow (выбор 2 треков → mashup); callback через `telegram-bot/handlers/mashup.ts`                                                                                                                                                                                                     | 🟡 Medium   | 0.5d   |
| 052-B7  | **Документация**: `docs/SUNO_API.md` — раздел 4 «Mashup & Persona»; `docs/INTEGRATION_API.md` — обновить список эндпоинтов; `CHANGELOG.md` — запись о новых edge                                                                                                                                                                     | 🟠 High     | 0.5d   |
| 052-B8  | **E2E тесты**: `tests/e2e/mashup-flow.spec.ts` (desktop + mobile) — выбор 2 треков → mashup → polling → результат в Sheet                                                                                                                                                                                                            | 🟠 High     | 0.5d   |
| 052-B9  | **Storybook stories**: `MashupDialog.stories.tsx` (states: empty, loading, error, success)                                                                                                                                                                                                                                           | 🟡 Medium   | 0.25d  |
| 052-B10 | **i18n**: `src/i18n/en/suno-mashup.json` + `ru/suno-mashup.json` (10 строк × 2 языка)                                                                                                                                                                                                                                                | 🟡 Medium   | 0.25d  |

---

## Definition of Done

- [ ] 5 новых edge function задеплоены и принимают трафик (smoke-curl в `docs/SUNO_API.md`)
- [ ] 3 хука (useSunoMashup, useSunoPersona, useSunoFileUpload) — каждый с unit-тестом и Storybook story
- [ ] MashupDialog встроен в `AudioActionDialog` (Pitfall #15), MobileBottomSheet (Pitfall #11), touch-target ≥44px (Pitfall #10)
- [ ] DB-миграция применена на dev + prod; `track_personas` имеет RLS-политики
- [ ] `suno-upload-cover` и `suno-upload-extend` используют `suno-file-upload` (рефакторинг завершён)
- [ ] `/mashup` Telegram-команда работает end-to-end
- [ ] `npm run size` — total bundle < 2.13 МБ (delta ≤ +30 КБ gzip)
- [ ] `npm test` — все новые тесты зелёные (≥ 35 unit + 2 e2e)
- [ ] `docs/SUNO_API.md` обновлён (Maintenance checklist MAINT-04)
- [ ] CHANGELOG.md / PROJECT_STATUS.md / ROADMAP.md синхронизированы

## Следующие спринты

- **Sprint 053 — Suno Sounds + MIDI + Boost**: закрывает gap #4, #5, #6; общий объём ~8d
- **Sprint 054 — Suno Details Suite**: закрывает gap #7 (6 details-эндпоинтов); общий объём ~6d
- **Sprint 055 — Cost Optimization + Observability**: retry-policy, кредит-дашборд, webhook-secret rotation; ~5d
