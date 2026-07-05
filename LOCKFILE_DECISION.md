# Lockfile Decision (Sprint 050-A5)

**Decision:** Use only package-lock.json (single source of truth)

**Rationale:**

- package-lock.json is the official npm lockfile
- CI/CD uses npm ci (not bun)
- Dual lockfiles cause confusion and potential conflicts
- bun.lockb was binary, harder to review

**Migration:**

- bun.lockb removed 2026-07-05
- All dependency updates go through package-lock.json
- Team consensus required to re-add bun.lockb in future
