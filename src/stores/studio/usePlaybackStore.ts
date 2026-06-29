/**
 * Studio Playback Store
 *
 * Re-exports the canonical playback store to eliminate duplication.
 * The canonical implementation lives in stores/slices/playbackSlice.ts,
 * exposed via stores/usePlaybackStore.ts.
 */

export { usePlaybackStore } from "@/stores/usePlaybackStore";
