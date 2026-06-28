# Quickstart: Mobile Performance & UX Redesign

**Feature**: 036-mobile-perf-ux-redesign
**Date**: 2026-06-28

## Integration Scenarios

### Scenario 1: Using Design Tokens in a New Component

```tsx
// Import tokens for programmatic access
import { tokens } from '@/lib/design-tokens';

// In JSX — use Tailwind classes (preferred)
<div className="bg-surface-primary text-text-primary p-4 rounded-lg">
  <h2 className="text-xl font-semibold">Title</h2>
  <p className="text-sm text-text-secondary">Description</p>
</div>

// For dynamic values — use CSS custom properties directly
<div style={{ gap: 'var(--spacing-3)' }}>
  {items.map(item => <Card key={item.id} />)}
</div>
```

### Scenario 2: Adding Gesture Support to a Component

```tsx
import { useGestureConfig } from '@/hooks/useGestureConfig';
import { useSwipeable } from '@/hooks/gestures/useSwipeable';

function TrackCard({ track, onNext, onPrev }) {
  const { swipeEnabled, hapticEnabled } = useGestureConfig();
  
  const swipeHandlers = useSwipeable({
    onSwipeLeft: onNext,
    onSwipeRight: onPrev,
    enabled: swipeEnabled,
    haptic: hapticEnabled,
  });

  return (
    <div {...swipeHandlers}>
      {/* card content */}
    </div>
  );
}
```

### Scenario 3: Accessing User Preferences

```tsx
import { usePreferencesStore } from '@/stores/usePreferencesStore';

function SettingsScreen() {
  const { theme, textSize, setTheme, setTextSize } = usePreferencesStore();

  return (
    <div>
      <select value={theme} onChange={e => setTheme(e.target.value)}>
        <option value="auto">Auto</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      
      <select value={textSize} onChange={e => setTextSize(e.target.value)}>
        <option value="small">Small</option>
        <option value="medium">Medium</option>
        <option value="large">Large</option>
      </select>
    </div>
  );
}
```

### Scenario 4: Applying Minimalist Screen Template

```tsx
// Follow "one action per screen" principle
function NewScreen() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header: title + back button */}
      <MobileHeaderBar title="Screen Title" showBack />
      
      {/* Content: scrollable, padded */}
      <main className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* ≤7 visual elements (Miller's Law) */}
        <SectionHeading>Primary Content</SectionHeading>
        <ContentList />
      </main>
      
      {/* Footer: single CTA */}
      <div className="safe-bottom px-4 py-3">
        <GlowButton className="w-full">Primary Action</GlowButton>
      </div>
    </div>
  );
}
```

### Scenario 5: Performance Monitoring During Development

```bash
# Check bundle size (must pass ≤950KB, target ≤880KB)
npm run size

# Detailed analysis — find what's taking space
npm run size:why

# Run Lighthouse on dev build
npx lighthouse http://localhost:8080 --preset=perf --chrome-flags="--headless" --output=json

# Check for oversized files
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -rn | head -40
```

## Quick Reference

| What | Where |
| ---- | ----- |
| Design tokens (CSS) | `src/styles/tokens.css` |
| Design tokens (TS) | `src/lib/design-tokens.ts` |
| Gesture config store | `src/stores/usePreferencesStore.ts` |
| Gesture hook | `src/hooks/useGestureConfig.ts` |
| Preferences store | `src/stores/usePreferencesStore.ts` |
| Performance budget | `package.json` → `size-limit` |
| Existing motion wrapper | `src/lib/motion.ts` |
| Existing gesture hints | `src/components/mobile/PlayerGestureHints.tsx` |
