# Аудит: Студия разделения на стемы

## Путь пользователя

```
Трек → StemsActionButton → StemSeparationModeDialog
  → выбор Simple (2 stems, 10💎) или Detailed (6+ stems, 50💎)
  → подтверждение → Edge Function → Suno API
  → StemSeparationProgress (progress bar + per-stem status)
  → stems → DB → Realtime → Studio
  → редактирование: IntegratedStemTracks/StudioShell
```

## Ключевые компоненты

| Компонент | LOC | Роль |
|-----------|-----|------|
| `StemSeparationModeDialog` | 177 | Выбор режима (simple/detailed) с Telegram SecondaryButton |
| `StemSeparationProgress` | 128 | Анимированный прогресс с иконками стемов |
| `IntegratedStemTracks` | ~300 | DAW-лента стемов (waveform, mute/solo, volume) |
| `StemSeparationModeDialog` | 177 | Выбор режима с превью стемов |
| `StudioShell` | ~200 | Оркестратор студии (десктоп) |
| `UnifiedStudioMobile` | ~250 | Мобильная DAW |
| `TrackStemsTab` | ~150 | Вкладка стемов на карточке трека |
| `StemEffectsPanel` | ~150 | EQ, компрессор, реверберация |
| `SectionEditor` | ~300 | Редактор секций |
| `StemReferenceDialog` | ~100 | Ссылки на стемы |

## Хуки (23 найдено)

| Хук | Назначение |
|-----|-----------|
| `useStemSeparation` | Запуск разделения на стемы |
| `useStemSeparationRealtime` | Realtime-прогресс через Supabase Realtime |
| `useTrackStems` | CRUD стемов для трека |
| `useStudioStemSync` | Синхронизация стемов с БД в студии |
| `useStemAudioEngine` | Аудио-движок для стемов |
| `useStemControls` | mute/solo/volume для стемов |
| `useStemEffects` | Эффекты (EQ, compressor, reverb) |
| `useStemTranscription` | Транскрипция стемов (MIDI ноты) |
| `useStemAnalyzer` | Анализ аудио (BPM, key, etc.) |
| `useBatchStemProcessing` | Пакетная обработка стемов |

## Сильные стороны

1. **Хорошая прогрессия**: от выбора режима до результата — прозрачный UX
2. **Realtime-прогресс**: per-stem анимация с иконками (вокал, ударные, бас...)
3. **Два режима**: simple (быстро, дёшево) vs detailed (максимум качества)
4. **Telegram SDK**: SecondaryButton для нативного cancel
5. **DAW-интерфейс**: waveform, mute/solo, volume — профессиональный UX
6. **Секционный редактор**: A/B сравнение, presets, валидация
7. **Эффекты**: EQ, компрессор, реверберация на каждый стем

## Находки и рекомендации

### S1: Нет fallback при закрытии диалога во время обработки
**Файл:** `StemSeparationModeDialog.tsx:82-85`  
**Проблема:** После нажатия "Начать" диалог можно закрыть (onOpenChange), но процесс уже запущен. Нет confirm "Вы уверены?"  
**Фикс:** Добавить `onOpenChange` guard: если `isProcessing`, показывать confirm "Отменить разделение?"

### S2: StemSeparationProgress не имеет кнопки "Показать в студии"
**Файл:** `StemSeparationProgress.tsx`  
**Проблема:** После завершения нет прямого действия — пользователь видит "Стемы готовы!" но не может сразу перейти в студию.  
**Фикс:** Добавить кнопку "Открыть в студии" при `isCompleted`.

### S3: Нет обработки ошибки при пустом результате
**Файл:** `useStemSeparation.ts`  
**Проблема:** Если Suno вернул пустой массив стемов, нет fallback-сообщения.  
**Фикс:** После `task.status === "completed"` проверить `receivedStems > 0`.

### S4: Не показывается предупреждение о длительности
**Проблема:** Detailed режим на треках > 5 минут может занимать 5+ минут и тратить много кредитов.  
**Фикс:** Добавить предупреждение при `track.duration > 300`: "Трек длиннее 5 минут — разделение может занять больше времени".

### S5: IntegratedStemTracks — нет пустого состояния
**Файл:** `IntegratedStemTracks.tsx`  
**Проблема:** Если стемов нет (или загрузка), компонент может показывать пустой список.  
**Фикс:** Добавить проверку `(!stems || stems.length === 0)` → EmptyState.

### S6: Нет undo для удаления стема
**Файл:** `IntegratedStemTracks.tsx` (onStemAction: "delete")  
**Проблема:** Удаление стема безвозвратное.  
**Фикс:** Добавить `AlertDialog` подтверждения перед удалением.

### S7: VirtualizedStemList — нет fallback на мобилах
**Файл:** `src/components/studio/VirtualizedStemList.tsx`  
**Проблема:** Virtual scrolling может не работать корректно в Telegram WebView.  
**Фикс:** На `isMobile` использовать обычный список вместо virtualized.

### S8: StemEffectsPanel — нет preset'ов
**Файл:** `StemEffectsPanel.tsx`  
**Проблема:** EQ/compressor/reverb без готовых пресетов (vocal, drums, bass).  
**Фикс:** Добавить пресеты для быстрой настройки.

### S9: Раздутые хуки
**Проблема:** `useStemSeparation` + `useStemSeparationRealtime` + `useStudioStemSync` — 3 хука с пересекающейся логикой.  
**Фикс:** Объединить или чётко разделить ответственность.

### S10: Нет мобильной skeleton-загрузки стемов
**Файл:** `StemTrackSkeleton.tsx`  
**Проблема:** Скелетон есть, но не адаптирован под мобильный DAW-интерфейс.  
**Фикс:** `StemTrackSkeleton` должен учитывать `useIsMobile`.

## Итого: 10 находок

| # | Серьёзность | Суть |
|---|-------------|------|
| S1 | Medium | Нет guard закрытия диалога во время обработки |
| S2 | Low | Нет кнопки "Открыть в студии" после завершения |
| S3 | Low | Нет обработки пустого результата |
| S4 | Low | Нет предупреждения о длительности |
| S5 | Medium | Нет EmptyState в IntegratedStemTracks |
| S6 | Low | Нет confirm при удалении стема |
| S7 | Low | Virtual scrolling в Telegram WebView |
| S8 | Low | Нет preset'ов эффектов |
| S9 | Medium | Дублирование логики в хуках |
| S10 | Low | Мобильный skeleton не адаптивный |
