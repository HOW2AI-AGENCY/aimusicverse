## Контекст

Большая часть UI-унификации (фазы 0, 1, 6, 7, 8 + EmptyState/Toast в фазе 3) и Sprint 031 Phase B завершены и стабильны. Остаются три класса работ: миграция оставшихся импортов на канонические компоненты, чистка `lucide-react`/legacy-диалогов и финальная заморозка через ESLint+удаление. Бизнес-логика, сторы, edge-функции и БД не трогаем.

Контрольные находки разведки:
- `RefinedTrackCard`, `RefinedButton`, `GlowButton`, `InteractiveCard` уже без активных импортов в `src/` (можно удалять, не только депрекейтить).
- `framer-motion` напрямую импортирует **1** файл (почти всё уже через `@/lib/motion`).
- `lucide-react` напрямую импортируют **815** файлов — это нарушение Core-памяти (иконки только через `@/lib/icons`).
- 8 одноразовых `*Dialog.tsx` в корне `src/components/` (`AddInstrumentalDialog`, `AddVocalsDialog`, `AudioCoverDialog`, `AudioExtendDialog`, `ConfirmationDialog`, `CreateArtistDialog`, `ExtendTrackDialog`, `NewArrangementDialog`) ещё на сыром `Dialog`, не на `ResponsiveOverlay`/`useConfirm`.
- Главные секции (`FeaturedSection`, `RecentTracksSection`, `TracksGridSection`, `CreativePresetsSection`, `GenreTabsSection`, `CollapsibleSection`) ещё не приведены к каноничным `SectionHeader` + `UnifiedTrackCard`.

## План (по фазам, каждая — отдельный мерж)

### Фаза A — Финал Phase 2/4 (атомы и TrackCard) ⏱ ~30 мин
1. Удалить пустые/неиспользуемые файлы: `components/track/variants/index.ts`, `ui/RefinedTrackCard.tsx`, `ui/RefinedButton.tsx` (если есть), `ui/GlowButton.tsx`, `ui/InteractiveCard.tsx`, `ui/glass-card.tsx` — только те, где `rg` подтвердил 0 импортов.
2. Перед удалением каждого — повторный `rg -l` по `src/` и `tests/`; при единичном остатке заменить на канон в той же фазе.
3. Обновить `docs/UI_AUDIT.md` и `docs/UI_UNIFICATION_STATUS.md` (фазы 2 и 4 → ✅).

### Фаза B — Phase 5: домашние секции ⏱ ~1 час
1. Привести `components/home/{Featured,RecentTracks,TracksGrid,CreativePresets,GenreTabs,Collapsible}Section.tsx` к паттерну `<SectionHeader title subtitle action />` + сетка `UnifiedTrackCard variant=...`.
2. Удалить локальные дубли заголовков/карточек внутри секций.
3. Скриншот-проверка `/` и `/library` через Playwright (мобиль 424×783 + десктоп 1280×1800), сравнить с текущим состоянием.

### Фаза C — Phase 6 финал: миграция диалогов ⏱ ~1.5 часа
1. По одному перевести 8 диалогов на `ResponsiveOverlay` (mobile → `MobileBottomSheet`, desktop → `Dialog`).
2. `ConfirmationDialog` заменить колл-сайтами на `useConfirm()` (хук уже есть).
3. Прогнать сценарии: Extend, Cover, Add Vocals, Add Instrumental, Create Artist, New Arrangement — Playwright по каждому, проверить safe-area и хаптику.

### Фаза D — Иконки: миграция на `@/lib/icons` ⏱ ~1 час (codemod)
1. Codemod-скрипт: заменить `from "lucide-react"` → `from "@/lib/icons"` во всех 815 файлах; недостающие иконки автоматически дописать в реэкспорт `src/lib/icons.ts`.
2. Прогнать `tsgo` и сборку; точечно поправить отсутствующие иконки.
3. Добавить ESLint-правило `no-restricted-imports` (lucide-react → error).

### Фаза E — Phase 9: доступность ⏱ ~1 час
1. Прогон `axe-core` через Playwright на `/`, `/library`, `/studio-v2`, `/projects`, `/profile`.
2. Зафиксировать топ-нарушения (aria-label на icon-buttons, контраст, role на интерактивных div), починить блокеры.
3. Включить `jsx-a11y/control-has-associated-label` как `warn`.

### Фаза F — Phase 10: заморозка ⏱ ~30 мин
1. Удалить оставшиеся `@deprecated` шимы (`FeedbackToast`, шимы `EmptyState`) после финального `rg`-аудита.
2. Поднять ESLint-правила (lucide-react, hardcoded colors) до `error`.
3. Обновить `docs/UI_UNIFICATION_STATUS.md`, `docs/UI_AUDIT.md`, `SPRINTS/SPRINT_UI_UNIFICATION.md` → 100%.

## Гарантии безопасности

- Никаких правок в `src/integrations/supabase/*`, `supabase/config.toml`, edge-функциях, сторах, бизнес-хуках.
- Каждая фаза — отдельный коммит; после каждой проверяем сборку (`tsgo`) и preview-рендер.
- Логирование — только через `logger`; иконки — только через `@/lib/icons`; цвета — только семантические токены.
- Перед удалением любого файла — повторный `rg`-скан по `src/`, `tests/`, `supabase/` и активной документации.

## Что НЕ входит в этот план (вынесено в backlog)

- Sprint 031 US2/US4–US8 (мобильная Studio V2) — отдельная вертикаль, не блокирует UI-чистку.
- Bundle-оптимизация и performance-бенчмарки — Sprint 032 уже закрыт; новый раунд оптимизаций после фазы D (иконки) даст естественный буст.
- Рефакторинг сторов/хуков — вне рамок презентационного слоя.

## Технические детали

- **Codemod иконок (Фаза D)**: `node` + `ts-morph` или простой `rg --files-with-matches | xargs sed -i`; список используемых иконок собирается AST-проходом, дописывается в `src/lib/icons.ts` как `export { Foo, Bar } from "lucide-react"`.
- **ResponsiveOverlay API**: `<ResponsiveOverlay open onOpenChange title description footer>{children}</ResponsiveOverlay>` — breakpoint `md` решает sheet vs dialog.
- **`useConfirm`**: `const confirm = useConfirm(); if (await confirm({ title, description, destructive })) { ... }`.
- **A11y прогон**: `await injectAxe(page); const violations = await getViolations(page);` сохранять в `tests/a11y/<route>.json`.

## Дальнейшие шаги

После одобрения переключиться в build mode и идти фазами A → F, мерж после каждой.
