# Sprint 022: Bundle Optimization & Performance

**Спринт**: 022 - Bundle Size Optimization  
**Период**: 2025-12-09 — 2026-01-28  
**Статус**: ✅ ЗАВЕРШЁН (Phase 1.1)  
**Цель**: Уменьшить размер бандла с 1.16MB до <800KB

---

## 📊 Текущие метрики

| Метрика | До | После Phase 1.1 | Цель |
|---------|-----|-----------------|------|
| Bundle size | 1.16 MB | ~1.0 MB | <800 KB |
| Vendor chunks | 12 | 14 (оптимизированы) | ✅ |
| Tree-shaking | Базовый | Улучшенный | ✅ |
| Code splitting | Страницы | + Компоненты | ✅ |
| lucide-react | 37 файлов | Централизовано | ✅ |
| OSMD chunk | В vendor-other | Отдельный vendor-osmd | ✅ |

---

## ✅ Выполненные задачи

### OPT-001: Улучшение Tree-shaking ✅
- Обновлен target с `es2015` на `esnext`
- Включен `treeshake.preset: "recommended"`
- Добавлен `moduleSideEffects: false`
- Увеличено количество проходов terser до 3

### OPT-002: Оптимизация framer-motion ✅
- Создан `src/lib/motion.ts` с оптимизированными экспортами
- Добавлены готовые animation presets (fadeIn, slideUp, scaleIn)
- Добавлены transition presets для консистентности
- Экспортированы дополнительные хуки (useReducedMotion, animate, stagger)

### OPT-003: Lazy Loading компонентов ✅
- Создан `src/components/lazy/index.ts` с 35+ lazy компонентами
- Добавлены preload utilities для route-based предзагрузки
- Все тяжёлые компоненты (>50KB) лениво загружаются

### OPT-004: Оптимизация vendor chunks ✅
- Разделен date-fns на dayjs (меньше размер)
- Улучшено кеширование статических ресурсов
- Bundle analyzer настроен (`dist/stats.html`)
- Добавлен отдельный чанк `vendor-osmd` для opensheetmusicdisplay

### OPT-005: Централизация lucide-react ✅ (NEW)
- Создан `src/lib/icons.ts` с 200+ экспортированными иконками
- Мигрированы базовые UI компоненты:
  - dialog.tsx
  - sheet.tsx
  - accordion.tsx
  - select.tsx
  - dropdown-menu.tsx
  - loading-state.tsx
- Обновлена документация `docs/BUNDLE_OPTIMIZATION.md`

### OPT-006: Dynamic imports для тяжёлых библиотек ✅
- `opensheetmusicdisplay` уже использует dynamic import
- `wavesurfer.js` уже использует dynamic import
- Отдельные vendor chunks для изоляции

---

## 📁 Изменённые файлы (Phase 1.1)

1. `vite.config.ts` - Добавлен vendor-osmd чанк
2. `src/lib/icons.ts` - Централизованный модуль иконок (NEW)
3. `src/components/ui/dialog.tsx` - Миграция на @/lib/icons
4. `src/components/ui/sheet.tsx` - Миграция на @/lib/icons
5. `src/components/ui/accordion.tsx` - Миграция на @/lib/icons
6. `src/components/ui/select.tsx` - Миграция на @/lib/icons
7. `src/components/ui/dropdown-menu.tsx` - Миграция на @/lib/icons
8. `src/components/ui/loading-state.tsx` - Миграция на @/lib/icons
9. `docs/BUNDLE_OPTIMIZATION.md` - Обновлена документация

---

## 📈 Bundle Analysis

После сборки проекта, отчёт доступен в `dist/stats.html`:
- Визуализация размеров чанков
- gzip и brotli размеры
- Зависимости между модулями

### Vendor Chunks

| Chunk | Содержимое |
|-------|-----------|
| vendor-react | React, ReactDOM, Router, Zustand |
| vendor-framer | framer-motion |
| vendor-radix | Radix UI, shadcn/ui |
| vendor-query | TanStack Query |
| vendor-supabase | Supabase client |
| vendor-wavesurfer | wavesurfer.js |
| vendor-tone | Tone.js |
| vendor-osmd | opensheetmusicdisplay |
| vendor-icons | lucide-react |
| vendor-charts | recharts |
| vendor-dnd | @dnd-kit, @hello-pangea/dnd |
| vendor-forms | react-hook-form, zod |

---

## 🎯 Следующие шаги (Phase 1.2+)

1. **Service Worker** - offline-first кэширование (P2)
2. **Image optimization** - WebP, srcset, lazy loading (P2)
3. **Продолжить миграцию** - остальные 30+ файлов на @/lib/icons
4. **Перейти к Phase 2** - Spec 032 Professional UI

---

*Создано: 2025-12-09*  
*Обновлено: 2026-01-28*
