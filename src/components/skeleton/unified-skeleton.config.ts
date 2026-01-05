/**
 * Unified Skeleton Configuration
 *
 * Animation and style configurations for the UnifiedSkeleton component family
 */

export const SKELETON_CONFIG = {
  animations: {
    shimmer: {
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    },
    pulse: {
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    },
  },

  speeds: {
    slow: '3s',
    normal: '1.5s',
    fast: '0.8s',
  },

  lineHeights: {
    sm: '1rem', // 16px
    md: '1.25rem', // 20px
    lg: '1.5rem', // 24px
  },

  aspectRatios: {
    '1:1': '1 / 1',
    '16:9': '16 / 9',
    '4:3': '4 / 3',
  },

  shapes: {
    square: '0%',
    circle: '50%',
    rounded: '8px',
  },

  defaults: {
    lines: 3, // Default number of lines for text skeleton
    lastLineWidth: 60, // Default last line width as percentage
    count: 5, // Default count for list skeleton
  },
} as const;

/**
 * Skeleton variant presets
 */
export const SKELETON_PRESETS = {
  trackCard: {
    variant: 'card' as const,
    showCover: true,
    coverShape: 'square' as const,
    lines: 3,
    aspectRatio: '1:1' as const,
  },

  playlistCard: {
    variant: 'card' as const,
    showCover: true,
    coverShape: 'square' as const,
    lines: 2,
    aspectRatio: '16:9' as const,
  },

  userProfile: {
    variant: 'card' as const,
    showCover: true,
    coverShape: 'circle' as const,
    lines: 3,
    aspectRatio: '1:1' as const,
  },

  trackList: {
    variant: 'list' as const,
    count: 10,
    layout: 'vertical' as const,
    showAvatar: false,
    linesPerItem: 2,
  },

  searchResult: {
    variant: 'list' as const,
    count: 5,
    layout: 'horizontal' as const,
    showAvatar: true,
    linesPerItem: 2,
  },

  textBlock: {
    variant: 'text' as const,
    lines: 5,
    lineHeight: 'md' as const,
    lastLineWidth: 60,
  },

  coverArt: {
    variant: 'image' as const,
    width: '100%',
    height: 200,
    shape: 'rounded' as const,
  },
} as const;
