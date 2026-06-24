# 🎨 Дизайн-система MusicVerse AI — Полное руководство

**Версия:** 2.0  
**Дата обновления:** 24 июня 2026  
**Статус:** Production Ready  
**Автор:** Design System Team

---

## 📑 Содержание

- [Введение](#-введение)
- [Типография](#-типография)
- [Цвета](#-цвета)
- [Spacing](#-spacing)
- [Breakpoints](#-breakpoints)
- [Z-Index](#-z-index)
- [Safe Areas](#-safe-areas)
- [Touch Targets](#-touch-targets)
- [Shadows & Elevation](#-shadows--elevation)
- [Motion & Animation](#-motion--animation)
- [Компоненты](#-компоненты)
- [Адаптивные паттерны](#-адаптивные-паттерны)

---

## 🎯 Введение

MusicVerse AI использует профессиональную дизайн-систему, построенную на основе:
- **Tailwind CSS 3.4** для утилит
- **CSS переменные** для токенов
- **Mobile-first подход** для адаптивности
- **Semantic классы** для семантики

### Ключевые принципы:

1. **Мобильность** — Всё работает на 375px–4k экранах
2. **Доступность** — WCAG AA, touch targets 44–56px
3. **Производительность** — Оптимизированные классы
4. **Семантика** — Именованные токены вместо magic numbers

---

## 🔤 Типография

### Шкала размеров

| Класс | Размер | Высота строки | Вес | Использование |
|:------|:-------|:-------------|:----|:-------------|
| `text-display-1` | 2.5rem (40px) | 1.2 | 700 | Главные заголовки |
| `text-display-2` | 2rem (32px) | 1.25 | 600 | Крупные заголовки |
| `text-heading-1` | 1.5rem (24px) | 1.3 | 600 | Заголовки страниц |
| `text-heading-2` | 1.25rem (20px) | 1.35 | 600 | Подзаголовки |
| `text-heading-3` | 1.125rem (18px) | 1.4 | 500 | Малые заголовки |
| `text-body-lg` | 1rem (16px) | 1.6 | 400 | Основной текст |
| `text-body` | 0.875rem (14px) | 1.5 | 400 | Стандартный текст |
| `text-body-sm` | 0.8125rem (13px) | 1.5 | 400 | Мелкий текст |
| `text-caption` | 0.75rem (12px) | 1.4 | 400 | Подписи |
| `text-caption-sm` | 0.6875rem (11px) | 1.3 | 400 | Микротекст |

### Примеры использования

```tsx
// ✅ Главный заголовок страницы
<h1 className="text-display-1 font-bold">MusicVerse AI</h1>

// ✅ Подзаголовок страницы
<h2 className="text-heading-1">Создавайте музыку</h2>

// ✅ Основной текст контента
<p className="text-body">Описание трека...</p>

// ✅ Подпись с меньшим размером
<span className="text-caption text-muted-foreground">Дата создания</span>

// ✅ Мобильный заголовок (адаптивный)
<h2 className="text-heading-2 md:text-heading-1">Адаптивный</h2>
```

### Шрифты

```css
/* Inter — основной шрифт */
font-family: 'Inter', sans-serif;

/* Roboto Mono — монопространственный */
font-family: 'Roboto Mono', monospace;
```

---

## 🎨 Цвета

### Цветовая палитра (Light Mode)

| Переменная | HSL | RGB | Назначение |
|:-----------|:----:|:---:|:----------|
| Primary | 207 90% 54% | #0088CC | Основная цвет (Telegram Blue) |
| Secondary | 220 15% 92% | #E8EBEF | Фоны сторон |
| Accent | 207 80% 95% | #E8F4FF | Выделение |
| Success | 160 70% 42% | #00B369 | Успешные действия |
| Warning | 38 95% 50% | #FFB800 | Предупреждения |
| Destructive | 0 72% 51% | #EF4444 | Опасные действия |

### Цветовая палитра (Dark Mode)

```css
/* Dark Mode переменные использует те же структуру */
--background: 220 20% 7%;        /* #0F1419 */
--foreground: 220 10% 98%;       /* #F7F8FB */
--card: 220 18% 10%;             /* #141A25 */
--primary: 207 90% 54%;          /* #0088CC */
```

### Использование цветов

```tsx
// ✅ Первичная цветовая кнопка
<Button className="bg-primary text-primary-foreground">
  Действие
</Button>

// ✅ Вторичная кнопка
<Button variant="secondary">Отмена</Button>

// ✅ Текст успеха
<p className="text-success">Сохранено!</p>

// ✅ Фон карточки
<Card className="bg-card text-card-foreground">
  <CardContent>Контент</CardContent>
</Card>
```

### Секционные акценты

```css
/* Генерация музыки */
--generate: 250 80% 60%;

/* Библиотека треков */
--library: 207 90% 54%;

/* Проекты */
--projects: 175 70% 45%;

/* Сообщество */
--community: 330 75% 55%;
```

---

## 📐 Spacing

### Система сетки (4px base)

| Токен | Значение | Использование |
|:------|:---------|:-------------|
| `--space-1` | 0.25rem (4px) | Микроспейсы |
| `--space-2` | 0.5rem (8px) | Компактные отступы |
| `--space-3` | 0.75rem (12px) | Стандартные отступы |
| `--space-4` | 1rem (16px) | Основной спейс |
| `--space-5` | 1.25rem (20px) | Повышенный спейс |
| `--space-6` | 1.5rem (24px) | Расслабленный спейс |
| `--space-8` | 2rem (32px) | Большой спейс |
| `--space-10` | 2.5rem (40px) | Очень большой |
| `--space-12` | 3rem (48px) | Максимальный спейс |

### Tailwind классы

```tsx
// ✅ Padding
<div className="p-4">       {/* 16px всё стороны */}
<div className="px-4 py-3"> {/* 16px горизонтально, 12px вертикально */}
<div className="pt-4">      {/* 16px только сверху */}

// ✅ Margin
<div className="m-4">       {/* 16px всё стороны */}
<div className="mx-auto">   {/* Центрирование */}
<div className="mb-8">      {/* 32px снизу */}

// ✅ Gap между элементами
<div className="gap-3">     {/* 12px между элементами flex/grid */}
<div className="gap-2">     {/* 8px между элементами */}
```

### Адаптивный спейс

```tsx
// ✅ Мобильный: 12px, планшет: 16px, десктоп: 24px
<div className="p-3 md:p-4 lg:p-6">
  Контент
</div>

// ✅ Компактный спейс на мобилях
<div className="flex flex-col gap-2 md:gap-4">
  {items.map(item => <ItemCard key={item.id} />)}
</div>
```

---

## 📱 Breakpoints

### Точки разрыва (responsive)

| Breakpoint | Значение | Вес | Использование |
|:-----------|:---------|:----|:-------------|
| `xs` | 375px | — | Extra small phones |
| `sm` | 640px | — | Small phones |
| `md` | 768px | 📱 | Tablets |
| `lg` | 1024px | 💻 | Desktops |
| `xl` | 1280px | 💻 | Large desktops |
| `2xl` | 1536px | 🖥️ | Very large |
| `3xl` | 1920px | 🖥️ | Ultra-wide |
| `4xl` | 2560px | 🖥️ | 4K |

### Mobile-first подход

```tsx
// ✅ Мобильный 100%, планшет 50%, десктоп 33%
<div className="w-full md:w-1/2 lg:w-1/3">
  Сетка контента
</div>

// ✅ Скрыто на мобилях, видно на десктопе
<div className="hidden md:block">
  Desktop only
</div>

// ✅ Видно на мобилях, скрыто на большом экране
<div className="md:hidden">
  Mobile menu
</div>

// ✅ Адаптивный шрифт
<h1 className="text-lg md:text-2xl lg:text-3xl">
  Адаптивный заголовок
</h1>
```

### Grid система

```tsx
// ✅ 1 колона на мобилях, 2 на планшетах, 3 на десктопе
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id}>{item}</Card>)}
</div>

// ✅ Автоматическая расстановка
<div className="grid auto-cols-max gap-2">
  {tags.map(tag => <Badge key={tag}>{tag}</Badge>)}
</div>
```

---

## 🔝 Z-Index

### Иерархия слоёв

| Уровень | Z-Index | Класс | Использование |
|:--------|:------:|:------|:-------------|
| Base | 0 | `z-base` | Основной контент |
| Raised | 10 | `z-raised` | Карточки, панели |
| Sticky | 20 | `z-sticky` | Липкие заголовки |
| Floating | 30 | `z-floating` | Плавающие кнопки |
| Overlay | 40 | `z-overlay` | Подложки |
| Navigation | 50 | `z-navigation` | Нижняя навигация |
| Player | 60 | `z-player` | Плеер |
| Contextual | 70 | `z-contextual` | Всплывающие подсказки |
| Fullscreen | 90 | `z-fullscreen` | Полноэкранный плеер |
| Dialog | 140 | `z-dialog` | Модальные окна |
| Sheet | 150–151 | `z-sheet-*` | Bottom sheets |
| Dropdown | 200 | `z-dropdown` | Выпадающие меню |
| Tooltip | 250 | `z-tooltip` | Подсказки |
| Toast | 300 | `z-toast` | Уведомления |
| Max | 9999 | `z-max` | Критические окна |

### Примеры использования

```tsx
// ✅ Липкий заголовок
<header className="sticky top-0 z-sticky">
  Заголовок
</header>

// ✅ Модальное окно
<Dialog>
  <DialogContent className="z-dialog">
    Содержимое диалога
  </DialogContent>
</Dialog>

// ✅ Bottom sheet над контентом
<Sheet>
  <SheetContent className="z-sheet-content">
    Лист контента
  </SheetContent>
  <div className="z-sheet-backdrop fixed inset-0" />
</Sheet>

// ✅ Нижняя навигация
<nav className="fixed bottom-0 left-0 right-0 z-navigation">
  Навигация
</nav>
```

---

## 🔒 Safe Areas

### Переменные для Telegram Mini App

```css
/* iOS notch / Dynamic Island */
--tg-safe-area-inset-top: 44px;
--tg-safe-area-inset-bottom: 34px;

/* Для контента (учитывает нативные кнопки) */
--tg-content-safe-area-inset-top: 0px;
--tg-content-safe-area-inset-bottom: 60px;

/* Стандартные CSS safe-area */
env(safe-area-inset-top)
env(safe-area-inset-bottom)
env(safe-area-inset-left)
env(safe-area-inset-right)
```

### Типичные значения

| Устройство | Top | Bottom | Примечание |
|:-----------|:---:|:------:|:----------|
| iPhone 15 Pro | 59px | 34px | Dynamic Island |
| iPhone SE | 44px | 34px | Стандартный notch |
| Android (notch) | 24px | 0px | Punch-hole |
| Android (no notch) | 0px | 0px | Нет особенностей |

### Применение safe areas

```tsx
// ✅ Заголовок с отступом для notch
<header 
  style={{ 
    paddingTop: 'max(var(--tg-content-safe-area-inset-top), env(safe-area-inset-top), 1rem)' 
  }}
>
  Заголовок
</header>

// ✅ Нижняя навигация с отступом
<nav 
  className="pb-[max(1rem,env(safe-area-inset-bottom))]"
>
  Навигация
</nav>

// ✅ Tailwind класс для удобства
<div className="pt-[max(env(safe-area-inset-top),1rem)]">
  Контент
</div>

// ✅ Боковые отступы на wide экранах
<main 
  style={{ 
    paddingLeft: 'max(1rem, env(safe-area-inset-left))',
    paddingRight: 'max(1rem, env(safe-area-inset-right))'
  }}
>
  Контент
</main>
```

### Рекомендуемые классы

```tsx
// Top safe area
.safe-top              /* Базовый */
.safe-top-compact      /* + 8px */
.safe-top-spacious     /* + 16px */

// Bottom safe area
.safe-bottom           /* Базовый */
.safe-bottom-nav       /* + 8px для навигации */
.safe-bottom-sheet     /* + 16px для sheets */

// Комбинированные
.safe-vertical         /* Top + bottom */
.safe-all             /* Все стороны */
```

---

## 👆 Touch Targets

### Минимальные размеры

| Размер | Значение | Использование |
|:-------|:---------|:-------------|
| Min | 44×44px | Минимум по iOS HIG |
| Comfortable | 48×48px | Стандартный размер |
| Large | 56×56px | Большие кнопки |

### Tailwind классы

```tsx
// ✅ Минимальный touch target
<button className="min-h-touch min-w-touch">
  Кнопка
</button>

// ✅ Удобный размер (48px)
<button className="min-h-touch-lg min-w-touch-lg">
  Кнопка
</button>

// ✅ Большой размер (56px)
<button className="min-h-touch-xl min-w-touch-xl">
  Большая кнопка
</button>

// ✅ Гибкий размер с padding
<button className="h-touch p-2 px-4">
  Кнопка с padding
</button>
```

### Спецификация для компонентов

```tsx
// ✅ Элемент списка (как минимум 56px высота)
<div className="min-h-[56px] flex items-center gap-3 px-4">
  <Avatar className="w-10 h-10" />
  <div className="flex-1">
    <p className="text-body">Заголовок</p>
  </div>
</div>

// ✅ Кнопки в меню (44px минимум)
<button className="h-11 w-11 p-2 flex items-center justify-center">
  <Icon className="w-5 h-5" />
</button>

// ✅ Форма контролей
<input 
  type="text" 
  className="h-touch px-3 py-2 border rounded"
  placeholder="Введите текст"
/>
```

---

## 💫 Shadows & Elevation

### Elevation уровни

| Уровень | Значение | Использование |
|:--------|:---------|:-------------|
| 0 | `none` | Base |
| 1 | `0 1px 2px` | Мягкая тень |
| 2 | `0 1px 3px` | Легкая тень |
| 3 | `0 4px 6px` | Стандартная тень |
| 4 | `0 10px 15px` | Средняя тень |
| 5 | `0 20px 25px` | Глубокая тень |

### CSS классы

```tsx
// ✅ Elevation тени
<Card className="shadow-elevation-2">
  Карточка
</Card>

// ✅ Glow эффект (для активных элементов)
<Button className="shadow-glow">
  Светящаяся кнопка
</Button>

// ✅ Glass эффект с тенью
<div className="shadow-glass">
  Glass морфизм
</div>

// ✅ Hover эффект
<div className="hover:shadow-hover transition">
  Элемент при наведении
</div>
```

---

## 🎬 Motion & Animation

### Duration tokens

| Токен | Значение | Использование |
|:------|:---------|:-------------|
| `instant` | 0ms | Мгновенно |
| `fast` | 100ms | Быстрые действия |
| `normal` | 200ms | Стандартные |
| `slow` | 300ms | Медленные |
| `slower` | 400ms | Более медленные |
| `slowest` | 500ms | Очень медленные |

### Easing функции

```css
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);   /* Стандартная */
--ease-in: cubic-bezier(0.4, 0, 1, 1);          /* Ускорение */
--ease-out: cubic-bezier(0, 0, 0.2, 1);         /* Замедление */
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1); /* Пружина */
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275); /* Отскок */
```

### Примеры анимаций

```tsx
// ✅ Плавный переход
<div className="transition-all duration-normal">
  Плавное изменение
</div>

// ✅ Быстрый hover эффект
<button className="transition-colors duration-fast hover:bg-primary">
  Кнопка
</button>

// ✅ Пульсирующий glow эффект
<div className="animate-pulse-glow">
  Пульсирующий элемент
</div>

// ✅ Shimmer загрузка
<div className="animate-shimmer bg-gradient-to-r">
  Загрузка...
</div>

// ✅ Вращение винила
<div className="animate-vinyl-spin">
  🎵 Воспроизведение
</div>
```

---

## 🧩 Компоненты

### Мобильные компоненты

#### MobileListItem
```tsx
import { MobileListItem } from '@/components/mobile';

<MobileListItem
  title="Название трека"
  subtitle="Артист"
  leading={<Avatar />}
  trailing={<Badge>NEW</Badge>}
  showChevron
  onClick={handleClick}
/>
```

**Особенности:**
- Минимальная высота 56px
- Touch-оптимизированные отступы
- Поддержка иконок слева/справа
- Active/disabled состояния

#### MobileHeaderBar
```tsx
import { MobileHeaderBar } from '@/components/mobile';

<MobileHeaderBar
  title="Заголовок"
  subtitle="Подзаголовок"
  onBack={() => navigate(-1)}
  sticky
/>
```

**Особенности:**
- Safe area support
- Sticky/transparent режимы
- Кнопки для навигации
- Custom контент поддержка

#### MobileFormField
```tsx
import { MobileFormField } from '@/components/mobile/forms';

<MobileFormField
  label="BPM"
  description="Beats per minute"
  error={errors.bpm}
  required
>
  <Input type="number" min={60} max={200} />
</MobileFormField>
```

**Особенности:**
- Label, description, error сообщения
- Required индикатор
- Consistent spacing

### Карточки и контейнеры

```tsx
// ✅ Базовая карточка
<Card className="bg-card">
  <CardHeader>
    <CardTitle>Заголовок</CardTitle>
  </CardHeader>
  <CardContent>
    Содержимое карточки
  </CardContent>
</Card>

// ✅ Карточка с изображением
<Card className="overflow-hidden">
  <img src="cover.jpg" className="w-full h-40 object-cover" />
  <CardContent className="p-4">
    Данные трека
  </CardContent>
</Card>

// ✅ Фуллскрин модальное окно
<Sheet>
  <SheetContent 
    className="h-[100dvh] flex flex-col"
    style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}
  >
    Модальное содержимое
  </SheetContent>
</Sheet>
```

---

## 📐 Адаптивные паттерны

### Паттерн 1: Мобильный → Планшет → Десктоп

```tsx
function ResponsiveLayout() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Мобильный: 1 колона */}
      {/* Планшет (768px+): 2 колоны */}
      {/* Десктоп (1024px+): 3 колоны */}
      {items.map(item => (
        <Card key={item.id}>
          {item.name}
        </Card>
      ))}
    </div>
  );
}
```

### Паттерн 2: Скрытие элементов по размеру

```tsx
function ConditionalRender() {
  return (
    <>
      {/* Показать только на мобилях */}
      <MobileMenu className="md:hidden" />
      
      {/* Показать только на десктопе */}
      <DesktopMenu className="hidden md:block" />
      
      {/* Адаптивная кнопка */}
      <Button 
        size="sm" 
        className="md:size-md lg:size-lg"
      >
        Действие
      </Button>
    </>
  );
}
```

### Паттерн 3: Адаптивный спейс

```tsx
function SpaceResponsive() {
  return (
    <div className="p-3 md:p-4 lg:p-6">
      {/* Мобильный: 12px */}
      {/* Планшет: 16px */}
      {/* Десктоп: 24px */}
      <h1 className="text-heading-2 md:text-heading-1 lg:text-display-2">
        Адаптивный заголовок
      </h1>
      <p className="text-body-sm md:text-body text-muted-foreground mt-2 md:mt-3">
        Адаптивный текст
      </p>
    </div>
  );
}
```

### Паттерн 4: Адаптивная Flexbox

```tsx
function FlexResponsive() {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:gap-6 md:items-center">
      {/* Мобильный: вертикально, 12px гап */}
      {/* Планшет+: горизонтально, 24px гап, центрирование */}
      <img 
        src="cover.jpg" 
        className="w-full md:w-40 h-40 md:h-40 object-cover rounded-lg"
      />
      <div className="flex-1">
        <h2 className="text-heading-2">Название</h2>
        <p className="text-body-sm text-muted-foreground">Описание</p>
      </div>
    </div>
  );
}
```

### Паттерн 5: Контейнер с max-width

```tsx
function ResponsiveContainer() {
  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
      {/* Всегда по центру, максимум 1152px */}
      {/* Горизонтальный padding адаптивен */}
      <Content />
    </main>
  );
}
```

### Паттерн 6: CSS Grid адаптивность

```tsx
function GridResponsive() {
  return (
    <div className="grid 
      grid-cols-[repeat(auto-fit,minmax(280px,1fr))] 
      gap-4
    ">
      {/* Автоматическое количество колон */}
      {/* Минимум 280px на элемент */}
      {/* Максимум доступная ширина */}
      {items.map(item => (
        <Card key={item.id}>{item.name}</Card>
      ))}
    </div>
  );
}
```

---

## 🌗 Dark Mode

### Переключение

```tsx
// Автоматическое определение (по системе)
import { useEffect } from 'react';

export function DarkModeToggle() {
  const toggleDarkMode = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
    } else {
      html.classList.add('dark');
    }
  };

  return (
    <Button onClick={toggleDarkMode}>
      🌙 Темная тема
    </Button>
  );
}
```

### CSS переменные автоматически обновляются

```css
/* Light theme */
:root {
  --background: 220 20% 98%;
  --foreground: 220 25% 10%;
}

/* Dark theme */
.dark {
  --background: 220 20% 7%;
  --foreground: 220 10% 98%;
}
```

---

## 📋 Чеклист для новых компонентов

При создании нового компонента проверьте:

- [ ] **Типография** — Используются ли семантические размеры (`text-body`, `text-heading-1`)?
- [ ] **Спейс** — Используются ли правильные отступы (`p-4`, `gap-3`)?
- [ ] **Цвет** — Применяются ли CSS переменные (`text-primary`, `bg-card`)?
- [ ] **Breakpoints** — Есть ли адаптивные классы (`md:`, `lg:`)?
- [ ] **Touch targets** — Кнопки минимум 44×44px?
- [ ] **Z-index** — Используется ли семантический класс (`z-dialog`)?
- [ ] **Dark mode** — Работает ли в тёмной теме?
- [ ] **Тестирование** — Тестировано ли на реальных устройствах?

---

## 📚 Файлы системы

| Файл | Назначение |
|:-----|:----------|
| `tailwind.config.ts` | Tailwind конфигурация |
| `src/index.css` | CSS токены и утилиты |
| `src/constants/z-index.ts` | Z-index константы |
| `src/constants/safe-area.ts` | Safe area константы |
| `src/lib/design-tokens.ts` | Токены типографии |

---

## 🔗 Связанная документация

- [LAYOUT_SYSTEM.md](./LAYOUT_SYSTEM.md) — Система расположения
- [SAFE_AREA_GUIDELINES.md](./SAFE_AREA_GUIDELINES.md) — Safe area гайдлайны
- [MOBILE_COMPONENTS.md](./MOBILE_COMPONENTS.md) — Мобильные компоненты
- [Z_INDEX_HIERARCHY.md](./Z_INDEX_HIERARCHY.md) — Z-index иерархия

---

**Версия:** 2.0 | **Статус:** Production Ready | **Последнее обновление:** 24 июня 2026
