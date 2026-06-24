# План редизайна — статус

## Завершено (2026-06-24)

### Блок 1. Полноэкранный плеер
- Удалён `src/components/player/ExpandedPlayer.tsx` и `LazyExpandedPlayer`.
- Единая точка входа — `FullscreenPlayer.tsx`, dispatch по viewport, лирика через `useMasterVersion`.
- `data-testid` проставлены: `mobile-fullscreen-player`, `desktop-fullscreen-player`,
  `player-timeline`, `player-transport`.
- `KaraokeView` переведён на токены, кнопка закрытия 44×44.
- Preload-карта обновлена: `LazyFullscreenPlayer` вместо `LazyExpandedPlayer`.

### Блок 2. Главная страница
- Все секции `Index.tsx` рендерятся через `HomeSection` с `sectionId`
  (`hero`, `quick-create`, `quick-start`, `featured`, `popular`, `new`, …).
- `StatsHighlightBanner` помечен `data-testid="stats-highlight"` (контроль дубликатов).
- Порядок секций единый для mobile/desktop, без JSX-дублирования.

### Блок 3. Sidebar / BottomNav / CompactPlayer
- В `MainLayout` публикуются CSS-переменные `--nav-h` и `--player-h`,
  значения зависят от viewport и наличия активного трека.
- `paddingBottom` секций можно выражать через `var(--player-h)` без повторения math.
- Sidebar collapse-state уже persist'ится в `localStorage`.

### Блок 4. Регрессионные тесты
- `tests/e2e/player.compact.fullscreen.spec.ts` — fullscreen + ресайз 390/820/1440.
- `tests/e2e/player.fullscreen.layout.spec.ts` — таймлайн vs transport, портрет/ландшафт.
- `tests/e2e/home.navigation.spec.ts` — порядок секций, отсутствие дубликатов.
- `tests/e2e/layout.player-offset.spec.ts` — BottomNav + плеер не перекрывают контент.
- `tests/e2e/home.quickstart.responsive.spec.ts` — «Быстрый старт» 360–640px.

## Дальнейшие необязательные улучшения

- Выделить `PlayerArtwork / PlayerMeta / PlayerTimeline / PlayerTransport`
  в `src/components/player/parts/` (сейчас layout уже разделён на mobile/desktop,
  дальнейшая декомпозиция — оптимизация, не функциональная задача).
- Sticky chip-навигация по `sectionId` для desktop ≥ `xl`.
- Прогрессивный refactor `MobileFullscreenPlayer` (1033 строки) в композицию
  меньших файлов — отдельным спринтом во избежание регрессий.

## Документация
- Обновлён `docs/PLAYER_ARCHITECTURE.md` (раздел про unified surface и CSS-vars).
- README не требовал правок (раздел плеера ссылается на `docs/PLAYER_ARCHITECTURE.md`).
