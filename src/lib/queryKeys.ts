/**
 * Centralized query key factory for TanStack Query.
 *
 * Provides type-safe, consistent query keys across all hooks.
 * Use these instead of inline string arrays to prevent typos
 * and enable reliable cache invalidation.
 *
 * @example
 * ```ts
 * import { queryKeys } from "@/lib/queryKeys";
 *
 * // In a hook:
 * useQuery({ queryKey: queryKeys.tracks.list({ userId, isPublic: true }), ... })
 *
 * // Invalidation:
 * queryClient.invalidateQueries({ queryKey: queryKeys.tracks.all })
 * ```
 */

function createKeys<T extends string>(prefix: T) {
  return {
    all: [prefix] as const,
    lists: () => [prefix, "list"] as const,
    list: (filters: Record<string, unknown>) => [prefix, "list", filters] as const,
    details: () => [prefix, "detail"] as const,
    detail: (id: string) => [prefix, "detail", id] as const,
  };
}

export const queryKeys = {
  tracks: {
    ...createKeys("tracks"),
    versions: (trackId: string) => ["track-versions", trackId] as const,
    /**
     * Scoped version cache. All scopes share the ["track-versions", trackId]
     * prefix so a single invalidation refreshes every version consumer.
     */
    versionsScoped: (trackId: string, scope: "unified" | "switcher" | "detailed") =>
      ["track-versions", trackId, scope] as const,
    versionsBatch: (trackIds: string[]) => ["track-versions-batch", trackIds] as const,
    stems: (trackId: string) => ["track-stems", trackId] as const,
    stemsBatch: (trackIds: string[]) => ["track-stems-batch", trackIds] as const,
    like: (trackId: string, userId?: string) => ["track-like", trackId, userId] as const,
    inPlaylists: (trackId: string) => ["track-in-playlists", trackId] as const,
    context: (trackId: string) => ["track-context", trackId] as const,
    changelog: (trackId: string) => ["track-changelog", trackId] as const,
    transcriptions: (trackId: string) => ["track-transcriptions", trackId] as const,
    transcriptionsBatch: (trackIds: string[]) => ["track-transcriptions-batch", trackIds] as const,
    midiStatus: (trackId: string) => ["track-midi-status", trackId] as const,
    referenceAudio: (trackId: string) => ["track-reference-audio", trackId] as const,
    guitarAnalysis: (trackId: string) => ["track-guitar-analysis", trackId] as const,
    infinite: (filters?: Record<string, unknown>) => ["tracks-infinite", filters] as const,
    userTracks: (userId: string) => ["user-tracks", userId] as const,
    publicTracks: (filters?: Record<string, unknown>) => ["public-tracks", filters] as const,
    versionCount: (trackId: string) => ["version-count", trackId] as const,
    masterVersion: (trackId: string) => ["master-version", trackId] as const,
  },

  playlists: {
    ...createKeys("playlists"),
    tracks: (playlistId: string) => ["playlist-tracks", playlistId] as const,
    userPlaylists: (userId: string) => ["user-playlists", userId] as const,
    userPlaylistsForAdd: (userId: string) => ["user-playlists-for-add", userId] as const,
    public: (filters?: Record<string, unknown>) => ["public-playlists", filters] as const,
  },

  profiles: {
    ...createKeys("profile"),
    stats: (userId: string) => ["profile-stats", userId] as const,
    public: (userId: string) => ["public-profile", userId] as const,
  },

  users: {
    ...createKeys("users"),
    stats: (userId: string) => ["user-stats", userId] as const,
    quickStats: (userId: string) => ["user-quick-stats", userId] as const,
    studioStats: (userId: string) => ["user-studio-stats", userId] as const,
    roles: (userId: string) => ["user-roles", userId] as const,
    adminStatus: (userId: string) => ["user-admin-status", userId] as const,
    credits: (userId: string) => ["user-credits", userId] as const,
    generationCount: (userId: string) => ["user-generation-count", userId] as const,
    listeningHistory: (userId: string) => ["user-listening-history", userId] as const,
    blockedUsers: (userId: string) => ["blocked-users", userId] as const,
  },

  generation: {
    all: ["generation"] as const,
    active: (userId?: string) => ["active-generations", userId] as const,
    history: (userId?: string) => ["generation-history", userId] as const,
    tasks: (filters?: Record<string, unknown>) => ["generation-tasks", filters] as const,
    queue: () => ["generation-queue"] as const,
    stats: () => ["generation-stats"] as const,
    metrics: (filters?: Record<string, unknown>) => ["generation-metrics", filters] as const,
    logs: (filters?: Record<string, unknown>) => ["generation-logs", filters] as const,
  },

  projects: {
    ...createKeys("projects"),
    tracks: (projectId: string) => ["project-tracks", projectId] as const,
    generatedTracks: (projectId: string) => ["project-generated-tracks", projectId] as const,
    public: (filters?: Record<string, unknown>) => ["public-projects", filters] as const,
  },

  social: {
    followers: (userId: string) => ["followers", userId] as const,
    following: (userId: string) => ["following", userId] as const,
    followingIds: (userId: string) => ["following-ids", userId] as const,
    isFollowing: (userId: string, targetId: string) => ["is-following", userId, targetId] as const,
    comments: (trackId: string) => ["comments", trackId] as const,
    notifications: (userId?: string) => ["notifications", userId] as const,
    notificationSettings: (userId: string) => ["notification-settings", userId] as const,
    activityFeed: (userId?: string) => ["activity-feed", userId] as const,
  },

  credits: {
    all: ["credits"] as const,
    balance: (userId: string) => ["user-credits", userId] as const,
    transactions: (userId: string) => ["credit-transactions", userId] as const,
    limits: (userId: string) => ["credits-limits", userId] as const,
    subscription: (userId: string) => ["subscription", userId] as const,
    subscriptionStatus: (userId: string) => ["subscription-status", userId] as const,
    trialEligibility: (userId: string) => ["trial-eligibility", userId] as const,
  },

  content: {
    all: ["content"] as const,
    publicOptimized: () => ["public-content-optimized"] as const,
    search: (query: string) => ["search-public-content", query] as const,
    featured: () => ["featured-content"] as const,
    homeData: () => ["home-data"] as const,
    templates: (filters?: Record<string, unknown>) => ["templates", filters] as const,
    lyricsTemplates: () => ["lyrics-templates"] as const,
    blogPosts: () => ["blog-posts"] as const,
    blogPost: (id: string) => ["blog-post", id] as const,
    musicStyles: () => ["music-styles"] as const,
    metaTags: () => ["meta-tags"] as const,
    styleTags: () => ["style-tag-mappings"] as const,
  },

  artists: {
    ...createKeys("artists"),
    stats: (artistId: string) => ["artist-stats", artistId] as const,
    tracks: (artistId: string) => ["artist-tracks", artistId] as const,
    customVoices: (userId: string) => ["custom-voices", userId] as const,
  },

  studio: {
    all: ["studio"] as const,
    data: (projectId: string) => ["studio-data", projectId] as const,
    changelog: (projectId: string) => ["studio-change-log", projectId] as const,
    projects: ["studio-projects"] as const,
    transcription: (trackId: string) => ["studio-transcription", trackId] as const,
    sourceTrack: (trackId: string) => ["source-track", trackId] as const,
    replacedSections: (trackId: string) => ["replaced-sections", trackId] as const,
    audioAnalysis: (trackId: string) => ["audio-analysis", trackId] as const,
    beatGrid: (trackId: string) => ["beat-grid", trackId] as const,
    timestampedLyrics: (trackId: string) => ["timestamped-lyrics", trackId] as const,
    stemTranscriptions: (trackId: string, stemTypesKey: string) =>
      ["stem-transcriptions-full", trackId, stemTypesKey] as const,
  },

  gamification: {
    all: ["gamification"] as const,
    stats: (userId: string) => ["user-gamification-stats", userId] as const,
    achievements: (userId?: string) => ["user-achievements", userId] as const,
    checkins: (userId: string) => ["user-checkins", userId] as const,
    canCheckin: (userId: string) => ["can-checkin-today", userId] as const,
    leaderboard: (type?: string) => ["leaderboard", type] as const,
  },

  admin: {
    all: ["admin"] as const,
    stats: () => ["admin-stats"] as const,
    users: (filters?: Record<string, unknown>) => ["admin-users", filters] as const,
    tracks: (filters?: Record<string, unknown>) => ["admin-tracks", filters] as const,
    moderationReports: (filters?: Record<string, unknown>) => ["admin-moderation-reports", filters] as const,
    generationStats: () => ["admin-generation-stats"] as const,
    alertHistory: () => ["admin-alert-history"] as const,
    featureFlags: () => ["feature-flags"] as const,
    botConfig: () => ["bot-config"] as const,
  },

  deeplinks: {
    all: ["deeplinks"] as const,
    stats: (linkId: string) => ["deeplink-stats", linkId] as const,
    deliveryTracking: (taskId: string) => ["delivery-tracking", taskId] as const,
  },

  referrals: {
    all: ["referrals"] as const,
    rank: (userId: string) => ["referral-rank", userId] as const,
    leaderboard: () => ["referral-leaderboard"] as const,
  },

  analytics: {
    all: ["analytics"] as const,
    performance: () => ["performance-metrics"] as const,
    systemHealth: () => ["system-health"] as const,
    funnelAnalytics: (funnel: string) => ["funnel-analytics", funnel] as const,
    retentionCohorts: (filters?: Record<string, unknown>) => ["retention-cohorts", filters] as const,
  },
} as const;
