# План доработки интерфейса MusicVerse AI

6 спринтов по ~2-3 дня. Каждый спринт = изолированный набор задач с критерием приёмки. Между спринтами обязательная визуальная проверка на мобильном (Telegram WebApp, 375–424px).

---

## Спринт 1 — Фундамент: токены, z-index, layout-санитайзер

**Цель:** убрать перегруз и наложения на главной, починить невидимые диалоги.

### Задачи
1. **Z-index аудит.** Пройти по `src/constants/z-index.ts` и всем `z-[N]` / `zIndex:` в `src/components/**`. Свести к 9 семантическим слоям (`content/raised/sticky/nav/player/dialog/sheet/dropdown/toast`). Заменить ручные значения на токены. Особое внимание: `Dialog`, `Sheet`, `Drawer`, `DropdownMenu`, `Tooltip`, `Toast`, `CompactPlayer`, `BottomNavigation`, `IslandDock`.
2. **Spacing/typography токены.** В `tailwind.config.ts` добавить mobile-first шкалу: `space-screen-x` (16px), `space-card` (12px), `space-section-y` (20/24/32 по breakpoint). Текст: `text-display/title/body/caption/micro`. Дальше — только токены.
3. **Главная страница (`src/pages/Index.tsx` + секции `Featured/New/Popular/AutoPlaylists`):**
   - убрать дублирующиеся header'ы и hero-блоки;
   - единая вертикальная ритмика `space-section-y`;
   - горизонтальные паддинги через `px-screen-x`;
   - safe-area сверху/снизу через уже существующие `pt-safe-top` / `pb-dock-safe`.
4. **Layout-санитайзер.** ESLint-правило (расширить уже добавленное в S1.3): запрет `z-[N]`, `p[xytrbl]-[Npx]`, `text-[Npx]`, `gap-[Npx]` в `src/components/**` и `src/pages/**`.

**Приёмка:** на 375/390/424px нет горизонтального скролла, диалоги/sheet'ы поверх плеера, отступы симметричны, lint чист.

---

## Спринт 2 — UnifiedTrackCard: фиксированная высота, теги, заголовок

**Файлы:** `src/components/track/track-card-new/**`, `src/components/shared/UnifiedTrackCard.tsx`.

### Задачи
1. **Фиксированные высоты по варианту:** `grid: 240px`, `list: 72px`, `compact: 56px`, `minimal: 48px`. Контейнер `aspect-square` для обложки, остальное — `flex-col justify-between` с `min-h-0`.
2. **Парсинг тегов.** Утилита `parseTags(raw: string|string[]): string[]`:
   - split по `,`, `;`, `/`, `|`, переводам строки;
   - trim, lowercase-normalize дубликатов, фильтр пустых, лимит длины 24 символа.
   - покрыть unit-тестами (`src/lib/__tests__/parseTags.test.ts`).
3. **Отображение тегов.** Компонент `TagChipRow`:
   - одна строка, `overflow-hidden`, измеряем ширину через `ResizeObserver`;
   - показываем N тегов + `+K` чип;
   - `+K` открывает `Popover` с полным списком.
4. **Title/subtitle overflow.** 
   - `title`: 1 строка, `truncate` + tooltip на long-press/hover; для grid допускается 2 строки через `line-clamp-2` с фиксированной высотой блока (`h-10`).
   - `artist`: всегда 1 строка `truncate`.
   - Тени/градиент-fade на правом крае не использовать (создаёт асимметрию) — только truncate с многоточием.

**Приёмка:** сетка карточек идеально выровнена по baseline, высоты идентичны независимо от тегов/длины названия.

---

## Спринт 3 — Аудит маршрутов и фикс 404 на треках

**Проблема из console-logs:** `/track/{id}` → 404.

### Задачи
1. **Аудит роутера** `src/App.tsx`: добавить/проверить `/track/:trackId`, `/player/:trackId` синонимы; единый редирект `track → player`.
2. **Аудит ссылок:** `rg "to=\"/track"` и `navigate("/track`. Привести к единому helper `routes.track(id)` в `src/lib/routes.ts`.
3. **Сохранение результата генерации.** Аудит цепочки: `suno-music-generate` edge → callback → запись в `tracks` (`audio_url`, `cover_url`, `active_version_id`). Проверить:
   - что `tracks.id` возвращается клиенту и используется в навигации (не `task_id`);
   - что `track_versions.is_primary` ставится атомарно;
   - что polling в `useGenerationStatus` навигирует на валидный id.
4. **Guard-страница** `TrackNotFound`: если `useQuery` вернул `null`, показывать понятный экран с кнопкой "В библиотеку" + лог `logger.warn('track_missing', {id, source})`.

**Приёмка:** клик по любой карточке открывает плеер/страницу трека, метрика `track_missing` падает до 0 на тестовом прогоне.

---

## Спринт 4 — Плеер: компактный и фуллскрин

**Файлы:** `src/components/player/CompactPlayer.tsx`, `FullscreenPlayer.tsx`, `MobileFullscreenPlayer.tsx`, `ResizablePlayer.tsx`.

### Задачи
1. **CompactPlayer редизайн (mobile-first):**
   - Сетка: `[cover 40px][title+artist flex-1][prev|play|next]`;
   - кнопки 44×44, иконки 20px, gap 8px;
   - прогресс — `h-1` под нижней границей, ширина = ширине бара (a не контента);
   - убрать мигание: один источник `currentTime` из `useAudioTime` + `useDeferredValue`, без локальных setState на каждом `timeupdate` (throttle 100мс через `rAF`).
2. **Waveform/Timeline синхронизация:**
   - вынести в `WaveformTimeline` компонент с единым ref-контейнером;
   - canvas waveform + overlay таймлайн рендерятся в один `<div ref>` с `width: 100%`;
   - на ресайз — `ResizeObserver` пересчитывает шкалу;
   - убрать дубль-рендер waveform (сейчас два инстанса конкурируют).
3. **Fullscreen аудит кнопок:**
   - перечислить все экшены: play/pause, prev/next, seek ±15, shuffle, repeat, like, version A/B, queue, share, more, close;
   - проверить hookup каждой к `usePlayerStore`/мутациям; отсутствующие реализовать или скрыть;
   - расположение по группам: верх (close/more), центр (cover+waveform+meta), низ (transport+secondary actions);
   - safe-area сверху/снизу.
4. **Like ошибка** (`Error toggling like {errorMessage:"[object Object]"}`): починить сериализацию ошибки в `useLikes`, корректный `toAppError`, тост с человекочитаемым текстом.
5. **Haptic guard:** обернуть `WebApp.HapticFeedback.impactOccurred` в проверку `isVersionAtLeast('6.1')` — убрать warn-спам.

**Приёмка:** waveform не моргает, прогресс совпадает с временем, все кнопки фуллскрина работают, like без ошибок.

---

## Спринт 5 — Метаданные генерации, фильтры по жанрам, версии, лайки

### Задачи
1. **Сохранение параметров генерации.** В `generation_tasks` и `tracks` гарантировать поля: `prompt`, `style_tags[]`, `mood`, `genre`, `model`, `negative_tags`, `seed`. Добавить миграцию для отсутствующих колонок + бэкфилл из `metadata jsonb`.
2. **Продвинутый промптинг.** В `useGenerateForm`:
   - шаблоны (`constants/quickCreatePresets.ts`) + комбинатор `style + mood + instrument`;
   - предпросмотр итогового prompt;
   - сохранение последних 10 в `localStorage` (есть `useGenerateDraft`).
3. **Каталог по жанру/стилю/эмоции.** Страница `/discover`:
   - чипы жанров/эмоций сверху (из агрегата `tag_statistics`);
   - сетка `UnifiedTrackCard variant="grid"` с фильтрацией через `useTracks({tags, mood})`.
4. **Like + Version Switch:**
   - оптимистичные апдейты уже есть (memory) — проверить, что счётчик и иконка синхронизированы;
   - `UnifiedVersionSelector` доступен из карточки и из плеера, источник истины — `useActiveVersion`.

**Приёмка:** генерация сохраняет всё, что выбрал пользователь; discover-фильтры работают; лайк/версия не «прыгают».

---

## Спринт 6 — Логирование, аналитика, перф, анимации

### Задачи
1. **Логирование:** аудит всех `console.*` (см. memory rule), замена на `logger`. Edge-функции — `_shared/logger.ts`. Sentry breadcrumbs для: `track_play`, `generation_start/success/fail`, `like_toggle`, `version_switch`, `player_open_fullscreen`.
2. **Аналитика:** `user_analytics_events` — единый `trackEvent(name, props)` хелпер в `src/lib/analytics.ts`. События: `page_view`, `track_click`, `track_play`, `generation_submit`, `tag_filter`, `share`.
3. **Метрики ошибок:** в `error_logs` писать классифицированные ошибки (`network/api/validation/audio`). Дашборд через `supabase.read_query` (адмика — отдельная страница `/admin/errors`).
4. **Производительность:**
   - проверить лимит бандла `npm run size` (950KB);
   - `react-virtuoso` на discover/library;
   - анимации только `transform/opacity`, `will-change` точечно;
   - `prefers-reduced-motion` — отключает декоративные анимации (уже учтено для swipe);
   - префетч waveform через `audio-sw.js`.
5. **Микро-анимации:** entrance карточек (`stagger`, 60мс), press-feedback (scale .98 + haptic light), переходы между compact↔fullscreen (`layoutId` framer).

**Приёмка:** все события видны в `user_analytics_events`, `npm run size` зелёный, на mid-range Android 60fps в Performance-вкладке.

---

## Технические заметки

- **Не трогать:** `src/integrations/supabase/client.ts`, `types.ts`, `supabase/config.toml`.
- **Стек правил:** mobile-first токены, `logger.*` вместо console, `secure_credit_update` для кредитов, `safe_public_profiles` для публичных профилей, `getGlobalNavigate()` вне Router.
- **Порядок реализации:** S1 (фундамент) → S2 (карточки) → S3 (роуты, разблокирует UX) → S4 (плеер) → S5 (данные) → S6 (полировка).
- **Проверка после каждого спринта:** Playwright snapshot на 375/424/768, lint, `tsgo --noEmit`, ручной прогон в Telegram WebApp.

---

**Готов начать со Спринта 1.** Подтверди порядок или укажи приоритет — могу стартовать сразу с критичного (S3 — 404 на треках + S4 — плеер).