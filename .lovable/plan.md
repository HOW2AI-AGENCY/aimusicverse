
# План полировки и доработки MusicVerse AI

## Обзор текущего состояния

Проект находится в стадии **100% готовности к production**. Все основные функции работают, дизайн-система внедрена, документация обновлена. Однако в ходе аудита выявлены области для улучшения.

---

## Выявленные проблемы

### Критические (P0)

**1. RLS-политика для deeplink_analytics блокирует анонимных пользователей**
- **Симптом**: Ошибки 401 при INSERT в `deeplink_analytics` для неаутентифицированных пользователей
- **Причина**: Политика требует `authenticated` роль, но трекинг должен работать и для гостей
- **Влияние**: Теряется аналитика посещений до регистрации

### Средние (P1)

**2. PostMessage warnings в консоли**
- **Симптом**: Предупреждения о несовпадении origin для postMessage
- **Причина**: Попытки связи с разными доменами Lovable (beta, gptengineer.app, localhost)
- **Влияние**: Засоряет консоль, не влияет на функциональность

**3. Tailwind CDN warning в dev-mode**
- **Симптом**: Предупреждение "cdn.tailwindcss.com should not be used in production"
- **Причина**: Dev-mode включает CDN fallback
- **Влияние**: Только в dev-mode, production не затронут

---

## План доработки

### Фаза 1: Исправление аналитики (P0)

#### 1.1 Добавить INSERT политику для анонимных пользователей
```sql
CREATE POLICY "Allow anonymous deeplink tracking"
ON public.deeplink_analytics FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);
```

#### 1.2 Обновить deeplink-tracker.ts
- Добавить graceful fallback при ошибках INSERT
- Использовать localStorage буферизацию для retry после авторизации
- Подавить non-critical ошибки в production

### Фаза 2: Улучшения UX (P1)

#### 2.1 Подавление нерелевантных console warnings
- Обернуть postMessage вызовы в try-catch с проверкой origin
- Фильтровать известные безопасные ошибки в TelegramContext

#### 2.2 Улучшения дизайн-системы (из spec 032)
- **Типографика**: Проверить и унифицировать использование `<Heading />` компонента
- **Интерактивность**: Добавить микро-анимации для кнопок через `AnimatedIcon`
- **Скелетоны**: Унифицировать размеры skeleton loaders с финальным контентом

### Фаза 3: Оптимизация производительности (P2)

#### 3.1 Bundle Size Audit
- Проверить lazy loading для тяжёлых компонентов (recharts, wavesurfer)
- Аудит tree-shaking для lucide-react

#### 3.2 Network Optimization
- Добавить preconnect для Supabase endpoints
- Оптимизировать критические запросы (profiles, tracks)

### Фаза 4: Качество кода (P3)

#### 4.1 Консистентность логирования
- Проверить использование централизованного logger во всех модулях
- Убедиться что все `catch` блоки используют `logger.error()`

#### 4.2 Документация
- Обновить KNOWLEDGE_BASE.md с новыми паттернами
- Добавить примеры использования дизайн-системы

---

## Технические детали

### Изменения базы данных

```text
Таблица: deeplink_analytics
├── Текущие политики:
│   ├── SELECT: Users can view own (auth.uid() = user_id)
│   ├── SELECT: Admins can view all
│   └── INSERT: authenticated only (проблема!)
└── Новая политика:
    └── INSERT: anon с user_id IS NULL
```

### Файлы для изменения

| Файл | Тип изменения | Приоритет |
|------|---------------|-----------|
| `supabase/migrations/new_migration.sql` | Новая RLS политика | P0 |
| `src/lib/analytics/deeplink-tracker.ts` | Graceful error handling | P0 |
| `src/contexts/TelegramContext.tsx` | Подавление warnings | P1 |
| `src/components/ui/skeletons/` | Унификация размеров | P2 |

---

## Критерии успеха

- Нет ошибок 401 для deeplink_analytics в консоли
- Чистая консоль без нерелевантных warnings
- Все skeleton loaders соответствуют размерам финального контента
- 100% coverage дизайн-токенов в компонентах

---

## Оценка времени

| Фаза | Задачи | Время |
|------|--------|-------|
| Фаза 1 | RLS + Error handling | 15 мин |
| Фаза 2 | UX улучшения | 20 мин |
| Фаза 3 | Оптимизация | 15 мин |
| Фаза 4 | Качество кода | 10 мин |
| **Итого** | | **~60 мин** |
