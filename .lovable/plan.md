
# План доработки интерфейса MusicVerse AI
## Включая десктопную версию

---

## 1. Анализ текущего состояния

### Что реализовано:
- **MainLayout**: Адаптивный layout с Sidebar для десктопа и BottomNavigation для мобильных
- **Library**: Master-detail layout с боковой панелью генерации и панелью деталей трека
- **Index (Home)**: Mobile-first с hero-карточками, секциями треков, gamification bar
- **ProfilePage**: Статистика, меню навигации, адаптивная сетка
- **Rewards**: Анимированные миссии, достижения (нет desktop-оптимизации)
- **Studio V2**: Отдельные страницы для хаба, проекта, редактора
- **LyricsStudio**: Сложный редактор с AI-помощником, версионированием
- **MusicLab**: Табы с вокалом, гитарой, лирикой, PromptDJ, аккордами
- **Settings**: 9 табов (профиль, подписка, тема, приватность, уведомления и др.)
- **Pricing**: Табы кредиты/подписки, сравнение тарифов

### Проблемы десктопной версии:
1. **Rewards** - нет двухколоночного layout (DesktopRewardsLayout существует, но не используется)
2. **Settings** - 9 табов в одну линию, неудобно на десктопе (есть SettingsSidebar, не подключен)
3. **ProfilePage** - max-w-4xl, на широких экранах пустое пространство
4. **MusicLab** - max-w-4xl, могла бы использовать больше пространства
5. **LyricsStudio** - нет desktop-оптимизированного layout с панелями
6. **Studio V2** - хаб простой, нужны карточки проектов с превью
7. **Pricing** - карточки в столбец на больших экранах
8. **Projects** - ContentHubTabs без desktop-оптимизации
9. **HomeHeader** - на десктопе дублирует функционал Sidebar

### Отсутствующие пути/функционал:
1. Нет прямого доступа к покупке кредитов из BottomNav или Sidebar
2. Нет быстрого доступа к Rewards из основной навигации
3. Нет уведомлений о завершении генерации на десктопе
4. Нет клавиатурных сокращений на всех страницах
5. Нет breadcrumbs на вложенных страницах

---

## 2. Приоритетные задачи

### P0 - Критические (влияют на UX)

#### 2.1 Desktop Layout для Settings
Подключить SettingsSidebar для вертикальной навигации на десктопе.

**Изменения:**
- Settings.tsx: добавить условие `!isMobile && <SettingsSidebar />`
- Сетка: sidebar слева (w-64), контент справа
- Сохранить табы для мобильной версии

#### 2.2 Desktop Layout для Rewards
Подключить DesktopRewardsLayout для двухколоночной раскладки.

**Изменения:**
- Rewards.tsx: условие `useIsMobile()` и переключение layouts
- Левая колонка: Level, Checkin, Streak, Missions
- Правая колонка: Stats, Achievements/Leaderboard

#### 2.3 Унификация Header на десктопе
На десктопе HomeHeader избыточен (есть Sidebar).

**Изменения:**
- Index.tsx: на десктопе показывать упрощённый header
- Убрать дублирование меню и аватара
- Оставить только приветствие и уведомления

### P1 - Важные (улучшают UX)

#### 2.4 Быстрый доступ к Credits/Shop
Добавить кнопку покупки в Sidebar и profile menu.

**Изменения:**
- Sidebar.tsx: добавить пункт "Магазин" (CreditCard icon) в accountNavItems
- CreditsBalance.tsx: сделать кликабельным с переходом на /pricing
- BottomNavigation: добавить в MoreMenuSheet

#### 2.5 Desktop Layout для LyricsStudio
Трёхпанельный layout для редактора текста.

**Изменения:**
- Левая панель: список шаблонов/версий (w-64)
- Центр: редактор (flex-1)
- Правая панель: AI-помощник (w-80)
- На мобильных - сохранить текущие Sheet/Drawer

#### 2.6 Улучшенные карточки Studio Hub
Превью треков в карточках проектов.

**Изменения:**
- StudioHubPage.tsx: добавить waveform preview
- Показывать статус (playing, stems ready)
- Индикатор последних изменений

#### 2.7 Desktop Layout для MusicLab
Расширенная сетка для творческих инструментов.

**Изменения:**
- Убрать max-w-4xl на десктопе
- Grid layout для инструментов вместо табов
- Каждый инструмент в отдельной карточке

### P2 - Улучшения (полировка)

#### 2.8 Keyboard Shortcuts
Глобальные клавиатурные сокращения.

**Сочетания:**
- Space: Play/Pause
- Ctrl/Cmd+G: Открыть генерацию
- Ctrl/Cmd+L: Библиотека
- Ctrl/Cmd+S: Сохранить (в редакторах)
- Escape: Закрыть панели
- 1-5: Навигация по табам

**Реализация:**
- Создать useKeyboardShortcuts hook
- Подключить в MainLayout
- Показывать hints в Sidebar tooltips

#### 2.9 Breadcrumbs на вложенных страницах
Навигационные хлебные крошки.

**Страницы:**
- /projects/:id → "Проекты / [Название]"
- /lyrics-studio?projectId=X → "Проект / [Трек] / Редактор"
- /studio-v2/project/:id → "Студия / [Проект]"
- /album/:id → "Библиотека / [Альбом]"

**Реализация:**
- Использовать существующий Breadcrumbs компонент
- Добавить showBreadcrumbs в AppHeader

#### 2.10 Desktop Notification Center
Выпадающая панель уведомлений в Sidebar.

**Изменения:**
- Sidebar.tsx: заменить NotificationCenter на полноценную панель
- При клике открывать dropdown с историей
- Показывать уведомления о генерации

#### 2.11 Profile Desktop Layout
Расширенный профиль на широких экранах.

**Изменения:**
- ProfilePage.tsx: увеличить max-w на lg/xl
- Двухколоночный layout: stats слева, меню справа
- Добавить activity feed

#### 2.12 Pricing Desktop Optimization
Горизонтальная сетка для карточек.

**Изменения:**
- Pricing.tsx: grid-cols-4 для кредитов на xl
- Highlight популярного пакета
- Сравнительная таблица без скролла

---

## 3. Техническая реализация

### Новые компоненты

```
src/components/layout/
├── DesktopSettingsLayout.tsx    # Sidebar + content для настроек
├── DesktopLyricsLayout.tsx      # Три панели для LyricsStudio
├── DesktopMusicLabLayout.tsx    # Grid инструментов

src/components/navigation/
├── KeyboardShortcutsProvider.tsx # Глобальные хоткеи
├── ShortcutsHelp.tsx            # Справка по сочетаниям

src/hooks/
├── useKeyboardShortcuts.ts      # Hook для регистрации сочетаний
```

### Модифицируемые файлы

| Файл | Изменения |
|------|-----------|
| src/pages/Settings.tsx | Desktop sidebar layout |
| src/pages/Rewards.tsx | Desktop two-column layout |
| src/pages/Index.tsx | Упрощённый header на десктопе |
| src/pages/LyricsStudio.tsx | Three-panel layout |
| src/pages/MusicLab.tsx | Grid layout на десктопе |
| src/pages/ProfilePage.tsx | Extended layout |
| src/pages/Pricing.tsx | Grid optimization |
| src/pages/studio-v2/StudioHubPage.tsx | Enhanced cards |
| src/components/Sidebar.tsx | Shop link, shortcuts hints |

### Паттерн адаптивности

```typescript
// Стандартный паттерн для всех страниц
const isMobile = useIsMobile();

return isMobile ? (
  <MobileLayout>...</MobileLayout>
) : (
  <DesktopLayout>...</DesktopLayout>
);
```

---

## 4. Порядок выполнения

### Фаза 1: Критические layouts (2 задачи)
1. Settings desktop layout (SettingsSidebar)
2. Rewards desktop layout (DesktopRewardsLayout)

### Фаза 2: Навигация и доступность (3 задачи)
3. Shop/Credits в навигации
4. Header оптимизация для десктопа
5. Keyboard shortcuts

### Фаза 3: Продуктовые страницы (4 задачи)
6. LyricsStudio desktop layout
7. MusicLab grid layout
8. StudioHub enhanced cards
9. ProfilePage extended

### Фаза 4: Финальная полировка (3 задачи)
10. Breadcrumbs на вложенных страницах
11. Pricing grid optimization
12. Notification center desktop

---

## 5. Метрики успеха

- **Desktop usage**: +20% времени в приложении
- **Feature discovery**: +30% использование MusicLab, LyricsStudio
- **Navigation efficiency**: -40% кликов до целевого действия
- **Keyboard shortcuts adoption**: 15% power users

---

## 6. Зависимости

- DesktopRewardsLayout уже существует (не подключен)
- SettingsSidebar уже существует (не подключен)
- Breadcrumbs компонент существует
- AppHeader поддерживает breadcrumbs prop
- useIsMobile hook везде доступен

---

## 7. Риски

| Риск | Митигация |
|------|-----------|
| Ломается мобильная версия | Обязательное тестирование на всех breakpoints |
| Увеличение bundle size | Lazy loading для desktop layouts |
| Keyboard shortcuts конфликты | Проверка с браузерными сочетаниями |
