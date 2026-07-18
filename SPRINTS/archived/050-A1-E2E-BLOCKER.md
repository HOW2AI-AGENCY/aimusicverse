# Sprint 050-A1 - E2E Verdict Blocker

**Status:** 🔴 BLOCKED - Dependency issue

## Problem

E2E tests cannot run due to missing rollup dependency:

```
Error: Cannot find module '@rollup/rollup-win32-x64-msvc'
```

## Error Details

Full error from `npm run test:e2e`:

- WebServer fails to start due to missing rollup native module
- npm bug related to optional dependencies: https://github.com/npm/cli/issues/4828

## Suggested Fix

1. Remove node_modules and package-lock.json:

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Or manually install missing dependency:

   ```bash
   npm install @rollup/rollup-win32-x64-msvc --save-optional
   ```

3. Verify with:
   ```bash
   npm run test:e2e --list
   ```

## Current State

- ✅ Quality & Build green on main (commit `0ea8603`)
- ✅ Unit tests 292/292 passing
- 🔴 **E2E blocked** - cannot get verdict due to dependency issue
- 🟡 Docs workflow - 7 voice-cloning links fixed (awaiting CI verification)

## Impact

- Sprint 050 DoD requires "4/4 workflow зелёные два дня подряд"
- E2E verdict is one of the 4 required workflows
- Cannot mark Sprint 050 as complete without E2E verdict

---

**Created:** 2026-07-05
**Sprint:** 050-A1
**Blocks:** Sprint 050 completion
**Next:** Fix dependencies, re-run E2E, document verdict
