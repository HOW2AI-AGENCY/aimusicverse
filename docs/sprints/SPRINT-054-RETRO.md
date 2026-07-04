# Sprint 054 Retro — Suno Details Suite + Per-Task Introspection

**Закрыт:** 2026-07-04 · 3/3 задачи (1 переквалифицирована, 1 N/A) · план: [SPRINTS/SPRINT-054-PLAN.md](../../SPRINTS/SPRINT-054-PLAN.md) · манифест: [MANIFEST-SPRINT-053-054.md](../MANIFEST-SPRINT-053-054.md)

## Что сделано

- **054-A1..A6:** 6 details-edge (`suno-{music,cover,video,wav,lyrics,separation}-details`) — thin-wrappers 15–30 LOC над shared `fetchSunoTaskDetails(taskType, taskId)` в `_shared/suno-details.ts`; per-type backoff (lyrics 1500ms → separation 4000ms → midi 5000ms).
- **054-A7′ (переквалифицирована):** вместо запланированного рефакторинга `suno-check-status` → **cleanup dead code**: файл (449 LOC) удалён — graphify + grep подтвердили ноль клиентских вызовов; alias убран из `supabase/config.toml`. Callbacks уже нативно пишут в `tracks`/`track_versions`/`track_change_log`/`notifications`.
- **054-A8:** generic `useSunoTaskDetails` + `suno-task-details.api.ts` (7 тестов) — задел для будущих polling use-cases.

**Итог по Suno API: 24/28 → 28/28 (100%).**

## План vs реальность (A7/A9 mismatch)

**054-A9 — NOT APPLICABLE.** План ссылался на миграцию 5 polling-хуков (`useGenerationStatus`, `useVideoGenerationStatus`, `useStemSeparation`, `useLyricsVersioning`, `useWavConversion`) на `useSunoTaskDetails`, но 3 из них не существуют в кодовой базе, а 2 оставшихся не используют `suno-check-status`. Соответственно и A7-рефакторинг «check-status → диспетчер» был бы бессмысленен без callers — заменён на удаление.

## Уроки

1. **Планы, написанные по докам, а не по коду, дрейфуют** — перед стартом спринта сверять список целей с фактическим кодом (graphify/grep), как это сделали при исполнении 054.
2. **Удаление лучше рефакторинга мёртвого кода** — 449 LOC ушли вместо того, чтобы получить «красивый» диспетчер без потребителей.
3. **Цель «polling error-rate <2%» из плана неизмерима постфактум** — hooks-потребители не существовали; метрику перенести на будущие use-cases `useSunoTaskDetails`.
