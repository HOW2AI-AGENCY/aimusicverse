/**
 * Admin Dashboard State Management Hook
 * 
 * Centralizes all state and business logic for the admin dashboard,
 * separating concerns from the UI presentation layer.
 * 
 * @module hooks/admin/useAdminDashboard
 * @see src/pages/AdminDashboard.tsx for UI implementation
 * 
 * @example
 * ```tsx
 * const dashboard = useAdminDashboard();
 * 
 * return (
 *   <AdminTabContent 
 *     activeTab={dashboard.activeTab}
 *     onTabChange={dashboard.setActiveTab}
 *   />
 * );
 * ```
 */

import { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useBotMetrics, useRecentMetricEvents } from '@/hooks/useBotMetrics';
import { useAdminUsers, useAdminStats, useToggleUserRole } from '@/hooks/useAdminUsers';
import { useAdminTracks } from '@/hooks/useAdminTracks';
import { useIsMobile } from '@/hooks/use-mobile';

// ============================================================================
// Types
// ============================================================================

/**
 * User with roles and credit information for admin display
 */
export interface AdminUserWithRoles {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
  created_at: string;
  roles: string[];
  subscription_tier?: string;
  subscription_expires_at?: string | null;
  balance?: number;
  total_earned?: number;
  total_spent?: number;
  level?: number;
}

/**
 * User filter options
 */
export type UserFilterType = 'all' | 'admin' | 'premium' | 'free';

/**
 * Available admin dashboard tabs
 */
export type AdminTabType = 
  | 'overview' 
  | 'analytics' 
  | 'generation-stats' 
  | 'performance'
  | 'economy' 
  | 'users' 
  | 'balances' 
  | 'tracks' 
  | 'moderation'
  | 'feedback' 
  | 'tariffs' 
  | 'bot' 
  | 'telegram' 
  | 'payments'
  | 'logs' 
  | 'deeplinks' 
  | 'alerts' 
  | 'broadcast';

/**
 * Dialog state management
 */
export interface AdminDialogState {
  creditsDialogUser: AdminUserWithRoles | null;
  subscriptionDialogUser: AdminUserWithRoles | null;
  messageDialogOpen: boolean;
  selectedTrack: unknown | null;
}

// ============================================================================
// Tab Configuration
// ============================================================================

/**
 * Tab configuration with icons and labels
 * Used by both mobile selector and desktop tabs
 */
export const ADMIN_TAB_OPTIONS = [
  { value: 'overview' as const, label: 'Обзор', iconName: 'Activity' },
  { value: 'analytics' as const, label: 'Аналитика', iconName: 'TrendingUp' },
  { value: 'generation-stats' as const, label: 'Генерации', iconName: 'Music' },
  { value: 'performance' as const, label: 'Перформанс', iconName: 'Activity' },
  { value: 'economy' as const, label: 'Экономика', iconName: 'Coins' },
  { value: 'users' as const, label: 'Пользователи', iconName: 'Users' },
  { value: 'balances' as const, label: 'Балансы', iconName: 'Coins' },
  { value: 'tracks' as const, label: 'Треки', iconName: 'Music' },
  { value: 'moderation' as const, label: 'Жалобы', iconName: 'AlertTriangle' },
  { value: 'feedback' as const, label: 'Фидбек', iconName: 'MessageSquare' },
  { value: 'tariffs' as const, label: 'Тарифы', iconName: 'Crown' },
  { value: 'bot' as const, label: 'Бот', iconName: 'MessageSquare' },
  { value: 'telegram' as const, label: 'Telegram', iconName: 'Globe' },
  { value: 'payments' as const, label: 'Платежи', iconName: 'Coins' },
  { value: 'logs' as const, label: 'Логи', iconName: 'Clock' },
  { value: 'deeplinks' as const, label: 'Диплинки', iconName: 'Globe' },
  { value: 'alerts' as const, label: 'Алерты', iconName: 'AlertTriangle' },
  { value: 'broadcast' as const, label: 'Рассылка', iconName: 'MessageSquare' },
] as const;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Admin Dashboard hook return type
 */
export interface UseAdminDashboardReturn {
  // Auth & loading state
  isAdmin: boolean;
  isAuthLoading: boolean;
  isMobile: boolean;
  
  // Navigation
  navigate: ReturnType<typeof useNavigate>;
  
  // Tab management
  activeTab: AdminTabType;
  setActiveTab: (tab: AdminTabType) => void;
  
  // Search & filters
  trackSearch: string;
  setTrackSearch: (search: string) => void;
  userSearch: string;
  setUserSearch: (search: string) => void;
  userFilter: UserFilterType;
  setUserFilter: (filter: UserFilterType) => void;
  
  // User selection
  selectedUsers: AdminUserWithRoles[];
  toggleUserSelection: (user: AdminUserWithRoles) => void;
  selectAllUsers: () => void;
  clearSelection: () => void;
  
  // Dialog management
  dialogs: AdminDialogState;
  openCreditsDialog: (user: AdminUserWithRoles) => void;
  closeCreditsDialog: () => void;
  openSubscriptionDialog: (user: AdminUserWithRoles) => void;
  closeSubscriptionDialog: () => void;
  openMessageDialog: () => void;
  closeMessageDialog: () => void;
  openTrackDetails: (track: unknown) => void;
  closeTrackDetails: () => void;
  
  // Data
  metrics: ReturnType<typeof useBotMetrics>['data'];
  recentEvents: ReturnType<typeof useRecentMetricEvents>['data'];
  users: AdminUserWithRoles[] | undefined;
  filteredUsers: AdminUserWithRoles[] | undefined;
  stats: ReturnType<typeof useAdminStats>['data'];
  tracks: ReturnType<typeof useAdminTracks>['data'];
  tracksLoading: boolean;
  
  // Actions
  refetchMetrics: () => void;
  refetchUsers: () => void;
  toggleRole: ReturnType<typeof useToggleUserRole>;
}

/**
 * Main admin dashboard hook
 * 
 * Consolidates all admin dashboard state and logic:
 * - Authentication and authorization
 * - Tab navigation
 * - User filtering and selection
 * - Dialog state management
 * - Data fetching and caching
 */
export function useAdminDashboard(): UseAdminDashboardReturn {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  
  // -------------------------------------------------------------------------
  // Tab State
  // -------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<AdminTabType>('overview');
  
  // -------------------------------------------------------------------------
  // Search & Filter State
  // -------------------------------------------------------------------------
  const [trackSearch, setTrackSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<UserFilterType>('all');
  
  // -------------------------------------------------------------------------
  // User Selection State
  // -------------------------------------------------------------------------
  const [selectedUsers, setSelectedUsers] = useState<AdminUserWithRoles[]>([]);
  
  // -------------------------------------------------------------------------
  // Dialog State
  // -------------------------------------------------------------------------
  const [dialogs, setDialogs] = useState<AdminDialogState>({
    creditsDialogUser: null,
    subscriptionDialogUser: null,
    messageDialogOpen: false,
    selectedTrack: null,
  });
  
  // -------------------------------------------------------------------------
  // Data Fetching
  // -------------------------------------------------------------------------
  const { data: auth, isLoading: isAuthLoading } = useAdminAuth();
  const { data: metrics, refetch: refetchMetrics } = useBotMetrics('24 hours');
  const { data: recentEvents } = useRecentMetricEvents(100);
  const { data: users, refetch: refetchUsers } = useAdminUsers();
  const { data: stats } = useAdminStats();
  const { data: tracks, isLoading: tracksLoading } = useAdminTracks(trackSearch, 100);
  const toggleRole = useToggleUserRole();
  
  // -------------------------------------------------------------------------
  // Filtered Users (memoized)
  // -------------------------------------------------------------------------
  const filteredUsers = useMemo(() => {
    if (!users) return undefined;
    
    return users.filter((user) => {
      // Search filter
      const matchesSearch = !userSearch || 
        user.first_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.username?.toLowerCase().includes(userSearch.toLowerCase());
      
      // Role/tier filter
      const matchesFilter = 
        userFilter === 'all' ||
        (userFilter === 'admin' && user.roles.includes('admin')) ||
        (userFilter === 'premium' && user.subscription_tier && user.subscription_tier !== 'free') ||
        (userFilter === 'free' && (!user.subscription_tier || user.subscription_tier === 'free'));
      
      return matchesSearch && matchesFilter;
    });
  }, [users, userSearch, userFilter]);
  
  // -------------------------------------------------------------------------
  // User Selection Actions
  // -------------------------------------------------------------------------
  const toggleUserSelection = useCallback((user: AdminUserWithRoles) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u.user_id === user.user_id);
      if (exists) {
        return prev.filter((u) => u.user_id !== user.user_id);
      }
      return [...prev, user];
    });
  }, []);
  
  const selectAllUsers = useCallback(() => {
    if (filteredUsers) {
      setSelectedUsers(filteredUsers);
    }
  }, [filteredUsers]);
  
  const clearSelection = useCallback(() => {
    setSelectedUsers([]);
  }, []);
  
  // -------------------------------------------------------------------------
  // Dialog Actions
  // -------------------------------------------------------------------------
  const openCreditsDialog = useCallback((user: AdminUserWithRoles) => {
    setDialogs((prev) => ({ ...prev, creditsDialogUser: user }));
  }, []);
  
  const closeCreditsDialog = useCallback(() => {
    setDialogs((prev) => ({ ...prev, creditsDialogUser: null }));
  }, []);
  
  const openSubscriptionDialog = useCallback((user: AdminUserWithRoles) => {
    setDialogs((prev) => ({ ...prev, subscriptionDialogUser: user }));
  }, []);
  
  const closeSubscriptionDialog = useCallback(() => {
    setDialogs((prev) => ({ ...prev, subscriptionDialogUser: null }));
  }, []);
  
  const openMessageDialog = useCallback(() => {
    setDialogs((prev) => ({ ...prev, messageDialogOpen: true }));
  }, []);
  
  const closeMessageDialog = useCallback(() => {
    setDialogs((prev) => ({ ...prev, messageDialogOpen: false }));
  }, []);
  
  const openTrackDetails = useCallback((track: unknown) => {
    setDialogs((prev) => ({ ...prev, selectedTrack: track }));
  }, []);
  
  const closeTrackDetails = useCallback(() => {
    setDialogs((prev) => ({ ...prev, selectedTrack: null }));
  }, []);
  
  // -------------------------------------------------------------------------
  // Return API
  // -------------------------------------------------------------------------
  return {
    // Auth & loading
    isAdmin: auth?.isAdmin ?? false,
    isAuthLoading,
    isMobile,
    
    // Navigation
    navigate,
    
    // Tab management
    activeTab,
    setActiveTab,
    
    // Search & filters
    trackSearch,
    setTrackSearch,
    userSearch,
    setUserSearch,
    userFilter,
    setUserFilter,
    
    // User selection
    selectedUsers,
    toggleUserSelection,
    selectAllUsers,
    clearSelection,
    
    // Dialogs
    dialogs,
    openCreditsDialog,
    closeCreditsDialog,
    openSubscriptionDialog,
    closeSubscriptionDialog,
    openMessageDialog,
    closeMessageDialog,
    openTrackDetails,
    closeTrackDetails,
    
    // Data
    metrics,
    recentEvents,
    users,
    filteredUsers,
    stats,
    tracks,
    tracksLoading,
    
    // Actions
    refetchMetrics,
    refetchUsers,
    toggleRole,
  };
}
