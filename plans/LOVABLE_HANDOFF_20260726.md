# Отчет для Lovable AI Agent

## Проделанная работа (26 июля 2026)

Hermes Agent выполнил масштабный спринт по исправлению багов, полировке UI и аудиту stem studio.

---

## 1. Критические баги (исправлены)

### 1.1 Stem separation — зависание студии
**Edge function:** `supabase/functions/suno-separate-vocals/index.ts`
**Коммит:** `c9cd09755`

**Найденные проблемы:**
1. `Authorization: *** ${sunoApiKey}` — сломанный заголовок (вместо `Bearer`). Все запросы к Suno API отклонялись с 401.
2. Отсутствовал AbortSignal/таймаут — если Suno не отвечает, `fetch()` висит до таймаута Edge Function (до 5 минут).
3. Двойное списание кредитов — вызов `deduct_credits` RPC **плюс** ручной `INSERT INTO credit_transactions`.

**Исправления:**
- `Authorization: ***` → `Authorization: Bearer ${sunoApiKey}`
- Добавлен `AbortController` с таймаутом 30s
- Удалён ручной INSERT в `credit_transactions` (RPC уже делает это)

**Необходимо:**
```
supabase functions deploy suno-separate-vocals
```

### 1.2 separatingTrackId — сбрасывался слишком рано
**Хук:** `src/hooks/useStemSeparation.ts`
**Коммит:** `13dddce98`

**Проблема:** `onSettled` очищал `separatingTrackId` сразу после ответа API, хотя стемы обрабатываются 1-3 минуты асинхронно. `isTrackSeparating()` возвращал `false` сразу после запуска.

**Исправления:**
- `onSettled` больше не очищает `separatingTrackId` (очищается только при `onError`)
- Экспортирован `clearSeparatingState()` для внешнего вызова
- В `StudioShell.tsx` добавлен `useEffect`: очищает state когда `stemRealtime.isCompleted || isFailed`

---

## 2. UI-полировка (15 задач P0-P3)

### P0 (Critical)
- **UI-1**: Добавлен `px-4 sm:px-6` в Library.tsx для симметричных отступов
- **UI-5**: EmptyState для AudioHub — уже есть

### P1 (High)
- **UI-2**: Pull-to-Refresh на Index (уже был) + Projects (добавлен)
- **UI-6**: Bottom nav анимация — уже реализована
- **UI-10**: AppHeader — паттерн корректный
- **UI-13**: Создан OfflineBanner.tsx, добавлен в App.tsx

### P2 (Medium)
- **UI-4**: Crossfade при смене трека (volume fade 150→200ms)
- **UI-7**: Responsive skeleton для GenerateSheet
- **UI-9**: Отступы grid/list — консистентны
- **UI-11**: Удалён мёртвый код (-99 строк) из DesktopLibrarySidebar
- **UI-15**: Прогресс-бар генерации — уже есть

### P3 (Low)
- **UI-12**: ProfilePage декомпозирован (532→128 LOC, 3 новых компонента)
- **UI-14**: Кнопка "Создать" при collapsed sidebar

---

## 3. Архитектурные изменения

### §10 — Merge lyrics-assistant
- Удалён `LyricsChatAssistant.tsx` (623 LOC)
- Все 5 потребителей переведены на `LyricsAssistantSheet`
- Добавлена поддержка `projectContext`/`trackContext` в `useLyricsAssistant`

### §12 — Adaptive sidebar
- `DesktopLibrarySidebar` теперь только десктоп
- Мобильный FAB удалён

### ESLint any → unknown
- 17 `: any` в 9 файлах → `: unknown` или более конкретные типы

---

## 4. Stem Studio Audit (10 находок)

### Исправлено:
- **S1**: Guard закрытия диалога во время обработки (AlertDialog confirm)
- **S2**: Кнопка "Открыть в студии" после завершения
- **S3**: Обработка пустого `separationTaskId`
- **S4**: Предупреждение для треков >5 минут
- **S5**: EmptyState для IntegratedStemTracks

### Осталось (для Lovable):
- **S6**: Confirm при удалении стема — нужен wrapper onStemAction
- **S9**: Слияние `useStemSeparationRealtime` + `useStudioStemSync` в общий `useStemRealtime`
- **Timeouts**: 35/44 edge-функций без таймаута (см. `plans/STEM_STUDIO_AUDIT.md`)

---

## 5. Требования к Lovable

### Немедленно:
1. ✅ **Реплицировать коммиты** — пул последних 10 коммитов из origin/main
2. ✅ **Переразвернуть `suno-separate-vocals`:**
   ```
   supabase functions deploy suno-separate-vocals
   ```
   Без этого фиксы (auth header, timeout, double credit) не вступят в силу.
3. ✅ **Проверить** что `suno-vocal-callback` развёрнут (обрабатывает callback от Suno после разделения)

### Рекомендуется:
4. ⬜ **S6**: Добавить `AlertDialog` confirm в `IntegratedStemTracks.tsx` при action === "delete"
5. ⬜ **Добавить таймауты** во все edge-функции без AbortSignal (35 штук)
6. ⬜ **S9**: Создать единый `useStemRealtime` хук

---

## 6. Git-ссылки

- Репозиторий: https://github.com/HOW2AI-AGENCY/aimusicverse
- Последний коммит: `b5e57f2c6`
- Ветка: `main`
- Файлы зон ответственности:
  - Edge function: `supabase/functions/suno-separate-vocals/index.ts`
  - Stem hooks: `src/hooks/useStemSeparation.ts`, `src/hooks/useStemSeparationRealtime.ts`
  - Stem UI: `src/components/studio/unified/StemSeparationModeDialog.tsx`, `src/components/stem-studio/StemSeparationProgress.tsx`, `src/components/studio/unified/IntegratedStemTracks.tsx`
  - Studio shell: `src/components/studio/unified/StudioShell.tsx`
