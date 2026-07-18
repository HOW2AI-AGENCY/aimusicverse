# Sprint 050-A4 Phase 2 - Branch Protection Instructions

**Status:** ⏳ Blocked - Requires user permission

## What needs to be done

Update ruleset `18508298` to enable enforcement and add `smoke` check.

## Manual Steps

1. **Update ruleset via GitHub CLI:**

   ```bash
   cd d:\.MUSICVERSE\aimusicverse
   gh api -X PUT repos/HOW2AI-AGENCY/aimusicverse/rulesets/18508298 --input ruleset-update.json
   ```

2. **Or via GitHub UI:**
   - Navigate to: https://github.com/HOW2AI-AGENCY/aimusicverse/rules/18508298
   - Click "Edit ruleset"
   - Set "Enforcement" to "Active"
   - Add "smoke" to required status checks

## Current State

- ✅ Phase 1 complete (non_fast_forward, deletion, required_linear_history)
- ✅ pull_request rule added (0 approvals for self-merge)
- ✅ required_status_checks has "quality" and "build"
- ⏳ Needs: enforcement="active" + "smoke" check added

## Files Created

- `ruleset-update.json` - Complete ruleset configuration ready to apply

## Verification

After applying, verify with:

```bash
gh api repos/HOW2AI-AGENCY/aimusicverse/rulesets/18508298
```

Expected: `"enforcement": "active"` and 3 status checks (quality, build, smoke).

---

**Created:** 2026-07-05
**Sprint:** 050-A4 Phase 2
**Requires:** User permission (repository settings modification)
