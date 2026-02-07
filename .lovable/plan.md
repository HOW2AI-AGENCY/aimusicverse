
# План доработки дизайна интерфейса для десктопных устройств

## Резюме анализа

Проведён аудит 28+ страниц и 177+ компонентов. Выявлены ключевые паттерны:
- Только 4 страницы имеют специализированные десктопные layouts (Settings, Library, Rewards, MainLayout)
- Большинство страниц используют `max-w-4xl`/`max-w-lg` — недоиспользуют экранное пространство
- Отсутствует единообразная система breakpoints для grid layouts
- Sidebar и master-detail есть только в Library и Settings

---

## 1. КРИТИЧЕСКИЕ ПРОБЛЕМЫ

### 1.1 Недоиспользование экранного пространства (P0)
**Страницы с узким контейнером:**
- `Analytics.tsx` — `max-w-4xl`, можно расширить до двухколоночной сетки
- `ProfilePage.tsx` — `max-w-4xl`, статистика линейная вместо dashboard
- `AudioHub.tsx` — `max-w-4xl`, инструменты можно разместить в сетке
- `CreativeTools.tsx` — `max-w-4xl`, карточки инструментов в узкой колонке
- `Referral.tsx` — `max-w-lg`, крайне узкий на десктопе

### 1.2 Отсутствие консистентных breakpoints (P1)
**Проблема:** Grid layouts используют разные паттерны:
- `grid-cols-2 sm:grid-cols-3 md:grid-cols-4` (Library)
- `grid-cols-1 lg:grid-cols-2` (Rewards)
- `grid-cols-2 gap-4` без responsive (Analytics)

### 1.3 Нет master-detail для ключевых страниц (P1)
- **Projects** — нет превью выбранного проекта
- **Playlists** — нет detail panel для плейлиста
- **Analytics** — нет drill-down для метрик

---

## 2. ПРЕДЛАГАЕМАЯ АРХИТЕКТУРА

### 2.1 Унифицированная система layouts

```text
┌─────────────────────────────────────────────────────────────┐
│                        Desktop Layout                        │
├─────────┬───────────────────────────────────────────────────┤
│         │                                                   │
│ Sidebar │              Main Content Area                    │
│  (w-64  │    ┌─────────────────┬─────────────────┐          │
│   or    │    │   Master List   │  Detail Panel   │          │
│  w-16   │    │    (flex-1)     │  (w-[40%] max)  │          │
│collaps) │    │                 │                 │          │
│         │    └─────────────────┴─────────────────┘          │
│         │                                                   │
└─────────┴───────────────────────────────────────────────────┘
```

### 2.2 Новые Desktop Layout компоненты

| Компонент | Назначение |
|-----------|------------|
| `DesktopDashboardLayout` | Двухколоночный dashboard (Analytics, Profile) |
| `DesktopMasterDetailLayout` | List + Detail panel (Projects, Playlists) |
| `DesktopToolsGridLayout` | Grid инструментов (AudioHub, CreativeTools) |
| `DesktopContentLayout` | Широкий контент с sidebar filters |

---

## 3. ПЛАН РЕАЛИЗАЦИИ

### Фаза 1: Инфраструктура ✅ DONE

**Задача 1.1: Создать базовые desktop layouts** ✅
- `src/components/layout/desktop/DesktopDashboardLayout.tsx`
- `src/components/layout/desktop/DesktopMasterDetailLayout.tsx`
- `src/components/layout/desktop/DesktopToolsGridLayout.tsx`
- `src/components/layout/desktop/DesktopContentLayout.tsx`
- `src/components/layout/desktop/index.ts` (экспорты)

**Задача 1.2: Стандартизировать breakpoints** ✅
- Создано `src/lib/breakpoints.ts`:
  - `GRID_COLS` — стандартные grid configurations
  - `MAX_WIDTHS` — container max-widths по типам страниц
  - `GAPS` — стандартные gap значения
  - `LAYOUT_RATIOS` — пропорции master-detail

### Фаза 2: Dashboard-страницы ✅ DONE

**Задача 2.1: Analytics Dashboard** ✅
- Двухколоночный layout на десктопе
- Левая колонка: Stats Grid 2x2 + Engagement Chart
- Правая колонка: Generation Stats + Content Stats + Genre Distribution

**Задача 2.2: Profile Dashboard** ✅
- Двухколоночный layout на десктопе
- Левая колонка: Stats + Quick Stats + Menu Items
- Правая колонка: Invite Friends + Action Cards

**Задача 2.3: AudioHub Tools Grid** ✅
- Side-by-side панели на десктопе (Record/Upload + History)
- Табы только на мобильных

### Фаза 3: Master-Detail страницы ✅ DONE

**Задача 3.1: Playlists с Detail Panel** ✅
- Создан `PlaylistDetailPreview.tsx` - превью плейлиста
- Desktop: master-detail layout с preview panel
- Mobile: стандартный список с диалогами
- Выделение выбранного элемента (ring-2 ring-primary)

**Задача 3.2: Projects с ContentHubTabs** ✅
- Страница Projects уже использует ContentHubTabs с двумя вкладками
- Расширена до max-w-6xl для десктопа

### Фаза 4: Оптимизация Index (Home) ✅ DONE

**Задача 4.1: Desktop Home Layout** ✅
- Трёхколоночная сетка: 2/3 основной контент + 1/3 сайдбар
- Левая колонка: QuickCreate, Presets, Featured, New Tracks Grid (4 cols)
- Правая колонка: Stats, Gamification, Daily Tip, Recent, QuickStart
- Расширен container до max-w-7xl

### Фаза 5: Улучшение Sidebar (1 час)

**Задача 5.1: Keyboard shortcuts indicator**
- Показывать hotkeys рядом с пунктами меню (⌘1, ⌘2, etc.)

**Задача 5.2: Pinned items**
- Возможность закрепить часто используемые страницы

**Задача 5.3: Recent items**
- Последние открытые треки/проекты в sidebar

---

## 4. ТЕХНИЧЕСКИЕ ДЕТАЛИ

### Новые файлы

```
src/components/layout/desktop/
├── DesktopDashboardLayout.tsx
├── DesktopMasterDetailLayout.tsx
├── DesktopToolsGridLayout.tsx
├── DesktopContentLayout.tsx
└── index.ts

src/lib/breakpoints.ts
```

### Изменяемые файлы

| Файл | Изменения |
|------|-----------|
| `src/pages/Analytics.tsx` | Dashboard layout |
| `src/pages/ProfilePage.tsx` | Dashboard layout |
| `src/pages/AudioHub.tsx` | Tools grid layout |
| `src/pages/CreativeTools.tsx` | Tools grid layout |
| `src/pages/Projects.tsx` | Master-detail layout |
| `src/pages/Playlists.tsx` | Master-detail layout |
| `src/pages/Artists.tsx` | Master-detail layout |
| `src/pages/Index.tsx` | Two-column desktop layout |
| `src/pages/Referral.tsx` | Расширить container |
| `src/components/Sidebar.tsx` | Shortcuts + Recent |

### Паттерн использования

```typescript
// В страницах
import { useIsMobile } from '@/hooks/use-mobile';
import { DesktopDashboardLayout } from '@/components/layout/desktop';

function AnalyticsPage() {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <DesktopDashboardLayout
        header={<Header />}
        leftColumn={<StatsGrid />}
        rightColumn={<Charts />}
        bottomSection={<DetailedAnalytics />}
      />
    );
  }

  return <MobileAnalyticsLayout />;
}
```

---

## 5. СТАНДАРТНЫЕ BREAKPOINTS

```typescript
// src/lib/breakpoints.ts
export const GRID_COLS = {
  dashboard: 'grid-cols-1 lg:grid-cols-2 gap-6',
  cards: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4',
  tools: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
  stats: 'grid-cols-2 sm:grid-cols-4 gap-3',
} as const;

export const MAX_WIDTHS = {
  narrow: 'max-w-2xl',      // Формы, настройки
  medium: 'max-w-4xl',      // Списки
  wide: 'max-w-6xl',        // Dashboards
  full: 'max-w-7xl',        // Студия, граф
} as const;
```

---

## 6. ПРИОРИТИЗАЦИЯ

| Приоритет | Задача | Сложность | Влияние |
|-----------|--------|-----------|---------|
| P0 | Desktop layouts infrastructure | Средняя | Высокое |
| P0 | Analytics Dashboard | Средняя | Высокое |
| P1 | Profile Dashboard | Низкая | Среднее |
| P1 | Projects Master-Detail | Средняя | Высокое |
| P1 | Index Desktop Layout | Средняя | Высокое |
| P2 | Playlists Master-Detail | Средняя | Среднее |
| P2 | AudioHub Tools Grid | Низкая | Среднее |
| P2 | Sidebar enhancements | Низкая | Среднее |
| P3 | Artists Master-Detail | Средняя | Низкое |
| P3 | CreativeTools Grid | Низкая | Низкое |

---

## 7. МЕТРИКИ УСПЕХА

- Использование экранного пространства: >80% на 1920px
- Консистентность breakpoints: 100% страниц используют стандартные
- Master-detail coverage: 5 ключевых страниц
- Bundle increase: <5KB (только CSS/layout компоненты)
- User engagement на десктопе: +20%
