# План: Унификация UI MusicVerse AI

Цель — убрать накопленные дубли компонентов и стилей, оставить один источник правды для каждой UI-сущности, без изменения бизнес-логики и бэкенда. Работа разбита на фазы; каждая фаза самостоятельна, мержится отдельно и не ломает существующие экраны (через алиасы и переходный период).

## Принципы

- Меняем только presentation-слой. Хуки, сторы, edge-функции, API не трогаем.
- Каждый дубль заменяется через codemod-replace: новый канонический компонент + ре-экспорт из старых путей `@deprecated`, чтобы PR не ломал ничего разом.
- Никаких хардкод-цветов (`text-white`, `bg-[#...]`) — только семантические токены из `src/index.css` / `src/lib/design-tokens.ts` / `src/lib/glass.ts`.
- Соблюдаем Core-память: иконки только через `src/lib/icons.ts`, лог через `logger`, безопасные зоны Telegram через `max(var(--tg-safe-area-inset-*), env(...))`.

---

## Фаза 0. Аудит и фиксация инвентаря (1 PR, без правок кода)

Создаём `docs/UI_AUDIT.md` — единая таблица «что есть → что станет каноном → что удалить».

Зоны для инвентаризации (по результатам разведки уже видно дубли):

- **Карточки трека**: `components/ui/RefinedTrackCard.tsx`, `components/track/variants/*`, `components/track/track-card-new/variants/*` (Professional/Minimal/List/Grid), `components/home/*Section.tsx` со своими карточками.
- **Empty state**: `ui/EmptyState.tsx`, `ui/empty-state.tsx`, `ui/unified-empty-state.tsx`, `common/EmptyState.tsx`.
- **Шапки/заголовки**: `common/UnifiedPageHeader.tsx`, `common/SectionHeader.tsx`, `ui/Heading.tsx`, `mobile/MobileHeaderBar.tsx`.
- **Скелетоны**: `ui/skeletons/*`, `ui/skeleton/*`, `ui/skeleton-loader.tsx`, `ui/skeleton-components.tsx`, `ui/ContentSkeleton.tsx`.
- **Лоадеры**: `ui/LoadingSpinner.tsx`, `ui/LoadingOverlay.tsx`, `ui/loading-state.tsx`, `GlobalGenerationIndicator.tsx`.
- **Оверлеи**: `Dialog`, `Sheet`, `Drawer`, `MobileBottomSheet`, `ActionSheet`, кастомные `*Dialog.tsx` в корне `components/`.
- **Кнопки/карточки/инпуты**: `RefinedButton`, `RefinedCard`, `InteractiveCard`, `GlowButton`, `glass-card`, plus shadcn `button/card/input`.
- **Тосты/фидбек**: `FeedbackToast`, `sonner`, ad-hoc `toast.loading` степпер из формы генерации.

Выход фазы: таблица замен + список файлов под удаление в финальной фазе.

## Фаза 1. Дизайн-токены и утилиты — один источник

- Перечитать `src/index.css`, `tailwind.config.ts`, `src/lib/design-tokens.ts`, `src/lib/glass.ts`. Свести расхождения (особенно радиусы, тени, blur, safe-area).
- Добавить недостающие семантические токены (`--surface-1/2/3`, `--overlay-scrim`, `--ring-focus`, `--state-success/warning/danger`) в `index.css`, прокинуть в `tailwind.config.ts`.
- Запретить хардкод цветов: добавить ESLint-правило `no-restricted-syntax` на классы `text-white|bg-black|bg-\\[#`. Поставить как `warn` сначала, затем `error` в фазе 6.
- Документ `docs/DESIGN_TOKENS.md` с матрицей токен ↔ Tailwind-класс ↔ когда применять.

## Фаза 2. Базовые примитивы (atoms)

Канон выбирается из существующих, остальное превращается в реэкспорт.

- **Button** = `components/ui/button.tsx` (shadcn) + варианты `premium`, `glass`, `icon-sm`. `RefinedButton`, `GlowButton` → реэкспорт + `@deprecated`.
- **Card** = `components/ui/card.tsx` с вариантами `surface | glass | interactive`. `RefinedCard`, `InteractiveCard`, `glass-card` → варианты выше.
- **Input/Textarea/Select** = shadcn. `FloatingInput`, `ChipInput` остаются как специализированные обёртки над базовым.
- **Heading** = `components/ui/Heading.tsx` с пропсами `level`, `tone`. Все `<h1..h3 className="...">` приводятся к нему.
- **Icon import** уже централизован — пройти codemod-ом по нарушителям `from "lucide-react"` и заменить на `@/lib/icons`.

## Фаза 3. Молекулы и состояния

- **EmptyState**: оставить `ui/unified-empty-state.tsx` как канон, переименовать в `ui/empty-state.tsx`, остальные 3 файла → реэкспорт. API: `{ icon, title, description, action }`.
- **LoadingSpinner / Skeleton**: один `ui/spinner.tsx` и единый набор `ui/skeleton/*` (TrackCardSkeleton, ListSkeleton, GridSkeleton, TextSkeleton). Удалить `skeleton-loader.tsx`, `skeleton-components.tsx`, `ContentSkeleton.tsx`.
- **StatusBadge / Tag / Chip** — оставить один `ui/StatusBadge.tsx` поверх `badge.tsx`, варианты по семантическим токенам.
- **ProgressSteps**: переиспользовать для индикатора Custom/Extend/Cover вместо `toast.loading` цепочки; форма генерации перейдёт на него (UI-only).

## Фаза 4. Карточки трека — единый компонент

- Канон: `components/track/track-card-new/` с `variant: 'grid' | 'list' | 'minimal' | 'professional'` и `size: 'sm' | 'md' | 'lg'`.
- `RefinedTrackCard`, `components/track/variants/*`, локальные карточки в `components/home/*Section.tsx` → переключение на канон с подбором варианта.
- Унифицировать поведенческие пропсы: `onPlay`, `onOpen`, `onAction`. Действия — через единое меню `track-actions/UnifiedTrackActions`.
- Скелетон карточки — один `TrackCardSkeleton` с тем же `variant`.

## Фаза 5. Шапки, навигация, лейауты

- **PageHeader**: канон `common/UnifiedPageHeader.tsx`, переименовать в `ui/PageHeader.tsx`. Параметры: `title`, `subtitle`, `back`, `actions`, `sticky`.
- **SectionHeader**: канон `common/SectionHeader.tsx` (см. память «Section Headers»). Все домашние секции (`FeaturedSection`, `RecentTracksSection`, `TracksGridSection`, `TrackPresetsRow`) приводим к нему.
- **MobileHeaderBar** оставляем для Telegram-экранов как обёртку над `PageHeader` с safe-area и Back-button proxy.
- Прогнать лейауты `MainLayout`, `Sidebar`, `BottomNavigation` на единые spacing-токены и `z-index` семантику (см. память «Z-Index Semantics»).

## Фаза 6. Оверлеи: Dialog / Sheet / Drawer / ActionSheet

- Правило: на мобиле — `MobileBottomSheet` (vaul), на десктопе — `Dialog`. Хелпер `ui/ResponsiveOverlay` решает по breakpoint.
- Все одноразовые `*Dialog.tsx` в корне `components/` (`AddInstrumentalDialog`, `AddVocalsDialog`, `AudioCoverDialog`, `AudioExtendDialog`, `ConfirmationDialog`, `CreateArtistDialog`, `ExtendTrackDialog`, `NewArrangementDialog`, `TrackDetailDialog/Sheet`) переводим на `ResponsiveOverlay`, единый header/footer паттерн, единые отступы и safe-area.
- `ConfirmationDialog` → единый `useConfirm()` хук.

## Фаза 7. Эффекты, движение, хаптика

- Импорт motion только из `@/lib/motion` (codemod на нарушителях `from "framer-motion"`).
- Унифицировать пресеты анимации: `fadeIn`, `slideUp`, `scaleIn`, `listStagger` в `lib/motion-presets.ts`. Использовать их в `AnimatedList`, `PageTransition`, `TouchFeedback`.
- Hover/press-эффекты — только через `TouchFeedback` и варианты `Button`/`Card`. Удалить разрозненные inline `whileHover` со случайными значениями.
- Хаптика — только через стандартизированный `impact()` API (см. память).
- Глобальная семантика длительности: `--motion-fast: 120ms`, `--motion-base: 200ms`, `--motion-slow: 320ms` в `index.css`.

## Фаза 8. Фидбек: тосты, прогресс, ошибки

- Один `toast` адаптер поверх `sonner` в `lib/toast.ts` с методами `success | error | info | progress`. Удалить `FeedbackToast`.
- Прогресс многошаговых операций — `ProgressSteps` в UI + параллельный `toast.progress` только как fallback.
- Ошибки — единый `ErrorBanner` + хук `useErrorToast` поверх `lib/errorHandling`.

## Фаза 9. Доступность и проверки

- Все иконковые кнопки получают `aria-label` (lint-правило `jsx-a11y/control-has-associated-label`).
- Touch target ≥44×44 (см. память) — добавить storybook-визуальный чек.
- Контраст: прогнать `@axe-core/playwright` по ключевым роутам (`/`, `/library`, `/studio-v2`, `/projects`).

## Фаза 10. Чистка и заморозка

- Удалить файлы, помеченные `@deprecated` после миграции всех импортов (grep ноль ссылок → `rm`).
- Поднять ESLint-правила `no-restricted-syntax` (цвета) и `no-restricted-imports` (`framer-motion`, `lucide-react` напрямую) до `error`.
- Обновить `docs/UI_AUDIT.md` → `docs/UI_SYSTEM.md` как итоговую документацию.
- Добавить раздел в `KNOWLEDGE_BASE.md` и память `mem://ui/unified-system` с правилами на будущее.

---

## Технические детали

### Стратегия миграции без поломок

Для каждой замены:

```text
старый файл  ──►  тонкий реэкспорт + console.warn в dev
                       │
                       ▼
                новый канонический файл
```

Этап `@deprecated` живёт 1 PR-цикл, затем удаление в Фазе 10.

### Codemod-инструменты

- `jscodeshift` / `ts-morph` скрипты в `scripts/codemods/` для:
  - замены импортов компонентов;
  - замены `from "lucide-react"` → `from "@/lib/icons"`;
  - замены `from "framer-motion"` → `from "@/lib/motion"`;
  - перевода литеральных Tailwind цветов в токены.

### Метрики успеха

- Кол-во файлов в `components/ui/` сокращается ориентировочно с 94 до ~60.
- Один компонент `TrackCard` вместо 4 реализаций.
- 0 импортов `framer-motion` и `lucide-react` вне `lib/motion.ts` / `lib/icons.ts`.
- 0 хардкод цветовых классов в `components/` и `pages/`.
- Bundle size не растёт; ожидается −30–60 KB за счёт удаления дублей.

### Что НЕ входит в этот план

- Изменения бизнес-логики, сторов, API, edge-функций.
- Редизайн с новой визуальной концепцией — только унификация текущей.
- Замена shadcn/ui на другую библиотеку.

### Порядок мерджа

Фазы 0 → 1 → 2 → 3 идут последовательно (фундамент). Фазы 4, 5, 6, 7, 8 можно параллелить разными PR после Фазы 3. Фазы 9 и 10 — финальные.
