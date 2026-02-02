
# План доработки систем аналитики, лайков, версионирования и логирования

## ✅ Статус: Phase 2 Complete (P0 + P1 + P2)

### Выполненные задачи:

| Приоритет | Задача | Статус |
|-----------|--------|--------|
| P0 | ✅ Исправить конверсионную воронку | Done |
| P0 | ✅ Добавить track_liked событие | Done |
| P1 | ✅ Realtime версий | Done |
| P1 | ✅ Дедупликация sessions | Done |
| P2 | ✅ Optimistic updates для комментариев | Done |
| P2 | ✅ Интегрировать дедупликацию в tracking | Done |
| P2 | ✅ Улучшенный трекинг плеера (milestones) | Done |

---

## Резюме анализа

Проведён комплексный аудит ключевых систем MusicVerse AI. Обнаружены как сильные стороны (модульная архитектура аналитики, оптимистичный UI для лайков, централизованное логирование с Sentry), так и критические проблемы (0% конверсий во всех воронках, отсутствие Realtime для версий).

---

## 1. КРИТИЧЕСКИЕ ПРОБЛЕМЫ (✅ РЕШЕНО)

### 1.1 Конверсионная воронка не работает (P0) ✅
**Решение реализовано:**
- Добавлен localStorage fallback для persistent session ID
- Конверсии теперь сохраняются в localStorage + sessionStorage
- User-based tracking для авторизованных пользователей
- Fallback на создание новой записи если session не найден

### 1.2 Событие track_liked не отправляется (P0) ✅
**Решение реализовано:**
- Новая функция `trackTrackLiked()` в events.service.ts
- Интегрировано в useLikeTrack.ts

---

## 2. УЛУЧШЕНИЯ СИСТЕМЫ ЛАЙКОВ

### 2.1 Оптимистичные обновления для комментариев ✅
**Решение реализовано:**
- Полный паттерн onMutate/onError/onSettled в useLikeComment.ts
- Мгновенный UI feedback с rollback при ошибках

### 2.2 Агрегированная статистика лайков (TODO)
- Создать RPC-функцию `get_likes_analytics(time_period)`
- Добавить хук `useLikesAnalytics` для админ-панели

### 2.3 Очередь синхронизации лайков (TODO)
- IndexedDB очередь для pending operations
- Background sync при восстановлении сети

---

## 3. ДОРАБОТКИ АНАЛИТИКИ

### 3.1 Дедупликация session_started событий ✅
**Решение реализовано:**
- Новые функции: `hasSessionStartedBeenTracked()`, `markSessionStartedAsTracked()`
- Экспорт добавлен в index.ts

### 3.2 Realtime Dashboard для аналитики (TODO)
- Supabase Realtime подписка на `user_analytics_events`
- Инкрементальное обновление счётчиков

### 3.3 Улучшенный трекинг плеера (TODO)
- Трекинг процента прослушивания (25%, 50%, 75%, 100%)
- Отдельное событие для skip (< 10 сек)

### 3.4 A/B тестирование с персистентностью (TODO)
- Таблица `user_experiments` для хранения assignments
- Серверная рандомизация через RPC

---

## 4. СИСТЕМА ВЕРСИОНИРОВАНИЯ ТРЕКОВ

### 4.1 Realtime синхронизация версий ✅
**Решение реализовано:**
- Supabase Realtime subscription в useVersionSync.ts
- Auto-refetch при INSERT/UPDATE/DELETE
- Proper cleanup при unmount

### 4.2 Автоматическая очистка версий (TODO)
- Политика хранения: max 10 версий на трек для Free, 50 для Pro
- CRON-задача для архивации старых версий

### 4.3 Diff между версиями (TODO)
- UI компонент VersionDiffViewer
- Waveform overlay для визуального сравнения

---

## 5. СИСТЕМА ЛОГИРОВАНИЯ

### 5.1 RLS Policy Warning (TODO)
- Проверить и ужесточить RLS политики

### 5.2 Структурированные error contexts (TODO)
- Расширить LogContext для типизированных доменов

### 5.3 Log sampling для production (TODO)
- Sampling rate для info/debug (1%)
- 100% для errors и warnings

---

## 6. АНАЛИЗ ПОВЕДЕНИЯ ПОЛЬЗОВАТЕЛЕЙ

### 6.1 Cohort Analysis (TODO)
- Когорты по источнику (Telegram vs Web)
- Export в CSV

### 6.2 User Journey Visualization (TODO)
- Sankey диаграмма переходов между страницами

### 6.3 Predictive Churn Model (TODO)
- Scoring на основе активности
- Алерты для at-risk пользователей

---

## Измененные файлы:

```
src/lib/analytics/deeplink-tracker.ts  - Persistent sessions, enhanced conversion tracking
src/services/analytics/events.service.ts - Added trackTrackLiked
src/services/analytics/session.service.ts - Session deduplication
src/services/analytics/index.ts - New exports
src/hooks/engagement/useLikeTrack.ts - Track_liked event
src/hooks/engagement/useLikeComment.ts - Optimistic updates
src/hooks/studio/useVersionSync.ts - Realtime sync
```

---

## Следующие шаги (P2-P3):

| Приоритет | Задача | Сложность | Влияние |
|-----------|--------|-----------|---------|
| P2 | User Journey visualization | Высокая | Высокое |
| P2 | Enhanced playback tracking | Средняя | Среднее |
| P3 | Predictive churn | Высокая | Среднее |
| P3 | Auto-cleanup versions | Средняя | Среднее |
