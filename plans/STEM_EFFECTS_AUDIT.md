# Аудит: Обработка стемов, эффекты и архитектура

## 1. Эффекты (EQ, компрессор, реверб)

**Текущее состояние:** ✅ Работает через Web Audio API
- `StemEffectsPanel` — EQ (low/mid/high), Compressor, Reverb
- Пресеты для каждого эффекта
- Сброс всех эффектов
- **НО:** Эффекты только в реальном времени (in-browser). Не сохраняются на диск.

## 2. Проблема: simple → detailed upgrade

**Сценарий:** Пользователь разделил трек на 2 стема (vocal + instrumental). 
Захотел детальные стемы (bass, drums, guitar, keys).

**Текущее поведение:** `useStudioOperationLock` блокирует `separate_stems` 
после первого разделения (строка 111: `blocked.push("separate_stems")`).

**Варианты решения:**

### Вариант A (рекомендуемый): Замена — переразделить (re-separate)

```
Simple stems (vocal + instrumental) 
  → удалить старые стемы 
  → запустить detailed separation 
  → новые 6+ стемов
```

- Понятно пользователю
- Не плодит дубликаты
- Но теряет изменения в старых стемах (если были)

**UX:** Кнопка "Разделить детально" → диалог с предупреждением:
> "Стемы уже созданы. Детальное разделение заменит существующие 
> стемы (vocal + instrumental) на 6+ отдельных дорожек."

### Вариант B: Дополнить — стемы поверх стемов

```
Original track (full mix)
  ├── Vocal stem (simple)
  ├── Instrumental stem (simple)
  ├── Bass stem (detailed — added later)
  ├── Drums stem (detailed — added later)
  └── ... (added later)
```

- Сохраняет старые стемы
- Сложнее в реализации (разделение исходного трека поверх существующих стемов)
- Может запутать пользователя

## 3. Сохранение аудио с эффектами (Bounce/Render)

**Текущее состояние:** Нет bounce-функции. Эффекты только в реальном времени.

**Требуется:** OfflineAudioContext для рендеринга модифицированного аудио.

### Архитектура bounce:

```
┌─────────────────────────────────────────┐
│  OfflineAudioContext (sampleRate, dur)  │
│                                         │
│  Source (original audio buffer)         │
│    → BiquadFilterNode (EQ)             │
│    → DynamicsCompressorNode             │
│    → ConvolverNode (reverb)            │
│    → GainNode (volume)                 │
│    → destination                       │
│                                         │
│  render → AudioBuffer → WAV encoder    │
│    → upload to Supabase Storage         │
│    → update track_versions.audio_url    │
└─────────────────────────────────────────┘
```

**Компоненты:**
- `useBounceToAudio` — хук, запускает рендеринг
- `BounceDialog` — UI: прогресс + подтверждение
- Edge function `upload-bounced-audio` — загружает результат

## 4. Интерфейс: меню действий со стемами

**Текущее:** `StemActionSheet` (253 LOC) — bottom sheet с grouped actions.
Действия: mute, solo, volume, effects, MIDI, download, delete.

**Работоспособность:** ✅ Все функции работают:
- Mute/solo → Web Audio gain nodes (исправлено в a7e5c1fd)
- Volume → audioEngine.setTrackVolume
- Effects → StemEffectsPanel (EQ/compressor/reverb)
- MIDI → SunoAPI (vocal/instrumental) или Klangio (detailed)
- Download → NotationDrawer

## 5. План реализации

### P0 (сейчас)
1. ✅ UI: Simple → Detailed upgrade warning (есть)
2. ✅ Effects panel (есть)
3. ✅ MIDI provider routing (сделано)

### P1 (следующий спринт)
4. Re-separate logic — удаление старых стемов + запуск detailed separation
5. Bounce to audio — OfflineAudioContext рендеринг
6. Сохранение bounce в Supabase Storage

### P2 (будущее)
7. Пресеты эффектов для типов стемов (vocal presets, drum presets...)
8. Non-destructive editing (undo/redo для эффектов)
