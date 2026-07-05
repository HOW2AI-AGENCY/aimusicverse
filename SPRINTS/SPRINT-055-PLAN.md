# Sprint 055: UX/UI Audit — Critical Fixes (Q4 2026)

**Дата плана:** 2026-07-04
**Длительность:** ~7 рабочих дней (3 фазы)
**Зависимость:** Sprint 050 закрыт (фаза A), Sprint 052/053/054 завершены или в работе
**Цель:** Закрыть критичные UX-блокеры, обнаруженные в полном аудите интерфейса, путей пользователя и формы генерации (см. audit-отчёт в спринт-retro). Снизить form abandonment, восстановить Telegram-deep-link → sheet flow, дать пользователю реальный Save Draft и Cancel для генерации.

---

## Контекст аудита

Полный аудит MusicVerse AI (2026-07-04) выявил следующие проблемы, ранжированные по критичности:

### P0 — блокеры (потеря данных / мёртвые фичи)

| ID   | Проблема                                                                                                                                                                | Файл                                                                                                                                                |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0-1 | Telegram deep-link `startapp=generate` → redirect на `/` без открытия sheet — фича Telegram-бота не работает                                                            | [src/App.tsx:226](../src/App.tsx#L226) + [src/contexts/TelegramContext.tsx](../src/contexts/TelegramContext.tsx)                                    |
| P0-2 | Двойственный CTA: Telegram MainButton прячется в Telegram-шапке, UI button в footer показывается только как "fallback" → пользователь Telegram не видит основную кнопку | [src/components/GenerateSheet.tsx:186-204](../src/components/GenerateSheet.tsx#L186-L204)                                                           |
| P0-3 | Кнопка "Сохранить черновик" — только toast, реальный `useGenerateDraft.save()` не вызывается → пользователь теряет данные                                               | [src/components/GenerateSheet.tsx:195-204](../src/components/GenerateSheet.tsx#L195-L204)                                                           |
| P0-4 | Захардкожен `showCancel={false}` — пользователь не может отменить запущенную генерацию (30-90 сек)                                                                      | [src/components/GenerateSheet.tsx:289](../src/components/GenerateSheet.tsx#L289)                                                                    |
| P0-5 | Welcome Bonus может показаться повторно — нет idempotency guard поверх `shouldShowWelcomeBonus`                                                                         | [src/components/MainLayout.tsx:92-99](../src/components/MainLayout.tsx#L92-L99) + [src/hooks/useCreditsLimits.ts](../src/hooks/useCreditsLimits.ts) |

### P1 — высокий приоритет (UX-friction, потеря контекста)

| ID    | Проблема                                                                                                              |
| ----- | --------------------------------------------------------------------------------------------------------------------- |
| P1-1  | Переключение Simple↔Custom теряет контекст description→style, нет progressive disclosure                              |
| P1-2  | Simple mode обеднён: нет доступа к Style/Lyrics/Voice без полного переключения                                        |
| P1-3  | 8 параллельных диалогов (Project/Artist/Voice/AudioAction/LyricsAssistant/History/Styles/ProjectTrack) перегружают UI |
| P1-6  | Custom mode = 5 секций flat, нет Stepper / sticky progress                                                            |
| P1-7  | Step-numbering bug: `step={hasVocals ? (onCustomVoiceIdChange ? 5 : 4) : 3}` → Settings иногда = 3, дублирование      |
| P1-9  | VoiceInputButton отсутствует в Custom mode (только Simple)                                                            |
| P1-10 | Footer-CTA не показывает summary (type/title/duration) — пользователь не видит, что именно отправит                   |
| P1-11 | Home page не имеет sticky CTA "Создать трек" — единственная точка входа это FAB в BottomNav                           |
| P1-12 | Hint-popup "Создайте первый трек здесь!" перекрывает FAB на маленьких экранах                                         |
| P1-13 | GenerationProgressBadge `fixed bottom-20` перекрывается клавиатурой                                                   |
| P1-14 | Profile link asymmetry: Profile → `/profile/${userId}`, другие tabs — без userId                                      |

---

## Метрики успеха (Definition of Done для Sprint 055)

| Метрика                                     | Бейзлайн | Цель       |
| ------------------------------------------- | -------- | ---------- |
| `form.save_draft.click` event tracked       | 0%       | 100%       |
| `form.save_draft.success` rate              | —        | ≥95%       |
| `form.generate.cancel.click` event tracked  | 0%       | 100%       |
| `deeplink.generate.open_sheet.success` rate | 0%       | ≥95%       |
| `welcome_bonus.show` repeat-rate (per user) | ?        | ≤1 / 30 дн |
| `form.cta.telegram_mainbutton_visible`      | false    | true       |
| Unit-тесты новые                            | 0        | ≥10        |
| `npm run size` delta (gzip, KiB)            | —        | ≤+5        |
| `npm test`                                  | 292 ✅   | 292+ ✅    |
| `npm run lint`                              | 0 errors | 0 errors   |

---

## Фаза A: P0 — критические фиксы данных (дни 1–3)

| ID     | Задача                                                                                                                                                                                                                                                                                | Приоритет   | Оценка | Зависимости    |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------ | -------------- |
| 055-A1 | **Wire Save Draft → useGenerateDraft.saveDraft()**: вместо toast вызвать `form.saveDraft({mode, description, title, lyrics, style, hasVocals, model, negativeTags, vocalGender})`. Добавить новый API: `useGenerateForm` экспортирует `saveDraft`                                     | 🔴 Critical | 0.3d   | ✅ Done          |
| 055-A2 | **Подключить `useGenerateDraft.saveDraft()` к Telegram SecondaryButton** (`[GenerateSheet.tsx:195-204](../src/components/GenerateSheet.tsx#L195-L204)`) + UI fallback-кнопке "Черновик" (`:402-414`). Toast остаётся, но **после** реального сохранения                               | 🔴 Critical | 0.2d   | ✅ Done          |
| 055-A3 | **Unit-тест** на Save Draft round-trip: ввести описание → click → `localStorage.getItem('generate_form_draft')` содержит данные. Файл: `src/__tests__/generate-form/useGenerateDraft.save.test.ts`                                                                                    | 🔴 Critical | 0.3d   | ✅ Done          |
| 055-A4 | **Generation cancel**: убрать `showCancel={false}` → управляемое через state в `useGenerateFormSubmit` (`{cancel, isCancelling}`). Edge function `suno-cancel-task` создать если нет (проверить наличие)                                                                              | 🔴 Critical | 1.0d   | ✅ PR #618       |
| 055-A5 | **Deeplink `startapp=generate` → open sheet**: в `GenerateRedirect` ([src/App.tsx:54-64](../src/App.tsx#L54-L64)) добавить `sessionStorage.setItem('__deeplink_generate_open', '1')` + `MainLayout` effect на mount читает флаг и вызывает `setGenerateSheetOpen(true)`, очищает флаг | 🔴 Critical | 0.5d   | ✅ Done          |
| 055-A6 | **Welcome Bonus idempotency**: проверить `useWelcomeBonusCheck` в [src/hooks/useCreditsLimits.ts](../src/hooks/useCreditsLimits.ts), добавить localStorage TTL guard (`welcome_bonus_shown_at` ≥30 дней), unit-тест                                                                   | 🔴 Critical | 0.3d   | ✅ Done          |
| 055-A7 | **Analytics events**: добавить в `lib/analytics/events.ts` (если нет — создать) события: `form_save_draft_click`, `form_save_draft_success`, `form_generate_cancel_click`, `deeplink_generate_open_attempt`, `welcome_bonus_show`. Обёртка в tracker                                  | 🟠 High     | 0.4d   | 055-A1..A6     |

**Цель фазы A:** Никаких no-op, потеря данных невозможна, deep-link работает, генерация отменяется.

---

## Фаза B: P1 — формы и навигация (дни 3–5)

| ID     | Задача                                                                                                                                                                                                                         | Приоритет | Оценка |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ------ |
| 055-B1 | **Dual CTA в footer**: показывать ОБЕ кнопки всегда (UI button + Telegram MainButton), не как fallback. UI button = `variant="default"`, Telegram = native chrome. Стилистически разделены                                     | 🟠 High   | 0.3d   | ✅ Done          |
| 055-B2 | **Footer CTA summary**: под кнопкой "Сгенерировать" мелким текстом: "Вокал · 60–90 сек · 8 кредитов". Источник: `form.mode`, `form.hasVocals`, Suno API doc на `get-music-generation-details` ETA. Дефолт fallback "30–90 сек" | 🟡 Medium | 0.2d   | ✅ PR #619       |
| 055-B3 | **Hint позиционирование**: перенести первый-hint в absolute relative to FAB с offset `-top-12 -translate-y-full`, чтобы не перекрывал контент выше. Storybook story для `BottomNavigation` hint                                | 🟡 Medium | 0.2d   |
| 055-B4 | **GenerationProgressBadge**: использовать `var(--tg-viewport-stable-height)` или sticky-tg-aware bottom вместо `bottom-20`. Проверить на iOS Safari keyboard case                                                              | 🟡 Medium | 0.3d   |
| 055-B5 | **Stepper для Custom mode**: новый `components/generate-form/FormStepper.tsx` — sticky pill "Шаг 2 из 5", обновляется через `useEffect` watching visible sections (calc на render), а не флаги. Также фикс P1-7                | 🟠 High   | 0.5d   |
| 055-B6 | **VoiceInputButton в Custom mode**: добавить в `sections/StyleSection.tsx` и `sections/LyricsSectionAdvanced.tsx` — voice-input для стиля и текста (аналогично Simple mode)                                                    | 🟡 Medium | 0.3d   |
| 055-B7 | **Home sticky CTA** (опционально): mini floating-кнопка только для cold users (`!localStorage.hasSeenHomeCreateHint`), тапает → `setGenerateSheetOpen(true)` — вытащить `setGenerateSheetOpen` в zustand или через CustomEvent | 🟢 Low    | 0.5d   |

**Цель фазы B:** Форма показывает что именно генерируется, Telegram-юзер видит CTA, навигация корректна на маленьких экранах.

---

## Фаза C: P2 — polish & docs (дни 5–7)

| ID     | Задача                                                                                                                                                                                                                                  | Приоритет | Оценка |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------ |
| 055-C1 | **Single-sheet "Add inspiration"**: объединить 4 кнопки (Audio Ref / Project / Artist / Voice Clone) в одну sheet-bottom "Добавить источник вдохновения" с табами. Снижает cognitive load, освобождает 3 кнопки в `GenerateFormActions` | 🟡 Medium | 1.0d   |
| 055-C2 | **Documentation**: `docs/UX_AUDIT_2026-07-04.md` с полным отчётом аудита (P0-P2 список, метрики, бейзлайны). `CHANGELOG.md` обновить `055-A…` блоком. PROJECT_STATUS.md — Sprint 055 статус                                             | 🟠 High   | 0.5d   |
| 055-C3 | **Sprint retro**: `docs/sprints/SPRINT-055-RETRO.md` — что сделано, что не успели, метрики после 7 дней prod, action items                                                                                                              | 🟡 Medium | 0.3d   |
| 055-C4 | **E2E test Save Draft**: `tests/e2e/generation.save-draft.spec.ts` — открыть sheet → ввести описание → click Draft → close sheet → reopen → assert field заполнено. Playwright mobile + desktop                                         | 🟡 Medium | 0.5d   |
| 055-C5 | **E2E test Deeplink generate**: `tests/e2e/deeplink.generate.spec.ts` — load `/__deep_link=generate` → assert sheet открылся. Test isolation через `sessionStorage`                                                                     | 🟡 Medium | 0.4d   |

**Цель фазы C:** Полная документация, E2E покрытие, ретроспектива → пуш в main → следующий sprint.

---

## Definition of Done

- [ ] Все P0 фиксы в `main`, нет no-op фич
- [ ] ≥5 unit-тестов добавлено (useGenerateDraft.save, welcomeBonus idem)
- [ ] ≥2 E2E тестов добавлены (save-draft, deeplink-generate)
- [ ] Analytics events добавлены и трекаются в production
- [ ] Документация: `docs/UX_AUDIT_2026-07-04.md` + CHANGELOG + retro
- [ ] `npm test` — все существующие + новые проходят
- [ ] `npm run lint` — 0 errors
- [ ] `npm run build` — успешно
- [ ] `npm run size` — total bundle < 2.16 МБ (delta ≤ +5 KiB gzip)
- [ ] `graphify update .` — без regression в графе

## Открытые вопросы / риски

1. **Edge `suno-cancel-task`**: требуется проверить наличие в `supabase/functions/`. Если нет — создать в Sprint 055-A4 (1 день). Если есть — только wire на клиенте (0.3 дня).
2. **Welcome Bonus `useCreditsLimits`**: проверить edge cases (гостевой режим, новый user vs returning), возможно 055-A6 растянется.
3. **Stepper visible-sections calc**: зависит от того, как 5 компонентов секций рендерятся. Может потребоваться refactor `FormSection` (low risk).
4. **Single-sheet для inspiration (C1)**: требует согласия PM, возможно перенос в Sprint 056.

## Следующие спринты

- **Sprint 056 — Progressive Form Disclosure**: единая форма Simple+Custom с progressive expansion, встроенный Stepper, voice input everywhere (P1-1, P1-2)
- **Sprint 057 — Studio V2 UX deep-dive**: отдельный аудит Studio flow, mobile vs desktop (упоминалось в audit Phase 4)
- **Sprint 058 — Library Filters & Discovery**: жанр/настроение/дата фильтры, инфинит-scroll, virtualization tuning
