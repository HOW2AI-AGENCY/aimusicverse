# План полировки интерфейса MusicVerse AI

## 1. Ключевые пользовательские пути

```
Библиотека (/) → трек/карточка → плеер (FullscreenPlayer)
Библиотека → GenerateSheet (создание трека)
Главная (/) → Discover → трек
Проекты → ProjectDetail → треки
Студия лирики → AI агент
Профиль → Voice Clone
```

## 2. Выявленные проблемы

### UI-1: Отступ слева на мобильной библиотеке
**Файл:** `src/pages/Library.tsx`  
**Причина:** Не установлена окончательно — вероятно кэш Lovable или неверная конфигурация flex.  
**Фикс:** Добавить `px-4 sm:px-6` на контейнер с `flex-1` для симметрии. Убедиться, что DesktopLibrarySidebar не рендерится на мобилах.

### UI-2: Нет Pull-to-Refresh на страницах (кроме Library)
**Файлы:** `Index.tsx`, `Projects.tsx`, `ProfilePage.tsx`, `AudioHub.tsx`  
**Проблема:** PullToRefreshWrapper есть только в Library. На главной и проектах пользователь не может обновить данные свайпом.

### UI-3: MobilePlayerPage — отдельный роут с дублированием логики
**Файл:** `src/pages/MobilePlayerPage.tsx` (307 LOC)  
**Проблема:** Полностью отдельная страница плеера для мобильных, дублирует логику `MobileFullscreenPlayer.tsx`. Различия минимальны.

### UI-4: Нет плавного перехода между треками в плеере
**Файл:** `src/components/player/`  
**Проблема:** При переключении трека — мгновенная смена, нет анимации crossfade или затухания.

### UI-5: Empty State на проектах и AudioHub
**Файлы:** `Projects.tsx`, `AudioHub.tsx`  
**Проблема:** Есть EmptyLibraryState для библиотеки, но для страницы проектов и AudioHub — вероятно отсутствует или неполный empty state.

### UI-6: Bottom Navigation — отсутствует активное состояние для "Создать"
**Файл:** `src/components/BottomNavigation.tsx`  
**Проблема:** Кнопка "Создать" в центре — триггер для генерации. Не имеет активного/выбранного состояния. Нет анимации.

### UI-7: Нет мобильного skeleton для GenerateSheet
**Файл:** `src/components/generate-sheet/GenerateSheetBody.tsx`  
**Проблема:** Скелетон загрузки формы генерации не мобильно-адаптивный — использует десктопные размеры.

### UI-8: Профиль — отсутствует pending state на Voice Clone
**Файл:** `src/pages/ProfilePage.tsx` (532 LOC)  
**Проблема:** После запуска voice clone нет визуального индикатора прогресса на странице профиля.

### UI-9: Несоответствие отступов между grid/list view
**Файл:** `Library.tsx:415-441`  
**Проблема:** `gap-3 @[600px]:gap-4` — отличается от `containerPadding()` (`px-5`). Создаёт визуальное несоответствие.

### UI-10: Нет адаптивного поведения Header на мобилах
**Файл:** `src/components/layout/AppHeader.tsx`  
**Проблема:** AppHeader использует `sticky` + `-mx-4 px-5` — на мобилах может создавать горизонтальный скролл.

### UI-11: DesktopLibrarySidebar — мёртвый код на мобилах
**Файл:** `src/components/library/DesktopLibrarySidebar.tsx` (361 LOC)  
**Проблема:** Содержит `if (isMobile)` ветку, которая никогда не выполняется (компонент не рендерится на мобилах через `isDesktop &&`). Код можно удалить.

### UI-12: ProfilePage — большой монолит (532 LOC)
**Файл:** `src/pages/ProfilePage.tsx`  
**Проблема:** Раздутый компонент, смешивает логику профиля, voice clone, настроек.

### UI-13: Нет уведомления об офлайн-режиме
**Проблема:** При потере соединения пользователь не видит индикатор. Есть `useNetworkStatus`, но нет UI-фидбека.

### UI-14: Кнопка "Создать" на библиотеке (десктоп)
**Проблема:** При `isCollapsed=true` sidebar скрыт полностью. Нет кнопки "Создать" на панели навигации.

### UI-15: Индикация загрузки на кнопке генерации
**Проблема:** Кнопка "Сгенерировать" показывает спиннер, но нет прогресс-бара для длительных генераций.

## 3. Приоритеты

### 🔴 P0 (Critical)
- ~~UI-1: Починить отступ слева на мобильной библиотеке~~ ✅ `+px-4 sm:px-6`
- ~~UI-5: EmptyState на AudioHub~~ ✅ уже есть в `AudioHubHistory`

### 🟠 P1 (High)
- ~~UI-13: Offline-индикатор~~ ✅ `OfflineBanner` в App.tsx
- ~~UI-2: Pull-to-Refresh на Index~~ ✅ уже есть
- ~~UI-6: Bottom nav — анимация~~ ✅ уже реализована (pill+scale)
- ~~UI-10: AppHeader~~ ✅ паттерн `-mx-4 px-5` стандартный, страницы используют `!mx-0`
- UI-2b: Pull-to-Refresh на Projects — нужен refetch из useProjects

### 🟡 P2 (Medium)
- **UI-4**: Анимация переключения треков
- **UI-7**: Мобильный skeleton для GenerateSheet
- **UI-8**: Voice clone progress на профиле
- **UI-9**: Выровнять отступы grid/list
- **UI-11**: Удалить мёртвый код из DesktopLibrarySidebar
- **UI-15**: Прогресс-бар генерации

### 🟢 P3 (Low)
- **UI-3**: Устранить дублирование MobilePlayerPage
- **UI-12**: Декомпозиция ProfilePage
- **UI-14**: Кнопка "Создать" при collapsed sidebar
