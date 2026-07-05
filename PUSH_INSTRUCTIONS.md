# 🚀 Push & Branch Protection Instructions

## 📋 Quick Actions

### 1. Push Changes to Main

```bash
# Push all 3 commits to main
git push origin main
```

**What will be pushed:**

- `25641c70` - ESLint fix (site/** exclusion)
- `bb90fb14` - Lockfile decision (package-lock.json only)
- `ad534130` - Vite optional import fix

### 2. Enable Branch Protection Phase 2

**Option A: Via GitHub CLI (Recommended)**

```bash
# Create ruleset update JSON
cat > /tmp/ruleset-update.json << 'EOF'
{
  "name": "protect-main (Sprint 050-A4 Phase 2)",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
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
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false,
        "allowed_merge_methods": ["merge", "squash", "rebase"]
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": false,
        "do_not_enforce_on_create": false,
        "required_status_checks": [
          {"context": "quality"},
          {"context": "build"},
          {"context": "smoke"}
        ]
      }
    }
  ],
  "bypass_actors": []
}
EOF

# Apply ruleset update
gh api --method PUT \
  repos/HOW2AI-AGENCY/aimusicverse/rulesets/18508298 \
  --input /tmp/ruleset-update.json
```

**Option B: Via GitHub Web UI**

1. Go to: https://github.com/HOW2AI-AGENCY/aimusicverse/rulesets
2. Find: "protect-main (Sprint 050-A4)"
3. Click "Edit" → Toggle "Enable ruleset"
4. Under "Bypass restrictions": Leave empty (even admin can't bypass)
5. Click "Save changes"

### 3. Verify Setup

```bash
# Check current ruleset
gh api repos/HOW2AI-AGENCY/aimusicverse/rulesets/18508298

# Check CI status
gh run list --workflow "CI" --limit 3
gh run list --workflow "Docs" --limit 3
gh run list --workflow "E2E" --limit 3
```

## 🎯 Expected Result

After these actions:

- ✅ All changes pushed to main
- ✅ Branch protection active (force-push blocked)
- ✅ Required checks: quality, build, smoke
- ✅ CI/CD workflows running

## ⚠️ What Happens Next

1. **CI/CD will run** automatically on push
2. **Workflows must be green** 2 days in a row for Sprint 050 DoD
3. **If format check fails** - prettier drift may exist (run `npm run format`)
4. **If typecheck fails** - TypeScript errors need fixing

## 🚨 If Something Goes Wrong

### Push Rejected

```bash
# Pull latest changes first
git pull origin main --rebase
# Then push again
git push origin main
```

### Branch Protection Error

```bash
# Disable temporarily (if needed)
gh api --method PUT \
  repos/HOW2AI-AGENCY/aimusicverse/rulesets/18508298 \
  --input '{
    "enforcement": "disabled"
  }'
```

### CI Failures

```bash
# Check workflow logs
gh run view <run-id> --log

# Run checks locally
npm run lint
npm run typecheck
npm run format:check
npm run test
```

---

**Prepared by:** Claude Code (Sprint 050 Closure Planning)
**Date:** 2026-07-05
**Next:** Mobile Audit F1-F12 → Sprint 051 Test Debt
