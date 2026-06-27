<div align="center">

# 🔒 Security Policy

**Coordinated disclosure keeps users safe. Thank you for reporting responsibly.**

<p>
  <img alt="Policy" src="https://img.shields.io/badge/policy-active-10B981?style=for-the-badge"/>
  <img alt="Response SLA" src="https://img.shields.io/badge/SLA-72h-26A5E4?style=for-the-badge"/>
  <img alt="PGP" src="https://img.shields.io/badge/PGP-available-9333EA?style=for-the-badge"/>
</p>

<p>
  <a href="README.md">🏠 Home</a> ·
  <a href="DOCUMENTATION_INDEX.md">📚 Docs</a> ·
  <a href="CONTRIBUTING.md">🤝 Contributing</a> ·
  <a href="CODE_OF_CONDUCT.md">📜 Code of Conduct</a>
</p>

</div>

---

> [!CAUTION]
> **Do not file public issues for security vulnerabilities.** Email the maintainers privately as described below.

## 📡 Reporting a vulnerability

1. Email **security@how2ai.agency** with `[SECURITY] MusicVerse AI` in the subject.
2. Include: a description, reproduction steps, impact, suggested mitigation, and your contact info.
3. We acknowledge within **72 hours** and aim to patch critical issues within **14 days**.

We accept [GitHub private vulnerability reports](https://github.com/HOW2AI-AGENCY/aimusicverse/security/advisories/new) as an alternative channel.

## 🎯 Supported versions

| Version | Supported |
| --- | :---: |
| `main` (latest) | ✅ |
| Tagged release ≤ 6 months old | ✅ |
| Older releases | ❌ |

## 🛡 Scope

In scope:
- Code in this repository.
- Edge Functions under `supabase/functions/`.
- Telegram Mini App surface.

Out of scope:
- Third-party services (Suno, Klang.io, Telegram).
- Social-engineering attempts.
- Vulnerabilities requiring physical access.

## 🧪 Hardening checklist (for contributors)

- [ ] RLS policies on every public-schema table.
- [ ] `GRANT` statements in the same migration as `CREATE TABLE`.
- [ ] No secrets in client-side code or `VITE_*` env vars.
- [ ] Input validation via Zod on client + Edge Function.
- [ ] User-generated HTML sanitised with DOMPurify.
- [ ] Roles stored in `user_roles` table (never on `profiles`).
- [ ] Destructive actions gated by `isOwnTrack` / `has_role()`.

## 🏅 Recognition

We credit reporters in [`CHANGELOG.md`](CHANGELOG.md) and our security hall of fame (with consent).

---

<div align="center">

### 🔗 Related Documentation

| 📚 Index | 🏛 Architecture | 🤝 Contributing | 📜 CoC | 📝 Changelog |
| :---: | :---: | :---: | :---: | :---: |
| [Index](DOCUMENTATION_INDEX.md) | [Hub](ARCHITECTURE_HUB.md) | [Contributing](CONTRIBUTING.md) | [CoC](CODE_OF_CONDUCT.md) | [Changelog](CHANGELOG.md) |

<sub>Last updated: 2026-06-27</sub>

</div>
