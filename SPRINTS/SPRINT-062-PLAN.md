# Sprint 062: UI/UX Audit — P0/P1/P2 Fixes (Q3 2026)

**Дата плана:** 2026-07-09
**Длительность:** ~5 рабочих дней (3 фазы)
**Зависимость:** Sprint 061 ✅ (vendor splits + barrel cleanup + chunk split)
**Цель:** Закрыть P0/P1 UX-проблемы по результатам полного UI-ревью (см. ниже). Повысить Design Score C+ → B.

---

## Контекст ревью

Полный UI/UX ревью MusicVerse AI (2026-07-09) — 4 области: homepage, player, generate-form, unified studio.

### P0 — блокеры

| #    | Проблема                                                                                                             | Файл                                                                           | Оценка  |
| ---- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------- |
| P0-1 | **Suspense fallback=null на 3 lazy диалогах** — ноль фидбека при загрузке чанков                                     | [Index.tsx:254-270](../src/pages/Index.tsx#L254)                               | ~30 мин |
| P0-2 | **HomeQuickCreate: все 4 опции делают одно и то же** — воспринимаемая ≠ реальная функциональность                    | [HomeQuickCreate.tsx:136-139](../src/components/home/HomeQuickCreate.tsx#L136) | ~30 мин |
| P0-3 | **QuickCreate FAB: `to-generate` цвет без fallback** — если `--generate` CSS-переменная пропадёт, градиент сломается | [HomeQuickCreate.tsx:86-95](../src/components/home/HomeQuickCreate.tsx#L86)    | ~15 мин |
| P0-4 | **HomeSearchBar: `h-10` (40px) — ниже WCAG 2.5.5** — touch target не проходит                                        | [HomeSearchBar.tsx:36](../src/components/home/HomeSearchBar.tsx#L36)           | ~10 мин |

### P1 — значимый UX-friction

| #    | Проблема                                                                                               | Файл                                                                       | Оценка  |
| ---- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- | ------- |
| P1-1 | **Index: нет Error Boundary** — если секция крашнется → белый экран                                    | [Index.tsx](../src/pages/Index.tsx)                                        | ~20 мин |
| P1-2 | **Hardcoded русский текст везде** — i18next уже есть в vendor-i18n, текст в коде                       | HomeQuickCreate, HomeSearchBar, CompactPlayer, etc.                        | ~3 ч    |
| P1-3 | **CompactPlayer: inline style.transform конфликтует с Tailwind active:scale** — сброс угла при нажатии | [HomeQuickCreate.tsx:115](../src/components/home/HomeQuickCreate.tsx#L115) | ~15 мин |
| P1-4 | **PullToRefresh оборачивает header** — PTR тянет всю навигацию                                         | [Index.tsx:200](../src/pages/Index.tsx#L200)                               | ~30 мин |
| P1-5 | **Player: нет shimmer на waveform при смене трека**                                                    | [CompactPlayer.tsx:52](../src/components/player/CompactPlayer.tsx#L52)     | ~30 мин |
| P1-6 | **HomeQuickCreate: raw `<button>` vs дизайн-системный `<Button>`**                                     | [HomeQuickCreate.tsx:185](../src/components/home/HomeQuickCreate.tsx#L185) | ~20 мин |
| P1-7 | **MixerChannel: нет empty/disabled состояния для stem-каналов**                                        | [MixerChannel.tsx](../src/components/studio/unified/MixerChannel.tsx)      | ~30 мин |

### P2 — polish & consistency

| #    | Проблема                                                   | Файл                                                                                   | Оценка  |
| ---- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------- |
| P2-1 | **GenerateSheet: `h-[95dvh]` — половинчатый bottom sheet** | [GenerateSheet.tsx](../src/components/GenerateSheet.tsx)                               | ~15 мин |
| P2-2 | **HomeSearchBar не memoized — лишние ререндеры**           | [HomeSearchBar.tsx:16](../src/components/home/HomeSearchBar.tsx#L16)                   | ~10 мин |
| P2-3 | **Поиск: нет кнопки очистки (×)**                          | [HomeSearchBar.tsx](../src/components/home/HomeSearchBar.tsx)                          | ~15 мин |
| P2-4 | **Volume popover — 2 клика на частотное действие**         | [CompactPlayerButtons.tsx:188](../src/components/player/CompactPlayerButtons.tsx#L188) | ~30 мин |
| P2-5 | **Custom mode: нет step indicator (1/5…5/5)**              | [GenerateFormCustom.tsx](../src/components/generate-form/GenerateFormCustom.tsx)       | ~45 мин |

---

## Фаза A — P0 (1 день)

### A-1: Suspense fallback для генерации и диалогов

**Файл:** `src/pages/Index.tsx`
**Что:** Заменить `fallback={null}` на минимальный спиннер для 3 lazy диалогов: GenerateSheet, MusicRecognitionDialog, AudioActionDialog.

```tsx
// Before
<Suspense fallback={null}>

// After
<Suspense fallback={<Loader2 className="h-6 w-6 animate-spin text-primary" />}>
```

**Проверка:** Нажать Generate на медленном connection — спиннер виден.

### A-2: HomeQuickCreate — дифференциация опций

**Файл:** `src/components/home/HomeQuickCreate.tsx`
**Что:**

1. Добавить `mode` параметр в `onCreateClick` — каждая опция передаёт свой режим
2. Или показать только 1-2 реальные опции, а остальные скрыть, если функционально одинаковы

```tsx
// QuickCreateOption
onClick={() => onCreateClick?.({ mode: option.mode })}
```

**Проверка:** Трек, Рифф, Кавер, Ремикс — разные действия (или показываем только рабочие).

### A-3: Fix gradient + touch target

**Файл:** `src/components/home/HomeQuickCreate.tsx`, `src/components/home/HomeSearchBar.tsx`
**Что:**

1. `bg-gradient-to-r from-primary to-primary/50` (fallback-safe)
2. `h-11 min-h-[44px]` на search input
3. Clear button для поиска

**Проверка:** `npm run build`, HomeQuickCreate градиент не ломается, searchbar >44px.

---

## Фаза B — P1 (2 дня)

### B-1: Error Boundary на Index

**Файл:** `src/pages/Index.tsx`
**Что:** Оборачиваем каждый content block в `<ErrorBoundary>`:

```tsx
<ErrorBoundary fallback={<SectionErrorCard section="trending" />}>
  <FeaturedSection ... />
</ErrorBoundary>
```

**Проверка:** Удалить пропу из FeaturedSection — Index показывает ошибку, а не белый экран.

### B-2: i18n миграция homepage + player

**Файлы:** HomeQuickCreate, HomeSearchBar, HomeDesktopSidebar, CompactPlayer, CompactPlayerButtons
**Что:**

- HomeQuickCreate: `aria-label`, placeholder, заголовки
- CompactPlayer: все `aria-label`, title, status text
- HomeSearchBar: placeholder, `aria-label`

```tsx
// Before
placeholder="Поиск треков..."

// After
placeholder={t("search.placeholder")}
```

**Проверка:** `npm test -- --run`, ни один `t(...)` ключ не undefined.

### B-3: PullToRefresh scope

**Файл:** `src/pages/Index.tsx`
**Что:** Обернуть PTR только скролл-контент, исключить header/search.

```tsx
<div class="sticky top-0 z-10">
  <HomeHeader />
  <HomeSearchBar />
</div>
<PullToRefreshWrapper>// только контент блоки</PullToRefreshWrapper>
```

**Проверка:** На мобильном PTR не двигает верхнюю панель.

### B-4: Waveform shimmer при смене трека

**Файл:** `src/components/player/CompactPlayer.tsx`
**Что:** При `isLoading && variant === "mobile"` уже есть buffering hairline (line 298). Распространить на mid/desktop варианты — добавить shimmer overlay на область waveform.

**Проверка:** При смене трека waveform area показывает анимацию загрузки.

### B-5: MixerChannel empty state

**Файл:** `src/components/studio/unified/MixerChannel.tsx`
**Что:** При отсутствии аудиоданных — показать "No audio" вместо молчащего 0-fader.

**Проверка:** Канал без стема показывает disabled-состояние.

---

## Фаза C — P2 (2 дня)

### C-1: Step indicator в Custom mode

**Файл:** `src/components/generate-form/GenerateFormCustom.tsx`
**Что:** Добавить шаги "1/5 … 2/5 … 3/5" в хедер формы. Использовать существующий `SectionLabel` + badge для текущего шага.

```tsx
<StepIndicator current={step} total={5} labels={["Basic", "Style", "Lyrics", "Voice", "Settings"]} />
```

### C-2: Volume slider — inline hover (desktop)

**Файл:** `src/components/player/CompactPlayerButtons.tsx`
**Что:** На десктопном варианте при hover на иконку громкости показывать slider без popover-клика. Использовать CSS `group-hover`.

**Проверка:** На десктопе hover на громкость — slider появляется сразу.

### C-3: GenerateSheet h-dvh

**Файл:** `src/components/GenerateSheet.tsx`
**Что:** `h-[95dvh]` → `h-dvh` (полный bottom-to-top) или `h-[85dvh]` в зависимости от контекста.

### C-4: HomeSearchBar memo

**Файл:** `src/components/home/HomeSearchBar.tsx`
**Что:** `memo(HomeSearchBar)`.

---

## Timeline

```
День 1: Фаза A — P0 блокеры
День 2-3: Фаза B — P1 фиксы
День 4-5: Фаза C — P2 polish
```

## Метрики

| Метрика                         | Текущее           | Цель                  |
| ------------------------------- | ----------------- | --------------------- |
| Design Score                    | C+                | B                     |
| touch targets <44px             | 1 (HomeSearchBar) | 0                     |
| Error Boundary coverage (pages) | 0                 | 1+ (Index)            |
| aria-label hardcoded            | 25+               | 0                     |
| step indicator                  | none              | 1 (Custom mode)       |
| Unit tests                      | 1691              | 1691+ (no regression) |

## Verification

1. `npm run build` — 0 errors
2. `tsc --noEmit` — 0 errors
3. `npm test -- --run` — all passing
4. `npm run size` — bundle ≤ current
5. Storybook — affected stories render correctly
