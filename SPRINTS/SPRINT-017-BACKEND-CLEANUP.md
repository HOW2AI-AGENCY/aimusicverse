# Sprint 017: Backend & Database Cleanup

**Period**: После Sprint 016  
**Focus**: Очистка и унификация бэкенда, исправление несоответствий  
**Priority**: P1 (High)  
**Status**: 📝 Draft

---

## 📋 Обзор

Этот спринт фокусируется на очистке и унификации бэкенда после аудита инфраструктуры.

---

## 🎯 Цели Спринта

1. **Унификация нейминга** - Использовать консистентные имена полей и таблиц
2. **Очистка типов** - Убрать дублирование типов и несоответствия со схемой БД
3. **Документация** - Обновить всю документацию в соответствии с актуальной схемой

---

## 📊 Ключевые изменения в схеме БД

### Существующие таблицы (НЕ изменять)

| Таблица | Назначение |
|---------|------------|
| `tracks` | Основная информация о треках |
| `track_versions` | Версии треков (поле `is_primary` - основная версия) |
| `track_stems` | Стемы треков (вокал, инструментал, и т.д.) |
| `track_change_log` | История изменений треков |
| `track_likes` | Лайки пользователей |
| `track_analytics` | Аналитика воспроизведений |
| `audio_analysis` | AI-анализ аудио |

### Именование полей (актуальное)

```
track_versions.is_primary  - Основная версия (НЕ is_master)
track_change_log           - История изменений (НЕ track_changelog)
audio_analysis             - Анализ аудио (НЕ track_analysis)
```

---

## 📋 Задачи

### Area 1: Очистка хуков (4 задачи)

- [ ] CLN-017-001 Убрать дублирующий `useTrackVersions` из `src/hooks/useTrackVersions.tsx`
- [ ] CLN-017-002 Использовать единый `useTrackVersions` из `src/hooks/useTrackVersions.ts`
- [ ] CLN-017-003 Обновить все импорты на правильный хук
- [ ] CLN-017-004 Удалить неиспользуемые хуки

### Area 2: Очистка компонентов (3 задачи)

- [ ] CLN-017-005 Убрать ссылки на несуществующие таблицы
- [ ] CLN-017-006 Использовать правильные имена полей (`is_primary` вместо `is_master`)
- [ ] CLN-017-007 Обновить типы компонентов в соответствии со схемой БД

### Area 3: Документация (5 задач)

- [ ] CLN-017-008 Обновить SPRINTS с правильным неймингом
- [ ] CLN-017-009 Обновить constitution.md
- [ ] CLN-017-010 Обновить copilot-instructions.md
- [ ] CLN-017-011 Обновить agent файлы
- [ ] CLN-017-012 Создать схему данных (data model diagram)

---

## 📚 Справочник: Актуальная схема таблиц

### tracks (основная таблица)
```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL
title VARCHAR
prompt TEXT NOT NULL
audio_url TEXT
cover_url TEXT
status VARCHAR DEFAULT 'pending'
is_public BOOLEAN DEFAULT false
play_count INTEGER DEFAULT 0
duration_seconds INTEGER
-- ... и другие поля
```

### track_versions (версии)
```sql
id UUID PRIMARY KEY
track_id UUID REFERENCES tracks(id)
audio_url TEXT NOT NULL
cover_url TEXT
duration_seconds INTEGER
is_primary BOOLEAN DEFAULT false  -- ВНИМАНИЕ: is_primary, НЕ is_master!
version_type VARCHAR DEFAULT 'initial'
parent_version_id UUID
metadata JSONB
created_at TIMESTAMPTZ
```

### track_change_log (история изменений)
```sql
id UUID PRIMARY KEY
track_id UUID REFERENCES tracks(id)
user_id UUID NOT NULL
version_id UUID REFERENCES track_versions(id)
change_type VARCHAR NOT NULL
changed_by VARCHAR NOT NULL
field_name VARCHAR
old_value TEXT
new_value TEXT
metadata JSONB
created_at TIMESTAMPTZ
```

### audio_analysis (анализ аудио)
```sql
id UUID PRIMARY KEY
track_id UUID REFERENCES tracks(id)
user_id TEXT NOT NULL
analysis_type TEXT NOT NULL
bpm NUMERIC
key_signature TEXT
tempo TEXT
mood TEXT
genre TEXT
instruments TEXT[]
-- ... и другие поля
```

---

## 🔗 Связанные документы

- [Infrastructure Audit](../INFRASTRUCTURE_AUDIT_2025-12-03.md)
- [Database Schema](../docs/DATABASE.md)
- [Sprint 016](./SPRINT-016-INFRASTRUCTURE-HARDENING.md)

---

**Created**: 2025-12-03  
**Last Updated**: 2025-12-03  
**Status**: 📝 Draft
