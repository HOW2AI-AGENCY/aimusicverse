# Спринт 009: Track Details & Actions (User Stories 3 & 4)

- **Продолжительность:** 2025-12-29 - 2026-01-12 (2 недели)
- **Статус:** ⏳ **ЗАПЛАНИРОВАН**
- **Цель:** Реализовать панель деталей трека и расширенное меню действий для полноценной работы с треками, версиями, стемами и AI-анализом.
- **Зависимости:** Sprint 008 (Library & Player MVP) должен быть завершен

## Инфраструктурные заметки

### Используемые таблицы (актуальная схема)
- `track_versions` - версии треков (поле `is_primary` для главной версии)
- `track_stems` - стемы треков
- `track_change_log` - история изменений (НЕ track_changelog!)
- `audio_analysis` - AI-анализ треков (НЕ track_analysis!)

### Хуки для использования
- `useTrackVersions` из `src/hooks/useTrackVersions.ts` (НЕ .tsx!)
- `useVersionSwitcher` из `src/hooks/useVersionSwitcher.ts`
- `useTrackDetails` из `src/hooks/useTrackDetails.ts`

## Контекст

Этот спринт реализует User Stories 3 и 4 из детального плана E007 Mobile-First UI/UX Redesign. Фокус - на расширенных возможностях взаимодействия с треками:
- **US3**: Track Details Panel (P2) - детальная информация о треке
- **US4**: Track Actions Menu (P2) - расширенные действия с треками

## Задачи

### User Story 3: Track Details Panel (11 задач)

| ID | Название | Статус | Приоритет | Ответственный |
|---|---|---|---|---|
| US3-T01 | **TrackDetailsSheet Component** - Bottom sheet с табами для деталей трека | ⏳ Planned | P0 | Frontend |
| US3-T02 | **TrackDetailsTab Component** - Вкладка с основной информацией (title, style, date, duration) | ⏳ Planned | P0 | Frontend |
| US3-T03 | **LyricsView Component** - Отображение лирики (normal и timestamped) | ⏳ Planned | P0 | Frontend |
| US3-T04 | **VersionsTab Component** - Список версий трека с переключением | ⏳ Planned | P0 | Frontend |
| US3-T05 | **StemsTab Component** - Список стемов с preview и download | ⏳ Planned | P1 | Frontend |
| US3-T06 | **AnalysisTab Component** - AI анализ трека (жанр, настроение, BPM, key) | ⏳ Planned | P1 | Frontend |
| US3-T07 | **ChangelogTab Component** - История изменений трека | ⏳ Planned | P2 | Frontend |
| US3-T08 | **useTrackDetails Hook** - Хук для получения полных деталей трека | ⏳ Planned | P0 | Frontend |
| US3-T09 | **Backend API для Track Details** - Endpoint для получения деталей + анализа | ⏳ Planned | P0 | Backend |
| US3-T10 | **Track Details Tests** - Unit тесты для компонентов | ⏳ Planned | P2 | Frontend |
| US3-T11 | **Track Details E2E** - E2E тесты взаимодействия | ⏳ Planned | P2 | Frontend |

### User Story 4: Track Actions Menu (8 задач)

| ID | Название | Статус | Приоритет | Ответственный |
|---|---|---|---|---|
| US4-T01 | **CreatePersonaDialog Component** - Диалог создания персоны из трека | ⏳ Planned | P0 | Frontend |
| US4-T02 | **OpenInStudio Action** - Открытие трека в Stem Studio | ⏳ Planned | P0 | Frontend |
| US4-T03 | **AddToProjectDialog Component** - Диалог добавления в проект | ⏳ Planned | P0 | Frontend |
| US4-T04 | **PlaylistSelector Component** - Выбор плейлиста для добавления | ⏳ Planned | P1 | Frontend |
| US4-T05 | **ShareTrackDialog Component** - Диалог шаринга трека | ⏳ Planned | P1 | Frontend |
| US4-T06 | **Backend API для Actions** - Endpoints для создания персоны, добавления в проект/плейлист | ⏳ Planned | P0 | Backend |
| US4-T07 | **Track Actions Tests** - Unit тесты для action компонентов | ⏳ Planned | P2 | Frontend |
| US4-T08 | **Track Actions E2E** - E2E тесты для action flows | ⏳ Planned | P2 | Frontend |

## Критерии приемки

### User Story 3: Track Details Panel

#### Функциональные требования ✅
- [ ] TrackDetailsSheet открывается из TrackCard/TrackRow
- [ ] Все табы (Details, Lyrics, Versions, Stems, Analysis, Changelog) работают
- [ ] Normal lyrics отображается с разбиением на строки
- [ ] Timestamped lyrics синхронизируется с текущим временем воспроизведения
- [ ] Версии отображаются с деталями (дата, размер, label)
- [ ] Переключение версии обновляет UI и плеер
- [ ] Стемы отображаются с иконками типа (vocals, drums, bass, etc.)
- [ ] AI анализ показывает: genre, mood, BPM, key, energy, danceability
- [ ] Changelog отображает историю изменений с датами и авторами

#### UI/UX ✅
- [ ] Bottom sheet плавно открывается/закрывается
- [ ] Табы переключаются с плавной анимацией
- [ ] Touch targets ≥44×44px
- [ ] Скроллинг работает плавно
- [ ] Loading states для всех асинхронных операций
- [ ] Error states с user-friendly сообщениями

### User Story 4: Track Actions Menu

#### Функциональные требования ✅
- [ ] CreatePersonaDialog создает персону на основе стиля трека
- [ ] Open in Studio доступно только для треков со стемами
- [ ] AddToProjectDialog показывает список проектов пользователя
- [ ] PlaylistSelector показывает список плейлистов + кнопку "Create new"
- [ ] ShareTrackDialog генерирует публичную ссылку на трек
- [ ] Все actions обновляют UI оптимистично
- [ ] Все actions имеют confirmation/success feedback

#### UI/UX ✅
- [ ] Диалоги открываются с плавной анимацией
- [ ] Form validation работает корректно
- [ ] Haptic feedback при действиях
- [ ] Disabled states для недоступных actions
- [ ] Loading indicators при асинхронных операциях

### Качество кода ✅
- [ ] Code review пройден
- [ ] TypeScript: 0 ошибок `tsc --noEmit`
- [ ] ESLint: 0 новых ошибок `npm run lint`
- [ ] Prettier: код отформатирован `npm run format`
- [ ] Unit тесты: >80% coverage (опционально)

### Performance ✅
- [ ] Lighthouse Mobile Score >90
- [ ] Детали трека загружаются <1s
- [ ] Lazy loading для стемов и анализа
- [ ] Smooth animations 60fps

### Accessibility ✅
- [ ] WCAG 2.1 AA compliance
- [ ] ARIA labels на интерактивных элементах
- [ ] Keyboard navigation работает
- [ ] Screen reader support

## Зависимости

### Внешние зависимости
- ✅ Sprint 008 завершен (Library & Player MVP)
- ⏳ Design assets для новых компонентов
- ⏳ Backend API endpoints готовы
- ⏳ Database schema для playlists (из Sprint 007 backlog)

### NPM пакеты (уже установлены)
```bash
# Все необходимые пакеты уже установлены:
# - framer-motion (анимации)
# - @tanstack/react-query (data fetching)
# - @twa-dev/sdk (Telegram integration)
# - shadcn/ui components
```

## Риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Сложность AI анализа | Средняя | Средне | Использовать существующие API, fallback для отсутствующих данных |
| Performance с большими lyrics | Низкая | Средне | Виртуализация длинных текстов, lazy loading |
| Playlists schema не готова | Средняя | Высокое | Проверить миграции из Sprint 007, создать при необходимости |
| Backend API delays | Низкая | Высокое | Mock data для разработки, parallel работа frontend/backend |

## Следующий спринт

**Sprint 010: Homepage Discovery & AI Assistant (User Stories 5 & 6)**
- Период: 2026-01-12 - 2026-01-26
- Задачи: 25 задач
- Фокус:
  - Homepage с публичным контентом (featured/new/popular/personalized)
  - AI Assistant режим для пошаговой генерации музыки
  - Infinite scroll с lazy loading
  - Context-aware prompts

## Метрики успеха

### User Story 3: Track Details
- Details sheet открывается <500ms
- Версии переключаются <300ms
- AI анализ загружается <2s
- Changelog pagination работает плавно

### User Story 4: Track Actions
- Create Persona завершается <3s
- Add to Project/Playlist <1s
- Share link генерируется <500ms
- All actions имеют optimistic updates

## Полезные ссылки

- 📄 Детальный план: `specs/copilot/audit-interface-and-optimize/tasks.md` (T047-T065)
- 📊 Спецификация: `specs/copilot/audit-interface-and-optimize/spec.md`
- 💾 Модель данных: `specs/copilot/audit-interface-and-optimize/data-model.md`
- 🔌 API контракты: `specs/copilot/audit-interface-and-optimize/contracts/`
- 📖 Quickstart: `specs/copilot/audit-interface-and-optimize/quickstart.md`

---

*Создано: 2025-12-02*  
*Статус: Готов к запуску после завершения Sprint 008*
