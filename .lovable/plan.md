
# План дальнейших работ

## Контекст
По итогам аудита Sprint 039 (см. `docs/audit/SPRINT-039-AUDIT-2026-06-30.md`):
- Batch 1 (admin/analytics) и Batch 4 (misc) закрыты → 35 → 15 нарушений layer-архитектуры
- `tsc --noEmit`: 0 ошибок
- E2E workflow `.github/workflows/e2e.yml` создан (требует GitHub Secrets)
- Остаётся: Batch 2 (project/wizard, 4 файла), Batch 3 (studio/dialogs, 4 файла), god-files, 447 `any`, E2E phase C

---

## Sprint 039 — закрытие (3 дня)

### 039-03b Batch 2 — project/wizard (день 1)
Файлы (≈9 нарушений):
- `src/components/project/ProjectCreationWizard.tsx`
- `src/stores/studio/useProjectStore.ts` (остатки)
- `src/components/project/ProjectMembersPanel.tsx`
- `src/hooks/project/useProjectInvites.ts`

Действия:
1. Расширить `src/api/projects.api.ts`: `createProjectWithMembers`, `fetchProjectMembers`, `inviteProjectMember`, `removeProjectMember`
2. Убрать прямые `supabase.from/rpc` из компонентов
3. Прогнать `tsc`, `lint`, `npm test -- project`

### 039-03b Batch 3 — studio/dialogs (день 2)
Файлы (≈6 нарушений):
- `src/components/studio/unified/SaveVersionDialog.tsx`
- `src/components/studio/unified/LoadVersionDialog.tsx`
- `src/components/studio/unified/StudioNotationPanel.tsx`
- `src/components/studio/unified/StudioCollaborationPanel.tsx`

Действия:
1. Расширить `src/api/studio.api.ts`: `saveStudioVersion`, `loadStudioVersions`, `fetchNotationData`, `fetchCollaborators`
2. Замена прямых вызовов
3. Прогон Studio smoke-test через Playwright (3 сценария: save/load/notation)

### 039-11 E2E CI — финализация (день 3)
- Добавить GitHub Secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`
- Прогнать e2e локально (`npm run test:e2e:chromium`) и через workflow_dispatch
- Зафиксировать baseline зелёного прогона

### Регрессия и документация
- `grep -rn "supabase\.\(from\|rpc\|storage\)" src/{components,pages,stores}` → 0 ожидаемых
- Обновить `docs/audit/SPRINT-039-AUDIT-2026-06-30.md` (финальные метрики)
- Закрыть `SPRINTS/SPRINT-039-PLAN.md` (все задачи ✅)
- `PROJECT_STATUS.md`: бамп до Sprint 039 complete, 96% прогресс
- `CHANGELOG.md`: запись `[Unreleased] → 0.39.0`
- `README.md`: обновить блок «Sprint Status» и метрики (components/hooks/stores/api/services)

---

## Sprint 040 — Type Safety & God Files (2 недели)

### 040-01 Реклассификация `any` (5 дней)
Цель: 447 → <50 в `src/`
- День 1: `src/hooks/` (~180 случаев) — типизация Supabase responses, generic hooks
- День 2: `src/stores/` (~80) — Zustand slice types
- День 3: `src/pages/` (~90) — props, route params
- День 4: `src/components/` остатки (~90)
- День 5: ESLint rule `@typescript-eslint/no-explicit-any: error` с whitelist

### 040-02 God-file split (5 дней)
| Файл | LOC | Цель |
|------|-----|------|
| `LyricsStudio.tsx` | 1092 | 3 sub-component (Editor/Preview/Toolbar) |
| `usePromptDJEnhanced.ts` | 1071 | 4 хука (state/audio/effects/presets) |
| `IntegratedStemTracks.tsx` | 872 | Stem rows + controls |
| `UnifiedNotesViewer.tsx` | 855 | Viewer + Toolbar + List |
| `ProjectDetail.tsx` | 851 | Header / Tracks / Members |
| `LyricsVisualEditor.tsx` | 812 | Editor / Timeline / Sidebar |

Критерий: каждый файл <500 LOC, тесты зелёные, bundle ≤ 880 KB.

### 040-03 Bundle hardening (2 дня)
- Замер `npm run size:why`
- Удалить дубли design tokens (`src/lib/design-tokens.ts` vs inline)
- Целевой бюджет: 880 KB (с текущих 918)

### Документация Sprint 040
- `SPRINTS/SPRINT-040-PLAN.md` — создать с задачами 040-01/02/03
- `ROADMAP.md` — добавить Sprint 040 в Q3 2026
- `ARCHITECTURE_HUB.md` — обновить раздел Type Safety

---

## Sprint 041 — UX features (1 неделя)

Из `docs/todo_analysis.md`:
- `IdeaStep`: AI-подсказки (Lovable AI Gateway, `google/gemini-2.5-flash`)
- `LyricsStep`: генерация текста по идее
- `LyricsView`: повторное чтение лирики (TTS)
- `useStudioAudioEngine`: loop / export / recording

Документация:
- `SPRINTS/SPRINT-041-PLAN.md` — создать
- `KNOWN_ISSUES_TRACKED.md` — обновить с прогрессом

---

## Технические детали

### Команды проверки
```bash
# layer violations
grep -rn "supabase\.\(from\|rpc\|storage\)" src/{components,pages,stores} | wc -l

# any usage
grep -rEn ": any|as any" src/ --include="*.ts" --include="*.tsx" | wc -l

# god files
find src -name "*.ts" -o -name "*.tsx" | xargs wc -l | awk '$1 > 800'

# E2E
npm run test:e2e:chromium
```

### Файлы для обновления (итого)
- `SPRINTS/SPRINT-039-PLAN.md` (close)
- `SPRINTS/SPRINT-040-PLAN.md` (new)
- `SPRINTS/SPRINT-041-PLAN.md` (new)
- `PROJECT_STATUS.md`
- `README.md`
- `CHANGELOG.md`
- `ROADMAP.md`
- `ARCHITECTURE_HUB.md`
- `docs/audit/SPRINT-039-AUDIT-2026-06-30.md`

---

## Definition of Done

**Sprint 039:** 0 layer violations, E2E зелёный, документация синхронизирована.
**Sprint 040:** <50 `any`, все файлы <500 LOC, bundle ≤880 KB.
**Sprint 041:** 4 UX-фичи в проде, фидбэк собран.
