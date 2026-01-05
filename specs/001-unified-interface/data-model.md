# Unified Component Data Models

**Feature**: Unified Interface Application (`001-unified-interface`)  
**Date**: 2026-01-05  
**Status**: Phase 1 Complete

## Overview

This document defines the data schemas and TypeScript interfaces for all unified components in the MusicVerse AI interface architecture. These models ensure consistency across the 991 components and provide clear contracts for component composition.

---

## Core Entities

### 1. UnifiedComponentSchema

Represents the base schema for all standardized UI components.

```typescript
interface UnifiedComponentSchema {
  /** Component identifier (kebab-case) */
  id: string;
  
  /** Component category */
  category: 'layout' | 'navigation' | 'modal' | 'list' | 'card' | 'form' | 'player' | 'mobile';
  
  /** Component display name */
  name: string;
  
  /** Unification status */
  status: 'unified' | 'partial' | 'legacy';
  
  /** Supported variants */
  variants?: string[];
  
  /** Touch target compliance */
  touchTargetCompliant: boolean;
  
  /** Minimum touch target size (px) */
  minTouchTarget: 44 | 48 | 56;
  
  /** Supports mobile gestures */
  supportsGestures: boolean;
  
  /** Telegram SDK integration */
  telegramIntegration?: {
    usesMainButton?: boolean;
    usesBackButton?: boolean;
    usesHapticFeedback?: boolean;
    usesCloudStorage?: boolean;
  };
  
  /** Accessibility compliance */
  accessibility: {
    ariaLabelsRequired: boolean;
    keyboardNavigable: boolean;
    wcagAACompliant: boolean;
  };
}
```

---

### 2. NavigationContext

Represents the current navigation state and controls which navigation elements are visible.

```typescript
interface NavigationContext {
  /** Current active route */
  currentRoute: string;
  
  /** Navigation history stack */
  history: string[];
  
  /** Bottom navigation visibility */
  showBottomNav: boolean;
  
  /** Header configuration */
  header: {
    /** Show back button */
    showBackButton: boolean;
    
    /** Page title */
    title: string;
    
    /** Title alignment */
    titleAlign: 'left' | 'center';
    
    /** Action buttons (max 2) */
    actions: HeaderAction[];
    
    /** Show search bar */
    showSearch: boolean;
  };
  
  /** Telegram UI elements state */
  telegram: {
    mainButtonVisible: boolean;
    mainButtonText: string;
    mainButtonEnabled: boolean;
    backButtonVisible: boolean;
  };
  
  /** Safe area insets (iOS notch/Dynamic Island) */
  safeArea: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

interface HeaderAction {
  id: string;
  icon: React.ComponentType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}
```

---

### 3. ModalState

Represents the state of currently displayed modals.

```typescript
interface ModalState {
  /** Modal unique identifier */
  id: string;
  
  /** Modal type */
  type: 'bottom-sheet' | 'action-sheet' | 'dialog' | 'drawer';
  
  /** Viewport type (determines which modal component to use) */
  viewport: 'mobile' | 'desktop';
  
  /** Modal content component */
  content: React.ComponentType<any>;
  
  /** Content props */
  contentProps?: Record<string, any>;
  
  /** Dismiss behavior */
  dismissBehavior: {
    /** Allow backdrop tap to dismiss */
    backdropDismiss: boolean;
    
    /** Allow swipe down to dismiss (bottom-sheet only) */
    swipeToDismiss: boolean;
    
    /** Allow escape key to dismiss */
    escapeKeyDismiss: boolean;
  };
  
  /** Snap points for bottom sheet (0.0-1.0 of viewport height) */
  snapPoints?: number[];
  
  /** Initial snap point index */
  initialSnapPoint?: number;
  
  /** Z-index for stacking */
  zIndex: number;
  
  /** Animation state */
  animationState: 'entering' | 'open' | 'exiting' | 'closed';
}
```

---

### 4. VirtualizedContent

Represents large lists/grids that require virtualization.

```typescript
interface VirtualizedContent<T = any> {
  /** Total item count */
  totalCount: number;
  
  /** Items in current page */
  items: T[];
  
  /** Visible range (indices) */
  visibleRange: {
    start: number;
    end: number;
  };
  
  /** Item dimensions */
  itemSize: {
    /** Fixed height (list mode) or estimated height (dynamic) */
    height: number | 'dynamic';
    
    /** Fixed width (grid mode) or fill available space */
    width: number | 'fill';
  };
  
  /** Scroll position (px from top) */
  scrollPosition: number;
  
  /** Loading state */
  loading: boolean;
  
  /** Error state */
  error: Error | null;
  
  /** Cached rendered items (for scroll restoration) */
  cache: Map<string, React.ReactElement>;
  
  /** Infinite scroll configuration */
  infiniteScroll?: {
    enabled: boolean;
    threshold: number;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => void;
  };
  
  /** Pull-to-refresh configuration */
  pullToRefresh?: {
    enabled: boolean;
    isRefreshing: boolean;
    onRefresh: () => Promise<void>;
  };
}
```

---

### 5. FormDraft

Represents auto-saved form data stored in local storage.

```typescript
interface FormDraft {
  /** Form identifier (e.g., 'generate-music', 'create-playlist') */
  formId: string;
  
  /** Form field values */
  values: Record<string, any>;
  
  /** Timestamp of last save (ISO 8601) */
  lastSaved: string;
  
  /** Timestamp when draft expires (30 min from lastSaved) */
  expiresAt: string;
  
  /** Draft version number (for migration compatibility) */
  version: number;
  
  /** User ID who created draft */
  userId: string;
  
  /** Form completion percentage (0-100) */
  completionPercent: number;
  
  /** Fields that have validation errors */
  invalidFields: string[];
}
```

---

### 6. ThemeConfiguration

Represents current theme settings synchronized with Telegram.

```typescript
interface ThemeConfiguration {
  /** Color scheme */
  scheme: 'light' | 'dark';
  
  /** Accent colors from Telegram theme */
  colors: {
    primary: string;
    secondary: string;
    background: string;
    foreground: string;
    accent: string;
    destructive: string;
    border: string;
    input: string;
    ring: string;
  };
  
  /** Contrast level */
  contrastLevel: 'normal' | 'high';
  
  /** Safe area insets (iOS notch/Dynamic Island) */
  safeArea: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  
  /** System UI preferences */
  systemUI: {
    /** User prefers reduced motion */
    prefersReducedMotion: boolean;
    
    /** User prefers high contrast */
    prefersHighContrast: boolean;
    
    /** Device pixel ratio */
    devicePixelRatio: number;
  };
  
  /** Telegram-specific theme parameters */
  telegram: {
    bgColor: string;
    textColor: string;
    hintColor: string;
    linkColor: string;
    buttonColor: string;
    buttonTextColor: string;
  };
}
```

---

### 7. TouchInteraction

Represents touch event configuration for consistent interactions.

```typescript
interface TouchInteraction {
  /** Element reference */
  elementRef: React.RefObject<HTMLElement>;
  
  /** Touch target size (px) */
  touchTarget: {
    width: number;
    height: number;
    minSize: 44 | 48 | 56;
  };
  
  /** Haptic feedback type (Telegram SDK) */
  hapticFeedback: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'error' | 'none';
  
  /** Interaction state */
  state: 'idle' | 'pressed' | 'disabled' | 'loading';
  
  /** Animation configuration */
  animation: {
    /** Scale on press (e.g., 0.95 for slight shrink) */
    pressScale: number;
    
    /** Opacity on press (e.g., 0.7 for slight fade) */
    pressOpacity: number;
    
    /** Spring animation config (Framer Motion) */
    spring: {
      stiffness: number;
      damping: number;
    };
  };
  
  /** Touch event handlers */
  handlers: {
    onTouchStart: (event: TouchEvent) => void;
    onTouchEnd: (event: TouchEvent) => void;
    onTouchCancel: (event: TouchEvent) => void;
  };
  
  /** Accessibility */
  accessibility: {
    role: string;
    ariaLabel: string;
    ariaPressed?: boolean;
    ariaDisabled?: boolean;
  };
}
```

---

## Unified Component Interfaces

### MobileHeaderBar

```typescript
interface MobileHeaderBarProps {
  /** Page title */
  title: string;
  
  /** Title alignment (default: 'center') */
  titleAlign?: 'left' | 'center';
  
  /** Show back button (default: auto-detect from navigation) */
  showBackButton?: boolean;
  
  /** Back button action (default: navigate back) */
  onBackClick?: () => void;
  
  /** Action buttons (max 2, right-aligned) */
  actions?: HeaderAction[];
  
  /** Show search bar */
  showSearch?: boolean;
  
  /** Search placeholder text */
  searchPlaceholder?: string;
  
  /** Search value (controlled) */
  searchValue?: string;
  
  /** Search change handler */
  onSearchChange?: (value: string) => void;
  
  /** Sticky positioning (default: true) */
  sticky?: boolean;
  
  /** Backdrop blur effect (default: true) */
  backdropBlur?: boolean;
  
  /** Custom className */
  className?: string;
}
```

### MobileBottomSheet

```typescript
interface MobileBottomSheetProps {
  /** Sheet open state (controlled) */
  open: boolean;
  
  /** Open state change handler */
  onOpenChange: (open: boolean) => void;
  
  /** Sheet content */
  children: React.ReactNode;
  
  /** Sheet title (optional) */
  title?: string;
  
  /** Sheet description (optional) */
  description?: string;
  
  /** Snap points (0.0-1.0 of viewport height, default: [0.5, 0.9]) */
  snapPoints?: number[];
  
  /** Initial snap point index (default: 0) */
  initialSnapPoint?: number;
  
  /** Allow backdrop tap to dismiss (default: true) */
  backdropDismiss?: boolean;
  
  /** Allow swipe down to dismiss (default: true) */
  swipeToDismiss?: boolean;
  
  /** Show drag handle (default: true) */
  showDragHandle?: boolean;
  
  /** Full screen mode (ignores snap points) */
  fullScreen?: boolean;
  
  /** Custom className */
  className?: string;
  
  /** Close button in header */
  showCloseButton?: boolean;
}
```

### MobileActionSheet

```typescript
interface MobileActionSheetProps {
  /** Sheet open state (controlled) */
  open: boolean;
  
  /** Open state change handler */
  onOpenChange: (open: boolean) => void;
  
  /** Action sheet title (optional) */
  title?: string;
  
  /** Action sheet description (optional) */
  description?: string;
  
  /** Action items */
  actions: ActionItem[];
  
  /** Cancel button text (default: 'Cancel') */
  cancelText?: string;
  
  /** Custom className */
  className?: string;
}

interface ActionItem {
  /** Action identifier */
  id: string;
  
  /** Action label */
  label: string;
  
  /** Action icon (optional) */
  icon?: React.ComponentType;
  
  /** Action handler */
  onClick: () => void;
  
  /** Destructive action (red text) */
  destructive?: boolean;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Show loading spinner */
  loading?: boolean;
}
```

### VirtualizedTrackList

```typescript
interface VirtualizedTrackListProps<T = Track> {
  /** Track items */
  items: T[];
  
  /** Total item count (for infinite scroll) */
  totalCount?: number;
  
  /** View mode */
  mode: 'grid' | 'list';
  
  /** Grid columns (default: 2 on mobile, 3-6 on desktop) */
  gridColumns?: number | 'auto';
  
  /** Item component renderer */
  renderItem: (item: T, index: number) => React.ReactElement;
  
  /** Item key extractor */
  keyExtractor: (item: T) => string;
  
  /** Item height (list mode, px or 'dynamic') */
  itemHeight?: number | 'dynamic';
  
  /** Loading state */
  loading?: boolean;
  
  /** Empty state component */
  emptyComponent?: React.ComponentType;
  
  /** Infinite scroll */
  infiniteScroll?: {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => void;
  };
  
  /** Pull-to-refresh */
  pullToRefresh?: {
    enabled: boolean;
    onRefresh: () => Promise<void>;
  };
  
  /** Scroll position restoration key */
  scrollRestorationKey?: string;
  
  /** Custom className */
  className?: string;
}
```

### LazyImage

```typescript
interface LazyImageProps {
  /** Image source URL */
  src: string;
  
  /** Alternative text */
  alt: string;
  
  /** Image width (px or responsive) */
  width?: number | string;
  
  /** Image height (px or responsive) */
  height?: number | string;
  
  /** Blur hash placeholder (blurhash string) */
  blurHash?: string;
  
  /** Fallback image URL (on error) */
  fallbackSrc?: string;
  
  /** Loading strategy (default: 'lazy') */
  loading?: 'lazy' | 'eager';
  
  /** Show shimmer animation while loading (default: true) */
  showShimmer?: boolean;
  
  /** Intersection observer options */
  intersectionOptions?: IntersectionObserverInit;
  
  /** Image loaded callback */
  onLoad?: () => void;
  
  /** Image error callback */
  onError?: (error: Error) => void;
  
  /** Custom className */
  className?: string;
}
```

---

## Component Variant Models

### TrackCard Variants

```typescript
type TrackCardVariant = 'default' | 'compact' | 'minimal' | 'professional';

interface TrackCardProps {
  /** Track data */
  track: Track;
  
  /** Card variant */
  variant?: TrackCardVariant;
  
  /** Show version switcher (A/B toggle) */
  showVersionSwitcher?: boolean;
  
  /** Show like button */
  showLikeButton?: boolean;
  
  /** Show share button */
  showShareButton?: boolean;
  
  /** Show menu button (3-dot) */
  showMenuButton?: boolean;
  
  /** Show waveform preview */
  showWaveform?: boolean;
  
  /** Show metadata (duration, date, plays) */
  showMetadata?: boolean;
  
  /** Card click handler */
  onClick?: (track: Track) => void;
  
  /** Play button click handler */
  onPlayClick?: (track: Track) => void;
  
  /** Custom className */
  className?: string;
}
```

---

## State Management Models

### Player Store (Zustand)

```typescript
interface PlayerStore {
  /** Currently playing track */
  currentTrack: Track | null;
  
  /** Playback state */
  isPlaying: boolean;
  
  /** Audio element reference */
  audioRef: React.RefObject<HTMLAudioElement> | null;
  
  /** Current time (seconds) */
  currentTime: number;
  
  /** Duration (seconds) */
  duration: number;
  
  /** Volume (0.0-1.0) */
  volume: number;
  
  /** Playback queue */
  queue: Track[];
  
  /** Repeat mode */
  repeatMode: 'off' | 'one' | 'all';
  
  /** Shuffle enabled */
  shuffleEnabled: boolean;
  
  /** Player UI mode */
  playerMode: 'compact' | 'expanded' | 'fullscreen';
  
  /** Actions */
  actions: {
    play: (track: Track) => void;
    pause: () => void;
    togglePlayPause: () => void;
    seek: (time: number) => void;
    setVolume: (volume: number) => void;
    addToQueue: (track: Track) => void;
    playNext: (track: Track) => void;
    skipNext: () => void;
    skipPrevious: () => void;
    toggleRepeat: () => void;
    toggleShuffle: () => void;
    setPlayerMode: (mode: 'compact' | 'expanded' | 'fullscreen') => void;
  };
}
```

---

## Modal Pattern Decision Matrix

```typescript
type ModalPattern = 'bottom-sheet' | 'action-sheet' | 'dialog' | 'drawer';

interface ModalPatternDecision {
  useCase: string;
  mobile: ModalPattern;
  desktop: ModalPattern;
  example: string;
}

const modalPatterns: ModalPatternDecision[] = [
  {
    useCase: 'Forms (create playlist, edit profile)',
    mobile: 'bottom-sheet',
    desktop: 'dialog',
    example: 'CreateProjectSheet',
  },
  {
    useCase: 'Menus (track actions, share options)',
    mobile: 'action-sheet',
    desktop: 'dropdown-menu',
    example: 'TrackMenu, ShareSheet',
  },
  {
    useCase: 'Confirmations (delete track, logout)',
    mobile: 'dialog',
    desktop: 'dialog',
    example: 'ConfirmationDialog',
  },
  {
    useCase: 'Detail Views (track info, artist bio)',
    mobile: 'bottom-sheet',
    desktop: 'drawer',
    example: 'TrackDetailSheet',
  },
  {
    useCase: 'Filters (sort, genre selection)',
    mobile: 'bottom-sheet',
    desktop: 'popover',
    example: 'LibraryFilters',
  },
];
```

---

## Touch Target Specifications

```typescript
interface TouchTargetSpec {
  /** Element type */
  elementType: 'button' | 'link' | 'tab' | 'icon-button' | 'slider-handle' | 'chip';
  
  /** Minimum size (px) */
  minSize: {
    width: number;
    height: number;
  };
  
  /** Recommended size (px) */
  recommendedSize: {
    width: number;
    height: number;
  };
  
  /** Tailwind utility classes */
  tailwindClasses: string;
  
  /** Example usage */
  example: string;
}

const touchTargetSpecs: TouchTargetSpec[] = [
  {
    elementType: 'button',
    minSize: { width: 44, height: 44 },
    recommendedSize: { width: 56, height: 48 },
    tailwindClasses: 'min-w-11 min-h-11 px-4 py-2',
    example: '<Button className="min-w-11 min-h-11">Save</Button>',
  },
  {
    elementType: 'icon-button',
    minSize: { width: 44, height: 44 },
    recommendedSize: { width: 44, height: 44 },
    tailwindClasses: 'w-11 h-11 p-2',
    example: '<Button variant="ghost" size="icon" className="w-11 h-11"><Icon /></Button>',
  },
  {
    elementType: 'tab',
    minSize: { width: 44, height: 44 },
    recommendedSize: { width: 60, height: 48 },
    tailwindClasses: 'min-w-11 min-h-11 px-3 py-2',
    example: '<TabsTrigger className="min-h-11">Tab 1</TabsTrigger>',
  },
  {
    elementType: 'chip',
    minSize: { width: 44, height: 40 },
    recommendedSize: { width: 60, height: 40 },
    tailwindClasses: 'min-w-11 h-10 px-3 py-2',
    example: '<Badge className="min-w-11 h-10">Genre</Badge>',
  },
];
```

---

## Validation Rules

### Touch Target Validation

```typescript
interface TouchTargetValidation {
  /** Element meets minimum size */
  meetsMinimum: boolean;
  
  /** Current size */
  currentSize: { width: number; height: number };
  
  /** Required size */
  requiredSize: { width: number; height: number };
  
  /** Spacing to adjacent elements (px) */
  adjacentSpacing: number;
  
  /** Meets 8px minimum spacing */
  meetsSpacingRequirement: boolean;
  
  /** Validation errors */
  errors: string[];
  
  /** Suggested fix */
  suggestedFix: string;
}
```

### Accessibility Validation

```typescript
interface AccessibilityValidation {
  /** Has ARIA label (for icon-only buttons) */
  hasAriaLabel: boolean;
  
  /** Has visible focus indicator */
  hasVisibleFocus: boolean;
  
  /** Color contrast ratio */
  contrastRatio: number;
  
  /** Meets WCAG AA (4.5:1 for text) */
  meetsWCAGAA: boolean;
  
  /** Keyboard navigable */
  keyboardNavigable: boolean;
  
  /** Validation errors */
  errors: string[];
  
  /** Suggested fix */
  suggestedFix: string;
}
```

---

## Migration Status Tracking

```typescript
interface ComponentMigrationStatus {
  /** Component path */
  componentPath: string;
  
  /** Component name */
  componentName: string;
  
  /** Category */
  category: string;
  
  /** Migration status */
  status: 'not-started' | 'in-progress' | 'complete' | 'verified';
  
  /** Unified patterns applied */
  patternsApplied: {
    usesMainLayout: boolean;
    usesMobileHeaderBar: boolean;
    usesMobileBottomSheet: boolean;
    usesVirtualizedTrackList: boolean;
    usesLazyImage: boolean;
  };
  
  /** Touch target compliance */
  touchTargetCompliant: boolean;
  
  /** WCAG AA compliance */
  accessibilityCompliant: boolean;
  
  /** Assigned developer */
  assignedTo: string;
  
  /** Sprint/milestone */
  sprint: string;
  
  /** Priority */
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  
  /** Estimated effort (days) */
  estimatedEffort: number;
  
  /** Notes */
  notes: string;
}
```

---

## Conclusion

These data models provide the foundation for consistent unified component implementation across all 991 TSX components. They enforce:

1. **Type Safety**: TypeScript interfaces prevent prop mismatches
2. **Touch Target Compliance**: Minimum 44-56px enforced via types
3. **Modal Pattern Consistency**: Clear decision matrix for modal usage
4. **Accessibility**: ARIA labels and keyboard navigation built into interfaces
5. **Performance**: Virtualization and lazy loading patterns defined
6. **Telegram Integration**: SDK features typed and documented

These schemas will be used in Phase 2 implementation to guide systematic unification of all components.
