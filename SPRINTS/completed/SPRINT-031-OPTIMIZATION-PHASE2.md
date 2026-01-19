# Sprint 031: Optimization Phase 2 & Integration

**Status**: 🔄 In Progress
**Start Date**: 2026-01-07
**Target**: Performance optimization completion and component integration

---

## 📋 Sprint Overview

Continue the studio optimization work started in Sprint 030, focusing on:
1. Integration of optimized components into existing codebase
2. Store unification and state management improvements
3. Additional component optimizations
4. Testing and performance validation

---

## ✅ Completed Tasks

### Phase 1: Component Integration (2026-01-07)

| Task | Status | Notes |
|------|--------|-------|
| Replace MixerChannel → OptimizedMixerChannel in MobileMixerContent | ✅ Done | Dual API support added |
| Replace inline transport → OptimizedTransport in StudioShell | ✅ Done | Compact mode |
| Update OptimizedMixerChannel with dual API | ✅ Done | Supports both legacy and new callback signatures |
| Export all optimized components via barrel files | ✅ Done | index.ts updated |

---

## 📝 Remaining Tasks

### Phase 2: Store Unification (Priority: P1)

> **Strategy:** Hybrid approach - Zustand for client state (playback, mixer) + TanStack Query for server state (tracks, stems)

| Task | Status | Estimate |
|------|--------|----------|
| Create useUnifiedStudioStore with Zustand slices for client state | ⬜ Todo | 2h |
| Migrate UnifiedStudioContent client state to unified store | ⬜ Todo | 1h |
| Migrate StudioShell client state to unified store | ⬜ Todo | 1h |
| Add selectors for minimized re-renders | ⬜ Todo | 1h |
| Ensure TanStack Query handles server state (tracks, stems) | ⬜ Todo | 30min |
| Update useUnifiedStudio hook | ⬜ Todo | 30min |

### Phase 3: Additional Component Optimizations (Priority: P2)

| Task | Status | Estimate |
|------|--------|----------|
| Create OptimizedLyricsLine | ⬜ Todo | 1h |
| Create OptimizedLyricsPanel with virtualization | ⬜ Todo | 2h |
| Create useLyricsSync hook | ⬜ Todo | 1h |
| Create OptimizedPlaylistItem | ⬜ Todo | 1h |
| Create usePlaylistVirtualization | ⬜ Todo | 1h |

### Phase 4: DAW Timeline Improvements (Priority: P2)

> **Snap-to-Grid Strategy:** Smart fallback - snap to seconds (0.5s/1s) if no BPM, snap to beats if BPM available

| Task | Status | Estimate |
|------|--------|----------|
| Add BPM markers to TimelineRuler with smart snap-to-grid | ⬜ Todo | 1h |
| Implement draggable Playhead with touch gesture support | ⬜ Todo | 2h |
| Improve pinch-zoom performance with RAF throttling | ⬜ Todo | 1h |
| Integrate AIActionsFAB with real AI functions (Generate, Extend, Cover, Add Vocals, Stems) | ⬜ Todo | 2h |
| Add haptic feedback to FAB and playhead interactions | ⬜ Todo | 30min |

### Phase 5: Testing & Validation (Priority: P1)

| Task | Status | Estimate |
|------|--------|----------|
| Performance benchmarks for optimized components | ⬜ Todo | 2h |
| FPS measurement during 1000+ item scroll | ⬜ Todo | 1h |
| Memory profiling with stems | ⬜ Todo | 1h |
| Unit tests for useStudioState | ⬜ Todo | 1h |
| Unit tests for useWaveformCache | ⬜ Todo | 1h |
| Unit tests for useOptimizedPlayback | ⬜ Todo | 1h |

### Phase 6: Cleanup & Documentation (Priority: P3)

| Task | Status | Estimate |
|------|--------|----------|
| Update PERFORMANCE_OPTIMIZATION.md with new metrics (target: mid-range devices) | ⬜ Todo | 30min |
| Add migration guide for legacy components | ⬜ Todo | 30min |
| Update KNOWLEDGE_BASE.md with new hooks | ⬜ Todo | 30min |
| Deprecate MobileStudioLayout and MobileStudioTabs with console warnings (keep for 1 sprint) | ⬜ Todo | 30min |
| Document audio routing TODOs as technical debt, defer to audio-focused sprint | ⬜ Todo | 15min |
| Clean up unused imports | ⬜ Todo | 30min |

---

## 🎯 Sprint Goals

1. **All Optimized components integrated** into production code paths
2. **Store unification** complete with no state duplication
3. **60 FPS scroll** on lists with 1000+ items
4. **Test coverage** ≥80% for new optimization hooks
5. **Bundle size** maintained or reduced

---

## 📊 Metrics to Track

> **Target Device Class:** Mid-range devices (Pixel 5, iPhone 12, Samsung Galaxy S52) - realistic for 80%+ of users

| Metric | Before | Target | Current |
|--------|--------|--------|---------|
| TrackList scroll FPS | ~30 | 60 | TBD |
| Mixer channel re-renders per volume change | ~10 | 1 | TBD |
| Waveform load time (cached) | ~500ms | <50ms | TBD |
| Bundle size (studio) | ~200KB | <180KB | TBD |
| Memory usage (10 stems) | ~150MB | <100MB | TBD |

---

## 🔗 Related Files

### New Optimized Components
- `src/components/studio/unified/OptimizedMixerChannel.tsx`
- `src/components/studio/unified/OptimizedMixerPanel.tsx`
- `src/components/studio/unified/OptimizedTransport.tsx`
- `src/components/studio/unified/OptimizedTrackRow.tsx`
- `src/components/studio/unified/OptimizedStemTrack.tsx`
- `src/components/studio/unified/OptimizedWaveform.tsx`
- `src/components/studio/unified/OptimizedVolumeSlider.tsx`

### New Optimization Hooks
- `src/hooks/studio/useStudioState.ts`
- `src/hooks/studio/useWaveformCache.ts`
- `src/hooks/studio/useOptimizedPlayback.ts`
- `src/hooks/studio/useRenderOptimization.ts`
- `src/hooks/studio/useDebouncedStemControls.ts`

### Updated Files
- `src/components/studio/unified/MobileMixerContent.tsx` - Uses OptimizedMixerChannel
- `src/components/studio/unified/StudioShell.tsx` - Uses OptimizedTransport

---

## 📝 Notes

- `StudioTrackRow` and `StudioMixerPanel` kept for now due to incompatible APIs and richer functionality
- `OptimizedMixerChannel` now supports dual API (legacy callbacks without id, new callbacks with id)
- Focus next on store unification to eliminate state duplication between UnifiedStudioContent and StudioShell

---

## 🔍 Clarifications (Session 2026-01-07)

### Phase 2: Store Unification
- **Q: Should we create a single unified Zustand store or use the existing multi-store pattern with TanStack Query?**
- **A:** Hybrid approach: Zustand for client state (playback, mixer controls) + TanStack Query for server state (tracks, stems, playlists). This maintains separation of concerns and leverages TanStack Query's caching/invalidation benefits while Zustand handles ephemeral UI state.

### Phase 4: DAW Timeline Improvements
- **Q: What should be the target device class for performance metrics?**
- **A:** Mid-range devices (Pixel 5, iPhone 12, Samsung Galaxy S52). This ensures realistic performance targets for 80%+ of users while maintaining good UX/performance balance.

- **Q: How should snap-to-grid behave when BPM is unknown or variable?**
- **A:** Smart fallback: snap to seconds (0.5s or 1s grid) if no BPM available, snap to beats if BPM is present. This provides consistent and predictable UX across all track types.

### Phase 6: Cleanup & Documentation
- **Q: Should we remove legacy components (MobileStudioLayout, MobileStudioTabs) immediately or keep them for backwards compatibility?**
- **A:** Deprecate with console warnings, keep for 1 sprint. This safer approach allows monitoring usage patterns and ensures new components work correctly in production before complete removal.

### Technical Debt (TODO/FIXME)
- **Q: Should we implement audio routing TODOs (effects chain, StereoPannerNode) in this sprint or defer?**
- **A:** Document as technical debt and defer to a dedicated audio-focused sprint. These require deep Web Audio API knowledge and separate testing. Mixing them with UI optimization would delay Sprint 031's primary focus.
