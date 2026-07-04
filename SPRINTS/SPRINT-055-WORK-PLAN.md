# 🗓️ План работ Sprint 055 (UX/UI Audit — Critical Fixes)

**Версия:** 2026-07-04 (ночь)
**Спринт:** 055 (в работе) → [SPRINT-055-PLAN.md](./SPRINT-055-PLAN.md)
**Аудит:** Полный отчёт по итогам UX-аудита интерфейса, путей пользователя, формы генерации

---

## 📊 Текущее состояние (на 2026-07-04, 23:17)

| #      | Задача                                              | Статус       | Готовность |
| ------ | --------------------------------------------------- | ------------ | ---------- |
| 055-A1 | Wire Save Draft → useGenerateDraft.saveDraft()      | ✅ ЗАВЕРШЕНА | Done       |
| 055-A2 | Подключить к Telegram SecondaryButton + UI fallback | ✅ ЗАВЕРШЕНА | Done       |
| 055-A3 | Unit-тест Save Draft round-trip (5 тестов)          | ✅ ЗАВЕРШЕНА | 5/5 passed |
| 055-A7 | Analytics events form_save_draft                    | ✅ ЗАВЕРШЕНА | Done       |
| 055-A4 | Cancel generation (edge suno-cancel-task)           | ⏳ НЕ НАЧАТА | 0%         |
| 055-A5 | Deeplink `startapp=generate` → open sheet           | ⏳ НЕ НАЧАТА | 0%         |
| 055-A6 | Welcome Bonus idempotency                           | ⏳ НЕ НАЧАТА | 0%         |
| Фаза B | Dual CTA, Stepper, VoiceInput Custom, hint/badge    | ⏳ НЕ НАЧАТА | 0%         |
| Фаза C | Single-sheet inspiration, E2E, retro, docs          | ⏳ НЕ НАЧАТА | 0%         |

**Сделано:** A1+A2+A3+A7 (≈1.5 дня → фактически заняло ~1 сессию)
**Осталось:** 14 задач (~5-6 дней работы)

---

## 🔍 Ресурсы и инвентарь (по итогам graphify + ls)

### Edge functions Suno (из supabase/functions/)

```
suno-music-callback      ✅ уже есть
suno-music-details       ✅ уже есть (Sprint 054)
suno-cover-callback      ✅
suno-cover-details       ✅
suno-video-callback      ✅
suno-video-details       ✅
suno-wav-callback        ✅
suno-wav-details         ✅
suno-midi                ✅
suno-midi-callback       ✅
suno-midi-details        ✅
suno-sounds              ✅
suno-sounds-callback     ✅
suno-sounds-status       ✅
suno-lyrics-details      ✅
suno-separation-details  ✅
suno-music-extend        ✅
suno-music-generate      ✅
suno-cancel-task         ❌ ОТСУТСТВУЕТ — нужно создать
```

### Готовые UI хуки

- `useGenerateDraft` — есть, теперь имеет `saveDraft` через `useGenerateForm`
- `useGenerateFormSubmit` — есть (для cancel need добавить mutation)
- `useWelcomeBonusCheck` — есть, идемпотентность через `localStorage` уже есть, но 5-мин окно → может показаться повторно через 30 дней
- `DeepLinkHandler` в `TelegramContext` — есть

### Готовые компоненты

- `GenerateSheet` — Save Draft fixed ✅
- `BottomNavigation`, `MainLayout` — без изменений
- `WelcomeBonusPopup` — есть, нужно только проверить логику show

---

## 🚀 Дорожная карта (5-6 дней)

### 📅 ДЕНЬ 1 (2026-07-05) — P0-1 + P0-5 (deeplink + welcome bonus)

| Время | ID         | Задача                                    | Файлы                                                                                                                                                                                | Effort |
| ----- | ---------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 09:00 | **055-A5** | Deeplink `startapp=generate` → open sheet | [src/App.tsx:226](src/App.tsx#L226) + [src/contexts/TelegramContext.tsx](src/contexts/TelegramContext.tsx) + [src/components/MainLayout.tsx:114](src/components/MainLayout.tsx#L114) | 0.5d   |
| 14:00 | **055-A6** | Welcome Bonus idempotency (TTL guard)     | [src/hooks/useCreditsLimits.ts:143-186](src/hooks/useCreditsLimits.ts#L143-L186) + unit-тест                                                                                         | 0.3d   |
| 16:00 |            | Analytics events для deeplink + welcome   | [src/hooks/analytics/useFeatureUsageTracking.ts](src/hooks/analytics/useFeatureUsageTracking.ts)                                                                                     | 0.2d   |

**Цель дня:** Никаких потерь пользователей на входе, Telegram deeplink → sheet работает

**DoD:**

- [ ] `startapp=generate` → `MainLayout` effect → `setGenerateSheetOpen(true)` ✅
- [ ] Welcome Bonus не показывается чаще 1 раза / 30 дней ✅
- [ ] Unit-тесты: 2 новых (deeplink flag, welcome TTL) ✅
- [ ] Analytics: `deeplink_generate_open_attempt`, `welcome_bonus_show` ✅

**Верификация:** `npm test` + manual test bot flow

---

### 📅 ДЕНЬ 2 (2026-07-06) — P0-4 (Cancel generation)

| Время | ID          | Задача                                                            | Файлы                                                                                                                                                                 | Effort |
| ----- | ----------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 09:00 | **055-A4a** | Создать edge `suno-cancel-task` (по образцу `suno-music-details`) | `supabase/functions/suno-cancel-task/index.ts`                                                                                                                        | 1.0d   |
| 14:00 | **055-A4b** | UI hook `useSunoCancel(taskId)` + wire в `useGenerateFormSubmit`  | новый `useSunoCancel.ts` + [useGenerateFormSubmit.ts](src/hooks/generation/useGenerateFormSubmit.ts)                                                                  | 0.5d   |
| 16:00 | **055-A4c** | `GenerationLoadingState` → `showCancel={true}` + onCancel handler | [src/components/GenerateSheet.tsx:289](src/components/GenerateSheet.tsx#L289) + [GenerationLoadingState.tsx](src/components/generate-form/GenerationLoadingState.tsx) | 0.3d   |
| 17:00 | **055-A4d** | Unit + integration тесты                                          | `src/__tests__/hooks/useSunoCancel.test.tsx` + `supabase/functions/suno-cancel-task/index.test.ts`                                                                    | 0.5d   |

**Цель дня:** Пользователь может отменить запущенную генерацию

**DoD:**

- [ ] Edge `suno-cancel-task` принимает `{ taskId }`, дёргает Suno API `cancel-task`, возвращает status ✅
- [ ] `useSunoCancel` hook: mutation + isCancelling state ✅
- [ ] Cancel-кнопка показывается через 5 сек после старта генерации ✅
- [ ] При cancel: track-row `status='cancelled'`, освобождение credits (если списываются авансом) ✅
- [ ] Toast "Генерация отменена" + redirect на `/library` ✅
- [ ] Unit-тест: 3 (hook happy/error/idempotent) ✅

**Верификация:** Manual test: start generation → cancel через 10 сек → assert cancelled status в DB

---

### 📅 ДЕНЬ 3 (2026-07-07) — Фаза B начало: Dual CTA + Footer Summary (P1-2 + P1-10)

| Время | ID         | Задача                                          | Файлы                                                                                                                  | Effort |
| ----- | ---------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------ |
| 09:00 | **055-B1** | Dual CTA: показать ОБЕ кнопки всегда            | [src/components/GenerateSheet.tsx:400-446](src/components/GenerateSheet.tsx#L400-L446)                                 | 0.3d   |
| 11:00 | **055-B2** | Footer CTA summary (type + ETA + cost)          | [src/components/GenerateSheet.tsx:430-444](src/components/GenerateSheet.tsx#L430-L444) + новый `GenerationSummary.tsx` | 0.3d   |
| 14:00 | **055-B3** | Hint позиционирование (не перекрывать FAB)      | [src/components/BottomNavigation.tsx:114-130](src/components/BottomNavigation.tsx#L114-L130)                           | 0.2d   |
| 16:00 | **055-B6** | VoiceInputButton в Custom mode (Style + Lyrics) | `sections/StyleSection.tsx`, `sections/LyricsSectionAdvanced.tsx`                                                      | 0.3d   |

**Цель дня:** Telegram-юзер видит CTA, форма показывает summary, голосовой ввод работает везде

**DoD:**

- [ ] UI button + Telegram MainButton обе видны в footer ✅
- [ ] Summary: "Вокал · 60–90 сек · 8 кредитов" под кнопкой ✅
- [ ] Hint popup позиционируется выше FAB ✅
- [ ] VoiceInput в Custom Style + Lyrics ✅

---

### 📅 ДЕНЬ 4 (2026-07-08) — Фаза B середина: Stepper + Bug fixes

| Время | ID          | Задача                                                | Файлы                                                                                                                           | Effort |
| ----- | ----------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 09:00 | **055-B5a** | Stepper компонент `FormStepper.tsx`                   | новый файл                                                                                                                      | 0.3d   |
| 12:00 | **055-B5b** | Wiring Stepper в Custom mode с visible-sections logic | [src/components/generate-form/GenerateFormCustom.tsx:160](src/components/generate-form/GenerateFormCustom.tsx#L160) (фикс P1-7) | 0.3d   |
| 14:00 | **055-B4**  | GenerationProgressBadge sticky-tg-aware               | [src/components/BottomNavigation.tsx:99-103](src/components/BottomNavigation.tsx#L99-L103)                                      | 0.2d   |
| 16:00 | **055-B7**  | Home sticky CTA (cold users only)                     | новый `HomeCreateCTA.tsx` в `src/pages/Index.tsx`                                                                               | 0.3d   |

**Цель дня:** Mobile-корректно работающая навигация + step counter

**DoD:**

- [ ] Stepper правильно считает видимые секции (не флаги) ✅
- [ ] GenerationProgressBadge использует `var(--tg-viewport-stable-height)` ✅
- [ ] Home CTA для cold users через localStorage.flag ✅

---

### 📅 ДЕНЬ 5 (2026-07-09) — Фаза C: E2E тесты + Docs

| Время | ID         | Задача                                                   | Файлы                                     | Effort |
| ----- | ---------- | -------------------------------------------------------- | ----------------------------------------- | ------ |
| 09:00 | **055-C4** | E2E test Save Draft round-trip                           | `tests/e2e/generation.save-draft.spec.ts` | 0.4d   |
| 12:00 | **055-C5** | E2E test Deeplink generate → open sheet                  | `tests/e2e/deeplink.generate.spec.ts`     | 0.3d   |
| 14:00 | **055-C2** | Documentation: `docs/UX_AUDIT_2026-07-04.md` + CHANGELOG | новый doc + [CHANGELOG.md](CHANGELOG.md)  | 0.4d   |
| 16:00 | **055-C3** | Sprint retro `docs/sprints/SPRINT-055-RETRO.md`          | новый файл                                | 0.3d   |

**Цель дня:** Полное покрытие, документация, ретроспектива

**DoD:**

- [ ] E2E Save Draft: 1 spec ✅
- [ ] E2E Deeplink generate: 1 spec ✅
- [ ] UX_AUDIT_2026-07-04.md с отчётом ✅
- [ ] CHANGELOG обновлён ✅
- [ ] SPRINT-055-RETRO.md создан ✅

---

### 📅 ДЕНЬ 6 (2026-07-10) — Финализация: PR + CI verification

| Время | ID         | Задача                                                    | Файлы                               | Effort               |
| ----- | ---------- | --------------------------------------------------------- | ----------------------------------- | -------------------- |
| 09:00 |            | Прогон полного verification cycle                         | —                                   | 0.3d                 |
| 12:00 |            | Создать PR, CI green                                      | —                                   | 0.2d                 |
| 14:00 | **055-C1** | Single-sheet "Add inspiration" (опционально — PM-approve) | рефактор `GenerateSheetDialogs.tsx` | 1.0d (если approved) |

**Цель дня:** Sprint закрыт, PR готов к merge

**DoD:**

- [ ] `npm run size` — total bundle < 2.16 МБ ✅
- [ ] `npm run lint` — 0 errors ✅
- [ ] `npm test` — все + новые проходят ✅
- [ ] `npm run test:e2e` — 2 новых spec ✅
- [ ] PR создан, CI зелёный ✅

---

## 📈 Метрики успеха (Definition of Done)

| Метрика                                               | Бейзлайн           | Цель         | Когда измерять       |
| ----------------------------------------------------- | ------------------ | ------------ | -------------------- |
| Unit Tests                                            | 292 → **325** (✅) | 340          | День 6               |
| E2E Tests                                             | 47                 | **49** (+2)  | День 5               |
| ESLint errors                                         | 0                  | 0            | Каждый день          |
| TypeScript errors                                     | 0                  | 0            | Каждый день          |
| Bundle size (gzip)                                    | 2.11 MB            | ≤ 2.16 MB    | День 6               |
| `form_save_draft.click` event                         | 0%                 | 100% covered | ✅ сделано           |
| `form_save_draft.complete` rate                       | —                  | ≥95%         | После 7 дней prod    |
| `form_generate_cancel.click` event                    | 0%                 | tracked      | День 2               |
| `deeplink_generate.open_sheet.success` rate           | 0% (broken)        | ≥95%         | День 1 + 7 дней prod |
| `welcome_bonus.repeat_rate` per user                  | unknown            | ≤1 / 30 дн   | День 1 + 7 дней prod |
| Auto-save уже работает (через `useGenerateFormDraft`) | —                  | проверено ✅ | —                    |

---

## 🎯 Бэклог (если время позволит / следующий Sprint 056)

Из аудита осталось за пределами Sprint 055:

| Приоритет | Задача                                                  | Целевой спринт                 |
| --------- | ------------------------------------------------------- | ------------------------------ |
| P1-1/2    | Progressive disclosure (Simple + Custom → единая форма) | Sprint 056                     |
| P1-3      | Single-sheet "Add inspiration" (8 dialogs → 1)          | Sprint 056 (если C1 не успели) |
| P1-6      | Stepper (уже запланировано B5)                          | уже в этом спринте             |
| P1-9      | VoiceInput везде (Custom mode)                          | уже в этом спринте (B6)        |
| P1-10     | Footer CTA summary                                      | уже в этом спринте (B2)        |
| P1-11     | Home sticky CTA                                         | уже в этом спринте (B7)        |
| Audit P2  | Library filters, A/B live preview, undo AI boost        | Sprint 058                     |

---

## 🎓 Распределение по дням — итоговая сводка

| День        | Фокус                                           | Задачи            | Effort | Кумулятивно |
| ----------- | ----------------------------------------------- | ----------------- | ------ | ----------- |
| ✅ Сессия 1 | A1+A2+A3+A7 (Save Draft + tests + analytics)    | 4 задачи          | 1.5d   | 1.5/6       |
| День 1      | A5 + A6 (deeplink + welcome bonus idempotency)  | 3 задачи          | 1.0d   | 2.5/6       |
| День 2      | A4 (Cancel generation, edge + UI)               | 4 подзадачи       | 2.3d   | 4.8/6       |
| День 3      | B1, B2, B3, B6 (Dual CTA, summary, hint, voice) | 4 задачи          | 1.1d   | 5.9/6       |
| День 4      | B5, B4, B7 (Stepper, badge, home CTA)           | 3 задачи          | 0.8d   | 6.7/6       |
| День 5      | C4, C5, C2, C3 (E2E + docs + retro)             | 4 задачи          | 1.4d   | 8.1/6       |
| День 6      | Verification + PR                               | 1 (+ C1 optional) | 0.5d   | 8.6/6       |

---

## ⚠️ Открытые риски и вопросы

1. **Edge `suno-cancel-task`**: Suno API имеет `/api/v1/generate/cancel`? Проверить в первую очередь День 2. Если нет — нужно создать иной механизм (например, soft-cancel в `generation_tasks` + skip polling).
2. **Sprint 050 force-push в main**: если блокирует merge — Sprint 055-A в отдельной ветке `claude/sprint-055-deeplink-welcome` можно мержить независимо.
3. **Welcome Bonus 5-мин окно**: spec говорит "новый user ≤5 мин". Что если пользователь делит устройство / новый аккаунт через 5 мин? Решение: TTL 30 дней поверх welcomeShown флага.
4. **Single-sheet inspiration (C1)**: рефактор 8 dialogs → может потребовать отдельный spec, отложен в Спринт 056.
5. **Stepper visible-sections логика**: требует правки `FormSection.tsx` API (низкий риск, но touch другими формами).

---

## 🔗 Связанные документы

- [SPRINT-055-PLAN.md](./SPRINT-055-PLAN.md) — детальный план по задачам
- [SPRINT-PROGRESS.md](./SPRINT-PROGRESS.md) — tracker спринта
- [BACKLOG.md](./BACKLOG.md) — общий бэклог
- [docs/SUNO_API.md](../docs/SUNO_API.md) — референс для cancel-task API
- [CHANGELOG.md](../CHANGELOG.md) — релиз-нотсы

---

## ✋ Запрос на подтверждение

**Готов приступить к Дню 1 (P0-1 + P0-5)** — 055-A5 (deeplink) + 055-A6 (welcome bonus idempotency).

Подтвердите, если:

1. План устраивает — стартую 055-A5
2. Или хотите скорректировать приоритеты (например, **сначала A4 cancel** — самое user-facing)

Также стоит решить:

- **A4 cancel** требует проверки Suno API на наличие `/api/v1/generate/cancel`. Если API не поддерживает — нужно создать альтернативный механизм. Имеет смысл проверить **до** начала Дня 2.
- **Single-sheet (C1)** — лучше перенести в Sprint 056 (требует refactor 8 dialogs)?
