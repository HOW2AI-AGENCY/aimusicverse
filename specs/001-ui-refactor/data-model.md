# Data Model: UI Architecture Refactoring

**Feature**: 001-ui-refactor
**Date**: 2026-01-06
**Status**: Phase 1 Design

---

## Overview

This document defines the data model for the UI Architecture Refactoring feature. Since this is a refactoring effort focused on component consolidation and business logic extraction (not new data entities), the data model primarily describes TypeScript interfaces, hook contracts, and component variant types.

---

## Entity Definitions

### Component

Represents a React UI component in the refactored architecture.

**Attributes**:
- `name`: string (PascalCase) - Component export name
- `filePath`: string - Absolute path to component file (kebab-case)
- `propsInterface`: string - TypeScript interface name for props
- `variant`: ComponentVariant | null - If this is a variant of a base component
- `dependencies`: Component[] - Other components this component renders
- `usedBy`: string[] - Pages/features that import this component

**Relationships**:
- Has many: ComponentVariant (if base component)
- Uses: Hook (for business logic)
- Renders: Component (child components)

**Example**:
```typescript
{
  name: "UnifiedTrackCard",
  filePath: "src/components/track/track-card.tsx",
  propsInterface: "UnifiedTrackCardProps",
  variant: null,
  dependencies: ["Button", "LazyImage", "ShimmerEffect"],
  usedBy: ["HomePage", "LibraryPage", "SearchPage"]
}
```

---

### Hook

Represents a custom React hook that encapsulates business logic.

**Attributes**:
- `name`: string (camelCase, use* pattern) - Hook function name
- `purpose`: string - Description of what logic this hook encapsulates
- `parameters`: HookParameter[] - Input parameters
- `returns`: HookReturnValue - Output value structure
- `dependencies`: ExternalDependency[] - External services/APIs used
- `usedBy`: Component[] - Components that use this hook

**Relationships**:
- Used by: Component
- Calls: Service (business logic)
- Manages: State (Zustand store or local state)

**Example**:
```typescript
{
  name: "useTrackData",
  purpose: "Fetches track data from Supabase with TanStack Query caching",
  parameters: [
    { name: "userId", type: "string | undefined", required: false },
    { name: "isPublic", type: "boolean", required: false }
  ],
  returns: {
    tracks: "Track[]",
    isLoading: "boolean",
    error: "Error | null",
    refetch: "() => void"
  },
  dependencies: ["@tanstack/react-query", "supabase"],
  usedBy: ["UnifiedTrackCard", "TrackList", "LibraryPage"]
}
```

---

### SkeletonVariant

Represents a loading state component for UI skeletons.

**Attributes**:
- `type`: SkeletonType - What this skeleton represents (track, player, studio, etc.)
- `layout`: SkeletonLayout - Visual layout (grid, list, compact)
- `animation`: SkeletonAnimation - Animation type (shimmer, pulse, fade)
- `responsiveToMotion`: boolean - Whether this skeleton respects prefers-reduced-motion
- `mimicsComponent`: Component - The actual component this skeleton mimics

**Relationships**:
- Belongs to: SkeletonComponent
- Mimics: Component (the actual component)

**Example**:
```typescript
{
  type: "track-card",
  layout: "grid",
  animation: "shimmer",
  responsiveToMotion: true,
  mimicsComponent: "UnifiedTrackCard"
}
```

---

### ComponentVariant

Represents a display variation of a consolidated component.

**Attributes**:
- `name`: string - Variant identifier (grid, list, compact, minimal, enhanced, professional)
- `belongsTo`: Component - The base component
- `propRequirements`: VariantPropConfig - Specific props for this variant
- `stylingDifferences`: VariantStyleConfig - CSS differences from base variant
- `behavioralDifferences`: VariantBehaviorConfig | null - Functional differences (null if same behavior)

**Relationships**:
- Belongs to: Component
- Inherits: Component (base component logic)

**Example**:
```typescript
{
  name: "grid",
  belongsTo: "UnifiedTrackCard",
  propRequirements: {
    variant: "grid",
    showCover: true,
    showTitle: true,
    showActions: true
  },
  stylingDifferences: {
    layout: "grid",
    className: "grid-cols-2 gap-3"
  },
  behavioralDifferences: null
}
```

---

## TypeScript Interface Definitions

### UnifiedTrackCard Component Types

```typescript
// Base props shared by all variants
interface BaseTrackCardProps {
  track: Track | PublicTrackWithCreator;
  onPlay?: (track: Track) => void;
  onDelete?: (trackId: string) => void;
  onDownload?: (trackId: string) => void;
  onVersionSwitch?: (versionId: string) => void;
  showActions?: boolean;
  className?: string;
}

// Enhanced variant props
interface EnhancedTrackCardProps extends BaseTrackCardProps {
  variant: 'enhanced';
  onRemix?: (trackId: string) => void;
  showFollowButton?: boolean;
  onFollow?: (userId: string) => void;
  onShare?: (trackId: string) => void;
  onAddToPlaylist?: (trackId: string) => void;
}

// Professional variant props
interface ProfessionalTrackCardProps extends BaseTrackCardProps {
  variant: 'professional';
  midiStatus?: {
    hasMidi: boolean;
    hasPdf: boolean;
    hasGp5: boolean;
  };
  showVersionPills?: boolean;
}

// Standard variant props
interface StandardTrackCardProps extends BaseTrackCardProps {
  variant: 'grid' | 'list' | 'compact' | 'minimal' | 'default';
  versionCount?: number;
  stemCount?: number;
  index?: number;
  layout?: 'grid' | 'list'; // Alias for backward compatibility
}

// Discriminated union
type UnifiedTrackCardProps =
  | EnhancedTrackCardProps
  | ProfessionalTrackCardProps
  | StandardTrackCardProps;

// Variant configuration
interface VariantConfig {
  layout: 'grid' | 'list';
  showCover: boolean;
  showTitle: boolean;
  showActions: boolean;
  showVersionToggle: boolean;
  showStemCount: boolean;
  compact: boolean;
  animations: {
    enter: string;
    hover: string;
    tap: string;
  };
}
```

---

### Hook Interface Types

```typescript
// useTrackData hook
interface UseTrackDataParams {
  userId?: string;
  isPublic?: boolean;
  limit?: number;
  offset?: number;
}

interface UseTrackDataReturn {
  tracks: Track[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
}

// useTrackActions hook
interface UseTrackActionsReturn {
  likeTrack: () => Promise<void>;
  unlikeTrack: () => Promise<void>;
  shareTrack: (platform: string) => Promise<void>;
  deleteTrack: () => Promise<void>;
  addToPlaylist: (playlistId: string) => Promise<void>;
  isPending: boolean;
}

// useRealtimeTrackUpdates hook
interface UseRealtimeTrackUpdatesParams {
  trackId: string;
  enabled?: boolean;
}

interface UseRealtimeTrackUpdatesReturn {
  data: TrackUpdate | null;
  isConnected: boolean;
  error: Error | null;
}

// useTrackVersionSwitcher hook
interface UseTrackVersionSwitcherReturn {
  activeVersion: TrackVersion | null;
  allVersions: TrackVersion[];
  switchVersion: (versionId: string) => Promise<void>;
  isPending: boolean;
}

// useSocialInteractions hook
interface UseSocialInteractionsParams {
  entityType: 'track' | 'playlist' | 'artist';
  entityId: string;
}

interface UseSocialInteractionsReturn {
  isLiked: boolean;
  likesCount: number;
  toggleLike: () => Promise<void>;
  isFollowing: boolean; // For artists
  toggleFollow: () => Promise<void>;
}
```

---

### Skeleton Component Types

```typescript
// Base skeleton props
interface BaseSkeletonProps {
  className?: string;
  animated?: boolean;
  delay?: number;
  shimmer?: boolean;
}

// Track skeleton props
interface TrackSkeletonProps extends BaseSkeletonProps {
  layout?: 'grid' | 'list' | 'compact';
  count?: number;
  showControls?: boolean;
}

// Player skeleton props
interface PlayerSkeletonProps extends BaseSkeletonProps {
  compact?: boolean;
  showProgress?: boolean;
  showControls?: boolean;
}

// Studio skeleton props
interface StudioSkeletonProps extends BaseSkeletonProps {
  showWaveform?: boolean;
  showTimeline?: boolean;
  showControls?: boolean;
}

// Form skeleton props
interface FormSkeletonProps extends BaseSkeletonProps {
  fieldCount?: number;
  showActions?: boolean;
}

// Skeleton variant type
type SkeletonVariant =
  | 'track-card'
  | 'track-list'
  | 'track-compact'
  | 'player'
  | 'player-compact'
  | 'studio'
  | 'waveform'
  | 'form'
  | 'text'
  | 'circle';
```

---

### Modal Component Types

```typescript
// AlertDialog props (for confirmations)
interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void | Promise<void>;
}

// Sheet props (for details/forms)
interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: 'top' | 'right' | 'bottom' | 'left';
  title: string;
  description?: string;
  children: React.ReactNode;
}

// ResponsiveModal props (adaptive)
interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  forceMode?: 'dialog' | 'sheet'; // Override adaptive behavior
}

// Dialog props (simple modals)
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}
```

---

## State Transition Diagrams

### Track Card State Transitions

```
[Idle]
  ↓ User clicks play
[Loading] → Show loading spinner
  ↓ Data loaded
[Playing] → Show play indicator
  ↓ User clicks pause
[Paused]
  ↓ User clicks different track
[Switching] → Transition animation
  ↓ New track loaded
[Playing New Track]
```

### Real-time Subscription State

```
[Disconnected]
  ↓ Component mounts
[Connecting] → Show connection indicator
  ↓ Channel established
[Connected] → Listen for updates
  ↓ Update received
[Updating] → Optimistic update + UI refresh
  ↓ Update confirmed
[Connected]
  ↓ Component unmounts
[Disconnected] → Cleanup and remove channel
```

### Skeleton State Transitions

```
[Hidden]
  ↓ Data loading starts
[Visible] → Show skeleton with animation
  ↓ prefers-reduced-motion = true
[Static] → Show skeleton without animation
  ↓ Data loaded
[Fade Out] → Exit animation
  ↓ Animation complete
[Hidden]
```

---

## Data Flow Diagrams

### Component → Hook → Service Flow

```
[UnifiedTrackCard Component]
  ↓ Calls useTrackData hook
[useTrackData Hook]
  ↓ Calls TanStack Query
[TanStack Query]
  ↓ Calls fetchTracks function
[Track Service]
  ↓ Executes Supabase query
[Supabase Client]
  ↓ Returns data
[Track Service]
  ↓ Transforms data
[TanStack Query]
  ↓ Caches and normalizes
[useTrackData Hook]
  ↓ Returns tracks, isLoading, error
[UnifiedTrackCard Component]
  ↓ Renders with data
[UI Display]
```

### Real-time Update Flow

```
[Component mounts]
  ↓ Calls useRealtimeTrackUpdates
[Hook establishes Supabase channel]
  ↓ Subscribes to postgres_changes
[Supabase sends update event]
  ↓ Hook receives payload
[Hook processes update]
  ↓ Updates local state
[Component re-renders]
  ↓ Shows updated data
[UI reflects new state]
```

---

## Validation Rules

### Component Props Validation

1. **Variant Props**: Must use discriminated union pattern
   - Exactly one variant type must match
   - Variant-specific props must be provided for that variant
   - TypeScript compiler enforces this at compile time

2. **Required Props**: Base props must be provided
   - `track` is always required
   - `onPlay`, `onDelete` are optional but recommended
   - `className` is always optional

3. **Callback Props**: Must be functions if provided
   - `onPlay?: (track: Track) => void`
   - `onDelete?: (trackId: string) => void`
   - Type checking enforced by TypeScript

### Hook Parameter Validation

1. **Required Parameters**: Enforced by TypeScript
   - `trackId` required for useRealtimeTrackUpdates
   - `entityType` and `entityId` required for useSocialInteractions

2. **Optional Parameters**: Have default values
   - `enabled?: boolean` defaults to `true`
   - `limit?: number` defaults to `20`

3. **Return Values**: Always return complete interface
   - Hooks always return consistent object structure
   - No conditional returns that change shape

### Skeleton Validation

1. **Layout Compatibility**: Layout must match component
   - Grid skeleton for grid components
   - List skeleton for list components
   - Mismatched layouts cause visual inconsistency

2. **Animation Preference**: Must respect user preferences
   - Check `prefers-reduced-motion` media query
   - Disable animations when preference is set
   - Fallback to static skeleton

3. **Timing**: Animations must be synchronized
   - Skeleton appears before data loads
   - Skeleton disappears after data loads
   - No flickering or gaps

---

## Relationships Summary

```
Component
  ├── uses → Hook
  │     ├── calls → Service
  │     └── manages → State (Zustand or local)
  ├── renders → Component (children)
  ├── has → ComponentVariant (if base component)
  └── mimics → SkeletonVariant (for loading states)

Hook
  ├── used by → Component
  ├── calls → Service (business logic)
  └── manages → State (Zustand store or React state)

SkeletonVariant
  ├── belongs to → SkeletonComponent
  └── mimics → Component (actual component)

ComponentVariant
  ├── belongs to → Component
  └── inherits → Component (base logic)
```

---

## Migration Data Model

### Deprecated Components

```typescript
interface DeprecatedComponent {
  name: string;
  filePath: string;
  replacement: Component; // New unified component
  deprecationDate: Date;
  removalDate?: Date;
  migrationNotes: string;
}

// Example
{
  name: "MinimalTrackCard",
  filePath: "src/components/library/MinimalTrackCard.tsx",
  replacement: "UnifiedTrackCard",
  deprecationDate: "2026-01-06",
  removalDate: "2026-02-01",
  migrationNotes: "Replace with UnifiedTrackCard variant='minimal'"
}
```

### Component Usage Map

```typescript
interface ComponentUsage {
  component: string;
  usageLocations: UsageLocation[];
  totalImports: number;
  priority: 'high' | 'medium' | 'low';
}

interface UsageLocation {
  filePath: string;
  importLine: number;
  usageContext: string;
}
```

---

## Summary

This data model defines:

1. **Core Entities**: Component, Hook, SkeletonVariant, ComponentVariant
2. **TypeScript Interfaces**: Complete type definitions for all refactored components and hooks
3. **State Transitions**: Visual diagrams for component lifecycle and data flow
4. **Validation Rules**: Constraints and validation requirements
5. **Relationships**: How entities relate to each other
6. **Migration Model**: Tracking deprecated components and usage patterns

The data model supports the refactoring goals:
- Type safety through discriminated unions
- Clear separation of concerns (components, hooks, services)
- Consolidation through variant systems
- Maintainability through consistent patterns

**Next Step**: Generate hook and component contracts in `contracts/` directory
