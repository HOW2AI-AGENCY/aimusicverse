# Список задач для Спринта 009

**Спринт**: 009 - Track Details & Actions (User Stories 3 & 4)  
**Период**: 2025-12-01 - 2025-12-04 (завершён досрочно)  
**Цель**: Реализовать панель деталей трека с лирикой, версиями, стемами, AI-анализом и расширенное меню действий

---

## 📊 Прогресс спринта

**Общий прогресс**: 95% (18/19 задач)

- ✅ **Завершено**: 18 задач
- ⏳ **Отложено**: 1 задача (плейлисты - требует создания таблиц)

---

## 🎯 Пользовательские сценарии (User Stories)

### User Story 3: Track Details Panel (P2) ✅ ЗАВЕРШЕНО

**Как пользователь**, я хочу видеть полную информацию о треке с лирикой, версиями, стемами и AI-анализом.

**Критерии приемки**:

1. ✅ Details sheet открывается из TrackCard/TrackRow
2. ✅ 6 табов: Details, Lyrics, Versions, Stems, Analysis, Changelog
3. ✅ Normal и timestamped лирика с авто-скроллингом
4. ✅ Version-aware компоненты с A/B переключением
5. ✅ AI analysis с визуализацией
6. ✅ Smooth animations 60fps
7. ✅ Lazy loading для стемов

### User Story 4: Track Actions Menu (P2) ✅ ЗАВЕРШЕНО

**Как пользователь**, я хочу расширенные действия с треком.

**Критерии приемки**:

1. ✅ Create Artist (Persona) из трека
2. ✅ Open in Studio для треков со стемами
3. ✅ Add to Project
4. ⏳ Add to Playlist (UI готов, таблицы не созданы)
5. ✅ Share track с публичной ссылкой
6. ✅ Optimistic updates
7. ✅ Haptic feedback
8. ✅ Confirmation dialogs

---

## 📋 Задачи User Story 3: Track Details Panel

### US3-T01: TrackDetailsSheet Component ✅ ЗАВЕРШЕНО

- **Файл**: `src/components/TrackDetailSheet.tsx`
- Responsive bottom sheet с табами
- Swipe down to close

### US3-T02: TrackDetailsTab Component ✅ ЗАВЕРШЕНО

- **Файл**: `src/components/track-detail/TrackDetailsTab.tsx`
- Cover, title, style, tags, duration, badges

### US3-T03: LyricsView Component ✅ ЗАВЕРШЕНО

- **Файл**: `src/components/lyrics/UnifiedLyricsView.tsx`
- Normal и timestamped режимы
- Авто-скролл с паузой при ручном скролле
- Подсветка активной строки

### US3-T04: VersionsTab Component ✅ ЗАВЕРШЕНО

- **Файл**: `src/components/track/VersionsTab.tsx`
- Список версий A/B/C...
- Master version switching
- Синхронизация is_primary + active_version_id

### US3-T05: StemsTab Component ✅ ЗАВЕРШЕНО

- **Файл**: `src/components/track/StemsTab.tsx`
- Список стемов
- Play/download actions

### US3-T06: AnalysisTab Component ✅ ЗАВЕРШЕНО

- **Файл**: `src/components/track/AnalysisTab.tsx`
- AI analysis data display
- Визуализация результатов

### US3-T07: ChangelogTab Component ✅ ЗАВЕРШЕНО

- **Файл**: `src/components/track/ChangelogTab.tsx`
- История изменений трека

---

## 📋 Задачи User Story 4: Track Actions Menu

### US4-T01: CreateArtistDialog Component ✅ ЗАВЕРШЕНО

- **Файл**: `src/components/CreateArtistDialog.tsx`
- Создание AI артиста из трека
- Генерация портрета

### US4-T02: OpenInStudio Action ✅ ЗАВЕРШЕНО

- **Файл**: `src/components/TrackActionsMenu.tsx`
- Навигация в /studio/{trackId}
- Показывается только если has_stems > 0

### US4-T03: AddToProjectDialog ✅ ЗАВЕРШЕНО

- **Файл**: `src/components/track-menu/AddToProjectDialog.tsx`
- Добавление трека в проект

### US4-T04: ShareTrackDialog ✅ ЗАВЕРШЕНО

- **Файл**: `src/components/track-menu/ShareTrackDialog.tsx`
- Telegram Stories, Share URL, Download

### US4-T05: PlaylistSelector ⏳ ОТЛОЖЕНО

- **Файл**: `src/components/track-menu/PlaylistSelector.tsx`
- UI готов, показывает "coming soon"
- **Блокер**: Таблицы playlists/playlist_tracks не созданы

### US4-T06: ConfirmationDialog ✅ ЗАВЕРШЕНО

- **Файл**: `src/components/ConfirmationDialog.tsx`
- Destructive actions confirmation

### US4-T07: Haptic Feedback Integration ✅ ЗАВЕРШЕНО

- **Файл**: `src/lib/haptic.ts`, `src/lib/mobile-utils.ts`
- Vibration на действия

### US4-T08: Optimistic Updates ✅ ЗАВЕРШЕНО

- React Query mutations с optimistic updates
- Rollback on error

---

## ✅ Дополнительные исправления (2025-12-04)

В рамках спринта также выполнены критические исправления:

| Задача                   | Статус | Описание                                                 |
| ------------------------ | ------ | -------------------------------------------------------- |
| RLS Security Fix         | ✅     | Исправлены политики profiles и track_likes               |
| Lyrics Auto-scroll       | ✅     | Добавлен isProgrammaticScrollRef для корректного скролла |
| Telegram All Versions    | ✅     | Отправка всех версий A/B в уведомлениях                  |
| suno-send-audio FormData | ✅     | Корректные названия треков в Telegram                    |
| Version Sync             | ✅     | Синхронизация is_primary + active_version_id             |
| TODO/FIXME Cleanup       | ✅     | Закрыто 12 аннотаций                                     |
| Telegram Like            | ✅     | Реализован toggle лайков                                 |
| Telegram Track Details   | ✅     | Показ информации о треке                                 |

---

## 🎯 Критерии приемки спринта ✅ ВЫПОЛНЕНЫ

### Функциональные требования

- [x] Все задачи US3 (1-7) выполнены
- [x] Задачи US4 (1-4, 6-8) выполнены
- [x] TrackDetailsSheet работает со всеми табами
- [x] Create Artist создает артиста из трека
- [x] Open in Studio открывает редактор стемов
- [x] Add to Project добавляет трек
- [ ] Add to Playlist (отложено - нужны таблицы)
- [x] Share Track работает

### Качество кода

- [x] TypeScript: 0 критических ошибок
- [x] ESLint: основные ошибки исправлены
- [x] Security: RLS политики обновлены

### Performance

- [x] Details sheet открывается <500ms
- [x] Версии переключаются <300ms
- [x] Smooth animations

---

## 🔄 Следующий спринт

**Sprint 010: Homepage Discovery & AI Assistant (User Stories 5 & 6)**

- Период: Планируется
- Задачи: Homepage с публичным контентом и AI Assistant режим

---

_Последнее обновление: 2025-12-04_
