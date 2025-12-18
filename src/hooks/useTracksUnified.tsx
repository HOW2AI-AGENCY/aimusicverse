/**
 * @deprecated Use useTracks from '@/hooks/useTracks' instead.
 * This hook attempted to unify track hooks but the main useTracks hook now handles all cases.
 * Will be removed in next major release.
 * 
 * Migration example:
 * ```tsx
 * // Before
 * import { useTracksUnified } from '@/hooks/useTracksUnified';
 * const { tracks } = useTracksUnified({ paginate: true });
 * 
 * // After  
 * import { useTracks } from '@/hooks/useTracks';
 * const { tracks } = useTracks({ paginate: true });
 * ```
 */

export { useTracks as useTracksUnified, type UseTracksParams as UseTracksUnifiedParams } from './useTracks';
export type { Track } from '@/types/track';
