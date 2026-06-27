<div align="center">

# 🪲 Known Issues

**Tracked bugs, regressions, and platform quirks — with current status and mitigations.**

<p>
  <img alt="Open" src="https://img.shields.io/badge/open-3-F59E0B?style=for-the-badge"/>
  <img alt="Watch" src="https://img.shields.io/badge/watchlist-2-26A5E4?style=for-the-badge"/>
  <img alt="Resolved (30d)" src="https://img.shields.io/badge/resolved_30d-7-10B981?style=for-the-badge"/>
</p>

<p>
  <a href="README.md">🏠 Home</a> ·
  <a href="DOCUMENTATION_INDEX.md">📚 Docs</a> ·
  <a href="CHANGELOG.md">📝 Changelog</a> ·
  <a href="PROJECT_STATUS.md">📊 Status</a>
</p>

</div>

---

> [!NOTE]
> File a new issue via the [bug-report template](https://github.com/HOW2AI-AGENCY/aimusicverse/issues/new?template=bug_report.md). For security issues, see [`SECURITY.md`](SECURITY.md).

## 🚦 Open

| # | Area | Issue | Severity | Mitigation |
| :---: | --- | --- | :---: | --- |
| 1 | iOS Safari | Audio element pool can hit 9/10 in long sessions | 🟡 Medium | Force-release inactive players in `audioElementPool` |
| 2 | Suno API | 429 rate-limits during peak hours | 🟡 Medium | Exponential back-off + queue UI in form |
| 3 | Studio mobile | Section replacement preview stutters on low-end Android | 🟢 Low | Reduce timeline render frequency in dev branch |

## 👀 Watchlist

| Area | Symptom | Trigger |
| --- | --- | --- |
| Telegram WebView | Keyboard height jump on iOS 17.4 | Long lyrics editing |
| Wavesurfer 7.8 | Memory growth after 50+ track switches | Library auto-play |

## ✅ Recently resolved (30 days)

| Issue | Fix | Released |
| --- | --- | --- |
| Auto-open "Стемы готовы" modal | Removed auto-trigger in `SmartAlertProvider` | 2026-06-27 |
| Dev-overlay intercepting taps on mobile | `pointer-events: none` when hidden | 2026-06-22 |
| Hotkey `Cmd+Shift+M` firing during IME | Guard via `isComposing` | 2026-06-22 |
| Dialog stacking under fixed overlays | Portal to `document.body` + z-index normalisation | 2026-06-20 |
| Mobile tap ghosting on Generate button | Pointer-events + actionable wait | 2026-06-18 |
| Bundle drift > 950 KB | Code-split + tree-shaken motion | 2026-06-12 |
| Realtime channel leak in `useStems` | `removeChannel` on unmount | 2026-06-10 |

---

## 🧰 Triage rubric

| Severity | Definition | Response SLA |
| :---: | --- | :---: |
| 🔴 Critical | Crash, data loss, payment failure | 24 h |
| 🟠 High | Core flow broken (generate/play/save) | 72 h |
| 🟡 Medium | Functional but degraded UX | 1 sprint |
| 🟢 Low | Cosmetic / edge case | Backlog |

---

<div align="center">

### 🔗 Related Documentation

| 📚 Index | 🗺 Roadmap | 📝 Changelog | 📊 Status | 🤝 Contributing |
| :---: | :---: | :---: | :---: | :---: |
| [Index](DOCUMENTATION_INDEX.md) | [Roadmap](ROADMAP.md) | [Changelog](CHANGELOG.md) | [Status](PROJECT_STATUS.md) | [Contributing](CONTRIBUTING.md) |

<sub>Last updated: 2026-06-27</sub>

</div>
