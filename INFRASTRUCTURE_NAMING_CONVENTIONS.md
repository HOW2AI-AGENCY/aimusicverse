# Соглашения об именовании инфраструктуры

Этот документ описывает актуальные соглашения об именовании для MusicVerse AI.

---

## Backend

### Общение с пользователями
- **ПРАВИЛЬНО**: "Lovable Cloud", "бэкенд", "база данных", "хранилище"
- **НЕПРАВИЛЬНО**: "Supabase" (не упоминать пользователям напрямую)

### В коде
- В коде используется Supabase SDK
- Импорт: `import { supabase } from '@/integrations/supabase/client'`

---

## База данных

### Таблицы

| Таблица | Описание |
|---------|----------|
| `tracks` | Основная информация о треках |
| `track_versions` | Версии треков |
| `track_stems` | Стемы (разделенные дорожки) |
| `track_change_log` | История изменений |
| `track_likes` | Лайки пользователей |
| `track_analytics` | Аналитика воспроизведений |
| `audio_analysis` | AI-анализ аудио |
| `generation_tasks` | Задачи на генерацию |
| `music_projects` | Музыкальные проекты |
| `project_tracks` | Связь проектов и треков |
| `artists` | AI-артисты |

### Важные поля

| Правильно | Неправильно | Таблица |
|-----------|-------------|---------|
| `is_primary` | `is_master` | track_versions |
| `track_change_log` | `track_changelog` | - |
| `audio_analysis` | `track_analysis` | - |

---

## Файлы (НЕ редактировать)

Следующие файлы автогенерируются и **НЕ должны редактироваться вручную**:

```
src/integrations/supabase/client.ts   # Клиент Supabase
src/integrations/supabase/types.ts    # Типы из схемы БД
supabase/config.toml                  # Конфигурация проекта
.env                                  # Переменные окружения
```

---

## Хуки (актуальные)

### Для версий треков
```typescript
// ПРАВИЛЬНО
import { useTrackVersions } from '@/hooks/useTrackVersions';  // .ts файл
import { useVersionSwitcher } from '@/hooks/useVersionSwitcher';

// НЕПРАВИЛЬНО (удалено)
// import { useTrackVersions } from '@/hooks/useTrackVersions.tsx';
```

### Для деталей треков
```typescript
import { useTrackDetails } from '@/hooks/useTrackDetails';
import { useTrackChangelog } from '@/hooks/useTrackChangelog';
```

---

## Типы TypeScript

```typescript
// Использовать типы из автогенерируемого файла
import type { Database } from '@/integrations/supabase/types';

// Типы для таблиц
type Track = Database['public']['Tables']['tracks']['Row'];
type TrackVersion = Database['public']['Tables']['track_versions']['Row'];
type TrackStem = Database['public']['Tables']['track_stems']['Row'];
type AudioAnalysis = Database['public']['Tables']['audio_analysis']['Row'];
type TrackChangeLog = Database['public']['Tables']['track_change_log']['Row'];
```

---

## Запросы к БД

### Правильные примеры

```typescript
// Получение основной версии
const { data } = await supabase
  .from('track_versions')
  .select('*')
  .eq('track_id', trackId)
  .eq('is_primary', true)  // НЕ is_master!
  .single();

// Получение истории изменений
const { data } = await supabase
  .from('track_change_log')  // НЕ track_changelog!
  .select('*')
  .eq('track_id', trackId)
  .order('created_at', { ascending: false });

// Получение анализа
const { data } = await supabase
  .from('audio_analysis')  // НЕ track_analysis!
  .select('*')
  .eq('track_id', trackId)
  .maybeSingle();
```

---

## Спринты и документация

### Обновленные спринты
- Sprint 007-016: Используют правильные имена таблиц и полей
- Sprint 017: Backend Cleanup - очистка и унификация

### Ключевые документы
- `.github/copilot-instructions.md` - инструкции для Copilot
- `.github/agents/lovable-cloud.reference.md` - справочник по Lovable Cloud
- `.specify/memory/constitution.md` - конституция проекта
- `SPRINTS/BACKLOG.md` - бэклог задач

---

*Последнее обновление: 2025-12-03*
