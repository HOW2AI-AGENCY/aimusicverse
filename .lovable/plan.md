## Аудит Студии — итоги

Студия работает, но накопила три поколения одного и того же UI и несколько параллельных источников правды. Ниже — что нашли и в каком порядке чинить.

### Что хорошо
- Нет `console.*` и почти нет `any` в коде студии — дисциплина логирования и типов соблюдена.
- Замена секций (`useSectionReplacement` + `spliceSectionLyrics` + `SectionEditorSheet`) — самая аккуратная часть.
- Cleanup в `useEffect` для слушателей событий на месте.

### Ключевые проблемы

**Логика**
1. Три параллельных кэша версий: `track-versions`, `track-versions-unified`, `track-versions-switcher`; синхронизируются вручную списком из 15 ключей в `useVersionSwitcher.ts:165-182`. Любой новый потребитель, забытый в списке, покажет устаревшие версии.
2. Мёртвый код в бандле: `unified/UnifiedStudioMobile.tsx` и `unified/StudioDialogs.tsx` экспортируются из barrel, но нигде не рендерятся; `StudioShell/StudioDialogs.tsx` (445 строк) не используется — реально работает `StudioShellDialogs.tsx` (623 строки).
3. Дубли компонентов: `StudioActionsPanel` (в `actions/` и `panels/`), `StemActionSheet` (в `actions/` и `unified/`), `AddTrackDialog` (в `unified/` и `unified/StudioShell/`).
4. Устаревший `StudioVersionSelector` всё ещё рендерится в `StudioTrackRow.tsx:34`, хотя `UnifiedVersionSelector` заявлен как замена — два разных UI версий могут разъезжаться.
5. `useStudioAudioEngine.ts:48-78` документирует 6 нереализованных фич (loop, export, latency, MIDI sync, recording, automation), при этом в дереве есть `useLoopRegion`, `ExportMixDialog`, `RecordTrackDrawer` — нужно свести: либо подключить к движку, либо убрать декларацию TODO.
6. `useStudioHandlers.ts:119` — `// TODO: Open generate sheet`: обработчик молча ничего не делает.
7. `useSectionReplacement.ts:62-75` — асимметричное условие: если `trackTags` очистили сверху, `localTags` не сбросится.
8. `spliceSectionLyrics.ts:59-74` — вложенный перебор окон с LCS без ограничения размера входа.
9. Пять независимых `setInterval`-поллеров с разными интервалами (`useAudioSync`, `useStemAudioCache`, `StudioTranscriptionPanel` ×2, `useTransportSync`, `StudioPendingTrackRow`) без общей утилиты и backoff.
10. 17 файлов студии больше 500 строк (лимит проекта), крупнейшие: `StudioShell.tsx` 744, `useStudioAudioEngine.ts` 701, `StudioTranscriptionPanel.tsx` 718.

**Интерфейс**
11. Доступность: `aria-label` есть лишь в 11 из 152 файлов студии, при том что транспорт и микшер — сплошь иконочные кнопки.
12. Наложение слоёв: `AIActionsFAB` (`z-50`), `MobileStudioPlayerBar` (`z-50`) и оверлеи диалогов (`z-50`) не согласованы — порядок зависит от DOM, а не от намерения; нужно перевести на `src/lib/z-index.ts`.
13. Оверлей диалога скопирован инлайном в двух местах вместо общего примитива.
14. Мобильные и десктопные компоненты — параллельные наборы (`Mobile*.tsx` против `OptimizedTransport`/`StudioMixerPanel`) с собственной логикой, а не общий хук + адаптив.
15. `StemSeparationProgress.tsx:22-28` использует сырые `text-pink-500`/`text-orange-500` вместо `getStemColor`, из-за чего цвета стемов в прогрессе и в треке не совпадают.
16. Хардкод русских строк в TSX вместо i18n (`UnifiedStudioPage.tsx:49,59-66`, `useSectionReplacement.ts:168`).
17. Одна общая карточка ошибки на все причины в `UnifiedStudioPage.tsx:55-70` (не найдено / сеть / нет доступа).

---

## План работ

### Этап 1 — Чистка и снижение риска (без изменений UX)
- Удалить `unified/UnifiedStudioMobile.tsx`, `unified/StudioDialogs.tsx`, `unified/StudioShell/StudioDialogs.tsx` и их экспорты из barrel-файлов; проверить сборкой.
- Схлопнуть дубли: оставить по одному `StudioActionsPanel`, `StemActionSheet`, `AddTrackDialog`; остальные — удалить, импорты переписать.
- Заменить `StudioVersionSelector` на `UnifiedVersionSelector` в `StudioTrackRow` и удалить устаревший компонент.
- Перевести импорт `useStudioAudio` в `StudioShell` на канонический путь, удалить shim.

### Этап 2 — Единый источник правды по версиям
- Свести три namespace кэша к одному фабричному ключу `studioKeys.versions(trackId)`.
- `useVersionSwitcher` инвалидирует по префиксу вместо ручного списка из 15 ключей.
- Регресс-тест: переключение версии обновляет бейдж, обложку и длительность без перезагрузки.

### Этап 3 — Полировка логики
- Починить `useStudioHandlers.ts:119` (открытие sheet генерации).
- Исправить асимметрию сброса тегов в `useSectionReplacement`.
- Ограничить окно поиска в `spliceSectionLyrics` и покрыть тестом на длинной лирике.
- Ввести общий `useStudioPolling(fn, {interval, backoff, enabled})` и перевести на него все 5 поллеров.
- Привести doc-блок `useStudioAudioEngine` в соответствие с реальностью: подключить loop/export/record к движку либо явно пометить как отдельный путь.

### Этап 4 — Интерфейс
- Токены слоёв: все `z-50` в студии → константы из `src/lib/z-index.ts` (player bar < FAB < sheet < dialog).
- Общий `StudioOverlay`-примитив вместо копипасты оверлея.
- Цвета стемов везде через `getStemColor`, убрать сырые Tailwind-палитры.
- Доступность: `aria-label` на все иконочные кнопки транспорта, микшера, стем-панели; тач-таргеты ≥44px; проверка axe.
- Разделить состояния ошибок страницы студии: не найдено / нет доступа / сеть, с корректным действием в каждой.
- Вынести хардкод-строки в i18n-ключи `studio.*`.

### Этап 5 — Декомпозиция
- Разбить `StudioShell.tsx`, `useStudioAudioEngine.ts`, `StudioTranscriptionPanel.tsx`, `StudioShellDialogs.tsx` до <500 строк, вынося логику в хуки.
- Свести дублирующиеся drag-listener реализации (5 штук) в `useDragListener`.

### Технические детали
- Проверка после каждого этапа: `tsgo`, `npm test`, `npm run size` (лимит 950 КБ — этапы 1 и 5 должны его снизить).
- Визуальные регресс-тесты студии на 360px и десктопе после этапа 4.
- Изменения этапов 1-2 затрагивают публичные barrel-экспорты — нужен полный прогон сборки перед мержем.
