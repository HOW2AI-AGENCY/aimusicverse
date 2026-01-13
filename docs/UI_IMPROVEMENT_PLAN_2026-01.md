# 🎨 План улучшений интерфейса MusicVerse AI

> **Дата создания:** 2026-01-13  
> **Статус:** Draft  
> **Приоритет:** High

---

## 📊 Текущий анализ

### Проблемы, выявленные при аудите

#### 🔴 Критические

1. **404 страница "Трек не найден" появляется неправильно**
   - Страница NotFound показывает "Трек не найден" для любых 404 ошибок
   - Нужно: разные сообщения для разных типов контента (трек/проект/плейлист/страница)
   - Файл: `src/pages/NotFound.tsx`

2. **Screenshot Mode не полностью интегрирован**
   - Защищённые страницы не получают mock-данные в screenshot mode
   - Хуки данных (useProfile, useTracks) не проверяют isScreenshotMode
   - Нужно: интегрировать mock-данные во все ключевые хуки

3. **Баннеры Guest/Screenshot Mode перекрывают контент**
   - Фиксированные баннеры не учитывают safe areas Telegram
   - Контент под баннерами может быть обрезан

#### 🟡 Важные

4. **Дублирование кода в Empty States**
   - Каждая страница имеет свой пустой стейт
   - Нужно: унифицированный компонент EmptyState

5. **Несогласованные иконки в навигации**
   - Разные стили иконок на разных экранах
   - Нужно: единый IconSet с consistent stroke-width

6. **Слабая информативность Loading States**
   - Простые спиннеры без контекста
   - Нужно: skeleton screens для ключевых компонентов

7. **Плеер не показывает версию трека (A/B)**
   - Пользователь не понимает какую версию слушает
   - Нужно: индикатор версии в compact и expanded режимах

#### 🟢 Улучшения

8. **Анимации переходов между страницами**
   - Резкие переходы между роутами
   - Нужно: page transitions с framer-motion

9. **Haptic feedback на мобильных**
   - Не используется Telegram haptic API
   - Нужно: тактильный отклик на ключевые действия

10. **Dark/Light mode toggle**
    - Нет переключателя темы
    - Нужно: уважать system preference + manual toggle

---

## 🎯 Детальный план реализации

### Фаза 1: Критические исправления (1-2 дня)

#### 1.1 Улучшение NotFound страницы

```tsx
// Новые сообщения по типу контента
const messages = {
  track: { title: 'Трек не найден', icon: Music },
  project: { title: 'Проект не найден', icon: FolderOpen },
  playlist: { title: 'Плейлист не найден', icon: ListMusic },
  user: { title: 'Пользователь не найден', icon: User },
  default: { title: 'Страница не найдена', icon: Search },
};
```

#### 1.2 Интеграция Screenshot Mode в хуки

Обновить следующие хуки:
- `src/hooks/useProfile.tsx` - возвращать mockProfile
- `src/hooks/useTracks.ts` - возвращать mockTracks  
- `src/hooks/useUserCredits.ts` - возвращать mockCredits
- `src/hooks/useProjects.ts` - возвращать mockProjects

#### 1.3 Исправление позиционирования баннеров

```tsx
// GuestModeBanner.tsx - учёт safe areas
className="fixed top-0 left-0 right-0 z-50"
style={{
  paddingTop: 'max(env(safe-area-inset-top), var(--tg-safe-area-inset-top, 0px))'
}}
```

### Фаза 2: Унификация компонентов (2-3 дня)

#### 2.1 Создание UnifiedEmptyState

```tsx
// src/components/ui/unified-empty-state.tsx
interface EmptyStateProps {
  type: 'tracks' | 'projects' | 'playlists' | 'artists' | 'search';
  action?: { label: string; onClick: () => void };
  className?: string;
}

export const UnifiedEmptyState = ({ type, action }: EmptyStateProps) => {
  const configs = {
    tracks: {
      icon: Music,
      title: 'Нет треков',
      description: 'Создайте свой первый трек с помощью AI',
      actionLabel: 'Создать трек',
    },
    // ...
  };
};
```

#### 2.2 Skeleton компоненты

Создать:
- `TrackCardSkeleton` - для списков треков
- `ProjectCardSkeleton` - для проектов
- `ProfileSkeleton` - для профиля
- `PlayerSkeleton` - для плеера

#### 2.3 Индикатор версии в плеере

```tsx
// В CompactPlayer.tsx
<Badge variant="outline" className="text-[10px] px-1.5">
  {activeVersion?.version_label || 'A'}
</Badge>
```

### Фаза 3: UX улучшения (2-3 дня)

#### 3.1 Page Transitions

```tsx
// src/components/PageTransition.tsx
import { motion, AnimatePresence } from '@/lib/motion';

export const PageTransition = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
);
```

#### 3.2 Haptic Feedback

```tsx
// src/hooks/useHaptic.ts
export const useHaptic = () => {
  const trigger = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error') => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      const feedback = window.Telegram.WebApp.HapticFeedback;
      switch (type) {
        case 'light': feedback.impactOccurred('light'); break;
        case 'medium': feedback.impactOccurred('medium'); break;
        case 'heavy': feedback.impactOccurred('heavy'); break;
        case 'success': feedback.notificationOccurred('success'); break;
        case 'error': feedback.notificationOccurred('error'); break;
      }
    }
  };
  return { trigger };
};
```

#### 3.3 Theme Toggle

```tsx
// src/components/ThemeToggle.tsx
const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? <Sun /> : <Moon />}
    </Button>
  );
};
```

### Фаза 4: Полировка (1-2 дня)

#### 4.1 Micro-interactions

- Hover эффекты на карточках
- Press states на кнопках
- Loading shimmer на изображениях
- Reveal анимации для списков

#### 4.2 Accessibility

- Focus visible стили
- ARIA labels
- Keyboard navigation
- Screen reader support

#### 4.3 Performance

- Lazy loading для heavy компонентов
- Image optimization
- Bundle splitting
- Prefetching критических роутов

---

## 📱 Приоритетные экраны для улучшения

| Экран | Приоритет | Основные улучшения |
|-------|-----------|-------------------|
| **Главная** | 🔴 High | Hero section, skeleton loading, better empty states |
| **Библиотека** | 🔴 High | Virtualization, swipe actions, version indicators |
| **Плеер** | 🔴 High | Version badge, better controls, lyrics sync |
| **Генерация** | 🟡 Medium | Form validation UX, preview, tips |
| **Профиль** | 🟡 Medium | Stats visualization, achievements display |
| **Проекты** | 🟡 Medium | Project cards, progress indicators |
| **Настройки** | 🟢 Low | Theme toggle, better organization |

---

## 🔧 Технические требования

### Файлы для создания

```
src/
├── components/
│   ├── ui/
│   │   ├── unified-empty-state.tsx
│   │   ├── skeleton/
│   │   │   ├── track-card-skeleton.tsx
│   │   │   ├── project-card-skeleton.tsx
│   │   │   └── profile-skeleton.tsx
│   │   └── page-transition.tsx
│   └── theme/
│       └── ThemeToggle.tsx
├── hooks/
│   ├── useHaptic.ts
│   └── usePageTransition.ts
└── lib/
    └── haptic.ts
```

### Файлы для обновления

- `src/pages/NotFound.tsx` - контекстные сообщения
- `src/hooks/useProfile.tsx` - screenshot mode
- `src/hooks/useTracks.ts` - screenshot mode
- `src/components/GuestModeBanner.tsx` - safe areas
- `src/components/player/CompactPlayer.tsx` - version badge
- `src/components/player/ExpandedPlayer.tsx` - version badge
- `src/components/MainLayout.tsx` - page transitions

---

## ✅ Чек-лист реализации

### Фаза 1: Критические
- [ ] Улучшить NotFound страницу
- [ ] Интегрировать screenshot mode в useProfile
- [ ] Интегрировать screenshot mode в useTracks
- [ ] Исправить позиционирование баннеров

### Фаза 2: Унификация
- [ ] Создать UnifiedEmptyState
- [ ] Создать TrackCardSkeleton
- [ ] Создать ProjectCardSkeleton
- [ ] Добавить version badge в плеер

### Фаза 3: UX
- [ ] Реализовать PageTransition
- [ ] Добавить useHaptic хук
- [ ] Создать ThemeToggle
- [ ] Интегрировать haptic в ключевые действия

### Фаза 4: Полировка
- [ ] Добавить micro-interactions
- [ ] Улучшить accessibility
- [ ] Оптимизировать performance
- [ ] Тестирование на устройствах

---

## 📈 Ожидаемые результаты

1. **UX Score:** +15-20% (на основе user feedback)
2. **Loading perceived time:** -30% (skeleton screens)
3. **Error recovery:** +50% (better error states)
4. **Engagement:** +10% (haptic feedback, animations)
5. **Accessibility:** WCAG 2.1 AA compliance

---

## 📝 Примечания

- Все изменения должны быть mobile-first
- Использовать существующие design tokens из `index.css`
- Следовать паттернам из `src/lib/errors` для обработки ошибок
- Тестировать в Telegram Mini App на iOS и Android
