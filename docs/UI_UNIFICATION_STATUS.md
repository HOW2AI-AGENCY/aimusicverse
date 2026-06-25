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



## Что сделано в последней итерации

1. **`UnifiedEmptyState` расширен** — теперь принимает:
   - `icon: LucideIcon | ReactNode` (поддержка JSX-иконок и эмодзи);
   - `action`/`secondaryAction` объектные API (label + onClick + icon);
   - `size: 'sm' | 'md' | 'lg'` как алиас к `compact`.
2. **3 legacy `EmptyState`** превращены в тонкие шимы, делегирующие в `UnifiedEmptyState`:
   - `src/components/ui/EmptyState.tsx` (≈ 65 строк вместо 243);
   - `src/components/ui/empty-state.tsx` (≈ 65 строк вместо 239);
   - `src/components/common/EmptyState.tsx` (≈ 50 строк вместо 252).
   - Удалено ~550 строк дублирующейся разметки. Все колл-сайты продолжают работать без изменений API.
3. **`FeedbackToast.tsx`** → тонкий шим над `notify` из `@/lib/toast` (≈ 30 строк вместо 200+). `showToast(...)` оставлен для обратной совместимости.
4. Поправлен барель `src/components/ui/ux-components.ts` (убран несуществующий `InlineEmpty`).

## Что осталось

- **Фаза 4 → миграция импортов**: заменить `RefinedTrackCard` и `components/track/variants/*` на `UnifiedTrackCard` (variant=professional).
- **Фаза 5**: привести домашние секции (`FeaturedSection`, `RecentTracksSection`, `TracksGridSection`, `TrackPresetsRow`) к `SectionHeader` + `UnifiedTrackCard`.
- **Фаза 6 → миграция**: 9 одноразовых `*Dialog.tsx` в `components/` → `ResponsiveOverlay`.
- **Фаза 9**: `axe-core` прогон по `/`, `/library`, `/studio-v2`, `/projects`.
- **Фаза 10**: codemod для импортов, удаление `@deprecated`, поднятие ESLint-правил до `error`.

## Метрики

| Метрика                           | Цель | Текущее                                                                        |
| --------------------------------- | ---- | ------------------------------------------------------------------------------ |
| Файлов в `components/ui/`         | ~60  | 94 (без сокращения; legacy схлопнуты, но файлы пока живы — удаление в Фазе 10) |
| Реализаций `EmptyState`           | 1    | 1 канон + 3 шима (готовы к удалению)                                           |
| Реализаций `TrackCard`            | 1    | `UnifiedTrackCard` (канон) + `RefinedTrackCard` шим                            |
| Импортов `framer-motion` напрямую | 0    | проверяется в Фазе 10                                                          |
| Импортов `lucide-react` напрямую  | 0    | проверяется в Фазе 10                                                          |
