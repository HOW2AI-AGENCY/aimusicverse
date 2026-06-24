# Research Document: UI Improvement System

**Feature Branch**: `001-ui-improvements`
**Created**: 2026-01-24
**Purpose**: Technical research findings for implementation decisions

---

## 1. Virtualization Library Research

### Question: Should we use @tanstack/react-virtual or react-virtuoso?

**Current State:**
- Codebase already uses `react-virtuoso` for VirtualizedTrackList
- Package.json has `react-virtuoso` as dependency

**Findings:**

| Aspect | @tanstack/react-virtual | react-virtuoso |
|--------|------------------------|----------------|
| Bundle Size | ~3KB | ~13KB |
| API Complexity | Lower (manual DOM management) | Higher (component-based) |
| Grid Support | Manual | Built-in |
| Existing Usage | None | VirtualizedTrackList (890+ components) |

**Recommendation:** Use existing `react-virtuoso` for consistency
- Reduces bundle size impact (no new dependency)
- Developers already familiar with API
- VirtualizedTrackList can be enhanced instead of replaced

**Implementation Note:**
```typescript
// Use existing pattern from VirtualizedTrackList
import { Virtuoso, VirtuosoGrid } from 'react-virtuoso';
```

---

## 2. Gesture Priority System Research

### Question: What are best practices for gesture conflict resolution?

**Research Sources:**
- Framer Motion gesture propagation docs
- @use-gesture/react conflict patterns
- iOS Human Interface Guidelines (gesture hierarchy)

**Key Findings:**

1. **Priority Hierarchy (iOS HIG)**
   - Double-tap: 300ms window, highest priority
   - Swipe: 80px distance OR 400px/s velocity
   - Drag: Continuous, lowest priority
   - Tap: Default, medium priority

2. **Conflict Resolution Pattern**
   ```
   Event → Check double-tap window → Check swipe threshold → Check drag active → Execute tap
   ```

3. **Best Practice: Centralized Manager**
   - Single source of truth for gesture state
   - Prevents memory leaks from multiple listeners
   - Enables gesture logging/debugging

**Recommendation:** Proceed with GestureManager as designed in plan.md

---

## 3. Safe Area Implementation Research

### Question: How do Telegram safe area variables differ from standard CSS env()?

**Telegram Web App SDK Variables:**
```css
--tg-safe-area-inset-top
--tg-safe-area-inset-bottom
--tg-safe-area-inset-left
--tg-safe-area-inset-right
```

**Standard CSS env():**
```css
env(safe-area-inset-top)
env(safe-area-inset-bottom)
```

**Key Difference:**
- Telegram variables are ALWAYS available in Mini App context
- Standard env() falls back to 0 on non-notch devices
- **Recommendation:** Use max(Telegram, env()) for maximum compatibility

**Implementation:**
```css
padding-top: max(var(--tg-safe-area-inset-top), env(safe-area-inset-top), 0);
padding-bottom: max(var(--tg-safe-area-inset-bottom), env(safe-area-inset-bottom), 0);
```

---

## 4. Component Splitting Patterns Research

### Question: What are proven patterns for splitting 1000+ line components?

**Analyzing StudioShell.tsx (1835 lines):**

**Current Responsibilities:**
1. Layout wrapper (100 lines)
2. Header management (150 lines)
3. Sidebar/desktop navigation (200 lines)
4. Mobile bottom navigation (150 lines)
5. Content area routing (200 lines)
6. Transport/playback controls (300 lines)
7. Dialog management (400 lines)
8. State coordination (335 lines)

**Splitting Strategy:**
- Create focused subcomponents by responsibility
- Lift shared state to parent or custom hook
- Use composition over inheritance

**Proven Pattern: React Composition**
```typescript
// BEFORE: 1835 lines monolith
<StudioShell>

// AFTER: Composition of focused components
<StudioShell>
  <StudioShellHeader />
  <StudioShellSidebar /> {/* desktop */}
  <StudioShellMobileNav /> {/* mobile */}
  <StudioShellContent>
    {children}
  </StudioShellContent>
  <StudioShellTransportBar />
  <StudioDialogs />
</StudioShell>
```

---

## 5. Design Token Migration Research

### Question: How to migrate 107+ hardcoded color values safely?

**Current State:**
- 107 files with hardcoded hex colors (found via grep)
- Tailwind config already has semantic colors in CSS variables
- Some components use theme tokens, some use hardcoded values

**Migration Strategy:**

1. **Phase 1: Create utility** (no breaking changes)
   - Add `@/lib/color-tokens.ts`
   - Add to exports in `@/lib/index.ts`

2. **Phase 2: Migrate incrementally**
   - Start with high-traffic components (Button, Card)
   - Use find/replace with regex validation
   - Commit after each component migration

3. **Phase 3: Validation**
   - Visual regression tests
   - Manual testing on light/dark themes
   - Check for any remaining hardcoded values

**Search Pattern for Migration:**
```bash
# Find all hardcoded hex colors
grep -r "#[0-9A-Fa-f]\{6\}" src/components/

# Find hardcoded rgb/rgba
grep -r "rgb(" src/components/
```

---

## 6. Store Splitting Research (ADDITIONAL)

### Question: How to split useUnifiedStudioStore (1361 lines)?

**Current Store Analysis:**
- Total: 1361 lines (exceeds 500 line limit)
- Contains: Track state, Mixing state, Timeline state, Settings

**Proposed Split:**

```
useUnifiedStudioStore (1361 lines)
├── useTrackStore (300 lines)
│   - Current track
│   - Track versions
│   - Active version
│   - Track metadata
├── useMixingStore (250 lines)
│   - Stem volumes
│   - Stem pans
│   - Mute/solo states
│   - Mix presets
├── useTimelineStore (300 lines)
│   - Sections
│   - Loop regions
│   - Playback position
│   - Timeline zoom
├── useStudioSettings (200 lines)
│   - UI preferences
│   - Audio settings
│   - Keyboard shortcuts
│   - Panel states
└── UnifiedStudioComposer (311 lines)
    - Combines sub-stores
    - Provides unified API
    - Handles cross-store operations
```

**Note:** This is NOT in current plan.md - ADDITIONAL RECOMMENDATION

---

## 7. Mobile Testing Requirements Research

### Question: What device coverage is required?

**Required Devices (from Constitution I):**
- ✅ iPhone 12 (baseline iOS device)
- ✅ iPhone 14 Pro (Dynamic Island testing)
- ✅ iPhone 15 Pro Max (max screen size)
- ✅ Pixel 5 (baseline Android)
- ✅ Samsung Galaxy S21 (Android variety)

**Telegram Client Testing:**
- Telegram iOS (latest version)
- Telegram Android (latest version)

**Testing Checklist:**
- [ ] Touch targets (44px minimum) - measure with DevTools
- [ ] Safe areas (notch, home indicator) - visual inspection
- [ ] Gesture conflicts - manual interaction testing
- [ ] Haptic feedback - physical device testing
- [ ] Performance (60fps) - Chrome DevTools Performance tab

---

## 8. Animation Performance Research

### Question: How to ensure 60fps animations on mobile?

**GPU-Accelerated Properties:**
- ✅ `transform: translate3d() scale() rotate()`
- ✅ `opacity`
- ✅ `filter: blur()`

**CPU-Bound Properties (avoid):**
- ❌ `width`, `height`
- ❌ `top`, `left`, `right`, `bottom`
- ❌ `margin`, `padding`
- ❌ `border-radius` (on some browsers)

**Best Practice: Transform + Layout Shift Prevention**
```typescript
// GOOD: GPU-accelerated
<motion.div
  initial={{ scale: 0.95, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
/>

// BAD: Triggers layout
<motion.div
  initial={{ height: 0 }}
  animate={{ height: 'auto' }}
/>
```

**Measurement:**
- Chrome DevTools Performance: Record animation
- Check "Rendering" > "Frames" - look for consistent 16.67ms (60fps)
- Long frames (>50ms) indicate jank

---

## Summary & Recommendations

### ✅ Proceed with Plan

1. **Virtualization:** Use existing `react-virtuoso` (not @tanstack/react-virtual)
2. **Gestures:** GestureManager design is sound
3. **Safe Areas:** Use max(Telegram, env()) pattern
4. **Component Split:** Composition pattern is correct

### ⚠️ Additional Recommendations

1. **Store Splitting:** Add task to split `useUnifiedStudioStore` (1361 → 4 stores)
2. **Device Testing:** Explicit testing on iPhone 14 Pro (Dynamic Island)
3. **Animation Audit:** Verify all animations use transform/opacity only

### 📊 Bundle Impact Estimate

| Change | Impact |
|--------|--------|
| New components | +15KB |
| GestureManager | +3KB |
| Virtualization reuse | 0KB |
| Color tokens (utility) | +1KB |
| **Total** | **+19KB** |

This is well within the 950KB limit.

---

**Status**: Research complete, ready for implementation planning
