import { z } from "zod";

export const PlaybackQueueSchema = z.object({
  version: z.literal(1),
  queue: z.array(z.string().uuid()).max(100),
  currentIndex: z.number().int().min(-1),
  timestamp: z.number().int().positive(),
});

export const RecentlyPlayedSchema = z.object({
  tracks: z
    .array(
      z.object({
        trackId: z.string().uuid(),
        playedAt: z.number().int().positive(),
        title: z.string().min(1),
        coverUrl: z.string().url().optional(),
      }),
    )
    .max(6),
  lastUpdated: z.number().int().positive(),
});

export const UserPreferencesSchema = z.object({
  hintsDismissed: z.object({
    moreMenuHint: z.boolean().default(false),
    gestureHint: z.boolean().default(false),
  }),
  gesturesEnabled: z.object({
    doubleTapSeek: z.boolean().default(true),
    horizontalSwipe: z.boolean().default(true),
    hintOverlay: z.boolean().default(true),
  }),
  notificationPermission: z.enum(["default", "granted", "denied"]).default("default"),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  version: z.literal(1),
  lastUpdated: z.number().int().positive(),
});
