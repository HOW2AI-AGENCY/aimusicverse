# План: UX, плеер, синхронизированная лирика и панель деталей трека

Цель — довести ключевой пользовательский путь (открыл приложение → нашёл/создал трек → слушает в плеере с лирикой → изучает детали → делится) до уровня минималистичного, аккуратного и симметричного интерфейса. Без новой бизнес-логики — только UX, презентация и доводка существующего функционала.

---

## 1. Аудит пользовательских путей (User Journeys)

Закрепляем 4 канонических сценария и фиксим разрывы:

1. **Первый запуск** → Home → Quick Create → Generation → Result Sheet → Player
2. **Возвращение** → Home (с черновиком) → Library → Player → Lyrics → Details
3. **Глубокая ссылка** → `/player/:id` → Fullscreen Player → Share
4. **Студийный путь** → Library → "Edit in Studio" → Studio V2 → обратно в Player

Действия:
- Карта переходов и точек «трения» (лишние клики, перегруженные экраны)
- Унификация заголовков и back-кнопок через `UnifiedPageHeader` / `MobileHeaderBar`
- Единый шаблон пустых состояний (skeleton + CTA), единые toast'ы
- Сквозной prefetch: при наведении/тапе на трек — предзагрузка обложки и аудио

---

## 2. Редизайн плеера (главный фокус)

Сейчас `MobileFullscreenPlayer.tsx` — 862 строки, перегружен (визуализатор, караоке, очередь, жесты, версии). Разбираем на **3 чистых режима** с единым визуальным языком.

### 2.1 Компактный плеер (CompactPlayer)
- Высота 64px, симметричные паддинги 12px
- Сетка: `[48 cover] [1fr meta] [40 play] [40 menu]`
- Тонкий прогресс-бар сверху (2px, без отступов)
- Тап по обложке/мете → expand; кнопки изолированы

### 2.2 Fullscreen Player (мобайл)
Новая компоновка, 3 «страницы» по горизонтальному свайпу:

```text
[ Cover ]  ⇄  [ Lyrics ]  ⇄  [ Details ]
```

Общий каркас (вертикально, симметрия 16px по бокам):
```text
┌────────────────────────────┐
│ 44  · · ·  44   (header)   │  close / page-dots / queue
├────────────────────────────┤
│                            │
│        активная страница   │  1fr, swipeable
│                            │
├────────────────────────────┤
│   PlayerProgress (unified) │  timeline + waveform, 48px
├────────────────────────────┤
│   ◁◁   ▷    ⏯    ▷   ▷▷   │  transport 72px
├────────────────────────────┤
│   ♡   ⤴   💬   ⋯           │  actions 56px
└────────────────────────────┘
```

- Удаляем визуализатор по умолчанию, оставляем как опцию в «⋯»
- Жесты: вниз = закрыть, горизонталь = смена страницы (не трека); смена трека только кнопками/из очереди
- Все элементы фиксированных размеров → нет «прыжков»

### 2.3 Технический разбор файла
- `MobileFullscreenPlayer.tsx` → 3 файла:
  - `FullscreenShell.tsx` (каркас, жесты, header/footer)
  - `FullscreenPages.tsx` (Cover / Lyrics / Details — lazy)
  - `useFullscreenGestures.ts`
- Сохраняем `PlayerProgress`, `UnifiedPlayerControls`, `PlayerActionsBar`

---

## 3. Синхронизированная лирика с подсветкой

Использует `useTimestampedLyrics` + `useLyricsSynchronization` + `SynchronizedWord` — функционал есть, нужен UX-полишинг.

### 3.1 Визуал
- **Auto-scroll**: активная строка фиксируется в центре (40% сверху на мобайле)
- **Подсветка слов**: текущее слово — `text-foreground`, прошедшие — `text-foreground/40`, будущие — `text-foreground/70`
- **Активная строка**: лёгкий scale 1.02 + увеличенный вес шрифта, без рамок/фонов
- Шрифт: 20px / line-height 1.5, центр; на десктопе 28px
- Отступы между строками 12px, между секциями ([Verse], [Chorus]) — 24px и тонкий лейбл секции `text-muted-foreground/60 text-xs uppercase tracking-wider`

### 3.2 Взаимодействие
- Тап по строке → seek на её timestamp + haptic
- Long-press по строке → меню (скопировать, поделиться куплетом)
- Кнопка «Karaoke mode» в header страницы лирики — крупный текст по одному слову
- Если timestamps недоступны — показываем `StructuredLyricsDisplay` (без подсветки, но со скроллом)

### 3.3 Состояния
- Loading: shimmer-строки одинаковой высоты (без layout shift)
- Empty: иконка `Mic2` + «Лирика недоступна для этого трека»
- Error: тихий fallback на статичный текст

---

## 4. Панель деталей трека (Track Details)

Третья «страница» fullscreen-плеера и одновременно отдельный bottom-sheet из меню «⋯».

Содержимое (вертикальный стек, секции с разделителями `border-t border-border/40`):

1. **Заголовок**: название, исполнитель, длительность, дата — выровнено по левому краю, симметричные 16px
2. **Версии (A/B)**: `VersionSwitcher` — таб-пилюли, активная подсвечена `bg-primary/10`
3. **Метаданные**: жанр, BPM, ключ, модель Suno — сетка 2×N, label сверху мелким, value крупнее
4. **Стемы**: горизонтальный список чипов (если есть) → открывает Studio
5. **Действия**: симметричная сетка 2×2 — Like, Add to Playlist, Share, Download
6. **Проект**: ссылка на родительский проект (если есть)
7. **Комментарии**: первые 3 + «Показать все»

Единые токены: spacing 16px, радиусы `rounded-2xl`, тени `shadow-sm`, фон `bg-card/60 backdrop-blur`.

---

## 5. Дизайн-система и симметрия

- Аудит токенов: все плеерные компоненты используют только `src/lib/design-tokens.ts` и `src/lib/glass.ts`
- Запрет хардкод-цветов (`bg-black/50`, `text-white`) — замена на семантику
- Сетка отступов: 4/8/12/16/24 — никаких произвольных
- Иконки: только `lucide-react` через `@/lib/icons`, размер 20/24
- Touch-targets ≥ 44×44

---

## 6. Производительность и отзывчивость

- Lazy: `LyricsPage`, `DetailsPage`, `KaraokeView`, `QueueSheet`, `FullscreenVisualizer`
- Prefetch обложки следующего трека через `usePrefetchTrackCovers` (уже есть) + `img.decode()`
- `requestAnimationFrame` для скролла лирики, throttle 16ms
- Кэш `useTimestampedLyrics` через `lyricsCache` (уже есть) — оставить
- Бюджет: первая отрисовка fullscreen < 200ms, переключение страниц < 100ms

---

## 7. Проверка и тесты

- Playwright: новые сценарии — открыть fullscreen, свайп Cover→Lyrics→Details, тап по строке = seek
- Visual regression: 360 / 424 / 768 / 1440, портрет/ландшафт
- Скриншоты для трёх страниц fullscreen и компактного плеера
- Axe: контраст подсветки слов AA на тёмном фоне
- Smoke: `/`, `/library`, `/player/:id`, `/projects` — 0 JS errors, 0 layout shifts

---

## 8. Этапы реализации

1. **Каркас**: разбить `MobileFullscreenPlayer` на `Shell` + `Pages`, ввести горизонтальный pager
2. **Cover page**: симметричная компоновка, унификация прогресса/контролов
3. **Lyrics page**: новый layout строк, auto-scroll, tap-to-seek, состояния
4. **Details page**: секции, версии, метаданные, действия
5. **CompactPlayer**: подгон под новую сетку и токены
6. **Тесты + визуальная регрессия + типчек + build**

---

## Технические заметки

- Все изменения — frontend/presentation. Никаких миграций БД и правок Edge Functions
- Не трогаем `GlobalAudioProvider`, `usePlayerStore`, API слой
- Использовать существующие хуки: `useTimestampedLyrics`, `useLyricsSynchronization`, `useParsedLyrics`, `useGlobalAudioPlayer`
- Заголовки и safe-area через уже выстроенные `UnifiedScreenLayout` / `useTelegramSafeArea`
- Файлы > 500 строк дробить согласно конвенции репо
