
## Аудит текущего состояния

**Что уже сделано** (Sprint 038–039, последние коммиты):
- Fullscreen-плеер разбит на Cover/Lyrics/Details через `FullscreenPager`.
- `PlayerTransitionProvider` поднят в `MainLayout`, добавлен ErrorBoundary вокруг плеера, cleanup режима на `/track/:id`.
- Waveform: убран центрирующий `startX`, бегунок переведён с framer на CSS-transition.
- Клик по карточке трека воспроизводит через глобальный компактный плеер, а не открывает `/track/:id`.
- Sprint 039 закрыт: 0 layer-violations в `src/{components,stores}`, tsc зелёный.
- Лирика: fade-маска, tap-to-seek с flash, sync через `useLyricsSynchronization`.

**Что подтверждено проблемным сейчас** (по жалобам + беглому осмотру):
- В `useGenerateForm`/toast-цепочке несколько мест выдают `toast.success` на одни и те же события.
- Стриминг (`stream_audio_url` от Suno) не подключён в UI — юзер ждёт полной генерации.
- `GenerationResultSheet` рендерит одну версию; вторая (`clip_index=1`) появляется позже, но UI её не подтягивает.
- Waveform и `PlayerProgress` считают ширину независимо → микрорассинхрон на ресайзе.
- Fullscreen открывается через анимацию, которая на первом кадре ставит `audio.pause()` из-за перерендера cover → зависание.
- Автоскролл лирики есть, но триггерится по `activeLineIndex` без плавной прокрутки в некоторых состояниях.

---

## План работ (Sprint 040 — Generation & Player UX)

### Блок A. Генерация: скорость и уведомления

1. **A1. Подключить стриминг первого клипа**
   - В `useActiveGenerations` / callback'e из Edge Function пробрасывать `stream_audio_url`, как только Suno его отдаёт (обычно через ~15–20 с вместо ~2 мин).
   - Автоматически стартовать превью в компактном плеере при появлении `stream_audio_url` (с бейджем «Стриминг»).
   - После получения финального `audio_url` — бесшовно переключать источник (сохранять currentTime).

2. **A2. Показать обе версии (A/B)**
   - `GenerationResultSheet` + `useTrackVersionsList`: подписаться на realtime `track_versions` для активного `trackId`, отрисовывать placeholder-скелет для второй версии, заполнять при вставке.
   - Убедиться, что `is_primary` для A выставлен сразу, B появляется в списке без ручного refetch.

3. **A3. Убрать дубли уведомлений**
   - Ревизия toast'ов: оставить один «В работе → В библиотеке готово», остальное убрать.
   - Удалить `toast.success` из промежуточных шагов `useGenerateForm`, `useAudioProcessing`, `useActiveGenerations`.
   - Единая точка нотификации через `notificationsService` (уже есть) с dedupe по `taskId`.

4. **A4. Стабилизировать «плашку генерации»**
   - `GenerationLoadingState` / `QueuePosition`: фиксированная min-height, `contain: layout size`, без анимации высоты. Прогресс через `transform: scaleX` вместо изменения width.
   - Убрать `AnimatePresence` вокруг статуса, оставить кросс-фейд текста.

### Блок B. Плеер и waveform

5. **B1. Единый источник ширины timeline**
   - Вынести измерение в общий hook `useTimelineGeometry(ref)` c `ResizeObserver`.
   - `WaveformCanvas` и `PlayerProgress` должны использовать один и тот же bounding rect и один `progress` (0..1). Убрать локальные вычисления pixel-позиции.
   - Ресемплировать waveform-bars в `requestAnimationFrame` только при изменении ширины, не на каждый tick времени.

6. **B2. Фикс зависания при открытии fullscreen**
   - Причина: при монтировании `FullscreenPlayer` `CoverPage` перезапрашивает `<audio>` через провайдер transition → двойной pause.
   - Решение: `PlayerTransitionProvider` не должен трогать `audioRef` при переходе compact↔fullscreen; переход чисто визуальный (shared layout).
   - Добавить e2e-тест `player.fullscreen-play-continues.spec.ts`.

7. **B3. Waveform без мигания**
   - Кэшировать сгенерированные пики в IndexedDB по `versionId` (использовать существующий `waveformCache`).
   - При смене трека держать предыдущий canvas, пока новый не готов (без flash-to-empty).

### Блок C. Лирика

8. **C1. Плавный автоскролл активной строки**
   - В `LyricsPage`: `scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' })` по изменению `activeLineIndex`.
   - Дебаунс 80 мс, отменяемый на пользовательский scroll (флаг `userScrolling` на 3 с).
   - При возврате в центр — кнопка «↓ К текущей строке».

### Блок D. Мобильная форма генерации

9. **D1. Radio-переключатель Вокал/Инструментал**
   - Заменить текущий toggle на `RadioGroup` (shadcn), два сегмента в одну строку, 44 px min-height, единые токены.
   - Иконки `Mic` / `Music2`, подпись под сегментом, активный сегмент — акцентный fill.

10. **D2. Компактная разметка формы (mobile)**
    - Собрать все поля в один вертикальный стек с 12 px gap, secondary-настройки в `<details>`/`Accordion`.
    - Sticky-кнопка «Сгенерировать» внизу с safe-area, без дублирующего header.
    - Убрать вложенные карточки — один плоский лист.

---

## Технические детали

- **Файлы (основные):**
  - Генерация: `src/hooks/generation/useGenerateForm.ts`, `useActiveGenerations.ts`, `useAudioProcessing.ts`, `components/generate-form/GenerationLoadingState.tsx`, `GenerationResultSheet.tsx`, `QueuePosition.tsx`.
  - Плеер: `PlayerTransitionProvider.tsx`, `MobileFullscreenPlayer.tsx`, `pages/CoverPage.tsx`, `WaveformCanvas.tsx`, `PlayerProgress.tsx`, `WaveformProgressBar.tsx`.
  - Лирика: `pages/LyricsPage.tsx`, `hooks/lyrics/useLyricsSynchronization.ts`.
  - Форма: `GenerateFormSimple.tsx`, `GenerateFormCustom.tsx`, `FormSection.tsx`.
- **Backend:** проверить, что edge-функция `suno-music-generate` возвращает `stream_audio_url` в первом callback'e и пишет его в `track_versions.stream_audio_url` (добавить колонку миграцией, если отсутствует).
- **Тесты:** добавить e2e — стриминг стартует <30 с, обе версии в sheet, fullscreen не ставит паузу, автоскролл лирики.

---

## Порядок выполнения

1. **Сначала (быстрые победы, без миграций):** A3, A4, B2, C1, D1, D2.
2. **Затем (требует backend/миграции):** A1, A2, B1, B3.

Хотите — стартую с блока «быстрых побед» (A3+A4+B2+C1+D1+D2) прямо сейчас, это ~6 файлов и заметный визуальный эффект без риска для backend.
