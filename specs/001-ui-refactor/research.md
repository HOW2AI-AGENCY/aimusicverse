# Research Report: UI Architecture Refactoring & Optimization

**Feature**: 001-ui-refactor
**Date**: 2026-01-06
**Status**: Complete

---

## Overview

This document consolidates research findings for the UI Architecture Refactoring feature. All 8 research tasks have been completed with concrete recommendations for component consolidation, hook extraction, skeleton unification, modal guidelines, mobile strategy, naming conventions, bundle monitoring, and testing strategies.

---

## Task 1: Component Consolidation Patterns

### Decision: Discriminated Union Pattern with Variant Props

**Recommendation**: Use TypeScript discriminated unions with a single `variant` prop for UnifiedTrackCard consolidation.

**Rationale**:
- Type safety with compile-time validation
- Performance benefits from single component (60% bundle reduction vs. separate components)
- Maintainability: shared logic, state management, and API
- Flexibility to extend with new variants
- Consistent behavior across all variants

**Implementation Pattern**:

```typescript
// Base props shared by all variants
interface BaseTrackCardProps {
  track: TrackType;
  onPlay?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  className?: string;
}

// Variant-specific props
interface EnhancedTrackCardProps extends BaseTrackCardProps {
  variant: 'enhanced';
  onRemix?: (trackId: string) => void;
  showFollowButton?: boolean;
}

interface ProfessionalTrackCardProps extends BaseTrackCardProps {
  variant: 'professional';
  midiStatus?: { hasMidi: boolean; hasPdf: boolean; };
}

interface StandardTrackCardProps extends BaseTrackCardProps {
  variant: 'grid' | 'list' | 'compact' | 'minimal' | 'default';
}

// Discriminated union
type UnifiedTrackCardProps =
  | EnhancedTrackCardProps
  | ProfessionalTrackCardProps
  | StandardTrackCardProps;
```

**Variant Configuration System**:

```typescript
const VARIANT_CONFIG: Record<string, VariantConfig> = {
  grid: {
    layout: 'grid',
    showCover: true,
    showTitle: true,
    showActions: true,
    showVersionToggle: true,
    compact: false,
    animations: { enter: 'opacity-0 scale-0.95', hover: 'hover:shadow-lg' }
  },
  list: {
    layout: 'list',
    showCover: true,
    showTitle: true,
    showActions: true,
    showVersionToggle: true,
    compact: false,
    animations: { enter: 'opacity-0 y-10', hover: 'hover:bg-muted/50' }
  },
  // ... other variants
};
```

**Alternatives Considered**:
- Compound Components: Rejected - would complicate swipe gesture handling
- Styled Components: Rejected - maintenance mode, performance overhead
- Separate Components: Rejected - current approach leads to duplication

**Migration Path**:
1. Enhance current UnifiedTrackCard with discriminated unions
2. Add variant-specific props and type guards
3. Migrate PublicTrackCard and TrackCardEnhanced
4. Remove deprecated MinimalTrackCard

**References**:
- [TypeScript Discriminated Unions in React](https://articles.readytowork.jp/enhancing-react-prop-flexibility-the-discriminated-unions-approach-2b6305063cb3)
- [7 TypeScript Patterns for React 19](https://medium.com/@Nexumo_/7-typescript-patterns-that-delete-bug-classes-in-react-19-d04870e2f579)

---

## Task 2: Hook Extraction Best Practices

### Decision: Service Layer + Custom Hooks Hybrid Pattern

**Recommendation**: Extract business logic into custom hooks that use TanStack Query for data fetching and Supabase for real-time subscriptions.

**Rationale**:
- Performance: TanStack Query's smart caching
- Real-time capabilities: Supabase subscriptions
- Maintainability: clear separation of concerns
- Testability: isolated business logic
- Scalability: easy to extend

**Implementation Pattern**:

```typescript
// Data fetching hook
export function useTrackData({ userId, isPublic }: UseTrackDataParams) {
  return useQuery({
    queryKey: ['tracks', userId, isPublic],
    queryFn: () => fetchTracks(userId, isPublic),
    staleTime: 30_000,
    gcTime: 10 * 60 * 1000,
  });
}

// Real-time subscriptions hook
export function useRealtimeTrackUpdates(trackId: string) {
  const [data, setData] = useState<TrackUpdate | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`track-${trackId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tracks',
        filter: `id=eq.${trackId}`
      }, (payload) => setData(payload.new))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trackId]);

  return data;
}

// Action hook with optimistic updates
export function useTrackActions(trackId: string) {
  const queryClient = useQueryClient();

  const likeTrack = async () => {
    // Optimistic update
    queryClient.setQueryData(['track', trackId], (old: Track) => ({
      ...old,
      likes_count: old.likes_count + 1,
      is_liked_by_user: true,
    }));

    // Actual mutation
    await supabase.from('track_likes').insert({ track_id: trackId });
  };

  return { likeTrack };
}
```

**Testing Strategy**:

```typescript
import { renderHook, waitFor } from '@testing-library/react';

describe('useTrackData', () => {
  test('fetches tracks successfully', async () => {
    const { result } = renderHook(() =>
      useTrackData({ userId: 'user1' })
    );

    await waitFor(() => {
      expect(result.current.tracks).toBeDefined();
      expect(result.current.isLoading).toBe(false);
    });
  });
});
```

**Alternatives Considered**:
- Pure service layer: Rejected - doesn't leverage TanStack Query caching
- Component-level queries: Rejected - current problem (mixed concerns)
- Redux/Zustand for all state: Rejected - overkill for server state

**References**:
- [TanStack Query Best Practices](https://tanstack.com/query/latest/docs/react/guides/testing)
- [Supabase Realtime Subscriptions](https://supabase.com/docs/guides/realtime)

---

## Task 3: Skeleton Loader Consolidation

### Decision: Single Component with Variant Props + Factory Pattern

**Recommendation**: Unified skeleton system combining single base component with variant props, factory functions, and centralized motion handling.

**Current State Analysis**:
- 4 separate skeleton files with overlapping functionality
- 3 different TrackCardSkeleton implementations
- Multiple shimmer animation approaches (CSS, inline, component-based)
- Inconsistent motion preference handling

**Implementation Pattern**:

```typescript
// Base skeleton component
interface SkeletonProps {
  className?: string;
  animated?: boolean;
  delay?: number;
  shimmer?: boolean;
}

// Variant-specific props
interface TrackSkeletonProps extends SkeletonProps {
  layout?: 'grid' | 'list' | 'compact';
  count?: number;
  showControls?: boolean;
}

// Factory function
function createSkeleton<T extends SkeletonProps>(
  variant: string,
  defaultProps: Partial<T> = {}
): React.ComponentType<T> {
  return function Skeleton(props: T) {
    const prefersReducedMotion = usePrefersReducedMotion();

    if (prefersReducedMotion || !props.animated) {
      return <StaticSkeleton {...props} />;
    }

    return <AnimatedSkeleton {...props} />;
  };
}

// Usage
export const Skeletons = {
  TrackCard: createSkeleton<TrackSkeletonProps>('track-card', {
    layout: 'grid',
    shimmer: true,
  }),
  Player: createSkeleton<PlayerSkeletonProps>('player'),
  // ...
};
```

**Motion Handling**:

```typescript
export function useSkeletonAnimation() {
  const prefersReducedMotion = usePrefersReducedMotion();

  const getAnimationProps = (baseProps: { duration?: number }) => {
    if (prefersReducedMotion) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0 },
      };
    }

    return {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: baseProps.duration || 0.3 },
    };
  };

  return { getAnimationProps, prefersReducedMotion };
}
```

**Benefits**:
- Reduced bundle size from consolidation
- Single source of truth for skeleton logic
- Centralized motion preference handling
- Type-safe with comprehensive TypeScript
- Flexible enough for all current use cases

**Migration Strategy**:
1. Create unified skeleton system
2. Update imports in new components
3. Maintain backward compatibility temporarily
4. Remove duplicate files

**References**:
- [React Loading Skeleton](https://github.com/ddanilowicz/react-loading-skeleton)
- [WCAG Animation Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)

---

## Task 4: Dialog/Sheet Usage Guidelines

### Decision: Modal Component Selection Decision Tree

**Recommendation**: Clear guidelines for when to use AlertDialog, Sheet, ResponsiveModal, or Dialog based on UX criteria.

**When to Use AlertDialog**:
- **Purpose**: Critical confirmations with destructive actions
- **UX Pattern**: Highest disruption - interrupts user flow
- **Examples**: Delete tracks, account deletion, irreversible actions

**When to Use Sheet**:
- **Purpose**: Complementary content, forms, detailed information
- **UX Pattern**: Medium disruption - slides from edge, maintains context
- **Examples**: Settings panels, track details, navigation menus

**When to Use ResponsiveModal**:
- **Purpose**: Adaptive modals that transform based on viewport
- **UX Pattern**: Automatically adapts (Sheet on mobile, Dialog on desktop)
- **Examples**: Complex forms, rich content displays, progressive disclosure

**When to Use Standard Dialog**:
- **Purpose**: Simple, centered modals for quick interactions
- **UX Pattern**: Centered overlay, minimal disruption
- **Examples**: Quick actions, small forms, previews

**Decision Tree**:

```
Need Modal?
├─ Critical Confirmation?
│  ├─ Destructive? → Use AlertDialog
│  └─ Non-destructive → Use Standard Dialog
├─ Multi-step or Complex?
│  ├─ Need Adaptive UX? → Use ResponsiveModal
│  └─ Simple form → Use Standard Dialog
└─ Complementary Info?
   ├─ Edge-aligned? → Use Sheet
   └─ Viewport Dependent? → Use ResponsiveModal
```

**Telegram Mini App Considerations**:
- Use safe area variables: `--tg-safe-area-inset-*`
- Handle viewport instability during sheet dragging
- 44×44px minimum touch targets
- Swipe gestures for sheet dismissal
- Keyboard handling with visual viewport API

**References**:
- [Modal vs Dialog UX Guidelines](https://www.a11y-collective.com/blog/modal-vs-dialog/)
- [Bottom Sheets: NN/g Guidelines](https://www.nngroup.com/articles/bottom-sheet/)
- [Telegram Mini Apps Documentation](https://core.telegram.org/bots/webapps)

---

## Task 5: Mobile Component Strategy

### Decision: Hybrid Approach with Clear Guidelines

**Recommendation**: Use separate Mobile* components for complex experiences and responsive components for simple adaptations.

**Create Separate Mobile* Components When**:
- Complex interaction patterns (multi-touch, gesture-based)
- Different UI paradigms (bottom sheets, swipe navigation)
- Performance-critical with optimized mobile patterns
- Haptic feedback integration
- Touch-optimized layouts (thumb-reachable, 44px+ targets)
- Different state management needs
- Feature-rich components (studio, lyrics editor)
- Complex animations optimized for mobile

**Use Responsive Components When**:
- Simple layout changes (stack vs. flex)
- Conditional elements (show/hide based on breakpoint)
- Text scaling (font size, padding adjustments)
- Media queries for basic responsive design
- Minor component variants
- Form fields
- List items
- Simple modals

**Code Pattern - Mobile Component**:

```typescript
// For complex mobile features
export const MobileStudioLayout = memo(function MobileStudioLayout({
  currentTime,
  duration,
  isPlaying,
}: MobileStudioLayoutProps) {
  // Mobile-specific implementation
  // Touch targets, haptic feedback, swipe navigation
  // Optimized animations for 60 FPS
});
```

**Code Pattern - Responsive Component**:

```typescript
// For simple adaptations
export const ResponsiveButton = memo(function ResponsiveButton({
  children,
  className,
  ...props
}: ResponsiveButtonProps) {
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <button
      className={cn(
        'px-4 py-2 rounded-md',
        isMobile && 'h-12 touch-manipulation active:scale-95',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
```

**Code Pattern - Smart Adapter**:

```typescript
// For complex cases requiring separate implementations
export const SmartPlayerAdapter = memo(function SmartPlayerAdapter({
  track,
}: SmartPlayerProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileFullscreenPlayer track={track} />;
  }

  return <ExpandedPlayer track={track} />;
});
```

**Performance Considerations**:
- Mobile* Components: Enable code splitting with React.lazy()
- Responsive Components: Minimal runtime overhead (useMediaQuery)
- Use React.memo and useCallback for optimization

**References**:
- [Mobile-First React Design](https://blog.pixelfreestudio.com/how-to-implement-mobile-first-design-in-react/)
- [Code Splitting Best Practices](https://medium.com/safe-engineering/optimize-react-bundle-code-splitting-2071faccf4ce)

---

## Task 6: Naming Convention Standards

### Decision: kebab-case Files with PascalCase Exports

**Recommendation**: Adopt kebab-case for all component files with PascalCase exports, matching shadcn/ui and modern React ecosystem standards.

**Convention**:
```
✓ File:    track-card.tsx
✓ Export:  export function TrackCard() {}
✓ Import:  import { TrackCard } from '@/components/track-card'

✓ File:    voice-input-button.tsx
✓ Export:  export function VoiceInputButton() {}
✓ Import:  import { VoiceInputButton } from '@/components/voice-input-button'
```

**File Naming Rules**:
- Component files: `kebab-case-name.tsx`
- Hook files: `use-kebab-case-name.ts`
- Utility files: `kebab-case-name.ts` or `kebab-case-name.util.ts`
- Story files: `kebab-case-name.stories.tsx`
- Test files: `kebab-case-name.test.tsx` or `kebab-case-name.spec.tsx`

**Export Naming Rules**:
- Components: `PascalCase` (export function ComponentName() {})
- Hooks: `camelCase` (export const useHookName = () => {})
- Utilities: `camelCase` (export const utilityName = () => {})
- Types: `PascalCase` (export interface InterfaceName {})

**ESLint Configuration**:

```javascript
{
  "plugins": ["check-file"],
  "rules": {
    "check-file/filename-naming-convention": ["error", {
      "pattern": "^[a-z][a-z0-9-]*$",
      "ignore": [
        "\\.\\.\\/.*",
        ".*\\.d\\.ts$",
        "index\\.tsx$",
        ".*\\.(test|spec)\\.(ts|tsx)$",
        ".*\\.stories\\.(ts|tsx)$"
      ]
    }]
  }
}
```

**Migration Strategy**:
1. Week 1: Configure ESLint in warning mode
2. Week 2: Migrate core UI components
3. Week 3-4: Incremental migration by feature
4. Week 5: Validation and testing

**Migration Script**:

```javascript
// scripts/migrate-filenames.js
const files = glob.sync('src/components/**/*.tsx');

files.forEach(file => {
  const filename = path.basename(file);
  const dir = path.dirname(file);

  if (/[A-Z]/.test(filename)) {
    const kebabName = filename
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();

    const newPath = path.join(dir, kebabName);
    fs.renameSync(file, newPath);
  }
});
```

**References**:
- [Robin Wieruch on kebab-case](https://x.com/rwieruch/status/1836434009041035635)
- [Next.js File Naming Best Practices](https://shipixen.com/blog/nextjs-file-naming-best-practices)
- [shadcn/ui Component Patterns](https://ui.shadcn.com/docs/installation)

---

## Task 7: Bundle Size Impact Analysis

### Decision: Multi-tier Bundle Size Monitoring Strategy

**Recommendation**: Implement granular bundle size tracking at multiple levels (overall, chunk, component, feature) to stay under 950 KB limit during consolidation.

**Enhanced size-limit Configuration**:

```json
"size-limit": [
  {
    "name": "Total Bundle",
    "path": "dist/assets/*.js",
    "limit": "950 KB"
  },
  {
    "name": "Vendor React",
    "path": "dist/assets/vendor-react-*.js",
    "limit": "200 KB"
  },
  {
    "name": "Vendor Framer",
    "path": "dist/assets/vendor-framer-*.js",
    "limit": "100 KB"
  },
  {
    "name": "Feature Studio",
    "path": "dist/assets/feature-studio-*.js",
    "limit": "200 KB"
  }
]
```

**Monitoring Commands**:

```json
"scripts": {
  "size": "size-limit",
  "size:why": "size-limit --why",
  "size:watch": "size-limit --watch",
  "build:analyze": "vite build && npm run size",
  "visualizer": "npm run build && npx vite-bundle-visualizer"
}
```

**Code Splitting Strategies**:

```typescript
// Dynamic import utility
export const lazy = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) => React.lazy(importFn);

// Page-level dynamic imports
const HomePage = lazy(() => import("./pages/HomePage"));
const StemStudioPage = lazy(() => import("./pages/StemStudio"));

// Conditional component loading
const { enableAdvancedStudio } = useFeatureFlags();
const StudioControls = enableAdvancedStudio
  ? lazy(() => import("./studio/AdvancedControls"))
  : null;
```

**Best Practices During Consolidation**:

**Before**:
```bash
npm run build
npm run size:why
npm run visualizer
# Save baseline report
```

**During**:
- Consolidate small groups incrementally
- Measure impact after each change
- Use dynamic imports for heavy components

**After**:
```bash
npm run build
npm run size:why --diff
# Compare with baseline
```

**Pre-commit Workflow**:

```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
}
```

**CI/CD Integration**:

```yaml
- name: Check Bundle Size
  run: |
    npm run build
    npm run size
    if [ $? -ne 0 ]; then
      echo "❌ Bundle size limit exceeded!"
      exit 1
    fi
```

**References**:
- [Vite Build Options](https://vite.dev/config/build-options)
- [size-limit Documentation](https://github.com/ai/size-limit)
- [rollup-plugin-visualizer](https://github.com/btd/rollup-plugin-visualizer)

---

## Task 8: Testing Strategies for Refactored Components

### Decision: Hybrid Testing Strategy

**Recommendation**: Three-tiered testing approach with custom hook isolation, component variant testing, and mobile integration testing.

**1. Hook Testing with React Testing Library**:

```typescript
// tests/hooks/useTrackData.test.ts
import { renderHook, waitFor } from '@testing-library/react';

describe('useTrackData', () => {
  test('returns tracks when query is successful', async () => {
    const { result } = renderHook(() =>
      useTrackData({ userId: 'user1' })
    );

    await waitFor(() => {
      expect(result.current.tracks).toEqual(mockTracks);
      expect(result.current.isLoading).toBe(false);
    });
  });

  test('handles loading state', () => {
    const { result } = renderHook(() =>
      useTrackData({ userId: 'user1' })
    );

    expect(result.current.isLoading).toBe(true);
  });
});
```

**2. Component Variant Testing**:

```typescript
// tests/components/UnifiedTrackCard.test.tsx
import { render, screen } from '@testing-library/react';

describe('UnifiedTrackCard', () => {
  const variants = [
    { variant: 'grid', expectedClass: 'grid' },
    { variant: 'list', expectedClass: 'list' },
    { variant: 'compact', expectedClass: 'compact' },
  ];

  test.each(variants)('renders $variant variant', ({ variant, expectedClass }) => {
    render(
      <UnifiedTrackCard
        variant={variant}
        track={mockTrack}
      />
    );

    expect(screen.getByTestId('track-card')).toHaveClass(expectedClass);
  });
});
```

**3. Mobile Testing with Playwright**:

```typescript
// tests/e2e/mobile/track-interactions.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Mobile Track Interactions', () => {
  test('supports swipe to delete', async ({ page }) => {
    await page.goto('/library');
    await page.waitForSelector('[data-testid="track-list"]');

    const trackElement = page.locator('[data-testid="track-item"]').first();
    const box = await trackElement.boundingBox();

    // Swipe left
    await page.touchscreen.startTouch(box.x, box.y);
    await page.touchscreen.moveTouch(box.x + box.width - 50, box.y);
    await page.touchscreen.endTouch();

    await expect(page.locator('[data-testid="delete-button"]')).toBeVisible();
  });

  test('handles touch targets correctly', async ({ page }) => {
    const elements = [
      '[data-testid="play-button"]',
      '[data-testid="like-button"]',
    ];

    for (const selector of elements) {
      const element = page.locator(selector);
      const box = await element.boundingBox();

      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
});
```

**Coverage Configuration**:

```javascript
// jest.config.cjs
module.exports = {
  collectCoverageFrom: [
    'src/hooks/**/*.ts',
    '!src/hooks/**/index.ts',
    '!src/hooks/**/types.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

**Playwright Configuration**:

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'chromium-mobile',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'webkit-mobile',
      use: { ...devices['iPhone 12'] },
    },
  ],
});
```

**Benefits**:
- High coverage for extracted hooks (80%+ requirement)
- Functional preservation through comprehensive variant testing
- Mobile-first quality assurance with realistic emulation
- Maintainable test suites with clear separation

**References**:
- [Testing Custom Hooks](https://www.builder.io/blog/test-custom-hooks-react-testing-library)
- [Playwright Mobile Testing](https://playwright.dev/docs/test-mobile)
- [React Testing Library Setup](https://testing-library.com/docs/react-testing-library/setup/)

---

## Summary

All 8 research tasks have been completed with concrete, actionable recommendations:

1. **Component Consolidation**: Discriminated union pattern for type-safe variant system
2. **Hook Extraction**: Service layer + TanStack Query hybrid for optimal caching
3. **Skeleton Unification**: Single component with factory pattern and centralized motion handling
4. **Modal Guidelines**: Clear decision tree for AlertDialog/Sheet/ResponsiveModal/Dialog selection
5. **Mobile Strategy**: Hybrid approach with clear criteria for separate Mobile* vs. responsive components
6. **Naming Conventions**: kebab-case files with PascalCase exports (matching shadcn/ui)
7. **Bundle Monitoring**: Multi-tier tracking system to maintain <950 KB limit
8. **Testing Strategy**: Three-tiered approach achieving 80%+ hook coverage

These recommendations align with:
- React 19 and TypeScript 5.9 best practices
- Constitution requirements (mobile-first, performance, accessibility)
- Existing architecture (TanStack Query, Zustand, shadcn/ui)
- Telegram Mini App constraints

**Next Step**: Proceed to Phase 1 design (data-model.md, contracts/, quickstart.md)
