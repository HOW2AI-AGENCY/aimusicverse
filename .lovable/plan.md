# Suno Voice Cloning — Аудит и план интеграции

## 1. Аудит текущего состояния

**Что уже есть:**
- Suno интеграция (music/extend/cover/stems/replace/video) — 20+ edge-функций в `supabase/functions/suno-*`.
- Таблица `custom_voices` уже создана со всеми нужными колонками: `validate_task_id`, `generate_task_id`, `voice_id`, `validate_phrase`, `source_audio_url`, `verify_audio_url`, `status`, `is_available`, `usage_count`, `error_code/message`, `phrase_expires_at`, `last_polled_at` и т.д. RLS присутствует.
- В `types.ts` тип `custom_voices` уже сгенерирован.

**Чего нет (нужно создать):**
- Edge-функции для всех 6 эндпоинтов Suno Voice (`/validate`, `/validate-info`, `/generate`, `/regenerate`, `/record-info`, `/check-voice`) + callback-ресиверы.
- Storage-бакеты `voice-sources` (исходники) и `voice-verifications` (запись фразы).
- Frontend: сервис, хуки, 6-шаговый wizard, страница «Voice Library», интеграция `voiceId` в форму генерации.
- Списание кредитов за создание голоса.

---

## 2. Backend — Storage и Edge Functions

### 2.1 Миграция (только storage + economy_config)
- Бакеты `voice-sources` (private, ≤25 MB, audio/*), `voice-verifications` (private, ≤10 MB, audio/*).
- RLS-политики: пользователь читает/пишет только в свою папку `{user_id}/...`; service_role полный доступ.
- Запись в `economy_config`: цена `voice_clone_cost = 30` кредитов.

### 2.2 Edge functions (9 новых)
| Функция | Назначение |
|---|---|
| `voice-upload-source` | принимает аудио (multipart) → пишет в `voice-sources`, возвращает signed URL |
| `voice-upload-verification` | аналогично в `voice-verifications` |
| `suno-voice-validate` | списывает кредиты через `secure_credit_update`, POST `/api/v1/voice/validate`, создаёт row в `custom_voices` со `status='validating'` |
| `suno-voice-validate-info` | GET `/api/v1/voice/validate-info?taskId=…` (polling fallback) |
| `suno-voice-validate-callback` | публичный (`verify_jwt=false`), принимает `voice.validate_success/failed`, обновляет `validate_phrase`, `phrase_expires_at`, `status='phrase_ready'` |
| `suno-voice-generate` | POST `/api/v1/voice/generate` с `taskId` + `verifyUrl`, обновляет `generate_task_id`, `status='generating'` |
| `suno-voice-regenerate` | POST `/api/v1/voice/regenerate` (повторная попытка по существующей задаче) |
| `suno-voice-record-info` | GET `/api/v1/voice/record-info?taskId=…` (polling fallback) |
| `suno-voice-generate-callback` | публичный, принимает `voice.generate_success/failed`, пишет `voice_id`, `status='ready'`, `is_available=true` |
| `suno-voice-check-voice` | POST `/api/v1/voice/check-voice` перед использованием `voiceId` в генерации; обновляет `is_available` |

Общие правила: использовать существующий `_shared/suno.ts`, `_shared/cors.ts`, `_shared/logger.ts`. Все callback-функции отмечены `verify_jwt = false` в `config.toml` и валидируют по `taskId` + `user_id`. Callback URL вида `${SUPABASE_URL}/functions/v1/suno-voice-*-callback`.

---

## 3. Frontend

### 3.1 Слои
- `src/api/voice-clone.api.ts` — обёртки над `supabase.functions.invoke`.
- `src/services/voice-clone.service.ts` — оркестрация 6 шагов, polling каждые 3 с с таймаутом 5 мин.
- `src/hooks/voice/`:
  - `useCustomVoices()` — список голосов пользователя + realtime подписка на `custom_voices` (с уникальным channel name, см. недавние фиксы StrictMode).
  - `useVoiceCloneWizard()` — машина состояний шагов (idle → uploading → validating → phrase_ready → recording → generating → ready/failed).
  - `useVoiceRecorder()` — обёртка над `MediaRecorder` (44.1 kHz, mono, webm/opus → конвертация в mp3 через существующие утилиты или прямая отправка webm).

### 3.2 UI
- `src/pages/VoiceLibraryPage.tsx` — список голосов, кнопка «Create new voice».
- `src/components/voice-clone/VoiceCloneWizard.tsx` — 6 шагов в `MobileBottomSheet` на мобильном / `Dialog` на десктопе:
  1. Upload исходного аудио + waveform-выбор сегмента (`Wavesurfer.js`) → `vocalStartS/EndS`.
  2. Спиннер ожидания фразы (polling + realtime).
  3. Отображение фразы + recorder с визуализацией.
  4. Кнопка «Generate voice».
  5. Прогресс генерации.
  6. Превью + кнопка «Use in studio».
- `src/components/voice-clone/CustomVoiceCard.tsx`, `CustomVoicePicker.tsx` — выбор голоса в форме генерации.

### 3.3 Интеграция в генерацию
- В `useGenerateForm` добавить опциональное поле `customVoiceId`.
- Перед отправкой вызывать `suno-voice-check-voice`; если `is_available=false` — блокировать с тостом.
- Передавать `voiceId` в `suno-music-generate` (поле уже поддерживается Suno API на эндпоинте `/generate`).

---

## 4. UX, ошибки, безопасность

- Telegram safe-areas + 44px touch-targets, haptics на шагах wizard'а.
- Все ошибки через `@/lib/errors` + тосты с recovery actions (например, «Перезаписать фразу» → `suno-voice-regenerate`).
- Логи через `logger`, без `console.*`.
- Все destructive действия проверяют `auth.uid() === custom_voices.user_id`.
- Кредиты списываются ровно один раз на шаге validate; при `failed` — возврат через `secure_credit_update`.

---

## 5. Этапы внедрения

1. Миграция (бакеты + цена).
2. 9 edge-функций + регистрация callback-ов с `verify_jwt=false`.
3. API/Service/Hooks слой.
4. Wizard + Voice Library.
5. Интеграция picker'а в форму генерации + `check-voice` перед запуском.
6. QA на мобильном Telegram + десктопе.

---

## Уточняющие вопросы
- **Цена клонирования голоса** — устроит ли 30 кредитов, или задать другое значение?
- **Callbacks vs polling** — реализовать сразу оба пути (callback основной, polling fallback каждые 3 с), или только polling для MVP?
- **Запись фразы** — сохранять оригинальный `webm/opus` от `MediaRecorder` (Suno принимает) или конвертировать в `mp3` на клиенте через ffmpeg.wasm?
