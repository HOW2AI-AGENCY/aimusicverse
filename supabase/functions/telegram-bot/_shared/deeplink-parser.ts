/**
 * Deep Link Parser — pure utility for parsing Telegram Mini App deep link parameters.
 * Extracted from handlers/deep-links.ts.
 */

// Deep link type definitions
export type DeepLinkType =
  | "track"
  | "project"
  | "artist"
  | "playlist"
  | "album"
  | "blog"
  | "generate"
  | "quick"
  | "studio"
  | "remix"
  | "mashup"
  | "lyrics"
  | "stats"
  | "share"
  | "profile"
  | "user"
  | "invite"
  | "ref"
  | "reference"
  | "buy"
  | "credits"
  | "subscribe"
  | "subscription"
  | "pricing"
  | "tariffs"
  | "shop"
  | "leaderboard"
  | "achievements"
  | "analyze"
  | "recognize"
  | "onboarding"
  | "help"
  | "settings"
  | "feedback"
  | "library"
  | "projects_list"
  | "artists_list"
  | "cloud"
  | "templates"
  | "creative"
  | "musiclab"
  | "drums"
  | "dj"
  | "guitar"
  | "melody"
  | "content_hub"
  | "analytics"
  | "rewards"
  | "community"
  | "playlists_list"
  | "tutorials"
  | "guide"
  | "faq"
  | "getting_started"
  | "tips";

/**
 * Parse deep link parameter into type and value
 */
export function parseDeepLink(startParam: string): { type: DeepLinkType | null; value: string } {
  const patterns: [RegExp, DeepLinkType][] = [
    [/^track_(.+)$/, "track"],
    [/^project_(.+)$/, "project"],
    [/^artist_(.+)$/, "artist"],
    [/^playlist_(.+)$/, "playlist"],
    [/^album_(.+)$/, "album"],
    [/^blog_(.+)$/, "blog"],
    [/^generate_(.+)$/, "generate"],
    [/^quick_(.+)$/, "quick"],
    [/^studio_(.+)$/, "studio"],
    [/^remix_(.+)$/, "remix"],
    [/^mashup_(.+)$/, "mashup"],
    [/^lyrics_(.+)$/, "lyrics"],
    [/^stats_(.+)$/, "stats"],
    [/^profile_(.+)$/, "profile"],
    [/^user_(.+)$/, "user"],
    [/^invite_(.+)$/, "invite"],
    [/^ref_(.+)$/, "ref"],
    [/^reference_(.+)$/, "reference"],
  ];

  // Simple matches without value
  const simpleMatches: Record<string, DeepLinkType> = {
    buy: "buy",
    credits: "credits",
    subscribe: "subscribe",
    subscription: "subscription",
    pricing: "pricing",
    tariffs: "tariffs",
    shop: "shop",
    leaderboard: "leaderboard",
    achievements: "achievements",
    analyze: "analyze",
    recognize: "recognize",
    shazam: "recognize",
    onboarding: "onboarding",
    help: "help",
    settings: "settings",
    feedback: "feedback",
    library: "library",
    projects: "projects_list",
    artists: "artists_list",
    playlists: "playlists_list",
    creative: "creative",
    musiclab: "musiclab",
    drums: "drums",
    dj: "dj",
    guitar: "guitar",
    melody: "melody",
    "content-hub": "content_hub",
    cloud: "cloud",
    templates: "templates",
    analytics: "analytics",
    rewards: "rewards",
    community: "community",
    profile: "profile",
    // Tutorials and guides
    tutorials: "tutorials",
    guide: "guide",
    faq: "faq",
    "getting-started": "getting_started",
    "start-guide": "getting_started",
    tips: "tips",
    blog: "blog",
  };

  // Check simple matches first
  if (simpleMatches[startParam]) {
    return { type: simpleMatches[startParam], value: "" };
  }

  // Check pattern matches
  for (const [pattern, type] of patterns) {
    const match = startParam.match(pattern);
    if (match) {
      return { type, value: match[1] };
    }
  }

  return { type: null, value: startParam };
}
