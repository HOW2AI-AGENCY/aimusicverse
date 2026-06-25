# Список задач для Спринта 007

**Спринт**: 007 - Mobile-First UI/UX - Phase 1 (Setup & Infrastructure)  
**Период**: 2025-12-08 - 2025-12-15  
**Цель**: Подготовить инфраструктуру для масштабного редизайна интерфейса

---

## 📊 Прогресс спринта

**Статус**: ✅ **ЗАВЕРШЕН** (2025-12-02)  
**Общий прогресс**: 100% frontend quality tasks completed

- ✅ **Завершено**: 4 задачи (code quality improvements)
- 🔄 **Перенесено в Backlog**: 20 задач (infrastructure work)
- 📋 **Итоговый результат**: Frontend improvements complete, infrastructure tasks require proper dev environment

---

## ✅ Завершенные задачи

- [x] Проведен аудит кодовой базы и документации
- [x] Исправлено 25 ESLint ошибок в компонентах
- [x] Улучшена типизация TypeScript (удалены any типы)
- [x] Исправлены нарушения React Hooks

---

## 🔄 Задачи перенесенные в другие спринты

### Lint исправления → Sprint 8

- [ ] **LINT-01**: Исправить оставшиеся lint ошибки в hooks (~60 errors)
  - Файлы: `src/hooks/*.ts`
  - Команда: `npm run lint -- --fix src/hooks/`
  - Критерий: 0 ошибок ESLint в hooks
  - **Статус**: Перенесено в Sprint 8

- [ ] **LINT-02**: Исправить оставшиеся lint ошибки в pages (~20 errors)
  - Файлы: `src/pages/*.tsx`
  - Команда: `npm run lint -- --fix src/pages/`
  - Критерий: 0 ошибок ESLint в pages
  - **Статус**: Перенесено в Sprint 8

- [ ] **LINT-03**: Исправить lint ошибки в Supabase functions (60 errors)
  - Файлы: `supabase/functions/**/*.ts`
  - Приоритет: Низкий
  - **Статус**: Перенесено в Backlog (Backend Sprint)

---

## 🔄 Задачи перенесенные в Backlog

### Фаза 1A: Database Migrations (6 задач) → Backlog

**Причина переноса**: Требуется настройка Supabase development environment. Эти задачи должны выполняться в proper dev окружении с доступом к Supabase CLI и database.

- [ ] **T001**: Создать миграцию для добавления master_version_id в music_tracks
  - Файл: `supabase/migrations/[timestamp]_add_master_version.sql`
  - SQL: `ALTER TABLE music_tracks ADD COLUMN master_version_id UUID REFERENCES track_versions(id);`
  - Команда: `supabase db diff -f add_master_version`

- [ ] **T002**: Создать миграцию для добавления полей версионирования в track_versions
  - Файл: `supabase/migrations/[timestamp]_add_version_fields.sql`
  - SQL:
    ```sql
    ALTER TABLE track_versions
    ADD COLUMN version_number INTEGER DEFAULT 1,
    ADD COLUMN is_primary BOOLEAN DEFAULT false;
    ```
    - **ВАЖНО**: Используем `is_primary`, НЕ `is_master` согласно naming conventions
  - Команда: `supabase db diff -f add_version_fields`

- [ ] **T003**: Создать миграцию для таблицы track_change_log
  - Файл: `supabase/migrations/[timestamp]_create_changelog_table.sql`
  - **ВАЖНО**: Таблица называется `track_change_log` (с underscore), НЕ `track_changelog`
  - SQL:
    ```sql
    CREATE TABLE track_change_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      track_id UUID REFERENCES music_tracks(id) ON DELETE CASCADE,
      change_type VARCHAR(50) NOT NULL,
      field_name VARCHAR(100),
      old_value TEXT,
      new_value TEXT,
      changed_by UUID REFERENCES auth.users(id),
      changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      metadata JSONB
    );
    CREATE INDEX idx_changelog_track_id ON track_change_log(track_id);
    CREATE INDEX idx_changelog_changed_at ON track_change_log(changed_at DESC);
    ```

- [ ] **T004** [P]: Создать миграцию для таблиц playlists
  - Файл: `supabase/migrations/[timestamp]_create_playlists_tables.sql`
  - SQL:

    ```sql
    CREATE TABLE playlists (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      is_public BOOLEAN DEFAULT false,
      cover_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    CREATE TABLE playlist_tracks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
      track_id UUID REFERENCES music_tracks(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      UNIQUE(playlist_id, position)
    );
    ```

- [ ] **T005**: Создать миграцию для добавления индексов производительности
  - Файл: `supabase/migrations/[timestamp]_add_indexes.sql`
  - SQL:
    ```sql
    CREATE INDEX idx_tracks_is_public ON music_tracks(is_public) WHERE is_public = true;
    CREATE INDEX idx_tracks_primary_version ON music_tracks(primary_version_id);
    CREATE INDEX idx_versions_number ON track_versions(version_number);
    CREATE INDEX idx_versions_is_primary ON track_versions(is_primary) WHERE is_primary = true;
    ```

- [ ] **T006**: Создать скрипт миграции существующих данных
  - Файл: `supabase/migrations/[timestamp]_migrate_existing_data.sql`
  - SQL:

    ```sql
    -- Установить version_number = 1 для всех существующих версий
    UPDATE track_versions SET version_number = 1 WHERE version_number IS NULL;

    -- Установить первую версию как primary для каждого трека
    UPDATE track_versions tv SET is_primary = true
    FROM (
      SELECT DISTINCT ON (track_id) id, track_id
      FROM track_versions
      ORDER BY track_id, created_at ASC
    ) first_versions
    WHERE tv.id = first_versions.id;

    -- Установить primary_version_id для всех треков
    UPDATE music_tracks mt SET primary_version_id = tv.id
    FROM track_versions tv
    WHERE mt.id = tv.track_id AND tv.is_primary = true;
    ```

**Проверка миграций**:

```bash
# Локальное тестирование
supabase db reset
supabase db push

# Проверка схемы
psql -h localhost -U postgres -d postgres -c "\d music_tracks"
psql -h localhost -U postgres -d postgres -c "\d track_versions"
psql -h localhost -U postgres -d postgres -c "\d track_change_log"
```

---

### Фаза 1B: Type System Updates (7 задач)

**Зависимость**: Требуется завершение миграций (T001-T006)

- [ ] **T007**: Сгенерировать Supabase типы после миграций
  - Команда: `npm run types:generate` или `supabase gen types typescript --local > src/integrations/supabase/types.ts`
  - Файл: `src/integrations/supabase/types.ts`
  - Проверка: `npx tsc --noEmit`

- [ ] **T008** [P]: Добавить TrackVersion интерфейс с новыми полями
  - Файл: `src/integrations/supabase/types.ts`
  - **ВАЖНО**: Поле называется `is_primary`, НЕ `is_master`
  - Добавить:
    ```typescript
    interface TrackVersion {
      id: string;
      track_id: string;
      version_number: number;
      is_primary: boolean;
      version_label?: string;
      file_size_bytes?: number;
      format?: string;
      created_at: string;
      // ... остальные поля
    }
    ```

- [ ] **T009** [P]: Добавить TrackChangelog интерфейс
  - Файл: `src/integrations/supabase/types.ts`
  - Добавить:
    ```typescript
    interface TrackChangelog {
      id: string;
      track_id: string;
      change_type: string;
      field_name?: string;
      old_value?: string;
      new_value?: string;
      changed_by?: string;
      changed_at: string;
      metadata?: Record<string, any>;
    }
    ```

- [ ] **T010** [P]: Добавить Playlist интерфейсы
  - Файл: `src/integrations/supabase/types.ts`
  - Добавить:

    ```typescript
    interface Playlist {
      id: string;
      user_id: string;
      name: string;
      description?: string;
      is_public: boolean;
      cover_url?: string;
      created_at: string;
      updated_at: string;
    }

    interface PlaylistTrack {
      id: string;
      playlist_id: string;
      track_id: string;
      position: number;
      added_at: string;
    }
    ```

- [ ] **T011** [P]: Создать PlayerState клиентский тип
  - Файл: `src/lib/types/player.ts` (создать)
  - Добавить:

    ```typescript
    export type PlayerMode = "compact" | "expanded" | "fullscreen";

    export interface PlayerState {
      mode: PlayerMode;
      currentTrack: Track | null;
      isPlaying: boolean;
      currentTime: number;
      duration: number;
      volume: number;
      isMuted: boolean;
    }
    ```

- [ ] **T012** [P]: Создать PlaybackQueue клиентский тип
  - Файл: `src/lib/types/player.ts`
  - Добавить:

    ```typescript
    export type RepeatMode = "off" | "all" | "one";

    export interface PlaybackQueue {
      items: Track[];
      currentIndex: number;
      shuffle: boolean;
      repeat: RepeatMode;
      history: Track[];
    }
    ```

- [ ] **T013** [P]: Создать AssistantFormState тип
  - Файл: `src/lib/types/forms.ts` (создать)
  - Добавить:

    ```typescript
    export type GenerationMode = "prompt" | "style-lyrics" | "cover" | "extend" | "project" | "persona";

    export interface AssistantFormState {
      mode: GenerationMode;
      currentStep: number;
      totalSteps: number;
      prompt?: string;
      style?: string;
      lyrics?: string;
      referenceTrackId?: string;
      // ... остальные поля
    }
    ```

---

### Фаза 1C: Core Utility Libraries (3 задачи)

**Зависимость**: Требуется завершение типов (T007-T013)

- [ ] **T014** [P]: Создать утилиты версионирования
  - Файл: `src/lib/versioning.ts` (создать)
  - Функции:
    ```typescript
    export function getVersionNumber(version: TrackVersion): string;
    export function setPrimaryVersion(trackId: string, versionId: string): Promise<void>;
    export function compareVersions(v1: TrackVersion, v2: TrackVersion): number;
    export function formatVersionLabel(version: TrackVersion): string;
    ```

- [ ] **T015** [P]: Создать утилиты плеера
  - Файл: `src/lib/player-utils.ts` (создать)
  - Функции:
    ```typescript
    export function formatTime(seconds: number): string;
    export function calculateProgress(current: number, total: number): number;
    export function shuffleQueue(items: Track[], currentIndex: number): Track[];
    export function getNextTrack(queue: PlaybackQueue): Track | null;
    ```

- [ ] **T016** [P]: Создать утилиты мобильной разработки
  - Файл: `src/lib/mobile-utils.ts` (создать)
  - Функции:
    ```typescript
    export function useIsMobile(): boolean;
    export function useTouchEvents(element: RefObject<HTMLElement>): TouchEventHandlers;
    export function triggerHapticFeedback(type: "light" | "medium" | "heavy"): void;
    export function isTouchDevice(): boolean;
    ```

---

### Фаза 1D: Foundational Hooks (5 задач)

**Зависимость**: Требуется завершение утилит (T014-T016)

- [ ] **T017** [P]: Создать useTrackVersions хук
  - Файл: `src/hooks/useTrackVersions.ts` (создать)
  - Использует: TanStack Query для кеширования
  - Функции: `fetchVersions`, `invalidateVersions`

- [ ] **T018**: Создать useVersionSwitcher хук
  - Файл: `src/hooks/useVersionSwitcher.ts` (создать)
  - Зависимость: T017 (useTrackVersions)
  - Функции: `switchToVersion`, `setPrimaryVersion`, `logVersionChange`

- [ ] **T019** [P]: Создать usePublicContent хук
  - Файл: `src/hooks/usePublicContent.ts` (создать)
  - Функции: `fetchPublicTracks`, `fetchPublicProjects`, `fetchPublicArtists`

- [ ] **T020**: Создать usePlayerState Zustand store
  - Файл: `src/hooks/usePlayerState.ts` (создать)
  - Store:
    ```typescript
    interface PlayerStore {
      state: PlayerState;
      setMode: (mode: PlayerMode) => void;
      play: (track: Track) => void;
      pause: () => void;
      seek: (time: number) => void;
      setVolume: (volume: number) => void;
    }
    ```

- [ ] **T021**: Создать usePlaybackQueue хук
  - Файл: `src/hooks/usePlaybackQueue.ts` (создать)
  - Зависимость: T020 (usePlayerState)
  - Функции: `addToQueue`, `removeFromQueue`, `reorderQueue`, `next`, `previous`, `toggleShuffle`, `setRepeatMode`

---

### Фаза 1E: Supabase Query Functions (3 задачи)

**Зависимость**: Требуется завершение миграций (T001-T006)

- [ ] **T022** [P]: Создать функции для публичного контента
  - Файл: `src/integrations/supabase/queries/public-content.ts` (создать)
  - Функции:
    ```typescript
    export async function getPublicTracks(filters?: Filters): Promise<Track[]>;
    export async function getPublicProjects(): Promise<Project[]>;
    export async function getPublicArtists(): Promise<Artist[]>;
    ```

- [ ] **T023** [P]: Создать функции для версионирования
  - Файл: `src/integrations/supabase/queries/versioning.ts` (создать)
  - Функции:
    ```typescript
    export async function getTrackVersions(trackId: string): Promise<TrackVersion[]>;
    export async function updatePrimaryVersion(trackId: string, versionId: string): Promise<void>;
    export async function createVersion(trackId: string, data: Partial<TrackVersion>): Promise<TrackVersion>;
    ```

- [ ] **T024** [P]: Создать функции для changelog
  - Файл: `src/integrations/supabase/queries/changelog.ts` (создать)
  - Функции:
    ```typescript
    export async function getTrackChangelog(trackId: string): Promise<TrackChangelog[]>;
    export async function logChange(change: Omit<TrackChangelog, "id" | "changed_at">): Promise<void>;
    ```

---

## 🎯 Критерии приемки спринта

- [ ] Все миграции успешно применены к локальной и dev БД
- [ ] Существующие треки имеют установленный `master_version_id`
- [ ] Все TypeScript типы обновлены и проходят проверку `tsc --noEmit`
- [ ] Базовые хуки работают и покрыты unit-тестами (опционально)
- [ ] Backend query функции работают корректно
- [ ] Нет breaking changes для существующих компонентов
- [ ] Все задачи в статусе "Завершено"

---

## 📝 Команды для разработки

### Запуск проекта

```bash
npm run dev
```

### Проверка типов

```bash
npx tsc --noEmit
```

### Линтинг

```bash
npm run lint
npm run lint -- --fix
```

### Форматирование

```bash
npm run format
```

### База данных (локальная)

```bash
# Запуск локальной Supabase
supabase start

# Применить миграции
supabase db push

# Сброс БД
supabase db reset

# Генерация типов
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### Тестирование

```bash
npm test
npm test:coverage
```

---

## 📚 Полезные ссылки

- 📄 Детальный план: `specs/copilot/audit-interface-and-optimize/tasks.md`
- 📊 План реализации: `specs/copilot/audit-interface-and-optimize/plan.md`
- 💾 Модель данных: `specs/copilot/audit-interface-and-optimize/data-model.md`
- 🔌 API контракты: `specs/copilot/audit-interface-and-optimize/contracts/`
- 📖 Quickstart: `specs/copilot/audit-interface-and-optimize/quickstart.md`

---

## ⚠️ Риски и митигация

| Риск                                       | Вероятность | Митигация                                   |
| ------------------------------------------ | ----------- | ------------------------------------------- |
| Миграция данных сломает существующие треки | Средняя     | Тестирование на копии БД перед production   |
| Breaking changes в типах                   | Высокая     | Постепенное внедрение с fallback значениями |
| Performance деградация после миграций      | Низкая      | Добавлены индексы, мониторинг запросов      |

---

## 🔄 Следующий спринт

**Sprint 008: Library & Player MVP (User Stories 1 & 2)**

- Период: 2025-12-15 - 2025-12-29
- Задачи: 22 задачи
- Фокус: Реализация UI компонентов для библиотеки и плеера

---

_Последнее обновление: 2025-12-02_
