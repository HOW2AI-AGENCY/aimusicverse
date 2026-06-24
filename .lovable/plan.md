## Цель

Редизайн нижней «мини-панели» плеера (`CompactPlayer`) так, чтобы она:

- одинаково корректно жила на mobile portrait, mobile landscape, tablet и desktop;
- всегда имела доступную кнопку закрытия (×);
- по клику на тело/обложку/название разворачивалась во весь экран;
- содержала полный набор управляющих кнопок там, где есть место;
- имела выверенные отступы и размер визуализатора волны.

Fullscreen-плееры (`MobileFullscreenPlayer`, `DesktopFullscreenPlayer`) и логика смены режимов в `ResizablePlayer` не трогаются — там кнопка закрытия уже есть и работает корректно.

## Что меняется

### 1. `src/components/player/CompactPlayer.tsx` — адаптивная компоновка

Делаем один компонент с тремя вариантами layout, выбираемыми по media-query (`useMediaQuery`):

- **mobile (<640px)** — текущая 2-рядная сетка:
  - Row 1: тонкая waveform-полоса (24–28px) + chevron-up;
  - Row 2: обложка 48×48 → название/стиль → play (44×44) → next (40×40) → **новая × кнопка 36×36**;
  - Tap по обложке/тексту/волне → expand. × не разворачивает, а вызывает `closePlayer()`.
- **mobile landscape / tablet (≥640px, <1024px)** — однорядная компоновка:
  - обложка 44×44 → название/стиль → waveform (растёт во flex-1, высота 22px) → play/next → ×.
- **desktop (≥1024px)** — расширенный dock:
  - max-width растёт до `max-w-5xl`;
  - порядок: обложка 56×56 → title/style → **prev (40×40)** → play (48×48) → next (40×40) → текущее время / общая длительность (tabular-nums) → waveform во flex-1 (высота 32px) → like → volume (popover-слайдер) → expand-chevron → ×;
  - hover state добавляет ring/тень, без скейла.

Контракт сохраняется: первый `onExpand()` сценарий — клик/тап по любой нефункциональной зоне (обложка, текст, waveform-зона). × — единственный элемент, который вызывает `closePlayer` из `usePlayerStore`. Свайпы (вверх=expand, влево=next, вправо=−10с) остаются.

### 2. Кнопка закрытия

- Подключаем `closePlayer` из `usePlayerStore` (уже экспортируется).
- Кнопка `<Button variant="ghost" size="icon" aria-label="Закрыть плеер">` с иконкой `X`, `min-h-touch min-w-touch` (44×44 hit-area через padding) — соответствует Touch Target Standards.
- `e.stopPropagation()` чтобы клик по × не триггерил expand-обработчики обёртки.
- Лёгкий `hapticImpact('light')`.

### 3. Корректный bottom-offset

Сейчас зашит `5rem` под BottomNavigation. Меняем на динамику:

- В portrait mobile / mobile с BottomNav остаётся `calc(5rem + safe-area)`.
- На desktop (sidebar) и в mobile-landscape (edge-rail, без BottomNav) — `calc(1rem + safe-area)`, чтобы плеер не висел в воздухе. Берём то же media-query, что и в `MainLayout` (`min-width: 1024px`) + флаг для landscape rail.
- Применяем горизонтальные safe-area-inset на левом отступе, когда есть edge-rail, чтобы dock не уезжал под рейл.

### 4. Размер и отступы визуализации

`WaveformProgressBar` уже умеет `mode="minimal"`. Подбираем высоту через враппер:

- mobile portrait — 24px (тач-зона 44px за счёт padding);
- tablet/landscape — 22px;
- desktop — 32px, с показом `currentTime / duration` слева/справа.

Уменьшаем вертикальные отступы карточки на desktop (`py-2.5`) — сейчас на desktop карточка визуально «толстая».

### 5. Доступность и интеракции

- На карточке `role="region" aria-label="Музыкальный плеер"` уже есть — оставляем.
- × получает `aria-label="Закрыть плеер"`, expand-зоны `aria-label="Развернуть плеер"`.
- `keydown Enter/Space` на expand-зонах (сейчас только `role=button tabIndex=0` без обработчика клавы) — добавляем единый обработчик.
- Фокус-кольцо через `focus-visible:ring-2 ring-primary/40`.

### 6. Регресс-тесты (Playwright)

Добавляем `tests/e2e/player.compact.spec.ts`:

1. На 390×844 (mobile portrait) — × кнопка видна, клик закрывает плеер; клик по обложке открывает fullscreen.
2. На 844×390 (mobile landscape) — × видна, dock не уезжает под edge-rail (`x ≥ 56px`).
3. На 1440×900 (desktop) — видны prev/play/next/like/volume/×, max-width ≤ `1024px`, нет horizontal overflow.

Используем уже существующий бутстрап теста и data-testid: добавим `data-testid="compact-player"`, `compact-player-close`, `compact-player-expand`.

## Технические детали

- Хук определения варианта:
  ```ts
  const isMobile = useMediaQuery('(max-width: 639px)');
  const isMidRange = useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
  const variant = isMobile ? 'mobile' : isMidRange ? 'mid' : 'desktop';
  ```
- Bottom-offset:
  ```ts
  const bottomBase = variant === 'desktop' ? '1rem' : '5rem';
  style={{ bottom: `calc(${bottomBase} + max(var(--tg-safe-area-inset-bottom,0px), env(safe-area-inset-bottom,0px), 0.5rem))` }}
  ```
- Volume — переиспользуем `VolumeControl` из `src/components/player/VolumeControl.tsx` внутри `Popover` (shadcn) на desktop.
- Like — `toggleLike` из `useTracks` (как в `ExpandedPlayer`).
- Никаких изменений в Zustand-сторах, edge-функциях, БД.

## Что НЕ делается

- Fullscreen-плееры (`MobileFullscreenPlayer`, `DesktopFullscreenPlayer`) — без изменений.
- Логика версий A/B, очереди, текстов — без изменений.
- Глобальные дизайн-токены не трогаем (выровнено в предыдущем этапе).
