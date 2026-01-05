/**
 * Social interaction hook types
 *
 * Per data-model.md: TypeScript interfaces for social hooks
 * including useSocialInteractions and useRealtimeSocialCounts.
 */

// ============================================================================
// useSocialInteractions Hook Types
// ============================================================================

/**
 * Entity types that support social interactions
 */
export type SocialEntityType = 'track' | 'playlist' | 'artist';

/**
 * Share platform options
 */
export type SharePlatform = 'telegram' | 'twitter' | 'clipboard' | 'whatsapp';

/**
 * Parameters for useSocialInteractions hook
 */
export interface UseSocialInteractionsParams {
  /** Entity type */
  entityType: SocialEntityType;
  /** Entity ID */
  entityId: string;
  /** Enable optimistic updates */
  enableOptimistic?: boolean;
}

/**
 * Return value for useSocialInteractions hook
 */
export interface UseSocialInteractionsReturn {
  /** Whether current user likes this entity */
  isLiked: boolean;
  /** Total like count */
  likesCount: number;
  /** Toggle like status */
  toggleLike: () => Promise<void>;
  /** Whether current user follows this entity (for artists) */
  isFollowing?: boolean;
  /** Toggle follow status (for artists) */
  toggleFollow?: () => Promise<void>;
  /** Share entity */
  share: (platform: SharePlatform) => Promise<void>;
  /** Action in progress */
  isPending: boolean;
  /** Error object */
  error: Error | null;
}

// ============================================================================
// useRealtimeSocialCounts Hook Types
// ============================================================================

/**
 * Social count updates from real-time subscription
 */
export interface SocialCountUpdate {
  /** Entity ID */
  entityId: string;
  /** Update type */
  type: 'like' | 'follow' | 'play' | 'share';
  /** New count */
  count: number;
  /** Change delta (+1, -1) */
  delta: number;
  /** Timestamp */
  timestamp: number;
}

/**
 * Parameters for useRealtimeSocialCounts hook
 */
export interface UseRealtimeSocialCountsParams {
  /** Entity IDs to subscribe to */
  entityIds: string[];
  /** Entity type */
  entityType: SocialEntityType;
  /** Enable subscription */
  enabled?: boolean;
  /** Callback on count update */
  onUpdate?: (update: SocialCountUpdate) => void;
}

/**
 * Return value for useRealtimeSocialCounts hook
 */
export interface UseRealtimeSocialCountsReturn {
  /** Map of entity ID to count */
  counts: Map<string, number>;
  /** Connection status */
  isConnected: boolean;
  /** Error object */
  error: Error | null;
  /** Refetch counts */
  refetch: () => Promise<void>;
}

// ============================================================================
// useFollow Hook Types (Artist-specific)
// ============================================================================

/**
 * Parameters for useFollow hook
 */
export interface UseFollowParams {
  /** Artist/user ID to follow/unfollow */
  artistId: string;
  /** Enable optimistic updates */
  enableOptimistic?: boolean;
}

/**
 * Return value for useFollow hook
 */
export interface UseFollowReturn {
  /** Whether current user follows this artist */
  isFollowing: boolean;
  /** Follower count */
  followersCount: number;
  /** Follow artist */
  follow: () => Promise<void>;
  /** Unfollow artist */
  unfollow: () => Promise<void>;
  /** Action in progress */
  isPending: boolean;
  /** Error object */
  error: Error | null;
}

// ============================================================================
// useShare Hook Types
// ============================================================================

/**
 * Share options
 */
export interface ShareOptions {
  /** Share platform */
  platform: SharePlatform;
  /** Custom message */
  message?: string;
  /** Include image */
  includeImage?: boolean;
}

/**
 * Parameters for useShare hook
 */
export interface UseShareParams {
  /** Entity type being shared */
  entityType: SocialEntityType;
  /** Entity ID being shared */
  entityId: string;
}

/**
 * Return value for useShare hook
 */
export interface UseShareReturn {
  /** Share entity */
  share: (options: ShareOptions) => Promise<void>;
  /** Check if platform is available */
  isPlatformAvailable: (platform: SharePlatform) => boolean;
  /** Action in progress */
  isPending: boolean;
  /** Error object */
  error: Error | null;
}
