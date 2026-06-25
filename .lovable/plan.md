# План дальнейшей работы над MusicVerse AI

Опираясь на завершённые Этапы 1–2 (motion tree-shaking, lazy images, audio cleanup, ESLint guard, SEO на 6 страницах, фикс динамических импортов), ниже — структурированный план следующих итераций.

## Этап 3 — Стабильность и качество кода (приоритет: высокий)

1. **Полная миграция `console.*` → `logger`** (~33 файла)
   - Группы: `src/lib/*`, `src/services/*`, `src/components/admin/*`, `src/hooks/*`
   - Сохранение сигнатур: `console.error(msg, err)` → `logger.error(msg, err, ctx?)`
   - Отдельный проход по edge-функциям (`supabase/functions/*`) пропускаем — там свой logger
2. **Фикс существующих ошибок типизации**
   - `TrackCardSkeleton`, `TrackListSkeleton` — устранить TS-ошибки (обнаружены ранее)
   - Запустить `tsgo` глобально, собрать список и закрыть пакетами по 5–10 файлов
3. **ESLint расширение**
   - Запретить прямой `from "lucide-react"` (заставлять `@/lib/icons`)
   - Запретить `console.*` (warn-уровень) кроме `src/lib/logger.ts`

## Этап 4 — Производительность (приоритет: высокий)

4. **Bundle audit**
   - Запустить `npm run size:why`, выявить топ-5 чанков-перевесов
   - Кандидаты на разделение: `feature-studio` (UnifiedStudioStore 38KB), `vendor-tone`, `vendor-wavesurfer`
   - Lazy-load Tone.js/Wavesurfer только в Studio-маршрутах
5. **Audio Element Pool — полная миграция**
   - Перевести оставшиеся `new Audio()` в `ABCompareOverlay`, `QuickCompare`, `SectionVariantOverlay` на `audioElementPool.acquire/release`
   - Критично для iOS Safari (>10 элементов = краш)
6. **Image optimization pipeline**
   - Подключить `vite-imagetools` для AVIF/WebP вариантов hero/cover изображений
   - Preload LCP-изображения на `Index`, `Pricing`, `AlbumView`

## Этап 5 — UX и мобильный опыт (приоритет: средний)

7. **Telegram Mini App полировка**
   - Аудит safe-area на всех страницах (особенно модалки/sheets)
   - Унификация `BackButton` через `useTelegramBackButton` (см. mem://infrastructure/telegram/back-button-navigation)
   - `MainButton` для ключевых CTA (генерация, публикация)
8. **Haptic feedback**
   - Применить стандарт `impact()` ко всем интерактивам по ТЗ из mem://ux/standardized-haptic-feedback
9. **SEOHead — расширение покрытия**
   - Добавить на остальные 30 публичных страниц (динамические: ProjectDetail, TrackDetail)
   - JSON-LD `MusicRecording`, `MusicAlbum`, `Person` для богатых сниппетов

## Этап 6 — Архитектурный рефакторинг (приоритет: средний)

10. **Разделение крупных файлов**
    - `useUnifiedStudioStore` (38KB) → доменные slices: playback, sections, stems, history
    - `GlobalAudioProvider` (625 строк) → выделить хуки: `useAudioElement`, `useMediaSession`, `usePlaybackQueue`
11. **API/Service layer консистентность**
    - Аудит: все компоненты обращаются к Supabase ТОЛЬКО через `src/api/*` или `src/services/*`
    - Запрет прямого `supabase.from()` в компонентах через ESLint-правило

## Этап 7 — Тесты и CI (приоритет: ниже)

12. **Unit-coverage критичных модулей**
    - `audioElementPool`, `logger`, `secure_credit_update`, `useVersionSwitcher` — цель 80%
13. **E2E Playwright smoke**
    - Сценарии: генерация → A/B → публикация; стем-сепарация; шаринг в Telegram
14. **Bundle-size gate в CI** (если ещё нет) — fail > 950 KB

## Технические заметки

- Все изменения — инкрементальными PR (3–5 файлов за раз), без переноса бизнес-логики
- Перед каждым этапом — `tsgo` и `npm run size`
- Логирование изменений — в `.lovable/plan.md` для трассируемости

## Что НЕ делаем сейчас

- Большой UI-редизайн (нет запроса от пользователя)
- Миграция на React Server Components / Next.js (стек зафиксирован)
- Замена Zustand на Redux/Jotai (текущий стек стабилен)

---

**Вопрос перед стартом:** с какого этапа начинаем? Рекомендую **Этап 3 (п.1 — console→logger по группам) + п.4 (bundle audit)** параллельно, так как они независимы и дают быстрый измеримый эффект.