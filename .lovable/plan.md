## План дальнейших работ

Опираясь на уже выполненные итерации (унификация FullscreenPlayer, фикс лирики, рефакторинг главной через HomeSection, исправление "Быстрый старт", регрессионные тесты CompactPlayer/QuickStart), предлагаю продолжить четырьмя приоритетными блоками.

---

### Блок 1. Полноэкранный плеер — финальный редизайн (P0)

Цель: единый визуальный язык, корректные отступы таймлайна и волны, удаление дубликатов.

- Удалить устаревший `ExpandedPlayer.tsx` после миграции preload-логики в `FullscreenPlayer`.
- В `MobileFullscreenPlayer` и `DesktopFullscreenPlayer` выделить общие подкомпоненты:
  - `PlayerArtwork` (обложка + vinyl-spin)
  - `PlayerMeta` (заголовок/исполнитель/badges)
  - `PlayerTimeline` (waveform + scrub + time labels, единые отступы `px-4 md:px-6`, `gap-2`)
  - `PlayerTransport` (prev/play/next + shuffle/repeat, touch target 44px)
  - `PlayerSecondaryActions` (like, queue, share, lyrics)
- Выровнять waveform высоту: mobile 56px, desktop 80px; убрать двойные паддинги между waveform и таймкодами.
- Привести KaraokeView к токенам (без `bg-black`), вынести строки лирики в `LyricsLine` с единой логикой подсветки.

### Блок 2. Главная страница — навигация и компоновка (P1)

- Переупорядочить секции в едином `sections` reg-е: Hero → QuickStart → Continue → Featured → New → Popular → AutoPlaylists → Community.
- Удалить дубликаты каруселей и `StatsHighlight` (оставить один экземпляр над Featured).
- Добавить sticky-навигацию по якорям секций для desktop (`md+`), на мобильных — горизонтальный chip-scroller под Hero.
- Привести все секции к единым отступам через `HomeSection` (`mb-3 md:mb-6`, заголовок + действие справа).
- Проверить, что `paddingBottom` MainLayout не «прыгает» при появлении CompactPlayer (плавный transition `200ms`).

### Блок 3. Sidebar / BottomNav / CompactPlayer (P1)

- Вынести высоту плеера в CSS-переменную `--player-h`, использовать её и в `MainLayout`, и в `BottomNav`.
- BottomNav: добавить активный индикатор, haptic на tap, корректный z-index слой (по memory: `z-nav`).
- Sidebar (desktop): collapsible с persist в localStorage, иконки из `@/lib/icons`.

### Блок 4. Регрессионные тесты (P2)

- `tests/e2e/player.fullscreen.layout.spec.ts` — таймлайн/волна не перекрывают transport на 390/768/1440, портрет/ландшафт.
- `tests/e2e/home.navigation.spec.ts` — порядок секций, отсутствие дублирующихся каруселей, sticky-навигация работает.
- `tests/e2e/layout.player-offset.spec.ts` — BottomNav и CompactPlayer не перекрывают последнюю секцию при скролле.

---

### Технические детали

- Все новые подкомпоненты плеера — в `src/components/player/parts/`.
- Состояние плеера — только через `usePlayerStore` / `useGlobalAudioPlayer`, новых `<audio>` не создаём.
- Стили — токены `src/lib/design-tokens.ts` + `glass.ts`, без hardcoded цветов.
- Иконки — `@/lib/icons`, motion — `@/lib/motion`.
- Логирование — `logger.*`, без console.

### Порядок выполнения

1. Блок 1 (плеер) — наиболее заметная регрессия для пользователя.
2. Блок 2 (главная) — улучшает первое впечатление.
3. Блок 3 (навигация) — закрывает overlap-проблемы окончательно.
4. Блок 4 (тесты) — фиксирует достигнутое.

Каждый блок — отдельный PR-подобный заход с проверкой `npm run lint` и соответствующих e2e.
