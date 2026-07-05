# Sprint 051: Test Debt + God Files

**Статус:** ⏳ Запланирован  
**Приоритет:** Высокий  
**Дата начала:** 2026-07-21 (предполагаемая)  
**Длительность:** 2 недели

## Цели

Снизить тестовый долг и декомпозировать крупные файлы (>1000 LOC).

## Задачи

| ID   | Название                                   | Приоритет | Статус     | Описание                                                 |
| ---- | ------------------------------------------ | --------- | ---------- | -------------------------------------------------------- |
| T051 | Рефакторинг `studio.service.ts` (1028 LOC) | Высокий   | ⏳ Planned | Разбить на модули: generation, editing, export, metadata |
| T052 | Рефакторинг `LyricsParser.ts` (903 LOC)    | Высокий   | ⏳ Planned | Выделить sub-парсеры для разных форматов                 |
| T053 | Рефакторинг `studio.api.ts` (891 LOC)      | Высокий   | ⏳ Planned | Группировать по доменам: tracks, versions, metadata      |
| T054 | Unit-тесты для топ-3 god files             | Высокий   | ⏳ Planned | Покрытие критических путей                               |
| T055 | Достижение 450+ unit-тестов                | Средний   | ⏳ Planned | Текущий baseline: 292                                    |
| T056 | Снижение файлов >1000 LOC до нуля          | Средний   | ⏳ Planned | Текущий count: 9 файлов                                  |

## Детали реализации

### T051: Разбить `studio.service.ts`

**Текущая проблема:** 1028 LOC, монолитный сервис

**Предлагаемая структура:**

```
src/services/studio/
├── generation.service.ts      # Music generation logic
├── editing.service.ts         # Track editing operations
├── export.service.ts          # Export functionality
├── metadata.service.ts        # Metadata management
└── studio.service.ts         # Facade/aggregate
```

### T052: Разбить `LyricsParser.ts`

**Текущая проблема:** 903 LOC, множественные форматы

**Предлагаемая структура:**

```
src/lib/lyrics/
├── parsers/
│   ├── lrc-parser.ts          # LRC format
│   ├── srt-parser.ts          # SubRip format
│   └── txt-parser.ts          # Plain text
├── LyricsParser.ts            # Main orchestrator
└── types.ts                   # Shared types
```

### T053: Разбить `studio.api.ts`

**Текущая проблема:** 891 LOC, смешанные домены

**Предлагаемая структура:**

```
src/api/studio/
├── tracks.api.ts              # Track operations
├── versions.api.ts            # Version management
├── metadata.api.ts            # Metadata queries
├── export.api.ts              # Export operations
└── studio.api.ts              # Facade
```

## Критерии завершения

- [ ] Все файлы <1000 LOC
- [ ] 450+ unit-тестов
- [ ] Все тесты проходят (CI green)
- [ ] Документация обновлена

## Риски

- **Риск:** Рефакторинг может внести регрессии
- **Митигация:** Comprehensive unit-тесты перед рефакторингом

## Зависимости

- Требует зелёный CI от Sprint 050
- Базовые тесты должны быть стабильными

## Далее

Sprint 053: Suno Sounds + MIDI + Boost
