
# План оптимизации и унификации главного экрана

## Диагноз (что перегружает экран)

На `/` сейчас одновременно рендерятся 10+ независимых секций, каждая со своим заголовком, иконкой, градиентом и собственным ритмом:

- `GamificationBar`, `StatsHighlightBanner` — две полосы статистики подряд
- `HomeQuickCreate`, `CreativePresetsSection`, `QuickStartCards` — **три** разных CTA-блока «создать»
- `FeaturedSection`, `RecentTracksSection`, `TracksGridSection` — **три** ленты треков с разной плотностью
- `DailyTipCard`, `ContinueDraftCard`, `BotContextBanner`, `FirstTimeHeroCard`, `NewUserProgress` — мелкие баннеры без общей рамки
- Группирующие `HomeSectionGroup` имеют свои eyebrow-заголовки, плюс внутри почти каждой секции — собственный `SectionHeader`. Получается **двойной заголовок** на каждый блок.
- Вертикальные отступы рассыпаны: `space-y-12 sm:space-y-14`, внутри групп `space-y-4`, внутри карточек ещё `space-y-3` — нет единой шкалы.

Итог: визуальный шум, дублирование CTA, тройные ленты треков, конкурирующие акценты.

## Цели

1. Сократить число одновременно видимых секций до **4 смысловых блоков**.
2. Унифицировать заголовки — один `SectionHeader` на секцию, без вложенных eyebrow.
3. Единая шкала отступов: 8 / 16 / 24 / 40 px (внутри карточки / между карточками / между секциями / между блоками).
4. Сгруппировать дубликаты CTA и лент треков.

## Новая структура (4 блока)

```text
┌─ HERO / ONBOARDING ───────────────────────────┐
│  Новый пользователь: FirstTimeHero + Progress │
│  Возвращающийся:    ContinueDraft (если есть) │
└───────────────────────────────────────────────┘
┌─ CREATE ──────────────────────────────────────┐
│  HomeQuickCreate  (основной CTA, большой)     │
│  CreativePresets  (горизонтальный скролл)     │
│  QuickStartCards  → свернуть в подсказки      │
│                     внутри HomeQuickCreate     │
└───────────────────────────────────────────────┘
┌─ DISCOVER ────────────────────────────────────┐
│  Табы: [Популярное] [Новинки] [Для вас]       │
│  Одна лента треков, переключаемая табами      │
│  (объединяет Featured + New + Recent)         │
└───────────────────────────────────────────────┘
┌─ YOU ─────────────────────────────────────────┐
│  Компактная строка: Stats • Streak • Credits  │
│  (объединяет GamificationBar + StatsBanner)   │
│  DailyTip — свернуть в один dismissible toast │
└───────────────────────────────────────────────┘
```

`BotContextBanner` показывается только при наличии deep-link параметра (уже так), остаётся над Hero.

## Технические задачи

### Фаза 1 — структурная унификация (без удаления компонентов)
1. **`Index.tsx`**: переписать `sections` map в 4 кластера выше. Удалить вложенные `HomeSectionGroup` eyebrow, оставить только один заголовок на кластер.
2. Ввести один контейнер ритма: `space-y-10` между кластерами, `space-y-6` внутри. Удалить локальные `mb-*`, `space-y-12/14/16`.
3. Свернуть desktop/mobile в одну функцию `renderLayout()` — единственное отличие переносим в `xl:grid xl:grid-cols-12`.

### Фаза 2 — объединение дубликатов
4. **CreateBlock**: новый `src/components/home/CreateBlock.tsx`, который рендерит `HomeQuickCreate` и под ним 4-6 чипов-пресетов из `QuickStartCards` (как inline-chips, не отдельные карточки).
5. **DiscoverTabs**: новый `src/components/home/DiscoverTabs.tsx` с табами `Tabs` (shadcn), внутри — один `TracksGridSection` с подставляемым источником данных. Убирает 3 ленты и 3 заголовка.
6. **YouStrip**: объединить `GamificationBar` + `StatsHighlightBanner` в одну строку (горизонтальный flex с разделителями).

### Фаза 3 — визуальный шум
7. Убрать декоративный размытый blob (`fixed inset-0 ... bg-primary/10 blur-3xl`) — он добавляет визуальный шум на мобиле.
8. `DailyTipCard` → одноразовый dismissible банер вверху Discover, не отдельная секция.
9. Привести все `SectionHeader` к одному стилю: 14px title, 12px subtitle, без иконочных градиентов на мобиле (только цвет акцента).

### Фаза 4 — токены отступов
10. В `src/lib/design-spacing.ts` зафиксировать ровно 3 публичные функции: `blockGap()` = 40/48, `sectionGap()` = 24, `itemGap()` = 12/16. Удалить остальные. Прогнать home-компоненты на новые токены.

## Файлы, которые будут изменены

- `src/pages/Index.tsx` — переписать layout и `sections` map
- `src/components/home/CreateBlock.tsx` *(новый)*
- `src/components/home/DiscoverTabs.tsx` *(новый)*
- `src/components/home/YouStrip.tsx` *(новый)*
- `src/components/home/HomeSectionGroup.tsx` — упростить (убрать eyebrow по умолчанию)
- `src/components/common/SectionHeader.tsx` — единый размер/вес
- `src/lib/design-spacing.ts` — сократить API

Старые компоненты (`FeaturedSection`, `RecentTracksSection`, `QuickStartCards`, `StatsHighlightBanner`, `DailyTipCard`) остаются — они будут использоваться внутри новых обёрток или на других страницах.

## Критерий готовности

- На первом экране (мобиль, 390×844) видны максимум: Header, Hero/CTA, начало Discover.
- Не более **1 заголовка-eyebrow** на секцию.
- Все вертикальные расстояния — кратны 8 px и берутся из трёх токенов.
- Кол-во отдельных «карточек-баннеров» на экране ≤ 4.

---

Подтверди план — и я приступлю к Фазе 1.
