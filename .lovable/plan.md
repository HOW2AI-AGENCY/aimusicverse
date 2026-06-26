## Цель

Довести мобильный UI MusicVerse AI до уровня нативного приложения: единые токены, bottom-sheet попапы, безопасные зоны, целостность ключевых экранов. Работаем мобайл-ферст (390×844), затем масштабируем на tablet/desktop.

## Спринт 1 — Фундамент токенов и примитивов (2–3 дня)

**S1.1** Единые mobile-first токены в `src/styles/spacing.css` + `tailwind.config.ts`:
- spacing scale `xs/sm/md/lg/xl/2xl` (4/8/12/16/24/32)
- safe-area utilities: `pt-safe`, `pb-safe-dock`, `px-safe`
- touch-target: `min-h-touch` (44), `min-h-touch-lg` (48)

**S1.2** Mobile-first типография в `src/styles/typography.css`:
- `text-h1/h2/h3/h4/body/body-sm/caption` с line-height
- `text-balance` / `text-pretty` хелперы для RU
- увеличить `tap-line-height` для интерактивных элементов

**S1.3** ESLint rule: запретить `pb-[Npx]`, `pt-[Npx]`, `text-[Npx]` в `src/components/**` (только токены).

**S1.4** Аудит и удаление дубликатов: оставить один `EmptyState`, один `LoadingSpinner`, один `SectionHeader`.

**Acceptance**: грep `text-\[`/`p[xtblr]-\[` в `src/components` = 0; storybook новых токенов.

---

## Спринт 2 — Диалоги и попапы как native bottom-sheet (3–4 дня)

**S2.1** Полировка `Dialog` mobile-варианта (база уже сделана): drag-to-dismiss через `vaul`, snap-points `[0.5, 0.9]`, haptic на open/close/snap.

**S2.2** Унификация: `AlertDialog`, `Sheet`, `Drawer` → единый рендер через `UnifiedDialog` варианты (modal/sheet/alert). Удалить локальные ad-hoc модалки.

**S2.3** Фокус и a11y:
- focus-trap (Radix даёт), `aria-modal`, `aria-labelledby`
- Esc + swipe-down + backdrop-tap закрытие
- возврат фокуса на триггер после закрытия
- `inert` на фоновом контенте

**S2.4** Стиль: glassmorphism overlay (`backdrop-blur-xl`), spring-анимация (`damping 25, stiffness 300`), тень `shadow-2xl`, edge-glow.

**S2.5** Миграция конкретных попапов: `WelcomeBonusPopup`, `AudioExtendDialog`, `AudioCoverDialog`, `NewArrangementDialog`, `CreateArtistDialog`, `GenerateSheet`, `PresetManager` — заменить кастомные обёртки на унифицированный примитив.

**Acceptance**: 0 кастомных fixed-position модалок; axe-core по 10 диалогам = 0 critical/serious.

---

## Спринт 3 — Боковое меню и навигация (2 дня)

**S3.1** Mobile drawer для Sidebar: триггер hamburger в `MobileHeaderBar` → `Sheet side="left"` со списком разделов, swipe-to-close, safe-area top/bottom.

**S3.2** Bottom-dock island: проверить `--nav-h`, добавить blur overlay, активный таб с pill-индикатором, haptic на смену таба.

**S3.3** Edge-rail (landscape) — выровнять иконки по safe-area-left, увеличить tap-target до 48px.

**S3.4** Back-button hook для всех вложенных экранов (Telegram BackButton + браузерный).

**Acceptance**: Lighthouse mobile a11y ≥ 95; нет перекрытия dock с CTA.

---

## Спринт 4 — Ключевые экраны: Library + Pricing (3 дня)

**S4.1 Library**:
- list/grid toggle с сохранением в localStorage
- track card: 72px высота, обложка 56×56, title 16/600, meta 13/400
- swipe-actions (like, queue, delete) через `SwipeableListItem`
- sticky filter bar под header, фильтры в bottom-sheet
- pull-to-refresh

**S4.2 Pricing**:
- сегмент-контрол month/year (native iOS-style)
- карточки тарифов вертикальным стеком, "Popular" badge с gradient-border
- CTA фиксированный внизу с safe-area-bottom
- FAQ как accordion

**Acceptance**: скриншоты обоих экранов на 390/430/768; touch-target ≥ 44 везде.

---

## Спринт 5 — Studio (мобильная DAW) (4–5 дней)

**S5.1** Layout: header 56px + scroll-канвас + bottom transport bar 72px + AI-FAB.

**S5.2** Track lanes: горизонтальный pinch-zoom, вертикальный список треков; mute/solo/volume в выезжающем правом sheet.

**S5.3** Transport bar: play/pause 56px центр, skip ±15s, scrubber с waveform-thumb, время справа.

**S5.4** AI Actions FAB: expandable speed-dial (Generate / Extend / Cover / Add Vocals) с haptic.

**S5.5** Section editor → fullscreen sheet с lyrics-sync.

**Acceptance**: e2e сценарий "открыть трек → play → extend → сохранить" проходит на iPhone 12 viewport.

---

## Спринт 6 — Auth + Onboarding (2 дня)

**S6.1 Auth**:
- одностраничная форма, single-column, поля 56px высотой
- soft-keyboard handling (`visualViewport`), CTA липкий над клавиатурой
- Google + Email + Telegram inline, без табов
- ошибки inline, не toast

**S6.2 Onboarding**: 3-шаговый horizontal swiper с dot-pagination, skip top-right, CTA bottom со swafe-area.

**Acceptance**: forms.spec e2e green; reduced-motion вариант без анимаций.

---

## Спринт 7 — Полировка и регрессии (2 дня)

**S7.1** Visual regression: Playwright + pixelmatch по 12 ключевым экранам × {390, 430, 768, 1280}.

**S7.2** Темная/светлая темы — проверить контраст всех новых токенов (WCAG AA).

**S7.3** Reduced-motion: все spring/slide заменить на fade при `prefers-reduced-motion`.

**S7.4** Финальный axe + lighthouse прогон; обновить `SPRINT_UI_UNIFICATION.md` и `mem://`.

**Acceptance**: Lighthouse mobile ≥ 95 по всем 4 категориям; 0 axe violations на 7 routes.

---

## Технические детали

- Все варианты — Tailwind + CSS variables, без новых зависимостей кроме `vaul` (уже есть).
- Анимации — `@/lib/motion` (framer-motion tree-shaken), spring presets из `motion-presets.ts`.
- Тесты — `tests/e2e/mobile.*.spec.ts`, отчёт axe в `axe-report/`.
- Каждый спринт = отдельный PR + запись в `SPRINTS/completed/`.

## Риски

- Bottom-sheet миграция может задеть >40 диалогов — ожидаем визуальные регрессии, страхуем визуальными снапшотами в S7.
- Studio переработка тяжёлая, при нехватке времени S5.2 (pinch-zoom) → отдельный спринт.

## Объём

~18–20 рабочих дней, 7 спринтов, ~45 задач. Можно урезать до MVP (S1+S2+S3+S4) за 10 дней.
