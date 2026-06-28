interface RecentlyPlayedTrack {
  trackId: string;
  playedAt: number;
  title: string;
  coverUrl?: string;
}

interface RecentlyPlayed {
  tracks: RecentlyPlayedTrack[];
  lastUpdated: number;
}

const STORAGE_KEY = "musicverse-recent";
const MAX_TRACKS = 6;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function loadRecentlyPlayed(): RecentlyPlayedTrack[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data: RecentlyPlayed = JSON.parse(raw);
    const now = Date.now();
    return data.tracks.filter((t) => now - t.playedAt < MAX_AGE_MS);
  } catch {
    return [];
  }
}

export function addRecentlyPlayed(track: Omit<RecentlyPlayedTrack, "playedAt">): void {
  try {
    const recent = loadRecentlyPlayed();
    const filtered = recent.filter((t) => t.trackId !== track.trackId);
    filtered.unshift({ ...track, playedAt: Date.now() });
    const trimmed = filtered.slice(0, MAX_TRACKS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tracks: trimmed, lastUpdated: Date.now() }));
  } catch {
    // unavailable
  }
}

export function clearRecentlyPlayed(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // unavailable
  }
}
