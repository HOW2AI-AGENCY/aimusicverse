
## Problem

There are two voice-clone entry points that don't talk to the generation form:

- `VoiceCloneDialog` (generate-form/) — writes to `reference_audio` with a `clone_group_id`. Does **not** produce a `voice_id`, so the form's `customVoiceId` field can never receive it. This is what the "Голос" chip in `GenerateSheet` and `DesktopLibrarySidebar` currently opens.
- `VoiceCloneWizard` (voice-clone/) — the real Suno-backed flow that creates a `custom_voices` row with a real `voice_id`, already exposes `onComplete(voiceId)`. It is only used on `/voices`.

Meanwhile `useGenerateForm` already exposes `customVoiceId` / `setCustomVoiceId`, and `CustomVoicePicker` reads `custom_voices` and lists voices where `status === "ready" && is_available`.

Result: after cloning from the generate panel, nothing is selected; the user has to leave to `/voices` and re-open the form.

## Plan

### 1. Swap the dialog used by the generation entry points
Replace `VoiceCloneDialog` with `VoiceCloneWizard` in:
- `src/components/GenerateSheet.tsx` (the "Голос" action chip)
- `src/components/library/DesktopLibrarySidebar.tsx` (desktop "Голос" button)

Pass `onComplete={(voiceId) => …}`:
- `form.setCustomVoiceId(voiceId)`
- `form.setMode("custom")` and open advanced (`setAdvancedOpen(true)` + persist) so `CustomVoicePicker` is visible
- Scroll the form to the picker and show `notify.success("Голос «…» подключён к генерации")`
- Invalidate `["custom-voices", userId]` so the picker shows it immediately (the wizard already triggers realtime, but a manual invalidate guarantees instant UI)

### 2. Make the just-cloned voice selectable even before "ready"
`CustomVoicePicker` currently filters to `status==="ready" && is_available`. When the form pre-selects the new `voiceId` we want the dropdown to still show it with a status badge:
- Pass `value` into the filter: always include the currently selected voice in the list.
- For non-ready entries, render the item with a small "готовится…" badge and keep it selectable so the user's choice persists.

### 3. Retire `VoiceCloneDialog` from the generation flow
Keep the file (still imported in other places? — no, only the two replaced entry points use it). Remove the import + mount from both files. Delete `src/components/generate-form/VoiceCloneDialog.tsx` to avoid divergence, since `VoiceCloneWizard` covers the same UX with the correct backend wiring.

### 4. Update sprint notes
Append to `.lovable/plan.md` a new closed task line under Sprint 4.5 / a new "Voice clone integration" section:
- ✅ VoiceCloneWizard используется из формы генерации; результат автоматически выставляет `customVoiceId`, переключает в Custom mode и раскрывает advanced.
- ✅ `CustomVoicePicker` показывает выбранный голос, даже если он ещё в статусе `pending/generating`.

### Acceptance
- Open the generate sheet → tap "Голос" → wizard runs → on success the form is in Custom mode, advanced is open, `CustomVoicePicker` shows the new voice selected with the active ring, no manual import.
- Picker keeps the selection while the voice is still processing and updates label/badge to "готов" via existing realtime when it flips.
- `tsgo --noEmit` clean.

## Technical notes
- `VoiceCloneWizard.onComplete` fires inside its `useEffect` when `step === "ready" && voice.voice_id` is present, so wiring is straightforward.
- Need `useQueryClient` in both call sites for the targeted invalidate; alternatively rely on the existing realtime subscription in `useCustomVoices` (kept as belt-and-suspenders).
- No DB changes, no edge function changes.

---

## Спринт 4.6 — Интеграция Voice Clone в форму генерации

### Задачи
1. ✅ **Замена диалога.** `VoiceCloneDialog` (писал в `reference_audio`, не давал `voice_id`) удалён. `GenerateSheet` и `DesktopLibrarySidebar` теперь монтируют `VoiceCloneWizard` (Suno-флоу с реальным `custom_voices.voice_id`).
2. ✅ **Авто-выбор клонированного голоса.** `onComplete(voiceId)` выставляет `form.setCustomVoiceId(voiceId)`, переключает форму в `custom` mode, раскрывает advanced и инвалидирует `["custom-voices", userId]`, чтобы `CustomVoicePicker` сразу показал новый голос.
3. ✅ **Сохранение выбора во время обработки.** `CustomVoicePicker` теперь включает выбранный `voiceId` в список, даже если он ещё `pending/generating`, со статусной плашкой «готовится». Выбор пользователя не сбрасывается до момента, когда realtime обновит статус на `ready`.
