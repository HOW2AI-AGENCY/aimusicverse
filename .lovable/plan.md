
## 1. Методология аудита

Сделан скрин-аудит ключевых маршрутов (`/`, `/library`, `/projects`, `/community`, `/profile`, `/settings`, `/pricing`, `/rewards`) на 7 viewport'ах через Playwright + headless Chromium:

```text
desktop-wide       1920×1080
desktop            1440×900
tablet-landscape   1024×768
tablet-portrait    768×1024
mobile-landscape   844×390   (iPhone 12/13 horizontal)
mobile-portrait    390×844   (iPhone 12/13 vertical)
mobile-xs          360×640   (Android baseline)
```

Параллельно проанализированы дизайн-токены (`src/index.css`, `tailwind.config.ts`, `src/lib/design-tokens.ts`), layout-каркас (`MainLayout`, `Sidebar`, `BottomNavigation`) и общий шаблон страниц.

---

## 2. Найденные проблемы по категориям

### 2.1 Критические дефекты (regression / crash)

| # | Маршрут | Viewport | Проблема |
|---|---------|----------|----------|
| C1 | `/library` | 360×640 (mobile-xs) | Срабатывает ErrorBoundary («Что-то пошло не так»). Страница не рендерится. |
| C2 | `/pricing` | 390×844 | Чёрный экран без контента — компонент Pricing на мобильном не отдаёт layout (нет fallback’а или сетка `md+` оставляет всё `hidden`). |
| C3 | Любая страница | desktop ≥1024 | «Гостевой режим / Войти / ×» banner перекрывает зону логотипа Sidebar (z-index перекрытие, дублирование close-кнопок). |
| C4 | `/library`, `/projects` | mobile-landscape 844×390 | Drawer-сайдбар открывается поверх контента без backdrop-blur, фильтры/чипы/поиск частично скрыты под ним. |

### 2.2 Layout и адаптивность

- **Tablet 768–1024 px**: Sidebar остаётся в полной ширине (256 px) → контент сужается до ~512 px, появляется горизонтальная теснота. Нет промежуточного «icon-only» режима.
- **Desktop wide ≥1920 px**: контентная зона не центрируется (`max-w-screen-xl` не используется на большинстве страниц), сетка карточек растягивается на 5–6 колонок и выглядит «разреженной».
- **Mobile portrait 390 px**:
  - На главной — герой-карточка пустая (`min-h-[420px]`) занимает 70 % экрана без полезного контента до загрузки данных.
  - Top-bar «Гостевой режим / Войти / ×» + системный top-bar браузера + BottomNav съедают ~30 % высоты.
  - FAB (+) в `BottomNavigation` визуально упирается в иконки «Проекты»/«Профиль», нет безопасной зоны вокруг.
- **Mobile landscape (notch-aware 844×390)**:
  - Sidebar drawer на 280 px перекрывает 33 % экрана; контент за ним обрезается слева.
  - Нет переключения с BottomNavigation на левую/правую edge-nav при `orientation: landscape and (max-height: 480px)`.
- **Карточки треков**: фиксированный `aspect-square` + 5 колонок на desktop-wide делают артворк ~280 px — слишком крупные, тогда как на mobile карточки занимают почти всю ширину.

### 2.3 Дизайн-система и токены

- В `tailwind.config.ts` объявлены `font-display: Inter`, но **distinctive шрифт не подключён** — весь UI на одном Inter, нет визуальной иерархии бренда (см. правило проекта против «generic AI aesthetics»).
- Цветовые токены в light-теме (`--background: 220 20% 98%`) и dark-теме корректные, но **полупрозрачные `--glass-bg: 0 0% 100% / 0.8`** комбинируются с тёмной темой, давая «молочное» пятно на dark mode (видно в hero-карточке home page).
- Дублирующие источники теней: `shadows` локально в `tailwind.config.ts` + `--shadow-glass/--shadow-hover/--shadow-glow` в CSS → разные значения elevation на разных компонентах.
- Z-index слои в Tailwind объявлены семантически (`navigation: 50`, `player: 60`, `dialog: 80`), но в коде используется и числовой `z-50`, `z-[60]`, и token-классы — нарушает «строгую семантику z-index» из core-памяти.
- Скругления: `--radius: 1rem` (16 px), `rounded-2xl: 1.5rem`, `rounded-3xl: 2rem` — три уровня без задокументированного правила, когда какой использовать.

### 2.4 Типографика

- На mobile-portrait заголовки `display-1` (2.5rem) переносятся неудачно — нет `text-balance` и `leading` оптимизации под кириллицу (см. core-память «Russian Typography»).
- Tab-бары (`Все / Вокал / Инстр / Стемы`) используют `text-sm` без `min-h-touch` — на iOS попадание ниже HIG 44×44.
- Подписи «Гостевой режим», «MusicVerse AI Studio» в footer-секциях слишком блёклые: `text-muted-foreground` поверх `--background` даёт контраст ~3.4:1 на dark — ниже WCAG AA для small text.

### 2.5 Доступность

- Иконочные кнопки в Sidebar/Top-bar (колокол с бейджем, «×» закрытия banner) без `aria-label`.
- `role="status"` на скелетонах не озвучен `aria-live="polite"` → скрин-ридер молчит во время загрузки.
- Фокус-кольцо `--focus-ring-color: hsl(207 90% 54%)` практически невидимо на тёмных карточках того же синего акцента.
- Нет `aria-current="page"` на активном пункте Sidebar.

### 2.6 Производительность восприятия

- Skeleton’ы на главной показывают огромные пустые карточки и не отражают будущий layout (нет «pulse» с realistic shape).
- При переходе между маршрутами page-transition `fade 0.15s` + lazy-чанки → ощутимая «вспышка» пустого фона.
- На mobile-xs скелетоны больше чем сама viewport, что усиливает ощущение «лагающего» UI.

### 2.7 Telegram Mini App

- `--tg-content-safe-area-inset-bottom: 60px` fallback применяется всегда, даже в браузере → лишний нижний отступ на не-Telegram desktop.
- На устройствах с Dynamic Island top-bar дублируется: системный Telegram header + наш «Гостевой режим» banner.
- BottomNavigation не использует `max(var(--tg-safe-area-inset-bottom), env(safe-area-inset-bottom))` — иконки кое-где налезают на iOS home-indicator.

---

## 3. План работ

Этапы упорядочены по приоритету: сначала чиним то, что ломает UX сейчас, затем системные улучшения, затем визуальная полировка.

### Этап 1 — Критические фиксы (1 итерация)

1. **C1**: расследовать и починить ErrorBoundary в `/library` на 360 px (вероятно react-virtuoso падает при ширине < `xs`).
2. **C2**: добавить мобильный layout `/pricing` (стек карточек тарифов + sticky CTA).
3. **C3**: убрать дублирование «Гостевой режим» banner на desktop ≥1024 px (показывать только в Telegram-окружении), вынести его выше Sidebar по z-index или встроить в TopBar.
4. **C4**: для drawer-Sidebar на mobile-landscape добавить backdrop + `inset-shadow` и закрывать его по умолчанию при `orientation: landscape`.

### Этап 2 — Адаптивная сетка и навигация

5. Ввести три состояния Sidebar: `full (≥1280)` / `icon-only (1024–1279)` / `drawer (<1024)`. Сохранять выбор в `localStorage`.
6. На tablet-portrait (768–1023) перевести BottomNavigation в верхний tab-bar или icon-rail слева, чтобы освободить вертикальное пространство.
7. На mobile-landscape переключать BottomNavigation на левый edge-rail (60 px) с safe-area paddings.
8. Применить `max-w-screen-2xl mx-auto` + 12-колоночный grid (`grid-cols-2 sm:3 md:4 lg:5 2xl:6`) ко всем listing-страницам (Library, Projects, Community, Playlists).
9. Зафиксировать карточкам трека `min/max` ширину (`min-w-[160px] max-w-[260px]`), чтобы не «расползались» на 1920+.

### Этап 3 — Дизайн-система v2

10. Создать `src/lib/design-tokens.ts` как **единый источник** для shadow/radius/spacing/typography, удалить дубликаты из `tailwind.config.ts` и `index.css`.
11. Зафиксировать правило радиусов: `rounded-sm` (chips/inputs) / `rounded-lg` (cards) / `rounded-2xl` (sheets/dialogs) / `rounded-full` (avatars, FAB). Добавить в `Colors.mdx`/`Typography.mdx` Storybook раздел `Radius.mdx`.
12. Заменить `font-display: Inter` на брендовый шрифт (например, `Space Grotesk` или `Sora`) только для `display-1/2` и `heading-1` — оставить Inter для body. Уточнить выбор у пользователя.
13. Переписать `--glass-bg` так, чтобы alpha-наложение использовало `hsl(var(--card) / 0.6)` вместо белого — корректно работает в обеих темах.
14. Привести все z-index к Tailwind-токенам (`z-navigation`, `z-player`, …); добавить ESLint-правило, запрещающее произвольный `z-[NN]`.

### Этап 4 — Типографика и контент-плотность

15. Внедрить `text-balance` и `hyphens: auto` для всех `h1–h3`, локаль `ru` в `<html lang="ru">`.
16. Поднять `--muted-foreground` в dark mode до `220 10% 65%` (≥4.5:1).
17. Для всех tab-баров и icon-buttons задать `min-h-touch min-w-touch` (44 px) через общий компонент `IconButton`.
18. Унифицировать `SectionHeader` (уже есть memory) и применить ко всем страницам — сейчас на `/community` и `/library` разные стили заголовков.

### Этап 5 — Доступность

19. Прогнать `vitest-axe`/`@axe-core/playwright` на главных страницах и закрыть найденные нарушения.
20. Все icon-only кнопки → `aria-label` обязателен (ESLint правило `jsx-a11y/control-has-associated-label`).
21. На скелетонах поставить `role="status" aria-live="polite" aria-label="Загрузка"`.
22. Сделать focus ring более контрастным: `outline: 2px solid hsl(var(--ring)); outline-offset: 2px; box-shadow: 0 0 0 4px hsl(var(--background))`.
23. Добавить `aria-current="page"` в Sidebar/BottomNav.

### Этап 6 — Telegram Mini App полировка

24. Применять `--tg-content-safe-area-inset-bottom` **только** при `data-tg="true"` на `<html>` (выставлять из `TelegramContext` при init).
25. Скрыть наш banner «Гостевой режим» внутри Telegram, оставив только TG-нативный header.
26. BottomNavigation: `padding-bottom: max(var(--tg-safe-area-inset-bottom), env(safe-area-inset-bottom), 12px)`.
27. Реакция на `orientationchange` — пересчёт `--tg-viewport-stable-height` и пересборка drawer.

### Этап 7 — Микровзаимодействия и восприятие

28. Skeleton’ы переделать на «contour-skeletons» (повторяют форму финального компонента; для карточек — squared artwork + 2 строки).
29. Между маршрутами заменить `fade 0.15s` на `slide-up 0.2s` для secondary-страниц и `crossfade 0.1s` для tab-навигации.
30. Добавить `prefers-reduced-motion: reduce` — отключение всех `pulse-glow / vinyl-spin / shimmer` (уже частично сделано в hint-системе, расширить глобально).
31. Применить `hapticImpact("light")` к ключевым взаимодействиям BottomNav, Sidebar toggle, открытию sheet'ов.

### Этап 8 — Регрессионные гарды

32. Завести Playwright-набор `tests/e2e/layout.responsive.spec.ts` с визуальными снапшотами тех 7 viewport×8 routes, что использованы в аудите.
33. Добавить CI-job `responsive-snapshots` (по аналогии с уже существующим `e2e-hints`) с retry + trace.
34. Завести Storybook story `Pages/Responsive` с iframe-предпросмотром каждого breakpoint’а.

---

## 4. Технические детали (для разработчика)

```text
Файлы, которые будут затронуты в этапах 1–4:

src/components/MainLayout.tsx          — три состояния Sidebar, edge-rail
src/components/Sidebar.tsx             — icon-only режим, aria-current
src/components/BottomNavigation.tsx    — safe-area, edge-rail, haptics
src/components/GuestModeBanner.tsx     — условный рендер в TG
src/pages/Library.tsx                  — фикс крэша на 360px, grid normalization
src/pages/Pricing.tsx                  — мобильный layout
src/index.css                          — tokens cleanup, glass-bg fix
tailwind.config.ts                     — удалить дубль shadow, добавить font-display
src/lib/design-tokens.ts               — единый источник
src/components/ui/skeleton.tsx         — contour-skeletons
playwright.config.ts                   — добавить project "responsive"
tests/e2e/layout.responsive.spec.ts    — новый
.github/workflows/e2e-responsive.yml   — новый CI job
```

Метрики готовности этапа:
- Этап 1: визуальные снапшоты 7 viewport × 8 routes без ErrorBoundary и пустых экранов.
- Этап 2–3: Lighthouse mobile ≥ 92 / a11y ≥ 95, axe — 0 critical.
- Этап 5: WCAG AA по всем text/icon-парам в dark mode (контраст ≥ 4.5 / 3).
- Этап 8: green CI на `e2e-responsive` 3 запуска подряд.

---

## 5. Открытые вопросы для пользователя

1. Стартуем сразу с **Этапа 1 (критические фиксы)** или сначала согласовываем брендовый шрифт и палитру (Этап 3)?
2. Подтвердить выбор distinctive-шрифта для заголовков: `Space Grotesk`, `Sora`, `Unbounded`, или оставить Inter, но добавить кастомный display-weight?
3. На tablet-portrait — какой паттерн навигации предпочтительнее: верхний tab-bar или левый icon-rail?
4. Нужно ли поддерживать ultra-wide (≥1920) полноценно, или достаточно `max-w-screen-2xl` центровки?
