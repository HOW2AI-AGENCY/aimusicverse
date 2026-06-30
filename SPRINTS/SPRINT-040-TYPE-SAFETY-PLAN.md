# Sprint 040 (Type Safety & God Files) — Q3 2026

**Дата:** 2026-06-30
**Длительность:** 10 рабочих дней (2 фазы по 5 дней)
**Зависимость:** Sprint 039 завершён (все 4 батча 039-03b закрыты, `tsc` зелёный)
**Цель:** Реклассифицировать `any` → строгие типы (447 → <50) и распилить 6 god-файлов >800 LOC до <500 LOC каждый.

> Sprint 040 параллелится с уже существующим планом `SPRINTS/SPRINT-040-PLAN.md` (тесты + аудио-экспорт). Эта дорожка отвечает за технический долг типов/декомпозиции; темы не пересекаются по файлам.

---

## Контекст входа

- ✅ `any` в `src/api/` + `src/services/` = 0
- ❌ `any` во всём `src/` = **447**
- ❌ 6 файлов >800 LOC (см. ниже)
- ✅ 0 прямых `supabase.{from,rpc,storage}` в `components`/`stores`
- ✅ `tsc --noEmit` = 0

## Сводка

| Фаза                       | Дни   | Задач | SP  |
| -------------------------- | ----- | ----- | --- |
| A: Type Safety wave 2      | 1-5   | 5     | 15  |
| B: God-files decomposition | 6-10  | 6     | 15  |
| C: Bundle hardening        | +2    | 1     | 3   |
| **Итого**                  | 12    | 12    | 33  |

---

## Фаза A — Type Safety (Дни 1-5)

| ID      | Файл/слой                          | Текущее `any` | Цель |
| ------- | ---------------------------------- | ------------- | ---- |
| 040T-01 | `src/hooks/**`                     | ~180          | <20  |
| 040T-02 | `src/stores/**`                    | ~80           | <10  |
| 040T-03 | `src/pages/**`                     | ~90           | <10  |
| 040T-04 | `src/components/**` (остатки)      | ~90           | <10  |
| 040T-05 | ESLint `@typescript-eslint/no-explicit-any: error` + whitelist | — | в `.eslintrc` |

**Команды:**
```bash
grep -rEn ": any|<any>|as any" src/ --include="*.ts" --include="*.tsx" | wc -l
npx tsgo --noEmit
```

**Definition of Done:**
- `any` < 50 в `src/`
- 0 ошибок `tsc`
- ESLint rule активен (whitelist <50 случаев)

---

## Фаза B — God-files decomposition (Дни 6-10)

| ID      | Файл                                                       | LOC  | Цель                              |
| ------- | ---------------------------------------------------------- | ---- | --------------------------------- |
| 040G-01 | `src/pages/LyricsStudio.tsx`                               | 1092 | LyricsEditor / LyricsPreview / LyricsToolbar |
| 040G-02 | `src/hooks/usePromptDJEnhanced.ts`                         | 1071 | usePromptDJState / -Audio / -Effects / -Presets |
| 040G-03 | `src/components/studio/unified/IntegratedStemTracks.tsx`   | 872  | StemRow + StemControls + StemHeader |
| 040G-04 | `src/components/studio/UnifiedNotesViewer.tsx`             | 855  | NotesList + NotesToolbar + NotesItem |
| 040G-05 | `src/pages/ProjectDetail.tsx`                              | 851  | ProjectHeader / ProjectTracks / ProjectMembers |
| 040G-06 | `src/components/generate-form/LyricsVisualEditor.tsx`      | 812  | Editor / Timeline / Sidebar |

**DoD:** Каждый файл <500 LOC, тесты зелёные, поведение не меняется.

---

## Фаза C — Bundle hardening (+2 дня)

- `npm run size:why` → выявить дубликаты дизайн-токенов (`src/lib/design-tokens.ts` vs inline css-utils)
- Лениво грузить `vendor-tone` / `vendor-wavesurfer` только на Studio-маршрутах
- Цель: 918 → **≤880 КБ**

---

## Risks & Mitigations

| Риск                                 | Митигация                                          |
| ------------------------------------ | -------------------------------------------------- |
| Поломка контрактов после типизации   | Поэтапные коммиты + `tsc` в pre-push hook          |
| Регресс в Studio при дроблении файлов| Playwright smoke на `studio-v2` маршрутах          |
| Бандл вырос из-за split-имплементации| `npm run size` после каждой задачи 040G            |
