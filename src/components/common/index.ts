/**
 * Common reusable components
 * 
 * - SectionHeader: Headers for sections with icons, titles, and actions
 * - ResponsiveGrid: Responsive grid layouts
 * - EmptyState: Empty state displays
 * - DetailSection: Section wrappers for detail views
 * - StatsGrid: Statistical data displays
 * - InlineLyricsEditor: Lyrics editing component
 * - UnifiedFAB: Universal floating action button
 * - UnifiedListRow: Universal list row component
 * - UnifiedPageHeader: Universal page header
 * - UnifiedActionBar: Horizontal action bar
 */

export { EmptyState } from './EmptyState';
export { SectionHeader } from './SectionHeader';
export { ResponsiveGrid, GRID_PRESETS } from './ResponsiveGrid';
export { InlineLyricsEditor } from './InlineLyricsEditor';
export { DetailSection } from './DetailSection';
export { StatsGrid, StatItem } from './StatsGrid';
export type { StatItem as StatItemType } from './StatsGrid';

// Unified mobile-first components
export { UnifiedFAB } from './UnifiedFAB';
export type { UnifiedFABProps, FABAction } from './UnifiedFAB';

export { UnifiedListRow } from './UnifiedListRow';
export type { UnifiedListRowProps, RowBadge, RowAction, RowStatus } from './UnifiedListRow';

export { UnifiedPageHeader } from './UnifiedPageHeader';
export type { UnifiedPageHeaderProps, BreadcrumbItem } from './UnifiedPageHeader';

export { UnifiedActionBar } from './UnifiedActionBar';
export type { UnifiedActionBarProps, ActionBarItem } from './UnifiedActionBar';
