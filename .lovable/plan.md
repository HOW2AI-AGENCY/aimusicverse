
## Проблема

В проекте сосуществуют **5+ независимых систем подсказок**, часто дублирующих друг друга и конфликтующих по z-index и позиционированию:

| Система | Файл | Назначение | Проблема |
|---|---|---|---|
| Radix Tooltip | `ui/tooltip.tsx` | hover-подсказки на десктопе | нет touch-fallback на mobile |
| InteractiveTooltip | `tooltips/InteractiveTooltip.tsx` | кликабельные подсказки с «Понятно» | дублирует ContextualOnboardingTip |
| ContextualOnboardingTip | `onboarding/ContextualOnboardingTip.tsx` | контекстные tip-карточки | свой стор, своё позиционирование |
| ContextualTipOverlay | `onboarding/ContextualTipOverlay.tsx` | overlay-подсказки | пересекается с FAB/плеером на mobile |
| OnboardingTooltip + FeatureHighlight | `onboarding/` | подсветка фич | свой z-index, перекрывает sheet/drawer |
| interface-hints.tsx | `ui/interface-hints.tsx` | inline-«🎯 ...» блоки | hardcoded позиции, наезжают на контент |
| QuickTipToast / TipsPanel | разное | tip-тосты, панели | разная анимация и стиль |

Симптомы, которые видит пользователь:
- одинаковая подсказка показывается двумя способами одновременно
- на mobile (390px) карточки «🎯 Референсное аудио» и подобные **наслаиваются на форму и плеер**, кнопка «Понятно» уезжает за safe-area
- z-index гонка: tooltip оказывается под Sheet/Drawer или над модалом
- разные стили (стекло / непрозрачная карточка / тост) для одинаковой роли

## Цель

Один публичный API подсказок, одна визуальная система, корректные `z-index`-слои и адаптивное поведение mobile/desktop.

## Решение

### 1. Единый модуль `src/components/hints/`

```text
src/components/hints/
  HintProvider.tsx       // глобальный контекст: реестр показанных id, очередь
  Hint.tsx               // главный компонент-обёртка (variant + trigger)
  HintBubble.tsx         // визуал: glass-карточка с заголовком/текстом/CTA
  HintBeacon.tsx         // пульсирующая точка-якорь для onboarding
  useHint.ts             // программный API: show/dismiss/reset
  hints.registry.ts      // единый каталог всех подсказок (id → конфиг)
  index.ts
```

Публичный API — ровно три формы:

```tsx
// 1. Hover/long-press подсказка над элементом (замена Radix Tooltip)
<Hint id="generate.style" label="Стиль трека">
  <Button>…</Button>
</Hint>

// 2. Onboarding-карточка с «Понятно», показывается 1 раз
<Hint id="generate.referenceAudio" variant="coachmark" anchor="auto">
  <ReferenceAudioField />
</Hint>

// 3. Программный показ (после действия, из хука)
const hint = useHint();
hint.show('studio.firstStem');
```

Все тексты — в `hints.registry.ts`, чтобы исключить дубли и упростить локализацию.

### 2. Дедупликация

- Один `id` → одна подсказка. `HintProvider` хранит `Set<shownIds>` в `localStorage` (`mv:hints:v1`) + in-memory очередь, не даёт показать второй экземпляр.
- Миграция старых ключей `onboarding_*`, `tip_*`, `coachmark_*` → новый namespace, чтобы пользователи не увидели повторно уже закрытые подсказки.

### 3. Z-index и позиционирование

В `index.css` фиксируем семантические слои (расширение существующих токенов):

```css
--z-hint-tooltip: 70;   /* hover-подсказка */
--z-hint-coachmark: 80; /* onboarding-карточка */
--z-hint-overlay: 85;   /* подсветка + бэкдроп */
/* < player(90) < sheet/drawer(100) < modal(110) < toast(120) */
```

- `HintBubble` использует Radix Popper (`@radix-ui/react-popper`) с `collisionPadding`, учитывающим safe-area и высоту mini-плеера/нижней навигации.
- На mobile (`<768px`) `variant="coachmark"` рендерится как **bottom-sheet-карточка** через `vaul` вместо плавающей карточки — никаких наездов на FAB/плеер.
- На desktop — плавающая карточка рядом с якорем со стрелкой.

### 4. Адаптивное поведение триггера

| Устройство | Hover-tooltip | Coachmark |
|---|---|---|
| Desktop (hover: hover) | при `mouseenter`, задержка 400 мс | автопоказ при появлении якоря в viewport |
| Mobile/Touch | long-press 500 мс (haptic) | автопоказ как bottom-sheet |

Определение через `matchMedia('(hover: hover)')`, без user-agent сниффинга.

### 5. Миграция существующего кода

Шаги в порядке выполнения:

1. Добавить новый модуль `hints/` и подключить `<HintProvider>` в `UIProviders.tsx` рядом с существующим `TooltipProvider`.
2. Перенести все строки из `interface-hints.tsx`, `ContextualOnboardingTip.CONTEXTUAL_TIPS`, `InteractiveTooltip` конфигов, `OnboardingTooltip` в `hints.registry.ts` (одна запись на смысловой id, дубли схлопываются).
3. Заменить вызовы:
   - `<Tooltip>…</Tooltip>` (Radix) → `<Hint variant="tooltip">` где это пользовательская подсказка (в `ui/` оставить Radix как низкоуровневый примитив).
   - `<InteractiveTooltip>` / `<ContextualOnboardingTip>` / `<OnboardingTooltip>` / inline `🎯`-блоки из `interface-hints.tsx` → `<Hint variant="coachmark">`.
   - `ContextualTipOverlay` → `<Hint variant="coachmark" anchor="...">` (overlay убирается, перекрытий не остаётся).
4. Удалить старые файлы после миграции call-site'ов: `tooltips/InteractiveTooltip.tsx`, `onboarding/ContextualOnboardingTip.tsx`, `onboarding/ContextualTipOverlay.tsx`, `onboarding/OnboardingTooltip.tsx`, `ui/interface-hints.tsx`. `FeatureTutorialDialog` / `QuickStartOverlay` / `TelegramOnboarding` остаются (это многошаговые туры, не подсказки).
5. Прогнать `rg` по проекту, чтобы убедиться, что нет orphan-импортов.

### 6. Проверка

- Mobile 390×844: открыть форму генерации, Studio, Lyrics-workspace — убедиться, что подсказки не пересекаются с плеером, FAB и нижней навигацией.
- Desktop 1280+: подсказки корректно якорятся, не выезжают за viewport.
- Сброс через debug-хук `hint.resetAll()` для повторной проверки.

## Технические детали

- **Зависимости:** уже есть `@radix-ui/react-popper`, `vaul`, `framer-motion` (через `@/lib/motion`). Новые пакеты не нужны.
- **Стиль:** `glass` токены из `src/lib/glass.ts`, цвета из `src/lib/design-tokens.ts` — никаких хардкодов.
- **Логи:** `logger.info('hint:shown', { id })`, без `console.*`.
- **Хранилище:** `localStorage` ключ `mv:hints:v1` = `{ shown: string[], version: 1 }`; миграция читает старые ключи `onboarding_*`, `tip_*`, `interface_hint_*` и переносит в новый формат один раз.
- **A11y:** `role="tooltip"` / `role="dialog"` в зависимости от варианта, `aria-describedby` на якоре, фокус-trap только для coachmark с CTA.
- **Тесты:** unit на `hints.registry` (нет дублей id), e2e Playwright — открыть страницу генерации на mobile-viewport и проверить, что подсказка не перекрывает кнопку «Сгенерировать».

## Что НЕ входит

- Не переписываем многошаговые туры (`FeatureTutorialDialog`, `TelegramOnboarding`, `QuickStartOverlay`) — это отдельный слой onboarding.
- Не трогаем `sonner`-тосты и системные уведомления.
- Не меняем тексты подсказок по существу — только устраняем дубли.

## Объём

~15 новых/изменённых файлов в `src/components/hints/`, удаление 5 устаревших модулей, точечные правки в ~30–40 call-site'ах. Делается одним PR, миграция вызовов — пачками по разделам (generate-form → studio → lyrics → library → player).
