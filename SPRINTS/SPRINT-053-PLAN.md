# Sprint 053: Suno Sounds + MIDI Direct + Boost Style (Q3-Q4 2026)

**Дата плана:** 2026-07-04
**Длительность:** ~8 дней (2 фазы по 4 дня)
**Зависимость:** Sprint 052 (Mashup/Persona) завершён
**Цель:** Закрыть gap #4, #5, #6 — нативная SFX-генерация Suno, MIDI direct (без Replicate), подключить существующий `suno-boost-style` к UI.

---

## Контекст

**Gap #4 — Sounds (loop/tempo/key):** текущая `generate-sfx` использует **Replicate/fal.ai**, а не Suno. Это лишний вендор, отдельный pricing и нет loop/tempo/key контроля из коробки. Новый `suno-sounds` закроет это.

**Gap #5 — MIDI direct:** `transcribe-midi` использует Replicate. Suno MIDI даёт лучшую сегментацию (по 8-ми нотам) и нативную интеграцию с уже используемым `suno-separate-vocals` flow. Подходит для Piano/Vocal отдельно (use case: «разделить вокал → MIDI ноты вокала»).

**Gap #6 — Boost Style:** edge `suno-boost-style` существует с Sprint 045, но **не подключён ни к одному UI компоненту**. Это мёртвый код — либо подключить, либо удалить.

**Состояние входа:**

- `suno-boost-style` существует, но никем не вызывается (проверить grep)
- `transcribe-midi` + Replicate уже работают в Studio
- `generate-sfx` интегрирован в Library (через Replicate)

**Ожидаемое состояние выхода:**

- ✅ 5 новых edge functions (suno-sounds + callback, suno-midi + callback, suno-midi-details)
- ✅ 1 edge удалён или переподключён (suno-boost-style)
- ✅ 3 UI hook + 1 компонент SfxGeneratorSheet
- ✅ 1 Telegram-команда `/sfx`

---

## Фаза A: Edge functions (дни 1–4)

| ID     | Задача                                                                                                                                                                                                                                                                                          | Приоритет    | Оценка      |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------- |
| 053-A1 | **`suno-sounds` edge function** (`/api/v1/sound/generate`): параметры `prompt` (описание звука), `make_instrumental: true` (Suno SFX всегда инструментал), `model: V4_5ALL/V5`, опциональные `tempo` (BPM 60-200), `key` (C/C#/D/.../B), `duration` (макс 60с); callback `suno-sounds-callback` | 🔴 Critical  | 1d          | ✅ Done  |
| 053-A2 | **`suno-sounds-callback` edge function**: создаёт запись `track_versions` (с флагом `is_sound_effect=true`), сохраняет в отдельную категорию в Library                                                                                                                                          | 🔴 Critical  | 0.5d        | ✅ Done  |
| 053-A3 | **`suno-midi` edge function** (`/api/v1/generate/midi`): принимает `trackVersionId`, resolve до `audio_url`; POST `/api/v1/generate/midi` с `audioUrl`; callback `suno-midi-callback`                                                                                                           | 🔴 Critical  | 1d          | ✅ Done  |
| 053-A4 | **`suno-midi-callback` edge function**: сохраняет MIDI в Storage (`.mid` файл), обновляет `track_versions.midi_url`; новая колонка `midi_generation_source: 'suno'                                                                                                                              | 'replicate'` | 🔴 Critical | 0.5d | ✅ Done  |
| 053-A5 | **`suno-midi-details` edge function** (`/api/v1/generate/midi/details`): polling-помощник для UI (status, notes_count, duration)                                                                                                                                                                | 🟠 High      | 0.5d        | ✅ Done  |
| 053-A6 | **Подключить `suno-boost-style`**: найти callers (grep); добавить menu item «Boost Style» в `AudioActionDialog`; unit-тесты; **если не подключается — удалить edge и пометить «deprecated»**                                                                                                    | 🟠 High      | 0.5d        | ✅ Done  |

### Шаблон

- `suno-separate-vocals/index.ts` — паттерн: single audio_url → generation → callback
- `suno-convert-wav/index.ts` — паттерн: file-passthrough

### Шаблоны контрактов

**`suno-sounds`** request:

```json
{
  "prompt": "Cinematic riser with reverb tail",
  "model": "V5",
  "tempo": 128,
  "key": "C",
  "duration": 30
}
```

**`suno-midi`** request:

```json
{ "trackVersionId": "uuid" }
```

---

## Фаза B: UI + Telegram + Docs (дни 5–8)

| ID      | Задача                                                                                                                                                                                               | Приоритет   | Оценка |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------ |
| 053-B1  | **Hook `useSunoSounds`** в `src/hooks/generation/useSunoSounds.ts`: мутация + polling через `suno-check-status` (стандартный); результат добавляется в Library с badge «SFX»                         | 🔴 Critical | 0.5d   | ✅ Done  |
| 053-B2  | **Hook `useSunoMidi`** в `src/hooks/studio/useSunoMidi.ts`: мутация + query для статуса; если `suno-midi` вернул ошибку/timeout — fallback на `useReplicateMidiTranscription` (graceful degradation) | 🟠 High     | 0.5d   | ✅ Done  |
| 053-B3  | **`SfxGeneratorSheet`** в `src/components/library/SfxGeneratorSheet.tsx`: MobileBottomSheet; поля prompt + tempo slider + key picker + duration slider; превью аудио после генерации                 | 🔴 Critical | 1d     | ✅ Done  |
| 053-B4  | **MIDI fallback в Studio**: добавить Suno как primary в `useMidiTranscription`; сохранять `midi_generation_source` в `track_versions`                                                                | 🟠 High     | 0.5d   | ✅ Done  |
| 053-B5  | **Boost Style menu item** в `AudioActionDialog`: `track-actions/BoostStyleMenuItem.tsx`; локализация; haptic feedback при успехе                                                                     | 🟡 Medium   | 0.25d  | ✅ Done  |
| 053-B6  | **Telegram `/sfx` команда**: wizard с prompt → выбор tempo/key → генерация → отправка в чат; в `telegram-bot/commands/sfx.ts`                                                                        | 🟡 Medium   | 0.5d   | ⏳ Pending |
| 053-B7  | **Документация**: `docs/SUNO_API.md` раздел 5 «Sounds, MIDI, Boost»; примеры curl                                                                                                                    | 🟠 High     | 0.25d  |
| 053-B8  | **E2E**: `tests/e2e/sfx-generation.spec.ts` (mobile), `tests/e2e/midi-suno-fallback.spec.ts`                                                                                                         | 🟠 High     | 0.5d   |
| 053-B9  | **Storybook**: `SfxGeneratorSheet.stories.tsx` (3 state)                                                                                                                                             | 🟡 Medium   | 0.25d  |
| 053-B10 | **i18n**: `suno-sounds.json` + `suno-midi.json` × 2 языка                                                                                                                                            | 🟡 Medium   | 0.25d  |

---

## Definition of Done

- [ ] 5 новых edge functions задеплоены, smoke-curl задокументированы
- [ ] `suno-boost-style` либо подключён, либо удалён
- [ ] SfxGeneratorSheet встроен в Library (Pitfall #16: MobileBottomSheet)
- [ ] Suno MIDI = primary, Replicate = fallback (graceful degradation)
- [ ] Все хуки с unit-тестами и Storybook stories
- [ ] `/sfx` Telegram-команда работает
- [ ] `npm run size` — total bundle < 2.15 МБ (delta ≤ +50 КБ gzip)
- [ ] Документация обновлена (MAINT-04)

## Следующие спринты

- **Sprint 054 — Suno Details Suite**: 6 details-эндпоинтов для точечного polling/retry (music/cover/video/wav/midi/lyrics/separation)
- **Sprint 055 — Cost Optimization + Observability**: retry-policy, кредит-дашборд, webhook-secret rotation
