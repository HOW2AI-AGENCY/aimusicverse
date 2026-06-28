# 🏗 Architectural Improvement Plan — AI Music Verse

**Created:** 2026-06-28  
**Context:** Deep architectural analysis based on 30+ critical source files across the entire codebase  
**Author:** Architect mode — findings synthesized from 10 analysis batches

---

## 📋 Executive Summary

This document presents a structured improvement plan derived from a comprehensive architectural audit of the AI Music Verse project. The analysis covered **30+ critical source files** across all architectural layers: routing, providers, state management, services, API, database, Edge Functions, and Telegram integration.

### Key Findings at a Glance

| Metric                                                                      | Value                              | Severity                |
| --------------------------------------------------------------------------- | ---------------------------------- | ----------------------- |
| `any` types in codebase                                                     | **484**                            | ⚠️ High                 |
| Explicit type escapes (`as any`, `as unknown as`, `as never`, double casts) | **10+ locations**                  | 🔴 Critical             |
| Files exceeding 500 lines (god components/hooks)                            | **30+ files**                      | 🔴 Critical             |
| Layer violations in ports-adapters pattern                                  | **4 confirmed**                    | 🔴 Critical             |
| Deprecated Edge Functions                                                   | **1** (`suno-generate`, 179 lines) | ⚠️ Medium               |
| Broken CI/CD                                                                | **3 weeks**                        | 🔴 Critical             |
| Failing E2E specs                                                           | **47**                             | 🔴 Critical             |
| Test coverage (claimed vs actual)                                           | **82% vs ~9.2%**                   | ⚠️ **Data discrepancy** |
| Bundle size (gzip)                                                          | **918 KB** (≤950 KB target ✅)     | 🟢 Healthy              |
| Provider nesting depth                                                      | **7 levels**                       | 🟢 Acceptable           |

---

## 1. Code Quality Assessment

### 1.1 TypeScript Strictness

The codebase has **484 `any` types** — a significant number that undermines TypeScript's safety guarantees. Specific critical locations:

| Location                                     | Issue                                                     | Line(s)           | Risk                          |
| -------------------------------------------- | --------------------------------------------------------- | ----------------- | ----------------------------- |
| `src/services/telegram/notifications.ts`     | `(window as any).Telegram.WebApp`                         | 123               | 🔴 Runtime undefined access   |
| `src/services/telegram/share.ts`             | `type TelegramWebApp = any;`                              | 38–39             | 🔴 Entire type erased         |
| `src/stores/studio/useProjectStore.ts`       | `as unknown as StudioProject`                             | Multiple          | 🔴 Bypasses type checking     |
| `src/stores/studio/useStudioHistoryStore.ts` | `as unknown as` in middleware                             | Constructor       | 🔴 Unsafe middleware typing   |
| `src/api/generation.api.ts`                  | `as unknown as GenerationLog[]`, `as never`, double casts | 114, 223, 233–238 | 🔴 RPC response type unsafety |
| `src/api/tracks.api.ts`                      | Double cast pattern                                       | 168–171           | 🔴 Data shape mismatch risk   |

### 1.2 God Components and Hooks

Files exceeding 500 lines violate the Single Responsibility Principle and create maintenance challenges:

| File                                                  | Lines     | Complexity Factors                                                                                        |
| ----------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| `src/hooks/generation/useGenerateForm.ts`             | **1,219** | 3 code paths in `invokeGeneration` (801–933), 70+ property return, validation chain, error classification |
| `src/components/GlobalAudioProvider.tsx`              | **983**   | Dual retry system, URL validation, mobile format filtering, 3s timeout race prevention                    |
| `src/components/studio/unified/StudioShell.tsx`       | **656**   | 40+ imports, 20+ dialog states, 3 Realtime subscriptions, keyboard shortcuts                              |
| `src/supabase/functions/suno-music-generate/index.ts` | **742**   | Retry loop, model fallback, error handling with Russian messages, DB cleanup                              |
| `src/stores/studio/useTrackStore.ts`                  | **476**   | 20+ actions, heavy `tracks.map` pattern                                                                   |
| `src/stores/studio/useLyricsStore.ts`                 | **305**   | 15+ actions, version management                                                                           |

---

## 2. Modularity and Coupling Analysis

### 2.1 Ports-Adapters (Layered Architecture) Violations

The project follows a `Pages → Components → Hooks → Services → API → Edge Functions` layered pattern, but **4 violations** were confirmed:

| Violation   | Location                     | Issue                                                                         | Impact                                         |
| ----------- | ---------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------- |
| **Layer 1** | `StudioShell.tsx:36`         | Direct `import { supabase } from "@/integrations/supabase/client"`            | Component bypasses service/API layers entirely |
| **Layer 2** | `useGenerateForm.ts:983–987` | Direct `supabase.functions.invoke("suno-credits")`                            | Hook bypasses API layer                        |
| **Layer 3** | `useProjectStore.ts`         | Sonner toast import in Zustand store                                          | Store has UI side-effect dependency            |
| **Layer 4** | `GlobalAudioProvider.tsx`    | Mixed concerns: audio logic + retry logic + URL validation + format filtering | 4 responsibilities in one component            |

### 2.2 Store Composition Pattern

The **6-store composition** pattern in `src/stores/studio/index.ts` has a notable issue:

- **5 subscription-based cross-store syncs** (lines 186–217) — each calls `useProjectStore.getState().updateFromStore()`
- This creates **implicit coupling** between stores — changes in one store ripple through all others
- Risk of **update loops** if sync logic is not idempotent
- The hub pattern is good for organization but the subscription sync is fragile

---

## 3. Pattern Evaluation

### 3.1 Hooks Pattern ✅ Mostly Good

- Custom hooks properly encapsulate business logic
- `useGenerateForm` is the exception (god hook) — needs splitting
- React Hook Form + Zod for form validation is a strong pattern

### 3.2 Context Pattern ⚠️ Acceptable

- 7-level provider nesting is deep but memoized
- `DeferredProviders` with `requestIdleCallback`/`setTimeout 100ms` fallback shows maturity
- Risk: provider re-renders could cascade through the tree

### 3.3 Ports-Adapter Pattern ⚠️ Partially Broken

- API → Service → React Query → Components flow is correct in principle
- But **4 violations** (see §2.1) bypass the abstraction layers
- Service layer is thin — some services are mere pass-throughs to API functions

### 3.4 Zustand Store Pattern ✅ Good

- Well-structured with TypeScript interfaces
- `persist` middleware used appropriately (project, view, lyrics stores)
- `devtools` wrapper for debugging
- `subscribeWithSelector` for efficient subscriptions

---

## 4. State Management Assessment

### 4.1 Current Strategy (5 Layers)

| Layer                 | Technology           | Usage                                  | Health                                                         |
| --------------------- | -------------------- | -------------------------------------- | -------------------------------------------------------------- |
| Server state          | TanStack React Query | API data fetching, caching, refetching | ✅ Good (staleTime=30000, retry=1, refetchOnWindowFocus=false) |
| Client state (global) | Zustand              | Studio, UI preferences, playback       | ✅ Good (15+ stores)                                           |
| Client state (local)  | React Context        | Theme, locale, auth                    | ✅ Good (memoized providers)                                   |
| Persisted state       | localStorage         | UI preferences via Zustand persist     | ✅ Good                                                        |
| Real-time state       | Supabase Realtime    | Live updates (generation tasks, stems) | ⚠️ Risk (3 subscriptions in StudioShell)                       |

### 4.2 Key Risks

1. **StudioShell manages 3 Realtime subscriptions directly** — should be in a dedicated service/hook
2. **Zustand persist middleware stores complex objects** — potential serialization issues
3. **Cross-store sync is subscription-based** — could cause infinite update loops

---

## 5. Routing Analysis

### 5.1 Structure (React Router v6)

- **60+ routes** defined in `src/App.tsx`
- **7-level provider nesting** around router
- **Lazy loading** with `lazyWithRetry` for critical pages, standard `lazy()` for secondary
- **Code-splitting via webpack chunk name comments** — these are **Webpack-specific** and may not work with Vite

```typescript
// Webpack-specific chunk naming in Vite project — potential issue
const AdminGenerationStats = lazy(
  () => import(/* webpackChunkName: "admin-generation-stats" */ "../pages/admin/GenerationStats"),
);
```

### 5.2 Issues Found

| Issue                               | Location                                  | Impact                                                                                         |
| ----------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Webpack chunk names in Vite         | All lazy admin imports in `App.tsx`       | ⚠️ `/* webpackChunkName */` is Webpack-specific; Vite uses `rollupOptions.output.manualChunks` |
| Studio V2 routes outside MainLayout | Routes for studio bypass `ProtectedRoute` | 🟢 Intentional, but needs review for auth consistency                                          |
| `GenerateRedirect` component        | Top-level route                           | ⚠️ Logic needs verification for redirect edge cases                                            |

---

## 6. API Layer Evaluation

### 6.1 Structure

- **API layer** (`src/api/`) — direct Supabase client calls and RPC invocations
- **Service layer** (`src/services/`) — business logic, enrichment, cleanup
- **Edge Functions** (`supabase/functions/`) — server-side logic

### 6.2 Issues

| File                             | Issue                                                               | Severity  |
| -------------------------------- | ------------------------------------------------------------------- | --------- |
| `generation.api.ts:114`          | `as unknown as GenerationLog[]` — unsafely casting RPC response     | 🔴 High   |
| `generation.api.ts:223, 233–238` | `as never` and double casts                                         | 🔴 High   |
| `tracks.api.ts:168–171`          | Double cast pattern: `track as unknown as TrackRow`                 | 🔴 High   |
| `suno-generate/index.ts`         | **Deprecated** — no retry, no credit check, no error classification | ⚠️ Medium |

### 6.3 Edge Function Comparison

| Function              | Lines | Retry                                 | Credits Check | Error Classification    | Status            |
| --------------------- | ----- | ------------------------------------- | ------------- | ----------------------- | ----------------- |
| `suno-music-generate` | 742   | ✅ Max 3, model fallback (v4→v3.5→v3) | ✅            | ✅ FailureCategory enum | ✅ **Active**     |
| `telegram-auth`       | 412   | N/A                                   | ✅            | ✅ ValidationError enum | ✅ **Active**     |
| `suno-generate`       | 179   | ❌                                    | ❌            | ❌ Action-based only    | ❌ **Deprecated** |

---

## 7. Database Assessment

### 7.1 Key Tables

| Table              | Purpose                                      | Migration File         |
| ------------------ | -------------------------------------------- | ---------------------- |
| `music_projects`   | User music projects                          | `20251129084954_*.sql` |
| `tracks`           | Audio tracks (provider default 'lovable_ai') | `20251129084954_*.sql` |
| `track_versions`   | Versioned track states                       | `20251129084954_*.sql` |
| `track_stems`      | Stem separations (vocals, drums, etc.)       | `20251129084954_*.sql` |
| `generation_tasks` | AI generation jobs with failure tracking     | `20260628120000_*.sql` |

### 7.2 RLS Policies

- Used for row-level security tied to Supabase Auth
- Not fully audited in this analysis — recommend dedicated RLS review
- Key concern: `telegram-auth` Edge Function creates users and sets sessions — RLS must account for this path

### 7.3 Migration Health

| Migration                                                 | Lines | Content                                                                                         |
| --------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------- |
| `20251129070151_remix_migration_from_pg_dump.sql`         | 578   | Base schema: cron jobs, vault secrets, extensions (pgcrypto, pgjwt, pg_stat_statements, pg_net) |
| `20251129084954_eefa8578-165c-40ba-a1f9-339e298af8c4.sql` | 215   | Core tables: music_projects, tracks, track_versions, track_stems                                |
| `20260628120000_generation_failure_tracking.sql`          | 107   | Latest: failure_category enum, retry_count, abort_reason                                        |

---

## 8. Telegram Mini App Integration

### 8.1 Architecture

```
Telegram Client → HMAC-SHA256 InitData → Edge Function (telegram-auth) → Supabase Auth Session
```

### 8.2 Security Assessment

| Component              | Status     | Notes                                         |
| ---------------------- | ---------- | --------------------------------------------- |
| HMAC-SHA256 validation | ✅ Correct | `validateTelegramWebAppData()` with bot token |
| 24-hour expiry         | ✅ Correct | Data freshness check                          |
| Chat ID cascade        | ✅ Good    | Links accounts by chat_id                     |
| Password rotation      | ✅ Good    | Existing users get new password               |
| New user credits       | ✅ Good    | 50 credits + registration_bonus               |

### 8.3 Issues

| Location           | Issue                             | Lines | Severity                                      |
| ------------------ | --------------------------------- | ----- | --------------------------------------------- |
| `notifications.ts` | `(window as any).Telegram.WebApp` | 123   | 🔴 Type escape — needs proper type definition |
| `share.ts`         | `type TelegramWebApp = any;`      | 38–39 | 🔴 Entire type erased                         |

---

## 9. Key Problems, Bottlenecks, and Risks

### 🔴 Critical (P0)

| #   | Problem                                             | Impact                                                  | Code Reference                                     |
| --- | --------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------- |
| 1   | **CI/CD broken for 3 weeks**                        | Blocks all deployments, code review, and quality gates  | `PROJECT_STATUS.md`, `SPRINT-035-038-PLAN.md`      |
| 2   | **47 failing E2E specs**                            | No reliable regression testing                          | `PROJECT_STATUS.md`                                |
| 3   | **God hook `useGenerateForm` (1,219 lines)**        | Unmaintainable, impossible to test, high cognitive load | `src/hooks/generation/useGenerateForm.ts`          |
| 4   | **God component `GlobalAudioProvider` (983 lines)** | 4 responsibilities mixed together                       | `src/components/GlobalAudioProvider.tsx`           |
| 5   | **God component `StudioShell` (656 lines)**         | Layer violation, 3 Realtime subs, 40+ imports           | `src/components/studio/unified/StudioShell.tsx`    |
| 6   | **Layer violation in `StudioShell.tsx:36`**         | Direct supabase import in component                     | `src/components/studio/unified/StudioShell.tsx:36` |

### ⚠️ High (P1)

| #   | Problem                                      | Impact                                            | Code Reference                              |
| --- | -------------------------------------------- | ------------------------------------------------- | ------------------------------------------- |
| 7   | **10+ type escapes**                         | Runtime errors, TypeScript gives false confidence | Multiple files (see §1.1)                   |
| 8   | **Double casts at `tracks.api.ts:168–171`**  | Data shape mismatches propagate silently          | `src/api/tracks.api.ts:168-171`             |
| 9   | **Deprecated `suno-generate` Edge Function** | Legacy code path still callable                   | `supabase/functions/suno-generate/index.ts` |
| 10  | **30+ lyrics files in 6 directories**        | Fragmented ecosystem, hard to navigate            | `PHASE_9_DEDUPLICATION_PLAN.md` §9C         |
| 11  | **`components/ui/` disorganization**         | Unclear component boundaries                      | `PHASE_9_DEDUPLICATION_PLAN.md` §9D         |
| 12  | **Telegram type escapes**                    | Runtime crashes on Telegram API access            | `notifications.ts:123`, `share.ts:38-39`    |

### 📋 Medium (P2)

| #   | Problem                                                 | Impact                                  | Code Reference                                  |
| --- | ------------------------------------------------------- | --------------------------------------- | ----------------------------------------------- |
| 13  | **484 `any` types**                                     | Systematic type safety degradation      | Entire codebase                                 |
| 14  | **Test coverage ~9.2%** (claimed 82% — **discrepancy**) | Untested code, regression risk          | `SPRINT-035-038-PLAN.md` vs `PROJECT_STATUS.md` |
| 15  | **Webpack chunk names in Vite project**                 | Code-splitting may not work as expected | `src/App.tsx` — all admin lazy imports          |
| 16  | **Storybook not populated**                             | No component documentation              | `src/stories/` has only boilerplate             |

---

## 10. Detailed Improvement Plan

### P0 — Critical (Address Immediately, Sprint 035)

| #    | Task                                                         | Effort (person-days) | Expected Effect                                             | Dependencies |
| ---- | ------------------------------------------------------------ | -------------------- | ----------------------------------------------------------- | ------------ |
| P0.1 | **Fix CI/CD pipeline**                                       | 2 days               | Unblock deployments and quality gates                       | None         |
| P0.2 | **Stabilize 47 failing E2E specs**                           | 3 days               | Reliable regression testing                                 | P0.1 (CI/CD) |
| P0.3 | **Split `useGenerateForm.ts` (1,219 lines → ~5 hooks)**      | 3 days               | Maintainable generation logic, testable in isolation        | None         |
| P0.4 | **Split `GlobalAudioProvider.tsx` (983 lines → ~4 modules)** | 2 days               | Separation of retry logic, URL validation, format filtering | None         |
| P0.5 | **Split `StudioShell.tsx` (656 lines → ~3 components)**      | 2 days               | Clear component boundaries, reduced cognitive load          | None         |
| P0.6 | **Fix layer violation at `StudioShell.tsx:36`**              | 0.5 days             | Restore architectural integrity                             | P0.5         |

**P0 Total: ~12.5 person-days**

### P1 — Important (Next Sprint, Sprint 036)

| #    | Task                                                              | Effort (person-days) | Expected Effect                                         | Dependencies                                  |
| ---- | ----------------------------------------------------------------- | -------------------- | ------------------------------------------------------- | --------------------------------------------- |
| P1.1 | **Eliminate 10+ type escapes across codebase**                    | 2 days               | Type-safe Telegram API, RPC responses, store middleware | None                                          |
| P1.2 | **Replace double casts at `tracks.api.ts:168-171`**               | 0.5 days             | Type-safe track data transformation                     | None                                          |
| P1.3 | **Replace deprecated `suno-generate` with `suno-music-generate`** | 1 day                | Remove legacy code path                                 | None                                          |
| P1.4 | **Consolidate 30+ lyrics files into target structure (Phase 9C)** | 2 days               | Single source of truth for lyrics logic                 | P0.3 (useGenerateForm split may touch lyrics) |
| P1.5 | **Reorganize `components/ui/` (Phase 9D)**                        | 1 day                | Clear component hierarchy and boundaries                | None                                          |
| P1.6 | **Formal Telegram WebApp type definitions**                       | 1 day                | Eliminate `any` escapes, proper intellisense            | None                                          |

**P1 Total: ~7.5 person-days**

### P2 — Nice to Have (Future Sprints)

| #    | Task                                                                                | Effort (person-days) | Expected Effect                                    | Dependencies                         |
| ---- | ----------------------------------------------------------------------------------- | -------------------- | -------------------------------------------------- | ------------------------------------ |
| P2.1 | **Reduce 484 `any` types systematically**                                           | 5 days               | Improved type coverage, fewer runtime surprises    | P1.1                                 |
| P2.2 | **Expand unit test coverage from ~9.2% to 50%+**                                    | 10 days              | Regression prevention, confident refactoring       | P0.3, P0.4, P0.5 (split files first) |
| P2.3 | **Investigate test coverage discrepancy (82% claim vs ~9.2%)**                      | 0.5 days             | Truthful metrics, accurate tracking                | None                                 |
| P2.4 | **Add Storybook documentation (Phase 9E)**                                          | 3 days               | Component documentation, visual regression testing | P0.4, P0.5                           |
| P2.5 | **Migrate webpack chunk name comments to Vite `rollupOptions.output.manualChunks`** | 0.5 days             | Proper code-splitting with Vite                    | None                                 |
| P2.6 | **Remove cross-store subscription sync in favor of event bus**                      | 2 days               | Decoupled stores, no update loop risk              | P0.3                                 |

**P2 Total: ~21 person-days**

---

## 11. Summary (All Priorities)

| Priority  | Tasks  | Total Effort | Target Sprint  |
| --------- | ------ | ------------ | -------------- |
| P0        | 6      | 12.5 days    | Sprint 035     |
| P1        | 6      | 7.5 days     | Sprint 036     |
| P2        | 6      | 21 days      | Sprint 037–038 |
| **Total** | **18** | **41 days**  | **Q3–Q4 2026** |

---

## 12. ⚠️ Data Discrepancy: Test Coverage

There is a **conflicting claim** about test coverage:

- `PROJECT_STATUS.md` and `ROADMAP.md`: **"82% unit test coverage"**
- `SPRINT-035-038-PLAN.md` (§Текущее состояние проекта): **"~91 тестовый файл (~9.2% покрытие)"** and target of **"200+ тестов"** (Sprint 037 Phase 1)

**Recommendation (P2.3):** Investigate and reconcile this discrepancy. If the real figure is ~9.2%, this is a critical blind spot that should be elevated to P1. If 82% is correct, the sprint plans reference the wrong baseline.

---

_This plan was generated from a comprehensive architectural audit. All file references use exact line numbers from the current codebase._
