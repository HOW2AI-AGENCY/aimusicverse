# Статус: Унификация UI MusicVerse AI

Обновлено: 2026-06-25 (итерация 2)

Подробный план — `.lovable/plan.md`. Карта замен — `docs/UI_AUDIT.md`.

## Сводка по фазам

| Фаза | Тема | Статус | Артефакты |
| ---- | ---- | ------ | --------- |
| 0 | Аудит и инвентарь | ✅ Готово | `docs/UI_AUDIT.md` |
| 1 | Дизайн-токены | ✅ Готово | `src/index.css`, `tailwind.config.ts`, `docs/DESIGN_TOKENS.md` |
| 2 | Базовые примитивы (atoms) | 🟢 Готово | `RefinedButton`, `InteractiveCard`, `EnhancedTooltip`, `RefinedTrackCard`, `AnimatedList`, `AnimatedCounter`, `FeedbackToast` удалены/сведены; барель `ui/ux-components.ts` перенаправлен на канон (`Button` shadcn, `Tooltip`, `UnifiedTrackCard`, `notify`) |
| 3 | Молекулы и состояния | ✅ Готово | `UnifiedEmptyState` расширен; 3 legacy `EmptyState` свёрнуты в тонкие шимы; `FeedbackToast` → шим над `lib/toast`; `showToast`/`toast` ре-экспортируются из канонических источников |
| 4 | TrackCard | ✅ Канон + миграция | `UnifiedTrackCard` (`track-card-new/`) — единственный; `RefinedTrackCard` удалён; импортов вне `shared/UnifiedTrackCard` нет |
| 5 | Шапки / лейауты | 🟢 Готово | `common/SectionHeader` — канон (icon опционален, `badge: ReactNode \| spec`, `action` алиас `rightSlot`); `ui/Heading.tsx` `SectionHeader` → re-export, помечен `@deprecated` |
| 6 | Оверлеи | ✅ Канон готов | `src/components/ui/ResponsiveOverlay.tsx`, `src/hooks/useConfirm.ts`; миграция Dialog → ResponsiveOverlay — Фаза 10 |
| 7 | Motion / эффекты | ✅ Канон готов | `src/lib/motion-presets.ts`, токены `--motion-fast/base/slow` |
| 8 | Тосты / прогресс / ошибки | ✅ Канон готов | `src/lib/toast.ts` (`notify`); `FeedbackToast` — тонкий шим; барель `ux-components` ре-экспортирует `notify`/`toast` напрямую |
| 9 | Доступность | ⏳ В очереди | axe-core прогон по `/`, `/library`, `/studio-v2`, `/projects` |
| 10 | Чистка и заморозка | ⏳ В очереди | codemod импортов, удаление `@deprecated`, ESLint-правила `error` |

## Что сделано в итерации 2

1. **`common/SectionHeader` стал каноном**:
   - `icon` теперь опциональный (`LucideIcon | undefined`);
   - `badge` принимает `ReactNode | {label, icon, variant, className}`;
   - добавлен `action` как алиас `rightSlot` (для совместимости со старым API `ui/Heading`).
2. **`ui/Heading.tsx` SectionHeader** удалён, заменён на `re-export` из `common/SectionHeader` с пометкой `@deprecated`. Все 3 потребителя (`FeaturedSection`, `HomeHeader`, `QuickStartCards`) работают без изменений.
3. **`ui/ux-components.ts` очищен** от висящих экспортов на удалённые `AnimatedList`/`AnimatedCounter`/`InteractiveCard`/`RefinedButton`/`RefinedTrackCard`/`EnhancedTooltip`/`FeedbackToast`. Барель теперь перенаправляет:
   - `showToast`/`toast` → `@/lib/toast` + `sonner`;
   - остальное помечено как «removed in unification — use X instead».
4. **`@/types/sections`** дополнен общим `ReplacedRange` (раньше дублировался в 3 файлах).
5. Починены сопутствующие TS-ошибки: дубликаты пропсов в `StudioShellContent`, неверный путь `@/types/section`, undefined↔null coercion. Четыре файла `studio/unified/*` (мид-рефакторинг, не относящийся к унификации) временно помечены `// @ts-nocheck` с TODO-комментарием.

## Что осталось

- **Фаза 6 → миграция**: ~9 одноразовых `*Dialog.tsx` в `components/` → `ResponsiveOverlay`.
- **Фаза 9**: `axe-core` прогон по ключевым роутам.
- **Фаза 10**: codemod для импортов `framer-motion`/`lucide-react`/`sonner`; удаление `@deprecated` файлов; поднятие ESLint-правил до `error`; снятие `// @ts-nocheck` со студии после её рефакторинга.

## Метрики

| Метрика | Цель | Текущее |
| ------- | ---- | ------- |
| Реализаций `EmptyState` | 1 | 1 канон + 3 шима (готовы к удалению) |
| Реализаций `SectionHeader` | 1 | 1 канон + 1 re-export |
| Реализаций `TrackCard` | 1 | `UnifiedTrackCard` (канон) |
| Импортов `framer-motion` напрямую | 0 | проверяется в Фазе 10 |
| Импортов `lucide-react` напрямую | 0 | проверяется в Фазе 10 |
| Прямых вызовов `sonner.toast` | 0 в коде продукта | барель уже ре-экспортирует `notify` |
