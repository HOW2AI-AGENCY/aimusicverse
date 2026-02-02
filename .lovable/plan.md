
# План доработки систем аналитики, лайков, версионирования и логирования

## Резюме анализа

Проведён комплексный аудит ключевых систем MusicVerse AI. Обнаружены как сильные стороны (модульная архитектура аналитики, оптимистичный UI для лайков, централизованное логирование с Sentry), так и критические проблемы (0% конверсий во всех воронках, отсутствие Realtime для версий).

---

## 1. КРИТИЧЕСКИЕ ПРОБЛЕМЫ

### 1.1 Конверсионная воронка не работает (P0)
**Проблема:** В таблице `deeplink_analytics` 0 конверсий при 839 визитах за неделю.

**Причина:** Функция `trackConversionStage` обновляет запись по `session_id`, но:
- Session ID в sessionStorage обнуляется при закрытии вкладки
- При повторном визите создаётся новый session, старый не находится

**Решение:**
- Добавить fallback на `localStorage` для persistent session
- Использовать user_id для обновления конверсий авторизованных пользователей
- Добавить RPC-функцию `mark_user_conversion` для атомарного обновления

### 1.2 Событие track_liked не отправляется (P0)
**Проблема:** В аналитике 0 событий `track_liked`, хотя 255 лайков в базе.

**Причина:** В `useLikeTrack.ts` используется `trackButtonClick`, а не `trackEvent` с `event_type: 'track_liked'`

**Решение:**
```typescript
// Добавить в useLikeTrack.ts onSuccess:
trackEvent({ eventType: 'track_liked', metadata: { trackId, action } });
```

---

## 2. УЛУЧШЕНИЯ СИСТЕМЫ ЛАЙКОВ

### 2.1 Оптимистичные обновления для комментариев
**Текущее состояние:** `useLikeComment` не имеет optimistic updates, в отличие от `useLikeTrack`

**Решение:** Добавить паттерн onMutate/onError/onSettled аналогично useLikeTrack

### 2.2 Агрегированная статистика лайков
**Потребность:** Аналитика топ-лайков, среднего количества лайков по жанрам

**Решение:** 
- Создать RPC-функцию `get_likes_analytics(time_period)`
- Добавить хук `useLikesAnalytics` для админ-панели
- Визуализировать в новой секции дашборда

### 2.3 Очередь синхронизации лайков
**Проблема:** При offline лайки теряются

**Решение:**
- IndexedDB очередь для pending operations
- Background sync при восстановлении сети

---

## 3. ДОРАБОТКИ АНАЛИТИКИ

### 3.1 Дедупликация session_started событий
**Проблема:** 39K session_started за неделю, что указывает на дублирование

**Решение:**
- Проверять флаг в sessionStorage перед отправкой
- Добавить debounce на старт сессии

### 3.2 Realtime Dashboard для аналитики
**Текущее:** Данные обновляются при refresh

**Решение:**
- Supabase Realtime подписка на `user_analytics_events`
- Инкрементальное обновление счётчиков
- Алерты при аномалиях в реальном времени

### 3.3 Улучшенный трекинг плеера
**Текущее:** PLAY_DURATION_THRESHOLD = 10 секунд

**Улучшения:**
- Трекинг процента прослушивания (25%, 50%, 75%, 100%)
- Отдельное событие для skip (< 10 сек)
- Событие для повторного прослушивания

### 3.4 A/B тестирование с персистентностью
**Проблема:** Эксперименты хранятся в localStorage, нет серверной синхронизации

**Решение:**
- Таблица `user_experiments` для хранения assignments
- Серверная рандомизация через RPC
- Аналитика по вариантам

---

## 4. СИСТЕМА ВЕРСИОНИРОВАНИЯ ТРЕКОВ

### 4.1 Realtime синхронизация версий
**Проблема:** При работе нескольких клиентов версии не синхронизируются

**Решение:**
```typescript
// В useVersionSync добавить:
useEffect(() => {
  const channel = supabase
    .channel(`track-versions-${trackId}`)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'track_versions',
      filter: `track_id=eq.${trackId}`
    }, () => refetch())
    .subscribe();
  return () => supabase.removeChannel(channel);
}, [trackId]);
```

### 4.2 Автоматическая очистка версий
**Проблема:** Версии накапливаются бесконечно

**Решение:**
- Политика хранения: max 10 версий на трек для Free, 50 для Pro
- CRON-задача для архивации старых версий
- Soft-delete с возможностью восстановления 30 дней

### 4.3 Diff между версиями
**Потребность:** Визуализация изменений между версиями

**Решение:**
- Хранение metadata изменений (duration diff, stems changed)
- UI компонент VersionDiffViewer
- Waveform overlay для визуального сравнения

---

## 5. СИСТЕМА ЛОГИРОВАНИЯ

### 5.1 RLS Policy Warning
**Проблема:** Linter показывает "RLS Policy Always True"

**Решение:** Проверить и ужесточить RLS политики для sensitive таблиц

### 5.2 Структурированные error contexts
**Улучшение:**
```typescript
// Расширить LogContext для типизированных доменов
interface AudioErrorContext extends LogContext {
  trackId: string;
  audioUrl: string;
  errorCode: string;
  userAgent: string;
}
```

### 5.3 Log sampling для production
**Проблема:** Потенциально большой объём логов

**Решение:**
- Sampling rate для info/debug (1%)
- 100% для errors и warnings
- Настройка через feature flags

---

## 6. АНАЛИЗ ПОВЕДЕНИЯ ПОЛЬЗОВАТЕЛЕЙ

### 6.1 Cohort Analysis
**Текущее:** useRetentionCohorts работает, но данные sparse

**Улучшения:**
- Добавить когорты по источнику (Telegram vs Web)
- Когорты по первому действию (generation vs browse)
- Export в CSV для внешнего анализа

### 6.2 User Journey Visualization
**Потребность:** Визуализация путей пользователей

**Решение:**
- Sankey диаграмма переходов между страницами
- Heatmap кликов по времени
- Funnel visualization с breakdowns

### 6.3 Predictive Churn Model
**Потребность:** Предсказание оттока

**Решение:**
- Scoring на основе активности (дни с последнего визита, кол-во генераций)
- Алерты для at-risk пользователей
- Автоматические re-engagement уведомления

---

## Приоритизация

| Приоритет | Задача | Сложность | Влияние |
|-----------|--------|-----------|---------|
| P0 | Исправить конверсионную воронку | Средняя | Критическое |
| P0 | Добавить track_liked событие | Низкая | Высокое |
| P1 | Realtime версий | Средняя | Высокое |
| P1 | Дедупликация sessions | Низкая | Среднее |
| P2 | Optimistic updates для комментариев | Низкая | Среднее |
| P2 | User Journey visualization | Высокая | Высокое |
| P3 | Predictive churn | Высокая | Среднее |

---

## Технические детали

### Новые миграции БД:
1. RPC `mark_user_conversion(user_id, stage, metadata)`
2. RPC `get_likes_analytics(time_period)`
3. Таблица `user_experiments` для A/B тестов
4. Индекс на `track_versions(track_id, created_at)` для очистки

### Новые Edge Functions:
- `cleanup-old-versions` (scheduled)
- `calculate-churn-score` (scheduled, daily)

### Файлы для изменения:
- `src/hooks/engagement/useLikeTrack.ts` - добавить track_liked
- `src/hooks/engagement/useLikeComment.ts` - optimistic updates
- `src/lib/analytics/deeplink-tracker.ts` - persistent sessions
- `src/hooks/studio/useVersionSync.ts` - Realtime
- `src/services/analytics/session.service.ts` - дедупликация
