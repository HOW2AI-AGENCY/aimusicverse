# Bundle Optimization Guide

## Обзор

Проект использует несколько стратегий для оптимизации размера бандла:

## 1. Оптимизация framer-motion

### Проблема
`framer-motion` — тяжёлая библиотека (~150KB). Прямые импорты не позволяют tree-shaking работать эффективно.

### Решение
Используйте оптимизированные импорты из `@/lib/motion`:

```typescript
// ❌ Плохо - прямой импорт
import { motion, AnimatePresence } from 'framer-motion';

// ✅ Хорошо - оптимизированный импорт
import { motion, AnimatePresence, fadeIn, slideUp } from '@/lib/motion';
```

### Доступные экспорты

**Компоненты:**
- `motion` - основной компонент анимации
- `AnimatePresence` - анимации появления/исчезновения

**Хуки:**
- `useAnimation` - программное управление анимациями
- `useMotionValue` - реактивные значения
- `useTransform` - преобразования значений
- `useSpring` - spring-анимации
- `useDragControls` - drag контролы
- `useScroll` - отслеживание скролла
- `useInView` - отслеживание видимости
- `useReducedMotion` - предпочтения пользователя
- `useAnimationFrame` - requestAnimationFrame
- `animate` - императивные анимации
- `stagger` - задержки между элементами

**Готовые пресеты:**
- `fadeIn` - плавное появление
- `slideUp` - появление снизу
- `slideInFromRight` - появление справа
- `scaleIn` - масштабирование
- `staggerContainer` - контейнер с задержками
- `staggerItem` - элементы с задержкой

**Пресеты переходов:**
- `springTransition` - spring эффект
- `smoothTransition` - плавный переход
- `quickTransition` - быстрый переход

## 2. Lazy Loading компонентов

Тяжёлые компоненты загружаются лениво через `@/components/lazy`:

```typescript
import { 
  LazyUploadAudioDialog,
  LazyGenerateSheet,
  LazyLyricsChatAssistant,
  LazyTrackDetailSheet,
  LazyAudioVisualizer,
  LazyMusicGraph,
  LazyOnboardingSlider,
  LazyTrackAnalytics
} from '@/components/lazy';

// Использование с Suspense
<Suspense fallback={<LoadingSpinner />}>
  <LazyGenerateSheet />
</Suspense>
```

## 3. Vendor Chunks

Vite разбивает node_modules на отдельные чанки:

| Chunk | Содержимое |
|-------|-----------|
| vendor-react | React, ReactDOM, React Router, Zustand |
| vendor-framer | framer-motion |
| vendor-radix | Radix UI, shadcn/ui |
| vendor-query | TanStack Query |
| vendor-supabase | Supabase client |
| vendor-audio | wavesurfer.js |
| vendor-icons | lucide-react |
| vendor-date | date-fns core |
| vendor-date-locale | date-fns locales |
| vendor-charts | recharts |
| vendor-dnd | @dnd-kit, @hello-pangea/dnd |
| vendor-forms | react-hook-form, zod |

## 4. Bundle Analyzer

После сборки (`npm run build`) отчёт доступен в `dist/stats.html`:

- Визуализация размеров чанков
- gzip и brotli размеры
- Дерево зависимостей

## 5. Compression

Production сборка создаёт сжатые версии:
- `.gz` - gzip (для большинства CDN)
- `.br` - brotli (лучшее сжатие)

## Метрики

| Метрика | До оптимизации | После | Цель |
|---------|----------------|-------|------|
| Bundle size | 1.16 MB | TBD | <800 KB |
| LCP | TBD | TBD | <2.5s |
| TTI | TBD | TBD | <3.5s |

## Чеклист для новых компонентов

- [ ] Использовать `@/lib/motion` вместо `framer-motion`
- [ ] Добавить lazy loading для компонентов >50KB
- [ ] Использовать именованные импорты для lucide-react
- [ ] Избегать barrel imports где возможно
- [ ] Проверять bundle analyzer после добавления зависимостей
