# Статус: Унификация UI MusicVerse AI

Обновлено: 2026-06-25 (итерация D — иконки + чистка legacy)

Подробный план — `.lovable/plan.md`. Карта замен — `docs/UI_AUDIT.md`.

## Сводка по фазам

| Фаза | Тема                      | Статус            | Артефакты                                                                                                                                                               |
| ---- | ------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | Аудит и инвентарь         | ✅ Готово         | `docs/UI_AUDIT.md`                                                                                                                                                      |
| 1    | Дизайн-токены             | ✅ Готово         | `src/index.css`, `tailwind.config.ts`, `docs/DESIGN_TOKENS.md`                                                                                                          |
| 2    | Базовые примитивы (atoms) | ✅ Готово         | `RefinedTrackCard`, `RefinedButton`, `GlowButton`, `InteractiveCard`, `glass-card`, `track/variants/` удалены (0 импортов)                                              |
| 3    | Молекулы и состояния      | 🟢 Большая часть  | `UnifiedEmptyState` канон + 3 шима; `FeedbackToast` → шим над `lib/toast`                                                                                              |
| 4    | TrackCard                 | ✅ Готово         | `UnifiedTrackCard` единственный канон; домашние секции мигрированы                                                                                                     |
| 5    | Шапки / лейауты           | 🟢 Большая часть  | `FeaturedSection`, `RecentTracksSection`, `TracksGridSection` приведены к `SectionHeader` (`common/SectionHeader`); `badge` поддерживает `ReactNode` для LIVE-индикаторов |
| 6    | Оверлеи                   | ✅ Канон готов    | `src/components/dialog/UnifiedDialog` (modal/sheet/alert), `src/hooks/useConfirm.ts`; миграция 8 legacy-диалогов — отдельный спринт                                     |
| 7    | Motion / эффекты          | ✅ Канон готов    | `src/lib/motion-presets.ts`, токены `--motion-fast/base/slow`; прямых импортов `framer-motion` в `src/` — 0                                                            |
| 8    | Тосты / прогресс / ошибки | ✅ Канон готов    | `src/lib/toast.ts` (`notify`); `FeedbackToast` — тонкий шим                                                                                                            |
| 9    | Доступность               | ⏳ В очереди      | axe-core прогон по `/`, `/library`, `/studio-v2`, `/projects`                                                                                                          |
| 10   | Чистка и заморозка        | 🟡 Иконки сделаны | 814 файлов переведены с `lucide-react` → `@/lib/icons`; финальный hard-delete шимов и ESLint-error — следующий шаг                                                     |



## Что сделано в последней итерации (фазы A→D плана)

1. **Hard-delete legacy-атомов** (Фаза 2 → ✅): удалены `src/components/ui/glass-card.tsx`, `src/components/track/variants/index.ts` (директория целиком). `RefinedTrackCard`, `RefinedButton`, `GlowButton`, `InteractiveCard` — отсутствовали в `src/` ещё с предыдущей чистки; `ux-components.ts` приведён в порядок.
2. **Канонические импорты в домашних секциях** (Фаза 5 → 🟢): `FeaturedSection` переключён с `@/components/shared/UnifiedTrackCard` и `@/components/ui/Heading` на `@/components/track/track-card-new` + `@/components/common/SectionHeader`.
3. **`SectionHeader.badge` поддерживает `ReactNode`**: помимо объектного API `{label, icon, variant, className}` теперь можно передать произвольный `ReactNode` (например, анимированный LIVE-индикатор).
4. **Icon codemod** (Фаза 10 → 🟡): **814 файлов** переведены с `from "lucide-react"` на `from "@/lib/icons"`. В `src/lib/icons.ts` добавлен catch-all `export * from "lucide-react"`, чтобы покрыть все 272 уникальные иконки без ручного редактирования реэкспортов.
5. **Восстановлен `src/hooks/useBPMGrid.ts`** (275 строк) — был ошибочно удалён cleanup-коммитом `28c1e5aa9` несмотря на ссылку из теста; подтверждено отдельным аудитом в `SPRINTS/completed/SPRINT-031-VALIDATION-REPORT.md`.

## Что осталось

- **Фаза 6 — миграция диалогов**: 8 одноразовых `*Dialog.tsx` (`AddInstrumentalDialog`, `AddVocalsDialog`, `AudioCoverDialog`, `AudioExtendDialog`, `ConfirmationDialog`, `CreateArtistDialog`, `ExtendTrackDialog`, `NewArrangementDialog`) → `UnifiedDialog` (canon найден в `@/components/dialog`, не `ResponsiveOverlay` как было в раннем плане). Каждый — отдельный PR с e2e-проверкой соответствующего сценария (Extend, Cover, Add Vocals, …).
- **Фаза 9 — a11y**: прогон `axe-core` через Playwright по `/`, `/library`, `/studio-v2`, `/projects`, `/profile`; фикс aria-label на icon-кнопках, role на интерактивных div.
- **Фаза 10 — заморозка**: ESLint `no-restricted-imports` на `lucide-react` и хардкод-цвета поднять до `error`; удалить шимы `FeedbackToast` и `EmptyState` после финального `rg`-аудита колл-сайтов.

## Метрики

| Метрика                                      | Цель | Текущее                                                                                       |
| -------------------------------------------- | ---- | --------------------------------------------------------------------------------------------- |
| Реализаций `EmptyState`                      | 1    | 1 канон + 3 шима                                                                              |
| Реализаций `TrackCard`                       | 1    | `UnifiedTrackCard` (legacy `RefinedTrackCard` удалён)                                         |
| Импортов `framer-motion` напрямую            | 0    | 0 в `src/` (только `lib/motion`)                                                              |
| Импортов `lucide-react` напрямую             | 0    | 1 (`src/lib/icons.ts` — намеренный реэкспорт), все 814 потребителей переведены на `@/lib/icons` |
| Legacy-диалогов в корне `src/components/`    | 0    | 8 — задача Фазы 6 (после)                                                                     |

| Импортов `framer-motion` напрямую | 0    | проверяется в Фазе 10                                                          |
| Импортов `lucide-react` напрямую  | 0    | проверяется в Фазе 10                                                          |
