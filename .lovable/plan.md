# План: фикс перекрытия секций BottomNav/плеером + e2e «Быстрый старт»

## Цели
1. На мобильных и планшетах (≤1023px portrait) BottomNavigation и фиксированный CompactPlayer не перекрывают секции главной при ресайзе и скролле.
2. Блок «Быстрый старт» в `CreativePresetsSection` и переключатель `Тексты/Треки/Проекты` всегда корректно укладываются в 2 строки на 360–640px без обрезки.

## Аудит проблем

**MainLayout.tsx** уже выставляет `--nav-h`/`--player-h` и paddingBottom в `<main>`, но:
- `paddingBottom` использует жёстко зашитые `5rem`/`9.5rem` вместо тех же CSS-переменных `--nav-h`/`--player-h`, поэтому при пересчёте высот (например, переход в landscape, появление трека) реальная высота BottomNav (используется `safe-bottom`, может быть >64px) расходится с padding'ом → секции снизу перекрываются.
- На tablet portrait (768–1023px) логика `!isDesktop && !isMobileLandscape` справедлива, но padding одинаковый с мобильным — ок, но `--nav-h=64` не учитывает safe-area-inset-bottom внутри самого BottomNavigation.

**CreativePresetsSection.tsx**:
- На узких ширинах (360–420px) tab-кнопки имеют `gap-1.5` + иконка + `truncate label`, при которых русское «Проекты» обрезается до «Прое…». Нужно: использовать `shortLabel` на ≤sm, скрывать иконку при <380px, либо разрешать перенос.
- Заголовок и описание ("Выберите шаблон для создания") в одной flex-колонке с `truncate` — обрезается. Должны оставаться в 2 видимые строки (заголовок + подпись), без `truncate` на подписи (использовать `line-clamp-1` только при крайней нужде или убрать).
- Структура «два ряда»: ряд 1 = заголовок «Быстрый старт» + подпись; ряд 2 = переключатель табов. Уже `flex-col sm:flex-row`, ок. Нужно гарантировать видимость обоих рядов и неотсечение табов.

## Изменения

### 1. `src/components/MainLayout.tsx`
- Заменить hardcoded paddingBottom на `calc(var(--nav-h, 0px) + var(--player-h, 0px) + max(env(safe-area-inset-bottom,0px), var(--tg-safe-area-inset-bottom,0px)) + 0.75rem)`.
- В блоке `useEffect` добавлять к `--nav-h` запас 16px (визуальный отступ) и не сбрасывать на 0 при наличии `hasOwnBottomNav` — учесть его.

### 2. `src/components/home/CreativePresetsSection.tsx`
- Подпись «Выберите шаблон…»: убрать `truncate`, оставить `line-clamp-2`, не схлопывать высоту.
- Табы: 
  - `px-1.5` на мобиле, `gap-1` базово.
  - Использовать `shortLabel` на <sm: `<span className="sm:hidden">{tab.shortLabel}</span><span className="hidden sm:inline">{tab.label}</span>`.
  - Иконку скрывать на <xs (`hidden xs:inline-flex`), чтобы освободить место для русского текста.
  - Убрать `truncate` со span текста; вместо этого `whitespace-nowrap` + min-w-0 контейнер — буквы не режутся, табы делят ширину поровну (`flex-1`).
- Гарантировать `flex-wrap`/двухрядность всего блока на <sm уже за счёт `flex-col`.

### 3. Новый e2e тест `tests/e2e/home.quickstart.responsive.spec.ts`
Прогон на ширинах 360, 390, 414, 480, 540, 640 (height=844):
- Перейти на `/`.
- Проверить наличие «Быстрый старт» (текст), его `clientHeight > 0` и что текст полностью видим (boundingBox.width >= scrollWidth).
- Для каждого таба «Тексты»/«Треки»/«Проекты»: bounding box виден внутри viewport, текст не обрезан (`scrollWidth <= clientWidth + 1` или содержит ожидаемую подпись `Текст|Треки|Проект`).
- Проверить, что блок занимает ровно 2 ряда: y координат заголовка и tablist различаются (>= высота заголовка), и нет третьего ряда (tablist в одном ряду).

### 4. Новый e2e `tests/e2e/layout.bottomnav-overlap.spec.ts`
- На 390×844 и 768×1024 (portrait): открыть `/`, проскроллить в самый низ, проверить что последняя секция home (футер контента) полностью видна над `[data-testid="bottom-navigation"]` (или селектор `nav[aria-label*="навигация"]`) — `section.bottom <= nav.top + 1`.
- Повторить с активным треком (программно установить через `localStorage` `playerStore` или вызвать play на первом треке): убедиться, что секция не перекрыта CompactPlayer'ом.

## Технические детали
- Тесты Playwright, использовать существующий конфиг `playwright.config.ts`.
- Селекторы: `getByRole('tablist', { name: 'Категории шаблонов' })`, `getByRole('tab', { name: 'Тексты'|'Треки'|'Проекты' })`, `getByText('Быстрый старт')`.
- Проверка обрезки: сравнивать `el.scrollWidth` vs `el.clientWidth` через `evaluate`.

## Файлы
- edit `src/components/MainLayout.tsx`
- edit `src/components/home/CreativePresetsSection.tsx`
- create `tests/e2e/home.quickstart.responsive.spec.ts`
- create `tests/e2e/layout.bottomnav-overlap.spec.ts`
