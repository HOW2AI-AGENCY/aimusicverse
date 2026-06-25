# Следующий батч (продолжение плана)

Этап 3 пп.1–2 завершены (console→logger в 6 файлах, skeleton-экспорты починены, типы зелёные). Дальше — компактные подшаги, каждый автономен.

## Батч A — Этап 3 п.3: ESLint guards (быстро)

1. `eslint.config.js` — добавить правила:
   - `no-restricted-imports` для `lucide-react` → требовать `@/lib/icons`
     - Исключение: сам `src/lib/icons.ts`
   - `no-console` (warn) с `allow: ['warn','error']` отключить — оставить полный запрет
     - Исключения: `src/lib/logger.ts`, `src/lib/sentry.ts`, `src/lib/debug/**`, `supabase/functions/**`
   - `no-restricted-syntax` против `supabase.from(` в `src/components/**` и `src/pages/**` (warn-уровень — фиксим постепенно)

## Батч B — Этап 4 п.5: Audio Element Pool полная миграция

2. Перевести `ABCompareOverlay.tsx`, `QuickCompare.tsx`, `SectionVariantOverlay.tsx` (если есть) с `new Audio()` на `audioElementPool.acquire()/release()`:
   - При unmount — обязательный `release()`
   - Проверить, что `usePlayerStore` не конфликтует (превью-плееры изолированы)
3. Аудит: `rg "new Audio\("` по `src/components` — список оставшихся точек и краткий отчёт.

## Батч C — Этап 5 п.9: SEOHead на динамические страницы

4. Добавить `SEOHead` с динамическим title/description/canonical + JSON-LD:
   - `ProjectDetail.tsx` → `MusicAlbum` schema
   - `TrackDetailPage` (если есть отдельная route) → `MusicRecording` schema
   - `PlaylistDetail` (если есть) → `MusicPlaylist`
5. Проверить, что `canonical` и `og:url` указывают на текущий маршрут (не на homepage).

## Что НЕ трогаем в этом батче

- Bundle audit (`size:why`) — выполняется командой пользователя, отдельным шагом после батча B
- Разделение `useUnifiedStudioStore` и `GlobalAudioProvider` — крупный рефакторинг, отдельная сессия
- Telegram polish (BackButton/MainButton/haptics) — большой объём, после батчей A–C

## Технические заметки

- После каждого батча — `tsgo --noEmit` для проверки
- ESLint правила добавляем как `warn`, не `error` — чтобы не сломать сборку при наличии текущих нарушений; постепенно поднимем до `error`

**Стартуем с батча A → B → C по порядку?**