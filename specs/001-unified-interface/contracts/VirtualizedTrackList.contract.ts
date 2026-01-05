/**
 * VirtualizedTrackList Component Contract
 * 
 * High-performance virtualized list/grid for displaying large track collections
 * with infinite scroll and pull-to-refresh.
 * 
 * @since 2026-01-05
 * @version 1.0.0
 */

import { ReactElement } from 'react';

export interface VirtualizedTrackListProps<T = any> {
  /** Track items to display */
  items: T[];
  
  /** Total item count (for infinite scroll pagination)
   * @default items.length
   */
  totalCount?: number;
  
  /** View mode
   * @default 'grid'
   */
  mode: 'grid' | 'list';
  
  /** Grid columns
   * @default 'auto' (responsive: 2 on mobile, 3-6 on desktop)
   */
  gridColumns?: number | 'auto';
  
  /** Item component renderer
   * @param item - The item data
   * @param index - The item index
   * @returns React element
   */
  renderItem: (item: T, index: number) => ReactElement;
  
  /** Item key extractor
   * @param item - The item data
   * @returns Unique key string
   */
  keyExtractor: (item: T) => string;
  
  /** Item height in pixels (list mode)
   * @default 'dynamic' (measure each item)
   */
  itemHeight?: number | 'dynamic';
  
  /** Loading state (shows skeleton loaders) */
  loading?: boolean;
  
  /** Empty state component (no items) */
  emptyComponent?: React.ComponentType;
  
  /** Infinite scroll configuration */
  infiniteScroll?: {
    /** Has more pages to load */
    hasNextPage: boolean;
    
    /** Currently fetching next page */
    isFetchingNextPage: boolean;
    
    /** Fetch next page handler */
    fetchNextPage: () => void;
    
    /** Distance from bottom to trigger load (px)
     * @default 500
     */
    threshold?: number;
  };
  
  /** Pull-to-refresh configuration */
  pullToRefresh?: {
    /** Enable pull-to-refresh */
    enabled: boolean;
    
    /** Refresh handler (returns promise) */
    onRefresh: () => Promise<void>;
  };
  
  /** Scroll position restoration key
   * Used to restore scroll position when navigating back
   * @example 'library-tracks'
   */
  scrollRestorationKey?: string;
  
  /** Custom className */
  className?: string;
  
  /** Show scroll indicator
   * @default true on desktop, false on mobile
   */
  showScrollIndicator?: boolean;
}

/**
 * Usage Guidelines:
 * 
 * 1. Library Page (500+ tracks):
 *    - mode: 'grid'
 *    - gridColumns: 'auto' (responsive)
 *    - infiniteScroll: enabled with TanStack Query
 *    - pullToRefresh: enabled
 * 
 * 2. Playlist Detail (100-500 tracks):
 *    - mode: 'list' (more metadata visible)
 *    - itemHeight: 80 (fixed height for performance)
 *    - infiniteScroll: disabled (single page)
 *    - pullToRefresh: enabled
 * 
 * 3. Search Results (50-200 results):
 *    - mode: 'grid'
 *    - gridColumns: 2 (always 2 columns for consistency)
 *    - infiniteScroll: enabled
 *    - pullToRefresh: disabled (search is manual)
 * 
 * 4. Community Feed (100+ tracks):
 *    - mode: 'grid'
 *    - gridColumns: 'auto'
 *    - infiniteScroll: enabled
 *    - pullToRefresh: enabled
 * 
 * Performance Requirements:
 * - 60 FPS scrolling with 500+ items
 * - Only render visible items (+ overscan buffer)
 * - Use react-virtuoso for virtualization
 * - Memory: < 50MB for 1000 items
 * 
 * Virtualization Activation:
 * - Always use for lists with >50 items
 * - For <50 items, use simple .map() instead
 * 
 * Touch Target Requirements:
 * - Item cards: minimum 64px height (allows tap anywhere)
 * - Buttons inside cards: 44x44px minimum
 * 
 * Accessibility Requirements:
 * - role="list"
 * - Each item has role="listitem"
 * - Keyboard navigation (arrow keys)
 * - Screen reader announces count ("Showing 50 of 500 tracks")
 * 
 * Telegram Integration:
 * - Haptic feedback on pull-to-refresh (medium impact)
 * - Haptic feedback on infinite scroll load (selection impact)
 * 
 * Scroll Restoration:
 * - Use scrollRestorationKey to restore position when navigating back
 * - Persists to sessionStorage
 * - Clears on logout or page refresh
 */

export type VirtualizedTrackListComponent = <T = any>(
  props: VirtualizedTrackListProps<T>
) => ReactElement | null;
