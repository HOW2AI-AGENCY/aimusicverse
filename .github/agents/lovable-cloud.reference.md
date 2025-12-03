# Lovable Cloud Reference Guide for AI Agents

## Overview

MusicVerse AI использует **Lovable Cloud** (основан на Supabase) для всей бэкенд-инфраструктуры.

## Ключевые правила

### 1. Именование для пользователей
- **ПРАВИЛЬНО**: "Lovable Cloud", "бэкенд", "база данных"
- **НЕПРАВИЛЬНО**: Не упоминать "Supabase" пользователям напрямую

### 2. Именование в коде
- В коде используется Supabase SDK: `import { supabase } from '@/integrations/supabase/client'`
- Типы: `import type { Database } from '@/integrations/supabase/types'`

### 3. Файлы НЕ редактировать (автогенерируемые)
```
src/integrations/supabase/client.ts  - Клиент Supabase
src/integrations/supabase/types.ts   - Типы из схемы БД
supabase/config.toml                 - Конфигурация проекта
.env                                 - Переменные окружения
```

## Актуальная схема БД

### Важные соглашения об именовании

| Правильно | Неправильно | Примечание |
|-----------|-------------|------------|
| `is_primary` | `is_master` | Поле в track_versions для главной версии |
| `track_change_log` | `track_changelog` | Таблица истории изменений |
| `audio_analysis` | `track_analysis` | Таблица AI-анализа |
| `track_stems` | `stems` | Таблица стемов |

### Основные таблицы

```
tracks              - Основная информация о треках
track_versions      - Версии треков (is_primary = true для главной)
track_stems         - Разделенные стемы (vocals, instrumental, etc.)
track_change_log    - История изменений
track_likes         - Лайки пользователей
track_analytics     - Аналитика воспроизведений
audio_analysis      - AI-анализ треков
generation_tasks    - Задачи на генерацию
music_projects      - Музыкальные проекты/альбомы
project_tracks      - Связь проектов и треков
artists             - AI-артисты и персоны
```

## Edge Functions

Деплоятся автоматически из `supabase/functions/`.

### Основные функции
- `suno-generate` - Генерация музыки
- `suno-check-status` - Проверка статуса
- `telegram-bot` - Telegram бот
- `generate-cover-image` - Генерация обложек

## RLS (Row Level Security)

Все таблицы с пользовательскими данными защищены RLS политиками.

### Типичные паттерны:
```sql
-- Пользователь видит только свои данные
USING (auth.uid() = user_id)

-- Пользователь видит свои и публичные данные
USING ((auth.uid() = user_id) OR (is_public = true))
```

## Типы данных в TypeScript

```typescript
// Использовать типы из автогенерируемого файла
import type { Database } from '@/integrations/supabase/types';

// Примеры
type Track = Database['public']['Tables']['tracks']['Row'];
type TrackVersion = Database['public']['Tables']['track_versions']['Row'];
type TrackInsert = Database['public']['Tables']['tracks']['Insert'];
type TrackUpdate = Database['public']['Tables']['tracks']['Update'];
```

## Запросы к БД

```typescript
// Правильный импорт
import { supabase } from '@/integrations/supabase/client';

// Пример запроса
const { data, error } = await supabase
  .from('track_versions')
  .select('*')
  .eq('track_id', trackId)
  .eq('is_primary', true)  // НЕ is_master!
  .single();
```

## Storage (Файловое хранилище)

### Бакеты
- `project-assets` - Ассеты проектов (обложки, и т.д.)

### Загрузка файлов
```typescript
const { data, error } = await supabase.storage
  .from('project-assets')
  .upload(path, file);
```

## Миграции

Миграции создаются через инструмент `supabase--migration`.

```sql
-- Пример: добавление колонки
ALTER TABLE tracks ADD COLUMN new_field TEXT;

-- Пример: включение RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
```

---

*Последнее обновление: 2025-12-03*
