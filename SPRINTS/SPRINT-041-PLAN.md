# Sprint 041 — UX Features (Q3 2026)

**Дата:** 2026-07 (плановая)
**Длительность:** 5 рабочих дней
**Зависимость:** Sprint 040 (Type Safety + God Files) завершён
**Цель:** Реализовать UX-задачи из `docs/todo_analysis.md`, которые откладывались под архитектурный долг.

---

## Сводка

| ID      | Задача                                                                                       | SP | Слой |
| ------- | -------------------------------------------------------------------------------------------- | -- | ---- |
| 041-01  | **IdeaStep:** AI-подсказки идей через Lovable AI Gateway (`google/gemini-2.5-flash`)         | 3  | wizard |
| 041-02  | **LyricsStep:** генерация текста по идее (cont. от IdeaStep)                                 | 3  | wizard |
| 041-03  | **LyricsView:** повторное чтение лирики (TTS через AI Gateway)                               | 2  | player |
| 041-04  | **useStudioAudioEngine:** loop / export (WAV) / recording mode                               | 5  | studio |
| 041-05  | Documentation + onboarding tour (4 новых тултипа)                                            | 1  | docs |
| **Итого** |                                                                                            | 14 |       |

---

## 041-01 — IdeaStep AI suggestions

**Точка входа:** `src/components/generate-form/wizard/IdeaStep.tsx`

**Действия:**
- Кнопка «✨ Подсказать идею» → вызов `ai_gateway` с системным промптом «Generate 3 short music concept ideas in the requested genre/mood/language».
- 3 карточки идей, клик заполняет поле `description`.
- Trace через `logger.info('idea.suggestion.clicked')`.

**DoD:** новый сценарий E2E `tests/e2e/wizard/idea-suggestions.spec.ts`.

## 041-02 — LyricsStep text generation

**Точка входа:** `src/components/generate-form/wizard/LyricsStep.tsx`

- Кнопка «Сгенерировать текст» (если поле пустое и есть идея/genre/mood).
- Использует `useAiLyricsAssistant` (уже существует) — добавить адаптер «full-track-lyrics».
- Лимит 1 генерация / 5 секунд (debounce).

## 041-03 — LyricsView re-read TTS

**Точка входа:** `src/components/lyrics/LyricsView.tsx`

- Кнопка ▶︎ возле каждой секции → TTS через `voice` модели AI Gateway.
- Кэширование результатов в IndexedDB ключом `sha256(text)`.

## 041-04 — useStudioAudioEngine

**Точка входа:** `src/hooks/studio/useStudioAudioEngine.ts`

- Добавить `loop: { start: number; end: number; enabled: boolean }`.
- Добавить `exportMix(format: 'wav' | 'mp3'): Promise<Blob>` — через OfflineAudioContext.
- Добавить `recording: { start(): void; stop(): Promise<Blob> }` — через MediaRecorder.

**DoD:** unit-тесты для каждой публичной функции, smoke в Storybook.

## 041-05 — Onboarding tour

- 4 шага: «Подсказать идею» → «Сгенерировать текст» → «Озвучить лирику» → «Записать дубль».
- Сохранение прогресса в `localStorage` ключом `mv_onboarding_v3`.

---

## Documentation deliverables

- Обновить `KNOWN_ISSUES_TRACKED.md` — закрыть пункты «AI suggestions», «TTS playback».
- Обновить `KNOWLEDGE_BASE.md` — добавить раздел «AI features».
- `CHANGELOG.md` → запись `0.41.0`.
