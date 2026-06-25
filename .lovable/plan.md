## Контекст

Базовая интеграция Suno Voice API уже выполнена:

- **БД:** таблица `custom_voices` + бакеты `voice-sources`, `voice-verifications` с RLS на `auth.uid()`.
- **Edge-функции:** `suno-voice-validate`, `-validate-info`, `-validate-callback`, `-generate`, `-generate-callback`, `-record-info`, `-check-voice`, `-regenerate`, плюс альтернативный `webhook-voice`.
- **Фронтенд:** `voiceCloneApi`, `useVoiceCloneWizard` (polling), `useVoiceRecorder`, `useCustomVoices` (с realtime), `VoiceCloneWizard`, `CustomVoicePicker`, страницы `VoiceLibraryPage` и `VoiceHistoryPage`.
- **Генерация:** `suno-music-generate` уже пробрасывает `voiceId` в Suno; `CustomVoicePicker` подключён в `GenerateFormCustom`.
- **Кредиты:** в `suno-voice-validate` уже списывается 30 кредитов через `secure_credit_update` с авто-рефандом при ошибках.

Этот план — аудит + точечные правки, без перезаписи архитектуры.

## Что делаем

### 1. Бэкенд: чистка дублей и багов

- **Удалить `supabase/functions/webhook-voice/`** — это устаревший дубль. Он использует `crypto.createHmac(...)` (Node API, недоступно в Deno) и сломан при запуске. Действующие колбэки — `suno-voice-validate-callback` и `suno-voice-generate-callback`. Убедиться, что `callbackUrl(...)` в `suno-voice-validate` / `-generate` указывает именно на них.
- **`suno-voice-validate-callback` / `-generate-callback`:** добавить HMAC-проверку подписи (`SUNO_WEBHOOK_SECRET`) через `crypto.subtle` (WebCrypto, не Node). Если секрет не задан — логировать warning и пропускать (dev). Запросить секрет через `add_secret` отдельным шагом перед включением проверки.
- **Подписанная ссылка на источник:** TTL 1 час недостаточен для медленной обработки Suno. Поднять до 24 часов в `suno-voice-validate` и `suno-voice-generate` (а `source_audio_url` хранить как путь, а не подписанный URL — он протухает).
- **Идемпотентность колбэков:** в `*-callback` пропускать запись, если она уже в финальном статусе (`ready` / `failed`), чтобы повторные доставки от Suno не перетирали `voice_id`.
- **Записывать `verify_path` и `generate_task_id`** в `custom_voices` в `suno-voice-generate` (сейчас только статус обновляется) — нужны для отладки и `regenerate`.

### 2. Фронтенд: UX мастера и стабильность

- **`VoiceCloneWizard`:** заменить `Dialog` на `MobileBottomSheet` на мобильных (правило проекта: на мобилах — sheet/drawer). Добавить пошаговый прогресс-бар (1/6 … 6/6) и таймер ожидания на шагах `validating` / `generating`.
- **Источник аудио (шаг 1):** добавить таб «Записать с микрофона» через существующий `useVoiceRecorder` (минимум 10 сек, рекомендация — петь). Запись и upload используют тот же путь, что и файл.
- **Сегмент вокала:** заменить два `<input type=range>` на двойной range-слайдер по волне (можно простой — два бегунка над `<audio>`), показывать длительность и предупреждение при <5 сек.
- **Realtime-апдейты вместо polling:** так как `useCustomVoices` уже подписан на `custom_voices` через realtime, поднять подписку в `useVoiceCloneWizard` и слушать обновления текущей строки. Polling оставить как fallback (включается, если за 10 сек не прилетел realtime-event).
- **Очистка ресурсов:** в `VoiceCloneWizard` каждый рендер вызывает `URL.createObjectURL(file)` для `<audio>` — мемоизировать и `revokeObjectURL` в cleanup, иначе течёт память.
- **Запись:** валидировать длительность ≥ 10 сек и ≤ 30 сек перед отправкой, проверить MIME (`audio/webm;codecs=opus`), показать peak-meter (уже есть утилиты в `lib/audio`).
- **Состояние `failed`:** показывать сумму возврата кредитов и кнопку «Попробовать снова» (re-run без повторного списания, если предыдущая попытка вернула кредиты).

### 3. Интеграция в генерацию

- **`GenerateFormCustom`:** показывать `CustomVoicePicker` только когда выбран режим с вокалом, скрывать при `instrumental=true`.
- **Проверка `voiceId`:** перед отправкой в `suno-music-generate` дёргать `voiceCloneApi.checkVoice(voiceId)`; если недоступен — блокировать сабмит с понятной ошибкой.
- **Extend / Cover:** проверить `suno-extend-audio` и `suno-remix` — пробросить `voiceId` так же, как в `suno-music-generate` (сейчас отсутствует).
- **Аналитика:** логировать `voice_clone_started/completed/failed` и `generation_with_custom_voice` через существующий `logger` / analytics-хук.

### 4. Безопасность и качество

- **RLS-аудит** на `custom_voices`: подтвердить, что `SELECT/UPDATE/DELETE` строго `auth.uid() = user_id`, `INSERT` запрещён клиенту (создание только через edge-функцию с service role).
- **Лимиты:** добавить cap «не больше N активных голосов на юзера» (например, 10) в `suno-voice-validate` с понятной ошибкой.
- **Логи:** в edge-функциях заменить `console.error` на структурированный `logger` (если есть `_shared/logger.ts`).
- **Типы:** прогнать `tsgo` после изменений; обновить `voice-types.ts` если поменяется API.

### 5. Проверка

- `tsgo --noEmit` зелёный.
- Smoke-тест через Playwright: открыть `/voice-library`, открыть мастер, загрузить короткий wav, дойти до шага записи (Suno вызывать не будем — мок через edge-логи).
- Ручной прогон end-to-end на staging Suno-ключе: validate → phrase → record → generate → ready → использовать в Custom-генерации.

## Что НЕ делаем

- Не переписываем существующие компоненты с нуля, не меняем схему `custom_voices`.
- Не добавляем Telegram-боту команды для клонирования голоса (отдельный спринт).
- Не трогаем `suno-music-generate` дальше проброса `voiceId` (он уже работает).

## Технические детали

| Файл | Изменение |
|---|---|
| `supabase/functions/webhook-voice/` | Удалить целиком |
| `supabase/functions/suno-voice-validate-callback/index.ts` | HMAC через WebCrypto, idempotency-guard |
| `supabase/functions/suno-voice-generate-callback/index.ts` | То же + запись `voice_id` только если `status != 'ready'` |
| `supabase/functions/suno-voice-validate/index.ts` | TTL signed URL = 24h, лимит активных голосов |
| `supabase/functions/suno-voice-generate/index.ts` | Сохранять `verify_path`, `generate_task_id` |
| `supabase/functions/suno-extend-audio/index.ts` | Принимать и пробрасывать `voiceId` |
| `supabase/functions/suno-remix/index.ts` | То же |
| `src/components/voice-clone/VoiceCloneWizard.tsx` | Mobile sheet, прогресс-бар, таб «запись», fix memory leak, мемоизация URL |
| `src/hooks/voice/useVoiceCloneWizard.ts` | Realtime-подписка + polling fallback |
| `src/components/generate-form/GenerateFormCustom.tsx` | Скрывать picker при instrumental, pre-check `checkVoice` |
| `supabase/migrations/<new>.sql` | (если нужно) индекс по `user_id,status` для лимита |

После реализации: `manage_security_finding` не нужен (security-фиксы из прошлых сессий не затрагиваются).
