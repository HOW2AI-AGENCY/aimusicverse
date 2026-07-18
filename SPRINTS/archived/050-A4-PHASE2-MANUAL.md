# Sprint 050-A4 Phase 2 - Manual Application Instructions

**Status:** ⏳ Ready for manual application (network timeout)

## Summary

Branch protection Phase 2 ruleset is prepared and ready to apply. Due to network timeout via GitHub CLI, manual application is required.

## Two Ways to Apply

### Option 1: GitHub UI (Recommended)

1. Navigate to: https://github.com/HOW2AI-AGENCY/aimusicverse/rules/18508298
2. Click "Edit ruleset"
3. Set "Enforcement" to "Active"
4. Add "smoke" to required status checks (should have: quality, build, smoke)
5. Click "Save changes"

### Option 2: GitHub CLI (Retry)

```bash
cd d:\.MUSICVERSE\aimusicverse
gh api -X PUT repos/HOW2AI-AGENCY/aimusicverse/rulesets/18508298 --input ruleset-update.json
```

## Verification

After applying, verify with:

```bash
gh api repos/HOW2AI-AGENCY/aimusicverse/rulesets/18508298
```

Expected output:

- `"enforcement": "active"`
- 3 status checks: quality, build, smoke

## Current Configuration

The `ruleset-update.json` file contains:

- ✅ `non_fast_forward` (prevents force-push)
- ✅ `deletion` (prevents branch deletion)
- ✅ `required_linear_history`
- ✅ `pull_request` with 0 approvals (self-merge allowed)
- ✅ `required_status_checks`: quality, build, smoke
- ✅ `bypass_actors: []` (even admin cannot bypass)

## Impact

After enforcement is active:

- **Force-push blocked** → prevents main corruption (8-hour downtime in Sprint 052)
- **Direct push blocked** → all changes must go through PR
- **CI checks required** → quality, build, smoke must pass before merge
- **Zero bypass** → even repository admins are subject to rules

## Status

- ✅ Dependencies installed (E2E blocker resolved)
- ✅ Ruleset prepared (`ruleset-update.json`)
- ⏳ **Awaiting manual application** (network timeout)

---

**Created:** 2026-07-05
**Sprint:** 050-A4 Phase 2
**Next:** Apply ruleset → verify → push commits
