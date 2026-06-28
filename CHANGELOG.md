<div align="center">

# 📝 Changelog

**All notable changes to MusicVerse AI are documented in this file.**

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<p>
  <img alt="Format" src="https://img.shields.io/badge/Keep_a_Changelog-1.1-9333EA?style=for-the-badge"/>
  <img alt="SemVer" src="https://img.shields.io/badge/SemVer-2.0-26A5E4?style=for-the-badge"/>
</p>

<p>
  <a href="README.md">🏠 Home</a> ·
  <a href="DOCUMENTATION_INDEX.md">📚 Docs</a> ·
  <a href="ROADMAP.md">🗺 Roadmap</a> ·
  <a href="PROJECT_STATUS.md">📊 Status</a>
</p>

</div>

---

## [Unreleased]

### ✨ Sprint 033 — Interface Audit & UX Overhaul

#### Added

- **Studio Lite/Pro mode** — toggle in StudioShellHeader to hide advanced features (stems, MIDI, arrangement) for beginners. Persisted to localStorage via ViewStore.
- **Timestamped comments** — SoundCloud-style timecoded comments. Users can attach playback timestamp to comments. Timestamp badges shown inline in CommentItem.
- **Like burst particles** — 6-particle radial burst animation on QuickLikeButton when liking a track.
- **Pull-to-refresh pulse ring** — pulsing ring indicator when pull-to-refresh threshold is reached.
- **Monetization throttling** — UpsellStrategy service limits proactive banners to 1/session and paywalls to 5-min cooldown. Integrated into ProactiveUpsellBanner and SmartPaywallDialog.

#### Changed

- **Generation wizard 6→4 steps** — merged Style+Settings into StyleSettingsStep, Vocals+Lyrics into VocalsLyricsStep. New store type `WizardStep`.
- **Dialog → BottomSheet on mobile** — `mobileSheet` default changed from `false` to `true` in DialogContent. All 56+ dialogs auto-render as vaul Drawer on mobile (<640px).
- **Library filters inline** — removed LibraryFilterModal on mobile, replaced with inline sort dropdown in CompactFilterBar.
- **BottomNavigation** — icons increased to 20px, labels to 11px for better readability.
- **Onboarding simplified** — removed 10-step Onboarding page, QuickStartOverlay (3 steps) handles onboarding. Route redirects to `/`.

#### Fixed

- Touch targets < 44px in QuickLikeButton, PaymentButton, LyricsVisualEditor, AudioActionDialog, SmartPromptSuggestions.
- ARIA labels added to navigation components (MenuSearch, QuickActionsBar, MoreMenuSheet).
- `console.log` replaced with `logger` in SortableTrackList.
- commitlint config renamed to `.cjs` for ESM compatibility, resolved header-case vs subject-case rule conflict.

### 📚 Documentation

- **Repository-wide docs redesign** — unified header/footer/badges templates, mermaid diagrams, role-based onboarding map in `DOCUMENTATION_INDEX`.
- Archived 9 duplicate documents under `docs/archive/2026-06-27/`.
- New audit report: `docs/_audit/REPO_DOCS_AUDIT_2026-06-27.md`.

### ✅ Added

- Dev-overlay IME guard, force-visible safety net, orientation E2E coverage.
- CI split into `e2e` + `e2e-mobile` jobs with retries.

### 🛠 Changed

- `SmartAlertProvider` no longer auto-opens the "Стемы готовы" modal.

---

## [1.30.0] — 2026-06-15 — _Sprint 030: Unified Studio Mobile_

### Added

- Mobile DAW-style single-window layout.
- Stems sheet with mixer parity.
- Section-replacement UX in mobile.

### Fixed

- z-index stacking for portaled dialogs over fixed overlays.
- Generation form modal taps on mobile.

## [1.29.0] — 2026-05-22

### Added

- Voice Cloning Studio (6-step flow).
- Suno `upload-extend` & `upload-cover` endpoints.

### Performance

- Bundle: 1.02 MB → 918 KB.

## [1.28.0] — 2026-04-10

### Added

- Stem separation (4 stems) with full mixer.
- MIDI transcription (6 AI models).

### Security

- `has_role()` security-definer pattern across admin routes.

## [1.27.0] — 2026-03-04

### Added

- A/B versioning for tracks (`is_primary` + `active_version_id`).
- Optimistic UI for likes/plays/version switch.

## [1.26.0] — 2026-02-08

### Added

- Telegram Stars payments + tiered subscriptions.
- Gamification: streaks, XP, 20+ achievements.

## [1.25.0] — 2026-01-12

### Added

- Initial Telegram Mini App release on production domain.

---

> [!TIP]
> For sprint-level detail see [`SPRINTS/`](SPRINTS/). For per-feature history see the relevant doc in [`docs/`](docs/).

---

<div align="center">

### 🔗 Related Documentation

|            📚 Index             |      🗺 Roadmap       |          📊 Status          |             🪲 Issues             |         🤝 Contributing         |
| :-----------------------------: | :-------------------: | :-------------------------: | :-------------------------------: | :-----------------------------: |
| [Index](DOCUMENTATION_INDEX.md) | [Roadmap](ROADMAP.md) | [Status](PROJECT_STATUS.md) | [Issues](KNOWN_ISSUES_TRACKED.md) | [Contributing](CONTRIBUTING.md) |

<sub>Last updated: 2026-06-27</sub>

</div>
