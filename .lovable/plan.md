# Unified Generation Form — Refactor Progress

## Status

- **Phase 1 — Safe cleanup**: ✅ Complete (excluding deferred items)
- **Phase 2 — Structural**: ✅ Complete
- **Phase 3 — De-duplication**: ✅ Complete (excluding blocked items)
- **Phase 4 — Verify + document**: ✅ Docs done, tests deferred

## Done

| Section | What | Who |
|---|---|---|
| §3 | Entry-point standardization (CreativePresetsSection fix) | Lovable |
| §4 | Deduplicate lyrics editor (12 files, −2500 LOC) | Lovable |
| §7 | Prop-drilling → single form object (−83 LOC) | Us |
| §8 | Design primitives (FormSettingCard, FormSliderRow) | Us |
| §11 | docs/GENERATE_FORM.md | Us |
| — | React hooks cleanup (381 warnings → 0) | Us |

## Deferred / Blocked

| Section | What | Reason |
|---|---|---|
| §1 | Retire GenerateSheet.legacy | Blocked — flag `default: false`, not 100% |
| §6 | Merge studio dialog wirings | Deferred — needs reconciliation of divergent props |
| §10 | Remove deprecated progress hooks | Deferred — needs API-shape audit |
| §9 | Tag composer consolidation | Dead — files already removed |

## Next

1. @ts-nocheck files (schema drift) — 4 API files
2. Edge function decomposition (>800 LOC)
3. Studio dialog consolidation (§6)
