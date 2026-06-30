## Аудит последних коммитов (Sprint 039)

Проверил 4 крупных PR (#551–#554) и сверил заявленные результаты с фактическим состоянием кода.

### Что реально сделано ✅

| Задача | Заявлено | Факт | Вердикт |
|---|---|---|---|
| 039-04 `withHistory` middleware | ✅ DONE | `src/stores/middleware/withHistory.ts` + 111-строчный тест | ✅ корректно |
| 039-05 lyricsWizardStore без эффектов | ✅ DONE | стор похудел с ~250→86 строк | ✅ корректно |
| 039-06 useGenerateForm декомпозиция | ✅ DONE | оркестратор 280 строк, 4 суб-хука | ✅ корректно |
| 039-07 GlobalAudioProvider | ✅ DONE | **79 строк** (было 982), вынесено в `useAudioInit/Playback/TrackLoader` | ✅ отлично |
| 039-08 god-компоненты | ✅ DONE | StudioShell 995→720, SectionNotesPanel 882→324 | ✅ корректно |
| 039-09 DnD унификация | ✅ DONE | `@hello-pangea/dnd` удалён | ✅ корректно |
| 039-10 Type Safety (API/services) | ✅ DONE | `: any`/`as any` в `src/api/` и `src/services/` = **0** | ✅ корректно |

### Расхождения с планом ⚠️

1. **039-02/03 «0 нарушений слоёв» — НЕВЕРНО.** PR #552 заявил «было 109 → стало 0», но `grep supabase.from/rpc/storage` по `src/components|pages|stores` даёт **35 совпадений в 17 файлах**, среди них:
   - `admin/QuickActionsPanel.tsx`, `admin/analytics/RevenueAnalyticsPanel.tsx`, `admin/AdminBotImagesPanel.tsx`
   - `generate-form/AudioActionDialog.tsx`, `project/ProjectCreationWizard.tsx`, `project/ProjectBannerEditor.tsx`, `project/ProjectCoverEditor.tsx`
   - `studio/unified/ImportAudioDialog.tsx`, `studio/unified/SaveVersionDialog.tsx`, `studio/hooks/useEnhancedStudioLogger.ts`, `stores/studio/useProjectStore.ts`
   - `comments/ReportCommentDialog.tsx`, `onboarding/ProfileSetupOnboarding.tsx`, `artist/ArtistDetailsPanel.tsx`
   - analytics-панели (Comparison/ConversionFunnel/RealTime) — частично рефакторены, но остатки есть
2. **039-10 для всего src/ — не выполнено.** В `src/api`+`src/services` `any` устранён, но в целом по `src/` остаётся **447** `: any`/`as any` против таргета «<50».
3. **God-файлы >800 строк всё ещё есть (5):** `LyricsStudio.tsx` 1092, `usePromptDJEnhanced.ts` 1071, `IntegratedStemTracks.tsx` 872, `UnifiedNotesViewer.tsx` 855, `ProjectDetail.tsx` 851, `LyricsVisualEditor.tsx` 812.
4. **Фаза C (E2E) полностью открыта**: 039-11 CI pipeline, 039-12 smoke/navigation/library, 039-13 player/generation, 039-14 верификация.

### Сильные стороны коммитов

- Чёткое разнесение по слоям с новыми API-файлами (`presets.api`, `recordings.api`, `studio.api`).
- `withHistory` middleware с тестами — переиспользуется в lyrics/mixer/studio сторах.
- GlobalAudioProvider реально декомпозирован — публичный API сохранён.
- Тип-чистка `src/api` и `src/services` сделана аккуратно без `@ts-ignore`.

---

## План дальнейших работ

### Sprint 039 — добивание (приоритет, ~3 дня)

**039-03b. Доделать layer-fix (15 SP overdue):** перенести оставшиеся 35 прямых `supabase.*` вызовов в API-слой.
- Batch 1 (admin/analytics): `RevenueAnalyticsPanel`, `QuickActionsPanel`, `AdminBotImagesPanel`, остатки в Comparison/ConversionFunnel/RealTime → расширить `src/api/admin.api.ts` + `analytics.api.ts`.
- Batch 2 (project/wizard): `ProjectCreationWizard`, `ProjectBannerEditor`, `ProjectCoverEditor`, `useProjectStore` → расширить `projects.api.ts` (uploads + создание).
- Batch 3 (studio/forms): `ImportAudioDialog`, `SaveVersionDialog`, `AudioActionDialog`, `useEnhancedStudioLogger` → `studio.api.ts`.
- Batch 4 (misc): `ReportCommentDialog`, `ProfileSetupOnboarding`, `ArtistDetailsPanel`.
- Acceptance: grep даёт 0 совпадений, `npm run build` зелёный, обновить `docs/LAYER_VIOLATIONS.md`.

**039-11/12/13/14. E2E CI.**
- Починить `playwright.config.ts` + `.github/workflows/quality-check.yml` (отдельный job для E2E с кэшем браузеров).
- Поэтапно стабилизировать: smoke/navigation → library/track-actions → player/generation. Падающие spec помечать `test.fixme` с issue-ссылкой, а не удалять.
- Acceptance: ≥35 specs зелёные в CI, артефакт HTML-отчёта.

**039-15 (новая). Корректировка отчётов.** Обновить `SPRINTS/SPRINT-039-PLAN.md` и `PROJECT_STATUS.md`: 039-02/03 → IN PROGRESS, 039-10 → «API/services done, app-wide deferred».

### Sprint 040 — Type Safety wave 2 + god-файлы (предложение, 2 недели)

**040-01. `any` → типы (447 → <50).** Поэтапно по директориям: `src/hooks/` → `src/components/` → `src/stores/` → `src/pages/`. Использовать `tsconfig.strict.json` как зачётный CI.

**040-02. Разбить 5 god-файлов (>800 строк):**
- `LyricsStudio.tsx` (1092) — extract `LyricsWorkspaceLayout`, `LyricsEditorPanel`, `LyricsToolbar` + хук `useLyricsStudio`.
- `usePromptDJEnhanced.ts` (1071) — выделить `usePromptDJState`, `usePromptDJEffects`, `usePromptDJAudio`.
- `IntegratedStemTracks.tsx`, `UnifiedNotesViewer.tsx`, `ProjectDetail.tsx`, `LyricsVisualEditor.tsx` — каждый <500 строк.
- Acceptance: 0 файлов >700 строк в `src/{components,pages,hooks}`.

**040-03. Удалить дубли по графу.** Включить `npm run check:design-tokens` в pre-commit, прогнать `graphify update .`, разрулить 6 оставшихся дублей из аудита 2026-06-28.

**040-04. Bundle hardening.** Цель ≤880 КБ (запас 70 КБ): анализ через `npm run size:why`, lazy-load `vendor-tone` и `vendor-wavesurfer` отложенно (после первого play).

### Sprint 041 — UX-долги из todo_analysis.md (ориентир)

Перенести высокоприоритетные TODO: AI suggestions в `IdeaStep`, генерация текста в `LyricsStep`, перечитывание лирики в `LyricsView`, недоделки `useStudioAudioEngine` (loop/export/recording).

---

## Технические детали

- Метрики снимались командами: `grep -rn "supabase\.from|rpc|storage" src/{components,pages,stores}`, `wc -l` по всем `*.ts/tsx`, `grep ": any| as any"`.
- Полный список 17 нарушителей и 5 god-файлов приведён выше — годится как чек-лист для 039-03b и 040-02.
- E2E spec'и существуют (47 шт в `tests/e2e/`), но `quality-check.yml` намеренно их исключает («lint+typecheck+build only»). Нужен отдельный `e2e.yml` workflow.
