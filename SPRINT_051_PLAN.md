# Sprint 051: Test Debt + God Files (Tests-First Decomposition)

**Duration:** ~10 days  
**Dependencies:** Sprint 050 closed  
**Goal:** 292 → 450+ unit tests, 0 files >1000 lines  
**Strategy:** Tests-first approach - write tests BEFORE refactoring

---

## 📋 OVERVIEW

### Current State

- **Unit Tests:** 292 passing (20 suites)
- **Coverage:** <1% on 1136 components
- **God Files:** 9 files >800 lines
- **Unexecuted Tests:** 25 files in `tests/unit/` not picked up by vitest
- **API/Service Tests:** 0 coverage

### Target State

- **Unit Tests:** 450+ passing (28+ suites)
- **God Files:** 0 files >1000 lines
- **Coverage:** API/Services 100%
- **CI:** All tests in `tests/unit/` execute

---

## 🎯 PHASE 1: Infrastructure Fix (Day 1)

### 1.1 Vitest Include Expansion

**Problem:** 25 test files in `tests/unit/` never run

**File:** `vitest.config.ts`

```typescript
export default defineConfig({
  testMatch: [
    "**/__tests__/**/*.{test,spec}.{ts,tsx}",
    "tests/unit/**/*.{test,spec}.{ts,tsx}", // ADD THIS
  ],
  // ... rest of config
});
```

**Action:** Expand testMatch pattern
**Verify:** `npm test` should run 25+ additional test files
**Estimate:** 0.3 day

### 1.2 Global Mocks Fix

**Problems:**

1. `ResizeObserver` not a constructor in global mock
2. `waitForLoadState("networkidle")` → locator-expected

**Files:**

- `src/__tests__/vitest.setup.ts`
- `tests/e2e/suno-mashup.spec.ts`

**Fix 1 - ResizeObserver:**

```typescript
// src/__tests__/vitest.setup.ts
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

**Fix 2 - Networkidle:**

```typescript
// tests/e2e/suno-mashup.spec.ts
// Replace:
await page.waitForLoadState("networkidle");
// With:
await page.waitForLoadState("domcontentloaded");
// Or better: await expect(page.locator("selector")).toBeVisible();
```

**Estimate:** 0.4 day

### 1.3 Full Test Suite Verification

**Action:**

```bash
npm test  # Should now run 292 + 25 = 317+ tests
```

**Expected:** Some tests may fail (fallback/gap fixes)
**Estimate:** 0.3 day

**Phase 1 Total:** 1 day

---

## 🎯 PHASE 2: API/Services Tests (Days 2-4)

### 2.1 Test Strategy

**Pattern for each file:**

```typescript
describe("src/api/example.api.ts", () => {
  describe("getExampleById", () => {
    it("should return example data", async () => {
      const { data, error } = await getExampleById("valid-id");
      expect(error).toBeNull();
      expect(data).toMatchObject({
        id: "valid-id",
        // ... other fields
      });
    });

    it("should handle not found error", async () => {
      const { data, error } = await getExampleById("invalid-id");
      expect(data).toBeNull();
      expect(error).toMatchObject({
        message: expect.stringContaining("not found"),
      });
    });

    it("should handle network error", async () => {
      // Mock supabase.from().select() to throw
      const { error } = await getExampleById("network-error");
      expect(error).not.toBeNull();
    });
  });
});
```

### 2.2 API Layer Tests (20 files)

**Files to test:**

```
src/api/*.api.ts
- tracks.api.ts (12 tests)
- users.api.ts (8 tests)
- playlists.api.ts (10 tests)
- library.api.ts (6 tests)
- favorites.api.ts (6 tests)
- generation.api.ts (15 tests)
- studio.api.ts (10 tests)
- // ... 12 more files
```

**Target:** 2-3 tests per file (happy path + 2 error cases)
**Total:** ~120 tests for API layer

### 2.3 Service Layer Tests (18 files)

**Files to test:**

```
src/services/*.service.ts
- tracks.service.ts (15 tests)
- users.service.ts (10 tests)
- playback.service.ts (12 tests)
- audioAnalysis.service.ts (8 tests)
- voiceClone.service.ts (8 tests)
- referenceManager.service.ts (6 tests)
- // ... 12 more files
```

**Target:** 2-3 tests per file
**Total:** ~90 tests for service layer

**Execution:**

- **Day 2:** API files 1-10 (50 tests)
- **Day 3:** API files 11-20, Service files 1-9 (70 tests)
- **Day 4:** Service files 10-18, verification (40 tests)

**Phase 2 Total:** 3 days (~210 new tests)

---

## 🎯 PHASE 3: TanStack Query Mutations Tests (Day 5)

### 3.1 Mandatory Mutation Tests (from Sprint 052 retro)

**Files:** 3 hooks, 3 edge functions

**Hooks (5 tests each):**

```typescript
// src/hooks/studio/useSunoMashup.test.ts
describe("useSunoMashup", () => {
  it("should call mutation with correct parameters", async () => {
    const { result } = renderHook(() => useSunoMashup());
    await act(async () => {
      await result.current.mutateAsync({ trackIds: ["id1", "id2"] });
    });
    expect(supabase.functions().invoke).toHaveBeenCalledWith(
      "suno-mashup",
      expect.objectContaining({ trackIds: ["id1", "id2"] }),
    );
  });
  // ... 4 more tests
});
```

**Edge Functions (6 tests each):**

- `suno-mashup` - happy path + 5 invalid bodies
- `suno-persona` - happy path + 5 invalid bodies
- `suno-file-upload` - multipart/form-data + type validation

**Total:** 15 (hooks) + 18 (edge) = 33 tests

**Estimate:** 1 day

---

## 🎯 PHASE 4: God Files Decomposition (Days 6-9)

### 4.1 Top-3 Priority Files

**Criteria:** >800 lines, high complexity, critical paths

#### File 1: `studio.service.ts` (1028 LOC)

**Decomposition Plan:**

```
src/services/studio/
├── studio.service.ts (main orchestration)
├── studio-track.service.ts (track operations)
├── studio-version.service.ts (version management)
├── studio-export.service.ts (export operations)
└── studio-mix.service.ts (mixing operations)
```

**Tests First (12 tests):**

```typescript
// src/services/studio/studio.service.test.ts
describe("StudioService", () => {
  describe("createTrack", () => {
    /* 4 tests */
  });
  describe("updateTrack", () => {
    /* 4 tests */
  });
  describe("deleteTrack", () => {
    /* 4 tests */
  });
});
```

**Action:** Write tests → Split file → Verify tests pass

#### File 2: `LyricsParser.ts` (903 LOC)

**Decomposition Plan:**

```
src/lib/lyrics/
├── LyricsParser.ts (main parser)
├── lyrics-timestamp.service.ts (timestamp parsing)
├── lyrics-section.service.ts (section detection)
└── lyrics-sync.service.ts (synchronization)
```

**Tests First (8 tests):**

```typescript
// src/lib/lyrics/LyricsParser.test.ts
describe("LyricsParser", () => {
  describe("parseLyrics", () => {
    /* 4 tests */
  });
  describe("detectSections", () => {
    /* 4 tests */
  });
});
```

#### File 3: `studio.api.ts` (891 LOC)

**Decomposition Plan:**

```
src/api/studio/
├── studio.api.ts (main queries)
├── studio-track.api.ts (track CRUD)
├── studio-version.api.ts (version operations)
└── studio-stem.api.ts (stem operations)
```

**Tests First (10 tests):**

```typescript
// src/api/studio/studio.api.test.ts
describe("StudioAPI", () => {
  describe("getStudioData", () => {
    /* 5 tests */
  });
  describe("updateStudioSettings", () => {
    /* 5 tests */
  });
});
```

**Execution:**

- **Day 6:** `studio.service.ts` - write tests (12) + split (4 files)
- **Day 7:** `LyricsParser.ts` - write tests (8) + split (4 files)
- **Day 8:** `studio.api.ts` - write tests (10) + split (4 files)
- **Day 9:** Buffer for complex refactors, verification

**Phase 4 Total:** 4 days (30 new tests + 3 files split)

---

## 🎯 PHASE 5: Remaining 6 Files (Days 10)

### 5.1 Lower Priority God Files

**If time permits:**

- `IntegratedStemTracks.tsx` (>800 LOC)
- `UnifiedNotesViewer.tsx` (>800 LOC)
- `deeplink-tracker.ts` (>800 LOC)
- `errorHandling.ts` (>800 LOC)
- `AudioAnalysisService.ts` (>800 LOC)
- `LyricsVisualEditor.tsx` (>800 LOC)

**Strategy:** Defer to Sprint 055 if time runs out

**Phase 5 Total:** 1 day (optional)

---

## 📊 SUCCESS METRICS (DoD)

### Test Coverage

- [ ] 450+ unit tests passing (292 + 158+ = 450+)
- [ ] 0 files >1000 lines
- [ ] `tests/unit/**` executes in CI
- [ ] API layer 100% covered (20 files)
- [ ] Service layer 100% covered (18 files)

### Quality Gates

- [ ] `npm test` - all pass
- [ ] `npm run test:coverage` - coverage report generated
- [ ] E2E tests still pass (47 specs)
- [ ] No regressions in functionality

### Documentation

- [ ] `SPRINT-PROGRESS.md` - Sprint 051 line updated
- [ ] `PROJECT_STATUS.md` - metrics updated
- [ ] `ROADMAP.md` - Sprint 051 marked complete
- [ ] `CHANGELOG.md` - Unreleased section updated

---

## ⚠️ RISKS & MITIGATION

### Risk 1: Tests May Fail Initially

**Mitigation:** Fix tests in Phase 1, fix code in Phase 2-4

### Risk 2: God Files Refactor May Break Things

**Mitigation:** Tests-first approach guarantees regression detection

### Risk 3: Time Overrun

**Mitigation:** Prioritize Top-3, defer remaining 6 to Sprint 055

### Risk 4: Coverage May Be Lower Than Expected

**Mitigation:** Focus on critical paths (API + Services), not UI

---

## 🗓 EXECUTION SCHEDULE

| Week | Days | Phase   | Focus                      |
| ---- | ---- | ------- | -------------------------- |
| 1    | 1    | Phase 1 | Infrastructure Fix         |
| 2    | 2-4  | Phase 2 | API/Services Tests         |
| 2    | 5    | Phase 3 | Mutation Tests             |
| 3    | 6-9  | Phase 4 | God Files Decomposition    |
| 3    | 10   | Phase 5 | Remaining Files (optional) |

**Total:** 10 days (2.5 weeks)

---

## 🎯 NEXT STEPS

1. **Start Phase 1** - Fix vitest include, global mocks
2. **Verify test suite** - Ensure all tests run
3. **Begin Phase 2** - API/Services tests (parallel execution possible)
4. **Tests-first for god files** - Write tests before splitting
5. **CI verification** - Ensure tests run in GitHub Actions

---

**Dependencies Complete:** Sprint 050 closed  
**Blocks:** Sprint 053 (Suno API) can run in parallel after Phase 2  
**Success Criteria:** 450+ tests, 0 files >1000 LOC
