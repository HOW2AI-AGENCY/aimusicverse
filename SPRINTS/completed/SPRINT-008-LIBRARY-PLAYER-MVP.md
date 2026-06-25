# Спринт 008: MVP - Library & Player (User Stories 1 & 2)

- **Продолжительность:** 2025-12-15 - 2025-12-29 (2 недели)
- **Цель:** Реализовать критически важные пользовательские сценарии для мобильной библиотеки с системой версионирования и оптимизированный плеер с управлением очередью. Это MVP для mobile-first подхода.

## Контекст

Этот спринт объединяет **User Story 1 (Library Mobile Redesign & Versioning)** и **User Story 2 (Player Mobile Optimization)** из детального плана. Обе истории имеют приоритет **P1** и являются фундаментом для пользовательского опыта.

### User Story 1: Library Mobile Redesign & Versioning

**Как пользователь мобильного устройства**, я хочу видеть компактную, удобную библиотеку с поддержкой версий треков, чтобы эффективно управлять своей музыкой одной рукой.

### User Story 2: Player Mobile Optimization

**Как пользователь мобильного устройства**, я хочу иметь адаптивный плеер с тремя режимами (компактный/расширенный/полноэкранный), чтобы слушать музыку без отрыва от других задач.

## Задачи User Story 1: Library (10 задач)

### Компоненты библиотеки

| ID      | Название                                                                                                                      | Статус | Файл                                    | Ответственный |
| ------- | ----------------------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------- | ------------- |
| US1-T01 | **TrackCard Mobile Redesign** - Адаптировать TrackCard для мобильных: touch targets ≥44px, swipe gestures, оптимизация layout | To Do  | `src/components/TrackCard.tsx`          | Frontend      |
| US1-T02 | **TrackRow Component** - Создать компонент для строчного отображения в list режиме                                            | To Do  | `src/components/TrackRow.tsx`           | Frontend      |
| US1-T03 | **VersionBadge Component** - Бейдж с количеством версий и индикатор master версии                                             | To Do  | `src/components/VersionBadge.tsx`       | Frontend      |
| US1-T04 | **VersionSwitcher Component** - UI для переключения между версиями трека                                                      | To Do  | `src/components/VersionSwitcher.tsx`    | Frontend      |
| US1-T05 | **TrackTypeIcons Component** - Иконки для инструментала, вокала, стемов                                                       | To Do  | `src/components/TrackTypeIcons.tsx`     | Frontend      |
| US1-T06 | **Library Page Update** - Интеграция новых компонентов, backend фильтрация, lazy loading                                      | To Do  | `src/pages/Library.tsx`                 | Frontend      |
| US1-T07 | **Swipe Actions** - Реализовать swipe-to-like, swipe-to-delete, haptic feedback                                               | To Do  | `src/components/TrackCard.tsx`          | Frontend      |
| US1-T08 | **Skeleton Loaders** - Скелетоны для TrackCard и TrackRow                                                                     | To Do  | `src/components/ui/skeleton-loader.tsx` | Frontend      |
| US1-T09 | **Library Tests** - Unit и integration тесты для версионирования                                                              | To Do  | `src/pages/Library.test.tsx`            | QA            |
| US1-T10 | **Library Mobile E2E** - E2E тесты с Playwright на мобильном viewport                                                         | To Do  | `tests/e2e/library.spec.ts`             | QA            |

### Критерии приемки US1

- [ ] TrackCard корректно отображается на разрешениях 320px-1920px
- [ ] Touch targets всех интерактивных элементов ≥44×44px
- [ ] Swipe gestures работают с haptic feedback (iOS/Android)
- [ ] Версии треков отображаются с бейджами и возможностью переключения
- [ ] Master версия помечена визуально, все действия применяются к ней
- [ ] List/Grid режимы переключаются плавно с анимацией
- [ ] Lazy loading работает, скелетоны отображаются при загрузке
- [ ] Performance: Lighthouse Mobile Score >90, FCP <2s на 3G
- [ ] Accessibility: WCAG 2.1 AA, все элементы имеют ARIA labels

## Задачи User Story 2: Player (12 задач)

### Компоненты плеера

| ID      | Название                                                                                               | Статус | Файл                                         | Ответственный |
| ------- | ------------------------------------------------------------------------------------------------------ | ------ | -------------------------------------------- | ------------- |
| US2-T01 | **CompactPlayer Redesign** - Минималистичный плеер (cover, title, play/pause) высотой 64px             | To Do  | `src/components/CompactPlayer.tsx`           | Frontend      |
| US2-T02 | **ExpandedPlayer Component** - Средний режим: cover, progress, basic controls (200px)                  | To Do  | `src/components/ExpandedPlayer.tsx`          | Frontend      |
| US2-T03 | **FullscreenPlayer Redesign** - Полноэкранный режим: синхронизированная лирика, waveform, все контролы | To Do  | `src/components/FullscreenPlayer.tsx`        | Frontend      |
| US2-T04 | **PlaybackControls Component** - Универсальные контролы: play/pause, skip, shuffle, repeat             | To Do  | `src/components/player/PlaybackControls.tsx` | Frontend      |
| US2-T05 | **ProgressBar Component** - Прогресс бар с seek, buffering indicator, touch-friendly                   | To Do  | `src/components/player/ProgressBar.tsx`      | Frontend      |
| US2-T06 | **QueueSheet Component** - Bottom sheet с очередью воспроизведения (drag-to-reorder)                   | To Do  | `src/components/player/QueueSheet.tsx`       | Frontend      |
| US2-T07 | **QueueItem Component** - Элемент очереди с drag handle и swipe-to-remove                              | To Do  | `src/components/player/QueueItem.tsx`        | Frontend      |
| US2-T08 | **TimestampedLyrics Update** - Исправить синхронизацию и видимость на мобильных                        | To Do  | `src/components/TimestampedLyrics.tsx`       | Frontend      |
| US2-T09 | **Player State Management** - Интеграция usePlayerState, usePlaybackQueue хуков                        | To Do  | `src/hooks/usePlayerState.ts`                | Frontend      |
| US2-T10 | **Player Transitions** - Плавные переходы между режимами плеера с анимациями                           | To Do  | `src/components/player/`                     | Frontend      |
| US2-T11 | **Player Tests** - Unit тесты для всех компонентов плеера                                              | To Do  | `src/components/player/*.test.tsx`           | QA            |
| US2-T12 | **Player Mobile E2E** - E2E тесты для всех режимов плеера и очереди                                    | To Do  | `tests/e2e/player.spec.ts`                   | QA            |

### Критерии приемки US2

- [ ] CompactPlayer занимает 64px и не мешает контенту
- [ ] ExpandedPlayer открывается свайпом вверх, закрывается свайпом вниз
- [ ] FullscreenPlayer отображает синхронизированную лирику (если доступна)
- [ ] Прогресс бар работает на касание, отображает buffering
- [ ] QueueSheet поддерживает drag-to-reorder и swipe-to-remove
- [ ] Shuffle и repeat работают корректно
- [ ] Background audio (если поддерживается платформой)
- [ ] Performance: Smooth animations 60fps, аудио не прерывается
- [ ] Accessibility: Keyboard navigation, screen reader support

## Техническая реализация

### Mobile-First CSS

```css
/* Touch targets минимум 44×44px */
.touch-target {
  min-width: 44px;
  min-height: 44px;
}

/* Breakpoints */
@media (max-width: 640px) {
  /* mobile */
}
@media (min-width: 641px) and (max-width: 1024px) {
  /* tablet */
}
@media (min-width: 1025px) {
  /* desktop */
}
```

### Gesture Support

- Используйте `framer-motion` для swipe gestures
- Haptic feedback через `@twa-dev/sdk` для Telegram Mini Apps
- Touch event handlers с passive для scroll performance

### Performance

- Lazy loading изображений с placeholder
- Virtual scrolling для больших списков (react-window)
- Debounce для поиска и фильтрации
- Memoization компонентов (React.memo)

## Критерии приемки спринта

- [ ] Все задачи US1 и US2 выполнены
- [ ] Code review пройден
- [ ] Unit тесты: покрытие >80%
- [ ] E2E тесты проходят на mobile viewport (375×667, 390×844)
- [ ] Performance: Lighthouse Mobile >90
- [ ] Accessibility: WCAG 2.1 AA
- [ ] Визуальная регрессия: Скриншоты сохранены в Storybook
- [ ] Документация обновлена

## Зависимости

- ✅ Sprint 007 завершен (миграции, типы, хуки)
- ⏳ Design assets для новых компонентов
- ⏳ Тестовые данные (треки с версиями)

## Риски

- **Сложность анимаций:** Framer Motion может быть сложным. Решение: начать с простых анимаций
- **Performance на старых устройствах:** Могут быть лаги. Решение: Profiling, оптимизация
- **Gesture conflicts:** Swipe может конфликтовать со scroll. Решение: Threshold и direction detection

## Следующий спринт

**Sprint 009: Track Details & Actions (User Stories 3 & 4)**

- Панель деталей трека с исправленным отображением лирики
- Меню действий с новыми функциями (Create Persona, Open in Studio)
- Добавление в проекты/плейлисты

## Ссылки

- 📄 Детальные задачи: `specs/copilot/audit-interface-and-optimize/tasks.md` (T025-T046)
- 🎨 Design mockups: `docs/design/library-player-mvp/`
- 🧪 Test plan: `specs/copilot/audit-interface-and-optimize/test-plan.md`
