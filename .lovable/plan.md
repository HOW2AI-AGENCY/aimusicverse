## Задача 1 — Кнопки «Персона» и «Проект» в форме генерации

**Диагноз.** В `GenerateFormActions.tsx` клик по чипам вызывает `setProjectDialogOpen(true)` / `setArtistDialogOpen(true)` в `GenerateSheet.legacy.tsx`. Диалоги (`ProjectTrackSelector`, `ArtistSelector`) рендерятся через `GenerateSheetDialogs` как сиблинг `<SheetContent>` внутри `<Sheet>`-Root. Диалоги обёрнуты в `UnifiedDialog(variant="modal")`, который на мобильном автоматически переключается на кастомный `SheetDialog` (`src/components/dialog/variants/sheet.tsx`) с `fixed inset-0 z-[170]`. Проблема — этот кастомный SheetDialog **рендерится в исходное место дерева**, а не в портал, поэтому попадает внутрь Radix-портала внешнего `<Sheet>`. Внешний Radix Sheet имеет `pointer-events: auto` только на content — соседний нестед-диалог получает pointer-events блокировку от Radix focus-scope/dismissable-layer.

**Фикс.** Заменить в `ProjectTrackSelector` и `ArtistSelector` вызовы `UnifiedDialog` на нативный shadcn `Sheet`/`Dialog` (тот же, что использует внешний GenerateSheet), либо оборачивать содержимое в `createPortal(..., document.body)`. Более простой путь — использовать `Sheet side="bottom"` из `@/components/ui/sheet`, который правильно портализуется и корректно вложен в Radix-дерево диалогов.

## Задача 2 — Редизайн записи/загрузки голоса в VoiceCloneWizard

**Текущее состояние** (`src/components/voice-clone/`):
- Простая запись через `useVoiceRecorder` (без визуализации волны)
- Нет прослушивания записи перед отправкой
- Нет обрезки (trim) диапазона
- Нет выбора языка (в API уже есть параметр `language`)
- Разметка Wizard-шагов плотная, плохо читается на 390px

**Что делаю:**

1. **Waveform-визуализация** — новый компонент `VoiceWaveformEditor.tsx`:
   - Real-time визуализация уровня во время записи (AnalyserNode + Canvas, 60fps)
   - Пост-запись: полный waveform через `waveformGenerator.ts` (уже есть в проекте)
   - Два drag-handle для trim-диапазона (start/end) поверх волны

2. **Плеер прослушивания** — использует существующий `usePreviewAudio()` хук:
   - Play/Pause с индикатором позиции поверх waveform
   - Loop-preview именно trim-диапазона
   - Прогресс синхронизирован с waveform

3. **Trim** — нужен только клиентский срез до отправки:
   - Web Audio API: decode → cut buffer → re-encode в WebM/WAV через `OfflineAudioContext`
   - Файл `src/lib/audio/trimAudio.ts` (новый)
   - Отправляем в `voiceCloneApi.uploadSource(...)` уже обрезанный blob
   - `vocalStartS`/`vocalEndS` считаются от 0 (после реального среза)

4. **Выбор языка** — селектор с 8 языками (ru/en/es/de/fr/it/ja/zh) через shadcn `Select`, дефолт из `navigator.language`. Прокидывается в `voiceCloneApi.validate({ language })`.

5. **Разметка** (mobile-first, 390px):
   - Убираю плотный wizard-header, оставляю шаг + прогресс тонкой чертой
   - Waveform во всю ширину, 96px высотой
   - Trim-handles 44×44 touch target
   - Плеер + trim-контролы в одну плитку под волной
   - Селектор языка + название голоса в свернутой карточке "Настройки"
   - Кнопки действий: секция снизу, safe-area, sticky

## Технические детали

**Задача 1** — правки в двух файлах:
- `src/components/generate-form/ProjectTrackSelector.tsx` — заменить `UnifiedDialog` на `Sheet` из `@/components/ui/sheet` с `side="bottom"`
- `src/components/generate-form/ArtistSelector.tsx` — то же

**Задача 2** — новые/обновлённые файлы:
- `src/lib/audio/trimAudio.ts` — Web Audio trim + WAV encoder (новый, ~80 LOC)
- `src/components/voice-clone/VoiceWaveformEditor.tsx` — waveform + trim + play (новый, ~200 LOC)
- `src/components/voice-clone/steps/RecordStep.tsx` — переработка разметки, интеграция VoiceWaveformEditor
- `src/components/voice-clone/steps/UploadStep.tsx` — то же (если есть отдельный шаг)
- `src/components/voice-clone/VoiceCloneWizard.tsx` — селектор языка, прогресс, sticky footer

**Что не трогаю:**
- Edge-функции `suno-voice-*` (только фронт)
- `useVoiceRecorder` (API совместимо, добавляю MediaStream-выход для AnalyserNode)
- Общий стиль tokens/`design-tokens.ts`

## Вопрос перед стартом

Задачи независимы — можно делать параллельно. Если ок, стартую с обеих. Если нужно приоритизировать — какая первая?
