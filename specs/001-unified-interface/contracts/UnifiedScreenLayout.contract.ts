/**
 * UnifiedScreenLayout Component Contract
 * 
 * Standard page layout pattern that combines MainLayout + MobileHeaderBar
 * for consistent screen structure across all pages.
 * 
 * @since 2026-01-05
 * @version 1.0.0
 */

import { ReactNode } from 'react';
import { MobileHeaderBarProps } from './MobileHeaderBar.contract';

export interface UnifiedScreenLayoutProps {
  /** Page title (displayed in header) */
  title: string;
  
  /** Page content */
  children: ReactNode;
  
  /** Header configuration (passed to MobileHeaderBar) */
  header?: Partial<MobileHeaderBarProps>;
  
  /** Show bottom navigation
   * @default true
   */
  showBottomNav?: boolean;
  
  /** Full-screen mode (no header, no bottom nav)
   * @default false
   * @example Player, Studio
   */
  fullScreen?: boolean;
  
  /** Page loading state (shows skeleton) */
  loading?: boolean;
  
  /** Page error state */
  error?: Error | null;
  
  /** Error retry handler */
  onRetry?: () => void;
  
  /** Enable pull-to-refresh
   * @default false
   */
  pullToRefresh?: {
    enabled: boolean;
    onRefresh: () => Promise<void>;
  };
  
  /** Telegram MainButton configuration */
  mainButton?: {
    /** Show MainButton */
    visible: boolean;
    
    /** Button text */
    text: string;
    
    /** Button enabled state */
    enabled: boolean;
    
    /** Button click handler */
    onClick: () => void;
    
    /** Button progress (0-100, shows loading) */
    progress?: number;
  };
  
  /** Custom className for content area */
  contentClassName?: string;
  
  /** Padding for content area
   * @default 'default' (16px)
   */
  contentPadding?: 'none' | 'sm' | 'default' | 'lg';
  
  /** Safe area handling
   * @default 'auto' (applies safe area padding on iOS)
   */
  safeArea?: 'auto' | 'none';
}

/**
 * Usage Examples:
 * 
 * 1. Standard Page (Library, Playlists):
 *    <UnifiedScreenLayout
 *      title="Library"
 *      header={{ actions: [{ id: 'filter', icon: Filter, onClick: handleFilter }] }}
 *    >
 *      <VirtualizedTrackList items={tracks} />
 *    </UnifiedScreenLayout>
 * 
 * 2. Full-Screen Page (Player, Studio):
 *    <UnifiedScreenLayout
 *      title="Now Playing"
 *      fullScreen
 *    >
 *      <MobileFullscreenPlayer track={currentTrack} />
 *    </UnifiedScreenLayout>
 * 
 * 3. Form Page with MainButton (Generate):
 *    <UnifiedScreenLayout
 *      title="Generate Music"
 *      mainButton={{
 *        visible: true,
 *        text: 'Generate',
 *        enabled: formValid,
 *        onClick: handleSubmit,
 *      }}
 *    >
 *      <GenerateForm />
 *    </UnifiedScreenLayout>
 * 
 * 4. Page with Pull-to-Refresh (Community):
 *    <UnifiedScreenLayout
 *      title="Community"
 *      pullToRefresh={{ enabled: true, onRefresh: refetch }}
 *    >
 *      <VirtualizedTrackList items={communityTracks} />
 *    </UnifiedScreenLayout>
 * 
 * Layout Hierarchy:
 * - MainLayout (portrait lock, safe areas, GlobalAudioProvider)
 *   - BottomNavigation (fixed bottom, 5 tabs)
 *   - MobileHeaderBar (sticky top, back button, title, actions)
 *   - Content Area (scrollable, safe area padding)
 *     - {children}
 * 
 * Automatic Features:
 * - Portrait orientation lock
 * - Safe area padding (iOS notch/Dynamic Island)
 * - Back button (when not root page)
 * - Telegram BackButton integration
 * - Telegram MainButton integration
 * - Error boundary
 * - Loading skeleton
 * 
 * Performance:
 * - Lazy load content with React.lazy()
 * - Suspense boundary with skeleton fallback
 * - Virtualize long lists (>50 items)
 * 
 * Accessibility:
 * - Proper heading hierarchy (h1 for title)
 * - Skip to content link
 * - Focus management on page change
 */

export type UnifiedScreenLayoutComponent = React.FC<UnifiedScreenLayoutProps>;
