---
description: "Task list for Docs Refresh Audit & Unification"
---

# Tasks: Docs Refresh Audit & Unification

**Input**: Design documents from `/specs/002-docs-refresh/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Tests are OPTIONAL. The spec does not request automated tests; focus on documentation deliverables, inventories, redirects, and alignment checks. Include validation steps where helpful but no code tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure local tooling and guardrails for docs work (no code/runtime changes expected).

- [ ] T001 Document required tooling and commands for docs work in specs/002-docs-refresh/plan.md (link check, markdown lint, OpenAPI spot-check commands)
- [ ] T002 [P] Verify existing lint/link tooling references (e.g., linkinator/markdown-link-check) and record invocation in specs/002-docs-refresh/plan.md
- [ ] T003 [P] Establish docs workspace note: primary edit areas and exclusion list in specs/002-docs-refresh/plan.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Baseline inventory scaffolds and conventions needed before story work.

- [ ] T004 Create docs inventory worksheet scaffold in specs/002-docs-refresh/data-model.md (table headers: path, owner, freshness date, disposition, language, status)
- [ ] T005 [P] Draft redirect mapping template in specs/002-docs-refresh/contracts/redirects.md (columns: legacy path, canonical target, rationale, status)
- [ ] T006 [P] Add style/terminology checklist starter in specs/002-docs-refresh/checklists/requirements.md (headings, summaries, bilingual handling, deprecation note format)
- [ ] T007 Record doc quality gate definition in specs/002-docs-refresh/plan.md (review checklist, link lint, ownership metadata expectation)

**Checkpoint**: Inventory and templates ready; user stories can proceed.

---

## Phase 3: User Story 1 - Audit & Consolidate Docs (Priority: P1) 🎯 MVP

**Goal**: Inventory all docs, identify duplicates/conflicts, propose dispositions and redirects with ownership.

**Independent Test**: Auditor can produce a complete inventory with dispositions/owners and a redirect plan without touching product code.

### Implementation for User Story 1

- [ ] T008 [P] [US1] Inventory docs corpus into specs/002-docs-refresh/data-model.md (fill table; scope docs/, ADR/, specs/ indexes)
- [ ] T009 [US1] Identify duplicates/conflicts and mark disposition (merge/redirect/archive) in specs/002-docs-refresh/data-model.md
- [ ] T010 [P] [US1] Propose canonical IA outline and entry points in specs/002-docs-refresh/plan.md (sections, hierarchy, nav pointers)
- [ ] T011 [US1] Produce redirect map draft in specs/002-docs-refresh/contracts/redirects.md (legacy → canonical targets)
- [ ] T012 [P] [US1] Define ownership and freshness rules in specs/002-docs-refresh/plan.md (owners per section, update cadence)
- [ ] T013 [US1] Add deprecation/tie-break guidance (conflicting guides, deprecated features) in specs/002-docs-refresh/plan.md
- [ ] T014 [US1] Document doc change management/versioning approach in specs/002-docs-refresh/plan.md (release notes, dated archives, redirect rules)
- [ ] T015 [US1] Summarize measurement plan for doc health in specs/002-docs-refresh/plan.md (broken links count, duplicates count, quickstart time metric)

**Checkpoint**: P1 outputs ready for review (inventory, IA, redirect map, ownership, measurements).

---

## Phase 4: User Story 2 - Fast Onboarding via Quickstart (Priority: P2)

**Goal**: Normalize quickstart to current setup with target time and validation steps.

**Independent Test**: New engineer can follow the quickstart to a working baseline within target time without external help.

### Implementation for User Story 2

- [ ] T016 [US2] Refresh quickstart steps in specs/002-docs-refresh/quickstart.md (prereqs, setup commands, expected duration, checkpoints)
- [ ] T017 [P] [US2] Align quickstart terminology with IA and style rules in specs/002-docs-refresh/checklists/requirements.md
- [ ] T018 [US2] Add validation steps and success criteria to specs/002-docs-refresh/quickstart.md (what “done” means, sanity checks)
- [ ] T019 [P] [US2] Capture blocked/edge-case guidance in specs/002-docs-refresh/quickstart.md (bilingual divergence, deprecated paths)

**Checkpoint**: Quickstart updated and independently runnable per doc guidance.

---

## Phase 5: User Story 3 - API Consumer Alignment (Priority: P3)

**Goal**: Ensure API docs align with canonical OpenAPI and are discoverable with consistent terminology/examples.

**Independent Test**: Consumer can find OpenAPI file and see consistent parameters/status/examples with contract.

### Implementation for User Story 3

- [ ] T020 [P] [US3] Locate canonical OpenAPI reference and document pointer in specs/002-docs-refresh/contracts/openapi-pointer.md (path, version, ownership)
- [ ] T021 [US3] Spot-check top endpoints vs OpenAPI and log mismatches in specs/002-docs-refresh/contracts/openapi-pointer.md (params/status/examples)
- [ ] T022 [P] [US3] Add cross-links from API guides to OpenAPI location and IA entries in specs/002-docs-refresh/plan.md
- [ ] T023 [US3] Document terminology/style alignment for API sections in specs/002-docs-refresh/checklists/requirements.md

**Checkpoint**: API alignment notes and pointers complete; mismatches enumerated.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final harmonization across stories and readiness checks.

- [ ] T024 [P] Update consolidated IA/redirect pointers into docs/README.md or docs/INDEX.md (add links to canonical entries)
- [ ] T025 [P] Apply ownership and freshness metadata to priority docs listed in specs/002-docs-refresh/data-model.md
- [ ] T026 Run link/markdown lint on refreshed scope and note outcomes in specs/002-docs-refresh/plan.md
- [ ] T027 Capture final doc review checklist in specs/002-docs-refresh/checklists/requirements.md (quality gate ready)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories.
- **User Stories (Phase 3+)**: Depend on Foundational completion. Execute by priority: P1 → P2 → P3. P2 and P3 can run in parallel after P1 if capacity allows, but IA/redirect outputs from P1 should inform P2/P3.
- **Polish (Phase 6)**: After targeted user stories complete.

### User Story Dependencies

- **US1 (P1)**: None beyond Foundational; produces IA and redirects consumed by US2/US3.
- **US2 (P2)**: Should align with IA/terminology from US1.
- **US3 (P3)**: Should align with IA/terminology from US1; can proceed after US1.

### Parallel Opportunities

- Within Setup/Foundational: tasks marked [P] can run concurrently (T002, T003, T005, T006).
- After US1 IA draft exists: US2 quickstart refresh (T016–T019) and US3 API alignment (T020–T023) can run in parallel if IA pointers are stable.
- Polish tasks T024–T027 can run in parallel once all story outputs are available.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup (Phase 1)
2. Complete Foundational (Phase 2)
3. Complete User Story 1 (Phase 3) → MVP checkpoint

### Incremental Delivery

1. Finish Setup + Foundational
2. Deliver US1 (inventory, IA, redirects, ownership/measurement)
3. Deliver US2 (quickstart normalization)
4. Deliver US3 (API alignment)
5. Polish

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. US1 IA/redirects lead → US2 quickstart and US3 API alignment in parallel once IA stable
3. Polish after story outputs land

---
