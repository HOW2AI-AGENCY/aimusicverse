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

## 2. Оптимизация lucide-react

### Проблема
`lucide-react` содержит 1000+ иконок. Импорт напрямую может приводить к включению неиспользуемых иконок.

### Решение
Используйте централизованные импорты из `@/lib/icons`:

```typescript
// ❌ Плохо - прямой импорт
import { Heart, Play, Pause } from 'lucide-react';

// ✅ Хорошо - централизованный импорт
import { Heart, Play, Pause } from '@/lib/icons';
```

### Категории иконок

| Категория | Примеры |
|-----------|---------|
| Navigation | Home, Menu, ChevronDown, ArrowLeft |
| Media | Play, Pause, Volume, Music, Mic |
| Actions | Plus, Edit, Trash, Save, Download |
| Status | Loader2, CheckCircle, AlertTriangle |
| Content | FileText, Folder, Tag, Image |
| Social | MessageSquare, Users, Globe |
| Studio | Piano, Guitar, Sliders, Waves |

## 3. Lazy Loading компонентов

Тяжёлые компоненты загружаются лениво через `@/components/lazy`:

```typescript
import { 
  LazyGenerateSheet,
  LazyLyricsChatAssistant,
  LazyTrackDetailSheet,
  LazyAudioVisualizer,
  LazyMusicGraph,
  LazyOnboardingSlider,
} from '@/components/lazy';

// Использование с Suspense
<Suspense fallback={<LoadingSpinner />}>
  <LazyGenerateSheet />
</Suspense>
```

## 4. Vendor Chunks

Vite разбивает node_modules на отдельные чанки:

| Chunk | Содержимое |
|-------|-----------|
| vendor-react | React, ReactDOM, React Router, Zustand |
| vendor-framer | framer-motion |
| vendor-radix | Radix UI, shadcn/ui |
| vendor-query | TanStack Query |
| vendor-supabase | Supabase client |
| vendor-wavesurfer | wavesurfer.js |
| vendor-tone | Tone.js |
| vendor-osmd | opensheetmusicdisplay |
| vendor-icons | lucide-react |
| vendor-date | dayjs |
| vendor-charts | recharts |
| vendor-dnd | @dnd-kit, @hello-pangea/dnd |
| vendor-forms | react-hook-form, zod |

## 5. Bundle Analyzer

После сборки (`npm run build`) отчёт доступен в `dist/stats.html`:

- Визуализация размеров чанков
- gzip и brotli размеры
- Дерево зависимостей

## 6. Compression

Production сборка создаёт сжатые версии:
- `.gz` - gzip (для большинства CDN)
- `.br` - brotli (лучшее сжатие)

## 7. Dynamic Imports для тяжёлых библиотек

Библиотеки, которые используют dynamic import:
- `opensheetmusicdisplay` - загружается только в нотном view
- `wavesurfer.js` - загружается только при работе с waveform

```typescript
// Пример из useMusicXML.ts
const mod = await import('opensheetmusicdisplay');
const OpenSheetMusicDisplay = mod.OpenSheetMusicDisplay;
```

## Метрики

| Метрика | Phase 0 | Phase 1 | Цель |
|---------|---------|---------|------|
| vendor-other | 184 KB | TBD | <150 KB |
| Total bundle | ~1.16 MB | TBD | <800 KB |
| LCP | TBD | TBD | <2.5s |
| TTI | TBD | TBD | <3.5s |

## Чеклист для новых компонентов

- [ ] Использовать `@/lib/motion` вместо `framer-motion`
- [ ] Использовать `@/lib/icons` вместо `lucide-react`
- [ ] Добавить lazy loading для компонентов >50KB
- [ ] Использовать именованные импорты
- [ ] Избегать barrel imports где возможно
- [ ] Проверять bundle analyzer после добавления зависимостей
