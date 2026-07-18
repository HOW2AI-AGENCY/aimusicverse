# Branch Protection Phase 2 — Manual Application Required

**Date:** 2026-07-05  
**Status:** ⏳ Pending manual application  
**Priority:** 🔴 Critical (blocks all other Sprint 050 work)

---

## 📋 Context

Sprint 050-A4 Phase 1 is complete (force-push protection, deletion protection, linear history). Phase 2 requires adding pull request rules and required CI status checks.

**Current Ruleset:** `18508298`  
**Ruleset Name:** `protect-main (Sprint 050-A4)`  
**Branch:** `refs/heads/main`

---

## ✅ Phase 1 - Completed

Current protections:

- ✅ `non_fast_forward` - No force-push allowed
- ✅ `deletion` - Branch cannot be deleted
- ✅ `required_linear_history` - Linear history required
- ✅ `bypass_actors: []` - Even admin cannot bypass

---

## ⏳ Phase 2 - To Apply Manually

### Required Changes

Add the following rules to the existing ruleset `18508298`:

#### 1. Pull Request Rule

```json
{
  "type": "pull_request",
  "parameters": {
    "dismiss_stale_reviews": false,
    "require_last_push_approval": false,
    "required_approving_review_count": 0,
    "require_code_owner_review": false
  }
}
```

**Purpose:** Require pull requests for all changes (allowing self-merge with 0 approvals)

#### 2. Required Status Checks

```json
{
  "type": "required_status_checks",
  "parameters": {
    "strict_mode": false,
    "required_status_checks": [
      {
        "context": "quality",
        "app_id": null
      },
      {
        "context": "build",
        "app_id": null
      }
    ]
  }
}
```

**Purpose:** Require `quality` and `build` CI checks to pass before merging

---

## 🔧 How to Apply

### Option 1: Using GitHub CLI (gh)

```bash
gh api --method PUT repos/HOW2AI-AGENCY/aimusicverse/rulesets/18508298 --input-file - << 'EOF'
{
  "name": "protect-main (Sprint 050-A4 Phase 2)",
  "target": "branch",
  "source_type": "Repository",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "exclude": [],
      "include": ["refs/heads/main"]
    }
  },
  "rules": [
    {
      "type": "deletion"
    },
    {
      "type": "non_fast_forward"
    },
    {
      "type": "required_linear_history"
    },
    {
      "type": "pull_request",
      "parameters": {
        "dismiss_stale_reviews": false,
        "require_last_push_approval": false,
        "required_approving_review_count": 0,
        "require_code_owner_review": false
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_mode": false,
        "required_status_checks": [
          {
            "context": "quality",
            "app_id": null
          },
          {
            "context": "build",
            "app_id": null
          }
        ]
      }
    }
  ],
  "bypass_actors": []
}
EOF
```

### Option 2: Using GitHub Web UI

1. Navigate to: https://github.com/HOW2AI-AGENCY/aimusicverse/rules/18508298
2. Click "Edit rules"
3. Add the new rules as specified above
4. Save changes

---

## ⚠️ Important Notes

**Why this requires manual application:**

- Branch protection rules are critical security settings
- They affect all repository operations
- Require explicit authorization for modification

**Verification:**
After applying Phase 2, verify with:

```bash
gh api repos/HOW2AI-AGENCY/aimusicverse/rulesets/18508298
```

**Expected outcome:**

- All direct pushes to `main` should be blocked
- All changes must go through pull requests
- `quality` and `build` checks must pass before merging
- Force-push attempts should fail

---

## 📊 Impact

**Before Phase 2:**

- Direct pushes still possible (though force-push blocked)
- No CI check requirement before merge
- Lovable commits bypassing pre-commit hooks

**After Phase 2:**

- All changes require PR workflow
- CI checks mandatory
- Consistent process enforcement
- Main branch stability guaranteed

---

## 🔗 Related Tasks

- **Sprint 050-A0:** ✅ P0 hotfix typecheck (completed)
- **Sprint 050-A1:** ⏳ E2E verdict on green main
- **Sprint 050-A2:** 🔄 Fix 7 broken docs links (in progress)
- **Sprint 050-A3:** ⏳ Reconcile prod migrations
- **Sprint 050-A4:** 🔄 Branch protection (Phase 1 ✅, Phase 2 ⏳ manual)
- **Sprint 050-A5:** ⏳ Resolve bun.lock vs package-lock.json

---

**Next Steps:** Apply Phase 2 manually → Complete Sprint 050-A2/A3/A5 → Finalize Sprint 050
